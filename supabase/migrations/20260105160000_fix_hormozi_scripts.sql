-- Fix Hormozi Scripts Migration
-- Adds is_active column if missing and recreates RLS policies

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_scripts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE sales_scripts ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "Scripts are viewable by all authenticated users" ON sales_scripts;

-- Recreate the policy now that is_active exists
CREATE POLICY "Scripts are viewable by all authenticated users"
  ON sales_scripts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Make sure all existing scripts are active
UPDATE sales_scripts SET is_active = true WHERE is_active IS NULL;
