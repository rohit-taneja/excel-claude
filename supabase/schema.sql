-- Excel Skills app — Supabase schema
-- Run this in the Supabase SQL Editor (or via the CLI) on a fresh project.
-- All access is via the service-role key from the server; Row Level Security
-- is enabled with no public policies so the anon/public role cannot read/write.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- user_progress: one row per (user, skill)
-- ---------------------------------------------------------------------------
create table if not exists public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_key     text not null,
  skill_id     text not null,
  status       text not null default 'not_started',
  score        numeric default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_key, skill_id)
);

create index if not exists user_progress_user_key_idx
  on public.user_progress (user_key);

-- ---------------------------------------------------------------------------
-- test_attempts: one row per submitted test
-- ---------------------------------------------------------------------------
create table if not exists public.test_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_key         text not null,
  test_id          text not null,
  score            numeric not null,
  total_questions  int not null,
  correct_count    int not null,
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  duration_seconds int
);

create index if not exists test_attempts_user_key_idx
  on public.test_attempts (user_key);

create index if not exists test_attempts_submitted_at_idx
  on public.test_attempts (submitted_at desc);

-- ---------------------------------------------------------------------------
-- test_answers: one row per answered question within an attempt
-- ---------------------------------------------------------------------------
create table if not exists public.test_answers (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.test_attempts (id) on delete cascade,
  question_id        text not null,
  user_answer        jsonb,
  correct_answer     jsonb,
  is_correct         boolean,
  points_awarded     numeric default 0,
  max_points         numeric default 10,
  time_taken_seconds int
);

create index if not exists test_answers_attempt_id_idx
  on public.test_answers (attempt_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: lock down to the service role only.
-- The server uses the service-role key, which bypasses RLS. Enabling RLS with
-- no policies means anon/public clients get no access.
-- ---------------------------------------------------------------------------
alter table public.user_progress enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_answers  enable row level security;
