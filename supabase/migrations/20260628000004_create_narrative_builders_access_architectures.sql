-- Narrative Builder + Access Architecture tables
-- Part of Creator Playbook pipeline: RemarkableFlow → Scale Diagnostic → Narrative Builder → Access Architecture

-- ── Narrative Builders ──────────────────────────────────────────────────────

create table narrative_builders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_name text,
  tribal_language text,
  identity_label text,
  first_step_type text check (first_step_type in ('step', 'window')),
  first_step_desc text,
  cosign_targets text[],
  cosign_existing text,
  generated_narrative text,
  created_at timestamptz default now()
);

create unique index narrative_builders_user_idx on narrative_builders(user_id);

alter table narrative_builders enable row level security;
create policy "Users can read own" on narrative_builders for select using (auth.uid() = user_id);
create policy "Users can insert own" on narrative_builders for insert with check (auth.uid() = user_id);
create policy "Users can update own" on narrative_builders for update using (auth.uid() = user_id);

-- ── Access Architectures ────────────────────────────────────────────────────

create table access_architectures (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_name text,
  price_score smallint check (price_score between 1 and 5),
  time_score smallint check (time_score between 1 and 5),
  friction_score smallint check (friction_score between 1 and 5),
  cognitive_score smallint check (cognitive_score between 1 and 5),
  identity_score smallint check (identity_score between 1 and 5),
  weakest_barrier text,
  designed_first_step text,
  created_at timestamptz default now()
);

create unique index access_architectures_user_idx on access_architectures(user_id);

alter table access_architectures enable row level security;
create policy "Users can read own" on access_architectures for select using (auth.uid() = user_id);
create policy "Users can insert own" on access_architectures for insert with check (auth.uid() = user_id);
create policy "Users can update own" on access_architectures for update using (auth.uid() = user_id);
