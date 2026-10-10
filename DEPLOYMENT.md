# Ledgerly Production Deployment Guide (Hostinger + Vercel)

This document provides exact, step-by-step instructions to deploy the Ledgerly monorepo:
- **Backend (NestJS API):** Hostinger Node.js Runtime
- **Frontend (Next.js App Router):** Vercel
- **Database & Auth:** Supabase PostgreSQL + Auth
- **AI Processing:** Groq API

---

## 1. Prerequisites & Environment Setup

### Required Services & Versions
- **Node.js:** v20.x or v22.x LTS
- **Hostinger Plan:** Web Hosting with Node.js Application Support or Hostinger VPS (Ubuntu 22.04 LTS with Nginx reverse proxy)
- **Vercel Account:** Hobby or Pro tier
- **Supabase Cloud Project:** Active PostgreSQL + Auth instance
- **Groq Cloud API Key:** Active key with `llama-3.3-70b-versatile` quota

---

## 2. Hostinger Backend Setup (NestJS API)

### Option A: Hostinger Managed Node.js App Manager
1. **Repository Root:** Select repository root directory (`.`).
2. **Node.js Version:** Select `20.x` or `22.x`.
3. **Application Root / Working Directory:** `.` (Monorepo root)
4. **Build Command:**
   ```bash
   npm run build:api
   ```
   *(This builds `@ledgerly/shared-types` first, then compiles NestJS into `apps/api/dist/main.js`)*
5. **Start Command / Entry Point:**
   ```bash
   npm run start:api
   ```
   *Alternatively direct Node entry:* `node apps/api/dist/main.js`

### Option B: Hostinger VPS (PM2 + Nginx)
If using a Hostinger VPS with SSH access:
```bash
# 1. Clone repository
git clone https://github.com/your-username/expense-tracker-ai.git /var/www/ledgerly
cd /var/www/ledgerly

# 2. Install dependencies & build API
npm ci
npm run build:api

# 3. Start with PM2
pm2 start apps/api/dist/main.js --name "ledgerly-api" --env production
pm2 save
```

### Hostinger Nginx Reverse Proxy Configuration (HTTPS)
Ensure your Nginx server block forwards headers to NestJS on port `3001` (or `$PORT`):
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 3. Hostinger Environment Variables

Set these environment variables in Hostinger's environment panel or `.env` file inside `apps/api`:

| Variable Name | Required | Example / Description |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Optional | `3001` (or platform assigned port) |
| `SUPABASE_URL` | Yes | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `your-supabase-service-role-key` |
| `CORS_ORIGIN` | Yes | `https://ledgerly.vercel.app` *(or comma-separated origins)* |
| `GROQ_API_KEY` | Yes | `gsk_your_groq_api_key` |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` |

> ⚠️ **Important:** `SUPABASE_URL` must not contain a trailing `/rest/v1/` suffix.

---

## 4. Vercel Frontend Setup (Next.js Web)

1. Connect your repository to **Vercel**.
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to `Next.js`.
4. **Build Command:**
   ```bash
   npm run build:web
   ```
   *(Or default `next build` if Vercel automatically runs workspace root install)*
5. **Output Directory:** `.next` (default).

---

## 5. Vercel Environment Variables

In Vercel Project Settings -> **Environment Variables**, add:

| Variable Name | Required | Example / Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `your-supabase-anon-key` |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.yourdomain.com` |

> 🔒 **Security Notice:** Do NOT add `SUPABASE_SERVICE_ROLE_KEY` or `GROQ_API_KEY` to Vercel. All secret keys remain exclusively on the Hostinger NestJS backend.

---

## 6. Supabase Production Configuration

1. **Authentication Redirect URLs:**
   - Navigate to **Supabase Dashboard -> Authentication -> URL Configuration**.
   - Set **Site URL** to `https://ledgerly.vercel.app` (or custom domain).
   - Add **Redirect URLs**:
     - `https://ledgerly.vercel.app/**`
     - `https://ledgerly.vercel.app/login`
2. **Database Verification:**
   - Confirm RLS policies are enabled on all tables (`transactions`, `categories`, `ai_drafts`, `loans`, `loan_repayments`).
   - Verify category seed data exists in `categories` table.

---

## 7. Pre-Deployment Verification & Testing

Run these commands locally prior to triggering deployment:

```bash
# 1. Build all monorepo packages
npm run build

# 2. Execute API unit tests
npm test --workspace=apps/api

# 3. Typecheck web frontend
npx tsc --noEmit --project apps/web/tsconfig.json
```

---

## 8. Smoke Testing & Health Checks

Once deployed, verify production health:

1. **API Health Check:**
   ```bash
   curl -i https://api.yourdomain.com/health
   ```
   *Expected Response (`200 OK`):*
   ```json
   {"status":"ok","timestamp":"...","uptime":12.34}
   ```
2. **CORS Preflight Test:**
   ```bash
   curl -i -X OPTIONS https://api.yourdomain.com/transactions \
     -H "Origin: https://ledgerly.vercel.app" \
     -H "Access-Control-Request-Method: GET"
   ```
   *Expected Response:* `204 No Content` or `200 OK` with `Access-Control-Allow-Origin: https://ledgerly.vercel.app`.

---

## 9. Rollback Procedures

- **Hostinger Rollback:**
  - PM2: `pm2 restart ledgerly-api` or revert git commit and execute `npm run build:api && pm2 restart ledgerly-api`.
- **Vercel Rollback:**
  - Select previous successful deployment in Vercel Dashboard and click **Promote to Production**.

---

## 10. Deployment Readiness Status

- [x] Monorepo npm workspace resolution verified
- [x] NestJS production build (`npm run build:api`) compiled and verified
- [x] Next.js frontend build (`npm run build:web`) compiled and verified
- [x] Production CORS configuration updated for multi-origin support
- [x] `.env.example` templates created for both backend and frontend
- [x] Secrets excluded in `.gitignore`
- [x] Backend entry point `node apps/api/dist/main.js` tested successfully
