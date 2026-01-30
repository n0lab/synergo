# CLAUDE.md

This file guides Claude Code (claude.ai/code) to work with the code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies (includes native SQLite module)
npm run dev          # Start API server (3001) and Vite server (5173)
npm run client       # Start only the Vite server
npm run server       # Start only the API server
npm run build        # Create production build
npm run preview      # Preview production build
npm start            # Start production server
```

**Note:** No testing framework or linting tool is currently configured.

## Application Overview

**Synergo** is an interactive catalog for managing non-verbal gestural resources (videos and photos). The application allows cataloging, annotating, searching, and learning gestures through different usage modes.

### Main Features

| Feature | Description |
|---------|-------------|
| **Oracle** | Main view for browsing and searching media with grid/list, filters, and sorting |
| **Nomenclatures** | Tag management with labels, descriptions, and interpretations |
| **Reviewer** | List of media marked for review |
| **Quiz** | Interactive quiz mode with MCQ, score, and results |
| **Statistics** | Analytics: tag frequency, counters, usage rates |
| **Import/Export** | Database backup and restore in JSON |

### Special Capabilities

- **Video annotations**: Temporal markers with associated tags, frame-by-frame navigation
- **Fuzzy search**: Scoring algorithm on title, description, and tags
- **Keyboard shortcuts**: Escape (close), arrows (video navigation)
- **Light/dark theme**: Dynamic switching with CSS variables
- **Bilingual FR/EN**: 100+ translation keys

## Technical Architecture

### Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Lucide Icons, CSS Variables |
| **Backend** | Express.js, Node.js, Multer |
| **Database** | SQLite (better-sqlite3), WAL mode |
| **Build** | Vite 5, React Plugin |

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│  User Interface (React Components)                  │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  App.jsx (Centralized state management)             │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  API Client (src/api.js) - Fetch wrapper            │
└─────────────────────┬───────────────────────────────┘
                      ↓ HTTP/JSON
┌─────────────────────────────────────────────────────┐
│  Express Server (server/index.js)                   │
│  • CORS, Rate limiting, Validation                  │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  API Routes (server/routes/)                        │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  SQLite (server/data/synergo.db)                    │
└─────────────────────────────────────────────────────┘

Static files:
React → /resources → /public/resources/ (media)
```

### Folder Structure

```
synergo/
├── src/                          # React Frontend
│   ├── components/               # React Components (18 files)
│   │   ├── Sidebar.jsx           # Navigation with badges
│   │   ├── OracleOverview.jsx    # Media grid/list view
│   │   ├── MediaDetail.jsx       # Video player + annotations
│   │   ├── MediaCard.jsx         # Reusable media card
│   │   ├── Nomenclatures.jsx     # Tag management
│   │   ├── ReviewerOverview.jsx  # Review list
│   │   ├── QuizOverview.jsx      # Quiz list + start
│   │   ├── QuizMode.jsx          # Interactive MCQ quiz
│   │   ├── AddResource.jsx       # Multi-mode add
│   │   ├── Statistics.jsx        # Statistics and analytics
│   │   ├── Settings.jsx          # Import/Export/Reset
│   │   └── ...                   # Other UI components
│   ├── contexts/                 # React Contexts
│   │   └── ToastContext.jsx      # Notification system
│   ├── hooks/                    # Custom Hooks
│   │   ├── useDebounce.js        # Debounce (300ms)
│   │   └── useKeyboardShortcuts.js
│   ├── services/                 # Service layer
│   ├── utils/                    # Utilities
│   │   ├── search.js             # Fuzzy search with scoring
│   │   └── dataExport.js         # JSON/CSV export
│   ├── App.jsx                   # Central state, routing
│   ├── api.js                    # API Client
│   ├── db.js                     # Path resolution helpers
│   ├── i18n.js                   # Translations (100+ keys)
│   ├── constants.js              # Frontend constants
│   └── index.css                 # Global styles
├── server/                       # Express Backend
│   ├── routes/                   # API Routes
│   │   ├── media.js              # Media CRUD
│   │   ├── nomenclatures.js      # Nomenclatures CRUD
│   │   ├── lists.js              # Review/quiz lists
│   │   └── upload.js             # File upload
│   ├── middleware/               # Middlewares
│   │   ├── errorHandler.js       # Error handling
│   │   └── validate.js           # Validation
│   ├── migrations/               # DB Migrations
│   ├── db.js                     # SQLite layer
│   ├── index.js                  # Server entry point
│   └── config.js                 # Configuration
├── public/
│   └── resources/                # Media files
├── styles.css                    # CSS variables and themes
├── vite.config.js                # Vite configuration
└── package.json
```

## API Endpoints

### Database

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/database` | Get complete database |
| POST | `/api/database/import` | Import a backup |
| POST | `/api/database/reset` | Reset database |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media` | List all media |
| GET | `/api/media/:id` | Get a media |
| POST | `/api/media` | Create a media |
| PUT | `/api/media/:id` | Update a media |
| DELETE | `/api/media/:id` | Delete a media |
| GET | `/api/media/next-id` | Next ID for naming |

### Nomenclatures

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nomenclatures` | List all nomenclatures |
| POST | `/api/nomenclatures` | Create a nomenclature |
| POST | `/api/nomenclatures/sync` | Automatic upsert |
| PUT | `/api/nomenclatures/:id` | Update |
| DELETE | `/api/nomenclatures/:id` | Delete |

### Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lists/review` | Review list |
| POST | `/api/lists/review` | Add to review |
| POST | `/api/lists/review/bulk` | Bulk add |
| DELETE | `/api/lists/review/:id` | Remove from review |
| GET | `/api/lists/quiz` | Quiz list |
| POST | `/api/lists/quiz` | Add to quiz |
| POST | `/api/lists/quiz/bulk` | Bulk add |
| DELETE | `/api/lists/quiz/:id` | Remove from quiz |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file (max 100MB) |
| GET | `/api/upload/files` | List available files |

## Database Schema

### Table `media`

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Unique identifier |
| title | TEXT | Media title |
| description | TEXT | Description |
| src | TEXT | Filename or URL |
| type | TEXT | 'video' or 'photo' |
| tags | JSON | Array of tags |
| annotations | JSON | Temporal annotations |
| fps | INTEGER | Frames per second (default: 30) |
| source | TEXT | Media source |
| publication_date | TEXT | Publication date |
| added_at | TEXT | Date added |
| updated_at | TEXT | Date modified |

### Table `nomenclatures`

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Identifier (= label) |
| label | TEXT | Tag label |
| description | TEXT | Description |
| interpretation | TEXT | Interpretation/meaning |

### Tables `review_list` and `quiz_list`

| Column | Type | Description |
|--------|------|-------------|
| media_id | TEXT | FK to media.id (CASCADE) |
| added_at | TEXT | Date added |

## Media Storage Strategy

Media files are **NOT** stored in the database. Only filenames are stored:

```
Database: "flower.mp4"
        ↓
Resolution: "/resources/flower.mp4"
        ↓
File: /public/resources/flower.mp4
```

**Storage modes:**
1. **Local files**: Placed in `/public/resources/`
2. **External URLs**: http/https URLs stored and used directly

## Patterns and Conventions

### State Management

- **App.jsx** is the single source of truth
- Centralized state with `useState`, `useCallback`, `useMemo`
- **ToastContext** for global notifications
- Complete database loaded on mount

### Components

- **Container/Presentational**: App.jsx manages state, child components are presentational
- **Error Boundary**: Catches React errors with fallback UI
- **Loading States**: Loading skeletons during connection

### Custom Hooks

- `useDebounce(value, delay)`: 300ms debounce for search
- `useKeyboardShortcuts()`: Escape, arrow key handling

### Video Annotations

Annotation format:
```json
[
  { "time": 0.5, "label": "gesture1" },
  { "time": 2.3, "label": "gesture2" }
]
```

- Frame-by-frame navigation (configurable FPS, default 30)
- Controls: Play/Pause, ←/→ frames, ±1 second

### Search

Scoring algorithm:
- Title: +3x the score
- Description: +1x
- Tags: +2x per match
- Bonus for word-start matches

## Configuration

### Server (server/config.js)

| Parameter | Value |
|-----------|-------|
| PORT | 3001 |
| CORS | localhost:5173, localhost:3000 |
| Rate limit | 500 requests / 15 min |
| Body limit | 10 MB |
| Upload max | 100 MB |
| Default FPS | 30 |

### Frontend (src/constants.js)

| Constant | Value |
|----------|-------|
| DEBOUNCE_DELAY | 300ms |
| TOAST_DURATION | 5000ms |
| MAX_TITLE_LENGTH | 200 |
| MAX_TAGS | 50 |
| MAX_ANNOTATIONS | 100 |

## Development Notes

- Vite proxy redirects `/api` to Express server (port 3001)
- SQLite uses WAL mode for better concurrent access
- Database is automatically created on first startup
- Migrations managed with versioning system in `server/migrations/`
- Security: input validation, filename sanitization, rate limiting

## Version

- **Application**: v2.0
- **API**: v1.0.0
