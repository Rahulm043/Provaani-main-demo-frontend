-- ==========================================
-- PROVAANI SUPABASE SETUP SCRIPT
-- Run this once in the Supabase SQL editor.
-- Safe to re-run: tables, columns, indexes, and bucket use IF NOT EXISTS.
-- ==========================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS public.campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'created',
    mode TEXT DEFAULT 'global_scheduler',
    concurrent_limit INTEGER DEFAULT 5,
    call_gap_seconds INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT now(),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    recipients JSONB DEFAULT '[]'::jsonb,
    stats JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0, "rejected": 0, "active": 0, "queued": 0}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.calls (
    call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(campaign_id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    recipient_name TEXT,
    recipient_detail TEXT,
    call_type TEXT DEFAULT 'sip',
    status TEXT DEFAULT 'queued',
    direction TEXT DEFAULT 'outbound',
    created_at TIMESTAMPTZ DEFAULT now(),
    ringing_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds FLOAT DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    vobiz_call_uuid TEXT,
    recording_files JSONB DEFAULT '{"stereo": null, "stereo_remote": null, "user": null, "user_remote": null, "bot": null, "bot_remote": null, "vobiz_mp3": null}'::jsonb,
    transcript JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    end_reason TEXT,
    transfer_requested BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==========================================
-- 2. Existing Install Compatibility
-- ==========================================

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS recipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0, "rejected": 0, "active": 0, "queued": 0}'::jsonb;

ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS recipient_detail TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS vobiz_call_uuid TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS recording_files JSONB DEFAULT '{"stereo": null, "stereo_remote": null, "user": null, "user_remote": null, "bot": null, "bot_remote": null, "vobiz_mp3": null}'::jsonb;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS transcript JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS end_reason TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS transfer_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.campaigns ALTER COLUMN mode SET DEFAULT 'global_scheduler';
ALTER TABLE public.campaigns ALTER COLUMN concurrent_limit SET DEFAULT 5;
ALTER TABLE public.campaigns ALTER COLUMN call_gap_seconds SET DEFAULT 15;

-- ==========================================
-- 3. Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON public.calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calls_vobiz_uuid ON public.calls(vobiz_call_uuid);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_scheduled_at ON public.campaigns(status, scheduled_at);

-- ==========================================
-- 4. Storage Bucket
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 5. Optional RLS
-- ==========================================
-- The backend uses SUPABASE_SERVICE_KEY, so RLS is not required for backend writes.
-- If you enable direct frontend table access, uncomment and adjust policies carefully.

-- ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Authenticated users can read calls" ON public.calls FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
