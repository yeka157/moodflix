# Phase 2: Branding & Assets - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Moodflix logo (wordmark + standalone icon mark), generate favicon set including PWA icons, and build OG images for social sharing. Crimson-on-dark brand identity inspired by the Movielist film-strip reference, with a Netflix-inspired premium feel.

</domain>

<decisions>
## Implementation Decisions

### Logo Design Style
- Film-strip perforations integrated into the "M" letter, same concept as the Movielist reference
- Custom/display typeface (not Inter) for a distinctive, heavy wordmark feel
- SVG as primary format, PNG exports as fallback for contexts where SVG isn't supported
- Standalone icon mark: the film-strip M extracted as a separate usable mark
- Netflix-inspired premium vibe — clean, cinematic, not playful
- Optional small tagline below the wordmark for landing page use only (not in navbar)

### Logo Placement & Variants
- **Navbar (app):** Full wordmark on desktop, collapse to M icon on mobile
- **Landing page:** Logo in both navbar area and hero section
- **Auth pages:** Claude's discretion on logo placement
- **Landing navbar:** Claude's discretion on whether to add a separate landing navbar with Login/Sign Up buttons
- **Both dark and light variants:** Crimson-on-dark for the app, dark-on-light variant for external/press use
- **Logo link behavior:** Claude's discretion (context-aware / vs /home)

### Favicon Approach
- Derive from the standalone film-strip M icon mark
- Full PWA-ready icon set: favicon.ico, apple-touch-icon, 192x192, 512x512, maskable
- Favicon background and simplification level: Claude's discretion based on legibility at small sizes
- Generation method: Claude's discretion (Next.js icon.tsx dynamic or static PNG files)

### OG Image Design
- Movie poster collage style: real movie posters (heavily blurred/darkened) as background texture
- Logo only (no tagline or feature text) — let the visual speak for itself
- Generated dynamically via Next.js og.tsx using ImageResponse/Satori
- Global default OG image + route-specific variants for /discover and /home
- Dark cinematic color palette matching the app theme

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

</decisions>

<specifics>
## Specific Ideas

- **Primary reference:** The Movielist Design Challenge logo (Reference_Logo.png) — film-strip perforations in the M, bold crimson on dark
- **UI reference:** Revamp-UI.png shows the red wordmark in the top-left of a dark sidebar layout
- **Vibe:** Netflix-inspired premium — "clean, cinematic, slightly premium — like Netflix but with the film-strip twist"
- **The M icon should work standalone** — it needs to be recognizable as "Moodflix" even without the full wordmark (for favicon, mobile navbar, app icon)
- The app's crimson accent color is `oklch(0.637 0.237 25.331)` — logo should match or complement this

</specifics>

<deferred>
## Deferred Ideas

- **Separate layout files for landing/auth/app:** User mentioned wanting different layout.tsx files so navbars can have different behavior per context (landing navbar with Login/Sign Up vs app navbar with navigation). This is a layout restructuring concern beyond branding — capture for Phase 3 or a future phase.

</deferred>

---

*Phase: 02-branding-assets*
*Context gathered: 2026-02-18*
