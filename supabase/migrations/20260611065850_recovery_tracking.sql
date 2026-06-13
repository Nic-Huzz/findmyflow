-- Recovery tracking for drains/stalls (Flow Game T0)
-- Captures time-to-recovery after a stressor: "how fast you return to
-- baseline after a hit, not how calm you are when nothing's wrong."

ALTER TABLE nervous_system_checkins
ADD COLUMN IF NOT EXISTS recovered_at timestamptz,
ADD COLUMN IF NOT EXISTS recovery_activities text[];

-- Index for querying unrecovered checkins
CREATE INDEX IF NOT EXISTS idx_nsc_unrecovered
ON nervous_system_checkins (user_id, checkin_type, recovered_at)
WHERE recovered_at IS NULL AND checkin_type IN ('drain', 'stall');

-- The table only has INSERT + SELECT policies
-- (see 20260429200000_nervous_system_checkins.sql). Recovery is the first
-- client-side UPDATE on this table. Without this policy the update
-- silently affects 0 rows and no error is returned.
CREATE POLICY "Users can update own checkins"
  ON nervous_system_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
