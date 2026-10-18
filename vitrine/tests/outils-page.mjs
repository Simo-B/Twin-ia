// Outils communs aux tests de la page : petit serveur local et chargement de Playwright.
import http from "node:http";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ici = path.dirname(fileURLToPath(import.meta.url));
export const PAGE = readFileSync(path.join(ici, "..", "index.html"), "utf8");
export const RELAIS_TEST = "https://mini-cadrage.test.workers.dev/cadrage";

export function chargerPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    const racine = execSync("npm root -g").toString().trim();
    return require(require.resolve("playwright", { paths: [racine] }));
  }
}

// Lien de contact de la page : le Calendly de Simo (fourni le 18/10).
export const LIEN_CONTACT = "https://calendly.com/mb-simo/call-15-min";

// Variantes de la page : adresse du relais remplacée comme le fera le twin à l'activation de l'IA en direct.
export function variante({ relais = "" } = {}) {
  return PAGE.replace('RELAIS_URL: ""', `RELAIS_URL: ${JSON.stringify(relais)}`);
}

export async function demarrerServeur(pages) {
  const serveur = http.createServer((req, res) => {
    const chemin = new URL(req.url, "http://localhost").pathname;
    const html = pages[chemin];
    if (html === undefined) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
  const { port } = serveur.address();
  return { base: `http://127.0.0.1:${port}`, fermer: () => new Promise((ok) => serveur.close(ok)) };
}

export const SORTIE_IA = {
  enjeu: "1,2 M d'inactifs (60 % de 2 M) à réactiver sans sacrifier la marge.",
  cas_recommande: "Score de réactivabilité et campagne win-back mesurée contre un groupe témoin.",
  autres_pistes: "Détection précoce du churn ; contenus win-back générés dans la charte.",
  mvp_4_semaines: "S1 données et règles ; S2 score ; S3 campagne test ; S4 lancement et bilan.",
  a_confirmer: "Définition d'inactif, part d'opt-in valides, panier moyen."
};
