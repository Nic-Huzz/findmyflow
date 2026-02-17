-- Add future_text column for step 9 "What does life look like?" response
ALTER TABLE healing_compass_responses
  ADD COLUMN IF NOT EXISTS future_text TEXT;
