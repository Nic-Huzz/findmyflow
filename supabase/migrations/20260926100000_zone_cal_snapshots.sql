-- Zone Cal Snapshots: 21-day self-report check-in history
create table zone_cal_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  scores jsonb not null,
  diagnosis text not null,
  source text not null default 'in_app',
  created_at timestamptz default now()
);

-- RLS
alter table zone_cal_snapshots enable row level security;
create policy "Users read own snapshots"
  on zone_cal_snapshots for select using (auth.uid() = user_id);
create policy "Users insert own snapshots"
  on zone_cal_snapshots for insert with check (auth.uid() = user_id);

-- Index for fetching latest + history
create index idx_zonecal_user_date on zone_cal_snapshots(user_id, created_at desc);
