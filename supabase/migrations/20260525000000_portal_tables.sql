-- Portal tables for AI Portal (Growth Line, Grind Line, Agents)
-- Adapted from Claude Portal migrations 006 + 007
-- Key change: user_id references auth.users(id) instead of user_profiles(id)

-- Shared updated_at trigger function for all portal tables
CREATE OR REPLACE FUNCTION public.portal_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 1. portal_clients
CREATE TABLE public.portal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  industry TEXT,
  website TEXT,
  team_size INT,
  revenue_model TEXT,
  one_liner TEXT,
  composio_entity TEXT,
  phase TEXT DEFAULT 'discovery',  -- discovery | phase_1 | phase_2 | phase_3 | ongoing
  status TEXT DEFAULT 'active',    -- active | paused | completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX portal_clients_user_idx ON public.portal_clients(user_id);
CREATE INDEX portal_clients_entity_idx ON public.portal_clients(composio_entity);

ALTER TABLE public.portal_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clients"
  ON public.portal_clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON public.portal_clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON public.portal_clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON public.portal_clients FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER portal_clients_updated_at
  BEFORE UPDATE ON public.portal_clients
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- 2. portal_growth_nodes
CREATE TABLE public.portal_growth_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.portal_clients(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL,  -- awareness | to_contact | reached_out | in_conversation | qualified | meeting_booked | close | onboard | deliver | support | retain
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'good',  -- good | warn | bad | working
  headline_value TEXT,
  headline_label TEXT,
  metrics JSONB DEFAULT '[]'::jsonb,
  systems JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, node_key)
);

CREATE INDEX portal_growth_nodes_client_idx ON public.portal_growth_nodes(client_id);

ALTER TABLE public.portal_growth_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own growth nodes"
  ON public.portal_growth_nodes FOR ALL
  USING (client_id IN (SELECT id FROM public.portal_clients WHERE user_id = auth.uid()));

CREATE TRIGGER portal_growth_nodes_updated_at
  BEFORE UPDATE ON public.portal_growth_nodes
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- 3. portal_grind_loops
CREATE TABLE public.portal_grind_loops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.portal_clients(id) ON DELETE CASCADE,
  loop_key TEXT NOT NULL,  -- email_triage | invoicing | scheduling | content | reporting | hiring
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'good',  -- good | warn | bad
  hours_per_week NUMERIC(5,1) DEFAULT 0,
  headline_value TEXT,
  headline_label TEXT,
  metrics JSONB DEFAULT '[]'::jsonb,
  stages JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, loop_key)
);

CREATE INDEX portal_grind_loops_client_idx ON public.portal_grind_loops(client_id);

ALTER TABLE public.portal_grind_loops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own grind loops"
  ON public.portal_grind_loops FOR ALL
  USING (client_id IN (SELECT id FROM public.portal_clients WHERE user_id = auth.uid()));

CREATE TRIGGER portal_grind_loops_updated_at
  BEFORE UPDATE ON public.portal_grind_loops
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- 4. portal_tasks
CREATE TABLE public.portal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.portal_clients(id) ON DELETE CASCADE,
  growth_node_id UUID REFERENCES public.portal_growth_nodes(id) ON DELETE CASCADE,
  grind_loop_id UUID REFERENCES public.portal_grind_loops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  message TEXT,
  type TEXT NOT NULL,        -- build | document | agent | alert
  level_letsgo TEXT NOT NULL DEFAULT 'active',  -- active | locked | complete
  level_setup TEXT NOT NULL DEFAULT 'locked',   -- active | locked | complete
  letsgo_reason TEXT,
  setup_reason TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- open | completed
  completed_at TIMESTAMPTZ,
  impact TEXT,
  priority TEXT DEFAULT 'this_week',  -- today | this_week | later
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_parent_check CHECK (
    (growth_node_id IS NOT NULL AND grind_loop_id IS NULL) OR
    (growth_node_id IS NULL AND grind_loop_id IS NOT NULL)
  )
);

CREATE INDEX portal_tasks_client_idx ON public.portal_tasks(client_id);
CREATE INDEX portal_tasks_growth_node_idx ON public.portal_tasks(growth_node_id) WHERE growth_node_id IS NOT NULL;
CREATE INDEX portal_tasks_grind_loop_idx ON public.portal_tasks(grind_loop_id) WHERE grind_loop_id IS NOT NULL;
CREATE INDEX portal_tasks_status_idx ON public.portal_tasks(status);

ALTER TABLE public.portal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON public.portal_tasks FOR ALL
  USING (client_id IN (SELECT id FROM public.portal_clients WHERE user_id = auth.uid()));

CREATE TRIGGER portal_tasks_updated_at
  BEFORE UPDATE ON public.portal_tasks
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- 5. portal_connections (Composio integrations)
CREATE TABLE public.portal_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.portal_clients(id) ON DELETE CASCADE,
  growth_node_id UUID REFERENCES public.portal_growth_nodes(id) ON DELETE CASCADE,
  grind_loop_id UUID REFERENCES public.portal_grind_loops(id) ON DELETE CASCADE,
  toolkit TEXT NOT NULL,
  composio_alias TEXT,
  composio_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected',  -- not_connected | pending | active | failed | disconnected
  connected_at TIMESTAMPTZ,
  connected_by UUID,
  disconnected_at TIMESTAMPTZ,
  description TEXT,
  metrics_provided JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connection_parent_check CHECK (
    (growth_node_id IS NOT NULL AND grind_loop_id IS NULL) OR
    (growth_node_id IS NULL AND grind_loop_id IS NOT NULL)
  )
);

CREATE INDEX portal_connections_client_idx ON public.portal_connections(client_id);
CREATE INDEX portal_connections_node_idx ON public.portal_connections(growth_node_id) WHERE growth_node_id IS NOT NULL;
CREATE INDEX portal_connections_loop_idx ON public.portal_connections(grind_loop_id) WHERE grind_loop_id IS NOT NULL;
CREATE INDEX portal_connections_status_idx ON public.portal_connections(status);

ALTER TABLE public.portal_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.portal_connections FOR ALL
  USING (client_id IN (SELECT id FROM public.portal_clients WHERE user_id = auth.uid()));

CREATE TRIGGER portal_connections_updated_at
  BEFORE UPDATE ON public.portal_connections
  FOR EACH ROW EXECUTE FUNCTION public.portal_set_updated_at();


-- 6. portal_activity (log)
CREATE TABLE public.portal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.portal_clients(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.portal_tasks(id) ON DELETE SET NULL,
  actor TEXT NOT NULL DEFAULT 'user',  -- user | portal | system
  action TEXT NOT NULL,    -- task_completed | task_created | metric_updated | alert_fired | note_added
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX portal_activity_client_idx ON public.portal_activity(client_id);
CREATE INDEX portal_activity_created_idx ON public.portal_activity(created_at DESC);

ALTER TABLE public.portal_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
  ON public.portal_activity FOR SELECT
  USING (client_id IN (SELECT id FROM public.portal_clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own activity"
  ON public.portal_activity FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM public.portal_clients WHERE user_id = auth.uid()));


-- 7. agent_conversations
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,  -- zarlo | perry
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


-- 8. agent_tasks
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,  -- zarlo | perry
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | done
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
