-- Workshop sessions
create table if not exists workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  facilitator_user_id uuid references auth.users,
  current_stage int default 0,
  status text default 'waiting' check (status in ('waiting', 'active', 'completed')),
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Workshop participants
create table if not exists workshop_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workshop_sessions on delete cascade,
  anon_user_id uuid references auth.users,
  name text not null,
  email text not null,
  current_stage int default 0,
  current_subflow int default 0,
  stage_completed boolean[] default '{false,false,false,false,false}',
  joined_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS for workshop_sessions
alter table workshop_sessions enable row level security;

create policy "Facilitator can manage their sessions"
  on workshop_sessions for all
  to authenticated
  using (facilitator_user_id = auth.uid())
  with check (facilitator_user_id = auth.uid());

create policy "Anyone can read session by code"
  on workshop_sessions for select
  to authenticated
  using (true);

-- RLS for workshop_participants
alter table workshop_participants enable row level security;

create policy "Participants can manage their own row"
  on workshop_participants for all
  to authenticated
  using (anon_user_id = auth.uid())
  with check (anon_user_id = auth.uid());

create policy "Facilitator can read all participants in their session"
  on workshop_participants for select
  to authenticated
  using (
    session_id in (
      select id from workshop_sessions
      where facilitator_user_id = auth.uid()
    )
  );
