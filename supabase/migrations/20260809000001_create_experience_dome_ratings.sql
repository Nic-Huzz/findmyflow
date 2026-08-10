-- Experience Dome ratings: user's NS state for each experiential node
create table if not exists experience_dome_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  ns_state text not null check (ns_state in ('vibe_rise', 'fun', 'growth_edge', 'pressure', 'bored')),
  rated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, node_id)
);

-- Index for fast user lookups
create index if not exists idx_dome_ratings_user on experience_dome_ratings(user_id);

-- RLS
alter table experience_dome_ratings enable row level security;

create policy "Users can read own dome ratings"
  on experience_dome_ratings for select
  using (auth.uid() = user_id);

create policy "Users can insert own dome ratings"
  on experience_dome_ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own dome ratings"
  on experience_dome_ratings for update
  using (auth.uid() = user_id);

create policy "Users can delete own dome ratings"
  on experience_dome_ratings for delete
  using (auth.uid() = user_id);
