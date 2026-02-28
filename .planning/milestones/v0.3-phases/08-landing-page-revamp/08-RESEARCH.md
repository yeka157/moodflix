# Phase 8: Landing Page Revamp - Research

**Researched:** 2026-02-27
**Domain:** Cinematic landing page animations, scroll-triggered reveals, Framer Motion v12
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cinematic dark theme — dark backgrounds, movie backdrop imagery, crimson accents
- Netflix/Stremio-inspired landing page aesthetic — premium, entertainment-focused
- Hero: cinematic movie backdrop as atmosphere + real app screenshot layered on top
- All 4 core features highlighted equally: AI Mood Discovery, Movie & TV Browse, Personal Library, TV Series (K-Drama/C-Drama)
- World-class scroll-triggered animations — rich but not excessive
- Scroll-triggered section reveals, parallax hero, animated feature transitions
- Cinematic feel — polished and intentional, not "animation for animation's sake"

### Claude's Discretion
- **Animation library**: GSAP vs Framer Motion — choose whichever delivers the best cinematic scroll experience for the landing page. If GSAP is used, it's landing-page-only (Framer Motion stays for the rest of the app)
- **Section order and storytelling flow**: Prioritize storytelling — classic Hero → Features → AI Demo → CTA is a starting point, optimize for narrative impact
- **CTA strategy**: Choose the approach that best converts — single hero CTA + bottom repeat, multiple CTAs, or sticky bar. Prioritize clean design
- **Content copy**: Write compelling headlines matching the cinematic brand
- **Screenshot selection**: Which app screens to showcase in hero and feature sections

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

The current landing page (`app/page.tsx`) was scaffolded in v0.1 and is significantly outdated. It uses simple Framer Motion fade-in-up stagger animations, placeholder gradient poster cards instead of real imagery, and three feature cards that don't include TV Series. The app has since received a full UI/UX revamp (sidebar nav, crimson OKLCH theme, Stremio-inspired layout) that the landing page doesn't reflect at all.

The revamp is fundamentally a storytelling redesign: replace the generic SaaS feel with a cinematic entertainment product page. The hero needs a real movie backdrop image + app screenshot composition. The features section needs to expand to all 4 shipped features (including TV Series) with richer visual treatments. Scroll animations need to graduate from basic whileInView fades to something intentional — parallax depth, staggered reveals, and section entrance choreography that feels like an Apple or Stripe product page.

The animation library decision (GSAP vs Framer Motion) is the highest-stakes technical choice. Framer Motion 12.34.3 is already installed and used throughout the app, has scroll-linked animation support via `useScroll`/`useTransform`, and avoids adding a new dependency. GSAP's ScrollTrigger plugin is more powerful for complex timeline-based scroll choreography but adds ~50KB to the landing page bundle. For this scope — parallax hero, section reveals, feature card stagger — Framer Motion is sufficient and recommended. GSAP would be justified only if timeline-synchronized multi-element sequences are required.

**Primary recommendation:** Use Framer Motion 12.34.3 (already installed) for all landing page animations. Replace all 7 existing `components/landing/` files in-place. Use `useScroll` + `useTransform` for parallax, `whileInView` with staggerChildren for section reveals. Source real TMDB backdrop images server-side for the hero. Use Next.js `<Image>` with priority for the hero backdrop.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.34.3 (installed) | Scroll animations, parallax, reveal transitions | Already in project; v12 has `useScroll`, `useTransform`, `useSpring` for cinematic effects |
| next/image | (Next.js 16.1.6) | Hero backdrop + app screenshot with priority loading | Built-in; handles blur placeholder, priority LCP optimization |
| tailwindcss v4 | (installed) | Layout, responsive, motion-safe variants | Already project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GSAP + ScrollTrigger | ~3.12 (NOT installed) | Timeline-synchronized scroll choreography | Only if multi-step pinned scroll sequences are required; NOT recommended for this phase |
| CSS keyframe animations | N/A (globals.css) | Marquee/marquee-right animations | Already implemented in globals.css for movie-showcase; extend for any CSS-only loops |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Framer Motion useScroll | GSAP ScrollTrigger | GSAP is more powerful for complex timelines but adds ~50KB, requires additional install, and is overkill for this scope |
| Real TMDB backdrop images | Static placeholder images | Real images prove product authenticity; TMDB provides free high-res backdrops at `image.tmdb.org/t/p/original/` |
| Replacing all landing files | Incremental edits | Full replacement is cleaner — current components are v0.1 stubs with no reusable logic |

**Installation:**
```bash
# No new packages required — Framer Motion already installed
# If GSAP is chosen (not recommended):
npm install gsap
```

---

## Architecture Patterns

### Recommended Project Structure
```
components/landing/
├── hero-section.tsx          # REPLACE: cinematic backdrop + screenshot overlay + parallax
├── features-section.tsx      # REPLACE: 4 features, richer visual, scroll stagger
├── movie-showcase.tsx        # REPLACE: real TMDB posters marquee (upgrade from gradient placeholders)
├── ai-preview-section.tsx    # REPLACE: improved copy + visual, keep mock UI concept
├── cta-section.tsx           # REPLACE: compelling final CTA
├── landing-navbar.tsx        # KEEP or minor update (logo + Sign In + Get Started)
└── footer.tsx                # KEEP or minor update

app/
└── page.tsx                  # UPDATE: metadata only; component composition stays same shape
```

### Pattern 1: Parallax Hero with useScroll + useTransform

**What:** The hero backdrop moves at a slower rate than scroll speed, creating depth. The app screenshot moves independently (or is pinned). Works by mapping scroll progress to Y translation.

**When to use:** Hero section only — parallax on every section is excessive and causes jank on low-end devices.

**Example:**
```typescript
// Framer Motion v12 scroll-linked parallax
"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Backdrop moves up at 30% of scroll speed (parallax depth)
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  // Screenshot moves up slightly faster than backdrop
  const screenshotY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  // Fade out content as user scrolls away
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Backdrop layer */}
      <motion.div style={{ y: backdropY }} className="absolute inset-0">
        <Image src={backdropUrl} fill priority alt="" className="object-cover" />
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      </motion.div>

      {/* Content + screenshot */}
      <motion.div style={{ opacity }} className="relative z-10 ...">
        {/* Headline, CTA */}
        <motion.div style={{ y: screenshotY }}>
          <Image src="/screenshots/home.png" ... />
        </motion.div>
      </motion.div>
    </section>
  );
}
```

### Pattern 2: Section Reveal with staggerChildren

**What:** Framer Motion `variants` with `staggerChildren` staggers child animations when the parent enters the viewport via `whileInView`. Standard approach for feature cards.

**When to use:** Features section, any grid of cards. Set `viewport={{ once: true, amount: 0.2 }}` so animation fires once when 20% of section is visible.

**Example:**
```typescript
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

// In component:
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
>
  {features.map((f) => (
    <motion.div key={f.id} variants={cardVariants}>
      {/* feature card */}
    </motion.div>
  ))}
</motion.div>
```

### Pattern 3: Hero Backdrop Image Sourcing (TMDB)

**What:** Fetch trending movies server-side in `app/page.tsx` (Server Component) and pick the first movie with a backdrop. Pass the backdrop URL as a prop to HeroSection. Do NOT expose TMDB_API_KEY to the client.

**When to use:** Hero section backdrop. `app/page.tsx` is already a Server Component — just add a `getTrendingForLanding()` call in `lib/tmdb.ts`.

**Example:**
```typescript
// lib/tmdb.ts — add:
export async function getHeroBackdrop(): Promise<string | null> {
  const data = await tmdbFetch("/trending/movie/week");
  const movie = data.results.find((m: { backdrop_path: string | null }) => m.backdrop_path);
  return movie ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
}

// app/page.tsx:
export default async function Home() {
  const backdropUrl = await getHeroBackdrop();
  return (
    <>
      <HeroSection backdropUrl={backdropUrl} />
      ...
    </>
  );
}
```

### Pattern 4: App Screenshots

**What:** Take screenshots of actual app UI (home page, discover page, series page, library page) and save to `public/screenshots/`. Use Next.js `<Image>` with explicit width/height. Frame with a browser chrome mockup (simple rounded-xl with a dark border + optional top bar with three dots) for polish.

**When to use:** Hero overlay, feature section per-feature visuals.

**Implementation note:** Screenshots must be taken and saved manually before implementation. The planner should include a task for this.

### Anti-Patterns to Avoid
- **Using `animate` (mount animation) instead of `whileInView` for below-fold sections:** Elements below the fold that use `animate` will animate immediately on mount, before the user scrolls to them, making the animation invisible. Always use `whileInView` for sections below the hero.
- **Parallax on every section:** Only the hero should have parallax. Parallax on multiple sections causes competing motion and is visually exhausting.
- **Heavy blur/filter on motion elements:** CSS `filter: blur()` on elements with `transform` triggers GPU layer compositing — use sparingly. Glow overlays should be `position: absolute` siblings, not `filter` on the animated element.
- **`useScroll` without a `target` ref on nested sections:** Without a `target`, `useScroll` tracks the entire page scroll, not the element. For section-local effects, always pass `target: ref`.
- **`Math.random()` in Server Components:** Already a known gotcha — use deterministic backdrop selection (first movie with backdrop_path, no randomness).
- **Importing heavy client components into the Server Component page without `"use client"` boundary:** `HeroSection` must be `"use client"` (it uses `useScroll`). The page itself stays a Server Component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll progress tracking | Custom scroll event listener | `useScroll` from framer-motion | Handles passive listeners, throttling, SSR safety automatically |
| Spring physics for parallax | Custom requestAnimationFrame loop | `useSpring(scrollY, { stiffness, damping })` | Smooth spring-eased parallax in 3 lines |
| Intersection observer for reveals | Custom IntersectionObserver hook | `whileInView` + `viewport` prop | Already used in current codebase; handles threshold, once, margin |
| CSS marquee for poster rows | Custom JS scroll animation | CSS keyframe `marquee-left`/`marquee-right` | Already defined in globals.css — just extend with real posters |
| Image optimization | `<img>` tags | `next/image` with `priority` on hero | Auto WebP, sizing, blur placeholder, LCP optimization |

**Key insight:** The existing codebase already uses `whileInView` in features-section and ai-preview-section. The upgrade is about composition quality and scroll-linked transforms, not new patterns.

---

## Common Pitfalls

### Pitfall 1: Hero Image LCP Regression
**What goes wrong:** The hero backdrop image loads slowly, hurting Core Web Vitals LCP score.
**Why it happens:** Large original-size TMDB backdrop images without priority loading.
**How to avoid:** Use `next/image` with `priority={true}` on the backdrop. Use TMDB's `w1280` size (not `original`) for faster loading: `image.tmdb.org/t/p/w1280{backdrop_path}`. Add `blurDataURL` with a tiny placeholder.
**Warning signs:** LCP > 2.5s in Lighthouse, backdrop flashes in after page load.

### Pitfall 2: Framer Motion Layout Shift from useScroll
**What goes wrong:** The `useScroll` transform causes Cumulative Layout Shift (CLS) because the element starts at a transformed position.
**Why it happens:** If `backdropY` starts at a non-zero value, the initial render and post-hydration render differ.
**How to avoid:** Always start transforms at `"0%"` or `0` — the initial viewport position. The transform only changes as the user scrolls, so the initial state matches SSR.

### Pitfall 3: whileInView Not Firing on Mobile
**What goes wrong:** Section animations don't trigger on mobile Safari.
**Why it happens:** `margin: "-100px"` in viewport config tells Framer Motion to fire when the element is 100px inside the viewport. On small screens, sections might be taller than viewport, so -100px never fires.
**How to avoid:** Use `amount: 0.1` or `amount: 0.2` (percentage of element visible) instead of negative margin. `viewport={{ once: true, amount: 0.15 }}` is more reliable cross-device.

### Pitfall 4: Screenshot Images Missing / Not Committed
**What goes wrong:** `public/screenshots/` images are referenced in code but don't exist, causing broken images in production.
**Why it happens:** Screenshots need to be taken manually before committing.
**How to avoid:** The planning should include an explicit Wave 0 task: take and commit screenshots before any component references them. Use `placeholder-poster.svg` as fallback in the interim.

### Pitfall 5: `"use client"` Boundary Prevents Server Data Fetching in HeroSection
**What goes wrong:** HeroSection needs the TMDB backdrop URL but also needs `useScroll` (client hook).
**Why it happens:** Server data fetching and client hooks can't coexist in the same component.
**How to avoid:** Fetch backdrop in `app/page.tsx` (Server Component) and pass `backdropUrl: string | null` as a prop to `HeroSection` ("use client"). This is the correct pattern — already used for other server→client data flows in this codebase.

### Pitfall 6: Motion div Overflow Causing Horizontal Scroll
**What goes wrong:** Parallax Y-translated backdrop overflows the container, causing a horizontal scrollbar.
**Why it happens:** When the backdrop translates down on initial load, if it's absolutely positioned without `overflow: hidden` on the parent, it may bleed.
**How to avoid:** Always set `overflow-hidden` (or `overflow: hidden`) on the section container that wraps parallax elements.

---

## Code Examples

### Cinematic Hero Structure (verified Framer Motion v12 pattern)
```typescript
"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  backdropUrl: string | null;
}

export function HeroSection({ backdropUrl }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden flex items-center">
      {/* Parallax backdrop */}
      <motion.div style={{ y: backdropY }} className="absolute inset-0 scale-110">
        {backdropUrl ? (
          <Image src={backdropUrl} fill priority alt="" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[oklch(0.11_0.008_25)]" />
        )}
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity: contentOpacity, y: contentY }} className="relative z-10 ...">
        {/* Headline, subline, CTA, screenshot */}
      </motion.div>
    </section>
  );
}
```

### Section Reveal (Stagger Children)
```typescript
// Container + children pattern — viewport fires once at 15% visibility
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
} as const;

<motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
  {items.map((i) => <motion.div key={i.id} variants={item}>{/* ... */}</motion.div>)}
</motion.div>
```

### TMDB Backdrop Fetch (Server Side)
```typescript
// lib/tmdb.ts — add function
export async function getHeroBackdrop(): Promise<string | null> {
  try {
    const data = await tmdbFetch("/trending/movie/week", { cache: "no-store" });
    const movie = (data.results as Array<{ backdrop_path: string | null }>)
      .find((m) => m.backdrop_path);
    if (!movie?.backdrop_path) return null;
    return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
  } catch {
    return null;
  }
}
```

---

## Current State Audit

### What exists in components/landing/

| File | Current State | Revamp Action |
|------|--------------|---------------|
| `hero-section.tsx` | Text-only, crimson radial gradient, basic mount animations, no backdrop image, no screenshot | FULL REPLACE — add backdrop image, screenshot overlay, useScroll parallax |
| `features-section.tsx` | 3 features only (missing TV Series), icon + card layout, basic whileInView | FULL REPLACE — 4 features, richer visuals, improved stagger |
| `movie-showcase.tsx` | 8 fake gradient-colored poster cards with icon placeholders, CSS marquee (working) | UPGRADE — keep marquee mechanism, replace gradient cards with real TMDB poster Images |
| `ai-preview-section.tsx` | Mock textarea UI card, good concept, basic animation | UPDATE — improve copy, better visual composition |
| `cta-section.tsx` | Unknown (not read) — likely minimal | REPLACE with compelling CTA |
| `landing-navbar.tsx` | Unknown — likely matches old v0.1 style | AUDIT — may need logo/style alignment with app identity |
| `footer.tsx` | Unknown — likely minimal | KEEP or minor update |

### App page.tsx
Server Component — already imports all 7 landing components. Pattern is correct. Add `getHeroBackdrop()` call and pass as prop. No structural changes needed.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `animate={{ opacity: 1, y: 0 }}` on mount | `whileInView` with `viewport={{ once: true, amount }}` | Animations only fire when visible |
| Framer Motion v10 `useScroll` | Framer Motion v12 `useScroll` (same API, more stable) | API unchanged — existing patterns still valid |
| GSAP for scroll animations | Framer Motion `useScroll`/`useTransform` for most use cases | FM sufficient for this scope; GSAP only for complex timelines |
| Static hero background | `next/image` with `priority` + TMDB backdrop | LCP-optimized, real content |

---

## Open Questions

1. **App Screenshots — Do they exist?**
   - What we know: `public/screenshots/` directory likely does not exist yet
   - What's unclear: Are there existing screenshots from design files? The Revamp-UI-1.png etc. in git status are reference images, not app screenshots
   - Recommendation: Wave 0 task — take screenshots of the live app (home, discover, series, library) and save to `public/screenshots/`. Plan should not reference these until they exist.

2. **Landing Navbar — Current state**
   - What we know: `landing-navbar.tsx` exists but wasn't read in detail
   - What's unclear: Whether it uses the old logo variant or updated MoodflixLogo
   - Recommendation: Read and audit during implementation; likely needs logo alignment with app nav

3. **CTA Section — Current state**
   - What we know: File exists at `components/landing/cta-section.tsx`
   - What's unclear: Current content and how much needs to change
   - Recommendation: Planner should treat as full replace for a compelling bottom CTA with crimson accent

4. **Movie Showcase Real Posters — TMDB rate limit concern**
   - What we know: The marquee shows 8 posters duplicated (16 total). Fetching 8-12 real TMDB posters server-side is feasible.
   - What's unclear: Whether to pre-select specific well-known movie posters (deterministic) or fetch trending
   - Recommendation: Fetch top 10 trending movie poster paths server-side in `app/page.tsx`, pass to MovieShowcase. Cache with ISR (revalidate: 3600).

---

## Sources

### Primary (HIGH confidence)
- Framer Motion v12 installed (12.34.3) — `useScroll`, `useTransform`, `useSpring`, `whileInView`, `viewport` API confirmed via installed package
- Next.js 16 Image component — `priority`, `fill`, `blurDataURL` props confirmed via project CLAUDE.md and installed version
- TMDB image CDN pattern — `image.tmdb.org/t/p/w1280{path}` confirmed by existing `lib/tmdb.ts` usage in codebase

### Secondary (MEDIUM confidence)
- Framer Motion `useScroll` + `offset: ["start start", "end start"]` pattern — standard documented pattern for hero parallax
- `whileInView` with `amount` instead of `margin` for cross-device reliability — based on Framer Motion docs behavior

### Tertiary (LOW confidence)
- GSAP ScrollTrigger bundle size (~50KB) — estimate from training data; not verified for current GSAP version
- Apple/Stripe-style animation timing values (stiffness/damping) — based on common community patterns, not official source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Framer Motion 12 already installed, Next.js Image well-established, no new dependencies needed
- Architecture patterns: HIGH — all patterns are direct applications of existing codebase conventions (whileInView, Server→Client prop passing)
- Animation specifics: MEDIUM — scroll offset values and easing curves will need tuning during implementation
- Pitfalls: HIGH — drawn from existing project gotchas (CLAUDE.md, STATE.md) and Framer Motion documented behaviors

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (Framer Motion v12 API is stable; no breaking changes expected in this window)
