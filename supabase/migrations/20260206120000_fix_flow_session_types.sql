-- Fix flow_type values to match stageConfig.requiredFlows
-- Only updates the 4 MoneyModel configs that had mismatched flowType values
UPDATE flow_sessions SET flow_type = 'upsell_offer' WHERE flow_type = 'upsell_flow';
UPDATE flow_sessions SET flow_type = 'downsell_offer' WHERE flow_type = 'downsell_flow';
UPDATE flow_sessions SET flow_type = 'continuity_offer' WHERE flow_type = 'continuity_flow';
UPDATE flow_sessions SET flow_type = 'leads_strategy' WHERE flow_type = '100m_leads';
