# Guide d'activation : page vitrine et IA en direct

> Brouillon généré par IA, à valider par Simo. **Rien de ce guide n'est fait.** Chaque étape attend le feu vert explicite de Simo. Les étapes payantes sont signalées 💳. Les intitulés des écrans Cloudflare et Anthropic sont indicatifs : le twin guide Simo écran par écran le moment venu.

## Ce qui tourne déjà sans rien activer
La page fonctionne seule en **mode secours** : les 5 mini-cadrages préparés, signalés comme tels, sans aucun appel extérieur. On peut donc la mettre en ligne d'abord comme ça, puis activer l'IA en direct plus tard.

## Étape 1 : mise en ligne de la page (gratuit, feu vert « mise en ligne » requis)
1. Remplacer `{{LIEN_CALCOM}}` dans `index.html` (2 occurrences) par le lien Cal.com 15 min.
2. Créer le dépôt **public** `simo-vitrine` sur GitHub et y déposer `index.html`.
3. Activer GitHub Pages (Settings > Pages > branche `main`, dossier racine).
4. Adresse obtenue : `https://simo-b.github.io/simo-vitrine/`.

## Étape 2 : relais Cloudflare (gratuit, sans carte bancaire)
1. Créer un compte Cloudflare gratuit (offre Free).
2. Créer un Worker nommé `mini-cadrage`, puis coller le contenu de `relais/worker.js` dans l'éditeur en ligne et déployer.
3. Créer un espace de stockage KV nommé `mini-cadrage-compteurs`, puis le relier au Worker sous le nom **`COMPTEURS`**.
4. Dans les réglages du Worker :
   - Variables : `ALLOWED_ORIGINS` = `https://simo-b.github.io`, `PLAFOND_JOUR_GLOBAL` = `150`, `PLAFOND_JOUR_IP` = `5`.
   - Secret : `SEL_IP` = une longue phrase inventée, jamais réutilisée ailleurs.

Tant que la clé API manque, le relais répond « indisponible » et la page reste en mode secours. C'est voulu.

## Étape 3 💳 : compte API Anthropic (payant, feu vert explicite requis)
1. Créer un compte sur la console Anthropic (Claude Console) et ajouter une carte bancaire.
2. Créer un espace de travail dédié, par exemple « vitrine ».
3. Régler une **limite de dépense mensuelle de 5 $** sur cet espace. C'est le plafond dur.
4. Créer une clé API dans cet espace, puis la coller dans le Worker comme secret **`ANTHROPIC_API_KEY`**. Elle ne doit être mise nulle part ailleurs : ni dans la page, ni dans un dépôt, ni dans un message.

## Étape 4 : brancher la page sur le relais
Dans `index.html`, renseigner `RELAIS_URL: "https://mini-cadrage.<sous-domaine>.workers.dev/cadrage"`, puis republier la page.

## Étape 5 : recette réelle (coût estimé : moins de 0,02 $)
Lancer les cas IA de la recette sur le vrai modèle, puis décider go ou no-go. Voir `livrables/2026-10-14-recette-vitrine.md`.

## Budget et garde-fous
| Garde-fou | Réglage | Effet |
|---|---|---|
| Limite de dépense Anthropic | 5 $/mois | Plafond dur : au-delà, l'API refuse et la page passe en secours. |
| Plafond global du relais | 150 demandes/jour, soit 4 500/mois au maximum | Coût estimé de 1,5 à 2,5 $/mois au maximum avec Claude Haiku 5.5 (environ 0,0003 à 0,0006 $ par réponse). |
| Limite par visiteur | 5 demandes/jour | Freine les abus individuels. |
| Origine autorisée | `https://simo-b.github.io` uniquement | Les autres sites ne peuvent pas utiliser le relais. |
| Longueur du texte | 30 à 1 200 caractères | Coût par demande borné. |
| Anti-robots Turnstile | Désactivé (optionnel, gratuit) | À activer seulement en cas d'abus constaté. |

Le modèle utilisé est **Claude Haiku 5.5** (`claude-haiku-5-5`), avec un effort réglé au plus bas et une réponse au format JSON contrôlé. Tarif : 0,10 $ par million de tokens en entrée et 0,50 $ en sortie.
