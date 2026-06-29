create table life_path_sessions (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text,
  current_career text,
  current_state text,
  careers jsonb default '[]'::jsonb,
  wahoo_steps jsonb default '{}'::jsonb,
  safety numeric default 0,
  step text default 'current',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Allow anon inserts/updates (facilitator tool, no auth)
alter table life_path_sessions enable row level security;

create policy "anon_insert_life_path_sessions"
  on life_path_sessions for insert
  to anon with check (true);

create policy "anon_update_life_path_sessions"
  on life_path_sessions for update
  to anon using (true) with check (true);

create policy "anon_select_life_path_sessions"
  on life_path_sessions for select
  to anon using (true);
