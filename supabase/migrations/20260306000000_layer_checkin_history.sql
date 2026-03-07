CREATE TABLE priority_layer_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  layer_asked TEXT NOT NULL,
  answer BOOLEAN NOT NULL,
  previous_layer TEXT,
  new_layer TEXT,
  layer_changed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE priority_layer_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checkins"
  ON priority_layer_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins"
  ON priority_layer_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
