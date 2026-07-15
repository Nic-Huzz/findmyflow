create table zarlo_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  brief jsonb not null,
  generated_at timestamptz default now(),

  constraint one_brief_per_user unique (user_id)
);

-- RLS: users can read their own brief
alter table zarlo_briefs enable row level security;
create policy "Users read own brief" on zarlo_briefs
  for select using (auth.uid() = user_id);

-- Service role can upsert (edge function runs with service key)
create policy "Service can upsert briefs" on zarlo_briefs
  for all using (true) with check (true);

-- Index for fast lookup
create index idx_zarlo_briefs_user on zarlo_briefs(user_id);
