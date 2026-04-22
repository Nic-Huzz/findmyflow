-- Experience Creator Matching selections
create table if not exists experience_creator_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  selected_creators text[] not null default '{}',
  dominant_archetype text,
  product_suite jsonb,
  layer_validations jsonb,
  created_at timestamptz default now()
);

-- Index for user lookups
create index if not exists idx_ec_selections_user on experience_creator_selections(user_id);

-- RLS
alter table experience_creator_selections enable row level security;

create policy "Users can read own selections"
  on experience_creator_selections for select
  using (auth.uid() = user_id);

create policy "Users can insert own selections"
  on experience_creator_selections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own selections"
  on experience_creator_selections for update
  using (auth.uid() = user_id);
