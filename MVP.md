# Moodflix - Movie Watchlist SaaS MVP

A modern movie watchlist and recommendation platform with AI-powered features for discovering and organizing your movie collection.

## Tech Stack

| Layer              | Technology                            |
| ------------------ | ------------------------------------- |
| **Frontend**       | Next.js 16, React 19, Tailwind CSS v4 |
| **UI Components**  | shadcn/ui                             |
| **Database**       | Supabase (PostgreSQL)                 |
| **Authentication** | Supabase Auth                         |
| **AI Integration** | Google Gemini (via Vercel AI SDK)     |
| **Rate Limiting**  | lru-cache (in-memory)                 |
| **Movie Data**     | TMDB API                              |

### Why Google Gemini?

- ✅ **Free tier**: 250,000 tokens/minute, 1,000 requests/day
- ✅ **Commercial use allowed** on free tier
- ✅ **No credit card required**
- ✅ **1M token context window** (Gemini 2.5 Flash)

---

## MVP Features

### 1. 🔐 Authentication

- Email/password signup and login
- **SSO Providers**:
  - Google OAuth
  - Apple ID
  - Passkey (WebAuthn)
- Protected routes and user sessions

### 2. 🎬 Movie Discovery

- Search movies using TMDB API
- Browse trending/popular movies
- **Upcoming Movies** - Separate section for future releases with release dates
- View movie details (poster, synopsis, cast, ratings)
- **Watch Provider Links** - Direct links to Netflix, Prime Video, Disney+, etc.

### 3. 📋 Watchlist Management

- Add/remove movies to personal watchlist
- Mark movies as "Watched" or "Want to Watch"
- Rate watched movies (1-5 stars)

### 4. 🤖 AI Feature (MVP)

- **Mood-Based Discovery** - Describe your mood and get personalized recommendations

---

## Post-MVP Features

| Feature                   | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| **📺 TV Series Support**  | Add series to watchlist, track watched episodes (separate or grouped view) |
| **Smart Recommendations** | AI analyzes your watchlist history to suggest movies                       |
| **Movie Summary Chat**    | Ask AI about any movie without spoilers                                    |
| **Collection Insights**   | AI-generated taste profile and watching patterns                           |
| **Custom Tags/Labels**    | Organize watchlist with personal categories                                |
| **Reviews**               | Write detailed reviews for watched movies                                  |
| **Social Features**       | Share watchlists, follow friends                                           |

---

## TMDB Watch Providers API

TMDB provides streaming availability data via the `/movie/{id}/watch/providers` endpoint:

```json
// Example response for a movie
{
  "results": {
    "ID": {  // Indonesia region
      "link": "https://www.themoviedb.org/movie/xxx/watch?locale=ID",
      "flatrate": [  // Subscription services
        {
          "provider_name": "Netflix",
          "provider_id": 8,
          "logo_path": "/path/to/logo.jpg"
        },
        {
          "provider_name": "Disney Plus",
          "provider_id": 337,
          "logo_path": "/path/to/logo.jpg"
        }
      ],
      "rent": [...],  // Rental options
      "buy": [...]    // Purchase options
    }
  }
}
```

> **Note:** The `link` field redirects to TMDB's watch page which shows all streaming options with direct links. For deep links directly to Netflix/Prime, we use the JustWatch integration via the TMDB link.

---

## Database Schema (Supabase)

```sql
-- User profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist entries
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  status TEXT CHECK (status IN ('want_to_watch', 'watching', 'watched')) DEFAULT 'want_to_watch',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  watched_at TIMESTAMPTZ,
  UNIQUE(user_id, tmdb_id)
);

-- AI recommendation history
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
```

---

## File Structure

```
moodflix/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── home/page.tsx         # Home (welcome + AI mood section)
│   │   ├── discover/page.tsx     # Browse/search movies
│   │   └── watchlist/page.tsx    # User's watchlist
│   ├── api/
│   │   ├── movies/
│   │   │   ├── route.ts          # Search movies
│   │   │   └── [id]/route.ts     # Movie details + providers
│   │   └── ai/
│   │       └── recommend/route.ts
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn components
│   ├── movie-card.tsx
│   ├── watch-providers.tsx       # Streaming links display
│   ├── mood-input.tsx
│   └── navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── tmdb.ts
│   └── ai.ts                     # Vercel AI SDK setup
└── types/
    └── index.ts
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# TMDB
TMDB_API_KEY=

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=
```

---

## Implementation Order

| Phase            | Tasks                                          | Priority |
| ---------------- | ---------------------------------------------- | -------- |
| **1. Setup**     | Supabase project, shadcn install, env config   | MVP      |
| **2. Auth**      | Login, signup, protected routes                | MVP      |
| **3. TMDB**      | Movie search, details, watch providers         | MVP      |
| **4. Watchlist** | Add/remove, status, ratings                    | MVP      |
| **5. AI Mood**   | Gemini integration, mood-based recommendations | MVP      |
| **6. Polish**    | Animations, responsive, error handling         | MVP      |

---

## Verification Plan

### Automated

- `npm run build` - TypeScript compilation
- `npm run lint` - Code quality

### Manual Testing

1. Auth flow: signup → login → protected access → logout
2. Movie search: query → results → details → watch providers
3. Watchlist: add → change status → rate → remove
4. AI: submit mood → receive recommendations
