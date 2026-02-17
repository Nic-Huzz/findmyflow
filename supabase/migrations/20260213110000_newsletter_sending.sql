-- ============================================================
-- Newsletter Sending Infrastructure
-- ============================================================

-- External contacts (program participants, event attendees, Substack, manual)
create table external_contacts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text,
  tags text[] default '{}',
  subscribed boolean default true,
  unsubscribed_at timestamptz,
  created_at timestamptz default now()
);

-- Newsletter send tracking (one row per recipient per send)
create table newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references content_drafts(id) on delete cascade,
  recipient_email text not null,
  recipient_source text,
  resend_id text,
  status text default 'queued',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- Indexes for cron query performance
create index idx_newsletter_sends_queued
  on newsletter_sends (scheduled_for)
  where status = 'queued';

create index idx_newsletter_sends_draft
  on newsletter_sends (draft_id);

create index idx_external_contacts_email
  on external_contacts (email);

create index idx_external_contacts_tags
  on external_contacts using gin (tags);

-- RLS: admin-only (matches existing content_drafts pattern)
alter table external_contacts enable row level security;
alter table newsletter_sends enable row level security;

create policy "Admins can read external_contacts"
  on external_contacts for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can insert external_contacts"
  on external_contacts for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update external_contacts"
  on external_contacts for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can read newsletter_sends"
  on newsletter_sends for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can insert newsletter_sends"
  on newsletter_sends for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

create policy "Admins can update newsletter_sends"
  on newsletter_sends for update
  using (exists (select 1 from admin_users where user_id = auth.uid()));
