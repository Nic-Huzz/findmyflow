-- Quest Aliveness Snapshots: per-path Vibe Rise Radar baselines and check-ins
create table quest_aliveness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  quest_id uuid references quests(id) not null,
  snapshot_type text not null check (snapshot_type in ('baseline', 'checkin')),
  scores jsonb not null,
  created_at timestamptz default now()
);

alter table quest_aliveness_snapshots enable row level security;

create policy "Users can insert own snapshots"
  on quest_aliveness_snapshots for insert with check (auth.uid() = user_id);

create policy "Users can read own snapshots"
  on quest_aliveness_snapshots for select using (auth.uid() = user_id);

create index idx_aliveness_snapshots_user_quest
  on quest_aliveness_snapshots(user_id, quest_id, created_at desc);

-- One baseline per user per quest
create unique index idx_aliveness_baseline_unique
  on quest_aliveness_snapshots(user_id, quest_id)
  where snapshot_type = 'baseline';
