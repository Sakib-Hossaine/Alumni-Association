# Alumni Collective

React/Vite frontend and Django REST API.

## Run locally on Windows

Install Python 3.12+ and Node.js 20+ once. On a fresh checkout, install dependencies:

```powershell
python -m pip install -r backend\requirements.txt
cd frontend
npm ci
cd ..
```

Then from the project folder run:

```powershell
.\start-project.ps1
```

The launcher applies migrations, creates local demo records on a fresh database, starts Django and Vite in separate PowerShell windows, and waits for the API and database health check before reporting ready. If a stale or unrelated process owns either required port, it reports that instead of pretending the app is ready. No `.env` file is needed for local development. Open <http://127.0.0.1:5173/login> after the launcher says both servers are ready.

Local demo sign-in:

- Admin: `admin@example.com` / `ChangeMe123!`
- Management: `management@example.com` / `ChangeMe123!`
- Alumni: `alumni5@example.com` / `ChangeMe123!`

These demo credentials are for local development only. Change or remove them before exposing a deployment to users.

## Deploy to Vercel

The root `vercel.json` routes the frontend and Django API as Vercel Services. Import the repository at its root and select the **Services** framework preset. Deploying the backend and frontend together this way requires Vercel Services to be enabled for the account/team.

Local development works without environment files. A production deployment still needs a private `DJANGO_SECRET_KEY` and a hosted PostgreSQL `DATABASE_URL` configured in Vercel Project Settings. The Django settings use SQLite only when no hosted database URL is supplied, which is suitable for local development but not persistent on Vercel. The backend build checks those production values and applies database migrations before deployment.

For durable profile and gallery images, configure an S3-compatible object storage bucket with `AWS_STORAGE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. Set `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`, and optionally `AWS_S3_CUSTOM_DOMAIN` for providers such as Cloudflare R2. Without a bucket, uploads use temporary function storage and can disappear when Vercel replaces or scales an instance.

The frontend defaults to same-origin `/api/v1`, so it needs no `VITE_API_URL` when both services share the Vercel domain.

After the first production deploy, create the initial admin with Django's `createsuperuser` command connected to the production `DATABASE_URL`. New Django superusers receive the app's `ADMIN` role automatically.
