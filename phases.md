# Project Phases — CBCK Youth Forum

This document outlines the phases in which the CBCK Youth Forum website was built, ordered from foundation to completion.

---

## Phase 1: Project Scaffolding & Foundation

**Goal:** Set up the project skeleton, development environment, and core infrastructure.

### Tasks Completed

- Initialized a Next.js 16 project with TypeScript and the App Router.
- Installed and configured Tailwind CSS v4 with PostCSS.
- Set up Google Fonts — Sora (display) and Inter (body) via `next/font`.
- Created the root layout (`app/layout.tsx`) with HTML structure, font variables, and global CSS.
- Configured `next.config.ts` with security headers (CSP, HSTS, X-Frame-Options, etc.).
- Set up environment variable validation using Zod (`lib/env.ts`).
- Created the project's `tsconfig.json`, `postcss.config.mjs`, and `.gitignore`.
- Established the folder structure — `app/`, `components/`, `lib/`, `public/`.

### Deliverables

- Development server running with hot reload.
- Type-safe environment variable validation.
- Security headers applied to all routes.

---

## Phase 2: Shared UI Components & Layout

**Goal:** Build the shared layout components that appear on every page.

### Tasks Completed

- Built **Navbar** (`components/Navbar.tsx`) — a sticky top navigation bar with:
  - Logo and site name.
  - Seven navigation links: Home, Gallery, Events, Mathetes, Office Bearers, Cezo Mepu, The Living Room.
  - Mobile hamburger menu with outside-click and scroll-to-close behavior.
- Built **Footer** (`components/Footer.tsx`) with:
  - Logo and church name.
  - Contact information (email, phone).
  - Social media links (Facebook, Instagram, YouTube) with SVG icons.
  - Events quick links.
  - Physical address.
  - Embedded Google Maps iframe.
  - Bottom sub-footer with additional links.
- Built **ProgressBar** (`components/ProgressBar.tsx`) — NProgress integration for client-side route transitions.
- Created **SharePostButtons** (`components/SharePostButtons.tsx`) — native Web Share API with clipboard fallback.
- Created **SanitizedHtml** (`components/SanitizedHtml.tsx`) — safe HTML rendering wrapper.
- Built utility functions in `lib/`:
  - `lib/utils.ts` — YouTube URL parser, HTML entity decoder.
  - `lib/truncate.ts` — HTML-to-text truncation.
  - `lib/categories.ts` — Post category constants.

### Deliverables

- Consistent navigation and footer across all pages.
- Route transition loading indicator.
- Reusable utility components.

---

## Phase 3: Supabase Integration & Database

**Goal:** Connect the project to Supabase for data storage, authentication, and access control.

### Tasks Completed

- Created a Supabase project with PostgreSQL database.
- Created three Supabase client factories:
  - `lib/supabase.ts` — public singleton client for Server Components.
  - `lib/supabase-browser.ts` — cookie-based browser client for Client Components.
  - `lib/supabase-server.ts` — server-side client using `next/headers` cookies.
- Designed and created all database tables:
  - `posts` — blog/news articles.
  - `events` — calendar events.
  - `gallery` — photo gallery entries.
  - `office_bearers` — leadership directory.
  - `teams` — ministry team groupings.
  - `mathetes` — fellowship diary entries.
  - `living_room_seasons` — video content episodes.
  - `cezo_mepu_locations` — regional youth groups.
  - `developers` — development team members.
- Implemented Row-Level Security (RLS) policies on all tables:
  - Public read access for anonymous users.
  - Admin-only insert, update, and delete operations.
- Configured Supabase Storage buckets for media uploads (`posts-media`, `posts-pdf`).

### Deliverables

- Fully functional Supabase backend.
- Database schema with RLS enforced.
- Three client factories for different rendering contexts.

---

## Phase 4: Public Pages — Core Content

**Goal:** Build the primary public-facing pages that display the ministry's core content.

### Tasks Completed

- **Homepage** (`app/page.tsx`):
  - Hero section with welcome message, theme ("Renew Thy Church"), and scripture.
  - Image slider (`HeroSlider.jsx`) — auto-advancing with touch/swipe support.
  - Upcoming events section — fetches and displays the next 2 events.
  - Recent blog & news section — fetches and displays the 3 most recent published posts.
  - Leadership section — displays key leaders sorted by role rank.
  - Navigation cards linking to Journey, Aims & Goals, and Blog/News.
- **Events Page** (`app/events/page.tsx`):
  - Current year's events split into "Upcoming" and "Past Events" sections.
  - `EventCard.jsx` — card with date, title, description, and click-to-enlarge lightbox.
- **Events Archive** (`app/events/archive/page.tsx`):
  - Past years events with a back link to the current year.
- **Gallery Page** (`app/gallery/page.tsx`):
  - Photos grouped by event tag in a responsive grid.
  - URL cleaning and error handling for malformed photo URLs.
- **Blog & News Listing** (`app/about/blog-news/page.tsx`):
  - Filter tabs for All, News, and Blog & Opinion categories.
  - Post cards with image, category badge, title, excerpt, author, date.
  - Share buttons on each post.
- **Blog & News Detail** (`app/about/blog-news/[slug]/page.tsx`):
  - Full post rendering with sanitized HTML.
  - Author, date, featured image, PDF download link.
  - Share buttons.

### Deliverables

- Fully functional homepage with dynamic content.
- Events calendar with current and archived events.
- Photo gallery with event tagging.
- Blog/news system with filtering and detail pages.

---

## Phase 5: Public Pages — Ministry & Community

**Goal:** Build the remaining public pages that highlight the ministry's structure, history, and community.

### Tasks Completed

- **Office Bearers** (`app/office-bearers/page.tsx`):
  - Leadership directory with server-side data fetching.
  - Client-side search bar (`OfficeBearersClient.jsx`) filtering by name or role.
  - Featured leaders displayed prominently (Pastor in Charge, Youth Director).
  - Standalone office bearers in card grid.
  - Team-grouped sections with member cards.
  - Individual profile pages at `/office-bearers/[id]`.
- **Mathetes Fellowship** (`app/mathetes/page.tsx`):
  - Fellowship logo and branding.
  - Mission statement and organizational description.
  - "Mathetes Diaries" entries in responsive masonry layout.
  - Mathetes in-charge leaders section.
- **Cezo Mepu** (`app/cezo-mepu/page.tsx`):
  - Nine regional youth groups listed with photos.
  - Address, description, and assigned Youth Supervisors.
  - WhatsApp group join buttons per location.
- **The Living Room** (`app/living-room/page.tsx`):
  - Video episode listing with Roman numeral numbering.
  - YouTube embed player per episode.
  - Episode descriptions alongside video.
- **About Pages:**
  - **Journey** (`app/about/journey/page.tsx`) — Ministry history with hero, timeline (1960–Today), three alternating chapters (Foundation, Growth, Mathetes), pull quote, and closing CTA.
  - **Aims & Goals** (`app/about/aims/page.tsx`) — Placeholder page.
- **Coming Soon** (`app/coming-soon/page.tsx`) — Pre-launch landing page.
- **Developers** (`app/developers/page.tsx`) — Team page with admin panel redirect.

### Deliverables

- Complete public website covering all ministry information.
- Searchable leadership directory.
- Video content platform.
- Ministry history narrative.

---

## Phase 6: Admin Panel — Authentication & Dashboard

**Goal:** Build a secure admin panel for content management.

### Tasks Completed

- **Admin Login** (`app/admin/page.tsx`):
  - Email/password sign-in form.
  - Error handling and loading state.
  - Redirect to dashboard on success.
- **Password Update** (`app/auth/update-password/page.tsx`):
  - Password reset/update page.
- **Admin Dashboard** (`app/admin/dashboard/page.tsx`):
  - Session validation on mount — redirects unauthenticated users.
  - Sign out functionality.
  - Tabbed interface with six content management sections.
- **Middleware Auth Guard** (`proxy.ts`):
  - Supabase session check for `/admin/dashboard` routes.
  - Role verification — only `app_metadata.role = 'admin'` users allowed.
  - Unauthorized redirect to login page.
- **Login Alias** (`app/login/page.tsx`) — Re-exports the admin login page.

### Deliverables

- Secure authentication flow.
- Role-based access control.
- Admin dashboard with tab navigation.

---

## Phase 7: Admin Panel — Content Management Sections

**Goal:** Build the complete CRUD interfaces for all content types.

### Tasks Completed

- **Posts Management** (`components/admin/sections/PostsSection.tsx`):
  - Create, read, update, delete posts.
  - TipTap rich text editor (`components/admin/RichTextEditor.tsx`) with bold, italic, underline, headings, lists, and blockquotes.
  - Draft/published toggle.
  - Photo and PDF attachment support.
  - Auto-slug generation from title.
- **Events Management** (`components/admin/sections/EventsSection.tsx`):
  - CRUD for events with title, date range, description, and image.
- **Gallery Management** (`components/admin/sections/GallerySection.tsx`):
  - CRUD for gallery photos with caption and event tag.
- **Mathetes Management** (`components/admin/sections/MathetesSection.tsx`):
  - CRUD for Mathetes diary entries.
- **Office Bearers Management** (`components/admin/sections/OfficeBearersSection.tsx`):
  - CRUD for office bearers with team assignments and display order.
- **Living Room Management** (`components/admin/sections/LivingRoomSection.tsx`):
  - CRUD for video episodes with YouTube URL and display order.
- **Admin Shared Components:**
  - `ConfirmDialog.jsx` — delete confirmation modal.
  - `FileUploadInput.jsx` — file upload form input.
  - `ImageCropper.jsx` — image cropping utility.
- **API Routes** (`app/api/admin/*`):
  - `posts/route.ts` — post CRUD operations.
  - `events/route.ts` — event CRUD operations.
  - `gallery/route.ts` — gallery CRUD operations.
  - `mathetes/route.ts` — mathetes CRUD operations.
  - `office-bearers/route.ts` — office bearer CRUD operations.
  - `living-room/route.ts` — living room CRUD operations.

### Deliverables

- Complete content management system.
- Rich text editing for blog posts.
- All six content types manageable through the dashboard.

---

## Phase 8: Media Upload & Image Processing

**Goal:** Implement file upload capabilities with client-side optimization.

### Tasks Completed

- Built **Media Upload API Route** (`app/api/admin/media/upload/route.ts`):
  - Accepts image and PDF uploads.
  - Routes to appropriate Supabase Storage buckets.
  - Returns public URL for database storage.
- Built **Client-Side Image Compression** (`lib/compress/image.ts`):
  - Decodes images via `createImageBitmap`.
  - Resizes to max 1600px preserving aspect ratio.
  - Re-encodes as WebP at 78% quality.
  - Falls back to JPEG if WebP encoding is unsupported.
  - Skips compression for files under 250 KB.
- Integrated compression into the admin post creation flow.

### Deliverables

- Efficient image upload pipeline.
- Automatic image optimization before storage.
- PDF upload support for posts.

---

## Phase 9: Middleware & Launch Infrastructure

**Goal:** Implement the launch gatekeeper, SEO configuration, and deployment infrastructure.

### Tasks Completed

- Built **Launch Gatekeeper** in `proxy.ts`:
  - Pre-launch access restriction — unauthorized visitors see `/coming-soon`.
  - Secret bypass cookie via `?preview=true` param (7-day expiry).
  - System asset exclusions (Next.js internals, API routes, images).
  - Admin path exclusion (login must work for team members).
- Configured **SEO:**
  - `app/robots.ts` — crawler rules allowing public pages, disallowing admin/developers.
  - `app/sitemap.ts` — XML sitemap covering all major pages with priorities.
  - `layout.tsx` — global metadata with title, description, and favicon.
- Configured **CI/CD:**
  - `.github/workflows/ci.yml` — runs on push/PR to main:
    - Dependency installation.
    - ESM-only dependency check.
    - Production build.
    - Smoke tests against production server.
  - `.github/workflows/supabase-keepalive.yml` — pings Supabase REST API every 3 days to prevent database pausing on the free tier.
- Created **Smoke Tests** (`tests/smoke.mjs`):
  - Validates homepage, events, gallery, and blog pages return 200.

### Deliverables

- Launch gatekeeper for controlled rollout.
- SEO configuration for search engines.
- Automated CI pipeline.
- Database keepalive cron job.

---

## Phase 10: Polish, Refinements & Responsiveness

**Goal:** Refine the user experience, fix edge cases, and ensure responsiveness across devices.

### Tasks Completed

- **Mobile Responsiveness:**
  - Updated journey timeline labels to be visible on mobile with alternating up/down positioning.
  - Improved mobile navigation with hamburger menu.
  - Responsive grid layouts across all pages (1→2→3 columns).
  - Touch/swipe support for the hero image slider.
- **Styling Refinements:**
  - Font adjustments and color consistency pass.
  - Glass-morphism effects on journey page (glass-light, glass-mid classes).
  - Mathetes image and branding updates.
  - Hero section background image and text refinements.
  - Gradient overlay changes on journey hero.
- **Edge Case Handling:**
  - Empty states for all data lists (no events, no posts, no photos).
  - Error states for database fetch failures.
  - URL validation for gallery photos (handling markdown-wrapped URLs).
  - Absolute URL normalization for Supabase storage paths.
- **Documentation:**
  - Created `PRD.md` — Product Requirements Document.
  - Created `architecture.md` — Architecture and flow documentation.
  - Created `phases.md` — Phase-by-phase build documentation.
  - Created `design.md` — Design system documentation (colors, fonts, components).
  - Created `memory.md` — Project progress tracker and memory.

### Deliverables

- Polished, production-ready user interface.
- Fully responsive design.
- Comprehensive project documentation.
- Graceful error and empty state handling.

---

## Summary

| Phase | Focus Area | Key Deliverables |
|---|---|---|
| 1 | Project Scaffolding | Next.js + Tailwind + TypeScript setup |
| 2 | Shared UI Components | Navbar, Footer, ProgressBar, utilities |
| 3 | Supabase Integration | Database, RLS, client factories |
| 4 | Core Public Pages | Homepage, Events, Gallery, Blog/News |
| 5 | Ministry & Community Pages | Office Bearers, Mathetes, Cezo Mepu, Living Room, Journey |
| 6 | Admin Authentication | Login, Dashboard, middleware auth guard |
| 7 | Admin Content Management | CRUD sections, TipTap editor, API routes |
| 8 | Media Upload & Processing | File upload, image compression |
| 9 | Launch Infrastructure | Gatekeeper, SEO, CI/CD, smoke tests |
| 10 | Polish & Refinements | Responsiveness, styling, documentation |
