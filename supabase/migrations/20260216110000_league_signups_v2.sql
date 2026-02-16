-- Update league_signups: replace email/committed with whatsapp, team_readiness, team_name
alter table public.league_signups
  add column if not exists whatsapp text,
  add column if not exists team_readiness text,
  add column if not exists team_name text;

-- Drop old unique constraint and add new one on whatsapp
alter table public.league_signups
  drop constraint if exists league_signups_email_unique;

alter table public.league_signups
  add constraint league_signups_whatsapp_unique unique (whatsapp);

-- Allow upsert (insert + update on conflict)
drop policy if exists "Anyone can sign up for the league" on public.league_signups;

create policy "Anyone can sign up for the league"
  on public.league_signups
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow upsert on league signups"
  on public.league_signups
  for update
  to anon, authenticated
  using (true)
  with check (true);
