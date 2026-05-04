-- Details tab fields (persistent between runs)
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS one_line_promise TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS description TEXT;

-- Value stack pricing (Hormozi method)
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS value_stack JSONB;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS early_bird_price NUMERIC(10,2);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS standard_price NUMERIC(10,2);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS pricing_percentage NUMERIC(4,1);
