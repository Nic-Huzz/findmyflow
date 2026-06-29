-- Scale Diagnostic Flow: stores Phase 3 quadrant diagnostic results
create table if not exists scale_diagnostics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_name text,
  score_body smallint check (score_body between 1 and 5),
  score_culture smallint check (score_culture between 1 and 5),
  score_identity smallint check (score_identity between 1 and 5),
  score_access smallint check (score_access between 1 and 5),
  gate_passed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One record per user (upsert pattern)
create unique index if not exists scale_diagnostics_user_idx on scale_diagnostics(user_id);

-- RLS
alter table scale_diagnostics enable row level security;

create policy "Users can read own diagnostics"
  on scale_diagnostics for select
  using (auth.uid() = user_id);

create policy "Users can insert own diagnostics"
  on scale_diagnostics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own diagnostics"
  on scale_diagnostics for update
  using (auth.uid() = user_id);
