# RUNBOOK — CBCK Youth Forum

**Version:** 1.0.1  
**Last updated:** 15 July 2026  
**Live URL:** [https://cbckyouthforum.live](https://cbckyouthforum.live)  
**Repo:** [https://github.com/cbckweb-live/youth-forum](https://github.com/cbckweb-live/youth-forum)

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Deploying to Vercel](#2-deploying-to-vercel)
3. [Admin Login Setup](#3-admin-login-setup)
4. [Database Keepalive Workflow](#4-database-keepalive-workflow)
5. [Database Backup Workflow](#5-database-backup-workflow)
6. [How to Restore from a Backup](#6-how-to-restore-from-a-backup)
7. [Pre-Launch Gatekeeper](#7-pre-launch-gatekeeper)
8. [How to Add a New Admin User](#8-how-to-add-a-new-admin-user)

---

## 1. Environment Variables

### 1.1 Vercel (production, preview, development)

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | ✅ Yes | Supabase project REST API URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase public anon key (safe for client) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Same as `SUPABASE_URL`, exposed to browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Same as `SUPABASE_ANON_KEY`, exposed to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service_role key (admin bypass — keep secret) |
| `SENTRY_DSN` | Optional | Server-side Sentry error tracking DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Browser-side Sentry error tracking DSN |

**Where to find Supabase values:**  
Supabase Dashboard → **Project Settings** → **API** → Project URL (for `SUPABASE_URL`) and `anon` / `service_role` keys.

**Where to find Sentry values:**  
Sentry Dashboard → **Settings** → **Projects** → `javascript-nextjs` → **Client Keys (DSN)**.

### 1.2 GitHub Actions Secrets

| Secret | Required | Purpose | Where Used |
|---|---|---|---|
| `SUPABASE_URL` | ✅ Yes | REST API URL for keepalive & backup upload | `supabase-keepalive.yml`, `backup.yml` |
| `SUPABASE_ANON_KEY` | ✅ Yes | Anon key for keepalive ping | `supabase-keepalive.yml` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Upload backup files to Supabase Storage | `backup.yml` |
| `SUPABASE_DATABASE_URL` | ✅ Yes | Full connection string for `pg_dump` | `backup.yml` |

**`SUPABASE_DATABASE_URL` format:**
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

Find it in: **Supabase Dashboard → Project Settings → Database → Connection string** (URI mode).

### 1.3 Local Development (`.env.local`)

```env
SUPABASE_URL=https://emsfthlfptmysgzpectv.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_URL=https://emsfthlfptmysgzpectv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# Optional:
SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
```

---

## 2. Deploying to Vercel

### 2.1 Automatic Deploy (Recommended)

Every push to `master` triggers an automatic production deploy via GitHub → Vercel integration.

### 2.2 Manual Deploy from CLI

```bash
# Login (one-time)
vercel login

# Link project (one-time)
vercel link --project youth-forum

# Deploy to production
vercel deploy --prod --yes
```

### 2.3 Post-Deploy Checklist

- [ ] Visit `https://cbckyouthforum.live` — page loads without errors
- [ ] Visit `/coming-soon` — gatekeeper page renders correctly
- [ ] If gatekeeper is bypassed: verify a few public pages render (events, gallery, etc.)
- [ ] Visit `/admin` — login page loads
- [ ] Check Vercel deployment logs for build errors
- [ ] Verify Sentry is capturing errors (trigger a test or check dashboard)

---

## 3. Admin Login Setup

### 3.1 First-Time Admin Creation

The admin panel uses **Supabase Auth** (email/password). There is no public registration — admin users must be created through the Supabase dashboard.

**Steps:**

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Invite user** or **Add user**
3. Enter the admin's email and a temporary password
4. The new user can sign in at `/admin` with those credentials
5. After first login, navigate to `/auth/update-password` to set a new password

### 3.2 Granting Admin Role

By default, new users have no special role. To grant admin access:

1. Go to **Supabase Dashboard → SQL Editor**
2. Run this SQL (replace `user-email@example.com`):

```sql
-- Grant admin role to an existing user
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'user-email@example.com';
```

3. The user must sign out and sign back in for the role change to take effect.

### 3.3 Admin Login URL

- **Login page:** `https://cbckyouthforum.live/admin`
- **Dashboard:** `https://cbckyouthforum.live/admin/dashboard`
- **Password update:** `https://cbckyouthforum.live/auth/update-password`

### 3.4 Password Reset

Users can reset their password from the Supabase Auth flow, or you can:

1. **Supabase Dashboard → Authentication → Users** → click the user → **Send reset password email**
2. Or use the SQL Editor:

```sql
-- Generate a password reset link (valid for 1 hour)
SELECT extensions.uuid_generate_v4(); -- Not needed, use Supabase UI instead
```

---

## 4. Database Keepalive Workflow

**File:** `.github/workflows/supabase-keepalive.yml`

### Purpose

Supabase's **free tier** pauses projects after 7 days of inactivity. When paused, the database goes into read-only mode and eventually shuts down — causing the website to fail.

This workflow prevents that by sending a lightweight REST request to the Supabase API **every 3 days**:

```
GET /rest/v1/events?select=id&limit=1
```

This is enough activity to keep the database "alive" and prevent auto-pausing.

### What It Does

- Runs on a cron schedule: `0 6 */3 * *` (every 3 days at 6:00 AM UTC)
- Can also be triggered manually from **GitHub → Actions → Supabase Keep-Alive → Run workflow**
- Sends a single SELECT query to the `events` table
- Logs the HTTP response code (expected: 2xx)
- Fails loudly if Supabase returns an error, so you know if something's wrong

### Required GitHub Secrets

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Monitoring

If the workflow fails:
1. Check if the Supabase project is still active
2. Verify the secrets in GitHub Actions are still correct
3. Manually trigger the workflow to re-test

---

## 5. Database Backup Workflow

**File:** `.github/workflows/backup.yml`

### Purpose

Creates a full PostgreSQL dump of the Supabase database and stores it as both:
1. A **storage object** in Supabase Storage (bucket: `db-backups`)
2. A **GitHub Actions artifact** (retained for 90 days)

### Schedule

- Runs automatically every Sunday at 3:00 AM UTC
- Can be triggered manually from **GitHub → Actions → Supabase Database Backup → Run workflow**

### What It Produces

Each backup is a gzip-compressed SQL dump named:
```
backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz
```

### Required GitHub Secrets

- `SUPABASE_DATABASE_URL` — Full connection string (`postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`)
- `SUPABASE_URL` — REST API URL
- `SUPABASE_SERVICE_ROLE_KEY` — For uploading backup to Supabase Storage

### Storage Bucket

Backups are uploaded to the `db-backups` bucket in Supabase Storage.  
**If it doesn't exist**, create it:

1. **Supabase Dashboard → Storage → New Bucket**
2. Name: `db-backups`
3. Public: **off** (backups are accessed via service_role key only)
4. Click **Create bucket**

---

## 6. How to Restore from a Backup

### 6.1 Download the Latest Backup

**Option A — From GitHub Actions artifacts:**

1. Go to **GitHub → Actions → Supabase Database Backup**
2. Click the most recent successful workflow run
3. Under **Artifacts**, download `db-backup`
4. Extract the `.sql.gz` file

**Option B — From Supabase Storage:**

1. Go to **Supabase Dashboard → Storage → db-backups**
2. Find the most recent `.sql.gz` file
3. Download it

### 6.2 Restore to the Current Supabase Project

**⚠️ This will overwrite existing data. Proceed with caution.**

```bash
# 1. Decompress the backup
gunzip backup_2026-07-15_12-18-26.sql.gz

# 2. Restore using psql
psql "postgresql://postgres:PASSWORD@db.emsfthlfptmysgzpectv.supabase.co:5432/postgres" \
  --file backup_2026-07-15_12-18-26.sql \
  --sslmode=require
```

Replace `PASSWORD` with the current Supabase database password (get it from **Supabase Dashboard → Project Settings → Database**).

### 6.3 Restore to a Local Database (for testing)

```bash
# 1. Create a local database
createdb youth_forum_restore

# 2. Decompress the backup
gunzip backup_2026-07-15_12-18-26.sql.gz

# 3. Restore
psql youth_forum_restore --file backup_2026-07-15_12-18-26.sql
```

### 6.4 Restore to a Different Supabase Project

```bash
# 1. Decompress
gunzip backup_2026-07-15_12-18-26.sql.gz

# 2. Restore (pointing to the new project's connection string)
psql "postgresql://postgres:NEW_PASSWORD@db.NEW_PROJECT_REF.supabase.co:5432/postgres" \
  --file backup_2026-07-15_12-18-26.sql \
  --sslmode=require
```

### 6.5 Verify the Restore

After restoring, check:
- [ ] The website loads without errors
- [ ] Content (events, posts, gallery, etc.) appears correctly
- [ ] Admin login works
- [ ] Admin dashboard shows the expected records

---

## 7. Pre-Launch Gatekeeper

The site uses a middleware-based gatekeeper in `proxy.ts` that hides the site behind a `/coming-soon` page until the official launch.

### How It Works

- **Unauthenticated visitors** see the `/coming-soon` page
- **Team members** can bypass by visiting `https://cbckyouthforum.live/?preview=true` (sets a 7-day cookie)
- Certain paths are always accessible: `/api/*`, `/_next/*`, `/coming-soon`, `/favicon.ico`, static files (`.png`, `.jpg`, `.svg`)

### Launch Day Steps

To fully open the site:

1. **Edit `proxy.ts`** — Change the gatekeeper logic to allow all traffic:
   - Remove the `?preview=true` handler (optional)
   - Remove the homepage force-check block
   - Remove the general block that rewrites to `/coming-soon`
   - Keep the Supabase auth guard for `/admin/dashboard` (still needed)

2. **Or simply** change the `/coming-soon` page to show the actual homepage and remove the middleware rewrite logic.

---

## 8. How to Add a New Admin User

### Step 1: Create the User

- **Supabase Dashboard → Authentication → Users → Add User**
- Enter email and temporary password
- Or use **Invite user** to email them a magic link

### Step 2: Grant Admin Role

- **Supabase Dashboard → SQL Editor**
- Run:

```sql
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'new-admin@example.com';
```

### Step 3: Communicate

Tell the new admin:
1. **Login URL:** `https://cbckyouthforum.live/admin`
2. **Dashboard URL:** `https://cbckyouthforum.live/admin/dashboard`
3. They can change their password at `/auth/update-password`
4. They'll need admin bypass cookie: visit `/?preview=true` first (if gatekeeper is active)

---

## Quick Reference

```bash
# Local development
yarn dev          # Start dev server on localhost:3000
yarn build        # Production build
yarn lint         # Run ESLint

# Vercel deployment
vercel deploy --prod --yes

# Database restore
gunzip backup.sql.gz && psql "$DATABASE_URL" --file backup.sql --sslmode=require

# Admin role grant (run in Supabase SQL Editor)
UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb WHERE email = 'admin@example.com';
```
