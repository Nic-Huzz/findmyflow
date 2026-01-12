---
description: Create a new Supabase database migration file
---
# Create Supabase Migration

You are creating a new database migration for FindMyFlow's Supabase backend.

## Steps

1. **Get migration details** - Ask the user for:
   - Migration name (snake_case, descriptive)
   - What tables/columns to create or modify
   - Any foreign key relationships
   - RLS (Row Level Security) policies needed

2. **Generate filename** - Use format: `YYYYMMDDHHMMSS_<name>.sql`
   - Use current date/time
   - Example: `20260108150000_add_content_queue.sql`

3. **Create migration file** in `supabase/migrations/` with:
   - Clear comments explaining the migration
   - CREATE TABLE or ALTER TABLE statements
   - Appropriate column types (uuid, text, jsonb, timestamptz, etc.)
   - Primary keys, foreign keys, indexes
   - RLS policies (enable RLS, create policies for authenticated users)
   - Default values where appropriate (e.g., `now()` for timestamps)

4. **Common patterns in this project**:
   ```sql
   -- Standard user-owned table
   CREATE TABLE table_name (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );

   -- Enable RLS
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

   -- Standard policy
   CREATE POLICY "Users can manage own data" ON table_name
     FOR ALL USING (auth.uid() = user_id);
   ```

5. **Remind user** to run `npm run db:push` or apply via Supabase dashboard.

## Output
Show the full migration file content and remind about deployment.
