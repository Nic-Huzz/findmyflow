-- Add AI monopoly statement to lead_flow_profiles
-- Sprint 3: AI-generated positioning insight replacing template "Your opportunity" text
ALTER TABLE lead_flow_profiles ADD COLUMN IF NOT EXISTS ai_monopoly_statement TEXT;
