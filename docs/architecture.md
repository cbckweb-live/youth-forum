# Architecture — CBCK Youth Forum

**Project:** CBCK Youth Forum Website  
**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind CSS v4, TipTap  
**Hosting:** Vercel  
**Database:** Supabase (Postgres)

---

## 1. Tech Stack

### 1.1 Core Framework

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with server components, API routes, and middleware |
| **UI Library** | React 19 | Component-based user interface |
| **Language** | TypeScript 5 | Type safety across the entire codebase |

### 1.2 Styling

| Technology | Purpose |
|---|---|
| **Tailwind CSS v4** | Utility-first CSS framework for rapid, responsive styling |
| **PostCSS** | CSS processing pipeline |
| **Google Fonts (Sora, Inter)** | Typography — Sora for display headings, Inter for body text via `next/font` |
| **@heroicons/react** | SVG icon library for UI elements |
| **nprogress** | Navigation progress bar for client-side route transitions |

### 1.3 Backend & Data

| Technology | Purpose |
|---|---|
| **Supabase** | Backend-as-a-Service — provides PostgreSQL database, authentication, storage, and Row-Level Security |
| **@supabase/supabase-js** | Browser Supabase client (service-side rendered pages use this directly) |
| **@supabase/ssr** | Server-side Supabase client with cookie-based session management |
| **Zod** | Runtime environment variable validation |

### 1.4 Admin & Content

| Technology | Purpose |
|---|---|
| **@tiptap/react + StarterKit** | Rich text editor for admin blog post creation |
| **sanitize-html** | HTML sanitization for safe rendering of user-generated content |
| **html-to-text** | HTML-to-plain-text conversion for truncated post previews |
| **react-image-crop** | Image cropping utility in the admin panel |

### 1.5 Infrastructure

| Technology | Purpose |
|---|---|
| **Vercel** | Hosting and deployment platform |
| **GitHub Actions** | CI/CD — production build verification, smoke tests, DB keepalive, weekly backups |
| **Supabase Keep-Alive** | Cron job to prevent free-tier Supabase database pausing |
| **Sentry** | Error tracking via `src/instrumentation.ts` (native Next.js 16 `register()` hook) |

### 1.6 Security & Rate Limiting

| Technology | Purpose |
|---|---|
| **In-memory Rate Limiter** (`lib/rate-limiter.ts`) | LRU-cache-based rate limiting with tiered backoff for auth, public, and authenticated tiers |
| **Cloudflare Turnstile** | CAPTCHA-widget on admin login to prevent brute-force attacks |
| **Vercel Edge Config** | Fast edge-level `siteLaunched` flag for launch-gatekeeper decisions |

### 1.7 Performance & Analytics

| Technology | Purpose |
|---|---|
| **ISR (Incremental Static Regeneration)** | `revalidate` exports on public pages for cached rendering (3600s–86400s) |
| **Vercel Analytics** | Privacy-focused page view and visitor analytics (`@vercel/analytics`) |

---

## 2. Application Flow Architecture

### 2.1 Request Lifecycle

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│  Browser     │ ──> │  Next.js          │ ──> │  Supabase   │ ──> │  PostgreSQL  │
│  (Client)    │ <── │  Middleware       │ <── │  (Auth/DB)  │ <── │  (Data)      │
│              │     │  (Rate Limiter +  │     │             │     │              │
│              │     │   Gatekeeper +    │     │             │     │              │
│              │     │   Auth Guard)     │     │             │     │              │
└─────────────┘     └──────────────────┘     └─────────────┘     └──────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              v                       v
       ┌──────────────┐       ┌──────────────┐
       │  Edge Config │       │  Next.js      │
       │  (gatekeeper │       │  App Router   │
       │   fast-path) │       │  (Server)     │
       └──────────────┘       └──────────────┘
                                      │
                                ┌─────┴─────┐
                                v           v
                          ┌─────────┐  ┌─────────┐
                          │ Server   │  │ Client  │
                          │ Comps    │  │ Comps   │
                          │ (RSC)    │  │ ("use   │
                          │          │  │ client")│
                          └─────────┘  └─────────┘
```

### 2.2 Request Flow (Step by Step)

1. **Browser Request** — A user visits any URL on the site.

2. **Next.js Middleware (`proxy.ts`)** — The middleware runs first and handles several concerns:
   - **Rate Limiting:** Login-adjacent paths (`/login`, `/admin`) are rate-limited using an in-memory LRU cache with tiered backoff.
   - **Launch Gatekeeper:** Reads the `siteLaunched` flag from Vercel Edge Config (fast path) or Supabase `site_config` table (source of truth). If the site is in pre-launch mode, unauthenticated visitors are rewritten to `/coming-soon`. Team members with the `?preview=true` cookie bypass this check. Bypass secret is stored in `LAUNCH_BYPASS_SECRET` environment variable.
   - **Admin Auth Guard:** Requests to `/admin/dashboard` are checked for a valid Supabase session with admin role. Unauthenticated users are redirected to `/admin/login`.

3. **Route Resolution** — Next.js matches the URL to the App Router file tree. Server Components (`page.tsx`) render on the server.

4. **Data Fetching** — Server Components fetch data from Supabase directly using the public Supabase client. For public pages, the `supabase` client (with anon key) is used. For admin operations, the `createSupabaseBrowserClient` or `createSupabaseServerClient` (with cookie-based auth) is used.

5. **Server-Side Rendering** — The server renders the full HTML with data included and sends it to the browser.

6. **Client Hydration** — React hydrates the page on the client. Client Components (`"use client"`) become interactive.

7. **Client-Side Navigation** — When clicking internal `<Link>` components, NProgress shows a loading bar. The Next.js client-side router fetches the new page's RSC payload and renders it without a full page reload.

### 2.3 Data Flow

#### Public Pages (Read-Only)

```
Server Component (page.tsx)
    │
    ├──> supabase.from("events").select("*")...
    │       │
    │       └──> Data fetched server-side, rendered into HTML
    │
    └──> Passes data as props to Client Components (if needed)
              │
              └──> EventCard, MathetesCard, GalleryItem, etc.
```

#### Admin Pages (Read/Write)

```
Admin Dashboard (Client Component)
    │
    ├──> createSupabaseBrowserClient()
    │       │
    │       ├──> Direct Supabase queries for fetching existing data
    │       │
    │       └──> fetch("/api/admin/posts", ...) for CRUD operations
    │                 │
    │                 └──> API Route handles business logic + Supabase writes
    │
    └──> TipTap Editor (Client Component)
            │
            └──> onChange → updates local state → submitted via API route
```

---

## 3. Folder and File Structure

```
youth-forum/
├── app/                              # Next.js App Router — pages and API routes
│   ├── layout.tsx                    # Root layout — fonts, Navbar, Footer, ProgressBar
│   ├── page.tsx                      # Homepage — hero, slider, events, posts, leadership
│   ├── globals.css                   # Global Tailwind styles
│   ├── robots.ts                     # SEO robots.txt configuration
│   ├── sitemap.ts                    # XML sitemap generation
│   │
│   ├── about/
│   │   ├── aims/page.tsx             # Aims & Goals page (placeholder)
│   │   ├── journey/page.tsx          # Ministry history — timeline, chapters, pull quote
│   │   ├── blog-news/
│   │   │   ├── page.tsx              # Blog/News listing with category filters
│   │   │   └── [slug]/page.tsx       # Individual post detail page
│   │
│   ├── admin/
│   │   ├── page.tsx                  # Admin login page (with Turnstile + rate limiting)
│   │   └── dashboard/page.tsx        # Admin dashboard with 8 content tabs
│   │
│   ├── api/
│   │   ├── auth/login/route.ts       # Auth login with rate limiting + Turnstile
│   │   ├── launch-status/route.ts    # Public endpoint for launch state
│   │   └── admin/                    # Admin API routes
│   │       ├── dashboard/overview/route.ts  # Dashboard overview data (counts, storage, analytics)
│   │       ├── events/route.ts       # Events CRUD
│   │       ├── gallery/route.ts      # Gallery CRUD
│   │       ├── go-live/route.ts      # Site launch control (GET/POST/DELETE)
│   │       ├── living-room/route.ts  # Living Room episodes CRUD
│   │       ├── mathetes/route.ts     # Mathetes entries CRUD
│   │       ├── office-bearers/route.ts  # Office bearers CRUD
│   │       ├── posts/route.ts        # Posts CRUD
│   │       └── media/upload/route.ts # Image/PDF file upload to Supabase Storage
│   │
│   ├── auth/update-password/
│   │   └── page.tsx                  # Password update page
│   │
│   ├── cezo-mepu/page.tsx            # Regional youth groups directory
│   ├── coming-soon/page.tsx          # Pre-launch gatekeeper page
│   ├── developers/page.tsx           # Development team page
│   ├── events/
│   │   ├── page.tsx                  # Current year events calendar
│   │   └── archive/page.tsx          # Past years events archive
│   ├── gallery/page.tsx              # Photo gallery grouped by event tag
│   ├── living-room/page.tsx          # Video episodes page
│   ├── login/page.tsx                # Alias to admin login
│   ├── mathetes/page.tsx             # Mathetes Fellowship page
│   └── office-bearers/
│       ├── page.tsx                  # Leadership directory with search
│       └── [id]/page.tsx             # Individual profile page
│
├── components/                       # Reusable React components
│   ├── Navbar.tsx                    # Sticky navigation bar — desktop + mobile hamburger
│   ├── Footer.tsx                    # Site footer — logo, contact, socials, map, links
│   ├── HeroSlider.tsx                # Auto-advancing image slider with touch/swipe
│   ├── EventCard.tsx                 # Event display card with lightbox
│   ├── GalleryItem.tsx               # Gallery photo card
│   ├── LeadershipCard.tsx            # Featured leadership profile card
│   ├── OfficeBearerCard.tsx          # Standard office bearer card
│   ├── OfficeBearersClient.tsx       # Client-side search/filter logic
│   ├── MathetesCard.tsx              # Mathetes diary entry card
│   ├── SharePostButtons.tsx          # Native share + clipboard copy button
│   ├── ProgressBar.tsx               # NProgress route transition indicator
│   ├── SanitizedHtml.tsx             # Sanitized HTML rendering wrapper
│   ├── RevealSection.tsx             # Scroll-triggered fade-in reveal wrapper
│   ├── ScrollToTop.tsx               # Scroll-to-top button
│   ├── ThemeToggle.tsx               # Dark/light theme toggle
│   ├── AimsPanel.tsx                 # Aims & Goals page content
│   ├── ComingSoonContent.tsx         # Coming-soon landing page content
│   ├── TurnstileWidget.tsx           # Cloudflare Turnstile CAPTCHA widget
│   ├── SentryProvider.tsx            # Client-side Sentry + session replay
│   ├── OfficeBearersClient.tsx       # Client-side search/filter logic
│   │
│   └── admin/                        # Admin panel components
│       ├── ConfirmDialog.tsx         # Delete confirmation modal
│       ├── FileUploadInput.tsx       # File upload form input
│       ├── ImageCropper.tsx          # Image cropping utility
│       ├── RichTextEditor.tsx        # TipTap-based rich text editor
│       ├── Toast.tsx                 # Toast notification container
│       ├── EventsLineChart.tsx       # Events per month chart
│       └── sections/                 # CRUD sections for each content type
│           ├── OverviewSection.tsx    # Dashboard overview (counts, storage, analytics)
│           ├── GoLiveSection.tsx      # Site launch control panel
│           ├── PostsSection.tsx
│           ├── EventsSection.tsx
│           ├── GallerySection.tsx
│           ├── MathetesSection.tsx
│           ├── OfficeBearersSection.tsx
│           └── LivingRoomSection.tsx
│
├── lib/                              # Utility libraries and helpers
│   ├── env.ts                        # Zod environment variable validation
│   ├── supabase.ts                   # Public Supabase client (for server components)
│   ├── supabase-browser.ts           # Browser Supabase client (for client components)
│   ├── supabase-server.ts            # Server Supabase client (cookies-based SSR)
│   ├── categories.ts                 # Post category constants
│   ├── truncate.ts                   # HTML-to-text truncation
│   ├── utils.ts                      # YouTube URL parser, HTML entity decoder
│   ├── rate-limiter.ts               # In-memory rate limiter (LRU cache + tiered backoff)
│   ├── admin-api-utils.ts            # Admin auth helpers (requireAdmin, getServerSupabase)
│   ├── compress/                     # Client-side image compression
│   │   ├── index.ts                  # Public exports
│   │   └── image.ts                  # Image resizing + WebP/JPEG encoding
│   ├── api/
│   │   └── with-rate-limit.ts        # API route rate limit wrapper
│   └── crud/                         # Generic CRUD utilities
│       ├── index.ts                  # Public exports
│       ├── types.ts                  # CRUD type definitions
│       ├── schemas.ts                # Zod validation schemas
│       └── generic-api-handler.ts    # Reusable CRUD API route handler
│
├── proxy.ts                          # Next.js middleware — rate limiter + gatekeeper + auth guard
├── next.config.ts                    # Next.js config — security headers, images, fonts
├── postcss.config.mjs                # PostCSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies and scripts
│
├── public/                           # Static assets
│   ├── favicon.ico
│   ├── logo.png
│   ├── background.jpg
│   ├── mathetes logo.png
│   ├── livingroom.png
│   ├── mathetesJ.jpg
│   ├── site.webmanifest
│   └── favicons.mjs
│
├── src/
│   └── instrumentation.ts            # Next.js 16 native Sentry init (register() hook)
│
├── supabase/migrations/              # Database migration SQL
│   ├── 20260707_mathetes_rls.sql     # Mathetes table RLS policies
│   ├── 20260719_admin_dashboard_functions.sql  # get_storage_usage, get_database_size
│   ├── 20260722_rate_limits.sql      # Rate limiting support
│   ├── 20260724_site_config.sql      # site_config table + RLS
│   ├── 20260724_site_config_rls_fix.sql  # Fixed site_config RLS
│   ├── 20260726_teams_table.sql      # Teams table migration
│   └── add_storage_select_policies.sql
│
├── tests/smoke.mjs                   # Production smoke tests
├── scripts/check-esm-deps.mjs        # ESM-only dependency checker
├── .github/workflows/                # CI/CD workflows
│   ├── ci.yml                        # Build + smoke test pipeline
│   ├── backup.yml                    # Weekly database backup workflow
│   └── supabase-keepalive.yml        # Database keepalive cron job
│
├── docs/                             # Project documentation
│   ├── PRD.md                        # Product Requirements Document
│   ├── architecture.md (this file)   # Architecture documentation
│   ├── phases.md                     # Build phases
│   ├── design.md                     # Design system
│   ├── memory.md                     # Project progress tracker
│   ├── VERSIONING.md                 # Versioning strategy
│   ├── RUNBOOK.md                    # Operations runbook
│   └── backup setup.md              # Database backup setup guide
├── TODO.md                           # Remaining tasks
├── CLAUDE.md                         # Agent instructions
└── AGENTS.md                         # AI agent rules
```

---

## 4. Component Hierarchy

### 4.1 Layout Tree

```
RootLayout (server)
├── <html>
│   ├── <body>
│   │   ├── ProgressBar (client)          # NProgress route indicator
│   │   ├── Navbar (client)               # Sticky nav with mobile menu
│   │   │   └── navigation[] → <Link>s    # Home, Gallery, Events, Mathetes, etc.
│   │   ├── <main>                        # Page content (slot)
│   │   │   └── Page Component            # Rendered per route
│   │   └── Footer (server)               # Logo, contact, socials, map
│   └── ...
```

### 4.2 Homepage Component Tree

```
HomePage (server)
├── Hero Section — welcome message, theme, scripture
├── HeroSlider (client)                    # Auto-advancing image carousel
│   └── Image[] + ChevronLeft/Right + dot indicators
├── Upcoming Events Section
│   ├── Link → /events
│   └── Event[]
│       └── CalendarDate + formatRange + truncate
├── Recent Blog & News Section
│   ├── Link → /about/blog-news
│   └── Post[]
│       ├── Image + CATEGORY_LABELS
│       └── truncate(content)
├── Leadership Section
│   └── LeadershipCard[] (sorted by role rank)
└── Navigation Cards
    └── Journey, Aims, Blog/News cards with icons
```

### 4.3 Admin Dashboard Component Tree

```
AdminDashboard (client)
├── Sign Out button
├── Tab bar (Overview | Posts | Events | Gallery | Mathetes | Office Bearers | Living Room | Go Live)
└── Active Tab Section
    ├── OverviewSection (client)           # Dashboard overview
    │   ├── Quick-action shortcuts         # Add Event, Upload Photos, New Post
    │   ├── Storage + Database usage       # Supabase quota bars
    │   ├── Keepalive + Backup health      # GitHub Actions workflow status
    │   ├── Content counts grid            # Posts, Events, Gallery, etc. (clickable)
    │   ├── Missing image warnings         # Gallery & OB photos
    │   ├── Upcoming events / empty table flags
    │   ├── Events per month chart         # Line chart (via EventsLineChart)
    │   ├── Site traffic (Vercel Analytics) # Bar chart + top pages
    │   └── Recent activity feed
    │
    ├── PostsSection (client)
    │   ├── Post list (title, category, published status, edit/delete)
    │   ├── ConfirmDialog (client)         # Delete confirmation
    │   └── Modal form
    │       ├── Title, Slug, Category inputs
    │       ├── RichTextEditor (client)    # TipTap editor
    │       ├── FileUploadInput (client)   # Photo/PDF upload
    │       └── Publish toggle
    │
    ├── EventsSection (client)             # Similar CRUD pattern
    ├── GallerySection (client)
    ├── MathetesSection (client)
    ├── OfficeBearersSection (client)      # With team filter dropdown
    ├── LivingRoomSection (client)
    │
    └── GoLiveSection (client)             # Site launch control
        ├── Shows current launch state      # Live / Coming-Soon
        ├── Confirm dialog for Go Live      # With warning
        ├── Reset launch button             # Re-enable coming-soon
        └── API calls to /api/admin/go-live  # POST (launch) / DELETE (reset)
```

---

## 5. Key Architectural Decisions

### 5.1 Server vs. Client Components

- **Server Components (default):** All public-facing page components are server components. They fetch data from Supabase directly and render HTML on the server. This improves SEO and initial page load performance.
- **Client Components (`"use client"`):** Only components that need interactivity (event handlers, state, effects, browser APIs) are marked as client components. These include: `Navbar`, `HeroSlider`, `EventCard` (lightbox), `ProgressBar`, `OfficeBearersClient` (search), `SharePostButtons`, and all admin components.

### 5.2 Three Supabase Clients

Three different Supabase client factories were created for different contexts:

| Client | Import | Use Case |
|---|---|---|
| `lib/supabase.ts` | `supabase` singleton | Server Components (uses env vars directly at module scope) |
| `lib/supabase-browser.ts` | `createSupabaseBrowserClient()` | Client Components (browser-side auth sessions) |
| `lib/supabase-server.ts` | `createSupabaseServerClient()` | Server-side code needing cookies (middleware, server actions) |

### 5.3 API Routes vs. Direct Queries

- **Public pages** use direct Supabase queries from Server Components with the anon key. RLS policies enforce read-only access for anonymous users.
- **Admin CRUD** uses API routes (`/api/admin/*`) that accept POST requests with JSON bodies. This provides a consistent interface for the admin panel and allows business logic (validation, file uploads, etc.) to be centralized.

### 5.4 File Upload Flow

```
1. Admin selects file → FileUploadInput
2. compressImageFile (client-side) resizes + re-encodes image
3. FormData sent to POST /api/admin/media/upload
4. API route uploads to Supabase Storage bucket
5. Public URL returned and stored in database
```

### 5.5 Launch Gatekeeper

The middleware (`proxy.ts`) implements a pre-launch access control system:

```
Request → proxy.ts middleware
    │
    ├── Is /coming-soon, /api, /_next, or a static file?
    │   └── Yes → Allow through
    │
    ├── Has ?preview=true param?
    │   └── Yes → Set secret cookie, redirect to /
    │
    ├── Has valid secret cookie?
    │   ├── Yes → Allow through (member)
    │   └── No  → Rewrite to /coming-soon
    │
    └── Is /admin path?
        └── Yes → Allow through (login must work)
```

---

## 6. Database Schema

The Supabase PostgreSQL database contains the following tables:

```
── Metadata / Config ──
site_config
├── id (integer, PK) — always 1
├── site_launched (boolean)
└── updated_at (timestamp)

── Content Tables ──
posts
├── id (uuid, PK)
├── title, slug
├── category ("news" | "blog-opinion")
├── content (HTML, text)
├── author_name, photo_url, pdf_url
├── published (boolean)
└── created_at (timestamp)

events
├── id (uuid, PK)
├── title, description, image_url
├── event_date, event_end_date (date)
└── created_at (timestamp)

gallery
├── id (uuid, PK)
├── photo_url, caption, event_tag
└── created_at (timestamp)

office_bearers
├── id (uuid, PK)
├── name, role, photo_url, phone, email, bio
├── team_id (FK → teams.id), location_id (FK → cezo_mepu_locations.id)
├── display_order (integer)
└── created_at (timestamp)

teams
├── id (uuid, PK)
├── name (string)
└── display_order (integer)

mathetes
├── id (uuid, PK)
├── title, description, photo_url
└── created_at (timestamp)

living_room_seasons
├── id (uuid, PK)
├── title, description, youtube_url
├── display_order (integer)
└── created_at (timestamp)

cezo_mepu_locations
├── id (uuid, PK)
├── name, address, photo_url, description, whatsapp_url
└── display_order (integer)

developers
├── id (uuid, PK)
├── name, role, description, photo_url
└── display_order (integer)
```

**Storage Buckets:** `posts-media` (images), `posts-pdf` (documents), `db-backups` (private — database dumps)

**Database Functions (via migrations):**
- `get_storage_usage()` — Returns per-bucket storage totals for admin dashboard
- `get_database_size()` — Returns database size in bytes and human-readable format

All tables have Row-Level Security enabled with the same pattern:
- **SELECT:** Public access (anonymous + authenticated users)
- **INSERT/UPDATE/DELETE:** Admin-only (authenticated users with `app_metadata.role = 'admin'`)

`schema` is managed via Supabase migrations in `supabase/migrations/`.

---

## 7. Security Architecture

| Layer | Mechanism |
|---|---|
| **Database** | Row-Level Security on all tables — public read, admin write |
| **Authentication** | Supabase Auth — email/password login, JWT-based sessions |
| **Admin Routes** | Middleware auth guard — checks session + admin role claim |
| **API Routes** | Session validation within each route handler |
| **Network** | CSP headers (with dynamic nonce), HSTS, X-Frame-Options, X-Content-Type-Options |
| **Content** | HTML sanitization via `sanitize-html` for user-generated content |
| **File Upload** | Client-side validation (type + size checks before upload) |
| **Rate Limiting** | In-memory LRU cache — tiered limits for auth, public, and authenticated users |
| **Login Protection** | Cloudflare Turnstile CAPTCHA widget on admin login form |
| **Error Monitoring** | Sentry via `src/instrumentation.ts` — captures unhandled request errors |
| **Edge Config** | Vercel Edge Config for fast edge-level launch-gatekeeper decisions |
| **Environment Secrets** | `LAUNCH_BYPASS_SECRET` in env variable (not hardcoded) |
