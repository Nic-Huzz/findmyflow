-- Pending subscriptions: holds Stripe payments for users who haven't signed up yet.
-- When a user signs up or logs in, we check this table and promote to user_subscriptions.
CREATE TABLE IF NOT EXISTS pending_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'creator',
  status TEXT NOT NULL DEFAULT 'active',
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service role only (webhook writes, edge function claims)
ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON pending_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Targeted email lookup for webhook user matching (avoids listUsers pagination cap)
CREATE OR REPLACE FUNCTION get_user_id_by_email(lookup_email TEXT)
RETURNS TABLE(id UUID) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM auth.users WHERE email = lookup_email LIMIT 1;
$$;
