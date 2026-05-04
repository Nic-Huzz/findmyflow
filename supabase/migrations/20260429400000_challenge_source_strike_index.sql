-- Update partial index to include 'strike' challenge source for Lightning Strikes
DROP INDEX IF EXISTS idx_groan_challenges_source;
CREATE INDEX idx_groan_challenges_source
  ON groan_challenges(user_id, challenge_source)
  WHERE challenge_source IN ('checklist', 'intention', 'strike');
