> **Brouillon généré par IA** (agent cadrage-ia du twin de Simo), **à valider par Simo**. Cas fictif, aucune donnée client réelle. Tous les chiffres sont des hypothèses à valider.

# Cadrage IA : réactivation d'un programme fidélité mode

## 1. Reformulation
Une enseigne de mode compte 2 M de membres fidélité, dont 60 % d'inactifs, soit **1,2 M** (2 M × 60 %).
Objectif métier : réactiver de façon rentable les inactifs récupérables, et freiner le passage des actifs en inactivité.

## 2. Cas d'usage IA

### A. Score de réactivabilité + win-back ciblé
- **Données** : transactions sur 24 à 36 mois (date, montant, canal, univers produit), consentements et joignabilité (opt-in email/SMS, adresses valides), historique des campagnes (envois, ouvertures, clics).
- **Gain attendu** (hypothèses à valider) :
  - H1 : 50 % des inactifs sont joignables → 1,2 M × 50 % = 600 k.
  - H2 : on cible les 25 % les mieux scorés → 600 k × 25 % = 150 k.
  - H3 : +3 pts de réactivation par rapport au groupe témoin → 150 k × 3 % = 4 500 clients réactivés par vague.
  - H4 : panier moyen de 60 € → 4 500 × 60 € ≈ 270 k€ de CA incrémental par vague, avant coût de l'offre.
  - En plus : 450 k envois inutiles évités (coût des SMS, pression marketing).
- **Risque principal** : la cannibalisation, c'est-à-dire une remise offerte à des clients qui seraient revenus seuls. Autre risque : des consentements périmés (RGPD).
- **Complexité** : moyenne.

### B. Détection précoce du churn chez les actifs
- **Données** : historique d'au moins 24 mois, délai entre deux achats par client, saisonnalité (soldes, collections), canal, interactions SAV.
- **Gain attendu** (hypothèses) : actifs = 2 M × 40 % = 800 k. H5 : 15 % d'entre eux deviennent inactifs chaque année → 120 k. H6 : on en retient 10 % → 12 k clients préservés par an.
- **Risque principal** : les faux positifs. En mode, l'achat est irrégulier et saisonnier, donc le signal est faible.
- **Complexité** : moyenne.

### C. Contenus win-back personnalisés par IA générative
- **Données** : univers d'achat de chaque client, catalogue (familles, visuels), charte éditoriale, résultats des campagnes passées.
- **Gain attendu** (hypothèse) : H7 : +15 % de clics par rapport à un message générique, à prouver par un A/B test.
- **Risque principal** : un contenu hors charte ou une promesse erronée (prix, stock, taille). La relecture humaine est obligatoire.
- **Complexité** : faible.

## 3. Recommandation : cas A, MVP en 4 semaines
**Pourquoi** : il agit directement sur le stock de 1,2 M d'inactifs. Il s'appuie sur des données déjà présentes dans le CRM. Son effet se mesure contre un groupe témoin. C'est le quick win. Le cas C peut s'ajouter en option en semaine 3.

- **S1 : données et règles.** Définition partagée d'« inactif ». Extraction anonymisée. Audit qualité : doublons dans le RCU, opt-in valides, inactifs au-delà de la durée de conservation RGPD. *Livrable* : périmètre joignable chiffré et règles de gestion validées.
- **S2 : score.** Variables RFM (récence, fréquence, montant) + modèle de propension simple, avec un outil déjà en place ou un outil no-code. Le modèle apprend sur l'historique : les inactifs d'il y a 12 mois qui ont racheté ensuite. *Critère d'acceptation* : chez les 25 % les mieux scorés, le taux de réactivation est au moins 2 fois le taux moyen (seuil à valider). Recette technique.
- **S3 : activation.** Ciblage des 25 % les mieux scorés, groupe témoin de 10 %, scénario win-back en 2 vagues (email puis SMS) dans l'outil de marketing automation existant. Exclusions : désabonnés, clients avec un ticket SAV ouvert. Recette métier. Go/no-go en comité.
- **S4 : lancement et mesure.** Envoi de la vague 1. Suivi des ouvertures, des clics et des premiers achats. Bilan à J+14. La mesure définitive de l'uplift (gain réel par rapport au témoin) arrive à J+30, après le MVP. Décision : industrialiser un scoring mensuel ou arrêter.

## 4. Questions ouvertes
1. Définition d'« inactif » : 12, 18 ou 24 mois sans achat ? Achat uniquement ou toute interaction ?
2. Ancienneté de l'inactivité : combien d'inactifs dépassent 3 ans (purge ou anonymisation RGPD) ?
3. Joignabilité réelle : quelle part d'opt-in email/SMS valides ? (confirme H1)
4. Panier moyen, marge et budget de l'offre win-back ? (confirment H3 et H4)
5. Part de doublons ou de cartes non rattachées dans le RCU : les 60 % sont-ils réels ?
6. Les achats en magasin sont-ils bien rattachés à la carte en caisse ?
7. Quels outils sont en place (CRM, CDP, marketing automation) ? Quel accès aux données (équipe data, entrepôt) ?
8. Quel KPI la direction attend-elle : nombre de réactivés, CA ou marge ?

## 5. Mode démo (5 lignes)
1. Enjeu : 1,2 M d'inactifs (60 % de 2 M) à réactiver sans sacrifier la marge.
2. Cas recommandé : un score de réactivabilité pour cibler les inactifs les plus faciles à récupérer, mesuré contre un groupe témoin.
3. Autres pistes : détecter tôt le churn chez les actifs ; générer par IA des contenus win-back conformes à la charte.
4. MVP en 4 semaines : données → score → campagne test → mesure de l'uplift.
5. Brouillon IA à valider par Simo. À confirmer : définition d'« inactif », opt-in, panier moyen.

> **Brouillon généré par IA, à valider par Simo.** Les hypothèses H1 à H7 sont illustratives et non vérifiées. Rien ne part sans validation explicite de Simo.
