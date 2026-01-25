# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Create production build
npm run preview      # Preview production build
```

**Note:** No test framework or linting tools are currently configured.

## Architecture Overview

Synergo is a React 18 SPA for cataloging non-verbal gesture resources (videos/photos). It uses Vite for building and stores all application data in browser localStorage.

### Data Flow

```
App.jsx (central state) → db.js (persistence) → localStorage (synergo-db key)
```

- **App.jsx**: Container component managing all state (db, theme, language, navigation)
- **db.js**: Database layer with `loadDatabase()`, `persistDatabase()`, and resource path helpers
- **Components**: Presentational components receive data/callbacks as props

### Media Storage Strategy

Media files are NOT stored in localStorage or the database. The database stores only filenames, and paths are constructed at runtime:

```
Database stores: "flower.mp4"
Runtime resolves to: "/resources/flower.mp4"
```

Files must be placed in `/public/resources/`. External URLs (http/https) are stored and used directly.

### Key Modules

| File | Purpose |
|------|---------|
| `src/App.jsx` | Central state management, all CRUD operations |
| `src/db.js` | localStorage persistence, path resolution helpers |
| `src/i18n.js` | Bilingual translations (EN/FR), 100+ keys |
| `src/utils/search.js` | Fuzzy search with tag scoring, hierarchical category filtering |
| `src/utils/dataExport.js` | JSON/CSV export, database import with validation |
| `src/contexts/ToastContext.jsx` | Notification system |

### Database Schema

The `synergo-db` localStorage key contains:
- `media[]`: Videos/photos with titles, filenames, tags, annotations
- `nomenclatures[]`: Tag definitions with categories
- `reviewList[]`: Media IDs marked for review
- `quizzList[]`: Media IDs in quiz mode

### Component Patterns

- **Container/Presentational**: App.jsx holds state, child components are presentational
- **Context API**: ToastProvider wraps app for notifications
- **Custom Hooks**: `useDebounce` (search, 300ms), `useKeyboardShortcuts` (Ctrl+K, Ctrl+N, Escape)
- **Error Boundary**: Catches React errors in ErrorBoundary.jsx

### Video Annotations

Videos support time-stamped annotations stored as `annotations[]` with each annotation having a `time` (in seconds) and associated tags. Default FPS is 30.
