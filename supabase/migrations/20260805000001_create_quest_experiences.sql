-- Quest Experiences: grouping layer for to-dos within life paths
-- Courage challenges stay at quest level (cross-pollinate across experiences)

create table quest_experiences (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references quests on delete cascade not null,
  user_id uuid references auth.users not null,
  label text not null,
  capacity_state text,  -- vibe_rise / fun / pressure / uninterested
  status text default 'active',  -- active / achieved / deferred
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for loading experiences by quest
create index idx_quest_experiences_quest_id on quest_experiences(quest_id);
create index idx_quest_experiences_user_id on quest_experiences(user_id);

-- RLS: users can only access their own experiences
alter table quest_experiences enable row level security;
create policy "users_own_quest_experiences" on quest_experiences
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Add experience_id to quest_tasks (nullable — only used for to-dos, not courage challenges)
alter table quest_tasks add column experience_id uuid references quest_experiences on delete set null;
