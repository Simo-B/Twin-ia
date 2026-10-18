# Pas-à-pas : brancher l'IA en direct (préparé, **non activé**)

> Brouillon généré par IA, à valider par Simo. **Rien de ce guide n'est fait.** Aucune dépense, aucun compte payant et aucune clé API sans l'accord écrit de Simo. Les étapes payantes sont signalées 💳. Les intitulés des écrans Cloudflare et Anthropic sont indicatifs : le twin guide Simo écran par écran le moment venu.

## En bref
- **Tu crées 2 comptes et 1 clé** ; je fais tout le reste : code, branchement de la page, recette, publication.
- **La clé va à un seul endroit** : les secrets du relais Cloudflare. Jamais dans la page, un dépôt, un email ou un message.
- **Pour couper** : un réglage à `0` (coupure immédiate, réversible) ou la clé révoquée (coupure définitive).
- **Coût** : plafond dur de **5 $ par mois**, avec **120 réponses par jour** au maximum.
- **En attendant**, la page tourne sans IA : un brouillon généré dans le navigateur à partir du texte du visiteur.

## 1. Ce que tu crées toi-même
| # | Quoi | Où | Coût | Durée |
|---|---|---|---|---|
| 1 | Compte Cloudflare (le relais) | dash.cloudflare.com → Sign up | Gratuit, sans carte | 5 min |
| 2 💳 | Compte Anthropic (Claude Console) | platform.claude.com | Paiement à l'usage, carte requise | 10 min |
| 3 💳 | Espace de travail « vitrine », avec **plafond de dépense à 5 $/mois** | Console → Workspaces → Create, puis Spend limits (impossible sur l'espace par défaut, d'où cet espace dédié) | — | 2 min |
| 4 💳 | Clé API **limitée à l'espace « vitrine »** | Console → API Keys → Create Key, espace « vitrine », nom « vitrine-relais » | — | 1 min |

La clé ne s'affiche qu'une fois : copie-la directement à l'étape 2 ci-dessous.

## 2. Où mettre la clé (et nulle part ailleurs)
Cloudflare → Workers & Pages → `mini-cadrage` → Settings → Variables and Secrets → Add :
- Type : **Secret** ;
- Name : `ANTHROPIC_API_KEY` ;
- Value : la clé ;
- puis **Deploy**.

Ne la mets jamais dans la page, dans un dépôt GitHub, dans un email ou dans un message, y compris à moi. Si elle fuit, révoque-la tout de suite (section 4, niveau 3).

## 3. Le relais Cloudflare (gratuit) : tu cliques, je te guide
1. Workers & Pages → Create → Worker, nommé `mini-cadrage` → Deploy → Edit code → coller le contenu de `relais/worker.js` → Deploy.
2. Storage & Databases → KV → Create, nommé `mini-cadrage-compteurs`. Ensuite, dans le Worker : Settings → Bindings → Add → KV namespace, avec le nom de variable **`COMPTEURS`**.
3. Dans le Worker : Settings → Variables and Secrets.
   - En texte : `ALLOWED_ORIGINS` = `https://simo-b.github.io`, `PLAFOND_JOUR_GLOBAL` = `120`, `PLAFOND_JOUR_IP` = `5`.
   - En secret : `SEL_IP` = une longue phrase inventée, jamais réutilisée ailleurs, et `ANTHROPIC_API_KEY` (section 2).
4. Observability : désactive les journaux détaillés, ou garde seulement les erreurs. Le relais n'y écrit jamais le texte des visiteurs.
5. Envoie-moi l'adresse du Worker, du type `https://mini-cadrage.<sous-domaine>.workers.dev`. Elle n'est pas secrète.

Tant que la clé manque, le relais répond « indisponible » et la page reste en brouillon généré. C'est voulu.

## 4. Comment couper
| Niveau | Action | Effet | Délai |
|---|---|---|---|
| 1. Pause immédiate | Cloudflare → Worker → Settings → Variables → `PLAFOND_JOUR_GLOBAL` = `0` → Deploy | Plus aucun appel à l'IA ; la page affiche le brouillon généré | Moins d'une minute, réversible |
| 2. Débrancher la page | Je remets `RELAIS_URL` à vide dans la page et je republie | La page n'appelle plus le relais | 2 min |
| 3. Révoquer la clé | Claude Console → API Keys → la clé → Disable ou Delete | La clé devient inutilisable, définitivement | Moins d'une minute |
| Filet permanent | Plafond de 5 $/mois de l'espace « vitrine » | Au-delà, l'API refuse (« workspace API usage limits ») et la page passe en brouillon généré | Automatique |

## 5. Ce que je fais ensuite (sans dépense)
1. Je renseigne `RELAIS_URL` dans la page.
2. Je réintroduis les mentions sur Cloudflare et Anthropic (« Vos données », mentions légales) : voir la section « À réintroduire » de `livrables/2026-10-14-textes-vitrine.md`. Règle 6 : jamais ton nom de famille, ton email, ton adresse ni ton téléphone.
3. 💳 Recette réelle, uniquement avec ton accord : `tests/recette/cas-ia-reels.mjs` lance 19 cas, 3 fois chacun, soit environ 0,03 $. Pendant ce temps, `PLAFOND_JOUR_IP` est relevé à 80, puis remis à 5. Tu relis ensuite 20 réponses avec la grille de recette.
4. Je vérifie, depuis la vraie page, qu'une rafale de 20 demandes est bien limitée et que la pause du niveau 1 fonctionne.
5. Ton go final, puis la publication.

## 6. Budget (tarif vérifié le 18/10/2026 sur la documentation officielle d'Anthropic)
- **Modèle** : Claude Haiku 5.5 (`claude-haiku-5-5`), à 0,10 $ par million de tokens en entrée et 0,50 $ en sortie. Ce tarif vaut pour les demandes de moins de 100 000 tokens ; les nôtres en font environ 1 500.
- **Par réponse** : habituellement entre 0,0003 et 0,0005 $ ; au pire 0,00076 $, car la sortie est limitée à 1 200 tokens.
- **Par mois** : avec 120 réponses par jour au maximum, soit environ 3 700 par mois, cela fait habituellement entre 1,1 et 1,9 $ par mois, et au pire 2,8 $. Le plafond dur reste à 5 $ par mois.
- Sources : la page officielle des tarifs Anthropic (pricing) et celle des espaces de travail (workspaces, plafonds de dépense).

## 7. Garde-fous déjà en place dans le relais
| Garde-fou | Réglage | Effet |
|---|---|---|
| Plafond global | 120 demandes/jour | Coût mensuel borné (voir section 6). |
| Limite par visiteur | 5 demandes/jour (adresse IPv4 ou bloc /64 en IPv6) | Freine les abus. Entre instances Cloudflare, une rafale peut dépasser légèrement : le plafond de 5 $ reste la borne dure. |
| Origine autorisée | `https://simo-b.github.io` uniquement | Les autres sites ne peuvent pas utiliser le relais. |
| Longueur du texte | 30 à 1 200 caractères | Coût par demande borné. |
| Filtre des réponses | Liens, emails, téléphones et markdown retirés | Réponse rejetée, et page en brouillon généré, si elle parle de Simo, d'un TJM, d'un devis ou d'un montant absent du texte du visiteur. |

## 8. Checklist d'activation, dans l'ordre
- [ ] Accord écrit de Simo pour la dépense (plafond de 5 $/mois)
- [ ] Compte Cloudflare, Worker, KV et variables (sections 1 et 3)
- [ ] Compte Anthropic, espace « vitrine », plafond de 5 $ et clé rangée dans Cloudflare (sections 1 et 2)
- [ ] Adresse du Worker transmise au twin
- [ ] Page branchée et textes réintroduits (section 5)
- [ ] Recette réelle réussie (environ 0,03 $) et 20 réponses relues
- [ ] Go final de Simo, puis publication sur `Simo-B/Simo-vitrine`
