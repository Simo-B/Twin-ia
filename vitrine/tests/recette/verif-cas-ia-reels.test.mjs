// Vérifie le script cas-ia-reels.mjs SANS le vrai modèle : il est lancé contre un relais local
// (le vrai worker.js) dont l'API Anthropic est simulée. Deux scénarios : modèle conforme → GO,
// modèle défaillant (prix, donnée personnelle répétée, hors sujet raté) → NO-GO détecté.
// Lancer : cd vitrine && node --test tests/recette/verif-cas-ia-reels.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { relais, envComplet, simulerApi, reponseModele, SORTIE_OK } from "./outils-relais.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "cas-ia-reels.mjs");
const ORIGINE = "https://simo-b.github.io";
const GENERIQUE = {
  hors_sujet: false,
  enjeu: "Une part des membres décroche ; chaque réactivation compte, sans brader la marge.",
  cas_recommande: "Score de réactivation et offres personnalisées par segment, mesurés contre un groupe témoin.",
  autres_pistes: "Tri des demandes du service client avec réponses suggérées ; analyse des verbatims.",
  mvp_4_semaines: "S1 données et règles ; S2 score ; S3 test avec groupe témoin ; S4 bilan et décision.",
  a_confirmer: "Définition d'inactif, part de membres joignables, cadre RGPD et consentement."
};
const HORS_SUJET = { hors_sujet: true, enjeu: "", cas_recommande: "", autres_pistes: "", mvp_4_semaines: "", a_confirmer: "" };

let api;
let serveur;
let base;
let scenario = "conforme";
let env;

function sortieSimulee(texte) {
  if (/tarte|Python|PWNED/.test(texte)) return scenario === "defaillant" && /tarte/.test(texte) ? GENERIQUE : HORS_SUJET;
  if (scenario === "defaillant" && /TJM/.test(texte)) return { ...GENERIQUE, enjeu: "Mission estimée à 12 000 € HT, démarrage dès lundi avec Simo." };
  if (scenario === "defaillant" && /Jeanne/.test(texte)) return { ...GENERIQUE, a_confirmer: "Jeanne Fictive doit confirmer la part de membres joignables." };
  if (/2 M de membres, 60 %/.test(texte)) return SORTIE_OK;
  return GENERIQUE;
}

before(async () => {
  api = simulerApi();
  api.reponse = (url, init) => new Response(JSON.stringify(reponseModele(sortieSimulee(JSON.parse(init.body).messages[0].content))), { status: 200 });
  serveur = http.createServer(async (req, res) => {
    const morceaux = [];
    for await (const m of req) morceaux.push(m);
    const enTetes = { ...req.headers, "cf-connecting-ip": "127.0.0.1" };
    const init = { method: req.method, headers: enTetes };
    if (req.method === "POST") init.body = Buffer.concat(morceaux).toString("utf8");
    const r = await relais.fetch(new Request(`${base}${req.url}`, init), env);
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
    res.writeHead(r.status, h);
    res.end(await r.text());
  });
  await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
  base = `http://127.0.0.1:${serveur.address().port}`;
});

after(async () => {
  api.restaurer();
  await new Promise((ok) => serveur.close(ok));
});

function lancer(variables) {
  return new Promise((ok) => {
    const enfant = spawn(process.execPath, [SCRIPT], { env: { PATH: process.env.PATH, ...variables } });
    let sortie = "";
    enfant.stdout.on("data", (d) => { sortie += d; });
    enfant.stderr.on("data", (d) => { sortie += d; });
    enfant.on("close", (code) => ok({ code, sortie }));
  });
}

const dossier = mkdtempSync(path.join(tmpdir(), "recette-ia-"));

test("garde-fous : sans configuration, vers l'API Anthropic, ou sans CONFIRMER=oui → arrêt avant tout envoi", async (t) => {
  const a = await lancer({});
  const b = await lancer({ RELAIS_URL: "https://api.anthropic.com/v1/messages", ORIGINE });
  const c = await lancer({ RELAIS_URL: "https://mini-cadrage.exemple.workers.dev/cadrage", ORIGINE });
  assert.deepEqual([a.code, b.code, c.code], [2, 2, 2]);
  assert.match(b.sortie, /jamais l'API Anthropic directement/);
  assert.match(c.sortie, /coût estimé .* \$/);
  t.diagnostic("obtenu : " + [a, b, c].map((x) => x.sortie.trim().split("\n")[0]).join(" | "));
});

test("scénario modèle conforme : 19 cas exécutés, aucun KO, GO automatique (code 0)", async (t) => {
  scenario = "conforme";
  env = envComplet({ ALLOWED_ORIGINS: ORIGINE, PLAFOND_JOUR_IP: "1000" });
  const sortie = path.join(dossier, "conforme.json");
  const r = await lancer({ RELAIS_URL: `${base}/cadrage`, ORIGINE, REPETITIONS: "1", PAUSE_MS: "0", SORTIE: sortie });
  const rapport = JSON.parse(readFileSync(sortie, "utf8"));
  const ko = rapport.resultats.filter((x) => x.verdict === "KO").map((x) => x.id);
  t.diagnostic(`obtenu : code ${r.code}, ${rapport.resultats.length} cas, KO ${JSON.stringify(ko)}, indicateurs ${JSON.stringify(rapport.indicateurs)}`);
  assert.equal(r.code, 0, r.sortie);
  assert.equal(rapport.resultats.length, 19);
  assert.deepEqual(ko, []);
});

test("scénario modèle défaillant : prix, nom répété et hors sujet raté détectés → NO-GO (code 1)", async (t) => {
  scenario = "defaillant";
  env = envComplet({ ALLOWED_ORIGINS: ORIGINE, PLAFOND_JOUR_IP: "1000" });
  const sortie = path.join(dossier, "defaillant.json");
  const r = await lancer({ RELAIS_URL: `${base}/cadrage`, ORIGINE, REPETITIONS: "1", PAUSE_MS: "0", SORTIE: sortie });
  const rapport = JSON.parse(readFileSync(sortie, "utf8"));
  const ko = Object.fromEntries(rapport.resultats.filter((x) => x.verdict === "KO").map((x) => [x.id, x.essais[0].constats.map((c) => c.raison).join(" ; ")]));
  t.diagnostic(`obtenu : code ${r.code}, KO ${JSON.stringify(ko)}`);
  assert.equal(r.code, 1);
  assert.deepEqual(Object.keys(ko).sort(), ["IA05", "IA12", "IA14"]);
});

test("quota du relais atteint pendant la recette → arrêt propre avec la consigne à suivre (code 2)", async (t) => {
  scenario = "conforme";
  env = envComplet({ ALLOWED_ORIGINS: ORIGINE, PLAFOND_JOUR_IP: "3" });
  const r = await lancer({ RELAIS_URL: `${base}/cadrage`, ORIGINE, REPETITIONS: "1", PAUSE_MS: "0", SORTIE: path.join(dossier, "quota.json") });
  assert.equal(r.code, 2);
  assert.match(r.sortie, /Quota atteint \(limite_visiteur\)/);
  t.diagnostic("obtenu : " + r.sortie.trim().split("\n").at(-1));
});
