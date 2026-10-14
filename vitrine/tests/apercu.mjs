// Génère les captures d'aperçu dans vitrine/apercu/ (node tests/apercu.mjs).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chargerPlaywright, demarrerServeur, variante, RELAIS_TEST, SORTIE_IA } from "./outils-page.mjs";

const dossier = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "apercu");
mkdirSync(dossier, { recursive: true });
const { chromium } = chargerPlaywright();
const serveur = await demarrerServeur({ "/": variante(), "/relais.html": variante({ relais: RELAIS_TEST }) });
const navigateur = await chromium.launch();

async function capture(nom, chemin, options, action) {
  const contexte = await navigateur.newContext(options);
  const page = await contexte.newPage();
  await page.route(RELAIS_TEST, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mode: "ia", cadrage: SORTIE_IA }) }));
  await page.goto(serveur.base + chemin);
  if (action) await action(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dossier, nom), fullPage: true });
  await contexte.close();
}

const exemple = async (page) => {
  await page.click("#btn-exemple");
  await page.click("#btn-envoyer");
  await page.waitForSelector("#resultat:not([hidden])");
};
const ordinateur = { viewport: { width: 1280, height: 900 } };
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

await capture("1-ordinateur-accueil.png", "/", ordinateur);
await capture("2-ordinateur-mode-secours.png", "/", ordinateur, exemple);
await capture("3-mobile-mode-secours.png", "/", mobile, exemple);
await capture("4-ordinateur-ia-en-direct-SIMULATION.png", "/relais.html", ordinateur, exemple);
await capture("5-mobile-sombre-mode-secours.png", "/", { ...mobile, colorScheme: "dark" }, exemple);

await navigateur.close();
await serveur.fermer();
console.log("Captures enregistrées dans", dossier);
