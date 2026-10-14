// Outils communs de recette pour le relais : stockage KV factice, API Anthropic simulée.
// Aucun appel réel : toute requête vers api.anthropic.com est interceptée et simulée.
import relais from "../../relais/worker.js";

export { relais };
export const ORIGINE = "https://simo-b.github.io";
export const URL_API = "https://api.anthropic.com/v1/messages";
export const DESCRIPTION = "Enseigne de mode, 2 M de membres, 60 % d'inactifs, CRM Salesforce. Objectif : réactiver sans brader la marge.";

// KV factice. latenceMs simule le temps réseau de Cloudflare KV (lecture/écriture non atomiques).
export class KVFactice {
  constructor({ latenceMs = 0, erreurEcriture = null } = {}) {
    this.valeurs = new Map();
    this.ecritures = [];
    this.latenceMs = latenceMs;
    this.erreurEcriture = erreurEcriture;
  }
  async attendre() { if (this.latenceMs) await new Promise((ok) => setTimeout(ok, this.latenceMs)); }
  async get(cle) { await this.attendre(); return this.valeurs.has(cle) ? this.valeurs.get(cle) : null; }
  async put(cle, valeur, options) {
    await this.attendre();
    if (this.erreurEcriture) throw this.erreurEcriture;
    this.valeurs.set(cle, valeur);
    this.ecritures.push({ cle, valeur, options });
  }
}

export function envComplet(surcharges = {}) {
  return { ANTHROPIC_API_KEY: "cle-factice", SEL_IP: "sel-de-test", ALLOWED_ORIGINS: ORIGINE, COMPTEURS: new KVFactice(), ...surcharges };
}

export function requete({ methode = "POST", origine = ORIGINE, chemin = "/cadrage", corps, ip = "203.0.113.7", enTetes = {} } = {}) {
  const h = { "Content-Type": "application/json", "CF-Connecting-IP": ip, ...enTetes };
  if (origine) h.Origin = origine;
  const init = { method: methode, headers: h };
  if (methode === "POST") init.body = corps === undefined ? JSON.stringify({ description: DESCRIPTION }) : corps;
  return new Request(`https://mini-cadrage.exemple.workers.dev${chemin}`, init);
}

export const SORTIE_OK = {
  hors_sujet: false,
  enjeu: "1,2 M d'inactifs (60 % de 2 M) à réactiver sans sacrifier la marge.",
  cas_recommande: "Score de réactivabilité et campagne win-back mesurée contre un groupe témoin.",
  autres_pistes: "Détection précoce du churn ; contenus win-back générés dans la charte.",
  mvp_4_semaines: "S1 données et règles ; S2 score ; S3 campagne test ; S4 lancement et bilan.",
  a_confirmer: "Définition d'inactif, part d'opt-in valides, panier moyen."
};

export function reponseModele(sortie, stopReason = "end_turn") {
  return {
    id: "msg_test", type: "message", role: "assistant", model: "claude-haiku-5-5",
    stop_reason: stopReason,
    content: [{ type: "thinking", thinking: "", signature: "x" }, { type: "text", text: typeof sortie === "string" ? sortie : JSON.stringify(sortie) }],
    usage: { input_tokens: 900, output_tokens: 180 }
  };
}

// Remplace fetch : les appels à l'API sont simulés, les autres refusés (aucune sortie réseau).
export function simulerApi() {
  const etat = {
    appels: [],
    journaux: [],
    reponse: () => new Response(JSON.stringify(reponseModele(SORTIE_OK)), { status: 200 }),
    appelsApi() { return this.appels.filter((a) => a.url === URL_API); }
  };
  const fetchOriginal = globalThis.fetch;
  const logOriginal = console.log;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    etat.appels.push({ url: u, init });
    if (u === URL_API || u.includes("challenges.cloudflare.com")) return etat.reponse(u, init);
    throw new Error("Appel réseau non simulé interdit pendant la recette : " + u);
  };
  console.log = (...args) => etat.journaux.push(args.join(" "));
  etat.restaurer = () => { globalThis.fetch = fetchOriginal; console.log = logOriginal; };
  return etat;
}

// Adapte une requête interceptée par Playwright en appel direct au relais (intégration page <-> relais).
export async function relayerDepuisPlaywright(route, env) {
  const req = route.request();
  const enTetes = await req.allHeaders();
  const init = { method: req.method(), headers: { ...enTetes, "CF-Connecting-IP": enTetes["x-ip-test"] || "203.0.113.50" } };
  if (req.method() === "POST") init.body = req.postData() || "";
  const reponse = await relais.fetch(new Request(req.url(), init), env);
  const enTetesReponse = {};
  reponse.headers.forEach((v, k) => { enTetesReponse[k] = v; });
  await route.fulfill({ status: reponse.status, headers: enTetesReponse, body: reponse.body ? await reponse.text() : "" });
  return { statut: reponse.status, origine: enTetes.origin };
}
