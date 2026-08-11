---
description: Local development, production deployment, verification, and troubleshooting.
---

# Deployment & Setup

## Deployment & Setup

### Prerequisites

* Node.js
* npm or yarn
* Git
* PostgreSQL or Supabase

### Local setup

1. Clone the repository and open the project root.
2. Install backend dependencies from `backend/`.
3. Install frontend dependencies from `frontend/`.
4. Copy each `.env.example` file to its local `.env` file.
5. Configure environment values without committing secrets.
6. Start the backend, then start the frontend.

```ini
# backend/.env
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
CLIENT_URL=<your-frontend-url>
```

```ini
# frontend/.env
VITE_API_URL=<your-api-url>
```

Use the package scripts defined by each project’s `package.json` for development, build, and start commands.

### Production architecture

```
GitHub
├── Frontend → Vercel
└── Backend → Render
                 ↓
         Supabase PostgreSQL
```

#### Frontend deployment

Deploy the frontend to Vercel from the repository. Set `VITE_API_URL` to the production backend API URL before building. Configure SPA refresh handling so application routes resolve to the frontend entry point.

#### Backend deployment

Deploy the backend to Render from the repository. Configure its production build and start commands from `backend/package.json`. Set `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_URL` in the Render environment.

#### Database and CORS

Use the Supabase PostgreSQL connection value as `DATABASE_URL`. Configure CORS to allow only `CLIENT_URL`. Keep JWT secrets and database URLs in managed environment settings.

> **Secret handling**
>
> Never commit production secrets. Use placeholders in examples and platform-managed environment variables in deployments.

### Production verification

1. Open the Vercel URL and refresh a nested application route.
2. Sign in and verify authenticated API requests use the production API URL.
3. Test an authorized protected operation.
4. Confirm the backend connects to Supabase PostgreSQL.

### Troubleshooting

| Symptom                     | Check                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| `404` after refresh         | Configure SPA route fallback on the frontend host                  |
| CORS failure                | Ensure `CLIENT_URL` exactly matches the deployed frontend origin   |
| `401`                       | Check the bearer token, token expiration, and JWT configuration    |
| `403`                       | Verify the authenticated role has the required backend grant       |
| `500`                       | Inspect backend logs without exposing secrets                      |
| `DATABASE_URL` error        | Verify the full environment value and deployment configuration     |
| PostgreSQL connection error | Verify Supabase connectivity and database credentials              |
| Render build/start error    | Verify the selected root directory and package scripts             |
| Missing `dist` files        | Run the configured frontend build and publish its output directory |
