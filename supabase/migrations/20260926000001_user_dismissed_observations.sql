-- Intelligence Observations: dismissed observations tracking
-- Dismiss = "hide until relevant again" — resolution checks clear rows when pattern resolves

create table user_dismissed_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  observation_id text not null,
  dismissed_at timestamptz default now()
);

alter table user_dismissed_observations enable row level security;

create policy "Users manage own dismissals"
  on user_dismissed_observations for all using (auth.uid() = user_id);

create unique index idx_dismissed_user_obs
  on user_dismissed_observations(user_id, observation_id);
