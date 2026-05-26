# Package Management

## shadcn/ui components

ALWAYS use the shadcn CLI to add UI components — never install their underlying packages manually:

```bash
npx shadcn@latest add button    # Adds button component + auto-installs deps
npx shadcn@latest add command   # Adds cmdk command palette primitives
npx shadcn@latest add popover   # Adds Radix popover primitives
```

shadcn `init` and `add` automatically install peer deps (`lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, etc.). Direct `npm install` is only for packages NOT in the shadcn ecosystem (e.g., `framer-motion`, `drizzle-orm`, `@tanstack/react-query`).

## prompt-kit (AI UI components)

Use [prompt-kit](https://prompt-kit.com) for AI-related UI (mood input, chat, recommendations, streaming responses). Installs via the same CLI:

```bash
npx shadcn@latest add "https://prompt-kit.com/c/prompt-input.json"
npx shadcn@latest add "https://prompt-kit.com/c/message.json"
npx shadcn@latest add "https://prompt-kit.com/c/markdown.json"
```

If the prompt-kit registry returns 429, port the source manually from GitHub.

## Radix UI imports

`radix-ui` umbrella package is installed and re-exports all Radix primitives. **Prefer importing from the umbrella** rather than per-package imports (`@radix-ui/react-*`) to avoid phantom-dependency issues in clean installs:

```ts
// Good
import { VisuallyHidden } from "radix-ui";
<VisuallyHidden.Root>…</VisuallyHidden.Root>

// Risky — phantom dep if not also in package.json
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
```
