# CineList - Project Guidelines & Best Practices

This document outlines the folder structure, component patterns, and coding conventions for the CineList project.

---

## Folder Structure

```
movie-watchlist/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout nesting)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Dashboard route group (shared layout)
│   │   ├── layout.tsx            # Dashboard layout with sidebar/navbar
│   │   ├── page.tsx              # /dashboard
│   │   ├── discover/
│   │   │   └── page.tsx
│   │   ├── watchlist/
│   │   │   └── page.tsx
│   │   └── ai/
│   │       └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── movies/
│   │   │   ├── route.ts          # GET /api/movies (search)
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET /api/movies/[id]
│   │   └── ai/
│   │       └── recommend/
│   │           └── route.ts      # POST /api/ai/recommend
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── movies/                   # Movie-related components
│   │   ├── movie-card.tsx
│   │   ├── movie-grid.tsx
│   │   ├── movie-details.tsx
│   │   └── watch-providers.tsx
│   ├── watchlist/                # Watchlist components
│   │   ├── watchlist-item.tsx
│   │   └── watchlist-actions.tsx
│   └── ai/                       # AI feature components
│       ├── mood-input.tsx
│       └── recommendation-list.tsx
│
├── lib/                          # Utilities & Configurations
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware helper
│   ├── tmdb.ts                   # TMDB API client
│   ├── ai.ts                     # Vercel AI SDK setup
│   ├── query-client.ts           # TanStack Query client
│   └── utils.ts                  # General utilities (cn, formatDate, etc.)
│
├── hooks/                        # Custom React Query Hooks (ALL API calls here)
│   ├── use-movies.ts             # Movie queries (search, popular, details)
│   ├── use-watchlist.ts          # Watchlist queries & mutations
│   ├── use-ai.ts                 # AI recommendation queries
│   └── use-auth.ts               # Auth state management
│
├── types/                        # TypeScript Types
│   ├── index.ts                  # Re-exports all types
│   ├── movie.ts                  # Movie & TMDB types
│   ├── watchlist.ts              # Watchlist types
│   └── database.ts               # Supabase generated types
│
├── actions/                      # Server Actions
│   ├── watchlist.ts              # Watchlist mutations
│   └── auth.ts                   # Auth actions
│
└── config/                       # App Configuration
    ├── site.ts                   # Site metadata
    └── nav.ts                    # Navigation items
```

---

## Component Structure

### Naming Conventions

| Type       | Convention                  | Example                                   |
| ---------- | --------------------------- | ----------------------------------------- |
| Components | PascalCase                  | `MovieCard.tsx` → `movie-card.tsx` (file) |
| Hooks      | camelCase with `use` prefix | `useWatchlist`                            |
| Utils      | camelCase                   | `formatDate`, `cn`                        |
| Types      | PascalCase                  | `Movie`, `WatchlistItem`                  |
| Constants  | SCREAMING_SNAKE_CASE        | `API_BASE_URL`                            |

### Strict Typing Rules

> **⚠️ CRITICAL: Zero Tolerance for `any`**

1. **All types MUST be defined in `types/` folder** - Never define interfaces, types, or type aliases in component files, hooks, or utility files.

2. **Never use `any`** - All variables, parameters, and return types must be explicitly typed. Use `unknown` if the type is truly unknown, then narrow it.

3. **Import types from `@/types`** - All type imports should come from the centralized types folder.

```tsx
// ✅ CORRECT: Types imported from types folder
import type { Movie, MovieCardProps, WatchlistItem } from "@/types";

// ❌ WRONG: Inline interface definition
interface MovieCardProps {
  // Never do this!
  movie: Movie;
}

// ❌ WRONG: Using any
const data: any = response; // Never do this!
function handleData(input: any) {} // Never do this!

// ✅ CORRECT: Use unknown and narrow
const data: unknown = response;
if (isMovie(data)) {
  // data is now typed as Movie
}
```

### Component File Structure

```tsx
// components/movies/movie-card.tsx

// 1. Imports (external → internal → types → styles)
import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Movie, MovieCardProps } from "@/types";

// 2. Component Definition (prefer function declaration)
export function MovieCard({ movie, onAdd, className }: MovieCardProps) {
  // 2a. Hooks
  const [isLoading, setIsLoading] = useState(false);

  // 2b. Derived state / computed values
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-poster.jpg";

  // 2c. Event handlers
  const handleAddClick = async () => {
    setIsLoading(true);
    await onAdd?.(movie);
    setIsLoading(false);
  };

  // 2d. Render
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative aspect-[2/3]">
        <Image
          src={posterUrl}
          alt={movie.title}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{movie.title}</h3>
        <p className="text-sm text-muted-foreground">
          {movie.release_date?.slice(0, 4)}
        </p>
        {onAdd && (
          <Button
            onClick={handleAddClick}
            disabled={isLoading}
            className="mt-2 w-full"
          >
            Add to Watchlist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Best Practices

### 1. Server vs Client Components

```tsx
// Default: Server Components (no "use client")
// app/(dashboard)/discover/page.tsx
import { MovieGrid } from "@/components/movies/movie-grid";
import { searchMovies } from "@/lib/tmdb";

export default async function DiscoverPage() {
  const movies = await searchMovies("popular");
  return <MovieGrid movies={movies} />;
}

// Client Components: Only when needed (interactivity, hooks)
// components/movies/movie-card.tsx
("use client");

import { useState } from "react";
// ...
```

### 2. Data Fetching Patterns

```tsx
// ✅ Server Component: Direct fetch
async function getMovies() {
  const res = await fetch(`${process.env.TMDB_API_URL}/movie/popular`);
  return res.json();
}

// ✅ Client Component: Use hooks or Server Actions
("use client");
import { useMovies } from "@/hooks/use-movies";

function MovieSearch() {
  const { movies, search, isLoading } = useMovies();
  // ...
}

// ✅ Mutations: Server Actions
// actions/watchlist.ts
("use server");

export async function addToWatchlist(movieId: number) {
  const supabase = await createServerClient();
  // ...
}
```

### 3. Styling Guidelines

```tsx
// ✅ Use cn() for conditional classes
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />

// ✅ Tailwind: Mobile-first responsive
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

// ✅ CSS Variables for theming (in globals.css)
:root {
  --primary: 262 83% 58%;
  --background: 0 0% 3.9%;
}
```

### 4. Error Handling

```tsx
// API Routes
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// Components: Error Boundaries
// app/(dashboard)/error.tsx
("use client");

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 5. Loading States

```tsx
// Route-level loading
// app/(dashboard)/discover/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
      ))}
    </div>
  );
}
```

---

## Import Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

```tsx
// ✅ Use aliases
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

// ❌ Avoid relative paths for deep imports
import { Button } from "../../../components/ui/button";
```

---

## Git Conventions

### Commit Messages

```
feat: add movie search functionality
fix: resolve watchlist rating not saving
style: update movie card hover animation
refactor: extract movie grid into separate component
docs: update README with setup instructions
```

### Branch Naming

```
feature/movie-search
feature/ai-recommendations
fix/watchlist-sync
refactor/component-structure
```
