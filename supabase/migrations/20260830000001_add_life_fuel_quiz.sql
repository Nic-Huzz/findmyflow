-- Add life_fuel_quiz column to user_stage_progress
-- Stores aliveness quiz results claimed from public_leads on first login
-- JSONB with keys: choice, connection, mastery, meaning (scores 0-3), verdict
ALTER TABLE user_stage_progress
  ADD COLUMN IF NOT EXISTS life_fuel_quiz jsonb;
