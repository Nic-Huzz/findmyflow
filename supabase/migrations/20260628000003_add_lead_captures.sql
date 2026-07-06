-- Lead captures for public diagnostic tools
create table if not exists lead_captures (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  source text default 'facilitator-score',
  scores jsonb,
  created_at timestamptz default now()
);

-- RLS — allow anonymous inserts (public form)
alter table lead_captures enable row level security;

create policy "Anyone can insert lead captures"
  on lead_captures for insert
  with check (true);
