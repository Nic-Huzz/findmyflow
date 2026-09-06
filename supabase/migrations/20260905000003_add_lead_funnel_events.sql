-- Lead funnel step tracking for drop-off analysis
-- Tracks each step a user reaches in any lead magnet flow
create table if not exists lead_funnel_events (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,              -- anonymous session (generated client-side)
  funnel text not null,                  -- 'aliveness_quiz', 'experience_game', 'ambition_radar'
  step text not null,                    -- step name within funnel
  step_index smallint not null,          -- numeric order (0-based)
  duration_ms integer,                   -- time spent on previous step before advancing
  metadata jsonb,                        -- optional context (e.g. which answer, utm params)
  created_at timestamptz default now()
);

-- Index for analysis queries
create index idx_funnel_events_funnel on lead_funnel_events (funnel, created_at);
create index idx_funnel_events_session on lead_funnel_events (session_id);

-- RLS — allow anonymous inserts (public pages)
alter table lead_funnel_events enable row level security;

create policy "Anyone can insert funnel events"
  on lead_funnel_events for insert
  with check (true);

-- Allow reading for admin analysis
create policy "Authenticated users can read funnel events"
  on lead_funnel_events for select
  using (auth.role() = 'authenticated');
