# UI Requirements

- Every async operation must have a loading state (Skeleton for layouts, Spinner for actions)
- All interactive elements need hover, focus-visible, active, and disabled states
- Empty states must include helpful messaging and a call-to-action
- Minimum 44×44px touch targets on mobile
- Respect `prefers-reduced-motion` — gate Framer Motion variants behind `useReducedMotion()`
- All forms must use Zod validation with react-hook-form
- Theme is always dark — no toggle. Accent color is crimson `oklch(0.637 0.237 25.331)`

## Page metadata

- Root layout (`app/layout.tsx`) sets `title.template: "%s | Moodflix"` — any page's `title` field is suffixed automatically
- **Page-level `metadata.title` must be the bare title** (e.g., `"Notifications"`, not `"Notifications | Moodflix"`). Including the suffix produces `"Notifications | Moodflix | Moodflix"`
- Use `Metadata` type import from `"next"`

## Responsive bell/icon patterns

- For dual-render mobile/desktop variants in shared topbar components, use CSS breakpoint classes (`md:hidden` / `hidden md:grid`) rather than `useMediaQuery` — avoids SSR hydration mismatch
- Keep display classes out of shared base constants when variants need to control them (see [components.md](./components.md))
