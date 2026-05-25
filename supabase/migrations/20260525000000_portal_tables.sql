-- Portal tables for AI Portal
-- Simplified schema: Growth Line computes from existing FMF data.
-- Only stores tasks (action items) and activity log.

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.portal_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- portal_tasks: action items per pipeline node
-- node_key is a string reference (not FK) to computed pipeline nodes
CREATE TABLE public.portal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL,  -- awareness | contact | outreach | conversation | qualified | meeting_booked | close | onboard | deliver | support | retain
  title TEXT NOT NULL,
  description TEXT,
  message TEXT,            -- prompt to copy/run in terminal
  type TEXT NOT NULL DEFAULT 'build',  -- build | document | agent | alert
  priority TEXT DEFAULT 'this_week',   -- today | this_week | later
  status TEXT NOT NULL DEFAULT 'open', -- open | completed
  completed_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX portal_tasks_user_idx ON public.portal_tasks(user_id);
CREATE INDEX portal_tasks_node_idx ON public.portal_tasks(user_id, node_key);
CREATE INDEX portal_tasks_status_idx ON public.portal_tasks(status);

ALTER TABLE public.portal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON public.portal_tasks FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER portal_tasks_updated_at
  BEFORE UPDATE ON public.portal_tasks
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- portal_activity: action log
CREATE TABLE public.portal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.portal_tasks(id) ON DELETE SET NULL,
  node_key TEXT,
  actor TEXT NOT NULL DEFAULT 'user',
  action TEXT NOT NULL,    -- task_completed | task_created | metric_updated
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX portal_activity_user_idx ON public.portal_activity(user_id);
CREATE INDEX portal_activity_created_idx ON public.portal_activity(created_at DESC);

ALTER TABLE public.portal_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
  ON public.portal_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.portal_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- agent_conversations
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX agent_conversations_user_idx ON public.agent_conversations(user_id);
CREATE UNIQUE INDEX agent_conversations_user_agent_idx ON public.agent_conversations(user_id, agent_id);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.agent_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- agent_tasks
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX agent_tasks_user_idx ON public.agent_tasks(user_id);
CREATE INDEX agent_tasks_agent_idx ON public.agent_tasks(user_id, agent_id);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agent tasks"
  ON public.agent_tasks FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();
