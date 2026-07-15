# PRD: CBCK Youth Forum — Youth Ministry Website

**Product:** CBCK Youth Forum Website  
**Organization:** Chakhesang Baptist Church Kohima (CBCK), Youth Ministry  
**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind CSS v4, TipTap  
**Live URL:** [cbckyouthforum.live](https://cbckyouthforum.live)

---

## 1. Overview

The CBCK Youth Forum website was built as the official digital presence for the Youth Ministry of Chakhesang Baptist Church, Kohima — a church youth department with over 1,000 members in Nagaland, India. The website served as the ministry's content hub, providing a public-facing information portal and a private admin panel for content management.

The project was built using Next.js 16 with the App Router, Supabase for database and authentication, and Tailwind CSS v4 for styling.

---

## 2. Goals and Objectives

### Primary Goals

1. **Establish a central digital presence** for the CBCK Youth Ministry to share information, news, and resources with its congregation and the public.
2. **Enable non-technical administrators** to manage all website content through a user-friendly dashboard.
3. **Showcase the ministry's activities** — events, blog posts, photo galleries, fellowship updates, and video content.
4. **Provide a leadership directory** with search and team-grouping capabilities.
5. **Serve as a historical archive** documenting the ministry's journey since its establishment in 1968.

### Secondary Goals

6. **Implement role-based access control** to secure admin functions.
7. **Optimize for mobile devices** given the high rate of mobile internet usage in Northeast India.
8. **Maintain SEO best practices** for discoverability.
9. **Prepare for a planned launch** with a pre-launch gatekeeper page.

---

## 3. Target Audience

- **Youth Ministry members** (ages 15–35) seeking event information, updates, and resources.
- **Church leadership and parents** looking for ministry information and contact details.
- **General public** interested in the church's youth activities.
- **Admin users** (youth pastors, secretaries, media coordinators) who manage content.

---

## 4. Functional Requirements

### 4.1 Public-Facing Pages

#### 4.1.1 Homepage (`/`)

- A hero section was implemented featuring a welcome message, the ministry's theme ("Renew Thy Church"), and a scripture reference (1 Timothy 4:12).
- An auto-advancing image slider was built with touch/swipe support for mobile devices, cycling through ministry photos every 5 seconds.
- An upcoming events section was built that displayed the next two events fetched from the database with date ranges and descriptions.
- A recent blog & news section was built that displayed the three most recent published posts with truncated content previews.
- A leadership section was built that displayed key leaders (Youth Director, Pastor in Charge, Youth Chairman) in a three-column card layout.
- Navigation cards were built linking to Journey, Aims & Goals, and Blog/News pages.

#### 4.1.2 Events (`/events`)

- A calendar page was built displaying all events for the current year, split into "Upcoming" and "Past Events" sections.
- Individual event cards were built with date, title, description, optional image, and a click-to-enlarge lightbox for event photos.
- A past years archive page was built at `/events/archive`.

#### 4.1.3 Blog & News (`/about/blog-news`)

- A blog listing page was built with filter tabs for "All", "News", and "Blog & Opinion" categories.
- Each post card displayed the category badge, title, truncated content preview, author name, publication date, optional photo, and PDF attachment indicator.
- Share buttons were added to every post for native sharing (Web Share API) with a clipboard copy fallback.
- A post detail page was built at `/about/blog-news/[slug]` with full HTML content rendered through TipTap and sanitized via `sanitize-html`.

#### 4.1.4 Gallery (`/gallery`)

- A photo gallery page was built with images grouped by event tag.
- Photos were displayed in a responsive grid layout (1–3 columns depending on viewport).

#### 4.1.5 Office Bearers (`/office-bearers`)

- A leadership directory was built with client-side search by name or role.
- Featured leaders (Pastor in Charge, Youth Director) were displayed prominently as large cards.
- All other office bearers were displayed in a card grid, grouped by team (committees/ministry teams).
- Individual profile pages were built at `/office-bearers/[id]`.

#### 4.1.6 Cezo Mepu — Regional Groups (`/cezo-mepu`)

- A page was built listing all nine regional youth groups under the church.
- Each location card displayed a photo, name, address, description, and assigned Youth Supervisors with clickable profile links.
- WhatsApp group join buttons were added for each location.

#### 4.1.7 Mathetes Fellowship (`/mathetes`)

- A fellowship page was built for the Mathetes group (Class XI–XII students, ages ~16–18).
- The page included the group's logo, mission statement, and organizational details (four groups: Faith, Chosen, Anchored, Elevate).
- "Mathetes Diaries" entries were displayed in a responsive masonry column layout.
- Mathetes in-charge leaders were listed at the bottom of the page.

#### 4.1.8 The Living Room (`/living-room`)

- A video content page was built featuring "The Living Room" series episodes.
- Each episode card displayed a title (with Roman numeral numbering), description, and embedded YouTube video player.

#### 4.1.9 Journey (`/about/journey`)

- A ministry history page was built with a hero section, an interactive timeline strip (1960 → Today with milestone markers), and three chapter sections (Foundation, Growth, Mathetes).
- Chapters alternated image/text layout and included a year badge, heading, body text, and optional call-to-action buttons.
- A Golden Jubilee pull quote section was styled with glass-morphism effects.
- A closing CTA section invited visitors to see upcoming events.

#### 4.1.10 Aims & Goals (`/about/aims`)

- A placeholder page was built for the ministry's aims and goals content.

#### 4.1.11 Developers (`/developers`)

- A team page was built listing the developers and collaborators behind the website.
- An admin panel access button was added that redirected to `/login` or `/admin/dashboard` based on session state.

### 4.2 Admin Panel

#### 4.2.1 Authentication

- Email/password authentication was implemented using Supabase Auth.
- Row-Level Security (RLS) policies were created on all database tables — public read access, admin-only write/update/delete.
- Admin users were identified via `app_metadata.role = 'admin'` through Supabase JWT claims.
- A login page was built at `/admin` and an alias at `/login`.
- A password update page was built at `/auth/update-password`.

#### 4.2.2 Admin Dashboard (`/admin/dashboard`)

- A tabbed dashboard was built with six content management sections: **Posts, Events, Gallery, Mathetes, Office Bearers, Living Room**.
- Session validation was implemented — unauthenticated users were redirected to the login page.

#### 4.2.3 Posts Management

- A full CRUD interface was built for blog/news posts with a TipTap rich text editor supporting bold, italic, underline, headings (H2/H3), bullet/ordered lists, and blockquotes.
- Posts could be toggled between "Draft" and "Published" states.
- Optional photo and PDF attachments were supported via admin media upload endpoints.
- Category selection (News / Blog & Opinion) and author name fields were included.

#### 4.2.4 Events Management

- A CRUD interface was built for events with title, date range, description, and optional image fields.

#### 4.2.5 Gallery Management

- A CRUD interface was built for gallery photos with caption and event tag fields.

#### 4.2.6 Mathetes Management

- A CRUD interface was built for Mathetes diary entries with title, description, and photo fields.

#### 4.2.7 Office Bearers Management

- A CRUD interface was built for office bearers with name, role, photo, phone, email, team assignment, and display order fields.

#### 4.2.8 Living Room Management

- A CRUD interface was built for Living Room video episodes with title, description, YouTube URL, and display order fields.

### 4.3 Infrastructure

#### 4.3.1 Media Upload

- A media upload API route was built at `/api/admin/media/upload` supporting image uploads (to the `posts-media` bucket) and PDF uploads (to the `posts-pdf` bucket) using Supabase Storage.
- Client-side image compression was implemented via `compressImageFile` — resizing images to a maximum of 1600px and re-encoding as WebP at 78% quality, with a JPEG fallback for browsers without WebP support.

#### 4.3.2 Launch Gatekeeper

- A middleware proxy was implemented in `proxy.ts` that restricted public access before the official launch.
- Authorized team members could bypass the gatekeeper via a secret cookie obtained by visiting `?preview=true`.
- The gatekeeper rewrote unauthorized requests to a `/coming-soon` page while allowing system assets (Next.js internals, images, API routes) through.

#### 4.3.3 Security Headers

- Content Security Policy (CSP) headers were configured in `next.config.ts` allowing Supabase API connections, Google Fonts, YouTube embeds, and Vercel Live feedback.
- Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers were all set.

#### 4.3.4 SEO

- A sitemap was generated at `/sitemap.xml` covering all major pages.
- A `robots.txt` was created that allowed crawlers full access while disallowing `/admin/` and `/developers/` paths.

#### 4.3.5 CI/CD

- A GitHub Actions CI workflow was configured that ran on every push/PR to `main`, performing: dependency installation, ESM-only dependency check, production build, and smoke tests against the production server.
- A Supabase Keep-Alive cron job was configured to ping the database every 3 days to prevent the free-tier database from being paused.

---

## 5. Database Schema

The following database tables were created in Supabase (Postgres):

| Table | Purpose |
|---|---|
| `posts` | Blog and news articles with title, slug, category, content (HTML), author, photo, PDF, published status |
| `events` | Calendar events with title, date range, description, and image |
| `gallery` | Photo gallery entries with photo URL, caption, and event tag |
| `office_bearers` | Leadership directory with name, role, photo, phone, email, team assignment, display order |
| `teams` | Ministry team groupings (e.g. Mathetes Fellowship) |
| `mathetes` | Mathetes fellowship diary entries with title, description, and photo |
| `living_room_seasons` | Living Room video episodes with title, description, YouTube URL, and display order |
| `cezo_mepu_locations` | Regional youth groups with name, address, photo, description, and WhatsApp URL |
| `developers` | Development team members with name, role, photo, and description |

Row-Level Security (RLS) policies were applied to all tables — public read access, admin-only write operations — using Supabase JWT role claims.

---

## 6. User Flows

### 6.1 Public Visitor Flow

1. Visitor lands on the homepage, views the hero section, auto-slider, upcoming events, recent posts, and leadership cards.
2. Visitor browses content pages (Events, Gallery, Blog/News, Mathetes, Cezo Mepu, Living Room).
3. Visitor reads individual blog posts, views event details, or watches video episodes.
4. Visitor uses the search bar on the Office Bearers page to find leaders by name or role.
5. Visitor clicks WhatsApp join buttons on Cezo Mepu locations to join regional group chats.
6. Visitor shares blog posts via the native share dialog or copied link.

### 6.2 Admin Flow

1. Admin navigates to `/admin`, enters email and password.
2. Admin is redirected to the dashboard with six content management tabs.
3. Admin creates, edits, publishes, or deletes content items.
4. Admin attaches photos or PDFs to posts via the file upload interface.
5. Admin signs out when done.

---

## 7. Non-Functional Requirements

- **Performance:** All public pages were server-side rendered (SSR) with `revalidate = 0` (no caching) to ensure fresh content from Supabase.
- **Responsiveness:** The website was built mobile-first with responsive breakpoints at `sm:`, `md:`, and `lg:` Tailwind breakpoints.
- **Accessibility:** ARIA labels were added to interactive elements, semantic HTML was used where possible, and `aria-hidden="true"` was applied to decorative elements.
- **Security:** Row-Level Security enforced database-level access control. CSP headers protected against XSS. Admin routes were protected by session checks in middleware.
- **Typography:** Two Google Fonts were used — Sora (display headings) and Inter (body text).
- **Brand Colors:** A maroon primary color (`#6B1F2A`) and dark text color (`#231F1E`) were used throughout, consistent with the church's branding.

---

## 8. Out of Scope

The following features were identified as out of scope for the initial build:

- User registration and member profiles for the general public.
- Comments or discussion forums on blog posts.
- Donation or payment processing.
- Real-time chat or messaging features.
- Mobile app (native or PWA beyond the web app).
- Multi-language support.

---

## 9. Future Considerations

- Implementing static revalidation (ISR) for improved performance once content publishing volume increases.
- Adding email notifications for content updates.
- Expanding the Living Room section with series/season groupings.
- Adding a calendar subscription (iCal) feature for events.
- Implementing image CDN optimization beyond Supabase Storage.
- Adding analytics integration to track page views and user engagement.
