# Guide d'activation : page vitrine et IA en direct

> Brouillon généré par IA, à valider par Simo. **Rien de ce guide n'est fait.** Chaque étape attend le feu vert explicite de Simo. Les étapes payantes sont signalées 💳. Les intitulés des écrans Cloudflare et Anthropic sont indicatifs : le twin guide Simo écran par écran le moment venu.

## Ce qui tourne déjà sans rien activer
La page fonctionne seule en **mode secours** : les 5 mini-cadrages préparés, signalés comme tels, sans aucun appel extérieur. On peut donc la mettre en ligne d'abord comme ça, puis activer l'IA en direct plus tard.

## Étape 1 : mise en ligne de la page en mode secours (gratuit) : feu vert de Simo le 14/10
1. Bouton de contact : « Écrire à Simo » par email (objet « Mini-cadrage IA ») tant que `LIEN_CALCOM` vaut `{{LIEN_CALCOM}}`. Plus tard, remplacer `{{LIEN_CALCOM}}` (une seule occurrence, dans les réglages en haut du script) par le lien Cal.com : le bouton devient « Réserver 15 min avec Simo ».
2. Mentions légales réduites à la demande de Simo (15/10) : éditeur et email de contact uniquement. Cloudflare et Anthropic n'apparaissent pas tant que l'IA en direct est désactivée.
3. Dépôt **public** `Simo-B/simo-vitrine` : `index.html` uniquement.
4. GitHub Pages activé (Settings > Pages > branche `main`, dossier racine).
5. Adresse : `https://simo-b.github.io/simo-vitrine/`.

## Étape 2 : relais Cloudflare (gratuit, sans carte bancaire)
1. Créer un compte Cloudflare gratuit (offre Free).
2. Créer un Worker nommé `mini-cadrage`, puis coller le contenu de `relais/worker.js` dans l'éditeur en ligne et déployer.
3. Créer un espace de stockage KV nommé `mini-cadrage-compteurs`, puis le relier au Worker sous le nom **`COMPTEURS`**.
4. Dans les réglages du Worker :
   - Variables : `ALLOWED_ORIGINS` = `https://simo-b.github.io`, `PLAFOND_JOUR_GLOBAL` = `120`, `PLAFOND_JOUR_IP` = `5`.
   - Secret : `SEL_IP` = une longue phrase inventée, jamais réutilisée ailleurs.
5. Désactiver les journaux détaillés du Worker (observability), ou les limiter aux codes d'erreur : le relais n'y écrit jamais le texte des visiteurs.

Tant que la clé API manque, le relais répond « indisponible » et la page reste en mode secours. C'est voulu.

## Étape 3 💳 : compte API Anthropic (payant, feu vert explicite requis)
1. Créer un compte sur la console Anthropic (Claude Console) et ajouter une carte bancaire.
2. Créer un espace de travail dédié, par exemple « vitrine ».
3. Régler une **limite de dépense mensuelle de 5 $** sur cet espace. C'est le plafond dur.
4. Créer une clé API dans cet espace, puis la coller dans le Worker comme secret **`ANTHROPIC_API_KEY`**. Elle ne doit être mise nulle part ailleurs : ni dans la page, ni dans un dépôt, ni dans un message.
5. Accepter et archiver les accords de traitement des données (DPA) d'Anthropic et de Cloudflare ; vérifier la durée de conservation des requêtes chez Anthropic.

## Étape 4 : brancher la page sur le relais
1. Dans `index.html`, renseigner `RELAIS_URL: "https://mini-cadrage.<sous-domaine>.workers.dev/cadrage"`.
2. Réintroduire les textes sur Cloudflare et Anthropic (ligne sous le bouton, « Une IA, pas Simo », « Vos données », mentions légales) : voir la section « À réintroduire à l'activation de l'IA en direct » de `livrables/2026-10-14-textes-vitrine.md`.
3. Republier la page dans `simo-vitrine`.

## Étape 5 : recette réelle (coût estimé : environ 0,03 $, au pire 0,07 $)
1. Relever temporairement `PLAFOND_JOUR_IP` à 80 (sinon le relais bloque le script après 5 demandes).
2. Lancer `tests/recette/cas-ia-reels.mjs` (19 cas, 3 fois chacun), puis faire relire 20 réponses par Simo avec la grille.
3. Remettre `PLAFOND_JOUR_IP` à 5, puis vérifier depuis la vraie page qu'une rafale de 20 demandes est bien limitée et que le coupe-circuit fonctionne.
Voir `livrables/2026-10-14-recette-vitrine.md`.

## Budget et garde-fous
| Garde-fou | Réglage | Effet |
|---|---|---|
| Limite de dépense Anthropic | 5 $/mois | Plafond dur : au-delà, l'API refuse et la page passe en secours. |
| Plafond global du relais | 120 demandes/jour, soit environ 3 700/mois au maximum | Habituellement 0,0003 à 0,0005 $ par réponse (1,1 à 1,9 $/mois au plafond) ; au pire 0,00076 $ par réponse (sortie limitée à 1 200 tokens), soit 2,8 $/mois. |
| Coupe-circuit | `PLAFOND_JOUR_GLOBAL` = `0` | Arrête l'IA en direct immédiatement, sans redéployer : la page passe en secours. |
| Limite par visiteur | 5 demandes/jour (par adresse IPv4, ou par bloc /64 en IPv6) | Freine les abus individuels. Fiable sur une même instance Cloudflare ; entre instances différentes, une rafale peut dépasser légèrement, d'où le plafond Anthropic. |
| Origine autorisée | `https://simo-b.github.io` uniquement | Les autres sites ne peuvent pas utiliser le relais. |
| Longueur du texte | 30 à 1 200 caractères | Coût par demande borné. |
| Filtre des réponses | Liens, emails, téléphones et markdown retirés | Réponse rejetée (page en secours) si elle parle de Simo, d'un TJM, d'un devis ou d'un montant absent du texte du visiteur. |

Le modèle utilisé est **Claude Haiku 5.5** (`claude-haiku-5-5`), avec un effort réglé au plus bas et une réponse au format JSON contrôlé. Tarif : 0,10 $ par million de tokens en entrée et 0,50 $ en sortie.
