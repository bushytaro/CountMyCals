---
name: Hypothèses du plan hebdomadaire
description: Décisions métier non évidentes qui encadrent la génération automatique des repas.
---

Le plan persiste quatre valeurs de créneau distinctes : `Petit-dejeuner`, `Dejeuner`, `Diner` et `Collation`.

**Why:** Réutiliser deux fois `Encas` ne permettait pas de distinguer durablement le petit-déjeuner de la collation après rechargement, car les items n’ont ni position ni libellé séparé.

**How to apply:** Toute évolution du plan ou de son affichage doit conserver cette distinction. `Petit-dejeuner` et `Collation` sélectionnent actuellement des recettes de catégorie `Encas`.

Pour le MVP, le prix disponible d’un ingrédient canonique est utilisé globalement, sans filtrer les produits selon les magasins préférés du profil.

**Why:** Le brief prévoit un seul prix par ingrédient canonique. Filtrer par magasin rendrait des recettes artificiellement indisponibles avec le catalogue actuellement renseigné dans un seul magasin.

**How to apply:** N’introduire une sélection ou comparaison par magasin que lorsque le catalogue propose une couverture de prix suffisante et qu’une règle de choix a été validée.