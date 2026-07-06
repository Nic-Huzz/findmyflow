create table quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  label text not null,
  career_id text,
  predicted_state text,
  status text default 'active',
  close_reason text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quest_tasks (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references quests on delete cascade not null,
  user_id uuid references auth.users not null,
  text text not null,
  done boolean default false,
  is_courage_challenge boolean default false,
  groan_challenge_id uuid,
  stuck_point_id text,
  sort_order int default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table quests enable row level security;
create policy "users_own_quests" on quests for all using (user_id = auth.uid());

alter table quest_tasks enable row level security;
create policy "users_own_quest_tasks" on quest_tasks for all using (user_id = auth.uid());
