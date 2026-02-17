# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Status:** Not currently implemented

**Runner:**
- No test runner configured (Jest, Vitest, or similar absent from `package.json`)
- No test files present in codebase (`src/**/*.test.ts`, `src/**/*.spec.ts` all missing)

**Assertion Library:**
- Not detected — no testing dependencies installed

**Run Commands:**
- No test scripts in `package.json` (`npm test`, `npm run test`, etc.)
- Current available commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run db:*`

## Recommended Test Setup Path

If adding tests, follow these patterns based on codebase conventions:

**Suggested Framework:**
- **Vitest** (lightweight, ES module native, works with Next.js)
- Alternative: **Jest** (heavier, traditional, well-integrated with Next.js)

**Installation:**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
# or
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

**Config File Location:**
- `vitest.config.ts` or `jest.config.ts` at project root

## Test File Organization

**Location:** Co-located with source files

**Naming:**
- `[module].test.ts` for utilities, hooks, actions
- `[component].test.tsx` for React components
- Siblings to source files: `lib/utils.ts` + `lib/utils.test.ts`

**Structure:**
```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts         # Test utilities
│   ├── tmdb.ts
│   └── tmdb.test.ts          # Test TMDB client
├── hooks/
│   ├── use-movies.ts
│   ├── use-movies.test.ts    # Test hook
├── components/
│   ├── movie-card.tsx
│   └── movie-card.test.tsx   # Test component
├── actions/
│   ├── watchlist.ts
│   └── watchlist.test.ts     # Test server action
└── types/
    └── *.ts                   # No tests (type-only files)
```

## Test Structure

**Test Organization Pattern:**

```typescript
// hooks/use-movies.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMovieSearch } from '@/hooks/use-movies';
import { ReactNode } from 'react';

// Setup wrapper for hooks that need providers
function createWrapper() {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useMovieSearch', () => {
  it('should fetch movies when query is valid', async () => {
    const { result } = renderHook(() => useMovieSearch('Inception'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.results).toBeDefined();
  });

  it('should not fetch when query is less than 2 characters', () => {
    const { result } = renderHook(() => useMovieSearch('A'), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('pending');
  });
});
```

**Patterns:**
- `describe('ComponentName/FunctionName', () => { ... })` for grouping related tests
- `it('should describe behavior', () => { ... })` for individual test cases
- Setup/teardown via `beforeEach`, `afterEach`, or `setupTests.ts`
- Assertions using `expect()` from test framework

## Mocking

**Framework:** `vitest.fn()` or `jest.fn()` (test framework provides)

**Patterns:**

```typescript
// Mock external API calls
import { vi } from 'vitest';
import * as tmdbApi from '@/lib/tmdb';

vi.mock('@/lib/tmdb', () => ({
  getTrendingMovies: vi.fn().mockResolvedValue({
    results: [{ id: 1, title: 'Test Movie' }],
    total_pages: 1,
    page: 1,
    total_results: 1,
  }),
}));

// Mock React hooks
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: Function) => fn,
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-id' } } }) },
  }),
}));
```

**What to Mock:**
- External API calls (`@/lib/tmdb.ts`, Supabase, Google Gemini)
- File system operations
- Environment variables
- Date/time (`vi.setSystemTime()` or `jest.useFakeTimers()`)
- Browser APIs (window, localStorage, fetch) — use `vitest/globals`

**What NOT to Mock:**
- Internal utilities and helpers (let them run real)
- React hooks behavior (use real React Testing Library wrappers)
- Database/ORM operations in integration tests (use test database or in-memory)

## Fixtures and Factories

**Test Data Locations:**
```
src/
├── __tests__/
│   ├── fixtures/
│   │   ├── movies.ts       # Movie test data
│   │   ├── watchlist.ts    # Watchlist test data
│   │   └── users.ts        # User test data
│   └── utils/
│       ├── test-utils.tsx  # Render helpers, wrappers
│       └── db-helpers.ts   # Database setup/teardown
```

**Example Fixture File:**
```typescript
// __tests__/fixtures/movies.ts
export const MOCK_MOVIE: Movie = {
  id: 1,
  title: 'Inception',
  original_title: 'Inception',
  overview: 'A skilled thief...',
  poster_path: '/inception-poster.jpg',
  backdrop_path: '/inception-backdrop.jpg',
  release_date: '2010-07-16',
  vote_average: 8.8,
  vote_count: 30000,
  genre_ids: [28, 12, 878],
  popularity: 24.5,
  adult: false,
  original_language: 'en',
  video: false,
};

export const MOCK_MOVIE_LIST_RESPONSE: MovieListResponse = {
  page: 1,
  results: [MOCK_MOVIE],
  total_pages: 100,
  total_results: 10000,
};
```

**Example Test Wrapper:**
```typescript
// __tests__/utils/test-utils.tsx
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: ReactNode) {
  return render(ui, { wrapper: TestWrapper });
}
```

## Coverage

**Requirements:** Not currently enforced

**Recommended Coverage Targets (if implementing):**
- Utilities/helpers: 90%+
- Hooks: 80%+
- Components: 70%+ (UI components harder to test thoroughly)
- Server actions: 85%+ (critical business logic)
- API routes: 80%+

**View Coverage:**
```bash
vitest --coverage
# or
jest --coverage
```

## Test Types

**Unit Tests:**
- Scope: Single function/hook/component in isolation
- Setup: Mock all dependencies (APIs, other functions)
- Location: `src/lib/utils.test.ts`, `src/hooks/use-movies.test.ts`
- Example:
  ```typescript
  describe('formatRuntime', () => {
    it('should format minutes to h:m format', () => {
      expect(formatRuntime(125)).toBe('2h 5m');
      expect(formatRuntime(45)).toBe('45m');
      expect(formatRuntime(null)).toBe('');
    });
  });
  ```

**Integration Tests:**
- Scope: Multiple components/hooks working together (with real APIs mocked)
- Setup: Render components with QueryClientProvider wrapper, mock API responses
- Location: `src/components/[name].integration.test.tsx` or same as unit test file
- Example:
  ```typescript
  describe('MovieDetailModal integration', () => {
    it('should load and display movie details when opened', async () => {
      vi.mock('@/hooks/use-movies', () => ({
        useMovieDetails: () => ({ data: MOCK_MOVIE_DETAILS }),
      }));

      render(<MovieDetailModal movie={MOCK_MOVIE} onClose={() => {}} />, {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(screen.getByText(MOCK_MOVIE.title)).toBeInTheDocument();
      });
    });
  });
  ```

**E2E Tests:**
- **Status:** Not currently used
- **Recommendation:** Add via Playwright if SaaS requires user flow validation
- **Setup:** `playwright` or `cypress` package + separate test suite
- **Location:** `e2e/` folder with `.spec.ts` files
- **Scope:** Full user workflows (login → browse → add to watchlist → logout)

## Common Patterns

**Async Testing with TanStack Query:**
```typescript
it('should refetch when mutation succeeds', async () => {
  const queryClient = new QueryClient();
  const { result } = renderHook(() => useWatchlist(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });

  // Initial state
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data).toEqual([]);

  // Trigger mutation and wait for revalidation
  // (depends on actual mutation in test)
});
```

**Error Testing with Server Actions:**
```typescript
it('should return error when user not authenticated', async () => {
  vi.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
      auth: { getUser: () => ({ data: { user: null } }) },
    }),
  }));

  const result = await addToWatchlist({
    tmdbId: 1,
    title: 'Movie',
    posterPath: null,
  });

  expect(result).toEqual({ error: 'Not authenticated' });
});
```

**Component Rendering with User Interaction:**
```typescript
it('should toggle bookmark on click', async () => {
  const user = userEvent.setup();

  render(<MovieCard movie={MOCK_MOVIE} />, { wrapper: TestWrapper });

  const bookmarkBtn = screen.getByRole('button', { name: /add to watchlist/i });
  await user.click(bookmarkBtn);

  await waitFor(() => {
    expect(screen.getByText(/added.*to watchlist/i)).toBeInTheDocument();
  });
});
```

## Database Testing (if added)

**Setup Pattern:**
```typescript
// __tests__/utils/db-helpers.ts
import { db } from '@/drizzle';
import { profiles, watchlist } from '@/drizzle/schema';

export async function seedTestUser(userId: string) {
  await db.insert(profiles).values({ id: userId });
}

export async function seedTestWatchlistItem(userId: string, tmdbId: number) {
  await db.insert(watchlist).values({
    userId,
    tmdbId,
    title: 'Test Movie',
    status: 'want_to_watch',
  });
}

export async function cleanupDatabase() {
  await db.delete(watchlist);
  await db.delete(profiles);
}
```

**Test Example:**
```typescript
describe('watchlist actions', () => {
  beforeEach(async () => {
    await seedTestUser('test-user-id');
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  it('should add movie to watchlist', async () => {
    const result = await addToWatchlist({
      tmdbId: 1,
      title: 'Inception',
      posterPath: '/inception.jpg',
    });

    expect(result.item).toBeDefined();
    expect(result.item?.tmdbId).toBe(1);
  });

  it('should prevent duplicate watchlist entries', async () => {
    await addToWatchlist({ tmdbId: 1, title: 'Movie', posterPath: null });
    const result = await addToWatchlist({ tmdbId: 1, title: 'Movie', posterPath: null });

    expect(result.error).toContain('already in watchlist');
  });
});
```

## Current Testing Gaps

No tests currently exist for:
- **Utilities:** `lib/utils.ts`, `lib/tmdb.ts`, `lib/rate-limit.ts`, `lib/constants.ts`
- **Hooks:** `use-movies.ts`, `use-watchlist.ts`, `use-ai.ts`
- **Components:** All UI components, modals, grids, cards
- **Server actions:** `auth.ts`, `watchlist.ts` CRUD operations
- **API routes:** `api/movies/*`, `api/ai/recommend`
- **Database operations:** Watchlist CRUD, profile triggers, RLS policies

## Testing Priority (if implementing)

1. **Critical:** Server actions (`addToWatchlist`, `removeFromWatchlist`, `updateWatchlistStatus`) — business logic
2. **High:** Rate limiting (`checkRateLimit`) — prevents abuse
3. **High:** TMDB API client (`getTrendingMovies`, `searchMovies`) — external dependency
4. **Medium:** Custom hooks (`useWatchlist`, `useMovieSearch`) — UI state
5. **Medium:** Utility functions (`formatRuntime`, `getPosterUrl`) — easy to test
6. **Low:** UI components (`MovieCard`, `MovieDetailModal`) — visual changes harder to test, snapshot tests less valuable

---

*Testing analysis: 2026-02-17*
