# Synergo

Synergo is an interactive catalog for non-verbal gesture resources built with **Vite** and **React**. Media, nomenclatures, and Reviewer/Quiz selections are stored in the browser (localStorage) so your additions persist between sessions.

## Getting started

```bash
npm install
npm run dev
```

The `dev` script starts the Vite development server with hot reload. Open the printed URL (http://localhost:5173 by default) to explore the platform.

## Features
- Collapsible sidebar with navigation for Oracle, Reviewer, Quiz, and Nomenclatures
- Light/dark theme toggle
- French/English language switcher for the full interface
- Oracle view with KPI cards (video/photo counts) that double as filters, quick add to Reviewer/Quiz lists, and tag-aware search
- Detail view with 70/30 layout, video player (play/pause, frame-by-frame, keyboard navigation) or photo display, clickable nomenclatures, and action bar (Edit, To Review, To Quiz)
- Nomenclatures section with table-based management (add, edit, delete with confirmation) covering tags detected from media and manually created entries
- Reviewer and Quiz lists fed from Oracle filters or detail actions

## Scripts
- `npm run dev`: start the dev server
- `npm run build`: create a production build
- `npm run preview`: preview the production build
