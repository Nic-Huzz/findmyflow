-- Track when a courage challenge on one quest also feeds another quest
-- Used to detect curiosity convergence and visualise line merges
create table quest_cross_pollination (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source_quest_id uuid references quests not null,
  target_quest_id uuid references quests not null,
  groan_challenge_id uuid,
  created_at timestamptz default now()
);

alter table quest_cross_pollination enable row level security;
create policy "users_own_cross_pollination" on quest_cross_pollination
  for all using (user_id = auth.uid());

create index idx_cross_pollination_user on quest_cross_pollination(user_id);
create index idx_cross_pollination_pair on quest_cross_pollination(source_quest_id, target_quest_id);
