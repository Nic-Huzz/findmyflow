-- Migrate product-design quests to coding (closest match after merge)
UPDATE quests
SET skill_node_id = 'exp-coding'
WHERE skill_node_id = 'exp-product-design';

-- Historical challenges keep their source_value for analytics
-- No change to groan_challenges.source_value
