-- Voice Smart Bridge Migration
-- Adds corrections + voice_influences to voice_profiles
-- Migrates voice_taste_config seed data
-- Updates trigger to write to voice_profiles
-- Drops voice_taste_config

-- 1. Add new columns to voice_profiles
ALTER TABLE voice_profiles
  ADD COLUMN IF NOT EXISTS corrections JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS voice_influences JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS audience_description TEXT,
  ADD COLUMN IF NOT EXISTS unique_approach TEXT;

-- 2. Migrate voice_taste_config seed data into the admin user's voice profile
-- Move on_brand_words → detected_patterns.voice_dos
-- Move off_brand_words → detected_patterns.voice_donts
-- Move corrections → corrections column
DO $$
DECLARE
  admin_uid UUID;
  vtc_record RECORD;
BEGIN
  -- Get admin user ID
  SELECT user_id INTO admin_uid FROM admin_users WHERE role = 'admin' LIMIT 1;

  -- Get voice_taste_config data (guarded against missing table)
  BEGIN
    SELECT * INTO vtc_record FROM voice_taste_config WHERE owner_id IS NULL LIMIT 1;
  EXCEPTION WHEN undefined_table THEN
    vtc_record := NULL;
  END;

  IF vtc_record IS NOT NULL AND admin_uid IS NOT NULL THEN
    -- Ensure voice profile exists for admin
    INSERT INTO voice_profiles (user_id, voice_name)
    VALUES (admin_uid, 'My Voice')
    ON CONFLICT (user_id) DO NOTHING;

    -- Merge on_brand_words into detected_patterns.voice_dos
    -- Merge off_brand_words into detected_patterns.voice_donts
    UPDATE voice_profiles
    SET
      detected_patterns = jsonb_set(
        jsonb_set(
          COALESCE(detected_patterns, '{}'::jsonb),
          '{voice_dos}',
          COALESCE(
            (SELECT jsonb_agg(w) FROM unnest(vtc_record.on_brand_words) AS w),
            '[]'::jsonb
          )
        ),
        '{voice_donts}',
        COALESCE(
          (SELECT jsonb_agg(w) FROM unnest(vtc_record.off_brand_words) AS w),
          '[]'::jsonb
        )
      ),
      corrections = COALESCE(vtc_record.corrections, '[]'::jsonb),
      updated_at = now()
    WHERE user_id = admin_uid;
  END IF;
END $$;

-- 3. Update the trigger function to write to voice_profiles instead of voice_taste_config
CREATE OR REPLACE FUNCTION append_voice_correction()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uid UUID;
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_text IS NOT NULL AND OLD.status != 'resolved' THEN
    SELECT user_id INTO admin_uid FROM admin_users WHERE role = 'admin' LIMIT 1;
    IF admin_uid IS NULL THEN
      RAISE WARNING 'append_voice_correction: no admin user found — correction not saved';
      RETURN NEW;
    END IF;

    UPDATE voice_profiles
    SET corrections = COALESCE(corrections, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'original', NEW.highlighted_text,
      'corrected', NEW.resolved_text,
      'rule_learned', COALESCE(NEW.comment, NEW.quick_reaction),
      'category', NEW.category,
      'created_at', now()::text
    )),
    updated_at = now()
    WHERE user_id = admin_uid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger (to ensure it uses the updated function)
DROP TRIGGER IF EXISTS trg_content_comment_resolved ON content_comments;
CREATE TRIGGER trg_content_comment_resolved
  AFTER UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION append_voice_correction();

-- 5. Drop voice_taste_config and its policies
DROP POLICY IF EXISTS "Admins can read voice_taste_config" ON voice_taste_config;
DROP POLICY IF EXISTS "Admins can update voice_taste_config" ON voice_taste_config;
DROP POLICY IF EXISTS "Admins can insert voice_taste_config" ON voice_taste_config;
DROP TABLE IF EXISTS voice_taste_config;
