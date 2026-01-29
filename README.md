# Synergo

Synergo is a bilingual (EN/FR) interactive catalog for non-verbal gesture resources built with **React 18**, **Vite**, and an **Express + SQLite** backend. The application enables cataloging, annotating, and studying videos and photos of gestures with a nomenclature system.

## Getting Started

```bash
npm install          # Install dependencies (includes SQLite native module)
npm run dev          # Start both API server (3001) and Vite dev server (5173)
```

Open http://localhost:5173 to explore the platform. The API server runs on port 3001.

## Features

### Oracle (Media Browser)
- Grid/List view with adjustable card sizes (small, medium, large)
- Real-time fuzzy search across titles, descriptions, and tags
- Filter by type (videos, photos) and tags
- Sort by date, title, type, or tag count
- Statistics cards showing video/photo counts
- Video preview on hover
- Quick actions: Add to Review, Add to Quiz

### Media Detail View
- 70/30 layout with media player and metadata panel
- **Videos**: Frame-by-frame navigation at configurable FPS (default 30)
- **Photos**: Full image display with tags
- Timestamped annotations for videos
- Edit mode for all metadata
- Keyboard shortcuts: Enter to save, Escape to close

### Nomenclatures (Tag Management)
- Table view with search and filter
- Add, edit, delete nomenclatures (label, description, interpretation)
- Auto-sync: new tags in media automatically create nomenclatures
- Usage tracking prevents deletion of in-use tags

### Review List
- Curated list of items for review
- Quick access from sidebar with badge count
- Add/remove items from Oracle or Detail view

### Quiz Mode
- Multiple choice questions (4 options per question)
- Randomized questions and answers
- Score tracking with grading system
- Detailed results breakdown

### Statistics
- Total resources, videos, photos breakdown
- Average tags per resource
- Top 10 most used nomenclatures
- Unused nomenclatures and files detection

### Settings
- Database export (JSON backup)
- Nomenclatures export (CSV)
- Database import from JSON
- Database reset

### Additional Features
- Light/dark theme toggle
- French/English language switcher
- Collapsible/pinnable sidebar
- Toast notifications
- Keyboard shortcuts (Ctrl+K search, Ctrl+N new media, Escape close)

## Media Storage

Media files are stored in **`/public/resources/`**, not in the database. The database stores only filenames:

```
Database stores: "gesture.mp4"
Runtime resolves: "/resources/gesture.mp4"
```

### Adding Resources

**Option 1: Local files**
1. Place files in `/public/resources/`
2. Use "Add Resource" in the app
3. Enter the filename or use the file browser

**Option 2: External URLs**
- Enter http/https URLs directly
- URLs are stored and used as-is

**Option 3: Upload**
- Use the built-in upload feature
- Files are automatically saved to `/public/resources/`

### Supported Formats
- **Videos**: .mp4, .webm, .mov, .avi, .mkv
- **Images**: .jpg, .jpeg, .png, .gif, .webp, .bmp

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (API + Vite) |
| `npm run client` | Start only Vite dev server |
| `npm run server` | Start only API server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm start` | Start production server |

## Project Structure

```
synergo/
├── public/
│   └── resources/           # Media files (videos, photos)
├── server/
│   ├── data/
│   │   └── synergo.db       # SQLite database (auto-created)
│   ├── routes/              # API route handlers
│   ├── middleware/          # Express middleware
│   ├── db.js                # Database layer
│   ├── config.js            # Server configuration
│   └── index.js             # Express server entry
├── src/
│   ├── components/          # React components
│   ├── contexts/            # React contexts (Toast)
│   ├── hooks/               # Custom hooks (useDebounce, useKeyboardShortcuts)
│   ├── utils/               # Utilities (search, dataExport)
│   ├── api.js               # API client
│   ├── db.js                # Path resolution helpers
│   ├── i18n.js              # Translations (EN/FR)
│   ├── constants.js         # App constants
│   ├── App.jsx              # Main component with state
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── package.json
└── vite.config.js
```

## Architecture

```
React App (src/App.jsx)
    ↓ API calls
API Client (src/api.js)
    ↓ HTTP requests
Express Server (server/index.js)
    ↓ SQL queries
SQLite Database (server/data/synergo.db)
```

### Database Schema

- **media**: Videos/photos with metadata, tags (JSON), annotations (JSON)
- **nomenclatures**: Tag definitions with label, description, interpretation
- **review_list**: Media IDs marked for review
- **quiz_list**: Media IDs for quiz mode

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/database` | Full database export |
| `GET/POST/PUT/DELETE /api/media` | Media CRUD |
| `GET/POST/PUT/DELETE /api/nomenclatures` | Nomenclatures CRUD |
| `GET/POST/DELETE /api/lists/review` | Review list operations |
| `GET/POST/DELETE /api/lists/quiz` | Quiz list operations |
| `POST /api/upload` | File upload |
| `GET /api/health` | Health check |

## Configuration

### Server (server/config.js)
- Port: 3001 (dev) / 3000 (prod)
- Rate limit: 500 requests per 15 minutes
- Max upload: 100MB

### Frontend (src/constants.js)
- Debounce: 300ms
- Toast duration: 5000ms
- Max tags: 50 per media
- Max annotations: 100 per video

## Development Notes

- Vite proxies `/api` requests to Express server (port 3001)
- SQLite uses WAL mode for concurrent access
- Database auto-created on first server start
- Hot reload enabled in development
- No test framework configured

## License

MIT
