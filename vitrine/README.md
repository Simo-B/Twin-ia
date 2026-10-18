# Vitrine « Mini-cadrage IA »

Page vitrine de Simo : un visiteur décrit son programme fidélité et reçoit un mini-cadrage IA en 5 lignes. Elle porte la mention « Réponse générée par IA » et un bouton « Échanger 15 min avec Simo », qui ouvre le Calendly de Simo (https://calendly.com/mb-simo/call-15-min) dans un nouvel onglet. Signature publique : « Simo B. » (règle 6 de CLAUDE.md).

Ce dossier est la **source de travail**. La version publiée (mode secours) est copiée dans le dépôt public `Simo-B/Simo-vitrine` : https://simo-b.github.io/Simo-vitrine/ (feu vert de Simo le 14/10, en ligne depuis le 15/10). Le relais et les tests restent ici.

| Fichier | Rôle |
|---|---|
| `index.html` | La page, en un seul fichier, sans dépendance externe. Son réglage est en haut du script : `RELAIS_URL`. Le lien Calendly est écrit directement dans les deux liens « Échanger 15 min avec Simo » (bouton et exercice des droits). |
| `relais/worker.js` | Le relais Cloudflare : il garde la clé API, applique les limites anti-abus et appelle Claude Haiku. |
| `relais/GUIDE-ACTIVATION.md` | Les étapes d'activation, chacune soumise au feu vert de Simo. |
| `tests/` | Les tests automatiques (`npm test`) et les captures d'aperçu (`node tests/apercu.mjs`). |
| `apercu/` | Les captures d'écran de la page. |

## Modes
- **Mode secours** (actuel, `RELAIS_URL` vide) : brouillon généré automatiquement dans le navigateur. La page repère dans le texte du visiteur le secteur, la taille de base (avec le calcul des inactifs), les outils cités et l'objectif, puis les combine avec 5 situations types validées par Simo. Le brouillon est affiché comme tel et rien ne quitte le navigateur.
- **IA en direct** : la page appelle le relais, qui appelle Claude Haiku 5.5. En cas de limite atteinte ou de panne, la page bascule automatiquement sur le mode secours.

## Aperçu local
```
cd vitrine && python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
