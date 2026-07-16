# Design System — CBCK Youth Forum

---

## 1. Color Palette

### 1.1 Brand Colors

| Token | Hex | Usage |
|---|---|---|
| **Maroon (Primary)** | `#6B1F2A` | Primary buttons, links, active states, section headers, accent text, NProgress bar |
| **Maroon Hover** | `#7d2432` | Button hover states |
| **Maroon Darker** | `#571824` | Share button hover |
| **Maroon (Timeline Dot)** | `#7b1f1f` | Journey timeline milestone dots |
| **Dark Text** | `#231F1E` | Body text, headings on white backgrounds |
| **White** | `#FFFFFF` | Page backgrounds, cards |
| **Gold / Accent** | `#c9a84c` | Journey hero heading, pull quote attribution |
| **Warm Ivory** | `#f7f3ea` | Journey hero text, glass backgrounds |

### 1.2 Opacity Variants

| Token | Usage |
|---|---|
| `#231F1E` / `05` | Subtle background fills |
| `#231F1E` / `10` | Borders, dividers, subtle backgrounds |
| `#231F1E` / `20` | Secondary borders |
| `#231F1E` / `30` | Muted icons |
| `#231F1E` / `40` | Muted text (past events label) |
| `#231F1E` / `50` | Secondary text, empty state messages |
| `#231F1E` / `60` | Tertiary text, muted labels |
| `#231F1E` / `70` | Body text on cards, descriptions |
| `#231F1E` / `80` | Rich body text |
| `#6B1F2A` / `10` | Initial badge backgrounds |
| `#6B1F2A` / `15` | Mathetes card gradient start |
| `#C8A46A` / `20` | Mathetes card gradient end |

### 1.3 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| **White (Glass)** | `rgba(255,255,255,0.30–0.90)` | Glass-morphism backgrounds |
| **Black (Overlay)** | `rgba(0,0,0,0.40–0.90)` | Modal backdrops, hero overlay |
| **Gray 050** | `#f9fafb` | Light hover backgrounds |
| **Gray 100** | `#f3f4f6` | Tab inactive, editor toolbar |
| **Gray 200** | `#e5e7eb` | Borders, dividers |
| **Gray 300** | `#d1d5db` | Input borders |
| **Gray 500** | `#6b7280` | Social icon default color |
| **Gray 600** | `#4b5563` | Footer text |
| **Red 600** | `#dc2626` | Error messages |
| **Green 600** | `#16a34a` | Published state, success |
| **WhatsApp Green** | `#25D366` | Cezo Mepu WhatsApp buttons |
| **WhatsApp Hover** | `#1ebe5d` | WhatsApp button hover |

### 1.4 Journey Page-Specific Colors

| Token | Hex | Usage |
|---|---|---|
| **Ink** | `#1c1b1a` | Journey page body text, headings |
| **Dark Overlay** | `rgba(10,8,6,0.32–0.55)` | Hero gradient (previously) |
| **Light Text** | `#f7f3ea` | Journey hero body text |
| **Gold** | `#c9a84c` | Journey hero heading, pull quote CTAs |
| **White Smoke** | `#f8f8ff` | Journey hero tagline |

---

## 2. Typography

### 2.1 Font Families

| Name | CSS Variable | Font | Role |
|---|---|---|---|
| **Display** | `--font-display` | Sora | Headings, titles, emphasis text |
| **Body** | `--font-body` | Inter | Body text, paragraphs, navigation, UI elements |

### 2.2 Font Weights

| Weight | Font | Usage |
|---|---|---|
| 400 (Regular) | Sora + Inter | Body text |
| 500 (Medium) | Sora + Inter | Buttons, navigation links |
| 600 (Semibold) | Sora | Section headers, pull quotes |
| 700 (Bold) | Sora | Primary headings (Page titles, hero) |
| 800 (Extra Bold) | Sora | Large hero headings |

### 2.3 Text Styles

#### Heading Hierarchy

```
Page Title (h1)
┌──────────────────────────────────────────────┐
│  font-display, text-2xl sm:text-3xl           │
│  ← 24–30px, bold                             │
└──────────────────────────────────────────────┘

Section Heading (h2)
┌──────────────────────────────────────────────┐
│  font-display, text-2xl                       │
│  ← 24px, font-display                        │
└──────────────────────────────────────────────┘

Card Title (h3)
┌──────────────────────────────────────────────┐
│  font-display, text-lg                        │
│  ← 18px, font-display                        │
└──────────────────────────────────────────────┘

Hero Heading (Journey page)
┌──────────────────────────────────────────────┐
│  font-display, text-4xl md:text-6xl, bold     │
│  color: #c9a84c (gold)                       │
└──────────────────────────────────────────────┘
```

#### Body Text

```
Default Body
┌──────────────────────────────────────────────┐
│  font-body, text-base (#231F1E)              │
│  ← 16px, Inter, leading-relaxed              │
└──────────────────────────────────────────────┘

Small Text / Metadata
┌──────────────────────────────────────────────┐
│  text-xs uppercase tracking-widest           │
│  color: #6B1F2A (category labels)            │
│  ← 12px, uppercase, wide letter-spacing      │
└──────────────────────────────────────────────┘

Muted Body
┌──────────────────────────────────────────────┐
│  text-sm, #231F1E/70                         │
│  ← 14px, 70% opacity                         │
└──────────────────────────────────────────────┘

Mini Metadata (dates, labels)
┌──────────────────────────────────────────────┐
│  text-xs, #231F1E/40–50                      │
│  ← 12px, low emphasis                        │
└──────────────────────────────────────────────┘
```

### 2.4 Letter Spacing & Transform

| Class | Usage |
|---|---|
| `tracking-wider` | Calendar date month labels |
| `tracking-widest` | Section headers, category badges, "Upcoming" labels |
| `uppercase` | Category badges, section headers, nav links |
| `tracking-[0.35em]` | Journey hero tagline |
| `tracking-[0.25em]` | Mathetes card fallback text |
| `tracking-[0.2em]` | Journey chapter tags |

---

## 3. Layout & Spacing

### 3.1 Page Structure

```
┌──────────────────────────────────┐
│  Navbar                          │  ← sticky, z-50, bg-white/80, backdrop-blur-md
├──────────────────────────────────┤
│                                  │
│  <main className="flex-1">       │  ← min-h-full flex flex-col on body
│                                  │
│  ... Page Content ...            │
│                                  │
│  -- Max-width containers --      │
│  max-w-3xl  (single column)      │
│  max-w-5xl  (two/three column)   │
│  max-w-6xl  (gallery, home)      │
│  max-w-7xl  (navbar inner)       │
│                                  │
├──────────────────────────────────┤
│  Footer                          │  ← bg-gray-100, mt-auto
└──────────────────────────────────┘
```

### 3.2 Section Padding

| Breakpoint | Vertical Padding |
|---|---|
| Default (mobile) | `py-12` (48px) |
| `sm:` | `py-16` (64px) |
| Horizontal | `px-4 sm:px-8` on all sections |

### 3.3 Card Spacing

| Context | Gap |
|---|---|
| Homepage cards (2-col) | `gap-6` |
| Office Bearers (3-col) | `gap-6` |
| Event cards (list) | `space-y-4` |
| Gallery (3-col) | `gap-6` |
| Admin list items | `space-y-3` |

---

## 4. Component Design Tokens

### 4.1 Cards

```
Default Card
┌──────────────────────────────────┐
│  bg-white                        │
│  shadow-md                       │
│  rounded-2xl                     │
│  border border-[#231F1E]/10     │
│  hover:shadow-lg                 │
│  transition-shadow               │
└──────────────────────────────────┘

Glass Card
┌──────────────────────────────────┐
│  bg-white/40                     │
│  backdrop-blur-sm                │
│  border border-white/50          │
│  shadow-md                       │
│  rounded-xl / rounded-2xl        │
└──────────────────────────────────┘
```

### 4.2 Buttons

```
Primary Button
┌──────────────────────────────────┐
│  bg-[#6B1F2A]                    │
│  text-white                      │
│  rounded-lg / rounded-full       │
│  px-4 py-2.5                     │
│  text-sm font-medium             │
│  hover:bg-[#7d2432]              │
│  transition-colors               │
│  disabled:opacity-60             │
└──────────────────────────────────┘

Text Link
┌──────────────────────────────────┐
│  text-sm font-medium             │
│  text-[#6B1F2A]                  │
│  hover:underline                 │
└──────────────────────────────────┘

Tab (Active/Inactive)
┌──────────────────────────────────┐
│  Active:  bg-[#6B1F2A] text-white│
│  Inactive: bg-gray-100 text-60   │
│  hover:bg-gray-200               │
│  px-4 py-1.5                     │
│  rounded-full text-sm font-medium│
└──────────────────────────────────┘
```

### 4.3 Form Inputs

```
Text Input
┌──────────────────────────────────┐
│  w-full                          │
│  border border-gray-300          │
│  rounded-lg                      │
│  px-4 py-2.5                     │
│  text-sm                         │
│  focus:outline-none              │
│  focus:ring-2 focus:ring-[#6B1F2A]│
└──────────────────────────────────┘
```

### 4.4 Modals / Overlays

```
Backdrop
┌──────────────────────────────────┐
│  fixed inset-0 z-50              │
│  bg-black/40                     │
│  flex items-center justify-center│
│  px-4                            │
└──────────────────────────────────┘

Modal Content
┌──────────────────────────────────┐
│  bg-white                        │
│  rounded-2xl                     │
│  shadow-xl                       │
│  w-full max-w-2xl                │
│  p-6                             │
│  max-h-[90vh] overflow-y-auto    │
└──────────────────────────────────┘
```

---

## 5. Glass-Morphism System (Journey Page)

The Journey page (`/about/journey`) uses a custom glass-morphism design language defined in `globals.css`:

### 5.1 Glass Variants

| Class | Background | Blur | Border | Usage |
|---|---|---|---|---|
| `.glass-light` | `rgba(255,255,255,0.55)` | 14px | `rgba(255,255,255,0.75)` | Cards, timeline, chapter text |
| `.glass-mid` | `rgba(255,255,255,0.30)` | 10px | `rgba(255,255,255,0.50)` | Closing CTA section |
| `.glass-dark` | `rgba(20,18,15,0.82)` | 16px | `rgba(255,255,255,0.12)` | Defined but not used |

### 5.2 Glass Buttons

| Class | Usage | Hover State |
|---|---|---|
| `.btn-glass` | Chapter "Know More" CTAs | Background 0.45 → 0.72 |
| `.btn-glass-cta` | "See Upcoming Events" CTA | Background 0.55 → 0.80 |

### 5.3 Image Hover

| Class | Effect |
|---|---|
| `.img-zoom` | `transform: scale(1.04)` on hover with 0.5s ease transition |

### 5.4 Pull Quote Section

The pull quote uses an outer glow ring with gradient border and layered glass:

```
.rounded-3xl p-px
├── bg-[linear-gradient(135deg,rgba(255,255,255,0.6),rgba(255,255,255,0.1))]
└── Inner: bg-[rgba(255,255,255,0.18)] backdrop-blur-[22px]
    shadow-[0_20px_60px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]
```

### 5.5 Timeline Dots

```
.w-7 h-7 rounded-full
├── bg-[#7b1f1f]
├── shadow-[0_0_0_5px_rgba(123,31,31,0.15)]
├── shadow-[0_0_0_9px_rgba(123,31,31,0.06)]
└── shadow-[0_4px_10px_rgba(0,0,0,0.20)]
```

---

## 6. Navbar Design

| Property | Value |
|---|---|
| Background | `bg-white/80` with `backdrop-blur-md` |
| Position | `sticky top-0 z-50` |
| Bottom Border | `border-b border-gray-100` |
| Shadow | `shadow-sm` |
| Logo | 128×48px `object-contain` |
| Desktop Nav | `hidden sm:flex gap-8` |
| Mobile Menu | Hamburger icon, panel with vertical links |

### Navigation Items

```
Home | Gallery | Events | Mathetes | Office Bearers | Cezo Mepu | The Living Room
```

- Desktop: `text-sm font-medium uppercase tracking-wide text-gray-700 hover:text-[#6B1F2A]`
- Mobile: `text-base font-medium uppercase tracking-wide text-gray-700 hover:bg-gray-100`

---

## 7. Footer Design

| Section | Layout |
|---|---|
| **Grid** | `grid grid-cols-1 md:grid-cols-5 gap-x-10 gap-y-10` |
| **Logo + Name** | Column 1 — centered, logo + church name |
| **Contact** | Column 2 — email, phone, social icons (Facebook, Instagram, YouTube) |
| **Events** | Column 3 — links to upcoming/past events |
| **Address** | Column 4 — church address |
| **Map** | Column 5 — embedded Google Maps iframe |
| **Sub-footer** | Bottom bar with Office Bearers, Mathetes, Gallery, Developers links |

Social icons: `text-gray-500 hover:text-[#6B1F2A] transition-colors`

---

## 8. Shadows & Elevation

| Token | Class | Usage |
|---|---|---|
| Small | `shadow-sm` | Navbar, cards |
| Medium | `shadow-md` | Default cards |
| Large | `shadow-lg` | Hovered cards, hero slider |
| Extra Large | `shadow-xl` | Admin modals, Journey pull quote |
| Timeline glow | Custom `shadow-[0_0_0_5px_...]` | Timeline milestone rings |

---

## 9. Borders & Border Radius

| Token | Value | Usage |
|---|---|---|
| Default border | `1px solid` | Cards, inputs |
| Light border | `border-[#231F1E]/10` | Card borders |
| White border | `border-white/40–50` | Glass cards |
| Gray border | `border-gray-200 / 300` | Navbar, inputs |
| `rounded-lg` | 8px | Inputs, buttons |
| `rounded-xl` | 12px | Cards, images |
| `rounded-2xl` | 16px | Featured cards, modals |
| `rounded-3xl` | 24px | Journey glass containers |
| `rounded-full` | 9999px | Pills, tabs, avatars |

---

## 10. Transitions & Animations

| Effect | Timing | Usage |
|---|---|---|
| `transition-colors` | 0.2s | Buttons, links, tabs, hover states |
| `transition-shadow` | 0.2s | Card hover shadows |
| `transition-transform` | 0.2s / 0.5s | Timeline labels, image zoom |
| Hero slider auto-advance | 5s interval | Image carousel rotation |
| NProgress speed | 400ms | Route transition bar |
| Image zoom on hover | 0.5s ease | Journey chapter images |

---

## 11. Iconography

**Library:** `@heroicons/react/24/outline` (24px outline)

| Icon | Component | Usage |
|---|---|---|
| `Bars3Icon` / `XMarkIcon` | Navbar | Mobile menu toggle |
| `ChevronLeftIcon` / `ChevronRightIcon` | HeroSlider | Image navigation arrows |
| `MapIcon` | Homepage | Journey navigation card |
| `PlusIcon` | Homepage | Aims & Goals navigation card |
| `PencilSquareIcon` | Homepage | Blog/News navigation card |
| `MapPinIcon` | Cezo Mepu | Location photo placeholder |
| Custom SVG (Facebook, Instagram, YouTube) | Footer | Social media links |

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Default | < 640px | Single column, stack layout |
| `sm:` | ≥ 640px | Two-column grids, inline flex, horizontal layouts |
| `md:` | ≥ 768px | Three-column grids, row-reverse alternation |
| `lg:` | ≥ 1024px | Full desktop spacing, 3–5 column grids |
| `xl:` | ≥ 1280px | Max-width constraint |

---

## 13. Image & Media Styling

| Context | Sizing | Style |
|---|---|---|
| Hero Slider | Full width, 220–420px height | `object-cover`, rounded corners |
| Event Thumbnail | 144×144px | `object-cover`, rounded-xl |
| Post Featured Image | 100% width, 144–176px height | `object-cover` |
| Leadership Avatar | 96×96px | `rounded-full` |
| Office Bearer Photo | 80×80px | `rounded-full` |
| Gallery Thumbnails | 100% width, 224px height | `object-cover` |
| Mathetes Card | 800×600px | Natural aspect ratio, `h-auto` |
| Journey Chapter | 4:3 aspect ratio | `object-cover` with zoom hover |
| Cezo Mepu Location | 208px width, 160px height | `object-cover` |

---

## 14. Loading, Empty & Error States

### 14.1 Loading (Admin panels)

```
<p className="text-sm text-[#231F1E]/50">Loading Mathetes entries...</p>
```

### 14.2 Empty States

| Page | Message |
|---|---|
| Events | "No events added for {currentYear} yet." |
| Blog/News | "No posts yet." |
| Gallery | "No photos have been added yet." |
| Office Bearers (search) | "No results for '{query}'" |
| Mathetes | "No Mathetes entries yet." |
| Cezo Mepu | "No locations have been added yet." |
| Living Room | "No episodes available yet." |
| Developers | "No team members added yet." |

### 14.3 Error States

| Context | Message |
|---|---|
| Events | "Something went wrong loading events." |
| Gallery | "Something went wrong loading the gallery." + error details in `<pre>` |
| Mathetes | "Something went wrong loading this page." |
| Cezo Mepu | "Something went wrong loading locations." |
| Living Room | "Unable to load episodes at this time." |
| Admin login | "Invalid email or password." |
| Admin save | Dynamic error message from API response |

---

## 15. The Journey Page Divider

A custom divider sits between the hero and timeline sections:

```
.woven-divider (defined in globals.css)
├── Height: 10px
├── Diagonal repeating gradient
├── #a13d2b → #c99a3c (terracotta → ochre)
└── 6px stripe width
```

---

## 16. Component Anatomy

### 16.1 Public Components

---

#### 16.1.1 `HeroSlider` (`components/HeroSlider.tsx`)

**Type:** Client Component (`"use client"`)  
**Props:** None (self-contained — image URLs are hardcoded internally)

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `index` | `number` | `0` | Current slide index |
| `touchStartX` | `number \| null` | `null` | Touch start X position for swipe detection |

**Behavior:**

- Auto-advances every 5 seconds via `setInterval`.
- Swipe left/right with 45px threshold for touch navigation.
- Arrow buttons for desktop navigation.
- Dot indicators at the bottom for direct slide selection.
- 4 hardcoded images from Supabase Storage.

**Image URLs (hardcoded):**

```
https://emsfthlfptmysgzpectv.supabase.co/storage/v1/object/public/media/Hero%20Slider/
├── AA7402285.webp
├── slider.webp
├── DSCF4958.webp
└── Heroslider.webp
```

---

#### 16.1.2 `EventCard` (`components/EventCard.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | `string` | ✅ | — | Event title |
| `event_date` | `string` | ✅ | — | Start date (ISO date string) |
| `event_end_date` | `string \| null` | ❌ | `undefined` | End date for multi-day events |
| `description` | `string \| null` | ❌ | `undefined` | Event description text |
| `image_url` | `string \| null` | ❌ | `undefined` | Event photo URL |

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `lightboxOpen` | `boolean` | `false` | Toggles full-screen image lightbox |

**Date Formatting:** `en-GB` locale — e.g. "15 July 2026"  
**Multi-day display:** "15 July — 17 July 2026"  
**Description truncation:** `line-clamp-3`

---

#### 16.1.3 `LeadershipCard` (`components/LeadershipCard.tsx`)

**Type:** Server Component  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | ✅ | — | Unique identifier (used for detail link) |
| `name` | `string` | ✅ | — | Leader's full name |
| `role` | `string \| null` | ✅ | — | Leadership role/title |
| `photo_url` | `string \| null` | ✅ | — | Profile photo URL |
| `phone` | `string \| null` | ✅ | — | Phone number |
| `email` | `string \| null` | ✅ | — | Email address |

**Rendering:**

- Photo: 96×96px, `rounded-full`, `object-cover`.
- Role: `text-sm text-[#6B1F2A] uppercase tracking-wide`.
- Link: `/office-bearers/{id}` with "Read More →" text.
- Container: Glass card (`bg-white/40 backdrop-blur-sm`).

---

#### 16.1.4 `OfficeBearerCard` (`components/OfficeBearerCard.tsx`)

**Type:** Server Component  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | ✅ | — | Unique identifier (used as HTML `id` for anchor linking) |
| `name` | `string` | ✅ | — | Bearer's full name |
| `role` | `string \| null` | ✅ | — | Office/role title |
| `photo_url` | `string \| null` | ✅ | — | Profile photo URL |
| `phone` | `string \| null` | ✅ | — | Phone number |
| `email` | `string \| null` | ✅ | — | Email address |

**Key Differences from LeadershipCard:**

- Smaller avatar: 80×80px.
- Smaller heading: `text-base` (vs `text-lg`).
- No "Read More" link.
- Anchor ID on root div (`id={id}`) for fragment linking.
- Placeholder gray circle when no photo.

---

#### 16.1.5 `OfficeBearersClient` (`components/OfficeBearersClient.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `featured` | `Person[]` | ✅ | — | Featured leaders (displayed as LeadershipCards) |
| `standalone` | `Person[]` | ✅ | — | Standalone office bearers (not in a team) |
| `rest` | `Person[]` | ✅ | — | Remaining bearers to be grouped by team |
| `teams` | `Team[]` | ✅ | — | Team definitions for grouping |

**Sub-types:**

```typescript
type Person = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  team_id: string | null;
};

type Team = {
  id: string;
  name: string;
  display_order: number;
};
```

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `query` | `string` | `""` | Search query for filtering by name or role |

**Behavior:**

- Filters all person lists by name/role (case-insensitive) on search.
- When searching, all team members are shown flat (ungrouped).
- Empty state: "No results for '{query}'" when search yields no matches.

---

#### 16.1.6 `MathetesCard` (`components/MathetesCard.tsx`)

**Type:** Server Component  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | `string` | ✅ | — | Mathetes entry title |
| `description` | `string \| null` | ✅ | — | Entry description text |
| `photo_url` | `string \| null` | ✅ | — | Entry photo URL |

**Internal Utility:**

```typescript
function truncateText(text: string, maxChars: number): string
```
Truncates description to 180 characters with an ellipsis.

**Fallback Photo:** When `photo_url` is null, displays a gradient placeholder:

```
bg-gradient-to-br from-[#6B1F2A]/15 via-white to-[#C8A46A]/20
Contains: "Mathetes" heading + "Fellowship update" label
```

---

#### 16.1.7 `GalleryItem` (`components/GalleryItem.tsx`)

**Type:** Server Component  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `photo_url` | `string` | ✅ | — | Photo URL |
| `caption` | `string \| null` | ✅ | — | Photo caption |
| `event_tag` | `string \| null` | ✅ | — | Event tag for grouping |

**Image Sizing:** 100% width, 224px height (`h-56`), `object-cover`.  
**Caption overlay:** Bottom section with event tag (maroon, uppercase) and caption (dark, 80% opacity).

---

#### 16.1.8 `SharePostButtons` (`components/SharePostButtons.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | `string` | ✅ | — | Post title for share dialog |
| `url` | `string` | ✅ | — | Full URL to share/copy |

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `copied` | `boolean` | `false` | Shows "Link copied" for 2 seconds after copy |

**Behavior:**

1. Tries native `navigator.share()` (Web Share API) first.
2. Falls back to `navigator.clipboard.writeText()` to copy the URL.
3. Shows "Link copied" feedback for 2 seconds.
4. Returns `null` if URL is empty.

---

#### 16.1.9 `SanitizedHtml` (`components/SanitizedHtml.tsx`)

**Type:** Server Component  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `html` | `string` | ✅ | — | Raw HTML content to sanitize and render |
| `className` | `string` | ❌ | `undefined` | Optional CSS class for the wrapper div |

**Behavior:**

- Decodes HTML entities via `decodeHtmlEntities()` utility.
- Sanitizes HTML via `sanitize-html` to remove dangerous tags/attributes.
- Renders via `dangerouslySetInnerHTML` (safe because content is sanitized).

---

#### 16.1.10 `ProgressBar` (`components/ProgressBar.tsx`)

**Type:** Client Component (`"use client"`)  
**Props:** None  
**Render output:** `null` (logic-only component, no DOM elements)

**Behavior:**

- Initializes NProgress with `{ showSpinner: false, speed: 400, minimum: 0.2 }`.
- Listens for all `<a>` clicks and starts NProgress on internal navigation.
- Completes NProgress on pathname/searchParams change.
- NProgress bar is styled in `globals.css` with maroon (`#6B1F2A`) and 3px height.

---

#### 16.1.11 `Navbar` (`components/Navbar.tsx`)

**Type:** Client Component (`"use client"`)  
**Props:** None  

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `false` | Mobile menu open/closed |

**Refs:**

| Ref | Type | Description |
|---|---|---|
| `panelRef` | `RefObject<HTMLDivElement>` | Reference to mobile menu panel for outside-click detection |

**Navigation Items (hardcoded):**

| Name | Href |
|---|---|
| Home | `/` |
| Gallery | `/gallery` |
| Events | `/events` |
| Mathetes | `/mathetes` |
| Office Bearers | `/office-bearers` |
| Cezo Mepu | `/cezo-mepu` |
| The Living Room | `/living-room` |

**Behavior:**

- Sticky top navigation with `backdrop-blur-md`.
- Mobile hamburger menu at `< sm:` breakpoint.
- Menu closes on outside click (pointer event) and on scroll.
- Logo: 128×48px from `/logo.png`, links to homepage.

---

#### 16.1.12 `Footer` (`components/Footer.tsx`)

**Type:** Server Component  
**Props:** None  

**Social Links (hardcoded):**

| Platform | URL |
|---|---|
| Instagram | `https://www.instagram.com/cbck.youthforum` |
| Facebook | `https://www.facebook.com/groups/CBCKYouthForum/` |
| YouTube | `https://www.youtube.com/@cbckyouthministry8815` |

**Sections:**

1. **Logo + Church Name** — Column 1, centered.
2. **Contact** — Column 2: email (`cbckyouthministry@gmail.com`), phone (`+91 8974494949`), social media icons (custom SVGs).
3. **Events** — Column 3: links to `/events` (Upcoming + Past).
4. **Address** — Column 4: "Chakhesang Baptist Church, Kitsubozou Colony, Kohima, Nagaland, India, 797001".
5. **Map** — Column 5: embedded Google Maps iframe.

**Sub-footer:** Links to Office Bearers, Mathetes, Gallery, Developers.

---

### 16.2 Admin Components

---

#### 16.2.1 `RichTextEditor` (`components/admin/RichTextEditor.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `value` | `string` | ✅ | — | Current HTML content |
| `onChange` | `(val: string) => void` | ✅ | — | Callback when content changes (returns HTML) |

**Extensions:**

| Extension | Configuration |
|---|---|
| `StarterKit` | Default (heading disabled — custom heading extension used instead) |
| `Underline` | Default |
| `Heading` | Levels `[2, 3]` only (H2, H3) |

**Toolbar Buttons (9 actions):**

| Button | Label | Toggle |
|---|---|---|
| Bold | `B` | ✅ |
| Italic | `I` | ✅ |
| Underline | `U` | ✅ |
| Heading 2 | `H2` | ✅ (toggles with paragraph) |
| Heading 3 | `H3` | ✅ (toggles with paragraph) |
| Paragraph | `P` | ✅ |
| Bullet List | `• List` | ✅ |
| Ordered List | `1. List` | ✅ |
| Blockquote | `❝` | ✅ |

**Styling:**

- Editor area: `min-h-[240px]`, prose styles.
- Blockquote customization: no left border, no pseudo-elements.

---

#### 16.2.2 `FileUploadInput` (`components/admin/FileUploadInput.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `accept` | `string` | ✅ | — | File input accept attribute (e.g. `"image/*"`, `"application/pdf"`) |
| `label` | `string` | ✅ | — | Label text when no file is selected |
| `file` | `File \| null` | ✅ | — | Currently selected file |
| `files` | `FileList \| null` | ❌ | `undefined` | Multiple files (for gallery uploads) |
| `currentUrl` | `string \| null` | ❌ | `undefined` | Existing file URL (for edit mode preview) |
| `progress` | `number \| null` | ❌ | `undefined` | Upload progress percentage (0–100) |
| `multiple` | `boolean` | ❌ | `undefined` | Enable multi-file selection |
| `onChange` | `(files: FileList \| null) => void` | ✅ | — | Callback when files are selected |
| `onRemove` | `() => void` | ❌ | `undefined` | Callback to remove current file |

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `cropFile` | `File \| null` | `null` | File currently being cropped |

**Behavior:**

- Shows image preview when an image file is selected (with Crop + Remove buttons).
- Opens `ImageCropper` modal when Crop button is clicked.
- Shows progress bar when `progress` is between 1–99.
- Shows "✓ Upload complete" when `progress === 100`.
- Multi-file mode shows file count instead of individual preview.
- Dashed border area is clickable to open file picker.

---

#### 16.2.3 `ImageCropper` (`components/admin/ImageCropper.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `imageFile` | `File` | ✅ | — | The image file to crop |
| `onCropped` | `(croppedFile: File \| null) => void` | ✅ | — | Callback with the cropped result |
| `onCancel` | `() => void` | ✅ | — | Callback when cropping is cancelled |

**Internal State:**

| State | Type | Default | Description |
|---|---|---|---|
| `crop` | `Crop` | `{ unit: "%", x: 25, y: 25, width: 50, height: 50 }` | Current crop selection |
| `completedCrop` | `PixelCrop \| null` | `null` | Finalized crop dimensions |
| `imageLoaded` | `boolean` | `false` | Whether the image has loaded |

**Export Settings:**

| Setting | Value |
|---|---|
| Max output dimension | 1600px (longer side) |
| Output format | `image/jpeg` |
| Output quality | 0.85 |
| DPR handling | No DPR scaling (avoids oversized exports) |

**Buttons:**

- Reset — resets crop to default 50% centered.
- Cancel — closes cropper without action.
- Confirm Crop — exports cropped JPEG and calls `onCropped`.

---

#### 16.2.4 `ConfirmDialog` (`components/admin/ConfirmDialog.tsx`)

**Type:** Client Component (`"use client"`)  

**Props:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `message` | `string` | ✅ | — | Confirmation message to display |
| `onConfirm` | `() => void` | ✅ | — | Callback when user confirms |
| `onCancel` | `() => void` | ✅ | — | Callback when user cancels |

**Rendering:**

- Fixed overlay at `z-[60]` with `bg-black/40` backdrop.
- Card: `max-w-sm`, white, `rounded-2xl`, `shadow-xl`.
- Cancel button: text, muted, hover darkens.
- Confirm button: `bg-red-500`, hover `bg-red-600`.

---

### 16.3 Admin Section Components (Props Overview)

Each admin section component follows a similar pattern. Below is a summary of their shared structure rather than duplicating identical tables.

**Common Pattern:**

| Element | Description |
|---|---|
| Props | None (all read data directly from Supabase via `createSupabaseBrowserClient()`) |
| State | `items[]` (fetched list), `form` (edit/create form), `editingId`, `showModal`, `saving`, `error` |
| Fetch | `useCallback` + `useEffect` pattern wrapped in `setTimeout` for deferred execution |
| CRUD | Uses API routes (`/api/admin/*`) via `fetch()` POST with JSON body |
| Delete | Uses `ConfirmDialog` component for confirmation |
| Form | Modal overlay with close button, Cancel, and Save/Update buttons |

**Section-Specific Details:**

| Section | Component | API Route | Form Fields |
|---|---|---|---|
| Posts | `PostsSection.tsx` | `/api/admin/posts` | title, slug, category, content (RichTextEditor), author_name, photo, PDF, published toggle |
| Events | `EventsSection.tsx` | `/api/admin/events` | title, event_date, event_end_date, description, image_url |
| Gallery | `GallerySection.tsx` | `/api/admin/gallery` | photo (file upload), caption, event_tag (multi-file upload via drag-and-drop zone) |
| Mathetes | `MathetesSection.tsx` | `/api/admin/mathetes` | title, description, photo_url |
| Office Bearers | `OfficeBearersSection.tsx` | `/api/admin/office-bearers` | name, role, photo, phone, email, team assignment, display_order (includes Team management sub-section) |
| Living Room | `LivingRoomSection.tsx` | `/api/admin/living-room` | title, description, youtube_url, display_order |

**Shared Admin Element Design (all sections):**

```
Input Field
┌──────────────────────────────────────┐
│  "w-full border border-gray-300       │
│   rounded-lg px-4 py-2.5 text-sm      │
│   focus:outline-none                  │
│   focus:ring-2 focus:ring-[#6B1F2A]" │
└──────────────────────────────────────┘

Primary Action Button
┌──────────────────────────────────────┐
│  bg-[#6B1F2A] text-white             │
│  rounded-lg px-6 py-2.5 text-sm      │
│  font-medium                         │
│  hover:bg-[#7d2432]                  │
│  transition-colors                    │
│  disabled:opacity-60                 │
└──────────────────────────────────────┘

Cancel / Secondary Button
┌──────────────────────────────────────┐
│  text-sm text-[#231F1E]/50            │
│  hover:underline                     │
└──────────────────────────────────────┘

List Item Row
┌──────────────────────────────────────┐
│  bg-white shadow-sm                  │
│  rounded-xl px-5 py-4                │
│  flex justify-between gap-3          │
│  Items: title + metadata + actions   │
└──────────────────────────────────────┘
```
