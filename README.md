# Synergo – plateforme de classification des gestes non-verbaux

Prototype statique (HTML/CSS/JS) pour explorer la rubrique « Oracle », avec sidebar rétractable, mode clair/sombre et lecteur vidéo intégrant la navigation image par image.

## Lancer l'interface

Aucune dépendance n'est nécessaire. Ouvrez simplement `index.html` dans un navigateur moderne ou servez le dossier courant :

```bash
python -m http.server 8000
```

Puis visitez http://localhost:8000.

## Fonctionnalités livrées
- Sidebar « collapsible » avec sections Oracle, Reviewer et Quizz (ces deux dernières affichent pour l'instant les ressources mises de côté).
- Page Oracle avec KPI dynamiques, recherche par nomenclature (tags) en direct, cards vidéos/photos.
- Page détail vidéo/photo avec bannière d'actions (Edit/To Review/To Quizz), layout 70/30 et lecteur vidéo avec lecture/pause et pas-à-pas ±1 frame.
- Gestion des listes Reviewer/Quizz et bascule dark/light.

## Choix techniques
- **Stack minimale** : HTML/CSS/JS natifs pour éviter toute dépendance réseau.
- **Design system léger** basé sur des variables CSS pour le theming clair/sombre.
- **Données mockées** pour illustrer la nomenclature et le routage interne sans backend.
