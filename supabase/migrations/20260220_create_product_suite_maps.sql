-- Product Suite Maps: stores user's visual money model chain
CREATE TABLE IF NOT EXISTS product_suite_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE product_suite_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own map"
  ON product_suite_maps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own map"
  ON product_suite_maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own map"
  ON product_suite_maps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own map"
  ON product_suite_maps FOR DELETE
  USING (auth.uid() = user_id);
