// Tests automatiques de la page dans un vrai navigateur (Chromium). Le relais est simulé.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chargerPlaywright, demarrerServeur, variante, RELAIS_TEST, SORTIE_IA, PAGE } from "./outils-page.mjs";

const { chromium } = chargerPlaywright();
let navigateur;
let serveur;

before(async () => {
  serveur = await demarrerServeur({
    "/": variante(),
    "/relais.html": variante({ relais: RELAIS_TEST }),
    "/contact.html": variante({ contact: "https://cal.com/exemple/15min" }),
    "/relais-interdit.html": variante({ relais: "https://autre-domaine.example.com/cadrage" })
  });
  navigateur = await chromium.launch();
});

after(async () => {
  await navigateur?.close();
  await serveur?.fermer();
});

async function ouvrir(chemin = "/", options = {}) {
  const contexte = await navigateur.newContext(options);
  const page = await contexte.newPage();
  const erreurs = [];
  const requetesSortantes = [];
  page.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  page.on("pageerror", (e) => erreurs.push(String(e)));
  page.on("request", (r) => { if (!r.url().startsWith(serveur.base)) requetesSortantes.push(r.url()); });
  await page.goto(serveur.base + chemin);
  return { page, contexte, erreurs, requetesSortantes };
}

async function envoyer(page, texte) {
  await page.fill("#description", texte);
  await page.click("#btn-envoyer");
}

const lignes = (page) => page.$$eval("#lignes li", (lis) => lis.map((li) => li.textContent));

test("chargement : titre, mention IA, bouton de contact inactif tant que le lien manque, aucune erreur", async () => {
  const { page, contexte, erreurs } = await ouvrir();
  assert.equal(await page.textContent("h1"), "Votre programme fidélité, vu par l'IA, en 5\u00a0lignes.");
  assert.match(await page.textContent(".mention-ia"), /Réponse générée par IA\. Vous échangez avec une IA, pas avec Simo\./);
  assert.ok((await page.textContent("#btn-contact")).startsWith("Échanger 15 min avec Simo"));
  assert.equal(await page.getAttribute("#btn-contact", "href"), null);
  assert.equal(await page.getAttribute("#btn-contact", "aria-disabled"), "true");
  assert.equal(await page.isVisible("#contact-attente"), true);
  assert.equal(await page.title(), "Mini-cadrage IA fidélité · Simo B.");
  assert.equal(await page.isVisible("#resultat"), false);
  assert.deepEqual(erreurs, []);
  await contexte.close();
});

test("texte trop court : message d'aide, pas de résultat", async () => {
  const { page, contexte } = await ouvrir();
  await envoyer(page, "fidélité");
  assert.match(await page.textContent("#message-erreur"), /Ajoutez quelques détails/);
  assert.equal(await page.isVisible("#resultat"), false);
  await contexte.close();
});

test("mode secours : l'exemple donne le cadrage « inactifs », signalé comme secours", async () => {
  const { page, contexte, requetesSortantes } = await ouvrir();
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.textContent("#etiquette"), "Brouillon généré automatiquement à partir de votre texte");
  assert.equal(await page.textContent("#titre-resultat"), "Situation type : Beaucoup de membres inactifs");
  assert.match(await page.textContent("#explication"), /pas encore activée/);
  const l = await lignes(page);
  assert.equal(l.length, 5);
  assert.deepEqual(l.map((t) => t.split("\u00a0: ")[0]), ["Enjeu", "Cas recommandé", "Autres pistes", "MVP en 4 semaines", "À confirmer"]);
  assert.deepEqual(requetesSortantes, [], "rien ne doit quitter le navigateur en mode secours");
  await contexte.close();
});

test("mode secours : aiguillage par mots-clés vers la bonne situation", async () => {
  const cas = [
    ["Notre SAV reçoit trop de tickets et réclamations sur les points fidélité, les conseillers saturent.", "Service client débordé"],
    ["Nous avons beaucoup de doublons dans notre référentiel client entre magasin et web.", "Données clients dispersées ou en doublon"],
    ["Les remises du programme coûtent cher et on ne mesure pas la rentabilité des coupons.", "Remises coûteuses, rentabilité incertaine"],
    ["Nos emails fidélité ont un taux d'ouverture en baisse, la newsletter n'engage plus.", "Engagement en baisse, messages peu lus"]
  ];
  const { page, contexte } = await ouvrir();
  for (const [texte, attendu] of cas) {
    await envoyer(page, texte);
    await page.waitForSelector("#resultat:not([hidden])");
    assert.equal(await page.textContent("#titre-resultat"), "Situation type : " + attendu, texte);
  }
  await contexte.close();
});

test("mode secours : sans mot-clé reconnu, le visiteur choisit parmi 5 situations", async () => {
  const { page, contexte } = await ouvrir();
  await envoyer(page, "Nous vendons des chaussures en ligne depuis dix ans, partout en France.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.match(await page.textContent("#explication"), /Je n'ai pas reconnu de situation type/);
  assert.equal((await lignes(page)).length, 0);
  assert.equal(await page.locator(".puce").count(), 5);
  await page.click(".puce >> text=Service client débordé");
  assert.equal(await page.textContent("#titre-resultat"), "Situation type : Service client débordé");
  assert.equal((await lignes(page)).length, 5);
  await contexte.close();
});

test("IA en direct (simulée) : étiquette « Réponse générée par IA » et 5 lignes", async () => {
  const { page, contexte } = await ouvrir("/relais.html");
  let corpsEnvoye = null;
  await page.route(RELAIS_TEST, async (route) => {
    corpsEnvoye = JSON.parse(route.request().postData());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mode: "ia", cadrage: SORTIE_IA }) });
  });
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.textContent("#etiquette"), "Réponse générée par IA");
  assert.equal((await lignes(page)).length, 5);
  assert.equal(await page.isVisible("#situations"), false);
  assert.match(await page.textContent("#note"), /non relu par Simo/);
  assert.deepEqual(Object.keys(corpsEnvoye), ["description"]);
  await contexte.close();
});

test("IA en direct : hors sujet affiché comme tel", async () => {
  const { page, contexte } = await ouvrir("/relais.html");
  await page.route(RELAIS_TEST, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mode: "hors_sujet" }) }));
  await envoyer(page, "Donne-moi une recette de gâteau au chocolat pour ce soir, merci beaucoup.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.textContent("#titre-resultat"), "Hors sujet");
  assert.match(await page.textContent("#explication"), /uniquement sur les programmes fidélité/);
  await contexte.close();
});

test("IA en direct : limite atteinte ou panne réseau → mini-cadrage de secours", async () => {
  const { page, contexte } = await ouvrir("/relais.html");
  await page.route(RELAIS_TEST, (route) => route.fulfill({ status: 429, contentType: "application/json", body: '{"erreur":"limite_jour"}' }));
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.textContent("#etiquette"), "Brouillon généré automatiquement à partir de votre texte");
  assert.match(await page.textContent("#explication"), /momentanément indisponible/);
  await page.unroute(RELAIS_TEST);
  await page.route(RELAIS_TEST, (route) => route.abort("failed"));
  await page.click("#btn-envoyer");
  await page.waitForFunction(() => document.querySelector("#btn-envoyer").disabled === false);
  assert.match(await page.textContent("#explication"), /momentanément indisponible/);
  await contexte.close();
});

test("IA en direct : du code glissé dans la réponse s'affiche en texte, sans s'exécuter", async () => {
  const { page, contexte } = await ouvrir("/relais.html");
  const piege = { ...SORTIE_IA, enjeu: '<img src=x onerror="window.__pirate=1">Enjeu piégé' };
  await page.route(RELAIS_TEST, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mode: "ia", cadrage: piege }) }));
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.locator("#lignes img").count(), 0);
  assert.match((await lignes(page))[0], /<img src=x/);
  assert.equal(await page.evaluate(() => window.__pirate), undefined);
  await contexte.close();
});

test("double clic : une seule demande envoyée", async () => {
  const { page, contexte } = await ouvrir("/relais.html");
  let compte = 0;
  await page.route(RELAIS_TEST, async (route) => {
    compte += 1;
    await new Promise((ok) => setTimeout(ok, 300));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mode: "ia", cadrage: SORTIE_IA }) });
  });
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.click("#btn-envoyer", { force: true, timeout: 1000 }).catch(() => {});
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(compte, 1);
  await contexte.close();
});

test("sécurité : un relais hors domaine autorisé est bloqué par la page (CSP) → secours", async () => {
  const { page, contexte, erreurs } = await ouvrir("/relais-interdit.html");
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.match(await page.textContent("#explication"), /momentanément indisponible/);
  assert.ok(erreurs.some((e) => /Content Security Policy/i.test(e)), "la CSP doit être la cause du blocage");
  await contexte.close();
});

test("mobile (375 px) : pas de défilement horizontal, résultat lisible", async () => {
  const { page, contexte } = await ouvrir("/", { viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(debord <= 0, `débordement horizontal de ${debord} px`);
  await contexte.close();
});

test("lien de contact renseigné : bouton actif en nouvel onglet, même lien pour l'exercice des droits", async () => {
  const { page, contexte } = await ouvrir("/contact.html");
  assert.equal(await page.getAttribute("#btn-contact", "href"), "https://cal.com/exemple/15min");
  assert.equal(await page.getAttribute("#btn-contact", "target"), "_blank");
  assert.match(await page.getAttribute("#btn-contact", "rel"), /noopener/);
  assert.equal(await page.getAttribute("#btn-contact", "aria-disabled"), null);
  assert.equal(await page.textContent("#btn-contact"), "Échanger 15 min avec Simo (nouvel onglet)");
  assert.deepEqual(await page.$$eval("[data-lien-contact]", (liens) => liens.map((l) => [l.href, l.target])), [["https://cal.com/exemple/15min", "_blank"], ["https://cal.com/exemple/15min", "_blank"]]);
  assert.equal(await page.isVisible("#contact-attente"), false);
  await contexte.close();
});

test("page publique : signature « Simo B. », aucun email, aucune adresse, aucun téléphone", async () => {
  const { page, contexte } = await ouvrir();
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
  const texte = await page.evaluate(() => document.body.innerText);
  assert.equal(/Cloudflare|Anthropic/.test(texte), false);
  assert.ok(texte.includes("Éditeur : Simo B., consultant indépendant"));
  assert.ok(texte.includes("Hébergeur : GitHub, Inc."));
  assert.match(texte, /reste dans votre navigateur/);
  // Garde-fous génériques (règle 6 de CLAUDE.md), dans le texte affiché comme dans le code de la page.
  const motifs = [
    /[\w.+-]+@[\w-]+\.[\w.-]+/,
    /mailto:/i,
    /Simo (?!B\.)\p{Lu}/u,
    /\b\d{1,4}(?:\s?(?:bis|ter))?,?\s+(?:rue|avenue|boulevard|place|allée|impasse|chemin|quai|route)\b/i,
    /\b\d{5}\s+\p{Lu}/u,
    /tel:/i,
    /(?:\+33|\b0)\s?[1-9](?:[\s.-]?\d{2}){4}/
  ];
  for (const source of [texte, PAGE]) {
    for (const motif of motifs) assert.equal(motif.test(source), false, String(motif));
  }
  await contexte.close();
});

/* ===== Mode secours personnalisé : reprise des éléments du texte du visiteur ===== */
const reperes = (page) => page.textContent("#reperes");
const ligne = async (page, i) => (await lignes(page))[i];

test("secours personnalisé : secteur, base, % d'inactifs, outil et objectif repris dans les 5 lignes", async () => {
  const { page, contexte, requetesSortantes } = await ouvrir();
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  const r = await reperes(page);
  for (const attendu of ["Secteur : mode", "base : 2 M de membres", "inactifs : 60 %", "outil : Salesforce", "objectif : réactiver sans brader la marge"]) {
    assert.ok(r.includes(attendu), `repéré : ${attendu} dans « ${r} »`);
  }
  assert.match(await ligne(page, 0), /Secteur mode : 2 M de membres dont 60 % d'inactifs, soit environ 1,2 M de membres à réactiver\. Objectif annoncé : réactiver sans brader la marge\./);
  assert.match(await ligne(page, 1), /^Cas recommandé : Avec Salesforce, un score de réactivabilité/);
  assert.match(await ligne(page, 3), /S1 extraction des données de Salesforce, définition/);
  assert.doesNotMatch(await ligne(page, 4), /non précisé/);
  assert.match(await page.textContent("#note"), /généré automatiquement, non relu par Simo/);
  assert.deepEqual(requetesSortantes, [], "tout se passe dans le navigateur");
  await contexte.close();
});

test("secours personnalisé : éléments absents listés à confirmer, sans chiffre inventé", async () => {
  const { page, contexte } = await ouvrir();
  await envoyer(page, "Notre programme fidélité a beaucoup de membres inactifs depuis deux ans.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.match(await reperes(page), /Aucun élément précis repéré/);
  const enjeu = await ligne(page, 0);
  assert.match(enjeu, /une large part de vos membres n'achète plus/i);
  assert.doesNotMatch(enjeu, /\d/, "aucun chiffre ajouté");
  assert.match(await ligne(page, 4), /la taille de votre base, votre outil CRM et votre objectif principal \(non précisés dans votre texte\)/i);
  await contexte.close();
});

test("secours personnalisé : formats de taille de base reconnus et calcul des inactifs", async () => {
  const cas = [
    ["Programme fidélité de 800 000 porteurs de carte, beaucoup d'inactifs.", "base : 800 000 porteurs de carte"],
    ["Réseau de 300k clients, trop de remises sur le programme.", "base : 300 000 clients"],
    ["Programme de 1,2 million d'adhérents, emails peu ouverts.", "base : 1,2 M d'adhérents"],
    ["Programme 2M membres, 25 % d'inactifs.", "base : 2 M de membres"]
  ];
  const { page, contexte } = await ouvrir();
  for (const [texte, attendu] of cas) {
    await envoyer(page, texte);
    await page.waitForSelector("#resultat:not([hidden])");
    assert.ok((await reperes(page)).toLowerCase().includes(attendu.toLowerCase()), `${texte} → ${await reperes(page)}`);
  }
  assert.match(await ligne(page, 0), /2 M de membres dont 25 % d'inactifs, soit environ 500 000 membres à réactiver/);
  await contexte.close();
});

test("secours personnalisé : seul un % rattaché aux inactifs sert au calcul", async () => {
  const cas = [
    ["Le taux d'ouverture est de 15 % et la moitié des clients sont inactifs, 600 000 clients.", null],
    ["Programme de 500 000 membres : 15 %. Inactifs : 40 %.", "40"],
    ["40 % de nos 2 M de membres sont inactifs.", "40"],
    ["800 000 clients, 35 % des clients ne reviennent pas.", "35"]
  ];
  const { page, contexte } = await ouvrir();
  const obtenus = await page.evaluate((textes) => textes.map((t) => reperer(t).inactifs?.pct ?? null), cas.map((c) => c[0]));
  assert.deepEqual(obtenus, cas.map((c) => c[1]));
  await envoyer(page, cas[2][0]);
  await page.waitForSelector("#resultat:not([hidden])");
  assert.match((await ligne(page, 0)).replace(/[\u00a0\u202f]/g, " "), /2 M de membres dont 40 % d'inactifs, soit environ 800 000 membres à réactiver/);
  await contexte.close();
});

test("secours personnalisé : outils cités dans l'ordre du texte, sans faux nom propre", async () => {
  const { page, contexte } = await ouvrir();
  await envoyer(page, "Chaîne d'hôtels, 800 000 membres. Nous utilisons Splio et Zendesk. Le service client croule sous les tickets fidélité.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.ok((await reperes(page)).includes("outils : Splio, Zendesk"), await reperes(page));
  assert.match(await ligne(page, 1), /Avec Splio et Zendesk, un agent IA/);
  await envoyer(page, "Enseigne de sport présente sur Paris et Lyon, 50 000 clients sous les radars, beaucoup d'inactifs.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.doesNotMatch(await reperes(page), /outil/, "« sur Paris » ou « sous les » ne sont pas des outils");
  await contexte.close();
});

test("secours personnalisé : un objectif contenant coordonnées, montant ou devis n'est jamais repris", async () => {
  const { page, contexte } = await ouvrir();
  const pieges = [
    "Programme avec 40 % d'inactifs. Objectif : rappelez-moi au 06 00 00 00 00 pour réactiver.",
    "Programme avec 40 % d'inactifs. Objectif : écrire à contact@exemple.test pour réactiver.",
    "Programme avec 40 % d'inactifs. Objectif : obtenir un devis de 15 000 € signé par Simo.",
    "Programme avec 40 % d'inactifs. Objectif : visiter https://exemple.test/promo vite."
  ];
  for (const texte of pieges) {
    await envoyer(page, texte);
    await page.waitForSelector("#resultat:not([hidden])");
    const affiche = await page.textContent("#resultat");
    assert.doesNotMatch(affiche, /Objectif annoncé|06 00|exemple\.test|15 000|devis de|https?:/, texte);
  }
  await contexte.close();
});

test("secours personnalisé : du code dans le texte du visiteur est affiché comme du texte, sans s'exécuter", async () => {
  const { page, contexte } = await ouvrir();
  await envoyer(page, "Programme mode, 40 % d'inactifs. Objectif : <img src=x onerror=\"window.__pirate=1\"> réactiver <b>vite</b>.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.locator("#resultat img, #resultat b").count(), 0);
  assert.equal(await page.evaluate(() => window.__pirate), undefined);
  assert.match(await reperes(page), /objectif : réactiver vite/);
  await contexte.close();
});

test("secours personnalisé : une autre situation type garde les éléments repérés", async () => {
  const { page, contexte } = await ouvrir();
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
  await page.click(".puce >> text=Service client débordé");
  assert.equal(await page.textContent("#titre-resultat"), "Situation type : Service client débordé");
  assert.match(await ligne(page, 0), /^Enjeu : Secteur mode, 2 M de membres : le service client/);
  assert.match(await ligne(page, 1), /Avec Salesforce, un agent IA/);
  assert.match(await page.textContent("#explication"), /recalculé pour cette situation type/);
  await contexte.close();
});

test("secours personnalisé : sans situation reconnue, les éléments repérés sont montrés puis repris au clic", async () => {
  const { page, contexte } = await ouvrir();
  await envoyer(page, "Nous vendons des chaussures en ligne, 120 000 clients, CRM HubSpot.");
  await page.waitForSelector("#resultat:not([hidden])");
  assert.equal(await page.textContent("#titre-resultat"), "Choisissez une situation type");
  assert.match(await reperes(page), /Secteur : mode · base : 120 000 clients · outil : HubSpot/);
  await page.click(".puce >> text=Engagement en baisse, messages peu lus");
  assert.match(await ligne(page, 0), /Secteur mode, 120 000 clients : vos emails/);
  assert.match(await ligne(page, 1), /Avec HubSpot, une segmentation par IA/);
  await contexte.close();
});
