# Synergo

**Synergo** is an interactive catalog for managing and learning non-verbal gestural resources. The application allows you to catalog videos and photos of gestures, annotate them, organize them with a tag system (nomenclatures), and practice through a quiz mode.

## Features

### Oracle (Main View)
- Browse media in grid or list mode
- Fuzzy search on title, description, and tags
- Filter by type (video/photo) and by tags
- Sort by date, title, or relevance
- KPI cards with video/photo counters

### Media Management
- Add resources: local file, upload, or external URL
- Video player with advanced controls (play/pause, frame-by-frame, +/-1 sec)
- Temporal annotations with associated tags
- 70/30 detail view (media + information)

### Nomenclatures
- Tag management with labels, descriptions, and interpretations
- Automatic synchronization with media tags
- CSV export

### Work Lists
- **Reviewer**: Mark media for later review
- **Quiz**: Create a list of media for learning

### Quiz Mode
- Interactive multiple choice quiz (4 options)
- Randomly shuffled items
- Score and success percentage
- Answer review at the end

### Statistics
- Media and nomenclature counters
- Tag usage frequency
- Detection of unused files and nomenclatures

### Import/Export
- Database export to JSON
- Backup import
- Database reset

### Interface
- Light / dark theme
- Bilingual interface French / English
- Collapsible and pinnable sidebar
- Toast notifications
- Keyboard shortcuts

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start in development mode (API + Vite)
npm run dev
```

The application will be accessible at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

### Production Mode

```bash
# Build for production
npm run build

# Start production server
npm start
```

The application will be accessible at http://localhost:3001

## Docker Deployment

### Build the Docker Image

```bash
docker build --no-cache -t synergo:1.0.0 .
```

Use `--no-cache` to ensure all layers are rebuilt from scratch.

### Run with Docker Compose

Use the provided `docker-compose.yaml` file (adjust volume paths as needed):

```yaml
services:
  synergo:
    image: synergo:1.0.0
    container_name: synergo
    ports:
      - "3001:3001"
    volumes:
      - ./data/resources:/app/public/resources
      - ./data/db:/app/server/data
    restart: unless-stopped
```

Start the container:

```bash
docker compose up -d
```

### Volume Mounts

| Container Path | Purpose |
|---------------|---------|
| `/app/public/resources` | Media files (videos, photos) |
| `/app/server/data` | SQLite database |

These volumes ensure data persistence across container restarts and updates.

### Export Docker Image

```bash
docker image save -o synergo_1.0.0.tar synergo:1.0.0
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API server and Vite simultaneously |
| `npm run client` | Start only the Vite server |
| `npm run server` | Start only the API server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm start` | Start production server |

## Architecture

```
synergo/
├── src/                    # React Frontend
│   ├── components/         # React Components
│   ├── contexts/           # Contexts (notifications)
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilities (search, export)
│   ├── App.jsx             # Main component
│   ├── api.js              # API Client
│   └── i18n.js             # Translations
├── server/                 # Express Backend
│   ├── routes/             # API Routes
│   ├── middleware/         # Middlewares
│   ├── migrations/         # DB Migrations
│   ├── data/               # SQLite database location
│   ├── db.js               # SQLite layer
│   └── index.js            # Entry point
├── public/
│   └── resources/          # Media files
├── Dockerfile              # Docker build configuration
├── docker-compose.yaml         # Docker Compose configuration
└── package.json
```

### Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, Vite 5, Lucide Icons |
| Backend | Express.js, Node.js, Multer |
| Database | SQLite (better-sqlite3) |
| Container | Docker, multi-stage build |

## Media Resources Management

### Storage Structure

Media files are stored in `/public/resources/`. The database only contains filenames:

```
Database: "gesture-01.mp4"
       ↓
Resolution: "/resources/gesture-01.mp4"
       ↓
File: /public/resources/gesture-01.mp4
```

### Adding Resources

**Option 1: Existing file**
1. Place the file in `/public/resources/`
2. In the app, go to "Add Resource"
3. Select "Existing file"
4. Enter the filename (e.g., `gesture-01.mp4`)
5. Fill in the title and description

**Option 2: Upload**
1. In the app, go to "Add Resource"
2. Select "Upload"
3. Choose a file from your computer
4. The file will be automatically copied to `/public/resources/`

**Option 3: External URL**
1. In the app, go to "Add Resource"
2. Select "External URL"
3. Enter the complete URL (http/https)

### Supported Formats

| Type | Extensions |
|------|------------|
| Video | .mp4, .webm, .mov, .avi, .mkv |
| Photo | .jpg, .jpeg, .png, .gif, .webp, .bmp |

## Database

The SQLite database is stored in `server/data/synergo.db` and is automatically created on first startup.

### Tables

- **media**: Videos and photos with metadata, tags, and annotations
- **nomenclatures**: Tag definitions
- **review_list**: Media marked for review
- **quiz_list**: Media in the quiz list

## Configuration

### Server (port 3001)

- Rate limiting: 500 requests / 15 minutes
- Max body size: 10 MB
- Max upload size: 100 MB

### Frontend

- Search debounce: 300ms
- Toast duration: 5 seconds
- Default FPS: 30

## Architecture Benefits

- **No browser storage limit**: Media files are on the file system
- **Performance**: Files served statically and cached
- **Persistence**: Robust SQLite database
- **Portability**: JSON export/import for backups + Docker support
- **Works offline**: Once files are in place

## License

MIT
