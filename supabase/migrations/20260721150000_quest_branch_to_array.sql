-- Convert quests.branch from text to text[] to support multiple branch tags
ALTER TABLE quests ALTER COLUMN branch TYPE text[] USING CASE WHEN branch IS NOT NULL THEN ARRAY[branch] ELSE NULL END;
