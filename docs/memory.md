# Project Memory — CBCK Youth Forum

**Version:** 1.0.1  
**Last Updated:** 30 July 2026

---

## Project Overview

CBCK Youth Forum is a Next.js 16 + Supabase website for the Chakhesang Baptist Church Kohima Youth Ministry. It serves as the ministry's digital content hub — with public-facing pages for events, blog/news, gallery, leadership directory, video content, and a private admin panel for content management.

**Live URL:** [cbckyouthforum.live](https://cbckyouthforum.live)  
**Version:** 1.0.1 — Initial release + dashboard, go-live, rate limiting, security enhancements

---

## Progress Summary

| Phase | Status | Notes |
|---|---|---|
| P1: Project Scaffolding | ✅ Complete | Next.js, Tailwind, TypeScript, env validation |
| P2: Shared UI Components | ✅ Complete | Navbar, Footer, ProgressBar, utilities |
| P3: Supabase Integration | ✅ Complete | Database, RLS, 3 client factories |
| P4: Core Public Pages | ✅ Complete | Homepage, Events, Gallery, Blog/News, Blog Detail |
| P5: Ministry & Community Pages | ✅ Complete | Office Bearers, Mathetes, Cezo Mepu, Living Room, Journey |
| P6: Admin Authentication | ✅ Complete | Login, Dashboard, middleware auth guard |
| P7: Admin Content Management | ✅ Complete | All 6 CRUD sections, TipTap editor, API routes |
| P8: Media Upload & Processing | ✅ Complete | File upload, image compression |
| P9: Launch Infrastructure | ✅ Complete | Gatekeeper, SEO, CI/CD, smoke tests |
| P10: Polish & Refinements | ✅ Complete | Responsiveness, styling, documentation |

**Overall Progress:** 100% — All phases complete.

---

## What Has Been Completed

### Public Pages (15 pages)

| Page | Route | Status | Description |
|---|---|---|---|
| Homepage | `/` | ✅ | Hero, image slider, upcoming events, recent posts, leadership, nav cards |
| Events | `/events` | ✅ | Current year events, upcoming/past split |
| Events Archive | `/events/archive` | ✅ | Past years events |
| Gallery | `/gallery` | ✅ | Photos grouped by event tag |
| Blog & News | `/about/blog-news` | ✅ | Category filters, post cards |
| Blog Detail | `/about/blog-news/[slug]` | ✅ | Full post, share buttons, PDF download |
| Office Bearers | `/office-bearers` | ✅ | Search, featured leaders, team groupings |
| Office Bearer Detail | `/office-bearers/[id]` | ✅ | Individual profile |
| Mathetes | `/mathetes` | ✅ | Fellowship info, diary masonry, in-charges |
| Cezo Mepu | `/cezo-mepu` | ✅ | 9 regional groups with supervisors & WhatsApp |
| The Living Room | `/living-room` | ✅ | Video episodes with YouTube embeds |
| Journey | `/about/journey` | ✅ | History timeline, chapters, pull quote |
| Aims & Goals | `/about/aims` | ✅ | Placeholder page |
| Coming Soon | `/coming-soon` | ✅ | Pre-launch gatekeeper page |
| Developers | `/developers` | ✅ | Team page + admin panel redirect |

### Admin Panel

| Feature | Status | Description |
|---|---|---|
| Login | ✅ | Email/password authentication |
| Password Update | ✅ | Password reset flow |
| Dashboard | ✅ | Tabbed interface with 6 sections |
| Posts CRUD | ✅ | TipTap editor, publish toggle, photo/PDF attachments |
| Events CRUD | ✅ | Date range, description, image |
| Gallery CRUD | ✅ | Multi-file upload, captions, event tags |
| Mathetes CRUD | ✅ | Title, description, photo |
| Office Bearers CRUD | ✅ | Team assignments, display order |
| Living Room CRUD | ✅ | YouTube URL, display order |
| Team Management | ✅ | Sub-section within Office Bearers |
| Media Upload | ✅ | Image/PDF upload to Supabase Storage |
| Image Compression | ✅ | Client-side resize + WebP encoding |
| Image Cropper | ✅ | Drag-to-crop with JPEG export |

### Infrastructure

| Feature | Status | Description |
|---|---|---|
| Supabase Database | ✅ | 10 tables with RLS policies |
| Supabase Auth | ✅ | Email/password, admin role verification |
| Supabase Storage | ✅ | posts-media and posts-pdf buckets |
| Launch Gatekeeper | ✅ | Cookie-based pre-launch access control |
| Security Headers | ✅ | CSP, HSTS, X-Frame-Options, etc. |
| SEO (sitemap) | ✅ | All major pages with priorities |
| SEO (robots.txt) | ✅ | Public pages allowed, admin denied |
| CI/CD Pipeline | ✅ | Build + smoke tests on push/PR |
| Database Keepalive | ✅ | Cron job every 3 days |

### Public Components (updated)

| Component | Type | Lines | Purpose |
|---|---|---|---|
| Navbar | Client | ~100 | Sticky nav + mobile hamburger |
| Footer | Server | ~150 | 5-column footer with map |
| HeroSlider | Client | ~85 | Auto-advancing image carousel |
| EventCard | Client | ~90 | Event card with image lightbox |
| LeadershipCard | Server | ~25 | Featured leader profile |
| OfficeBearerCard | Server | ~22 | Standard office bearer card |
| OfficeBearersClient | Client | ~110 | Search + team grouping logic |
| MathetesCard | Server | ~50 | Fellowship diary card |
| GalleryItem | Server | ~25 | Photo gallery card |
| SharePostButtons | Client | ~45 | Native share + clipboard copy |
| ProgressBar | Client | ~45 | NProgress route transitions |
| SanitizedHtml | Server | ~15 | Safe HTML rendering |
| RevealSection | Client | ~30 | Scroll-triggered fade-in reveal wrapper |
| ScrollToTop | Client | ~50 | Scroll-to-top floating button |
| ThemeToggle | Client | ~40 | Dark/light theme toggle |
| AimsPanel | Server | ~20 | Aims & Goals content panel |
| ComingSoonContent | Server | ~25 | Coming-soon landing page content |
| TurnstileWidget | Client | ~50 | Cloudflare Turnstile CAPTCHA |
| SentryProvider | Client | ~20 | Client-side Sentry + session replay |

### Admin Components (updated)

| Component | Type | Lines | Purpose |
|---|---|---|---|
| OverviewSection | Client | ~400 | Dashboard overview (counts, storage, analytics) |
| GoLiveSection | Client | ~250 | Site launch control panel |
| PostsSection | Client | ~200 | Post CRUD with TipTap editor |
| EventsSection | Client | ~150 | Event CRUD |
| GallerySection | Client | ~150 | Gallery CRUD |
| MathetesSection | Client | ~130 | Mathetes CRUD |
| OfficeBearersSection | Client | ~180 | Office bearers CRUD with team filter |
| LivingRoomSection | Client | ~130 | Living Room CRUD |
| RichTextEditor | Client | ~100 | TipTap editor with toolbar |
| FileUploadInput | Client | ~170 | File upload with preview + crop |
| ImageCropper | Client | ~175 | Drag crop with export |
| ConfirmDialog | Client | ~30 | Delete confirmation modal |
| Toast | Client | ~80 | Toast notification container |
| EventsLineChart | Client | ~50 | Events per month line chart |

### Utilities Built (16 files)

| File | Purpose |
|---|---|
| `lib/env.ts` | Zod environment variable validation |
| `lib/supabase.ts` | Public Supabase client |
| `lib/supabase-browser.ts` | Browser Supabase client |
| `lib/supabase-server.ts` | Server Supabase client (cookies) |
| `lib/categories.ts` | Post category constants |
| `lib/truncate.ts` | HTML-to-text truncation |
| `lib/utils.ts` | YouTube URL parser, HTML entity decoder |
| `lib/rate-limiter.ts` | In-memory rate limiter (LRU cache + tiered backoff) |
| `lib/admin-api-utils.ts` | Admin auth helpers (requireAdmin, getServerSupabase) |
| `lib/compress/image.ts` | Client-side image compression |
| `lib/compress/index.ts` | Compression exports |
| `lib/api/with-rate-limit.ts` | API route rate-limit wrapper |
| `lib/crud/generic-api-handler.ts` | Reusable CRUD API route handler |
| `lib/crud/schemas.ts` | Zod validation schemas for CRUD |
| `lib/crud/types.ts` | CRUD type definitions |
| `lib/crud/index.ts` | CRUD utilities exports |

### API Routes Built (11 routes)

| Route | Method(s) | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Admin login (rate-limited + Turnstile) |
| `/api/launch-status` | GET | Public launch state check |
| `/api/admin/posts` | POST | CRUD for blog/news posts |
| `/api/admin/events` | POST | CRUD for events |
| `/api/admin/gallery` | POST | CRUD for gallery photos |
| `/api/admin/mathetes` | POST | CRUD for mathetes entries |
| `/api/admin/office-bearers` | POST | CRUD for office bearers |
| `/api/admin/living-room` | POST | CRUD for living room episodes |
| `/api/admin/media/upload` | POST | File upload to Supabase Storage |
| `/api/admin/dashboard/overview` | GET | Dashboard overview data (counts, storage, analytics) |
| `/api/admin/go-live` | GET/POST/DELETE | Site launch state control |

### Documentation Created (8 files)

| File | Description |
|---|---|
| `PRD.md` | Product Requirements Document |
| `architecture.md` | App flow, folder structure, tech stack |
| `phases.md` | Build phases in order |
| `design.md` | Design system — colors, fonts, components |
| `memory.md` | This file — project progress tracker |
| `VERSIONING.md` | Versioning strategy and release process |
| `RUNBOOK.md` | Operations runbook (deploy, backup, restore) |
| `backup setup.md` | Database backup setup guide |

---

## Current Status

**Build status:** All features complete. The website has been fully built and deployed.

**Key recent features added:**
| Feature | Description |
|---|---|
| Admin Dashboard Overview | Content counts, storage/DB usage, analytics charts, workflow status |
| Go Live Control Panel | Launch/reset site from admin panel (writes to DB + Edge Config) |
| Rate Limiting | In-memory LRU cache protecting login, public, and authenticated tiers |
| Cloudflare Turnstile | CAPTCHA on admin login to prevent brute-force attacks |
| ISR Caching | `revalidate` exports on all public pages (3600s–86400s) |
| Sentry Error Tracking | Native Next.js 16 instrumentation hook |
| Database Backup Workflow | Weekly pg_dump via GitHub Actions to Supabase Storage |
| Team Filter Dropdown | Office bearers admin list view for filtering by team |
| Error Boundaries | `app/error.tsx` and segment-level error pages for graceful failures |

---

## Theme & Branding

| Element | Value |
|---|---|
| Site Title | CBCK | Youth Forum |
| Tagline | News, events, and people of our youth forum |
| Theme Verse | 1 Timothy 4:12 |
| Version | `1.0.1` |
| Theme 2026 | "Renew Thy Church" |
| Book Focus | Revelations |
| Primary Color | `#6B1F2A` (Maroon/Oxblood) |
| Text Color | `#231F1E` (Dark brown) |
| Display Font | Sora (via Google Fonts) |
| Body Font | Inter (via Google Fonts) |
| Member Count | 1,000+ |
| Est. | 1968 (Youth Ministry), 1960 (Church) |

---

## Database Tables (10 total)

| Table | Records | Purpose |
|---|---|---|
| `posts` | — | Blog/news articles |
| `events` | — | Calendar events |
| `gallery` | — | Photo gallery |
| `office_bearers` | — | Leadership directory |
| `teams` | — | Ministry teams |
| `mathetes` | — | Mathetes diary entries |
| `living_room_seasons` | — | Video episodes |
| `cezo_mepu_locations` | — | Regional youth groups |
| `developers` | — | Development team |
| `site_config` | 1 | Launch state (single-row config) |

---

## Pending / Future Work

All planned features have been implemented. The TODO.md file is empty of remaining tasks. Future considerations include:

- Email notifications for content updates.
- Living Room series/season groupings.
- iCal calendar subscription for events.
- Image CDN optimization beyond Supabase storage.
- Multi-language support (if needed).
- Member registration and profiles.
- Comments on blog posts.

---

## Git Repository

| Detail | Value |
|---|---|
| Branch | `master` |
| Status | Clean (no uncommitted changes) |
| Host | GitHub |
| CI | GitHub Actions — build + smoke tests on push/PR to `main` |

---

## Changelog### 2026-07-19 — v1.0.1

- ✨ **Added admin dashboard overview tab** — content counts, storage/DB usage, monthly deltas, upcoming events, missing image warnings, recent activity feed, Vercel Analytics charts, and GitHub Actions workflow health.
- ✨ **Added Go Live control panel** — admin can toggle the public launch state from the dashboard. Writes to both Supabase DB and Vercel Edge Config. Displays current live/coming-soon state with confirmation dialogs.
- 🔧 **Moved launch gatekeeper bypass secret to environment variable.** Removed hardcoded `BYPASS_SECRET_VALUE` from `proxy.ts`. Added `LAUNCH_BYPASS_SECRET` to the Zod env schema in `lib/env.ts` with a backward-compatible default.
- 🔧 **Implemented in-memory rate limiting** — LRU-cache-based rate limiter with three tiers (auth, public, authenticated). Applied to login pages and all admin API routes.
- 🔧 **Integrated Cloudflare Turnstile CAPTCHA** on the admin login form to prevent brute-force attacks.
- ✨ **Added error boundaries** to prevent crashes during Supabase outages. Created `app/error.tsx` (root), `app/office-bearers/[id]/error.tsx`, and `app/about/blog-news/[slug]/error.tsx` (segment-level). Each shows a friendly error message with "Try Again" and navigation links.
- 🏗️ **Added database backup workflow** — GitHub Actions weekly pg_dump to Supabase Storage and artifact retention.
- 🏗️ **Added Vercel Edge Config integration** — fast edge-level `siteLaunched` flag for middleware gatekeeper decisions.
- 🏗️ **Added `site_config` table** — single-row config table for launch state management.
- 📄 **Updated documentation** — all 8 docs reviewed and updated for consistency.

### 2026-07-15 — v1.0.1

- 🔧 **Sentry integration redesigned for Next.js 16.** Removed `withSentryConfig` (incompatible with Turbopack). Server-side init via `src/instrumentation.ts` (native `register()` hook + `onRequestError`). Browser-side init via new `components/SentryProvider.tsx` (client component with session replay).
- 🔥 Removed unused `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (were only loaded by removed webpack plugin).

### 2026-07-15 — v1.0.0

- 🎉 **v1.0.0 Initial release.** All 10 build phases marked complete.
- 📦 Bumped package version from `0.1.0` to `1.0.0`.
- 📄 Created `PRD.md` — Product Requirements Document.
- 🏗️ Created `architecture.md` — App flow, folder structure, and tech stack documentation.
- 📋 Created `phases.md` — Phase-by-phase build documentation.
- 🎨 Created `design.md` — Full design system documentation (colors, typography, components, glass-morphism).
- 📝 Created `memory.md` — Project progress tracker and memory file.
- ✨ Journey page: Removed hero blur/gradient, replaced with subtle `bg-black/45` overlay.
- 🔧 Cross-checked all 5 documentation files for consistency and fixed 3 inconsistencies.

---

### How to Add New Entries

When making future changes, add a new entry at the top of this section with the date and a bullet-point list of what changed. Use emoji prefixes for clarity:

```
### YYYY-MM-DD

- ✨ New feature or page added.
- 🔧 Bug fix or refactor.
- 📄 Documentation added or updated.
- 🎨 Visual/style change.
- 🏗️ Infrastructure or CI/CD change.
- 🔥 Removed feature or code.
```
