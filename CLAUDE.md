# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies (includes SQLite native module)
npm run dev          # Start both API server (3001) and Vite dev server (5173)
npm run client       # Start only the Vite dev server
npm run server       # Start only the API server
npm run build        # Create production build
npm run preview      # Preview production build
npm start            # Start production server
```

**Note:** No test framework or linting tools are currently configured.

## Application Overview

Synergo is a bilingual (EN/FR) React 18 SPA for cataloging and studying non-verbal gesture resources (videos and photos). The application enables users to:
- Browse and search a media library with advanced filtering
- Annotate videos with timestamped tags for gesture analysis
- Manage a nomenclature system for categorizing gestures
- Create review lists and interactive quizzes for learning
- Export/import database and statistics

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 SPA with Vite (v5.4.8)
- **Backend**: Express.js server (v4.21.2)
- **Database**: SQLite with better-sqlite3 (v11.7.0) using WAL mode
- **UI Icons**: lucide-react (v0.563.0)
- **File Upload**: multer (v2.0.2)

### Data Flow

```
React App (src/App.jsx)
    ↓ API calls
src/api.js (fetch wrapper)
    ↓ HTTP
Express Server (server/index.js)
    ↓
SQLite Database (server/data/synergo.db)
```

- **Frontend**: React SPA with central state in App.jsx
- **API Client**: `src/api.js` provides async functions for all CRUD operations
- **Backend**: Express.js REST API on port 3001
- **Database**: SQLite file stored at `server/data/synergo.db`

## Features & Views

### 1. Oracle (Media Browser)
Main view for browsing the media library:
- Grid/List view toggle with 3 size options (small, medium, large)
- Real-time fuzzy search with 300ms debounce
- Type filtering (all, videos, photos)
- Advanced tag-based filtering
- Sort options: date, title, type, tag count
- Statistics cards showing video/photo counts
- Video preview on card hover (auto-play after 500ms)
- Quick actions: Add to Review, Add to Quiz

### 2. Media Detail View
Full media inspection and editing:
- 70/30 layout (media left, info/annotations right)
- **Videos**: Frame-by-frame navigation at configurable FPS (default 30), timestamped annotations
- **Photos**: Image display with tag-based nomenclatures
- Edit mode for title, description, source, tags/annotations
- Action bar: Edit, Add to Review, Add to Quiz, Delete
- Keyboard: Enter saves, Escape closes

### 3. Nomenclatures (Tag Management)
Manage the gesture vocabulary:
- Table view with search/filter
- CRUD operations for nomenclatures (label, description, interpretation)
- Usage checking prevents deletion of in-use tags
- Auto-sync: new tags in media auto-create nomenclatures
- Locale-aware sorting (FR/EN)

### 4. Review List
Items marked for later review:
- Grid view of selected items
- Click to open detail view
- Remove from list functionality
- Badge count in sidebar

### 5. Quiz Mode
Interactive learning system:
- Multiple choice interface (4 options per question)
- Shuffled questions and answers
- Score tracking with grading (Excellent/Good/Average/Poor)
- Answer reveal with correct/incorrect feedback
- Results screen with detailed breakdown

### 6. Statistics
Data analysis and insights:
- Overview: Total resources, video/photo breakdown, nomenclature count
- Averages: Tags per resource, annotations per media
- Top 10 most used nomenclatures
- Unused nomenclatures and files detection
- Usage rate calculations

### 7. Settings
Data management:
- Database export (JSON full backup)
- Nomenclatures export (CSV)
- Database import from JSON file
- Database reset with confirmation

## API Endpoints

### Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/database` | Fetch full database (media, nomenclatures, lists) |
| POST | `/api/database/import` | Import full database from JSON |
| POST | `/api/database/reset` | Reset database to empty state |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media` | Get all media (supports `?limit=50&offset=0`) |
| GET | `/api/media/:id` | Get single media by ID |
| POST | `/api/media` | Create new media |
| PUT | `/api/media/:id` | Update media |
| DELETE | `/api/media/:id` | Delete media |
| GET | `/api/media/next-id` | Generate next ID (`?datePrefix&sourcePrefix&subjectPrefix`) |

### Nomenclatures
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nomenclatures` | Get all nomenclatures (60s cache) |
| GET | `/api/nomenclatures/:id` | Get single nomenclature |
| POST | `/api/nomenclatures` | Create new nomenclature |
| POST | `/api/nomenclatures/sync` | Upsert nomenclature (auto-sync from media) |
| PUT | `/api/nomenclatures/:id` | Update nomenclature |
| DELETE | `/api/nomenclatures/:id` | Delete nomenclature |

### Lists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lists/review` | Get review list |
| POST | `/api/lists/review` | Add single item to review |
| POST | `/api/lists/review/bulk` | Add multiple items to review |
| DELETE | `/api/lists/review/:mediaId` | Remove from review |
| DELETE | `/api/lists/review` | Clear review list |
| GET | `/api/lists/quiz` | Get quiz list |
| POST | `/api/lists/quiz` | Add single item to quiz |
| POST | `/api/lists/quiz/bulk` | Add multiple items to quiz |
| DELETE | `/api/lists/quiz/:mediaId` | Remove from quiz |
| DELETE | `/api/lists/quiz` | Clear quiz list |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/upload/files` | List files in /public/resources/ |
| POST | `/api/upload` | Upload file (max 100MB) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## Media Storage Strategy

Media files are NOT stored in the database. The database stores only filenames, and paths are constructed at runtime:

```
Database stores: "flower.mp4"
Runtime resolves to: "/resources/flower.mp4"
```

- **Local files**: Must be placed in `/public/resources/`
- **External URLs**: http/https URLs are stored and used directly
- **Supported video formats**: .mp4, .webm, .mov, .avi, .mkv
- **Supported image formats**: .jpg, .jpeg, .png, .gif, .webp, .bmp

## Database Schema (SQLite)

### Tables

**media**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier (format: `YYYYMMDD_SOURCE_SUBJECT_NNN`) |
| title | TEXT | Display title |
| description | TEXT | Optional description |
| src | TEXT | Filename or external URL |
| type | TEXT | 'video' or 'photo' |
| tags | JSON | Array of tag labels |
| annotations | JSON | Array of `{time, tags}` for videos |
| fps | INTEGER | Frame rate, default 30 |
| source | TEXT | Optional source attribution |
| publication_date | TEXT | Optional publication date |
| added_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**nomenclatures**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| label | TEXT | Display label (unique) |
| description | TEXT | Optional description |
| interpretation | TEXT | Optional interpretation/meaning |

**review_list / quiz_list**
| Column | Type | Description |
|--------|------|-------------|
| media_id | TEXT PRIMARY KEY | Foreign key to media.id (CASCADE DELETE) |
| added_at | DATETIME | When added to list |

## Key Modules

| File | Purpose |
|------|---------|
| `src/App.jsx` | Central state management, view routing, API calls |
| `src/api.js` | API client with all backend calls |
| `src/db.js` | Path resolution, filename utilities |
| `src/i18n.js` | Bilingual translations (EN/FR), 100+ keys |
| `src/constants.js` | Application constants, limits, extensions |
| `src/utils/search.js` | Fuzzy search algorithm with tag scoring |
| `src/utils/dataExport.js` | Export/import utilities (JSON, CSV) |
| `src/hooks/useDebounce.js` | Debounce hook for search (300ms) |
| `src/hooks/useKeyboardShortcuts.js` | Keyboard shortcut management |
| `src/contexts/ToastContext.jsx` | Toast notification system |
| `server/index.js` | Express server entry point |
| `server/db.js` | SQLite database layer (300+ lines) |
| `server/config.js` | Server configuration |
| `server/routes/` | API route handlers |
| `server/middleware/` | Error handling, validation, rate limiting |

## UI Components

### Design System
- **Styling**: CSS custom properties for theming, glassmorphism effects
- **Icons**: lucide-react for consistent iconography
- **Color palette**: Light/dark theme support
  - Light: bg #f7f8fb, text #0f172a, primary #7c3aed, accent #10b981
  - Dark: bg #0b1224, text #e5e7eb, primary #a855f7, accent #34d399
- **Animations**: Smooth transitions for theme, sidebar, view modes

### Key Components
| Component | Purpose |
|-----------|---------|
| `Sidebar` | Collapsible/pinnable navigation with badge counts |
| `OracleOverview` | Main media browser with filters and view modes |
| `MediaDetail` | Full media inspection and editing |
| `MediaCard` | Grid/list display with hover preview |
| `QuizMode` | Interactive quiz interface |
| `FilterPanel` | Type filter, tag multi-select, sort options |
| `ViewToggle` | Grid/list mode switcher with size controls |
| `ToastProvider` | Context-based notification system |
| `ErrorBoundary` | React error boundary with recovery |

## Search & Filtering

### Fuzzy Search Algorithm
- Searches: title, description, tags
- Tag matching: 2x score multiplier
- Title field: 3x multiplier vs description 1x
- Start-of-field bonus: 2x vs 1x
- Configurable threshold

### Hierarchical Tag Support
- Format: `R_C_E_3_1` (category_subcategory_type_level_variant)
- Tag similarity search for related items
- Scoring: category (1pt), subcategory (2pts), type (3pts), exact (10pts)

## Internationalization

- Languages: English (en) and French (fr)
- 100+ translation keys covering all UI text
- Key-based lookup: `t('keyName', { params })`
- Supports parameterized translations

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useDebounce` | Debounces value changes (default 300ms) |
| `useKeyboardShortcuts` | Keyboard event management, supports Ctrl+key |

**Keyboard Shortcuts:**
- `Ctrl+K`: Focus search
- `Ctrl+N`: New media
- `Escape`: Close modal/detail view

## Security Features

- **CORS**: Whitelist-based origin validation
- **Rate Limiting**: 500 requests per 15-minute window per IP
- **Input Validation**: Type checking, SQL injection prevention
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **File Upload**: MIME type validation, filename sanitization, 100MB limit

## Configuration

### Server Config (`server/config.js`)
- Port: 3000 or 3001
- Rate limit: 15 minutes window, 500 requests max
- Body size limit: 10MB
- Default FPS: 30
- API Version: 1.0.0

### Frontend Constants (`src/constants.js`)
- Debounce delay: 300ms
- Toast duration: 5000ms
- Max title: 200 chars
- Max description: 2000 chars
- Max tags: 50
- Max annotations: 100

## Development Notes

- Vite proxy forwards `/api` requests to the Express server (port 3001)
- SQLite uses WAL mode for better concurrent access
- Database file is created automatically on first server start
- Hot reload enabled in development
- Video annotation editing auto-syncs nomenclatures
