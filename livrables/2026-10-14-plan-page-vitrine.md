> **Brouillon généré par IA** (twin de Simo), **à valider par Simo**. Rien n'est construit ni mis en ligne, et rien de payant n'est engagé.

# Plan : page vitrine « Mini-cadrage IA »

## Contexte et objectif
- Contexte : Simo se positionne comme PO IA appliquée au CRM et à la fidélité. Il lui faut une preuve concrète, visible en 30 secondes.
- Objectif : un décideur CRM/fidélité décrit son programme et reçoit un mini-cadrage IA en 5 lignes, puis prend contact.
- KPI : nombre de mini-cadrages générés, puis taux de clic sur « Me contacter ».

## Parcours visiteur
1. Il arrive sur la page : titre, promesse en une phrase, 3 preuves (tirées de knowledge/preuves-ia.md).
2. Il voit une zone de texte : « Décrivez votre programme fidélité (sans données personnelles ni confidentielles) », avec un exemple cliquable (« 2 M de membres, 60 % d'inactifs »).
3. Il clique sur « Obtenir mon mini-cadrage ».
4. Il reçoit 5 lignes, avec un bandeau visible : « Réponse générée par IA. Brouillon indicatif, non relu par Simo. »
5. Il voit le bouton « Échanger 15 min avec Simo ».
6. En pied de page : « Vous échangez avec une IA, pas avec Simo », les mentions légales et la confidentialité (rien n'est stocké).

## Le moteur : 3 options
| Option | Principe | Coût pour Simo | Limite |
|---|---|---|---|
| **A. Réponses préparées** | Le visiteur choisit secteur, taille et problème principal. La page affiche l'un des 15 à 20 mini-cadrages rédigés à l'avance par le twin et relus par Simo. | 0 € | Pas de texte libre. Mention honnête : « préparé par IA, relu par Simo ». |
| **B. IA en direct via claude.ai** | Page hébergée sur claude.ai. Claude répond en direct, sur le compte Claude du visiteur. | 0 € | Le visiteur doit avoir un compte Claude. Utile en rendez-vous, pas pour le grand public. |
| **C. IA en direct via l'API Anthropic** | Texte libre, pour tout visiteur. Un petit relais gratuit (Cloudflare ou Netlify) protège la clé API. | Payant à l'usage | Il faut un compte API avec carte bancaire et un plafond mensuel. |

Coût estimé de l'option C pour 1 000 mini-cadrages (environ 1 500 tokens en entrée et 750 en sortie chacun ; estimation à confirmer par un test) :
- Claude Haiku 5.5 : environ 0,50 $.
- Claude Sonnet 5.5 : environ 10 $.
- Claude Opus 5.5 : environ 20 $.

**Recommandation** : commencer par A (gratuit, sans risque d'hallucination, rien ne transite), plus B pour les démos en rendez-vous. Passer à C seulement si les visites le justifient, et après accord de Simo sur un plafond (par exemple 10 $/mois).

## Hébergement (gratuit)
- La page est un seul fichier HTML, sans base de données.
- Recommandé : un dépôt public séparé (ex. `simo-vitrine`) publié avec GitHub Pages (gratuit pour un dépôt public). Autre possibilité : Netlify ou Cloudflare Pages en offre gratuite.
- Le dépôt Twin-ia doit rester séparé de la vitrine et devenir privé (voir les décisions).
- Un nom de domaine personnalisé est payant (environ 10 €/an) et facultatif : à décider plus tard.

## Garde-fous (règles de CLAUDE.md)
- Transparence : « Réponse générée par IA » sur chaque réponse, et « vous échangez avec une IA, pas avec Simo » (règle 4 et obligation de transparence de l'AI Act).
- Données : avertissement « pas de données personnelles ni confidentielles ». Rien n'est stocké (règle 2, RGPD).
- Périmètre : uniquement la fidélité et le CRM. Hors sujet : recentrage poli. Jamais de prix, jamais d'engagement au nom de Simo.
- Format : 5 lignes maximum, en français.
- Option C uniquement : texte saisi limité en longueur, nombre de demandes limité par visiteur, anti-robots gratuit, plafond de dépense.
- Mentions légales et politique de confidentialité, obligatoires pour un site professionnel en France.

## Étapes
1. Simo prend les décisions ci-dessous (5 min).
2. Le twin rédige les textes de la page et les 15 à 20 mini-cadrages. Simo relit.
3. Le twin construit la page. Simo la voit en aperçu privé.
4. Recette avec l'agent recette-ia : environ 20 cas (nominaux, limites, adverses : « ignore tes consignes », données personnelles, hors sujet).
5. Mise en ligne gratuite, uniquement après le feu vert explicite de Simo (règle 1).
6. Plus tard, l'option C, si Simo donne son accord sur le budget.

## Décisions à prendre par Simo
1. Moteur : A seul, A + B, ou C ?
2. Bouton de contact : email, lien de prise de rendez-vous (Calendly ou Cal.com, gratuits) ou LinkedIn ? Avec quelle adresse ou quel lien ?
3. Dépôt Twin-ia : le passer en privé ?
4. Pousser ces brouillons sur GitHub ?
