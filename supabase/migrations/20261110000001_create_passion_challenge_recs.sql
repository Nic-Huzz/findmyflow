create table if not exists passion_challenge_recs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  quest_id uuid references quests(id) on delete cascade not null,
  recommendation jsonb not null,
  strike_type text,
  target_dimensions text[],
  pattern text,
  stage text,
  mode text,
  generated_at timestamptz default now(),
  accepted_at timestamptz,
  dismissed_at timestamptz,
  unique (user_id, quest_id)
);

alter table passion_challenge_recs enable row level security;

create policy "Users manage own passion challenge recs"
  on passion_challenge_recs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
