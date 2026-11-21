# Alumni Association Management System

A full stack alumni community platform with a React and TypeScript single page app and a Django REST API. It supports role-based access for administrators, management staff, and alumni.

## Project features

- Role-specific dashboards and protected routes for `ADMIN`, `MANAGEMENT`, and `ALUMNI` accounts
- Alumni profiles, profile photos, batch records, and a searchable alumni directory
- Public image gallery, with image management restricted by API permissions
- Event publishing and alumni participation
- Donation records and reporting views
- JWT login and token refresh
- Django administration site and API health endpoint
- Responsive UI with the project logo and login animation

## Repository layout

```text
backend/       Django project, REST API, migrations, and management commands
frontend/      React, TypeScript, Vite application
start-project.ps1  Windows launcher for both local services
vercel.json    Vercel Services routing configuration
```

## Requirements

- Python 3.10 or newer
- Node.js 20 or newer and npm
- PowerShell on Windows to use the provided launch scripts

## Run locally on Windows

From the project root, install the backend and frontend dependencies:

```powershell
python -m pip install -r backend\requirements.txt
cd frontend
npm ci
cd ..
```

Start Django and Vite together:

```powershell
.\start-project.ps1
```

The launcher runs database migrations, creates local sample records on a fresh database, starts the backend and frontend in separate PowerShell windows, and waits for both health checks. No `.env` file is required for local development. Open <http://127.0.0.1:5173/login>.

The local API is at <http://127.0.0.1:8001/api/v1/>. The health check is <http://127.0.0.1:8001/api/v1/health/> and Django admin is at <http://127.0.0.1:8001/admin/>.

### Run each service manually

Install dependencies first as shown above. In one PowerShell window:

```powershell
cd backend
.\start-backend.ps1
```

In a second PowerShell window:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

To build the frontend for production:

```powershell
cd frontend
npm run build
```

The generated frontend files are written to `frontend/dist/` and should not be committed.

## API overview

All application endpoints use the `/api/v1/` prefix.

| Area | Endpoint |
| --- | --- |
| Health | `GET /api/v1/health/` |
| Login | `POST /api/v1/auth/login/` |
| Refresh JWT | `POST /api/v1/auth/token/refresh/` |
| Users | `/api/v1/users/` |
| Alumni profiles | `/api/v1/alumni/` |
| Batches | `/api/v1/batches/` |
| Gallery | `/api/v1/gallery/` |
| Events | `/api/v1/events/` |
| Donations | `/api/v1/donations/` |
| Analytics | `GET /api/v1/reports/analytics/` |

The Django admin is served separately at `/admin/`. API permissions depend on the endpoint and the signed-in account's role.

## Deploy to Vercel

The root `vercel.json` defines frontend and backend services and routes `/api/`, `/media/`, and `/admin/`. Import the repository at its root in Vercel and use the Services deployment configuration supported by your Vercel account/team.

Configure these **production environment variables** in Vercel Project Settings:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Yes | Private Django signing key; use a long, random value |
| `DATABASE_URL` | Yes | Hosted PostgreSQL connection URL |
| `DJANGO_ALLOWED_HOSTS` | If needed | Comma-separated hostnames; defaults to `.vercel.app` on Vercel |
| `CORS_ALLOWED_ORIGINS` | If needed | Comma-separated frontend origins when frontend and API use different origins |
| `CSRF_TRUSTED_ORIGINS` | If needed | Comma-separated trusted HTTPS origins for Django admin/forms |

The backend build checks that `DJANGO_SECRET_KEY` and `DATABASE_URL` exist and applies migrations. Local development uses SQLite by default; SQLite on Vercel is temporary and is not a persistent production database.

### Persistent image uploads

Vercel function storage is temporary. For profile and gallery images to persist between deployments, configure an S3-compatible object storage bucket with:

- `AWS_STORAGE_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- Optional: `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`, and `AWS_S3_CUSTOM_DOMAIN`

Do not commit production secrets, database URLs, or local environment files to GitHub.

### Initial production administrator

After deployment and database configuration, create an administrator using Django's `createsuperuser` management command against the production database. New Django superusers are assigned the application's `ADMIN` role automatically. Create or invite any other accounts through the application’s account management flow.

## Git hygiene

The repository `.gitignore` excludes dependency folders, virtual environments, local databases and media, environment files, caches, and generated frontend output. Commit source code, migrations, lockfiles, and configuration files; do not commit `node_modules/`, `.venv/`, `frontend/dist/`, or secrets.
