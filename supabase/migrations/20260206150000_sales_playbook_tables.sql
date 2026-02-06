-- Objection logs for tracking Three Distortions usage
create table if not exists objection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  deal_id uuid references sales_deals(id) on delete set null,
  layer text not null,
  category text not null,
  strategy_used text,
  outcome text check (outcome in ('overcame', 'partially', 'failed', 'unknown')),
  prospect_response text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_objection_logs_user on objection_logs(user_id);
create index if not exists idx_objection_logs_category on objection_logs(user_id, category);

alter table objection_logs enable row level security;
create policy "Users see own logs" on objection_logs for all using (auth.uid() = user_id);

-- User CLOSER scripts (personalized fill-in-the-blank)
create table if not exists user_closer_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null unique,
  steps jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_closer_scripts enable row level security;
create policy "Users see own scripts" on user_closer_scripts for all using (auth.uid() = user_id);

-- Migrate existing flat loss reasons to Three Distortions format
update deal_outcomes set primary_reason = 'circumstances/price' where primary_reason = 'price' and outcome = 'lost';
update deal_outcomes set primary_reason = 'circumstances/time_macro' where primary_reason = 'timing' and outcome = 'lost';
update deal_outcomes set primary_reason = 'circumstances/fit' where primary_reason = 'competitor' and outcome = 'lost';
update deal_outcomes set primary_reason = 'self/avoidance_present' where primary_reason = 'no_decision' and outcome = 'lost';
update deal_outcomes set primary_reason = 'circumstances/fit' where primary_reason = 'fit' and outcome = 'lost';
update deal_outcomes set primary_reason = 'self/avoidance_past' where primary_reason = 'trust' and outcome = 'lost';
