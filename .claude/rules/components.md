# Components

- **File naming:** kebab-case (`movie-card.tsx`, `notification-bell.tsx`)
- **Export naming:** PascalCase (`MovieCard`, `NotificationBell`)
- **Prefer function declarations** over arrow functions for components
- **Use `cn()` from `@/lib/utils`** for conditional Tailwind classes
- **Import order:** external libs → internal modules → types → styles
- **Client/server boundary:** Server Components cannot pass functions as props to Client Components. Use string identifiers + lookup maps in the client component instead.
- **`"use client"`** at the top of any file that uses React hooks, event handlers, or browser APIs

## Tailwind class merging gotchas

- `tailwind-merge` (via `cn()`) keeps the LAST conflicting class in a single display group. If a `BUTTON_BASE` constant includes `grid` and a variant adds `hidden md:grid`, the `grid` from BASE wins because of source order — base becomes visible at mobile too. **Fix:** keep display classes out of shared BASE constants when variants need to control breakpoint visibility.
- Different breakpoints are NOT conflicts: `sm:max-w-lg` and `max-w-[90vw]` coexist. Must override per-breakpoint explicitly when needed.
