---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript

- **Zero `any`** — use `unknown` and narrow instead
- **All types live in the `types/` folder** — never define interfaces/types in component or hook files
- Import types with the `type` modifier: `import type { Movie } from "@/types/movie"`
- Path alias `@/*` maps to project root (e.g., `@/components/ui/button`, `@/lib/utils`)
