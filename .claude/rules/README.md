# Project Rules

These files contain coding standards, conventions, and gotchas that apply across the codebase. They are read by Claude Code alongside `CLAUDE.md`.

| File | What it covers |
|------|---------------|
| [typescript.md](./typescript.md) | Type safety, `types/` folder discipline |
| [components.md](./components.md) | Naming, structure, client/server boundaries, Tailwind class merging |
| [data-fetching.md](./data-fetching.md) | TanStack Query, server actions, Drizzle authorization |
| [ui.md](./ui.md) | Loading states, a11y, touch targets, page metadata |
| [ai-endpoints.md](./ai-endpoints.md) | AI route requirements, Vercel AI SDK v5 quirks |
| [animations.md](./animations.md) | Framer Motion, Tailwind v4 motion variants |
| [database.md](./database.md) | Drizzle, Supabase, RLS, migration workflow |
| [git.md](./git.md) | Commit format, branch naming, multi-account SSH |
| [package-management.md](./package-management.md) | shadcn CLI, prompt-kit, Radix umbrella imports |

When adding a new rule, drop it in this directory and link it from `CLAUDE.md` if it deserves headline visibility.
