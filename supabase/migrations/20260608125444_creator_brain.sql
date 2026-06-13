-- Creator Brain: unified context engine for experience creators
-- Architecture ported from claude-portal business_brain
-- Sidecar (facts JSONB) is source of truth; markdown columns are derived views

create table if not exists creator_brain (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  identity_md     text not null default '',
  offer_md        text not null default '',
  audience_md     text not null default '',
  voice_md        text not null default '',
  inner_game_md   text not null default '',
  performance_md  text not null default '',
  facts           jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table creator_brain is 'Unified context engine for experience creators. 6 domains, ~90 fields. Sidecar (facts) is truth; markdown columns are derived views for AI prompt injection.';
comment on column creator_brain.facts is 'JSONB sidecar: { "domain.field_key" → BrainField }. Source of truth. Markdown is regenerated from this.';

-- RLS
alter table creator_brain enable row level security;

create policy "Users read own brain"
  on creator_brain for select
  using (auth.uid() = user_id);

create policy "Users insert own brain"
  on creator_brain for insert
  with check (auth.uid() = user_id);

create policy "Users update own brain"
  on creator_brain for update
  using (auth.uid() = user_id);

-- Auto-update timestamp
create or replace function update_creator_brain_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger creator_brain_updated
  before update on creator_brain
  for each row
  execute function update_creator_brain_timestamp();
