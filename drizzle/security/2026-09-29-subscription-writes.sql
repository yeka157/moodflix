-- Subscription writes must use authenticated application routes, which apply
-- destination validation, authoritative metadata and serialized account caps.
-- Apply through Supabase SQL Editor after verifying a backup and that the
-- server's DATABASE_URL role is not anon/authenticated. No rows are changed.
BEGIN;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subscription inserts require server validation" ON public.push_subscriptions;
CREATE POLICY "Subscription inserts require server validation"
  ON public.push_subscriptions AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (false);
DROP POLICY IF EXISTS "Subscription updates require server validation" ON public.push_subscriptions;
CREATE POLICY "Subscription updates require server validation"
  ON public.push_subscriptions AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subscription inserts require server validation" ON public.notification_subscriptions;
CREATE POLICY "Subscription inserts require server validation"
  ON public.notification_subscriptions AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (false);
DROP POLICY IF EXISTS "Subscription updates require server validation" ON public.notification_subscriptions;
CREATE POLICY "Subscription updates require server validation"
  ON public.notification_subscriptions AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

COMMIT;
