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
| **pdf-lib** | PDF utilities (available in dependencies) |

### 1.5 Infrastructure

| Technology | Purpose |
|---|---|
| **Vercel** | Hosting and deployment platform |
| **GitHub Actions** | CI/CD — production build verification and smoke tests |
| **Supabase Keep-Alive** | Cron job to prevent free-tier Supabase database pausing |

---

## 2. Application Flow Architecture

### 2.1 Request Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Browser     │ ──> │  Next.js      │ ──> │  Supabase   │ ──> │  PostgreSQL  │
│  (Client)    │ <── │  Middleware   │ <── │  (Auth/DB)  │ <── │  (Data)      │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                          │
                          v
                    ┌──────────────┐
                    │  Next.js      │
                    │  App Router   │
                    │  (Server)     │
                    └──────────────┘
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

2. **Next.js Middleware (`proxy.ts`)** — The middleware runs first and handles two concerns:
   - **Launch Gatekeeper:** If the site is in pre-launch mode, unauthenticated visitors are rewritten to `/coming-soon`. Team members with the `?preview=true` cookie bypass this check.
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
│   │   ├── page.tsx                  # Admin login page
│   │   └── dashboard/page.tsx        # Admin dashboard with 6 content tabs
│   │
│   ├── api/admin/                    # API routes for admin CRUD
│   │   ├── events/route.ts           # Events CRUD
│   │   ├── gallery/route.ts          # Gallery CRUD
│   │   ├── living-room/route.ts      # Living Room episodes CRUD
│   │   ├── mathetes/route.ts         # Mathetes entries CRUD
│   │   ├── office-bearers/route.ts   # Office bearers CRUD
│   │   ├── posts/route.ts            # Posts CRUD
│   │   └── media/upload/route.ts     # Image/PDF file upload to Supabase Storage
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
│   │
│   └── admin/                        # Admin panel components
│       ├── ConfirmDialog.tsx         # Delete confirmation modal
│       ├── FileUploadInput.tsx       # File upload form input
│       ├── ImageCropper.tsx          # Image cropping utility
│       ├── RichTextEditor.tsx        # TipTap-based rich text editor
│       └── sections/                 # CRUD sections for each content type
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
│   └── compress/                     # Client-side image compression
│       ├── index.ts                  # Public exports
│       └── image.ts                  # Image resizing + WebP/JPEG encoding
│
├── proxy.ts                          # Next.js middleware — gatekeeper + auth guard
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
├── supabase/migrations/              # Database migration SQL
│   ├── 20260707_mathetes_rls.sql     # Mathetes table RLS policies
│   └── add_storage_select_policies.sql
│
├── tests/smoke.mjs                   # Production smoke tests
├── scripts/check-esm-deps.mjs        # ESM-only dependency checker
├── .github/workflows/                # CI/CD workflows
│   ├── ci.yml                        # Build + smoke test pipeline
│   └── supabase-keepalive.yml        # Database keepalive cron job
│
├── PRD.md                            # Product Requirements Document
├── architecture.md (this file)        # Architecture documentation
├── README.md                         # Project overview
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
├── Tab bar (Posts | Events | Gallery | Mathetes | Office Bearers | Living Room)
└── Active Tab Section
    ├── PostsSection (client)
    │   ├── Post list (title, category, published status, edit/delete)
    │   ├── ConfirmDialog (client)         # Delete confirmation
    │   └── Modal form
    │       ├── Title, Slug, Category inputs
    │       ├── RichTextEditor (client)    # TipTap editor
    │       ├── FileUploadInput (client)   # Photo/PDF upload
    │       └── Publish toggle
    ├── EventsSection (client)             # Similar CRUD pattern
    ├── GallerySection (client)
    ├── MathetesSection (client)
    ├── OfficeBearersSection (client)
    └── LivingRoomSection (client)
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

All tables have Row-Level Security enabled with the same pattern:
- **SELECT:** Public access (anonymous + authenticated users)
- **INSERT/UPDATE/DELETE:** Admin-only (authenticated users with `app_metadata.role = 'admin'`)

---

## 7. Security Architecture

| Layer | Mechanism |
|---|---|
| **Database** | Row-Level Security on all tables — public read, admin write |
| **Authentication** | Supabase Auth — email/password login, JWT-based sessions |
| **Admin Routes** | Middleware auth guard — checks session + admin role claim |
| **API Routes** | Session validation within each route handler |
| **Network** | CSP headers, HSTS, X-Frame-Options, X-Content-Type-Options |
| **Content** | HTML sanitization via `sanitize-html` for user-generated content |
| **File Upload** | Client-side validation (type + size checks before upload) |
