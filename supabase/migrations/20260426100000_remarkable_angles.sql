-- Remarkable angles diagnostic results
-- Stores user's rule break, unexpected combination, extreme action plan
-- Multiple rows per user (angle sharpens over time)

create table if not exists remarkable_angles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  wound_problem text,
  rule_identified text,
  combination_insight text,
  extreme_action_plan text,
  ai_rule_statement text,
  ai_remarkable_bio text,
  ai_tribe_statement text,
  created_at timestamptz default now()
);

create index idx_remarkable_angles_user on remarkable_angles(user_id, created_at desc);

alter table remarkable_angles enable row level security;

create policy "Users can read own remarkable angles"
  on remarkable_angles for select
  using (auth.uid() = user_id);

create policy "Users can insert own remarkable angles"
  on remarkable_angles for insert
  with check (auth.uid() = user_id);
