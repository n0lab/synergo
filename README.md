# Synergo

Plateforme dynamique de classification des gestes non verbaux construite avec **Node.js (Vite)** et **React**.
Toutes les données (médias, nomenclatures, sélections Reviewer/Quizz) sont persistées dans une base locale (localStorage) afin de
conserver vos ajouts et modifications entre deux sessions.

## Démarrage

```bash
npm install
npm run dev
```

La commande `dev` démarre le serveur Vite en mode développement (hot reload). Ouvrez l’URL fournie (par défaut http://localhost:5173) pour utiliser la plateforme.

## Fonctionnalités
- Sidebar rétractable avec navigation Oracle / Reviewer / Quizz / Nomenclatures
- Mode clair / sombre
- Vue Oracle avec KPI (nombre de vidéos et de photos) cliquables pour filtrer par type, recherche dynamique sur les tags et cartes cliquables
- Vue détail 70/30 avec lecteur vidéo (lecture/pause, pas-à-pas image avant/arrière et navigation clavier) ou affichage photo, nomenclatures cliquables pour se rendre à l’horodatage et barre d’actions (Edit, To Review, To Quizz)
- Rubrique Nomenclatures : tableau de gestion (ajout, modification, suppression avec confirmation) couvrant les tags issus des médias et ceux créés manuellement
- Listes Reviewer et Quizz alimentées par les actions depuis la vue détail

## Scripts
- `npm run dev` : serveur de dev
- `npm run build` : build de production
- `npm run preview` : prévisualisation du build
