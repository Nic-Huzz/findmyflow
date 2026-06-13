-- Blow Up Your Brand: Readiness Assessment
-- Stores Layer 2 (Proof) + Layer 3 (Ceiling) data from the diagnostic flow
-- Layer 1 (Distillation) continues to save to remarkable_angles

create table if not exists blow_up_readiness (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,

  -- Layer 2: Proof
  proof_count text check (proof_count in ('not_yet', '1_10', '10_50', '50_plus')),
  proof_evidence text,
  previous_experience text,

  -- Layer 3: Ceiling
  ceiling_type text check (ceiling_type in ('reach', 'credibility', 'not_yet')),

  -- Computed readiness
  layer1_status text check (layer1_status in ('green', 'amber', 'red')),
  layer2_status text check (layer2_status in ('green', 'amber', 'red')),
  layer3_status text check (layer3_status in ('green', 'amber', 'red')),
  all_ready boolean default false,

  -- Context at time of assessment
  matched_founder_used text,
  experience_count_at_time integer default 0,

  -- Link to the remarkable angle saved in the same session
  remarkable_angle_id uuid references remarkable_angles(id),

  created_at timestamptz default now()
);

alter table blow_up_readiness enable row level security;

create policy "Users own their readiness results"
  on blow_up_readiness for all using (auth.uid() = user_id);

create index idx_blow_up_readiness_user on blow_up_readiness(user_id);
create index idx_blow_up_readiness_ready on blow_up_readiness(user_id, all_ready) where all_ready = true;
