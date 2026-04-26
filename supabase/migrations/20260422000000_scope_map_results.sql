-- Scope Map diagnostic results
-- Tracks user's position in the River System (Stream/Lake/Waterfall/River)
-- Multiple rows per user to track movement over time

create table if not exists scope_map_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  stage text not null check (stage in ('stream', 'lake', 'waterfall', 'river')),
  response_problem text,
  response_source text,
  response_audience text,
  ai_reasoning text,
  problem_spread int,
  created_at timestamptz default now()
);

-- Index for fetching user's latest result
create index idx_scope_map_results_user on scope_map_results(user_id, created_at desc);

-- RLS
alter table scope_map_results enable row level security;

create policy "Users can read own scope map results"
  on scope_map_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own scope map results"
  on scope_map_results for insert
  with check (auth.uid() = user_id);
