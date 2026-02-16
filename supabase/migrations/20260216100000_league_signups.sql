-- Fantasy League Season 1 signups
create table if not exists public.league_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  committed boolean not null default true,
  created_at timestamptz not null default now(),
  constraint league_signups_email_unique unique (email)
);

alter table public.league_signups enable row level security;

-- Allow signups from the public landing page (no auth required)
create policy "Anyone can sign up for the league"
  on public.league_signups
  for insert
  to anon, authenticated
  with check (true);
