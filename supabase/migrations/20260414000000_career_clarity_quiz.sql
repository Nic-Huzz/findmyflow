-- Career Clarity Quiz tables
-- Determines whether user should find a different job or build their own thing

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  need_answers JSONB NOT NULL,
  structural_answers JSONB NOT NULL,
  path_result TEXT NOT NULL,
  unmet_needs JSONB,
  accomplish_score INTEGER,
  employment_score INTEGER
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert and read their own
CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Also allow anonymous inserts (quiz can be taken before login)
CREATE POLICY "Allow anonymous inserts" ON quiz_results
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE TABLE IF NOT EXISTS email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  quiz_result_id UUID REFERENCES quiz_results(id),
  source TEXT DEFAULT 'career-clarity-quiz'
);

ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous email captures" ON email_captures
  FOR INSERT WITH CHECK (true);
