-- Content Review Tables
-- Part of CRM Content Engine Phase 1A

-- Content drafts (from CRM Content Engine spec)
create table if not exists content_drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_line text,
  body_markdown text not null,
  body_html text,
  status text default 'review',
  segment jsonb,
  audience text default 'external',
  version int default 1,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by text default 'sol',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content comments (highlight + comment system)
create table if not exists content_comments (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references content_drafts(id) on delete cascade,
  highlighted_text text not null,
  start_offset int not null,
  end_offset int not null,
  comment text,
  quick_reaction text,
  category text not null,
  status text default 'pending',
  resolved_text text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Voice taste config (learning loop)
create table if not exists voice_taste_config (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  voice_rules jsonb,
  corrections jsonb default '[]',
  storybank_refs jsonb default '[]',
  on_brand_words text[] default '{}',
  off_brand_words text[] default '{}',
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_content_comments_draft_id on content_comments(draft_id);
create index if not exists idx_content_comments_status on content_comments(status);
create index if not exists idx_content_drafts_status on content_drafts(status);

-- RLS policies
alter table content_drafts enable row level security;
alter table content_comments enable row level security;
alter table voice_taste_config enable row level security;

-- Admin-only access (check admin_users table)
create policy "Admins can read content_drafts"
  on content_drafts for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can insert content_drafts"
  on content_drafts for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update content_drafts"
  on content_drafts for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can read content_comments"
  on content_comments for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can insert content_comments"
  on content_comments for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update content_comments"
  on content_comments for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can read voice_taste_config"
  on voice_taste_config for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update voice_taste_config"
  on voice_taste_config for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- Auto-extraction trigger: when comment resolved, append correction to voice_taste_config
create or replace function append_voice_correction()
returns trigger as $$
begin
  if NEW.status = 'resolved' and NEW.resolved_text is not null and OLD.status != 'resolved' then
    update voice_taste_config
    set corrections = corrections || jsonb_build_array(jsonb_build_object(
      'original', NEW.highlighted_text,
      'corrected', NEW.resolved_text,
      'rule_learned', coalesce(NEW.comment, NEW.quick_reaction),
      'category', NEW.category,
      'created_at', now()::text
    )),
    updated_at = now()
    where owner_id is null;  -- Phase 1: Huzz only (owner_id = null)
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_content_comment_resolved
  after update on content_comments
  for each row
  execute function append_voice_correction();

-- Seed Huzz's voice_taste_config (one row, owner_id = null for Phase 1)
insert into voice_taste_config (owner_id, voice_rules, on_brand_words, off_brand_words)
values (
  null,
  '{"tone": "casual, warm, energetic, self-deprecating before authoritative", "avoid": "corporate jargon, journey, self-discovery, leverage, synergy", "prefer": "wild ride, figuring your shit out, healing but fun"}',
  array['wild ride', 'healing but fun', 'groan', 'nervous system', 'earthquake', 'protective voice', 'vibe', 'flow'],
  array['journey', 'self-discovery', 'leverage', 'synergy', 'actionable', 'optimize', 'unlock your potential']
);
