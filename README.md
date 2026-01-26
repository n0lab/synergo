# Synergo

Synergo is an interactive catalog for non-verbal gesture resources built with **Vite** and **React**. Media nomenclatures, Reviewer/Quiz selections are stored in the browser (localStorage), while media files (videos and photos) are served from a local **`/public/resources/`** folder.

## Getting started

```bash
npm install
npm run dev
```

The `dev` script starts the Vite development server with hot reload. Open the printed URL (http://localhost:5173 by default) to explore the platform.

## **Important: Resource Management**

### Media Storage Structure

All video and photo files must be placed in the **`/public/resources/`** folder:

```
synergo/
├── public/
│   └── resources/
│       └── ...                 # Add your files here
├── src/
├── package.json
└── README.md
```

### How It Works

1. **Files Location**: Place all your media files (videos/photos) in `/public/resources/`
2. **Database Storage**: Only the **filename** is stored in the database (e.g., `"flower.mp4"`)
3. **Path Resolution**: The app automatically constructs the full path `/resources/filename` when displaying media
4. **No Base64**: Unlike the previous version, files are NOT converted to base64 or stored in localStorage

### Adding New Resources

**Option 1: Add existing file from `/resources/`**
1. Place your file in `/public/resources/`
2. In the app, go to "Add Resource"
3. Enter the filename in the "File name in /resources/" field (e.g., `my-video.mp4`)
4. Fill in title and description
5. Click "Add Resource"

**Option 2: Upload a local file**
1. In the app, go to "Add Resource"
2. Use the file picker to select a file from your computer
3. The app will generate a unique filename
4. **IMPORTANT**: You must manually copy the file to `/public/resources/` with the generated name
5. The app will show you the exact filename to use

### Example Files

The repository does not include any default resources or nomenclatures. To use the application:
- Add your own media files to `/public/resources/`
- Or use external URLs (http/https) which will be stored and used directly

### Benefits of This Approach

✅ **No localStorage limits**: Media files don't count toward browser storage quotas  
✅ **Better performance**: Files are cached by the browser naturally  
✅ **Easier to manage**: Simple file system organization  
✅ **Works offline**: Once files are in the folder, no internet needed  
✅ **Version control friendly**: Can exclude `/public/resources/` from git if needed

## Features

- Collapsible sidebar with navigation for Oracle, Reviewer, Quiz, and Nomenclatures
- Light/dark theme toggle
- French/English language switcher for the full interface
- Oracle view with KPI cards (video/photo counts) that double as filters, quick add to Reviewer/Quiz lists, and tag-aware search
- Detail view with 70/30 layout, video player (play/pause, frame-by-frame, keyboard navigation) or photo display, clickable nomenclatures, and action bar (Edit, To Review, To Quiz)
- Nomenclatures section with table-based management (add, edit, delete with confirmation) covering tags detected from media and manually created entries
- Reviewer and Quiz lists fed from Oracle filters or detail actions
- **Resource files stored in `/public/resources/` folder**
- Only metadata and references stored in localStorage

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: create a production build
- `npm run preview`: preview the production build

## Folder Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Toast)
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── data.js             # Seed data (empty by default)
├── db.js               # Database management + resource path helpers
├── i18n.js             # Internationalization
├── main.jsx            # App entry point
└── index.css           # Global styles

public/
└── resources/          # 📂 MEDIA FILES GO HERE
    └── ...
```

## Notes

- Database (metadata, nomenclatures, lists) is stored in **localStorage** under the key `synergo-db`
- Media files are served from `/public/resources/` and referenced by filename
- The app works fully offline once files are in the `/resources/` folder
- For production deployment, ensure the `/resources/` folder is included in your build
