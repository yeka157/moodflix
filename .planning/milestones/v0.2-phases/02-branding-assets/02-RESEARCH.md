# Phase 2: Branding & Assets - Research

**Researched:** 2026-02-18
**Domain:** SVG logo engineering, Next.js favicon/OG image generation, Google Fonts display typography
**Confidence:** HIGH (Next.js APIs verified against official docs 16.1.6; OKLCH conversion computed precisely; Satori limitations confirmed from GitHub issues)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Film-strip perforations integrated into the "M" letter, same concept as the Movielist reference
- Custom/display typeface (not Inter) for a distinctive, heavy wordmark feel
- SVG as primary format, PNG exports as fallback for contexts where SVG isn't supported
- Standalone icon mark: the film-strip M extracted as a separate usable mark
- Netflix-inspired premium vibe — clean, cinematic, not playful
- Optional small tagline below the wordmark for landing page use only (not in navbar)
- Navbar (app): Full wordmark on desktop, collapse to M icon on mobile
- Landing page: Logo in both navbar area and hero section
- Both dark and light variants: Crimson-on-dark for the app, dark-on-light variant for external/press use
- Derive favicon from the standalone film-strip M icon mark
- Full PWA-ready icon set: favicon.ico, apple-touch-icon, 192x192, 512x512, maskable
- OG images generated dynamically via Next.js og.tsx using ImageResponse/Satori
- Global default OG image + route-specific variants for /discover and /home
- Dark cinematic color palette matching the app theme
- Movie poster collage style: real movie posters (heavily blurred/darkened) as background texture
- Logo only (no tagline or feature text) in OG image

### Claude's Discretion
- Typography weight and specific display font choice for the wordmark
- Color treatment (solid crimson vs crimson accent + white text split)
- Whether "Moodflix" is visually split (Mood|flix) or continuous
- Film-strip perforation count and shape (rounded vs square)
- Navbar logo size
- Logo hover animation (subtle effect vs static)
- Favicon background (transparent vs dark solid)
- Favicon generation method (Next.js icon.tsx vs static files)
- Landing page navbar addition
- Auth page logo placement
- Logo link behavior

### Deferred Ideas (OUT OF SCOPE)
- Separate layout files for landing/auth/app: This is a layout restructuring concern beyond branding — captured for Phase 3 or a future phase.
</user_constraints>

---

## Summary

This phase delivers three interconnected deliverables: an SVG logo system (wordmark + M icon mark), a full PWA-ready favicon set, and dynamic OG images for social sharing. All three share the same crimson-on-dark identity derived from the Movielist film-strip reference.

The reference image (Reference_Logo.png) shows "Movielist" in a bold slab/heavy sans with a film-strip strip integrated into the left side of the "M" — two columns of small rectangular perforations cut into the letter's left vertical stroke. This is the exact motif to replicate. The Revamp-UI.png shows a compact red wordmark at ~20-24px in a dark sidebar context, confirming the mark must read cleanly at small sizes. The SVG approach — geometric path construction with `<clipPath>` cutouts for perforations — is the correct technique here and produces a purely code-based, scalable asset with no font dependency.

The critical technical constraint of this phase is Satori (the engine behind `next/og` / ImageResponse): it does **not** reliably support `filter: blur()` as of early 2026 (open issue #573, pending resvg-js upgrade). The blurred poster collage effect must be achieved via a pre-blurred static base image loaded from disk, not CSS blur. All other OG image techniques (gradients, flexbox layout, local fonts, local images via `readFile`) are well-supported and verified.

**Primary recommendation:** Build the logo as a pure SVG React component using geometric paths + `<clipPath>` perforations. Use static PNG files for favicons (not `icon.tsx`) to gain full control over the maskable variant and to allow the manifest to reference specific paths. Use `app/opengraph-image.tsx` with a pre-blurred collage image loaded from disk as the background base.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/og` (ImageResponse) | Built into Next.js 16 | OG image generation via JSX→PNG | Zero additional deps; statically cached at build time |
| `next/font/google` | Built into Next.js 16 | Self-hosted Google Font for display wordmark | Eliminates external font requests; CSS variable output |
| SVG (inline React component) | N/A | Logo wordmark + icon mark | Resolution-independent; no image requests; animatable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `framer-motion` | Already installed | Logo hover animation | If hover animation is added to logo in navbar |
| `sharp` (optional) | Already in Next.js | Pre-blur poster images offline | For one-time generation of the blurred base image for OG |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static PNG favicons | `icon.tsx` with `generateImageMetadata` | icon.tsx cannot produce `favicon.ico` and cannot reference paths in manifest.ts; static files give full control |
| Pre-blurred static image for OG bg | CSS `filter: blur()` in Satori | Satori does not support filter blur reliably (GitHub issue #573, resvg-js not updated) |
| SVG React component for logo | Actual font + text element | Font path: wordmark shape is non-standard (perforations); SVG paths give pixel-perfect control and work in Satori |

**Installation:**
```bash
# No new packages needed — next/og and next/font are built in
# Display font loaded via next/font/google (zero npm install)
```

---

## Architecture Patterns

### Recommended File Structure
```
app/
├── favicon.ico                          # Static .ico file (kept as-is or replaced)
├── icon.png                             # REMOVE: replaced by static files below
├── apple-icon.png                       # REMOVE: replaced by static files below
├── manifest.ts                          # UPDATE: add full icon set
├── layout.tsx                           # UPDATE: add display font variable + update metadata icons
├── opengraph-image.tsx                  # NEW: global OG image
├── (app)/
│   ├── home/
│   │   └── opengraph-image.tsx          # NEW: /home route OG image
│   └── discover/
│       └── opengraph-image.tsx          # NEW: /discover route OG image
components/
└── brand/
    ├── moodflix-logo.tsx                # NEW: full SVG wordmark (dark + light variants)
    ├── moodflix-icon.tsx                # NEW: standalone M icon SVG
    └── index.ts                         # NEW: barrel export
public/
├── og-base.png                          # NEW: pre-blurred poster collage (1200×630, static)
├── icon-192.png                         # NEW: PWA icon 192×192
├── icon-512.png                         # NEW: PWA icon 512×512
├── icon-maskable.png                    # NEW: PWA maskable icon 512×512 (safe-zone padding)
├── apple-touch-icon.png                 # UPDATE: 180×180, replace current placeholder
├── favicon-32x32.png                    # UPDATE: generated from M icon
└── favicon-16x16.png                    # UPDATE: generated from M icon
assets/
└── BebasNeue-Regular.ttf                # NEW: font file for Satori use in OG images
```

### Pattern 1: SVG Logo React Component
**What:** Pure SVG rendered as a React component. The wordmark is built from SVG path geometry — no font rendering. The film-strip perforations are rectangular cutouts punched into the M's left vertical stroke using a `<clipPath>` containing the letter shape subtracted with `<rect>` elements.
**When to use:** All logo placements — navbar, landing, auth, OG images (via `<img>` with base64 SVG data URI).

**Technique — SVG `<clipPath>` perforation approach:**

The M letter body is drawn as a filled `<path>`. A `<clipPath>` element contains that same M path. Inside the clip region, we overlay small dark rectangles to simulate perforations. Because SVG clip-path in the "non-zero winding" sense masks what's inside, the correct technique is:

1. Draw the M as a filled crimson shape
2. Overlay small dark (background-colored) `<rect>` elements at perforation positions on the left stroke — these act as cutouts visually punched through the M

This is simpler than path boolean operations and works in all SVG contexts including React, OG images, and favicons.

```tsx
// Source: SVG spec + pattern from metafizzy.co wordmark approach
// components/brand/moodflix-icon.tsx

interface MoodflixIconProps {
  size?: number;
  variant?: "dark" | "light";   // dark = crimson on transparent (app use), light = dark on transparent (press use)
  className?: string;
}

export function MoodflixIcon({ size = 32, variant = "dark", className }: MoodflixIconProps) {
  const crimson = "#FB2C36";          // oklch(0.637 0.237 25.331) converted to hex
  const cutoutColor = variant === "dark" ? "#0a0a0a" : "#ffffff";  // matches background
  const letterColor = variant === "dark" ? crimson : "#1a1a1a";

  // ViewBox: 100×100 square (the M icon, standalone)
  // M letter occupies full width with film-strip perforations on left vertical stroke
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* M letterform — geometric sans: two vertical strokes + two diagonal strokes meeting at center top */}
      <path
        d="M8 85 L8 15 L50 55 L92 15 L92 85 L80 85 L80 30 L50 65 L20 30 L20 85 Z"
        fill={letterColor}
      />
      {/* Film-strip perforations on left vertical stroke (x: 8–20) */}
      {/* 4 rectangular cutouts, evenly spaced vertically */}
      <rect x="10" y="20" width="8" height="10" rx="1" fill={cutoutColor} />
      <rect x="10" y="35" width="8" height="10" rx="1" fill={cutoutColor} />
      <rect x="10" y="50" width="8" height="10" rx="1" fill={cutoutColor} />
      <rect x="10" y="65" width="8" height="10" rx="1" fill={cutoutColor} />
    </svg>
  );
}
```

**Note:** The exact path coordinates above are a starting-point geometry. The implementer should refine the M path using a 100×100 coordinate system to match the reference's heavy, slightly condensed letterform. The perforation rectangles must stay within the left stroke bounds (x: 8–20 in the example).

### Pattern 2: Full Wordmark Component
**What:** The M icon + "oodflix" text, rendered as pure SVG with a display font face embedded via `<text>` with `font-family` referencing a CSS variable, OR as a fully geometric SVG. The fully geometric approach (tracing each letter) is the gold standard for logos but is complex. A pragmatic middle-ground: SVG `<text>` element using the display font for "oodflix" portion, with the M rendered geometrically.

**Recommended approach:** Use the M icon geometry + `<text>` for "oodflix" with `font-family="var(--font-display)"`. This means the SVG `<text>` element inherits the display font loaded by `next/font/google`. This works in React component form.

```tsx
// components/brand/moodflix-logo.tsx
interface MoodflixLogoProps {
  height?: number;
  variant?: "dark" | "light";
  showTagline?: boolean;  // landing page only
  className?: string;
}

export function MoodflixLogo({ height = 32, variant = "dark", showTagline = false, className }: MoodflixLogoProps) {
  const crimson = "#FB2C36";
  const cutoutColor = variant === "dark" ? "#0a0a0a" : "#ffffff";
  const textColor = variant === "dark" ? "#ffffff" : "#1a1a1a";
  const letterColor = variant === "dark" ? crimson : "#1a1a1a";

  // Aspect ratio: ~5:1 (wordmark wider than tall)
  const width = height * 5;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Moodflix"
      role="img"
    >
      {/* M icon (0,0 to 100,100) — same geometry as MoodflixIcon */}
      <path
        d="M8 85 L8 15 L50 55 L92 15 L92 85 L80 85 L80 30 L50 65 L20 30 L20 85 Z"
        fill={letterColor}
      />
      <rect x="10" y="20" width="8" height="10" rx="1" fill={cutoutColor} />
      <rect x="10" y="35" width="8" height="10" rx="1" fill={cutoutColor} />
      <rect x="10" y="50" width="8" height="10" rx="1" fill={cutoutColor} />
      <rect x="10" y="65" width="8" height="10" rx="1" fill={cutoutColor} />

      {/* "oodflix" text — using display font variable */}
      {/* The M is already rendered above, so this starts at x=100 */}
      <text
        x="108"
        y="78"
        fontSize="72"
        fontWeight="700"
        fill={textColor}
        fontFamily="var(--font-display), sans-serif"
        letterSpacing="-1"
      >
        oodflix
      </text>

      {/* Optional tagline (landing page only) */}
      {showTagline && (
        <text
          x="108"
          y="96"
          fontSize="12"
          fill={textColor}
          opacity={0.6}
          fontFamily="var(--font-inter), sans-serif"
          letterSpacing="3"
        >
          AI MOVIE DISCOVERY
        </text>
      )}
    </svg>
  );
}
```

### Pattern 3: Display Font Loading
**What:** Load Bebas Neue (recommended) via `next/font/google` as a CSS variable `--font-display`. Add to root layout. Use in logo SVG `<text>` element via `fontFamily="var(--font-display)"`.

```tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
// app/layout.tsx additions

import { Inter, Geist_Mono, Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",        // Bebas Neue only has one weight (400 = Regular, which renders bold)
  variable: "--font-display",
  subsets: ["latin"],
  display: "block",     // prevent FOUT in logo
});

// Add to body className:
// `${inter.variable} ${geistMono.variable} ${bebasNeue.variable} font-sans antialiased`
```

### Pattern 4: Static PNG Favicon Strategy
**What:** Static PNG files in `public/` referenced explicitly in `metadata.icons` in `app/layout.tsx` and in `app/manifest.ts`. favicon.ico in `app/` root.

**Why static over `icon.tsx`:** The `icon.tsx` approach cannot generate `favicon.ico` (Next.js docs state this explicitly). More importantly, `manifest.ts` cannot reference dynamically-generated icon routes for the 192/512 PWA icons in a reliable way — it needs stable `/public/` paths. Static files are the recommended approach per the official Next.js PWA guide.

**Favicon generation workflow:** Generate each PNG by exporting the MoodflixIcon SVG at each target size (using a Node.js script or browser-based tool), then save to `public/`. The maskable variant needs the M icon centered within a safe-zone (the icon should not exceed ~80% of the canvas to ensure no cropping by Android adaptive icons).

```tsx
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
// app/layout.tsx — updated icons block

icons: {
  icon: [
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [
    { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
},
```

```ts
// Source: https://nextjs.org/docs/app/guides/progressive-web-apps
// app/manifest.ts — updated icons block

icons: [
  { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
  { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  {
    src: "/icon-maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",        // Required for Android adaptive icons
  },
],
```

### Pattern 5: OG Image with Pre-Blurred Background
**What:** `app/opengraph-image.tsx` loads a pre-blurred static image from disk via `readFile`, uses it as the `<img>` background, then overlays the Moodflix logo and a gradient vignette. Route-level variants colocate `opengraph-image.tsx` in the route folder.

**Blur limitation and workaround:** Satori (the engine behind ImageResponse) does not support `filter: blur()` — this is a confirmed open issue (#573 on vercel/satori, dependent on a resvg-js upgrade that has not shipped as of early 2026). The workaround is to pre-process the poster collage offline (using Sharp, ImageMagick, or any image editor) and store the result as `public/og-base.png`. This image is then loaded via `readFile` in the OG image route and used directly without any CSS blur.

```tsx
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
// app/opengraph-image.tsx

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Moodflix - AI-Powered Movie Discovery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Load pre-blurred poster collage from public/
  const bgData = await readFile(join(process.cwd(), "public/og-base.png"));
  const bgSrc = `data:image/png;base64,${bgData.toString("base64")}`;

  // Load display font for logo text in OG image
  const fontData = await readFile(
    join(process.cwd(), "assets/BebasNeue-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Pre-blurred poster collage background */}
        <img
          src={bgSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.35,         // darken the already-blurred image further
          }}
        />

        {/* Dark gradient vignette over the background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.85) 100%)",
            display: "flex",
          }}
        />

        {/* Logo — centered */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {/* "MOODFLIX" in display font, crimson M + white rest */}
          <div
            style={{
              display: "flex",
              fontSize: 120,
              fontFamily: "BebasNeue",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#FB2C36" }}>M</span>
            <span style={{ color: "#ffffff" }}>OODFLIX</span>
          </div>
          {/* Tagline (optional for global OG, omit for route-specific) */}
          <div
            style={{
              display: "flex",
              color: "rgba(255,255,255,0.6)",
              fontSize: 22,
              fontFamily: "BebasNeue",
              letterSpacing: "8px",
              marginTop: 8,
            }}
          >
            AI MOVIE DISCOVERY
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "BebasNeue",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
```

**Note on Satori `<img>` ArrayBuffer:** Satori accepts `ArrayBuffer`/typed arrays for `<img src>` at runtime even though TypeScript types don't allow it. The base64 data URI approach above avoids needing `@ts-expect-error`. Both patterns are documented in official Next.js docs.

### Anti-Patterns to Avoid
- **Using CSS `filter: blur()` in Satori:** Confirmed broken. Will render unblurred or incorrectly.
- **`display: grid` in OG images:** Satori only supports flexbox. Use `display: flex` for all layout in ImageResponse.
- **Loading fonts from Google CDN at runtime in OG images:** Always load font files from disk via `readFile`. Network requests in OG image routes are a latency risk.
- **Embedding the SVG logo as a React component directly in ImageResponse JSX:** Satori does not execute React component functions — all JSX must be flat HTML-style elements. Inline the SVG path/geometry directly in the OG image JSX.
- **`icon.tsx` for generating the favicon.ico:** Next.js docs explicitly state: "You cannot generate a favicon icon. Use icon or a favicon.ico file instead."
- **Using `oklch()` color syntax in SVG fill attributes:** SVG `fill` attributes do not support CSS Color Level 4 (`oklch()`). Always use hex (`#FB2C36`) or `rgb()` in SVG.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Custom canvas/puppeteer route | `ImageResponse` from `next/og` | Built-in to Next.js, CDN-cached, zero deps |
| Font self-hosting | Manual `@font-face` in globals.css | `next/font/google` | Automatic subsetting, zero layout shift, no Google network request |
| OKLCH→hex conversion | Manual color math | Pre-computed value `#FB2C36` | Already computed precisely; SVG only accepts hex/rgb |
| PWA icon generation | Custom build script | Export from SVG at each size, save to public/ | One-time operation; static files need no runtime overhead |
| Blurred background in OG | CSS filter blur in Satori | Pre-blurred PNG via Sharp/ImageMagick | Satori blur is broken; static pre-processing is reliable and fast |

**Key insight:** The OG image pipeline in Next.js App Router is production-grade with zero additional packages — `next/og` is bundled, statically optimizes by default (build-time generation + CDN cache), and the file-convention approach (`opengraph-image.tsx`) means no manual metadata wiring.

---

## Common Pitfalls

### Pitfall 1: OKLCH in SVG Fill Attributes
**What goes wrong:** Using `fill="oklch(0.637 0.237 25.331)"` in SVG. This will silently fail — browsers do not support CSS Color Level 4 syntax in SVG presentation attributes.
**Why it happens:** Tailwind and CSS custom properties use OKLCH, so it's easy to copy the design-token value directly.
**How to avoid:** Always use `fill="#FB2C36"` (the computed hex) or `fill="rgb(251,44,54)"` in all SVG elements.
**Warning signs:** Logo appears black or not crimson.

### Pitfall 2: Satori Ignores CSS `filter: blur()`
**What goes wrong:** The OG image renders the poster images sharp, not blurred. The blur is silently dropped.
**Why it happens:** Satori uses resvg-js for SVG→PNG rasterization; resvg-js has not been updated to the version that fixes filter rendering (confirmed as of February 2026, GitHub issue #573).
**How to avoid:** Generate a blurred version of the poster collage offline once (Sharp, Photoshop, ImageMagick — any tool), save as `public/og-base.png`, load from disk in the OG image handler.
**Warning signs:** OG image background is sharp/unblurred when previewed.

### Pitfall 3: Manifest Icons Reference Non-Existent Paths
**What goes wrong:** PWA install prompt shows a broken icon; Chrome DevTools manifest section reports icon errors.
**Why it happens:** The current `manifest.ts` only references `favicon.ico` with `sizes: "any"` — insufficient for Android PWA install and maskable icons.
**How to avoid:** Update `manifest.ts` to reference all four icon paths (`icon-192.png`, `icon-512.png`, `icon-maskable.png`, `favicon.ico`) after placing those files in `public/`.
**Warning signs:** Lighthouse PWA audit fails on installability; Android "Add to Home Screen" shows generic icon.

### Pitfall 4: Bebas Neue Only Has One Weight
**What goes wrong:** Specifying `weight: "700"` in the `Bebas_Neue` import throws a runtime error or falls back silently.
**Why it happens:** Bebas Neue is not a variable font and only ships `Regular` (which is visually heavy/bold). Requesting `700` is invalid.
**How to avoid:** Always specify `weight: "400"` when importing Bebas Neue from `next/font/google`.
**Warning signs:** Next.js build warning or runtime error about invalid font weight.

### Pitfall 5: SVG `<text>` Font Not Loading in Exported PNG
**What goes wrong:** When exporting the SVG logo to PNG (for favicon generation), the `<text>` element falls back to system sans-serif instead of Bebas Neue.
**Why it happens:** SVG `<text>` elements using `font-family="var(--font-display)"` only resolve when the SVG is rendered inside a browser/DOM that has loaded the CSS variable. In headless rendering (canvas, puppeteer, browser without CSS), the variable is undefined.
**How to avoid:** For the standalone M icon (used for all favicons), use only path geometry — no `<text>` elements. For favicon generation from the logo wordmark, render in a browser with the full CSS loaded, or use the TTF with a canvas/Sharp render.
**Warning signs:** Exported PNG shows wrong font; wordmark looks different from browser rendering.

### Pitfall 6: Metadata Icons Conflict with `app/favicon.ico`
**What goes wrong:** The `app/favicon.ico` file takes precedence and overrides icons defined in `metadata.icons` for the favicon slot.
**Why it happens:** Next.js file convention priority: `app/favicon.ico` is automatically linked as `<link rel="icon" href="/favicon.ico" sizes="any">` regardless of metadata configuration.
**How to avoid:** Keep `app/favicon.ico` for the base favicon (or replace its content), and use `metadata.icons` for the explicitly-sized variants (16, 32, 192, 512, apple-touch).
**Warning signs:** Browser tab shows old favicon despite updating `metadata.icons`.

### Pitfall 7: Maskable Icon Safe Zone
**What goes wrong:** Android adaptive icons crop the corners of the PWA icon, cutting off parts of the M mark.
**Why it happens:** Android maskable icons apply a circular or squircle mask that clips ~20% of the canvas edges. The safe zone is the central 80% of the canvas.
**How to avoid:** For `icon-maskable.png`, center the M icon within a solid crimson (or dark) background, scaled to ~60-65% of the canvas size (leaving 17.5%+ padding on all sides).
**Warning signs:** PWA icon on Android home screen shows the M cropped or missing strokes.

---

## Code Examples

### OKLCH Crimson Conversion (verified by computation)
```
oklch(0.637 0.237 25.331)
  → OKLab: L=0.637, a=0.2142, b=0.1014
  → linear sRGB: r=0.939, g=0.020, b=0.033
  → gamma-encoded sRGB: r=251, g=44, b=54
  → HEX: #FB2C36
  → RGB: rgb(251, 44, 54)
```

Use `#FB2C36` in all SVG `fill` attributes and Satori JSX `color`/`background` style values.

### Display Font Import in Root Layout
```tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts (verified Next.js 16.1.6)
import { Inter, Geist_Mono, Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",           // Only valid weight for Bebas Neue
  variable: "--font-display",
  subsets: ["latin"],
  display: "block",        // Use "block" to prevent FOUT during logo render
});

// In RootLayout body className:
// `${inter.variable} ${geistMono.variable} ${bebasNeue.variable} font-sans antialiased`
```

### Route-Level OG Image (colocated)
```tsx
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image (verified Next.js 16.1.6)
// app/(app)/discover/opengraph-image.tsx

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Discover Movies on Moodflix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bgData = await readFile(join(process.cwd(), "public/og-base.png"));
  const bgSrc = `data:image/png;base64,${bgData.toString("base64")}`;
  const fontData = await readFile(join(process.cwd(), "assets/BebasNeue-Regular.ttf"));

  return new ImageResponse(
    (/* JSX with route-specific subtitle */),
    { ...size, fonts: [{ name: "BebasNeue", data: fontData }] }
  );
}
```

### Manifest PWA Icon Set
```ts
// Source: https://nextjs.org/docs/app/guides/progressive-web-apps (verified Next.js 16.1.6)
// app/manifest.ts

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moodflix - AI Movie Discovery",
    short_name: "Moodflix",
    description: "Your personal movie library with AI-powered mood-based discovery.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#FB2C36",    // Updated to precise crimson hex
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

### Navbar Logo Slot (existing file updated)
```tsx
// components/layout/app-navbar.tsx — replace the text logo

import { MoodflixLogo } from "@/components/brand/moodflix-logo";
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

// In the nav left section, replace the text Link:
<Link href="/home" className="flex items-center hover:opacity-80 transition-opacity">
  {/* Full wordmark on md+, M icon on mobile */}
  <span className="hidden md:flex">
    <MoodflixLogo height={28} variant="dark" />
  </span>
  <span className="flex md:hidden">
    <MoodflixIcon size={32} variant="dark" />
  </span>
</Link>
```

### Landing Navbar Logo Slot
```tsx
// components/landing/landing-navbar.tsx — replace text logo

import { MoodflixLogo } from "@/components/brand/moodflix-logo";

// Replace the text Link:
<Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
  <MoodflixLogo height={30} variant="dark" />
</Link>
```

### Auth Page Logo
```tsx
// components/auth/login-form.tsx and signup-form.tsx — replace text logo

import { MoodflixLogo } from "@/components/brand/moodflix-logo";

// Replace the text Link in CardHeader (currently at line 113-119):
<Link href="/" className="inline-flex items-center justify-center hover:opacity-80 transition-opacity">
  <MoodflixLogo height={36} variant="dark" />
</Link>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static OG image in `public/og-image.png` | `app/opengraph-image.tsx` (file convention) | Next.js 13.3 | No manual metadata wiring; per-route variants; build-time cached |
| `app/favicon.ico` only | Multiple size variants via `metadata.icons` + static PNGs | Next.js 13+ | Proper 192/512 for PWA; apple-touch-icon; maskable |
| External Google Fonts CSS | `next/font/google` self-hosted | Next.js 13 | No external request; eliminates FOUT; CLS = 0 |
| `params` as direct object in icon/OG | `params` as `Promise<{...}>` | Next.js 16.0.0 | Breaking change — must `await params` before accessing properties |

**Deprecated/outdated in this codebase:**
- `manifest: "/site.webmanifest"` in `metadata`: The current `metadata` in `layout.tsx` references `/site.webmanifest` (the static file in `public/`) but also has `app/manifest.ts`. Both exist simultaneously. The `app/manifest.ts` takes precedence for the App Router. The `public/site.webmanifest` and `metadata.manifest` reference should be removed to avoid duplication.
- `theme_color: "#dc2626"` in current `manifest.ts`: This is Tailwind's `red-500` in sRGB, not the project's actual crimson. Update to `#FB2C36`.
- Current OG images (`/og-image.png`, `/twitter-image.png`) in `public/`: These are static placeholders. They will be superseded by the dynamic `opengraph-image.tsx` but the static files remain as fallback. Remove the `images` array from the `openGraph` block in `layout.tsx` metadata once the dynamic file is in place — Next.js will pick up the `opengraph-image.tsx` automatically.

---

## Open Questions

1. **Bebas Neue vs alternative at navbar sizes**
   - What we know: Bebas Neue is all-caps only, single weight. At 28px height the wordmark renders approximately 140px wide. The letterforms are tall and condensed with high legibility at display sizes.
   - What's unclear: At exactly 28px height SVG viewport, whether the geometric M perforations remain visually distinct (4 small rects at ~3px each in final render). May need to reduce to 3 perforations for the navbar size.
   - Recommendation: Build with Bebas Neue first; if perforation detail disappears at navbar size, the M icon (no text) is the mobile fallback anyway, so only the desktop ~140px-wide wordmark needs the perforations to read. This is acceptable.

2. **Poster collage for `og-base.png` — content and legality**
   - What we know: Real TMDB poster images are copyright their respective studios. Using them in a pre-blurred collage for OG images of a personal/SaaS project is a gray area.
   - What's unclear: Whether a heavily-blurred (blur radius ~30px+) and darkened (opacity 35%) composite qualifies as transformative use.
   - Recommendation: For production, use TMDB's officially licensed artwork (terms allow display in apps using the TMDB API) or generate an abstract cinematic grid using pure CSS gradients in Satori instead (this avoids the blur limitation entirely — a grid of colored rectangles simulating poster frames is fully supported by Satori).

3. **SVG `<text>` font fallback in favicon export pipeline**
   - What we know: Exporting the wordmark SVG to PNG for the 32px favicon will require font embedding or a headless browser render.
   - What's unclear: The exact tooling available in the project's environment for PNG export.
   - Recommendation: The favicon is derived only from the M icon (pure paths, no `<text>`), so this issue does not apply to the favicon pipeline. The wordmark as PNG is only needed if a light variant PNG export is required for press/external use, which is deferred and not in scope for this phase.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs 16.1.6 — `app-icons` file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
- Next.js official docs 16.1.6 — `opengraph-image` file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- Next.js official docs 16.1.6 — `generateImageMetadata`: https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata
- Next.js official docs 16.1.6 — PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Next.js official docs 16.1.6 — Font optimization: https://nextjs.org/docs/app/getting-started/fonts
- Vercel OG Image Generation docs: https://vercel.com/docs/og-image-generation
- OKLCH→hex computation: Node.js implementation of OKLab→sRGB matrix per CSS Color Level 4 spec (verified: `oklch(0.637 0.237 25.331)` = `#FB2C36`)

### Secondary (MEDIUM confidence)
- Satori filter:blur issue (open as of December 2024): https://github.com/vercel/satori/issues/573
- Next.js favicon.ico overrides metadata icons issue: https://github.com/vercel/next.js/issues/55767
- SVG clipPath technique: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/clipPath

### Tertiary (LOW confidence)
- Bebas Neue weight limitation: Inferred from Google Fonts specimen page and font file structure (single weight only); not verified via font loading test in this project
- Aurora Scharff PWA icons approach: https://aurorascharff.no/posts/dynamically-generating-pwa-app-icons-nextjs-16-serwist/ (confirms static-file approach is current practice)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs verified against official Next.js 16.1.6 docs
- Architecture: HIGH — file paths and conventions verified; OKLCH→hex precisely computed
- Satori blur limitation: HIGH — confirmed open GitHub issue with community verification
- Pitfalls: HIGH — derived from official docs, open issues, and codebase inspection
- Font recommendation (Bebas Neue): MEDIUM — font characteristics from web search; weight limitation requires validation in the actual project

**Research date:** 2026-02-18
**Valid until:** 2026-04-18 (Next.js stable APIs; Satori limitation may be resolved if resvg-js upgrade ships)
