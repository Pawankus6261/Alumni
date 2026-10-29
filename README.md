# BGI Alumento

**BGI Alumento** is the alumni and lifetime-membership portal for Bansal Institute of Science & Technology (BIST), Bhopal. It provides a public alumni experience backed by a FastAPI service and a role-protected administration console.

> Designed and developed by the **DevLinkHub Team**.

## Contents

- [Overview](#overview)
- [Public website](#public-website)
- [Administration console](#administration-console)
- [Technology](#technology)
- [Project layout](#project-layout)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Database and imported records](#database-and-imported-records)
- [Images and uploads](#images-and-uploads)
- [Configuration reference](#configuration-reference)
- [API overview](#api-overview)
- [Production deployment](#production-deployment)
- [Security and privacy](#security-and-privacy)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## Overview

The project contains two applications:

1. A responsive React website for alumni profiles, BISTAA membership, events, and campus photographs.
2. A FastAPI backend that reads the institution's imported alumni records and stores new registrations, membership applications, event RSVPs, and administrative changes.

The website expects the API to be available. It displays section-level loading and connection states when API data is being retrieved or cannot be loaded. No demonstration alumni records are bundled in the public UI.

## Public website

- **Home** — institutional introduction, campus imagery, 25-year legacy, selected alumni profiles, and directory entry points.
- **Alumni directory** — search and browse alumni profiles, with available graduation, course, employer, location, and profile-photo information.
- **BISTAA members** — browse current lifetime members and their linked alumni information; member identity passes include unique QR codes.
- **BISTAA registration** — submit a lifetime-membership application, UPI transaction reference, and payment-slip image for administrator review.
- **Standard registration** — submit an alumni profile for verification; enrollment number and profile image may be omitted.
- **Status lookup** — look up an application using its enrollment number or transaction reference and view the resulting status or membership pass when available.
- **Events** — browse gatherings and RSVP with attendee details. Successful RSVPs produce a unique event-entry pass.
- **Gallery** — browse campus and alumni photographs grouped into sections, with full-image viewing.
- **Navigation and footer** — responsive navigation, BGI contact information, social links, and an email-based subscription request to the Alumni Office.

## Administration console

The `/admin` route provides a protected workspace with a collapsible, fixed sidebar and a scrollable content area. Available sections include:

- **Dashboard** — current alumni, pending-review, BISTAA, and event summaries.
- **Gallery** — add, edit, reorder, feature, and remove managed gallery entries.
- **Verified and pending alumni** — search, edit, verify, return to pending, reject, or delete alumni records.
- **Alumni import** — preview CSV rows, report common data issues and duplicates, then import valid records into the review queue.
- **Profile photos** — set an image URL or upload a JPEG, PNG, or WebP image (maximum 5 MB) while editing an alumni record.
- **Events and RSVPs** — manage event records and review or remove RSVP entries.
- **Departments** — create and update course or department records.
- **BISTAA applications** — inspect payment-slip submissions, approve or reject membership applications, and review submitted payment details.
- **BISTAA members** — view and edit membership information, link a member to an alumni profile, and update member details.
- **Admin accounts** — create admin accounts, reset passwords, change roles, and remove accounts. At least one administrator account is retained.
- **Reports and analytics** — view available alumni, batch, college, and event summaries and export supported reports as CSV.
- **Activity log and notifications** — view administrative audit entries and mark notifications as read.
- **Backup and restore** — download or restore database snapshots (super-admin access required).

Admin roles are `super_admin`, `reviewer`, `content_manager`, and `read_only`. The backend enforces permissions on protected endpoints; the user interface also adapts actions to the signed-in role. The super admin can perform all permitted administrative operations.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, JavaScript, Tailwind CSS 4, Lucide React |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Database | SQLAlchemy with SQLite or a MySQL/MariaDB-compatible `DATABASE_URL` |
| Password storage | PBKDF2-HMAC-SHA256 with per-password random salts |
| Admin session | Signed bearer token with an 8-hour expiry |
| QR codes | `qrcode` package and frontend QR identity utilities |
| File handling | FastAPI multipart uploads; local persistent directories by default |
| CI | GitHub Actions builds the frontend and checks backend Python syntax |

## Project layout

```text
.
├── backend/
│   ├── app.py                 # FastAPI app, routes, auth, persistence
│   ├── import_dump.py         # Safe conversion of the supplied MariaDB dump
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Backend configuration template
├── public/
│   ├── _redirects             # Netlify SPA fallback
│   ├── assets/                # Public site imagery
│   └── fonts/                 # Local typefaces
├── src/
│   ├── components/            # Shared navigation, dialogs, cards, notices
│   ├── pages/                 # Public pages and admin console
│   ├── utils/                 # Shared identity and QR helpers
│   ├── api.js                 # Frontend API client
│   ├── App.jsx                # Routes and application state
│   └── index.css              # Design system and responsive styling
├── .env.example               # Frontend API configuration template
├── LICENSE                    # BGI Alumento proprietary license
├── README.md
└── package.json
```

## Requirements

- Node.js 20 or newer and npm
- Python 3.11 or newer
- The alumni database dump supplied by the institution, if you need the existing alumni records

## Run locally

### 1. Install frontend dependencies

From the repository root:

```bash
npm ci
```

### 2. Configure and start the API

The database dump is private and is intentionally not included in Git. Put the supplied dump in a private local location, then convert it to the local SQLite database:

```bash
cd backend
python import_dump.py "C:\path\to\alumni_dump.sql"
```

The importer converts the recognized MariaDB schema and rows into `backend/alumni.sqlite3`; it does not execute the dump as SQL. Review the import summary and keep the input dump protected.

Create a backend environment file from the example:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Edit `backend/.env`. Set a unique, randomly generated `JWT_SECRET_KEY` of at least 32 characters. Set a bootstrap admin username and a password of at least 8 characters. The bootstrap account is created or updated from these values when the API starts, so protect the environment file and keep its values private.

Create a virtual environment, install the API dependencies, and start FastAPI:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The API health check is available at [http://localhost:8000/api/health](http://localhost:8000/api/health). FastAPI's interactive API documentation is at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Configure and start the frontend

In a second terminal, return to the repository root and start Vite:

```bash
cd ..
npm run dev
```

The site opens at [http://localhost:3000](http://localhost:3000). During development, Vite proxies `/api`, `/media/profiles`, and `/media/gallery` to `http://127.0.0.1:8000`.

Optional frontend configuration can be copied from `.env.example` to `.env`. For a separately hosted API, set `VITE_API_URL` to its public API base URL and configure the backend's `CORS_ORIGINS` with the exact frontend origin.

### Admin login

Sign in at `/admin` with the username and password configured using `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD` in `backend/.env`. Do not put real credentials in this README, source control, or screenshots.

## Database and imported records

- The local default is SQLite at `backend/alumni.sqlite3`.
- `DATABASE_URL` can point SQLAlchemy to a MySQL/MariaDB database instead.
- Startup adds the API's own authentication, audit, review, registration-detail, RSVP, and managed-gallery tables as needed.
- The original legacy user table is not used for modern admin authentication because its password format is from the previous system. Admin passwords are stored in the API's own account table.
- The imported alumni dump, generated SQLite database, database backups, and user records are excluded from Git by `.gitignore`.
- Administrators can export supported lists and reports as CSV and can use the protected backup and restore tools.

The site does not include a copy of the institutional database. A new checkout therefore needs the supplied dump imported or a configured database containing the expected source tables before alumni and membership data can be shown.

## Images and uploads

- Public campus and event images may use remote asset URLs or repository-owned public assets.
- Admin-managed gallery uploads are stored under `backend/gallery_images/` by default.
- Alumni profile uploads are stored under `backend/profile_images/` by default and served through `/media/profiles/`.
- Payment slips are stored under `backend/private_uploads/` and are served through an authenticated admin endpoint, not a public static route.
- Image uploads accept JPEG, PNG, and WebP, up to 5 MB.
- Generated backups are stored under `backend/backups/`; daily snapshots retain the latest 14 files.

The default upload implementation writes to local disk. For a production platform with ephemeral application filesystems, configure persistent volumes or replace the local file persistence with private object storage (for example, an S3-compatible bucket) before accepting live uploads. Keep payment slips private and use signed or authenticated retrieval rather than public bucket access.

## Configuration reference

### Frontend `.env`

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | Base path for the FastAPI service | `/api` |

### Backend `backend/.env`

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy database connection | `sqlite:///./alumni.sqlite3` |
| `JWT_SECRET_KEY` | Secret for signing admin sessions; use a random value of 32+ characters | Set privately; do not reuse the example |
| `BOOTSTRAP_ADMIN_USERNAME` | Bootstrap administrator name | Set privately |
| `BOOTSTRAP_ADMIN_PASSWORD` | Bootstrap administrator password (8+ characters) | Set privately |
| `CORS_ORIGINS` | Comma-separated allowed website origins | `http://localhost:3000` |
| `UPLOAD_DIR` | Private payment-slip storage directory | `./private_uploads` |
| `PROFILE_IMAGE_DIR` | Alumni profile-photo directory | `./profile_images` |
| `GALLERY_IMAGE_DIR` | Managed gallery-image directory | `./gallery_images` |
| `BACKUP_DIR` | Database backup directory | `./backups` |

All values above are examples, not production credentials. Store production settings in the hosting provider's secret and environment-variable manager.

## API overview

The FastAPI service exposes these route groups:

| Route group | Purpose |
| --- | --- |
| `GET /api/health` | Service/database health check |
| `GET /api/public/bootstrap` | Small public bootstrap payload |
| `GET /api/alumni`, `GET /api/members`, `GET /api/courses` | Public directory and membership data |
| `GET /api/events`, `GET /api/gallery` | Public event and gallery data |
| `POST /api/register`, `POST /api/bistaa/applications` | Alumni and lifetime-membership submissions |
| `GET /api/bistaa/status`, `GET /api/bistaa/slips/{id}` | Application-status and payment-slip retrieval flow |
| `POST /api/events/{id}/rsvp` | Event registration and entry-pass creation |
| `/api/admin/*` | Protected review, content management, reporting, users, import, and backup operations |

Admin endpoints use bearer-token authentication. The backend checks role permissions for write operations. See [FastAPI API docs](http://localhost:8000/docs) while the local server is running for request schemas and response details.

## Production deployment

### Frontend

Build the static site:

```bash
npm ci
npm run build
```

Deploy the generated `dist/` directory to a static host. Configure the host to serve `index.html` for client-side routes such as `/directory`, `/bistaa`, `/events`, and `/gallery`. The repository includes `public/_redirects` for Netlify-style SPA fallback. Configure `VITE_API_URL` for the deployed API before building when it is hosted on another origin.

### Backend

Deploy FastAPI as a separate service or behind the same domain's reverse proxy. Configure the database URL, strong secret, bootstrap admin account, exact CORS origin(s), HTTPS, and persistent/private storage paths in the host environment. Do not deploy with the example secret, development reload mode, or an open CORS policy. Schedule and test secure off-site backups for the database and uploads.

The included GitHub Actions workflow builds the frontend and checks Python syntax on pushes and pull requests. It does not deploy either application.

## Security and privacy

- Never commit `.env`, `backend/.env`, SQL dumps, SQLite files, payment slips, profile uploads, backups, or database exports.
- `.gitignore` excludes the local database, private upload folders, backup folders, environment files, dependencies, and build output.
- Keep the GitHub repository private unless the rights holder has approved public distribution. The proprietary license does not set repository visibility.
- Set a unique production `JWT_SECRET_KEY`; changing it invalidates existing admin tokens.
- Use HTTPS in production and restrict CORS to trusted frontend origins.
- Protect payment-slip and backup access; do not publish private uploads as static files.
- Do not reuse legacy passwords or publish administrator credentials.
- Review institutional permission and the relevant third-party terms before publishing logos, fonts, photos, and other assets.

## Known limitations

- Email delivery is not integrated. The footer subscription action prepares an email request to the Alumni Office; it does not store mailing-list consent or send a message automatically.
- Payment collection and automated payment reconciliation are not integrated. BISTAA application payment references and slips are reviewed by an administrator.
- Local file storage is the default. Persistent production storage or an object-storage integration must be configured for the chosen hosting environment.
- This repository provides a build and syntax-check workflow, not a full automated test suite or deployment pipeline.
- Public alumni information depends on the data available in the configured/imported database; missing source details are not fabricated by the website.

## Contributing

This is a proprietary institutional project. Coordinate changes with the BGI Alumento project owner before contributing. Do not submit personal alumni records, credentials, database exports, or payment documents in pull requests or issues.

## Credits

- Product: **BGI Alumento**, the BIST Bhopal alumni portal
- Institutional affiliation: **Bansal Institute of Science & Technology (BIST), Bhopal / Bansal Group of Institutes (BGI)**
- Design and development: **DevLinkHub Team** — [devlinkhub.in](https://devlinkhub.in)
- Alumni office contact: [info@bistbpl.in](mailto:info@bistbpl.in)
- Institutional contact: **+91 91099 54681 · +91 91099 54642**

## License

The original project materials are covered by the [BGI Alumento Proprietary License](LICENSE). This is not an open-source license and grants no general permission to use, modify, or redistribute the project. Third-party libraries, fonts, images, logos, and other materials remain subject to their respective licenses and terms.
