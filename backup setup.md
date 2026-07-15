# Database Backup Setup

This adds an automated weekly backup of the Supabase Postgres database.

## What it does
1. Every Sunday at 03:00 UTC (and any time you trigger it manually), a GitHub Action:
   - Dumps the entire database using `pg_dump`
   - Compresses it (`.sql.gz`)
   - Uploads it to a private Supabase Storage bucket called `db-backups`
   - Also keeps a copy as a GitHub Actions artifact for 90 days, as a second safety net

## One-time setup checklist

- [ ] Create a **private** bucket named `db-backups` in Supabase Storage
      (Dashboard -> Storage -> New bucket -> name it `db-backups`, do NOT make it public)
- [ ] Add these three repo secrets (Settings -> Secrets and variables -> Actions):
      - `SUPABASE_DB_URL` — the Session Pooler connection string from Connect panel
      - `SUPABASE_URL` — https://emsfthlfptmysgzpectv.supabase.co
      - `SUPABASE_SERVICE_ROLE_KEY` — from Settings -> API
- [ ] Commit `.github/workflows/backup.yml` to the repo
- [ ] Go to the Actions tab, find "Supabase Database Backup", and click "Run workflow"
      to test it manually before waiting for the Sunday schedule

## How to restore from a backup

1. Download the `.sql.gz` file from either the Supabase `db-backups` bucket
   or from the GitHub Actions artifact for that run
2. Unzip it: `gunzip backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
3. Restore into a database:
   ```
   psql "YOUR_CONNECTION_STRING" < backup_YYYY-MM-DD_HH-MM-SS.sql
   ```
   Do this against a NEW/empty database first if you want to verify the dump
   before touching production.

## Notes
- `--no-owner --no-privileges` is used so the dump doesn't try to reassign
  ownership to roles that may not exist when restoring elsewhere.
- Weekly is enough for a low-traffic ministry site. If content changes daily
  (e.g. frequent admin uploads), change the cron to `0 3 * * *` for daily runs.
- Old backups are never auto-deleted from the `db-backups` bucket. Check in
  periodically and prune old ones manually to stay within free-tier storage limits.