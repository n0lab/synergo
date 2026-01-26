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

## Architecture Overview

Synergo is a React 18 SPA for cataloging non-verbal gesture resources (videos/photos). It uses Vite for the frontend and an Express + SQLite backend for data persistence.

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

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/database` | Get full database |
| POST | `/api/database/import` | Import database |
| POST | `/api/database/reset` | Reset database |
| GET/POST/PUT/DELETE | `/api/media` | Media CRUD |
| GET/POST/PUT/DELETE | `/api/nomenclatures` | Nomenclatures CRUD |
| GET/POST/DELETE | `/api/lists/review` | Review list operations |
| GET/POST/DELETE | `/api/lists/quiz` | Quiz list operations |

### Media Storage Strategy

Media files are NOT stored in the database. The database stores only filenames, and paths are constructed at runtime:

```
Database stores: "flower.mp4"
Runtime resolves to: "/resources/flower.mp4"
```

Files must be placed in `/public/resources/`. External URLs (http/https) are stored and used directly.

### Key Modules

| File | Purpose |
|------|---------|
| `src/App.jsx` | Central state management, API calls |
| `src/api.js` | API client with all backend calls |
| `src/db.js` | Path resolution helpers (no localStorage) |
| `src/i18n.js` | Bilingual translations (EN/FR), 100+ keys |
| `src/utils/search.js` | Fuzzy search with tag scoring |
| `server/index.js` | Express server entry point |
| `server/db.js` | SQLite database layer |
| `server/routes/` | API route handlers |

### Database Schema (SQLite)

**Tables:**
- `media`: Videos/photos with titles, filenames, tags (JSON), annotations (JSON)
- `nomenclatures`: Tag definitions with label, description, interpretation
- `review_list`: Media IDs marked for review (foreign key to media)
- `quiz_list`: Media IDs in quiz mode (foreign key to media)

### Component Patterns

- **Container/Presentational**: App.jsx holds state, child components are presentational
- **Context API**: ToastProvider wraps app for notifications
- **Custom Hooks**: `useDebounce` (search, 300ms), `useKeyboardShortcuts` (Ctrl+K, Ctrl+N, Escape)
- **Error Boundary**: Catches React errors in ErrorBoundary.jsx
- **Loading States**: App shows loading/error states while connecting to server

### Video Annotations

Videos support time-stamped annotations stored as `annotations[]` with each annotation having a `time` (in seconds) and associated tags. Default FPS is 30.

### Development Notes

- Vite proxy forwards `/api` requests to the Express server (port 3001)
- SQLite uses WAL mode for better concurrent access
- Database file is created automatically on first server start
