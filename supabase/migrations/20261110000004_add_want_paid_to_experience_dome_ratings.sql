-- Already applied to prod via MCP on 2026-11-10. This file exists for migration tracking.
ALTER TABLE experience_dome_ratings ADD COLUMN IF NOT EXISTS want_paid boolean DEFAULT false;
