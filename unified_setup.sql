-- ==========================================
-- PROVAANI UNIFIED SETUP SCRIPT
-- Supports: Super Admin -> HOD -> Councillor Hierarchy
-- Compatible with: Standard PostgreSQL & Supabase
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CORE ROLES & ACCESS
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

INSERT INTO public.roles (name) 
VALUES ('super_admin'), ('hod'), ('councillor')
ON CONFLICT (name) DO NOTHING;

-- Starter base courses/departments. Add more from the dashboard as needed.
INSERT INTO public.departments (name)
VALUES ('B.Tech'), ('BCA'), ('MBA'), ('M.Tech'), ('Diploma')
ON CONFLICT (name) DO NOTHING;

-- 3. COURSE/STREAM ROUTING STRUCTURE
-- Product convention: departments stores the base course/department, e.g.
-- 'B.Tech', 'BCA', 'MBA'. courses stores the stream/program under that
-- department, e.g. 'Mechanical', 'CSE', 'Finance'. The pair creates the
-- routed program: B.Tech + Mechanical = B.Tech Mechanical.
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- stream/program under department, e.g. 'Mechanical', 'CSE', 'Finance'
    stream_name TEXT,
    aliases JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    college_name TEXT, -- For identification if needed
    eligibility TEXT,
    duration_years INTEGER,
    admission_fees NUMERIC,
    sem_fees NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stream_name TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS aliases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. USER MANAGEMENT
CREATE TABLE IF NOT EXISTS public.user_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    role_id INTEGER REFERENCES public.roles(id),
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL, -- Only for HODs/Councillors
    course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL, -- exact stream/program for HODs
    name TEXT NOT NULL,
    login_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_master ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE public.user_master ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL;

-- Link HOD to Department (Head)
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS hod_id UUID REFERENCES public.user_master(id) ON DELETE SET NULL;

-- 5. COUNCILLOR SPECIFICS
CREATE TABLE IF NOT EXISTS public.councillors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_master(id) ON DELETE CASCADE UNIQUE,
    languages TEXT[] DEFAULT '{}', -- e.g., ['English', 'Hindi', 'Tamil']
    mapped_number_to_call TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Many-to-Many: Councillors can handle multiple courses
CREATE TABLE IF NOT EXISTS public.councillor_course_mapping (
    councillor_id UUID REFERENCES public.councillors(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
    PRIMARY KEY (councillor_id, course_id)
);

-- 6. LEADS & QUALIFICATION
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    phone_number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'raw', -- raw, qualified, assigned_hod, assigned_councillor, contacted, admitted, rejected
    
    -- AI Qualification Data
    interest_course_id INTEGER REFERENCES public.courses(id),
    unsupported_course_name TEXT,
    interest_language TEXT,
    interest_score INTEGER DEFAULT 0, -- 0-10 (Hot Lead Score)
    
    -- Demographic/Additional Info
    state TEXT,
    district TEXT,
    mother_tongue TEXT,
    financial_state TEXT,
    bank_loan_requirement BOOLEAN DEFAULT false,
    
    -- Assignment
    assigned_hod_id UUID REFERENCES public.user_master(id),
    assigned_councillor_id UUID REFERENCES public.councillors(id),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS unsupported_course_name TEXT;

-- 7. CAMPAIGNS & CALLS (Pipeline Infrastructure)
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
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
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

-- Existing install compatibility for recent call-isolation / recording changes
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS vobiz_call_uuid TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS recording_files JSONB DEFAULT '{"stereo": null, "stereo_remote": null, "user": null, "user_remote": null, "bot": null, "bot_remote": null, "vobiz_mp3": null}'::jsonb;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS transcript JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS end_reason TEXT;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS transfer_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.calls ALTER COLUMN recording_files SET DEFAULT '{"stereo": null, "stereo_remote": null, "user": null, "user_remote": null, "bot": null, "bot_remote": null, "vobiz_mp3": null}'::jsonb;
UPDATE public.calls
SET recording_files = '{"stereo": null, "stereo_remote": null, "user": null, "user_remote": null, "bot": null, "bot_remote": null, "vobiz_mp3": null}'::jsonb || COALESCE(recording_files, '{}'::jsonb)
WHERE recording_files IS NULL
   OR NOT (recording_files ? 'stereo_remote')
   OR NOT (recording_files ? 'user_remote')
   OR NOT (recording_files ? 'bot_remote');

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS recipients JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0, "rejected": 0, "active": 0, "queued": 0}'::jsonb;

-- 7B. DURABLE POST-CALL JOBS
-- Used by the isolated SIP worker model so transcription/analysis can run
-- outside live media workers and be deferred while call slots are active.
CREATE TABLE IF NOT EXISTS public.post_call_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.calls(call_id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 0,
    run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
    worker_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_call_jobs ALTER COLUMN job_id SET DEFAULT gen_random_uuid();

-- 8. INTERACTION LOGS
CREATE TABLE IF NOT EXISTS public.call_logs (
    id SERIAL PRIMARY KEY,
    call_id UUID REFERENCES public.calls(call_id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    councillor_id UUID REFERENCES public.councillors(id) ON DELETE SET NULL,
    course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,
    call_number INTEGER DEFAULT 1,
    interest_level TEXT, -- hot, warm, cold
    follow_up_datetime TIMESTAMPTZ,
    ai_transcript TEXT,
    ai_extracted_data JSONB DEFAULT '{}'::jsonb,
    call_datetime TIMESTAMPTZ DEFAULT now()
);

-- Counsellor manual follow-up records after AI qualification/routing.
CREATE TABLE IF NOT EXISTS public.manual_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    call_log_id INTEGER REFERENCES public.call_logs(id) ON DELETE SET NULL,
    councillor_id UUID REFERENCES public.councillors(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- Answered, Busy, Voicemail, Converted, Not Interested, etc.
    interest_level TEXT,
    follow_up_datetime TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_interest_score ON public.leads(interest_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_hod ON public.leads(assigned_hod_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_councillor ON public.leads(assigned_councillor_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON public.calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_vobiz_uuid ON public.calls(vobiz_call_uuid);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON public.campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_user_master_role ON public.user_master(role_id);
CREATE INDEX IF NOT EXISTS idx_user_master_dept ON public.user_master(department_id);
CREATE INDEX IF NOT EXISTS idx_user_master_course ON public.user_master(course_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON public.call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_councillor_id ON public.call_logs(councillor_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_course_id ON public.call_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_datetime ON public.call_logs(call_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_manual_followups_lead_id ON public.manual_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_manual_followups_councillor_id ON public.manual_followups(councillor_id);
CREATE INDEX IF NOT EXISTS idx_manual_followups_created_at ON public.manual_followups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_call_jobs_pending ON public.post_call_jobs(status, run_after, created_at);
CREATE INDEX IF NOT EXISTS idx_post_call_jobs_call_id ON public.post_call_jobs(call_id);

-- 9B. REPORTING VIEW FOR REAL CRM DASHBOARDS
-- This bridges backend call tables to counselor/HOD/super-admin dashboard needs.
CREATE OR REPLACE VIEW public.call_log_details AS
SELECT
    cl.id,
    cl.call_id,
    cl.lead_id,
    cl.councillor_id,
    cl.course_id,
    cl.call_number,
    cl.interest_level,
    cl.follow_up_datetime,
    cl.ai_transcript,
    cl.ai_extracted_data,
    cl.call_datetime,
    c.phone_number,
    c.recipient_name,
    c.recipient_detail,
    c.status AS call_status,
    c.duration_seconds,
    c.duration_minutes,
    c.vobiz_call_uuid,
    c.recording_files,
    c.transcript,
    c.metadata AS call_metadata,
    c.end_reason,
    l.name AS lead_name,
    l.phone_number AS lead_mobile,
    l.status AS lead_status,
    l.state AS lead_state,
    l.district AS lead_district,
    l.interest_score,
    l.interest_language,
    l.assigned_hod_id,
    u.name AS councillor_name,
    u.email AS councillor_email,
    crs.name AS course_name,
    crs.name AS stream_name,
    CONCAT_WS(' ', d.name, crs.name) AS full_course_name,
    COALESCE(CONCAT_WS(' ', d.name, crs.name), l.unsupported_course_name, cl.ai_extracted_data->'courses_interested'->>0) AS interest_course_name,
    (crs.id IS NULL AND COALESCE(l.unsupported_course_name, cl.ai_extracted_data->'courses_interested'->>0) IS NOT NULL) AS unsupported_course,
    crs.department_id,
    d.name AS department_name
FROM public.call_logs cl
LEFT JOIN public.calls c ON c.call_id = cl.call_id
LEFT JOIN public.leads l ON l.id = cl.lead_id
LEFT JOIN public.councillors co ON co.id = cl.councillor_id
LEFT JOIN public.user_master u ON u.id = co.user_id
LEFT JOIN public.courses crs ON crs.id = cl.course_id
LEFT JOIN public.departments d ON d.id = crs.department_id;

-- 10. STORAGE (Supabase Specific - Optional for raw Postgres)
-- This will only work on Supabase or Postgres with the storage schema enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('recordings', 'recordings', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
