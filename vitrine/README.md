# Vitrine « Mini-cadrage IA »

Page vitrine de Simo : un visiteur décrit son programme fidélité et reçoit un mini-cadrage IA en 5 lignes. Elle porte la mention « Réponse générée par IA » et un bouton de contact (email, puis Cal.com quand le lien sera fourni).

Ce dossier est la **source de travail**. La version publiée (mode secours) est copiée dans le dépôt public `Simo-B/simo-vitrine` : https://simo-b.github.io/simo-vitrine/ (feu vert de Simo le 14/10). Le relais et les tests restent ici.

| Fichier | Rôle |
|---|---|
| `index.html` | La page, en un seul fichier, sans dépendance externe. Ses réglages sont en haut du script : `RELAIS_URL`, `LIEN_CALCOM` et l'email de contact. |
| `relais/worker.js` | Le relais Cloudflare : il garde la clé API, applique les limites anti-abus et appelle Claude Haiku. |
| `relais/GUIDE-ACTIVATION.md` | Les étapes d'activation, chacune soumise au feu vert de Simo. |
| `tests/` | Les tests automatiques (`npm test`) et les captures d'aperçu (`node tests/apercu.mjs`). |
| `apercu/` | Les captures d'écran de la page. |

## Modes
- **Mode secours** (actuel, `RELAIS_URL` vide) : 5 mini-cadrages préparés à l'avance par IA et relus par Simo, signalés comme tels. Rien ne quitte le navigateur.
- **IA en direct** : la page appelle le relais, qui appelle Claude Haiku 5.5. En cas de limite atteinte ou de panne, la page bascule automatiquement sur le mode secours.

## Aperçu local
```
cd vitrine && python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
