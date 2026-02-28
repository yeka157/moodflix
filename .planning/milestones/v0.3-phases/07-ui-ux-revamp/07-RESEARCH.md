# Phase 7: UI/UX Revamp - Research

**Researched:** 2026-02-23
**Domain:** Navigation architecture, layout restructuring, color system, detail page routing, GSAP landing page animations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sidebar Navigation:**
- Expandable sidebar: icon-only (~60px) by default, expands to show labels (~200px) on hover
- Hover-to-expand behavior (no click/pin toggle) — expands on mouse enter, collapses on mouse leave
- Mobile/tablet: bottom tab bar with 4 icons (Home, Discover, Series, Library)
- Moodflix logo at top: icon when collapsed, full "Moodflix" text when expanded
- User profile/avatar at bottom with dropdown (logout, settings)
- Same 4 nav items: Home, Discover, Series, Library
- No search in sidebar — search stays on Discover page only
- No AI nav item — AI mood section stays on /home page only
- Active nav indicator: crimson highlight bar/pill on the active item

**Color Scheme:**
- Keep crimson/red accent: `oklch(0.637 0.237 25.331)` — no change to brand color
- Shift backgrounds to warmer tinted dark:
  - Background: `oklch(0.13 0.008 25)` (~#1a1512)
  - Card: `oklch(0.16 0.01 25)` (~#221a16)
  - Muted: `oklch(0.26 0.01 25)` (~#332a26)
  - Border: `oklch(1 0.01 25 / 10%)` (warm-white/10%)
- Sidebar background slightly darker: `oklch(0.11 0.008 25)`

**Detail View:**
- Dedicated page route: `/movie/[id]`, `/tv/[id]` (replacing modal for main browsing)
- Search results on Discover: compact modal/drawer with "View Full Details" link
- Full page layout (single-column full-width):
  - Full-bleed backdrop + gradient fade
  - Title overlay on backdrop
  - Pill badges for metadata: [runtime] [year] [rating]
  - Pill tags for genres
  - Pill chips for cast names
  - Director section + Summary text + Watch providers
  - Fixed bottom action bar: [Add to Library] [Trailer] [Like/Dislike]
- Below main info: More Like This row, Cast photo grid (expandable), Watch providers, Reviews/ratings

**Browse/Grid Layout:**
- Discover page: grid layout with filter dropdowns (Genre, Sort by, Year/decade)
- Series page: same grid+filters layout
- No Category dropdown — removed
- Infinite scroll grid for results
- Home page: unchanged (hero + trending row + personalized rows + AI mood + feature cards)

**Landing Page (Phase 7 scope per CONTEXT.md — but Phase 8 per ROADMAP):**
- Full redesign with GSAP ScrollTrigger scroll-driven animations
- GSAP allowed for landing page (exception to Framer Motion convention)
- References: generalintelligencecompany.com, farmminerals.com animation quality
- Note: ROADMAP shows landing page as Phase 8. Phase 7 scope per ROADMAP success criteria does NOT include landing page. Research covers it as context for planning clarity.

### Claude's Discretion
- Exact GSAP animation choreography and timing
- Sidebar transition animation details (easing, duration)
- Bottom tab bar design on mobile (icon style, active indicator)
- Filter dropdown component implementation
- Detail page responsive breakpoints
- Search modal/drawer design details
- Landing page section structure and content flow

### Deferred Ideas (OUT OF SCOPE)
- Share functionality on detail pages
- Settings page (dropdown mentions it, but page itself not in scope)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVAMP-01 | Replace top navbar with collapsible sidebar (icon-only + expanded), update warmer dark color scheme, adopt Stremio-inspired detail page + grid layout patterns, mobile bottom tab bar, all existing features preserved | Sidebar pattern with Framer Motion `animate` width, CSS `--sidebar-width` variable for content offset, Tailwind v4 OKLCH color token updates in globals.css, Next.js dynamic routes for detail pages, TMDB recommendations API already in `lib/tmdb.ts` |
</phase_requirements>

---

## Summary

Phase 7 is a structural UI overhaul with five distinct concerns: (1) replacing the top navbar with a hover-expandable sidebar, (2) shifting the color palette to warmer tinted dark tones, (3) migrating movie/TV detail from modal to dedicated page routes, (4) converting Discover/Series browse pages to grid+filter layouts, and (5) preparing the landing page for GSAP-driven animation (though the ROADMAP places landing page in Phase 8 — see note above). Each concern is independently deliverable as a plan, reducing risk from this large scope.

The sidebar is the highest-impact structural change: it requires a new layout wrapper in `app/(app)/layout.tsx`, replacing the 64px top padding offset with a left margin that responds to the sidebar's current width. Framer Motion's `animate` prop on a `motion.div` with `width` transition handles the expand/collapse smoothly; a CSS variable (`--sidebar-width`) bridges the sidebar state to the main content offset. The mobile bottom tab bar is a completely separate component, conditionally rendered at small breakpoints.

The detail page migration (`/movie/[id]`, `/tv/[id]`) is the second highest-impact change. The existing `useMovieDetails` and `useTVDetails` hooks already fetch the needed data; the new pages are mostly a layout exercise. The `MovieDetailModal` must be preserved for the Discover search context (compact drawer). The existing `/api/movies/[id]` and `/api/tv/[id]` routes serve as data sources. The TMDB recommendations function `getMovieRecommendations()` already exists in `lib/tmdb.ts` for the "More Like This" row.

**Primary recommendation:** Break Phase 7 into 5 plans in dependency order: (1) sidebar + layout restructure + color tokens, (2) detail page routes, (3) Discover/Series grid+filters, (4) detail page polish (cast grid, recommendations row, action bar), (5) landing page (or defer to Phase 8).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.33.0 (installed) | Sidebar width animation, bottom tab transitions | Already in project, project convention for UI animations |
| gsap + @gsap/react | 3.x | Landing page ScrollTrigger animations | Explicitly approved by user for landing page only |
| lenis | Latest | Smooth scroll for landing page | Pairs with GSAP ScrollTrigger; reference sites use it |
| tailwindcss v4 | ^4 (installed) | CSS variable-based color tokens, layout classes | Already the project stack |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-dynamic | built-in | Lazy-load GSAP animation components with `ssr: false` | Landing page GSAP sections only |
| shadcn Select | via CLI | Filter dropdowns (Genre, Sort, Year) | Discover/Series filter bar |
| shadcn Sheet or custom | via CLI | Compact search result drawer on Discover | When user clicks search result |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion sidebar width animate | CSS transition on width directly | CSS transitions work but can't coordinate with other Framer Motion elements; FM `layout` prop handles subtree layout shifts automatically |
| shadcn Select for filters | ToggleGroup (current genre chips) | ToggleGroup chips don't scale to 10+ options well; Select dropdown is cleaner for large option sets |
| Lenis for smooth scroll | GSAP ScrollSmoother | ScrollSmoother requires GSAP Club membership; Lenis is free and MIT licensed |

**Installation (new packages only):**
```bash
npm install gsap @gsap/react lenis
npx shadcn@latest add select
npx shadcn@latest add sheet
```

---

## Architecture Patterns

### Recommended Project Structure

```
app/(app)/
├── layout.tsx                    # Replace navbar with sidebar wrapper
├── movie/
│   └── [id]/
│       └── page.tsx              # NEW: Movie detail page
│       └── loading.tsx           # NEW: Loading skeleton
├── tv/
│   └── [id]/
│       └── page.tsx              # NEW: TV detail page
│       └── loading.tsx           # NEW: Loading skeleton
├── discover/
│   └── page.tsx                  # Updated: grid + filter bar
├── series/
│   └── page.tsx                  # Updated: grid + filter bar
components/layout/
├── app-sidebar.tsx               # NEW: replaces app-navbar.tsx
├── bottom-tab-bar.tsx            # NEW: mobile nav
components/movies/
├── movie-detail-page.tsx         # NEW: full-page detail layout
├── movie-search-drawer.tsx       # NEW: compact drawer for search results
├── discover-grid-content.tsx     # NEW: replaces discover-content.tsx (grid mode)
```

### Pattern 1: Hover-Expand Sidebar with CSS Variable Width

**What:** The sidebar animates its `width` via Framer Motion `animate` prop. A CSS variable `--sidebar-width` is updated via inline style on the sidebar element (or via JS) to allow the main content area to use `margin-left: var(--sidebar-width)` or `padding-left: var(--sidebar-width)`.

**Simpler approach (verified):** Use Framer Motion `motion.aside` with `animate={{ width: isExpanded ? 200 : 60 }}`. The main content wrapper uses `ml-[60px]` (always matches collapsed width) since the sidebar is `position: fixed` and does not push layout. Expanded sidebar overlays content (no layout shift needed — standard Stremio/Netflix pattern).

**When to use:** Fixed sidebar that overlays content on expansion — this is the Stremio reference pattern in `Revamp-UI.png`.

```tsx
// Source: framer-motion docs + Stremio reference pattern
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const SIDEBAR_COLLAPSED = 60; // px
const SIDEBAR_EXPANDED = 200; // px

export function AppSidebar({ user }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.aside
      className="fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar border-r border-sidebar-border hidden md:flex"
      animate={{ width: isExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
    >
      {/* Logo area, nav items, user avatar */}
    </motion.aside>
  );
}
```

**Main content offset:** Since the sidebar is `position: fixed`, the main content just needs a left padding equal to the collapsed width:
```tsx
// app/(app)/layout.tsx
<main className="pl-[60px] md:pl-[60px]">
  {/* content */}
</main>
```

### Pattern 2: Mobile Bottom Tab Bar

**What:** A `position: fixed` bottom bar visible only on `md:hidden` screens. Four icon buttons.

**When to use:** Screens below `md` breakpoint (768px). Hide the sidebar entirely on mobile.

```tsx
// components/layout/bottom-tab-bar.tsx
export function BottomTabBar({ user }: { user: { email: string } }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-sidebar border-t border-sidebar-border flex md:hidden">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]">
          <link.icon className={cn("size-5", isActive(pathname, link) ? "text-primary" : "text-muted-foreground")} />
          <span className="text-[10px]">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

### Pattern 3: Detail Page Route

**What:** `app/(app)/movie/[id]/page.tsx` is a Server Component that calls `getMovieDetails(id)` from `lib/tmdb.ts` and renders the full-page layout. Uses `notFound()` for invalid IDs.

**When to use:** All navigation from movie cards (home rows, discover grid, series, library) links to `/movie/{id}`.

```tsx
// app/(app)/movie/[id]/page.tsx
import { notFound } from "next/navigation";
import { getMovieDetails } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";
import { headers } from "next/headers";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // Next.js 15+ params is Promise
  const movieId = Number(id);
  if (Number.isNaN(movieId)) notFound();

  const headersList = await headers();
  const country = getCountryFromHeaders(headersList);

  const details = await getMovieDetails(movieId);
  // Extract regional watch providers
  const watchProviders = details["watch/providers"]?.results?.[country] ?? null;

  return <MovieDetailPageContent details={details} watchProviders={watchProviders} />;
}
```

### Pattern 4: GSAP ScrollTrigger in Next.js App Router

**What:** GSAP components must be `"use client"`. Use `@gsap/react`'s `useGSAP()` hook for automatic cleanup (handles React Strict Mode double-invocation). Register plugins once at module level.

**When to use:** Landing page sections only (Phase 8 or landing page plan within Phase 7).

```tsx
// Source: https://gsap.com/resources/React
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".reveal-text", {
      y: 80,
      opacity: 0,
      stagger: 0.05,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1,
      },
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{/* content */}</div>;
}
```

**Lenis integration with ScrollTrigger:**
```tsx
// lib/lenis.ts — used in landing page layout only
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initLenis() {
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
```

### Pattern 5: Color Token Update (Tailwind v4 OKLCH)

**What:** Update `app/globals.css` `.dark` section. Tailwind v4 uses CSS custom properties + OKLCH. No config file changes needed — all in globals.css.

**Current dark bg:** `oklch(0.13 0.004 25)` — near neutral
**New dark bg:** `oklch(0.13 0.008 25)` — warmer chroma (user-specified)

```css
/* app/globals.css .dark section */
.dark {
  --background: oklch(0.13 0.008 25);    /* warmer tinted dark */
  --card: oklch(0.16 0.01 25);
  --muted: oklch(0.26 0.01 25);
  --border: oklch(1 0.01 25 / 10%);      /* warm-white tinted */
  --sidebar: oklch(0.11 0.008 25);       /* slightly darker than bg */
  /* primary (crimson) unchanged: oklch(0.637 0.237 25.331) */
}
```

### Pattern 6: Discover/Series Grid + Filter Bar

**What:** Replace horizontal MovieRow layout with a `MovieGrid` + filter dropdowns (Genre, Sort, Year). The existing `MovieGrid` component and `useDiscoverByGenre` hook already support this. New state: `selectedGenre`, `sortBy`, `yearFilter`.

**When to use:** Discover page and Series page default view (before any search is active).

```tsx
// components/movies/discover-grid-content.tsx
const [sortBy, setSortBy] = useState<string>("popularity.desc");
const [genreId, setGenreId] = useState<string>("");
const [year, setYear] = useState<string>("");

// Filter bar uses shadcn Select components
<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger className="w-[160px]">
    <SelectValue placeholder="Sort by" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="popularity.desc">Most Popular</SelectItem>
    <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
    <SelectItem value="primary_release_date.desc">Newest</SelectItem>
    <SelectItem value="title.asc">A–Z</SelectItem>
  </SelectContent>
</Select>
```

### Anti-Patterns to Avoid

- **Do not use CSS `transition: width`** on the sidebar without Framer Motion — it cannot be coordinated with `useReducedMotion()` automatically. Use FM's `animate` prop.
- **Do not remove `MovieDetailModal` entirely** — it is still needed for Discover search results (compact drawer). Preserve it, repurpose or wrap it.
- **Do not use `Math.random()` in Server Components** — existing gotcha; detail page uses deterministic data fetching.
- **Do not call `gsap.registerPlugin()` inside `useGSAP`** — register at module level once, outside any component or hook.
- **Do not load GSAP on app pages** — GSAP is landing-page-only. Use `next/dynamic` with `ssr: false` for landing page GSAP components to avoid bundling GSAP into the app.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sidebar width animation | Custom CSS width transition + JS state | Framer Motion `animate={{ width }}` + `useReducedMotion` | Handles spring physics, a11y reduce motion, and plays nice with layout prop |
| Filter dropdowns | Custom dropdown component | shadcn Select (already in project ecosystem) | Accessible, keyboard-navigable, matches existing UI tokens |
| Smooth scroll (landing) | Custom rAF scroll loop | Lenis | Handles momentum, scroll locking, GSAP integration via event listener |
| GSAP cleanup in React | `useEffect` + manual `kill()` | `useGSAP()` from `@gsap/react` | Handles Strict Mode double-invoke, auto-reverts on unmount |
| Detail page data | New API route | Reuse existing `getMovieDetails()` / `getTVDetails()` from `lib/tmdb.ts` | Functions already exist, tested, cache-configured |
| "More Like This" row | New TMDB function | `getMovieRecommendations()` already in `lib/tmdb.ts` | Already exists |

**Key insight:** The data layer for Phase 7 is already complete. All TMDB functions needed for detail pages exist. The work is entirely in layout, routing, and visual redesign.

---

## Common Pitfalls

### Pitfall 1: Next.js params is now a Promise (Next.js 15+)

**What goes wrong:** `const { id } = params` throws a type error or runtime warning in Next.js 15+.
**Why it happens:** Next.js 15 changed `params` to be a Promise in Server Components.
**How to avoid:** Always use `const { id } = await params` in `app/(app)/movie/[id]/page.tsx`.
**Warning signs:** TypeScript error "Property 'id' does not exist on type 'Promise<{id: string}>'"

### Pitfall 2: Sidebar Overlay vs Push Layout

**What goes wrong:** Sidebar expansion shifts main content to the right, causing a jarring layout jump and horizontal scroll.
**Why it happens:** Sidebar is `position: relative` or `position: sticky`, so it participates in document flow.
**How to avoid:** Use `position: fixed` for the sidebar. Main content uses static `padding-left: 60px` (collapsed width). Expanded sidebar overlays content — matching the Stremio/Netflix pattern.
**Warning signs:** Content shifts horizontally when hovering the sidebar.

### Pitfall 3: GSAP Registers ScrollTrigger Before DOM is Ready

**What goes wrong:** ScrollTrigger calculates trigger positions before images/content load, causing misaligned scroll positions.
**Why it happens:** SSR renders HTML without measuring heights; GSAP runs before final layout.
**How to avoid:** Call `ScrollTrigger.refresh()` after all content loads. Use `useGSAP` scope to defer until after mount.
**Warning signs:** Animations trigger at wrong scroll positions.

### Pitfall 4: TMDB Chroma in SVG Fill (Known Gotcha)

**What goes wrong:** Using `oklch()` in SVG `fill` attributes fails silently.
**Why it happens:** SVG attribute syntax doesn't support CSS color functions without a `style` attribute.
**How to avoid:** Use hex `#FB2C36` for SVG fills (existing project gotcha, already documented).

### Pitfall 5: Movie Cards Still Pointing to Modal After Detail Page Migration

**What goes wrong:** Clicking a movie card still opens the modal overlay instead of navigating to `/movie/[id]`.
**Why it happens:** `MovieCard.onMovieClick` callback sets state in parent; many call sites must be updated to use `router.push('/movie/${id}')` instead.
**How to avoid:** Update all `onMovieClick` handlers in: `home-movies.tsx`, `discover-content.tsx`, `series-content.tsx`, `library-content.tsx`, `recommendations-grid.tsx`. The Discover search result cards are the exception — they keep the modal (compact drawer).
**Warning signs:** Navigating to `/movie/123` works but clicking a card still shows modal.

### Pitfall 6: Tailwind v4 OKLCH Chroma Values

**What goes wrong:** Background colors appear more or less saturated than intended.
**Why it happens:** OKLCH chroma values in `globals.css` are CSS custom properties — not Tailwind utility classes. They must be updated directly in globals.css `.dark` block.
**How to avoid:** Update values in globals.css directly. Verify in browser with DevTools before shipping.

### Pitfall 7: Bottom Tab Bar + Content Overlap on Mobile

**What goes wrong:** Page content is hidden behind the fixed bottom tab bar on mobile.
**Why it happens:** Fixed bottom tab bar (64px) overlaps the bottom of scrollable content.
**How to avoid:** Add `pb-16 md:pb-0` to the `<main>` wrapper in `app/(app)/layout.tsx`.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### Sidebar component skeleton

```tsx
// components/layout/app-sidebar.tsx
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Tv, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { MoodflixLogo } from "@/components/brand/moodflix-logo";
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

const COLLAPSED = 60;
const EXPANDED = 200;

const navLinks = [
  { href: "/home", label: "Home", icon: Home, exact: true },
  { href: "/discover", label: "Discover", icon: Compass, exact: false },
  { href: "/series", label: "Series", icon: Tv, exact: false },
  { href: "/library", label: "Library", icon: Bookmark, exact: false },
];

export function AppSidebar({ user }: { user: { email: string } }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.aside
      className="fixed top-0 left-0 h-full z-50 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden hidden md:flex"
      animate={{ width: expanded ? EXPANDED : COLLAPSED }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 26 }}
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0">
        {expanded ? (
          <MoodflixLogo height={24} variant="dark" />
        ) : (
          <MoodflixIcon size={28} variant="dark" />
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
        {navLinks.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 h-11 px-3 rounded-lg transition-colors",
                  active ? "text-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="size-5 shrink-0 relative z-10" />
                <motion.span
                  className="text-sm font-medium whitespace-nowrap relative z-10 overflow-hidden"
                  animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {label}
                </motion.span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User avatar — bottom */}
      <div className="px-2 pb-4 shrink-0">
        {/* DropdownMenu with logout */}
      </div>
    </motion.aside>
  );
}
```

### Updated app layout

```tsx
// app/(app)/layout.tsx
export default async function AppLayout({ children }: { children: ReactNode }) {
  // ... auth check ...
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar user={{ email: user.email ?? "" }} />
      <BottomTabBar />
      <main className="md:pl-[60px] pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <Providers>{children}</Providers>
        </div>
      </main>
    </div>
  );
}
```

### Movie detail page structure

```tsx
// app/(app)/movie/[id]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getMovieDetails, getMovieRecommendations } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";
import { MovieDetailPageContent } from "@/components/movies/movie-detail-page";

export default async function MovieDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = Number(id);
  if (Number.isNaN(movieId)) notFound();

  const headersList = await headers();
  const country = getCountryFromHeaders(headersList);

  const [details, recommendations] = await Promise.all([
    getMovieDetails(movieId),
    getMovieRecommendations(movieId),
  ]);

  const watchProviders = details["watch/providers"]?.results?.[country] ?? null;

  return (
    <MovieDetailPageContent
      details={details}
      watchProviders={watchProviders}
      recommendations={recommendations.results}
    />
  );
}
```

### GSAP registration (landing page only)

```tsx
// Source: https://gsap.com/resources/React
// components/landing/animated-hero.tsx — "use client"
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once at module level
gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AnimatedHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".hero-title span", {
      y: 100,
      opacity: 0,
      stagger: 0.03,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        scrub: 0.5,
      },
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{/* ... */}</div>;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Top navbar (64px, fixed top) | Fixed left sidebar (60px collapsed, 200px expanded hover) | This phase | All pages need `md:pl-[60px]` offset; mobile gets bottom tab bar |
| MovieDetailModal (Dialog overlay) | Dedicated `/movie/[id]` page route | This phase | Movie cards become `<Link>` elements instead of button callbacks; Discover search results keep compact drawer |
| Horizontal MovieRow on Discover | Grid layout + filter dropdowns | This phase | `DiscoverContent` component restructured; existing `MovieGrid` reused |
| Neutral dark bg `oklch(0.13 0.004 25)` | Warmer tinted dark `oklch(0.13 0.008 25)` | This phase | Small chroma increase; visually "warmer" cinema feel |
| Modal-based cast display (circular avatars, horizontal scroll) | Pill chips for cast names (no photos) on page | This phase | Simpler, faster, Stremio reference style |

**Deprecated/outdated after this phase:**
- `components/layout/app-navbar.tsx` — replaced by `app-sidebar.tsx` + `bottom-tab-bar.tsx`
- `onMovieClick` callback prop on MovieCard (for main browsing) — replaced by `href` prop using Next.js Link

---

## Open Questions

1. **MovieCard: callback vs Link prop for navigation**
   - What we know: Currently all movie cards use `onMovieClick: (movie: Movie) => void` which sets parent state for modal. After Phase 7, cards from home/discover/series/library navigate to `/movie/[id]`.
   - What's unclear: Should `MovieCard` have dual mode (callback for search drawer, link for browse), or two separate components?
   - Recommendation: Add an optional `href` prop to `MovieCard`. When `href` is set, render as `<Link>` and ignore `onMovieClick`. Discover search mode passes no `href` (uses callback for drawer). All other contexts pass `href="/movie/${movie.id}"`.

2. **TV detail page: `/tv/[id]` or unified `/movie/[id]?type=tv`**
   - What we know: CONTEXT.md specifies separate `/tv/[id]` route. The existing modal uses `mediaType` prop.
   - What's unclear: Whether TV shows currently navigated from `/series` page need the same detail page treatment.
   - Recommendation: Create separate `/app/(app)/tv/[id]/page.tsx` using `getTVDetails()`. TV cards on `/series` link to `/tv/[id]`. This maintains the existing separation (movies vs TV) used throughout the codebase.

3. **Discover page: retain current search-first behavior?**
   - What we know: CONTEXT.md says grid layout with filters. Current Discover has search bar + genre toggle chips.
   - What's unclear: Whether the search bar moves to a different position or gets replaced by a search icon that opens a modal/drawer.
   - Recommendation: Per CONTEXT.md ("Search stays on Discover page only"), keep the search input on the Discover page. Migrate genre toggle chips to Select dropdown. Default view shows the grid. Search results show in a compact drawer (not full-page navigation).

4. **`NextTopLoader` on sidebar layout**
   - What we know: `NextTopLoader` is currently in `app/(app)/layout.tsx` as a top progress bar.
   - What's unclear: Whether it conflicts visually with the sidebar (top-left corner overlap).
   - Recommendation: Keep it. `NextTopLoader` is fixed top-left to top-right and the sidebar is fixed left — they overlap only at the top-left corner at 2px height, which is acceptable.

5. **TMDB "user reviews" for detail page**
   - What we know: CONTEXT.md mentions Reviews/ratings section. TMDB has a `/movie/{id}/reviews` endpoint.
   - What's unclear: Whether this requires a new TMDB fetch function or if it should be a separate lazy-loaded section.
   - Recommendation: Defer reviews to a follow-up plan or Phase 8. The core detail page can launch without reviews. Add `getMovieReviews()` to `lib/tmdb.ts` when the section is implemented.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/llmstxt/gsap_llms_txt` — GSAP useGSAP hook, ScrollTrigger, React/SSR patterns
- Context7 `/websites/motion_dev` — Framer Motion layout animations, animate prop
- `components/layout/app-navbar.tsx` — Current navbar code (read directly)
- `components/movies/movie-detail-modal.tsx` — Current modal code (read directly)
- `lib/tmdb.ts` — All existing TMDB functions (read directly)
- `app/globals.css` — Current OKLCH color tokens (read directly)
- `app/(app)/layout.tsx` — Current layout structure (read directly)
- GSAP official: https://gsap.com/resources/React

### Secondary (MEDIUM confidence)
- WebSearch verified: GSAP Next.js App Router setup — `useGSAP` hook + `"use client"` + SSR safety
- WebSearch verified: Lenis + GSAP ScrollTrigger integration pattern
- Next.js official docs: Dynamic segments, `params` as Promise in Next.js 15+

### Tertiary (LOW confidence)
- WebSearch: Lenis performance on low-end devices (community discussion, not benchmarked)
- Animation timing values (spring stiffness/damping) — will need visual tuning during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project or well-documented
- Architecture: HIGH — patterns derived from reading actual codebase; no guesswork about existing structure
- Pitfalls: HIGH — most derived from codebase analysis (existing gotchas documented in CLAUDE.md) and Next.js docs
- GSAP patterns: MEDIUM — verified via Context7 and official docs; timing values are LOW (require visual tuning)

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable libraries; Next.js 16 is installed, stable)

---

## Scope Clarification: Phase 7 vs Phase 8

The CONTEXT.md (gathered from `/gsd:discuss-phase 7`) includes landing page decisions because that was part of the Phase 7 discussion. However, the ROADMAP and git state (`08-landing-page-revamp/` folder exists untracked) confirm the landing page was split into **Phase 8**.

**Phase 7 scope (per ROADMAP success criteria):**
1. Sidebar replaces top navbar
2. Color scheme shifted to warmer tinted dark
3. Detail modal → detail page route (pill-style layout)
4. Discover + Series adopt grid + filter dropdowns
5. All existing features remain functional
6. Responsive: sidebar on desktop, bottom tab bar on mobile

**Phase 8 scope (landing page revamp, separate phase):**
- GSAP ScrollTrigger landing page animations
- Lenis smooth scroll
- Full landing page redesign

The planner should create Phase 7 plans scoped to items 1–6 above, and NOT include GSAP/Lenis/landing page work. Those belong in Phase 8. The GSAP research above is included for Phase 8 planning reference.
