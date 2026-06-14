-- App Build (BuildWithAI) tables for /create/build-app
-- Guided hackathon flow for experience creators to build their own app

-- Challenge definitions (seeded below)
create table if not exists public.app_build_challenges (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  title text not null,
  emoji text,
  duration text,
  content jsonb not null default '{}'::jsonb,
  is_locked boolean default true,
  "order" integer not null,
  created_at timestamptz default now() not null
);

-- User progress per challenge (checkbox tracking)
create table if not exists public.app_build_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  challenge_number integer not null references public.app_build_challenges(number),
  checkboxes_completed jsonb default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  unique(user_id, challenge_number)
);

-- Prework responses (product definition)
create table if not exists public.app_build_prework (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  responses jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- RLS
alter table public.app_build_challenges enable row level security;
alter table public.app_build_progress enable row level security;
alter table public.app_build_prework enable row level security;

-- Challenges: anyone authenticated can read
create policy "Authenticated users can view app build challenges"
  on public.app_build_challenges for select
  using (auth.role() = 'authenticated');

-- Progress: users own their rows
create policy "Users can view their own app build progress"
  on public.app_build_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own app build progress"
  on public.app_build_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own app build progress"
  on public.app_build_progress for update
  using (auth.uid() = user_id);

-- Prework: users own their rows
create policy "Users can view their own app build prework"
  on public.app_build_prework for select
  using (auth.uid() = user_id);

create policy "Users can insert their own app build prework"
  on public.app_build_prework for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own app build prework"
  on public.app_build_prework for update
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_app_build_progress_user on public.app_build_progress(user_id);
create index if not exists idx_app_build_prework_user on public.app_build_prework(user_id);

-- Seed the 5 challenges (content stored as JSONB, matches BuildWithAI updated curriculum)
insert into public.app_build_challenges (number, title, emoji, duration, "order", is_locked, content) values
(1, 'First Magic', '✨', '20 min', 1, false, '{"objective":"Experience the magic of AI-assisted building. Paste your pre-work into Claude and watch it transform your idea into a visual, clickable prototype.","learning_outcomes":["Experience the magic moment of seeing your idea come to life","Use Claude to create a visual prototype artifact","Choose a design style that matches your vision"],"lego_parallel":{"title":"Seeing the Picture on the Box","description":"Before you build a LEGO set, you look at the picture on the box to see what you''re creating. That''s what we''re doing here - turning your idea into a visual preview."}}'::jsonb),
(2, 'Foundation Build', '🏗️', '75 min', 2, true, '{"objective":"Finalize your spec sheet and build the foundation of your app. By the end, you''ll have a real codebase connected to a real database, running locally.","learning_outcomes":["Create a complete, buildable spec sheet from your prototype","Learn how to give Claude Code a complete spec and let it scaffold a project","Connect your app to Supabase (your database)"],"lego_parallel":{"title":"From Blueprint to Foundation","description":"You''ve seen the picture on the box. Now it''s time to create the detailed instruction manual and lay down the baseplate."}}'::jsonb),
(3, 'Test, Debug & Refine', '🛠', '60 min', 3, true, '{"objective":"Test your rough working version, identify what''s broken or not quite right, and work with Claude Code to fix it.","learning_outcomes":["Learn a structured approach to testing your app","Understand how to read error messages and use the console","Practice the test → identify → fix loop with Claude Code"],"lego_parallel":{"title":"Quality Inspection","description":"You''ve built your castle quickly. Now you walk through each room, checking if the doors open, if the drawbridge works, if the stairs connect properly."}}'::jsonb),
(4, 'Polish & Deploy', '🚀', '45 min', 4, true, '{"objective":"Make your app look good on all devices, push it to GitHub, and deploy it to Vercel. By the end, you''ll have a live URL.","learning_outcomes":["Learn to test and fix mobile responsiveness","Understand the GitHub → Vercel deployment flow","Experience the thrill of shipping something live"],"lego_parallel":{"title":"The Grand Reveal","description":"Your castle is built and functional. Now you''re adding the finishing touches and moving it from your building table to the display shelf."}}'::jsonb),
(5, 'Celebrate & Share', '🎉', '10 min', 5, true, '{"objective":"Reflect on what you''ve built and share your experience.","learning_outcomes":["Reflect on your hackathon journey","Share your project with the world","Help us make this experience even better"],"lego_parallel":{"title":"The Victory Lap","description":"Your castle is complete and on display. Now it''s time to step back, admire what you''ve built, and tell others about your creation."}}'::jsonb);
