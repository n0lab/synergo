# CLAUDE.md

Ce fichier guide Claude Code (claude.ai/code) pour travailler avec le code de ce dépôt.

## Commandes de Build & Développement

```bash
npm install          # Installer les dépendances (inclut le module natif SQLite)
npm run dev          # Démarrer le serveur API (3001) et le serveur Vite (5173)
npm run client       # Démarrer uniquement le serveur Vite
npm run server       # Démarrer uniquement le serveur API
npm run build        # Créer le build de production
npm run preview      # Prévisualiser le build de production
npm start            # Démarrer le serveur de production
```

**Note:** Aucun framework de test ni outil de linting n'est actuellement configuré.

## Présentation de l'Application

**Synergo** est un catalogue interactif pour la gestion de ressources gestuelles non-verbales (vidéos et photos). L'application permet de cataloguer, annoter, rechercher et apprendre des gestes à travers différents modes d'utilisation.

### Fonctionnalités Principales

| Fonctionnalité | Description |
|----------------|-------------|
| **Oracle** | Vue principale pour parcourir et rechercher les médias avec grille/liste, filtres et tri |
| **Nomenclatures** | Gestion des tags avec étiquettes, descriptions et interprétations |
| **Reviewer** | Liste de médias marqués pour révision |
| **Quiz** | Mode quiz interactif avec QCM, score et résultats |
| **Statistiques** | Analyses : fréquence des tags, compteurs, taux d'utilisation |
| **Import/Export** | Sauvegarde et restauration de la base de données en JSON |

### Capacités Spéciales

- **Annotations vidéo** : Marqueurs temporels avec tags associés, navigation image par image
- **Recherche floue** : Algorithme de scoring sur titre, description et tags
- **Raccourcis clavier** : Escape (fermer), flèches (navigation vidéo)
- **Thème clair/sombre** : Basculement dynamique avec variables CSS
- **Bilingue FR/EN** : 100+ clés de traduction

## Architecture Technique

### Stack Technologique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 18, Vite, Lucide Icons, CSS Variables |
| **Backend** | Express.js, Node.js, Multer |
| **Base de données** | SQLite (better-sqlite3), mode WAL |
| **Build** | Vite 5, Plugin React |

### Flux de Données

```
┌─────────────────────────────────────────────────────┐
│  Interface Utilisateur (Composants React)           │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  App.jsx (Gestion d'état centralisée)               │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Client API (src/api.js) - Wrapper fetch            │
└─────────────────────┬───────────────────────────────┘
                      ↓ HTTP/JSON
┌─────────────────────────────────────────────────────┐
│  Serveur Express (server/index.js)                  │
│  • CORS, Rate limiting, Validation                  │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Routes API (server/routes/)                        │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  SQLite (server/data/synergo.db)                    │
└─────────────────────────────────────────────────────┘

Fichiers statiques:
React → /resources → /public/resources/ (médias)
```

### Structure des Dossiers

```
synergo/
├── src/                          # Frontend React
│   ├── components/               # Composants React (18 fichiers)
│   │   ├── Sidebar.jsx           # Navigation avec badges
│   │   ├── OracleOverview.jsx    # Vue grille/liste des médias
│   │   ├── MediaDetail.jsx       # Lecteur vidéo + annotations
│   │   ├── MediaCard.jsx         # Carte média réutilisable
│   │   ├── Nomenclatures.jsx     # Gestion des tags
│   │   ├── ReviewerOverview.jsx  # Liste de révision
│   │   ├── QuizOverview.jsx      # Liste quiz + démarrage
│   │   ├── QuizMode.jsx          # Quiz interactif QCM
│   │   ├── AddResource.jsx       # Ajout multi-mode
│   │   ├── Statistics.jsx        # Statistiques et analyses
│   │   ├── Settings.jsx          # Import/Export/Reset
│   │   └── ...                   # Autres composants UI
│   ├── contexts/                 # Contextes React
│   │   └── ToastContext.jsx      # Système de notifications
│   ├── hooks/                    # Hooks personnalisés
│   │   ├── useDebounce.js        # Debounce (300ms)
│   │   └── useKeyboardShortcuts.js
│   ├── services/                 # Couche service
│   ├── utils/                    # Utilitaires
│   │   ├── search.js             # Recherche floue avec scoring
│   │   └── dataExport.js         # Export JSON/CSV
│   ├── App.jsx                   # État central, routage
│   ├── api.js                    # Client API
│   ├── db.js                     # Helpers de résolution de chemins
│   ├── i18n.js                   # Traductions (100+ clés)
│   ├── constants.js              # Constantes frontend
│   └── index.css                 # Styles globaux
├── server/                       # Backend Express
│   ├── routes/                   # Routes API
│   │   ├── media.js              # CRUD médias
│   │   ├── nomenclatures.js      # CRUD nomenclatures
│   │   ├── lists.js              # Listes review/quiz
│   │   └── upload.js             # Upload fichiers
│   ├── middleware/               # Middlewares
│   │   ├── errorHandler.js       # Gestion erreurs
│   │   └── validate.js           # Validation
│   ├── migrations/               # Migrations BDD
│   ├── db.js                     # Couche SQLite
│   ├── index.js                  # Point d'entrée serveur
│   └── config.js                 # Configuration
├── public/
│   └── resources/                # Fichiers médias
├── styles.css                    # Variables CSS et thèmes
├── vite.config.js                # Configuration Vite
└── package.json
```

## Endpoints API

### Base de Données

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/database` | Récupérer la base complète |
| POST | `/api/database/import` | Importer une sauvegarde |
| POST | `/api/database/reset` | Réinitialiser la base |

### Médias

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/media` | Liste tous les médias |
| GET | `/api/media/:id` | Récupérer un média |
| POST | `/api/media` | Créer un média |
| PUT | `/api/media/:id` | Mettre à jour un média |
| DELETE | `/api/media/:id` | Supprimer un média |
| GET | `/api/media/next-id` | Prochain ID pour nommage |

### Nomenclatures

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/nomenclatures` | Liste toutes les nomenclatures |
| POST | `/api/nomenclatures` | Créer une nomenclature |
| POST | `/api/nomenclatures/sync` | Upsert automatique |
| PUT | `/api/nomenclatures/:id` | Mettre à jour |
| DELETE | `/api/nomenclatures/:id` | Supprimer |

### Listes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/lists/review` | Liste de révision |
| POST | `/api/lists/review` | Ajouter à la révision |
| POST | `/api/lists/review/bulk` | Ajout en masse |
| DELETE | `/api/lists/review/:id` | Retirer de la révision |
| GET | `/api/lists/quiz` | Liste quiz |
| POST | `/api/lists/quiz` | Ajouter au quiz |
| POST | `/api/lists/quiz/bulk` | Ajout en masse |
| DELETE | `/api/lists/quiz/:id` | Retirer du quiz |

### Upload

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/upload` | Upload fichier (max 100MB) |
| GET | `/api/upload/files` | Liste fichiers disponibles |

## Schéma de Base de Données

### Table `media`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT | Identifiant unique |
| title | TEXT | Titre du média |
| description | TEXT | Description |
| src | TEXT | Nom de fichier ou URL |
| type | TEXT | 'video' ou 'photo' |
| tags | JSON | Tableau de tags |
| annotations | JSON | Annotations temporelles |
| fps | INTEGER | Images par seconde (défaut: 30) |
| source | TEXT | Source du média |
| publication_date | TEXT | Date de publication |
| added_at | TEXT | Date d'ajout |
| updated_at | TEXT | Date de modification |

### Table `nomenclatures`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT | Identifiant (= label) |
| label | TEXT | Étiquette du tag |
| description | TEXT | Description |
| interpretation | TEXT | Interprétation/signification |

### Tables `review_list` et `quiz_list`

| Colonne | Type | Description |
|---------|------|-------------|
| media_id | TEXT | FK vers media.id (CASCADE) |
| added_at | TEXT | Date d'ajout |

## Stratégie de Stockage des Médias

Les fichiers médias ne sont **PAS** stockés dans la base de données. Seuls les noms de fichiers sont stockés :

```
Base de données : "flower.mp4"
        ↓
Résolution : "/resources/flower.mp4"
        ↓
Fichier : /public/resources/flower.mp4
```

**Modes de stockage :**
1. **Fichiers locaux** : Placés dans `/public/resources/`
2. **URLs externes** : URLs http/https stockées et utilisées directement

## Patterns et Conventions

### Gestion d'État

- **App.jsx** est la source unique de vérité
- État centralisé avec `useState`, `useCallback`, `useMemo`
- **ToastContext** pour les notifications globales
- Chargement de la base complète au montage

### Composants

- **Container/Presentational** : App.jsx gère l'état, composants enfants sont présentationnels
- **Error Boundary** : Capture les erreurs React avec UI de fallback
- **Loading States** : Squelettes de chargement pendant la connexion

### Hooks Personnalisés

- `useDebounce(value, delay)` : Debounce 300ms pour la recherche
- `useKeyboardShortcuts()` : Gestion Escape, flèches

### Annotations Vidéo

Format des annotations :
```json
[
  { "time": 0.5, "label": "geste1" },
  { "time": 2.3, "label": "geste2" }
]
```

- Navigation image par image (FPS configurable, défaut 30)
- Contrôles : Play/Pause, ←/→ frames, ±1 seconde

### Recherche

Algorithme de scoring :
- Titre : +3x le score
- Description : +1x
- Tags : +2x par correspondance
- Bonus pour correspondance en début de mot

## Configuration

### Serveur (server/config.js)

| Paramètre | Valeur |
|-----------|--------|
| PORT | 3001 |
| CORS | localhost:5173, localhost:3000 |
| Rate limit | 500 requêtes / 15 min |
| Body limit | 10 MB |
| Upload max | 100 MB |
| FPS défaut | 30 |

### Frontend (src/constants.js)

| Constante | Valeur |
|-----------|--------|
| DEBOUNCE_DELAY | 300ms |
| TOAST_DURATION | 5000ms |
| MAX_TITLE_LENGTH | 200 |
| MAX_TAGS | 50 |
| MAX_ANNOTATIONS | 100 |

## Notes de Développement

- Le proxy Vite redirige `/api` vers le serveur Express (port 3001)
- SQLite utilise le mode WAL pour un meilleur accès concurrent
- La base de données est créée automatiquement au premier démarrage
- Migrations gérées avec système de versioning dans `server/migrations/`
- Sécurité : validation des entrées, sanitization des noms de fichiers, rate limiting

## Version

- **Application** : v2.0
- **API** : v1.0.0
