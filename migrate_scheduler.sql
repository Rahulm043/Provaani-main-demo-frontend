-- ============================================================
-- MIGRATION: Add global scheduler support to campaigns table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add scheduled_at column (new: replaces mode/concurrent_limit/call_gap_seconds)
ALTER TABLE public.campaigns
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 2. The old mode/concurrent_limit/call_gap_seconds columns are now unused
--    but kept so existing rows don't break. You may drop them later:
--
--    ALTER TABLE public.campaigns DROP COLUMN IF EXISTS mode;
--    ALTER TABLE public.campaigns DROP COLUMN IF EXISTS concurrent_limit;
--    ALTER TABLE public.campaigns DROP COLUMN IF EXISTS call_gap_seconds;

-- 3. Add 'scheduled' to the allowed status values comment (informational only —
--    Supabase TEXT columns accept any value):
--    Status lifecycle: created → scheduled → running → paused → completed | cancelled

-- 4. Index for scheduled campaigns (scheduler polls by status)
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON public.campaigns(scheduled_at);
