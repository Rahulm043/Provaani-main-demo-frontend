create table if not exists public.post_call_jobs (
  job_id uuid primary key,
  call_id uuid not null,
  job_type text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  worker_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_post_call_jobs_pending
  on public.post_call_jobs (status, run_after, created_at);

create index if not exists idx_post_call_jobs_call_id
  on public.post_call_jobs (call_id);
