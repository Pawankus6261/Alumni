# BGI Alumento

BGI Alumento is a responsive alumni portal for Bansal Institute of Science & Technology (BIST), Bhopal. It brings alumni profiles, BISTAA membership, events, and campus memories into one place.

## Features

- Alumni directory with profile search and filters
- BISTAA lifetime membership registration and status views
- BISTAA active member directory and digital membership passes
- Events and reunion RSVP flow with a digital entry pass
- Categorized campus and alumni photo gallery
- Responsive desktop and mobile navigation and layouts
- Clean client-side routes, including `/directory`, `/bistaa`, `/events`, and `/gallery`

## Built with

- React 18
- Vite 5
- Tailwind CSS 4 (Vite plugin)
- Lucide React icons

## Requirements

- Node.js 20 (see `.nvmrc`)
- npm

## Run locally

```bash
npm ci
npm run dev
```

Vite serves the app at [http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the production site into `dist/` |
| `npm run preview` | Preview the production build locally |

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/directory` | Alumni directory |
| `/bistaa` | Active BISTAA members |
| `/bistaa-registration` | BISTAA lifetime membership registration |
| `/register` | Standard alumni registration |
| `/status` | Registration status |
| `/events` | Events and reunions |
| `/gallery` | Photo gallery |
| `/admin` | Admin verification view |

The app also recognizes legacy hash URLs and redirects them to the matching clean path. Static hosting must be configured to serve `index.html` for these client-side routes. The included `public/_redirects` file provides this fallback on Netlify.

## Project structure

```text
src/
  components/    Shared navigation, footer, dialogs, and UI components
  data/          Sample alumni, events, and gallery content
  pages/         App pages
  App.jsx        Route selection and app state
  index.css      Global styles and responsive design
public/
  assets/        Images used by the app
  fonts/         Web fonts used by the app
  _redirects     Netlify SPA route fallback
legacy_prototype/  Earlier standalone prototype
PRD.md             Product requirements reference
SRS.md             Software requirements reference
```

## Data and deployment notes

This repository currently contains a frontend prototype. Sample content is defined in `src/data/mockData.js`, and registration changes are saved in the browser's `localStorage`. The forms, verification view, and generated passes are client-side demonstrations; this project does not currently include a backend API, database, authentication service, payment processing, or email delivery.

Build the static site with `npm run build` and deploy the contents of `dist/`. For hosting providers other than Netlify, configure a history fallback so direct requests to routes such as `/directory` serve `index.html`.

## License

No license has been selected for this repository yet. Add a license file before granting reuse or redistribution rights.
