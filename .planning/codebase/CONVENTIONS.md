# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- **Components:** kebab-case (`movie-card.tsx`, `app-navbar.tsx`)
- **Types/Interfaces:** folders named `types/`, files in plural/descriptive form (`movie.ts`, `watchlist.ts`, `auth.ts`)
- **Hooks:** kebab-case prefixed with `use-` (`use-movies.ts`, `use-watchlist.ts`, `use-ai.ts`)
- **Server actions:** camelCase in `actions/` folder (`auth.ts`, `watchlist.ts`)
- **API routes:** lowercase with hyphens (`api/ai/recommend/route.ts`, `api/movies/[id]/route.ts`)
- **Utils/helpers:** camelCase in `lib/` folder (`tmdb.ts`, `utils.ts`, `rate-limit.ts`)

**Functions:**
- Async functions: camelCase (`getTrendingMovies`, `getWatchlist`, `addToWatchlist`)
- Helper functions: camelCase, prefix with specific purpose (`formatRuntime`, `serializeItem`, `dedupeMovies`, `extractLatestGenreSuggestion`)
- Component functions: PascalCase exported (`MovieCard`, `AppNavbar`, `MovieDetailModal`)
- Private component functions: camelCase (`renderDetails`, `handleBookmarkClick`)

**Variables:**
- Local state: camelCase (`selectedMovie`, `debouncedQuery`, `isInWatchlist`)
- Constants: UPPER_SNAKE_CASE when module-level (`GENRES`, `TMDB_BASE_URL`, `GENRE_ENTRIES`)
- Boolean flags: prefix with `is`, `has`, `can`, `should` (`isLoading`, `isInWatchlist`, `hasNextPage`, `hasAnyProvider`)
- Query keys: object pattern with hierarchical structure (`watchlistKeys.all`, `movieKeys.category()`) — see TanStack Query pattern below

**Types:**
- Type names: PascalCase (`Movie`, `MovieDetails`, `WatchlistItem`, `MovieCategory`, `LoginFormData`)
- Type unions: `Type | Type` (`WatchlistStatus = "want_to_watch" | "watched"`)
- Result types: discriminated unions (`WatchlistActionResult = { item: WatchlistItem } | { error: string }`)
- Generic types: PascalCase (`T`, with descriptive suffix when specific like `MovieListResponse`)

## Code Style

**Formatting:**
- ESLint + next/core-web-vitals + TypeScript strict mode enforced
- ESLint config: `eslint.config.mjs` with eslint-config-next (no .eslintrc.json)
- No explicit Prettier config in repository (eslint handles formatting)
- Line width: Not explicitly enforced; project defaults to natural breaks

**Linting:**
- Run with: `npm run lint`
- Enforced via: eslint v9 with flat config (`eslint.config.mjs`)
- Rules: next/core-web-vitals (performance, accessibility) + typescript rules (strict type checking)
- Zero `any` policy — use `unknown` and type narrowing instead

**TypeScript:**
- `strict: true` in `tsconfig.json`
- Target: `ES2017`
- Module resolution: `bundler`
- JSX: `react-jsx` (automatic JSX runtime)
- Path alias: `@/*` maps to project root for imports

## Import Organization

**Order:**
1. External libraries (`react`, `next/*`, third-party packages)
2. Internal modules (`@/lib`, `@/actions`, `@/hooks`)
3. Types (`import type { ... } from "@/types"`)
4. UI components (`@/components/ui`)
5. Feature components (`@/components/...`)
6. Utilities/helpers last if needed

**Path Aliases:**
- `@/` = project root
- `@/components/*` → `components/`
- `@/lib/*` → `lib/`
- `@/hooks/*` → `hooks/`
- `@/types/*` → `types/`
- All relative imports avoid `../../../`

**Type imports:**
- Always use `import type { Movie } from "@/types/movie"` to avoid circular dependencies and reduce bundle
- Separate type imports from value imports when possible

## Error Handling

**Patterns:**
- **Server actions:** Return discriminated union result objects
  ```typescript
  type ActionResult =
    | { item: T; error?: never }
    | { item?: never; error: string }
  ```
- **API routes:** Return `Response.json()` with explicit status codes (400, 401, 429, 500)
- **Mutations/queries:** Use `.safeParse()` for Zod validation, return `{ error: string }` on failure
- **Try-catch:** Catch `unknown`, check `instanceof Error`, log with `console.error()`
- **Database operations:** Catch constraint violations specifically (e.g., `watchlist_user_tmdb_unique`)
- **Rate limiting:** Return 429 with `Retry-After` header on limit exceeded
- **Auth failures:** Return 401 with "Authentication required" message

**Examples:**
```typescript
// Server action pattern
export async function addToWatchlist(data: AddToWatchlistInput): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  try {
    const rows = await db.insert(watchlist).values({...}).returning();
    return { item: serializeItem(rows[0]) };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("watchlist_user_tmdb_unique")) {
      return { error: "Movie already in watchlist" };
    }
    return { error: "Failed to add to watchlist" };
  }
}

// API route pattern
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query");
    if (!query) return Response.json({ error: "Missing query" }, { status: 400 });
    const data = await searchMovies(query);
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}
```

## Logging

**Framework:** Native `console` object (no logger library)

**Patterns:**
- **Errors:** `console.error("Context:", err)` in catch blocks
- **Debug:** Not used in production code
- **Info:** Not used; results returned/rendered instead
- **Use cases:**
  - Catch blocks: log errors for debugging
  - Rate limiter hits: implicit via 429 response
  - DB failures: implicit via error result object

**Example:**
```typescript
} catch (err: unknown) {
  console.error("AI recommend error:", err);
  return Response.json({ error: "Failed to generate recommendations. Please try again." }, { status: 500 });
}
```

## Comments

**When to Comment:**
- **Rarely** — code is generally self-documenting via clear naming
- Complex algorithms that need explanation (e.g., `dedupeMovies`)
- Non-obvious business logic or workarounds
- Database schema relationships or RLS policies
- Magic numbers with context

**JSDoc/TSDoc:**
- Not systematically used
- Server components and types generally self-explanatory via names
- No @param/@returns patterns observed

**Examples:**
```typescript
// Comment explaining non-obvious logic
function dedupeMovies(pages: MovieListResponse[] | undefined): Movie[] {
  if (!pages) return [];
  const seen = new Set<number>();
  const result: Movie[] = [];
  // Iterate pages in order, track seen IDs to avoid duplicates from TMDB's dynamic ranking
  for (const page of pages) {
    for (const movie of page.results) {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        result.push(movie);
      }
    }
  }
  return result;
}
```

## Function Design

**Size:** Keep functions focused and single-purpose
- Extracted helper functions for reusable logic (`formatRuntime`, `serializeItem`, `getWatchlistContext`)
- Components split by responsibility (`MovieCard`, `MovieDetailModal`, `DiscoverContent`)

**Parameters:**
- Named parameters preferred for complex functions
- Use object destructuring for multiple params
- Type all parameters explicitly
- Optional params use `?:` in types, defaults in function signature

**Return Values:**
- Async functions return Promises with explicit type annotations
- Server actions return discriminated union types
- React components return JSX.Element or null (implicit)
- Utility functions return explicit types (string, boolean, T[], Record<K,V>, etc.)
- Always handle null/undefined explicitly with `?? defaultValue` or ternary

**Examples:**
```typescript
// Named parameters with destructuring
function MovieDetailModal({ movie, onClose }: MovieDetailModalProps)

// Server action with typed result
export async function addToWatchlist(data: AddToWatchlistInput): Promise<WatchlistActionResult>

// Utility with explicit type
function getPosterUrl(path: string | null, size: keyof typeof TMDB_POSTER_SIZES = "md"): string

// Optional with default
export async function getTrendingMovies(page = 1)
```

## Module Design

**Exports:**
- Server actions: named exports via `"use server"`
- Custom hooks: named exports (`useWatchlist`, `useMovieDetails`)
- Utility functions: named exports (`getPosterUrl`, `getMovieDetails`)
- Components: default export if single, named exports if multiple
- Types: always named exports from `types/` folder

**Barrel Files:**
- Not systematically used
- Each feature imports directly from specific modules (e.g., `import { useWatchlist } from "@/hooks/use-watchlist"`)

**Examples:**
```typescript
// hooks/use-watchlist.ts — named exports
export const watchlistKeys = { all: ["watchlist"], ... };
export function useWatchlist(status?: WatchlistStatus) { ... }
export function useAddToWatchlist() { ... }

// components/movies/movie-card.tsx — named export
export function MovieCard({ movie, priority = false, ... }: MovieCardProps) { ... }

// types/movie.ts — all named exports
export type Movie = { ... };
export type MovieDetails = { ... };
export type MovieCategory = "trending" | "popular" | "top_rated";
```

## React/Component Patterns

**Component Declaration:**
- Function declarations preferred over arrow functions for components
- Props interface/type named `{ComponentName}Props`
- Optional props marked with `?` in types

**Destructuring:**
- Destructure props in function signature for readability
- Destructure imports from hooks and libraries

**Hooks:**
- TanStack Query for server state (`useQuery`, `useInfiniteQuery`, `useMutation`)
- React Query keys: hierarchical object pattern
- Custom hooks in `/hooks` folder, exported as named
- `useMemo` for expensive computations (e.g., deduping movie arrays)
- `useState` for local component state

**Example:**
```typescript
function MovieCard({ movie, priority = false, className, onClick }: MovieCardProps) {
  const { data: tmdbIds } = useWatchlistTmdbIds();
  const addMutation = useAddToWatchlist();
  const isInWatchlist = tmdbIds?.includes(movie.id) ?? false;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addMutation.mutate({ ... });
  };

  return (
    <motion.div ... >
      {/* JSX */}
    </motion.div>
  );
}
```

## TanStack Query Patterns

**Query Key Factory:**
```typescript
export const movieKeys = {
  all: ["movies"] as const,
  category: (cat: MovieCategory, page: number) => [...movieKeys.all, "category", cat, page] as const,
  search: (query: string) => [...movieKeys.all, "search", query] as const,
  details: (id: number) => [...movieKeys.all, "details", id] as const,
};
```

**Query Usage:**
- `useQuery()` for simple fetches with automatic caching and refetch
- `useInfiniteQuery()` for paginated/infinite scroll with `getNextPageParam`
- `useMutation()` for mutations with `onMutate` for optimistic updates, `onSettled` for revalidation
- `useQueryClient()` for manual cache invalidation/updates

**Optimistic Updates Example:**
```typescript
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; tmdbId: number }) => removeFromWatchlist(id),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.tmdbIds() });
      const previousIds = queryClient.getQueryData<number[]>(watchlistKeys.tmdbIds());
      queryClient.setQueryData<number[]>(watchlistKeys.tmdbIds(), (old) =>
        old ? old.filter((id) => id !== params.tmdbId) : []
      );
      return { previousIds };
    },
    onError: (_err, _params, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(watchlistKeys.tmdbIds(), context.previousIds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
    },
  });
}
```

## Tailwind CSS Patterns

**Class Utilities:**
- Use `cn()` utility for conditional classes: `cn("base-class", condition && "conditional-class")`
- No `!important` overrides
- Responsive prefixes: `sm:`, `md:`, `lg:`, `xl:` for breakpoints
- Motion variants: `motion-safe:`, `motion-reduce:` for animation control (Tailwind v4)
- Touch targets: minimum `44x44px` via `min-h-[44px] min-w-[44px]`

**Example:**
```typescript
<button
  className={cn(
    "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200",
    isInWatchlist
      ? "bg-primary text-primary-foreground"
      : "bg-black/60 hover:bg-black/80 text-white",
  )}
>
  ...
</button>
```

## Zod Validation Patterns

**Usage:**
- Form validation via `.safeParse()` in server actions
- API request validation with explicit `z.object()` schemas
- Return error messages from `.safeParse().error`

**Example:**
```typescript
const parsed = z
  .object({ messages: z.array(z.unknown()).min(1) })
  .safeParse(body);

if (!parsed.success) {
  return Response.json({ error: "Invalid request" }, { status: 400 });
}
```

---

*Convention analysis: 2026-02-17*
