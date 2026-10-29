# Contributing to BGI Alumento

Thank you for helping improve BGI Alumento, the alumni portal for Bansal Institute of Science & Technology (BIST), Bhopal. Contributions should keep alumni information accurate, protect personal data, and remain consistent with the existing design and architecture.

This is a proprietary project. Please coordinate with the project owner before preparing or submitting changes. A contribution does not change the terms of the [project license](LICENSE).

## Project stack

- Frontend: React, Vite, JavaScript, Tailwind CSS, and Lucide React
- Backend: FastAPI, Python, SQLAlchemy, and SQLite or MySQL/MariaDB
- Frontend code: `src/`
- Backend code: `backend/`

## Development setup

### Frontend

1. Install Node.js 20 or newer and npm.
2. From the repository root, install dependencies:

   ```bash
   npm ci
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

The frontend is served at `http://localhost:3000`.

### Backend

1. Install Python 3.11 or newer.
2. If you have been authorized to use the institutional database, import the supplied SQL dump using `backend/import_dump.py`. Keep the dump in a private location; it must never be added to Git.
3. From `backend/`, create a virtual environment, install dependencies, and configure the local environment:

   ```bash
   python -m venv .venv
   # Windows PowerShell: .venv\Scripts\Activate.ps1
   # macOS/Linux: source .venv/bin/activate
   python -m pip install -r requirements.txt
   ```

   Copy `backend/.env.example` to `backend/.env` and set a private database URL, a unique random `JWT_SECRET_KEY` (at least 32 characters), bootstrap admin credentials, and the allowed CORS origin. Never share or commit the populated environment file.

4. Start the API from `backend/`:

   ```bash
   uvicorn app:app --reload --port 8000
   ```

Open a second terminal at the repository root to run the frontend. Vite proxies API and media requests to the local backend.

See [README.md](README.md) for the complete setup and configuration reference.

## Implementation guidelines

- Keep changes focused and follow the existing React/Vite and FastAPI structure.
- Reuse existing API helpers, shared components, styles, and design tokens where possible.
- Preserve responsive behavior for narrow mobile screens, tablets, and desktop layouts.
- Make forms keyboard-accessible, label controls clearly, and provide useful loading, success, empty, and error states.
- Keep admin permissions enforced by the backend; hiding a button in the UI is not access control.
- Validate uploaded file types and sizes on the server. Keep payment slips and backups private.
- Avoid fabricating alumni, membership, event, or analytics records. Treat imported personal data as confidential.
- Keep API changes compatible with the frontend, and update the relevant documentation when configuration or behavior changes.

## Before opening a pull request

1. Review the full diff and remove temporary files, debug output, and unrelated edits.
2. Check affected pages at mobile and desktop widths, including loading, empty, and error states where relevant.
3. Run the production frontend build and resolve build errors:

   ```bash
   npm run build
   ```

4. For backend changes, check Python syntax:

   ```bash
   python -m py_compile backend/app.py
   ```

5. Update the README or other documentation if setup, environment variables, API behavior, or user-visible functionality changed.
6. Confirm `git diff --check` reports no whitespace errors and ensure no private data or credentials are included.

## Pull request description

Include:

- A concise summary of what changed and why.
- The user-visible behavior affected, if any.
- The checks you ran and their results.
- Screenshots for visual changes, with personal information removed.
- Any limitations, migrations, or configuration changes reviewers need to know.

Use a clear title, for example: `feat: improve mobile directory filters` or `fix: handle missing profile photos`.

## Keep private data out of Git

Do not commit or attach:

- `.env` files, passwords, API keys, session tokens, or production configuration.
- The alumni SQL dump, SQLite database, database exports, or real alumni records.
- Payment slips, uploaded profile photos, gallery originals, or backups containing private data.
- `node_modules/`, `.venv/`, `__pycache__/`, or generated `dist/` output.

The repository `.gitignore` excludes common local and private files, but check the final diff before pushing. If a secret or personal record is accidentally committed, contact the project owner immediately; deleting it in a later commit does not remove it from Git history.
