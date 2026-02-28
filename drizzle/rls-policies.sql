-- Row Level Security policies for all tables.
-- Run this via Supabase Dashboard > SQL Editor.
-- Safe to re-run: uses DROP IF EXISTS before each CREATE.

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Watchlist: full CRUD on own watchlist
DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own watchlist" ON public.watchlist;
CREATE POLICY "Users can insert own watchlist"
  ON public.watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own watchlist" ON public.watchlist;
CREATE POLICY "Users can update own watchlist"
  ON public.watchlist FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own watchlist" ON public.watchlist;
CREATE POLICY "Users can delete own watchlist"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- AI Recommendations: read/insert own
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can view own recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can insert own recommendations"
  ON public.ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Conversations: backend insert for analytics logging
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can insert conversations" ON public.ai_conversations;
CREATE POLICY "Service can insert conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Top Hundred: full CRUD on own entries
ALTER TABLE public.top_hundred ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own top hundred" ON public.top_hundred;
CREATE POLICY "Users can view own top hundred"
  ON public.top_hundred FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own top hundred" ON public.top_hundred;
CREATE POLICY "Users can insert own top hundred"
  ON public.top_hundred FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own top hundred" ON public.top_hundred;
CREATE POLICY "Users can update own top hundred"
  ON public.top_hundred FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own top hundred" ON public.top_hundred;
CREATE POLICY "Users can delete own top hundred"
  ON public.top_hundred FOR DELETE
  USING (auth.uid() = user_id);
