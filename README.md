# Synergo

**Synergo** est un catalogue interactif pour la gestion et l'apprentissage de ressources gestuelles non-verbales. L'application permet de cataloguer des vidéos et photos de gestes, de les annoter, de les organiser avec un système de tags (nomenclatures), et de s'entraîner via un mode quiz.

## Fonctionnalités

### Oracle (Vue principale)
- Parcourir les médias en mode grille ou liste
- Recherche floue sur le titre, la description et les tags
- Filtrer par type (vidéo/photo) et par tags
- Tri par date, titre ou pertinence
- Cartes KPI avec compteurs vidéos/photos

### Gestion des Médias
- Ajout de ressources : fichier local, upload, ou URL externe
- Lecteur vidéo avec contrôles avancés (play/pause, image par image, ±1 sec)
- Annotations temporelles avec tags associés
- Vue détaillée 70/30 (média + informations)

### Nomenclatures
- Gestion des tags avec étiquettes, descriptions et interprétations
- Synchronisation automatique avec les tags des médias
- Export en CSV

### Listes de Travail
- **Reviewer** : Marquer des médias pour révision ultérieure
- **Quiz** : Créer une liste de médias pour l'apprentissage

### Mode Quiz
- Quiz interactif à choix multiples (4 options)
- Items mélangés aléatoirement
- Score et pourcentage de réussite
- Revue des réponses à la fin

### Statistiques
- Compteurs de médias et nomenclatures
- Fréquence d'utilisation des tags
- Détection des fichiers et nomenclatures non utilisés

### Import/Export
- Export de la base de données en JSON
- Import de sauvegardes
- Réinitialisation de la base

### Interface
- Thème clair / sombre
- Interface bilingue français / anglais
- Sidebar rétractable et épinglable
- Notifications toast
- Raccourcis clavier

## Démarrage Rapide

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement (API + Vite)
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **API** : http://localhost:3001

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur API et Vite simultanément |
| `npm run client` | Démarre uniquement le serveur Vite |
| `npm run server` | Démarre uniquement le serveur API |
| `npm run build` | Crée le build de production |
| `npm run preview` | Prévisualise le build de production |
| `npm start` | Démarre le serveur de production |

## Architecture

```
synergo/
├── src/                    # Frontend React
│   ├── components/         # Composants React
│   ├── contexts/           # Contextes (notifications)
│   ├── hooks/              # Hooks personnalisés
│   ├── utils/              # Utilitaires (recherche, export)
│   ├── App.jsx             # Composant principal
│   ├── api.js              # Client API
│   └── i18n.js             # Traductions
├── server/                 # Backend Express
│   ├── routes/             # Routes API
│   ├── middleware/         # Middlewares
│   ├── migrations/         # Migrations BDD
│   ├── db.js               # Couche SQLite
│   └── index.js            # Point d'entrée
├── public/
│   └── resources/          # Fichiers médias
└── package.json
```

### Stack Technique

| Couche | Technologies |
|--------|--------------|
| Frontend | React 18, Vite 5, Lucide Icons |
| Backend | Express.js, Node.js, Multer |
| Base de données | SQLite (better-sqlite3) |

## Gestion des Ressources Médias

### Structure de Stockage

Les fichiers médias sont stockés dans `/public/resources/`. La base de données ne contient que les noms de fichiers :

```
Base de données : "geste-01.mp4"
       ↓
Résolution : "/resources/geste-01.mp4"
       ↓
Fichier : /public/resources/geste-01.mp4
```

### Ajouter des Ressources

**Option 1 : Fichier existant**
1. Placer le fichier dans `/public/resources/`
2. Dans l'app, aller à "Ajouter une ressource"
3. Sélectionner "Fichier existant"
4. Entrer le nom du fichier (ex: `geste-01.mp4`)
5. Remplir le titre et la description

**Option 2 : Upload**
1. Dans l'app, aller à "Ajouter une ressource"
2. Sélectionner "Upload"
3. Choisir un fichier depuis votre ordinateur
4. Le fichier sera automatiquement copié dans `/public/resources/`

**Option 3 : URL externe**
1. Dans l'app, aller à "Ajouter une ressource"
2. Sélectionner "URL externe"
3. Entrer l'URL complète (http/https)

### Formats Supportés

| Type | Extensions |
|------|------------|
| Vidéo | .mp4, .webm, .mov, .avi, .mkv |
| Photo | .jpg, .jpeg, .png, .gif, .webp, .bmp |

## Base de Données

La base de données SQLite est stockée dans `server/data/synergo.db` et créée automatiquement au premier démarrage.

### Tables

- **media** : Vidéos et photos avec métadonnées, tags et annotations
- **nomenclatures** : Définitions des tags
- **review_list** : Médias marqués pour révision
- **quiz_list** : Médias dans la liste quiz

## Configuration

### Serveur (port 3001)

- Rate limiting : 500 requêtes / 15 minutes
- Taille max body : 10 MB
- Taille max upload : 100 MB

### Frontend

- Debounce recherche : 300ms
- Durée toast : 5 secondes
- FPS par défaut : 30

## Avantages de l'Architecture

- **Pas de limite de stockage navigateur** : Les médias sont sur le système de fichiers
- **Performance** : Fichiers servis statiquement et mis en cache
- **Persistance** : Base de données SQLite robuste
- **Portabilité** : Export/import JSON pour sauvegardes
- **Fonctionne hors-ligne** : Une fois les fichiers en place

## Licence

MIT
