# Moodflix - UI/UX & Architecture Guidelines

Best practices for user interface, user experience, and client-side architecture.

---

## Design System

### Color Palette

```css
/* globals.css - Dark theme with purple accent */
:root {
  --background: 240 10% 4%; /* Near black */
  --foreground: 0 0% 98%; /* White text */

  --card: 240 10% 6%; /* Slightly lighter */
  --card-foreground: 0 0% 98%;

  --primary: 270 70% 60%; /* Purple accent */
  --primary-foreground: 0 0% 100%;

  --secondary: 240 5% 15%; /* Muted gray */
  --secondary-foreground: 0 0% 98%;

  --muted: 240 5% 20%;
  --muted-foreground: 240 5% 65%;

  --accent: 270 70% 50%;
  --destructive: 0 72% 51%; /* Red for errors */

  --border: 240 5% 15%;
  --ring: 270 70% 60%;
}
```

### Typography

```css
/* Use Inter or similar modern sans-serif */
--font-sans: "Inter", system-ui, sans-serif;

/* Font sizes - mobile first */
.text-xs {
  font-size: 0.75rem;
} /* 12px - captions */
.text-sm {
  font-size: 0.875rem;
} /* 14px - secondary */
.text-base {
  font-size: 1rem;
} /* 16px - body */
.text-lg {
  font-size: 1.125rem;
} /* 18px - emphasis */
.text-xl {
  font-size: 1.25rem;
} /* 20px - subheading */
.text-2xl {
  font-size: 1.5rem;
} /* 24px - heading */
.text-3xl {
  font-size: 1.875rem;
} /* 30px - title */
```

### Spacing Scale

```
4px  → p-1, m-1, gap-1
8px  → p-2, m-2, gap-2
12px → p-3, m-3, gap-3
16px → p-4, m-4, gap-4  ← Base unit
24px → p-6, m-6, gap-6
32px → p-8, m-8, gap-8
```

---

## UI Components

### Interactive States

Every interactive element must have:

```tsx
// ✅ Required states for buttons/links
<Button
  className={cn(
    // Base
    "transition-all duration-200",
    // Hover
    "hover:bg-primary/90 hover:scale-[1.02]",
    // Focus (accessibility)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    // Active/Pressed
    "active:scale-[0.98]",
    // Disabled
    "disabled:opacity-50 disabled:pointer-events-none",
  )}
/>
```

### Loading States

> **⚠️ MANDATORY: Every async operation MUST have a loading state**

```tsx
// ✅ Skeleton for content loading (preferred for layouts)
import { Skeleton } from "@/components/ui/skeleton";

<div className="grid grid-cols-4 gap-4">
  {isLoading
    ? Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-2/3 rounded-lg" />
      ))
    : movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
</div>;

// ✅ Spinner for actions/buttons
import { Loader2 } from "lucide-react";

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Adding..." : "Add to Watchlist"}
</Button>;

// ✅ Page-level loading (loading.tsx)
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
```

### Empty States

```tsx
// ✅ Always provide helpful empty states
function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Film className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No movies yet</h3>
      <p className="text-muted-foreground mb-4">
        Start building your watchlist by discovering movies
      </p>
      <Button asChild>
        <Link href="/discover">Discover Movies</Link>
      </Button>
    </div>
  );
}
```

### Error States

```tsx
// ✅ Inline errors with recovery actions
function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
```

---

## Responsive Design

### Breakpoints

```tsx
// Mobile-first approach
sm:  640px   // Large phones
md:  768px   // Tablets
lg:  1024px  // Laptops
xl:  1280px  // Desktops
2xl: 1536px  // Large screens
```

### Grid Patterns

```tsx
// Movie grid - responsive columns
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">

// Content with sidebar
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 shrink-0" />
  <main className="flex-1" />
</div>
```

### Touch Targets

```tsx
// ✅ Minimum 44x44px touch targets on mobile
<Button className="min-h-11 min-w-11 p-3" />

// ✅ Adequate spacing between clickable items
<div className="space-y-2"> {/* 8px gap minimum */}
```

---

## Animations & Transitions

### Why Framer Motion?

We use **Framer Motion** (not GSAP) for animations:

| Aspect            | Framer Motion                   | GSAP                            |
| ----------------- | ------------------------------- | ------------------------------- |
| React integration | ✅ Built for React, declarative | ⚠️ Imperative, needs hooks      |
| Bundle size       | ~30-50KB                        | ~30KB + plugins                 |
| Use case          | UI animations, gestures         | Complex timelines, SVG morphing |
| Learning curve    | Easy                            | Steeper                         |
| License           | Free/open source                | Some plugins paid               |

> For typical UI animations (page transitions, hover effects, layout animations), Framer Motion is superior for React apps.

### Motion Patterns

```tsx
import { motion, AnimatePresence } from "framer-motion";

// ✅ Page/component entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>

// ✅ Exit animations (wrap with AnimatePresence)
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    />
  )}
</AnimatePresence>

// ✅ Hover/tap micro-interactions
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400 }}
/>

// ✅ Layout animations (smooth reordering)
<motion.div layout layoutId={movie.id} />
```

### CSS Transitions (Simple Cases)

```tsx
// ✅ Respect user preferences
<div className="motion-safe:animate-bounce motion-reduce:animate-none" />

// Or in CSS
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## Client-Side Architecture

### Local Storage Strategy

```tsx
// lib/storage.ts
const STORAGE_KEYS = {
  THEME: "moodflix-theme",
  RECENT_SEARCHES: "moodflix-recent-searches",
  LAST_VIEWED: "moodflix-last-viewed",
} as const;

// ✅ Type-safe storage helpers
export function getStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Storage error:", error);
  }
}
```

### What to Store Locally

| Data              | Storage            | Reason                         |
| ----------------- | ------------------ | ------------------------------ |
| Theme preference  | `localStorage`     | Persist across sessions        |
| Recent searches   | `localStorage`     | Quick access, max 10 items     |
| Last viewed movie | `sessionStorage`   | Current session only           |
| Auth tokens       | `httpOnly cookies` | Security (handled by Supabase) |
| User data         | **Supabase only**  | Source of truth                |

### Data Fetching: TanStack Query

We use **TanStack Query** (not SWR) for server state:

| Feature    | TanStack Query                 | SWR                    |
| ---------- | ------------------------------ | ---------------------- |
| DevTools   | ✅ Excellent                   | ⚠️ Basic               |
| Mutations  | ✅ `useMutation` with rollback | ⚠️ Manual              |
| Pagination | ✅ Built-in                    | ⚠️ Manual              |
| Bundle     | ~10KB                          | ~4KB                   |
| Complexity | Better for complex apps        | Better for simple apps |

> **⚠️ MANDATORY: All API calls MUST be in custom hooks under `hooks/`**

### Hook Architecture

```
hooks/
├── use-movies.ts         # Movie queries (search, details, popular)
├── use-watchlist.ts      # Watchlist queries & mutations
├── use-ai.ts             # AI recommendation queries
└── use-auth.ts           # Auth state management
```

### Query Client Setup

```tsx
// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Custom Hooks Pattern

```tsx
// hooks/use-movies.ts
import { useQuery } from "@tanstack/react-query";
import { searchMovies, getPopularMovies, getMovieDetails } from "@/lib/tmdb";
import type { Movie, MovieDetails } from "@/types";

// Query keys - centralized for consistency
export const movieKeys = {
  all: ["movies"] as const,
  popular: () => [...movieKeys.all, "popular"] as const,
  search: (query: string) => [...movieKeys.all, "search", query] as const,
  detail: (id: number) => [...movieKeys.all, "detail", id] as const,
};

export function usePopularMovies() {
  return useQuery({
    queryKey: movieKeys.popular(),
    queryFn: getPopularMovies,
  });
}

export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: movieKeys.search(query),
    queryFn: () => searchMovies(query),
    enabled: query.length >= 2,
  });
}

export function useMovieDetails(id: number) {
  return useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: () => getMovieDetails(id),
    enabled: !!id,
  });
}
```

```tsx
// hooks/use-watchlist.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
} from "@/lib/supabase/watchlist";
import type { WatchlistItem, Movie } from "@/types";

export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: () => [...watchlistKeys.all, "list"] as const,
};

export function useWatchlist() {
  return useQuery({
    queryKey: watchlistKeys.list(),
    queryFn: getWatchlist,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToWatchlist,
    // Optimistic update
    onMutate: async (movie: Movie) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.list() });
      const previous = queryClient.getQueryData<WatchlistItem[]>(
        watchlistKeys.list(),
      );

      queryClient.setQueryData<WatchlistItem[]>(watchlistKeys.list(), (old) => [
        ...(old ?? []),
        {
          ...movie,
          status: "want_to_watch",
          added_at: new Date().toISOString(),
        },
      ]);

      return { previous };
    },
    onError: (_err, _movie, context) => {
      queryClient.setQueryData(watchlistKeys.list(), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.list() });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.list() });
    },
  });
}
```

### Usage in Components

```tsx
// components/movies/movie-grid.tsx
"use client";

import { usePopularMovies } from "@/hooks/use-movies";
import { MovieCard } from "./movie-card";
import { Skeleton } from "@/components/ui/skeleton";

export function MovieGrid() {
  const { data: movies, isLoading, error } = usePopularMovies();

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState message="Failed to load movies" />;

  return (
    <div className="grid grid-cols-4 gap-4">
      {movies?.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
```

```tsx
// components/watchlist/add-button.tsx
"use client";

import { useAddToWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import type { Movie } from "@/types";

export function AddToWatchlistButton({ movie }: { movie: Movie }) {
  const { mutate: addMovie, isPending } = useAddToWatchlist();

  return (
    <Button onClick={() => addMovie(movie)} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Add to Watchlist
    </Button>
  );
}
```

### Next.js Fetch Caching (Server Components)

```tsx
// For Server Components - use Next.js fetch directly
const movies = await fetch(url, {
  next: { revalidate: 300 }, // Revalidate every 5 min
});
```

---

## Accessibility (a11y)

### Keyboard Navigation

```tsx
// ✅ Focus management
<Dialog onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    {/* Focus trapped inside, ESC to close */}
  </DialogContent>
</Dialog>

// ✅ Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Screen Readers

```tsx
// ✅ Meaningful alt text
<Image alt="Inception movie poster" ... />

// ✅ ARIA labels for icon buttons
<Button aria-label="Add to watchlist" size="icon">
  <Plus className="h-4 w-4" />
</Button>

// ✅ Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

### Color Contrast

```
// Minimum ratios (WCAG AA)
Normal text:  4.5:1
Large text:   3:1
UI elements:  3:1
```

---

## Performance

### Image Optimization

```tsx
// ✅ Always use Next.js Image
import Image from "next/image";

<Image
  src={posterUrl}
  alt={movie.title}
  width={300}
  height={450}
  placeholder="blur"
  blurDataURL={BLUR_DATA_URL}
  loading="lazy" // Below fold
  priority // Above fold (hero images)
/>;
```

### Code Splitting

```tsx
// ✅ Dynamic imports for heavy components
const MovieDetails = dynamic(
  () => import("@/components/movies/movie-details"),
  { loading: () => <Skeleton className="h-96" /> },
);

// ✅ Route-based code splitting (automatic with App Router)
```

### Optimistic Updates

```tsx
// ✅ Immediate UI feedback
async function addToWatchlist(movie: Movie) {
  // Update UI immediately
  setWatchlist((prev) => [...prev, movie]);

  try {
    await api.addToWatchlist(movie.id);
  } catch {
    // Rollback on error
    setWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
    toast.error("Failed to add movie");
  }
}
```

---

## Form Patterns

### Validation with Zod

> **⚠️ MANDATORY: All forms MUST use Zod for validation**

```tsx
// types/schemas.ts - Define schemas in types folder
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Component usage
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/types/schemas";

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});
```

### Feedback

```tsx
// ✅ Inline validation errors
<Input {...field} aria-invalid={!!error} />;
{
  error && <p className="text-sm text-destructive mt-1">{error.message}</p>;
}

// ✅ Toast notifications for actions
import { toast } from "sonner";

try {
  await addToWatchlist(movie);
  toast.success("Movie added to watchlist");
} catch {
  toast.error("Failed to add movie");
}
```

---

## Search with Debounce

> **⚠️ MANDATORY: All search inputs MUST use debounce**

We use **`use-debounce`** library (not lodash):

```bash
npm install use-debounce
```

```tsx
// hooks/use-movie-search.ts
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useQuery } from "@tanstack/react-query";
import type { MovieSearchParams } from "@/types";

export function useMovieSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 300ms debounce - optimal for search
  const handleSearch = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  const { data, isLoading } = useQuery({
    queryKey: ["movies", "search", debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery),
    enabled: debouncedQuery.length >= 2, // Min 2 chars
  });

  const onChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  return { query, onChange, results: data, isLoading };
}

// Usage in component
function SearchInput() {
  const { query, onChange, results, isLoading } = useMovieSearch();

  return (
    <>
      <Input
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search movies..."
      />
      {isLoading && <Loader2 className="animate-spin" />}
    </>
  );
}
```

---

## State Management

### When to Use What

| State Type              | Solution            |
| ----------------------- | ------------------- |
| UI state (modals, tabs) | `useState`          |
| Form state              | React Hook Form     |
| Server state            | React Query / SWR   |
| Global client state     | Zustand (if needed) |
| Auth state              | Supabase client     |

### Avoid Prop Drilling

```tsx
// ✅ Use composition
<MovieCard movie={movie}>
  <MovieCard.Actions>
    <WatchlistButton movie={movie} />
  </MovieCard.Actions>
</MovieCard>;

// ✅ Or context for deep trees
const WatchlistContext = createContext<WatchlistContextType>(null!);
```

---

## AI SDK Best Practices

### Tech Stack: Vercel AI SDK

```bash
npm install ai @ai-sdk/google
```

We use **Vercel AI SDK** with **BYOK** (Bring Your Own Key) pattern for Google Gemini.

### Rate Limiting with LRU Cache

> **⚠️ MANDATORY: All AI endpoints MUST have rate limiting**

We use **lru-cache** (free, in-memory) for rate limiting:

```bash
npm install lru-cache
```

```tsx
// lib/rate-limiter.ts
import { LRUCache } from "lru-cache";
import type { RateLimitResult, UserTier } from "@/types";

// Rate limit config per tier
const LIMITS: Record<UserTier, { requests: number; window: number }> = {
  free: { requests: 10, window: 24 * 60 * 60 * 1000 }, // 10 per day
  premium: { requests: 100, window: 24 * 60 * 60 * 1000 }, // 100 per day
};

// In-memory store for rate limiting
const rateLimitCache = new LRUCache<string, number[]>({
  max: 10000, // Max 10k users tracked
  ttl: 24 * 60 * 60 * 1000, // 24 hour TTL
});

export function checkRateLimit(
  userId: string,
  tier: UserTier,
): RateLimitResult {
  const { requests: maxRequests, window } = LIMITS[tier];
  const key = `${tier}:${userId}`;
  const now = Date.now();

  // Get existing timestamps or empty array
  const timestamps = rateLimitCache.get(key) ?? [];

  // Filter to only timestamps within the window
  const validTimestamps = timestamps.filter((ts) => now - ts < window);

  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const reset = oldestTimestamp + window;

    return {
      success: false,
      remaining: 0,
      reset,
    };
  }

  // Add current request timestamp
  validTimestamps.push(now);
  rateLimitCache.set(key, validTimestamps);

  return {
    success: true,
    remaining: maxRequests - validTimestamps.length,
    reset: now + window,
  };
}
```

### AI API Route Pattern

```tsx
// app/api/ai/recommend/route.ts
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { MoodRecommendationRequest } from "@/types";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check rate limit
    const { success, remaining, reset } = await checkRateLimit(user.id, "free");

    if (!success) {
      return Response.json(
        { error: "Rate limit exceeded", reset },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }

    // 3. Validate input
    const body: MoodRecommendationRequest = await request.json();

    if (!body.mood || body.mood.length > 500) {
      return Response.json({ error: "Invalid mood input" }, { status: 400 });
    }

    // 4. Generate with token limits
    const { text, usage } = await generateText({
      model: google("gemini-2.0-flash"),
      maxTokens: 1000, // Limit output tokens
      prompt: buildMoodPrompt(body.mood),
    });

    // 5. Log usage for monitoring
    await logAIUsage(user.id, usage);

    return Response.json({
      recommendations: parseRecommendations(text),
      remaining,
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return Response.json({ error: "Failed to generate" }, { status: 500 });
  }
}
```

### Token Management

```tsx
// lib/ai.ts
import { google } from "@ai-sdk/google";
import type { AIConfig } from "@/types";

export const AI_CONFIG: AIConfig = {
  model: google("gemini-2.0-flash"),
  maxTokens: 1000, // Max output tokens
  maxInputLength: 500, // Max user input chars
  temperature: 0.7, // Creativity level
};

// Prompt templates to control token usage
export const PROMPTS = {
  moodRecommendation: (mood: string) => `
You are a movie recommendation assistant. Based on the user's mood, suggest exactly 5 movies.

User's mood: "${mood}"

Respond in JSON format only:
{
  "movies": [
    { "title": "string", "year": number, "reason": "string (max 50 words)" }
  ]
}`,
};
```

### Client-Side AI Hook

```tsx
// hooks/use-ai.ts
import { useMutation } from "@tanstack/react-query";
import type { MoodRecommendationResponse } from "@/types";

export function useMoodRecommendation() {
  return useMutation({
    mutationFn: async (mood: string): Promise<MoodRecommendationResponse> => {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });

      if (res.status === 429) {
        const data = await res.json();
        throw new Error(
          `Rate limit exceeded. Try again in ${formatTime(data.reset)}`,
        );
      }

      if (!res.ok) {
        throw new Error("Failed to get recommendations");
      }

      return res.json();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### Error Handling for AI

```tsx
// components/ai/mood-input.tsx
"use client";

import { useMoodRecommendation } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function MoodInput() {
  const [mood, setMood] = useState("");
  const { mutate, isPending, error } = useMoodRecommendation();

  const handleSubmit = () => {
    if (mood.trim().length < 10) {
      toast.error("Please describe your mood in more detail");
      return;
    }
    mutate(mood);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        placeholder="I'm feeling adventurous but also want something heartwarming..."
        maxLength={500}
        disabled={isPending}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {mood.length}/500 characters
        </span>
        <Button onClick={handleSubmit} disabled={isPending || mood.length < 10}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get Recommendations
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
```

### AI Protection Summary

| Protection           | Implementation                                    |
| -------------------- | ------------------------------------------------- |
| **Rate Limiting**    | lru-cache per user (10/day free, 100/day premium) |
| **Token Limits**     | `maxTokens: 1000` on all AI calls                 |
| **Input Validation** | Max 500 chars, min 10 chars                       |
| **Authentication**   | All AI routes require logged-in user              |
| **Error Handling**   | Graceful fallbacks, retry-after headers           |
| **Usage Logging**    | Track tokens per user for monitoring              |
