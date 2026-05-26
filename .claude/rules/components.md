---
paths:
  - "components/**/*.tsx"
  - "components/**/*.ts"
---

# Components

- **File naming:** kebab-case (`movie-card.tsx`, `notification-bell.tsx`)
- **Export naming:** PascalCase (`MovieCard`, `NotificationBell`)
- **Prefer function declarations** over arrow functions for components
- **Use `cn()` from `@/lib/utils`** for conditional Tailwind classes
- **Import order:** external libs → internal modules → types → styles
- **`"use client"`** at the top of any file using React hooks, event handlers, or browser APIs

## Client/server boundary

Server Components cannot pass functions as props to Client Components. Use string identifiers + lookup maps in the client component instead.

## Tailwind class merging

- `tailwind-merge` (via `cn()`) keeps the LAST conflicting class in a single display group. If a `BUTTON_BASE` constant includes `grid` and a variant adds `hidden md:grid`, the base `grid` wins (source order), so the element becomes visible at mobile too. **Fix:** keep display classes out of shared BASE constants when variants need to control breakpoint visibility.
- Different breakpoints are NOT conflicts: `sm:max-w-lg` and `max-w-[90vw]` coexist. Must override per-breakpoint explicitly when needed: `max-w-[calc(100%-1rem)] sm:max-w-[90vw] md:max-w-2xl` — never use `!important`.

## Responsive dual-render

For dual-render mobile/desktop variants in shared topbar components, use CSS breakpoint classes (`md:hidden` / `hidden md:grid`) rather than `useMediaQuery` — avoids SSR hydration mismatch.

## UI requirements

- Every async operation needs a loading state (Skeleton for layouts, Spinner for actions)
- All interactive elements need hover, focus-visible, active, and disabled states
- Empty states must include helpful messaging and a call-to-action
- Minimum 44×44px touch targets on mobile
- Respect `prefers-reduced-motion` — gate Framer Motion variants behind `useReducedMotion()`
- All forms must use Zod validation with react-hook-form
- Theme is always dark — no toggle. Accent is crimson `oklch(0.637 0.237 25.331)`

## Radix UI imports

`radix-ui` umbrella is installed and re-exports all Radix primitives. **Prefer importing from the umbrella** to avoid phantom-dependency issues in clean installs:

```ts
// Good
import { VisuallyHidden } from "radix-ui";
<VisuallyHidden.Root>…</VisuallyHidden.Root>

// Risky — phantom dep if not also in package.json
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
```
