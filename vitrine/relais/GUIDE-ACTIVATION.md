# Pas-à-pas : brancher l'IA en direct (préparé, **non activé**)

> Brouillon généré par IA, à valider par Simo. **Rien de ce guide n'est fait.** Aucune dépense, aucun compte payant et aucune clé API sans l'accord écrit de Simo. Les étapes payantes sont signalées 💳. Les intitulés des écrans Cloudflare et Anthropic sont indicatifs : le twin guide Simo écran par écran le moment venu.

## En bref
- **Tu crées 2 comptes et 1 clé** ; je fais tout le reste : code, branchement de la page, recette, publication.
- **Ordre** : d'abord le relais Cloudflare (gratuit), ensuite le compte Anthropic, et **la clé en tout dernier**, collée aussitôt dans le relais.
- **La clé va à un seul endroit** : les secrets du relais Cloudflare. Jamais dans la page, un dépôt, un email ou un message.
- **Pour couper** : un réglage à `0` (coupure immédiate, réversible) ou la clé révoquée (coupure définitive).
- **Coût** : plafond dur de **5 $ par mois**, avec **120 réponses par jour** au maximum.
- **Durée** : environ 45 minutes, en une séance, avec moi.
- **En attendant**, la page tourne sans IA : un brouillon généré dans le navigateur à partir du texte du visiteur.

## Petit lexique
| Mot | Sens ici |
|---|---|
| Worker | Petit programme hébergé par Cloudflare : le relais entre la page et Claude. |
| KV | Petite base de données de Cloudflare : les compteurs du jour, sans aucun texte de visiteur. |
| Liaison (Binding) | Le branchement entre le Worker et la base KV. |
| Variable, Secret | Réglages du Worker. Un secret est masqué dès qu'il est enregistré. |
| Deploy | Le bouton qui enregistre et met en service une modification. |
| Observability | Les journaux du Worker. |
| Espace de travail (Workspace) | Un compartiment du compte Anthropic, avec son propre plafond de dépense. |

## 1. Ce que tu crées toi-même, dans cet ordre
| # | Quoi | Où | Coût | Durée |
|---|---|---|---|---|
| 1 | Compte Cloudflare | dash.cloudflare.com → Sign up | Gratuit, sans carte | 5 min |
| 2 | Relais : Worker, KV et réglages, **sans la clé** | Section 2 | Gratuit | 15 min |
| 3 💳 | Compte Anthropic (Claude Console) | platform.claude.com | Carte requise. Mode de facturation à vérifier à l'écran ; choisir le plus petit montant, **recharge automatique désactivée** | 10 min |
| 4 💳 | Espace de travail « vitrine », avec **plafond de dépense à 5 $/mois** | Console → Workspaces → Create, puis Spend limits (impossible sur l'espace par défaut, d'où cet espace dédié) | — | 5 min |
| 5 💳 | Clé API **limitée à l'espace « vitrine »**, créée en dernier | Section 3 | — | 5 min |

## 2. Le relais Cloudflare (gratuit) : tu cliques, je te guide
1. Workers & Pages → Create → Worker, nommé `mini-cadrage` → Deploy → Edit code → coller le contenu de `relais/worker.js` → Deploy.
2. Storage & Databases → KV → Create, nommé `mini-cadrage-compteurs`. Ensuite, dans le Worker : Settings → Bindings → Add → KV namespace, avec le nom de variable **`COMPTEURS`**.
3. Dans le Worker : Settings → Variables and Secrets.
   - En texte : `ALLOWED_ORIGINS` = `https://simo-b.github.io`, `PLAFOND_JOUR_GLOBAL` = `120`, `PLAFOND_JOUR_IP` = `5`.
   - En secret : `SEL_IP` = une longue phrase inventée, jamais réutilisée ailleurs.
   - Ne crée pas de variable `MODELE` : le relais utilise Claude Haiku 5.5 par défaut.
   - Puis **Deploy**.
4. Observability : désactive les journaux détaillés, ou garde seulement les erreurs. Le relais n'y écrit jamais le texte des visiteurs.
5. Envoie-moi l'adresse du Worker, du type `https://mini-cadrage.<sous-domaine>.workers.dev`. Elle n'est pas secrète.

Tant que la clé manque, le relais répond « indisponible » et la page reste en brouillon généré. C'est voulu.

## 3. La clé : créée en dernier, collée aussitôt, et nulle part ailleurs
Avant de commencer : garde deux onglets ouverts, Cloudflare (Worker `mini-cadrage` → Settings → Variables and Secrets) et la Claude Console. Ne partage pas ton écran à ce moment-là.
1. Console → espace « vitrine » : vérifie que le plafond de 5 $ par mois est bien affiché.
2. Console → API Keys → Create Key : espace « vitrine », nom « vitrine-relais ». La clé ne s'affiche qu'une fois.
3. Copie-la et colle-la tout de suite dans Cloudflare : Add → Type **Secret** → Name `ANTHROPIC_API_KEY` → Value : la clé → **Deploy**.
4. Vérifie que la valeur apparaît masquée. Sinon, supprime-la et recommence en choisissant bien « Secret ».
5. Copie ensuite n'importe quel autre texte, pour effacer la clé du presse-papiers. Si le navigateur propose d'enregistrer la clé, refuse.

Ne la mets jamais dans la page, dans un dépôt GitHub, dans un email, dans une note, sur une capture d'écran ou dans un message, y compris à moi.

## 4. Comment couper
| Niveau | Action | Effet | Délai |
|---|---|---|---|
| 1. Pause immédiate | Cloudflare → Worker → Settings → Variables and Secrets → `PLAFOND_JOUR_GLOBAL` → tape le chiffre **0** → Deploy | Plus aucun appel à l'IA ; la page affiche le brouillon généré | Moins d'une minute. Réversible : remettre `120` |
| 2. Débrancher la page | Je remets `RELAIS_URL` à vide dans la page et je republie | La page n'appelle plus le relais | Jusqu'à 10 min, le temps que GitHub Pages se mette à jour |
| 3. Révoquer la clé | Claude Console → API Keys → « vitrine-relais » → Disable ou Delete | La clé devient inutilisable, définitivement | Moins d'une minute |
| Filet permanent | Plafond de 5 $/mois de l'espace « vitrine » | Au-delà, l'API refuse les demandes jusqu'au mois suivant, et la page passe en brouillon généré | Automatique |

**Niveau 1, deux précautions :**
- Tape bien le chiffre `0`, pas la lettre O ni le mot « zéro », et ne supprime pas la variable : une valeur absente ou illisible remet en silence le plafond par défaut, 120 par jour.
- Vérifie la coupure : ouvre la page, clique sur « Essayer avec un exemple », puis envoie. Tu dois lire « L'IA en direct est momentanément indisponible ». Sinon, passe au niveau 3.

**Si la clé a fuité, ou au moindre doute :**
1. Niveau 3 tout de suite : révoque la clé dans la Console.
2. Console → Usage : regarde la consommation de l'espace « vitrine ». Le plafond de 5 $ borne la perte.
3. Crée une nouvelle clé (section 3) et remplace le secret `ANTHROPIC_API_KEY` dans Cloudflare.
4. Préviens-moi : je refais un essai depuis la page.

## 5. Ce que je fais ensuite (sans dépense)
1. Je renseigne `RELAIS_URL` dans la page : l'adresse du Worker suivie de `/cadrage`.
2. Je réintroduis les mentions sur Cloudflare et Anthropic (« Vos données », mentions légales) : voir la section « À réintroduire » de `livrables/2026-10-14-textes-vitrine.md`. Règle 6 : jamais ton nom de famille, ton email, ton adresse ni ton téléphone.
3. 💳 Recette réelle, uniquement avec ton accord : `tests/recette/cas-ia-reels.mjs` lance 19 cas, 3 fois chacun, soit environ 0,03 $. Pendant ce temps, `PLAFOND_JOUR_IP` est relevé à 80, puis remis à 5. Je mesure les tokens réellement consommés. Tu relis ensuite 20 réponses avec la grille de recette.
4. Je vérifie, depuis la vraie page : une demande réussie, une rafale de 20 demandes bien limitée et la pause du niveau 1.
5. Ton go final, puis la publication.

## 6. Budget (tarif vérifié le 18/10/2026 sur la documentation officielle d'Anthropic)
- **Modèle** : Claude Haiku 5.5 (`claude-haiku-5-5`), à 0,10 $ par million de tokens en entrée et 0,50 $ en sortie. Ce tarif vaut pour les demandes de moins de 100 000 tokens ; les nôtres en font environ 1 500.
- **Par réponse** : habituellement entre 0,0003 et 0,0005 $ ; au pire 0,0008 $, car la sortie est limitée à 1 200 tokens.
- **Par mois** : avec 120 réponses par jour au maximum, soit environ 3 700 par mois, cela fait habituellement entre 1,1 et 1,9 $ par mois, et au pire 2,9 $. Ces chiffres seront confirmés par la mesure de la recette réelle.
- **En cas d'abus** : la longueur du texte est contrôlée après normalisation (correctif du 18/10), donc le coût d'entrée reste borné. Une rafale répartie entre plusieurs serveurs Cloudflare peut dépasser un peu le plafond du jour. Le plafond de 5 $ reste la borne dure : s'il est atteint, l'IA est coupée jusqu'à la fin du mois et la page reste en brouillon généré.
- Sources : la page officielle des tarifs Anthropic (pricing) et celle des espaces de travail (workspaces, plafonds de dépense).

## 7. Garde-fous déjà en place dans le relais
| Garde-fou | Réglage | Effet |
|---|---|---|
| Plafond global | 120 demandes/jour | Coût mensuel borné (voir section 6). |
| Limite par visiteur | 5 demandes/jour (adresse IPv4 ou bloc /64 en IPv6) | Freine les abus. Entre serveurs Cloudflare, une rafale peut dépasser légèrement : le plafond de 5 $ reste la borne dure. |
| Origine autorisée | `https://simo-b.github.io` uniquement | Les autres sites ne peuvent pas utiliser le relais. |
| Longueur du texte | 30 à 1 200 caractères, contrôlée après normalisation | Coût par demande borné. |
| Filtre des réponses | Liens, emails, téléphones et markdown retirés | Réponse rejetée, et page en brouillon généré, si elle parle de Simo, d'un TJM, d'un devis ou d'un montant absent du texte du visiteur. |

## 8. Checklist d'activation, dans l'ordre
- [ ] Accord écrit de Simo pour la dépense (plafond de 5 $/mois)
- [ ] Textes « À réintroduire » validés ; accords de traitement des données (DPA) d'Anthropic et de Cloudflare acceptés ; durée de conservation des données chez Anthropic vérifiée
- [ ] Consignes du relais (`CONSIGNES` dans `worker.js`) relues et validées
- [ ] Risque résiduel accepté par écrit : rafale répartie entre serveurs Cloudflare, bornée par le plafond de 5 $
- [ ] Compte Cloudflare, Worker, KV et variables, sans la clé (sections 1 et 2)
- [ ] Compte Anthropic, espace « vitrine », plafond de 5 $ vérifié, recharge automatique désactivée (section 1)
- [ ] Clé créée en dernier, collée aussitôt dans le secret, valeur masquée vérifiée (section 3)
- [ ] Adresse du Worker transmise au twin
- [ ] Page branchée (adresse du Worker + `/cadrage`) et textes réintroduits (section 5)
- [ ] Recette réelle réussie (environ 0,03 $), tokens mesurés, 20 réponses relues
- [ ] Depuis la vraie page : demande réussie, rafale limitée, pause du niveau 1 vérifiée
- [ ] Go final de Simo, puis publication sur `Simo-B/Simo-vitrine`
