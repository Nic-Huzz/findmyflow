// Script to update the healing_compass_responses table schema
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please create .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateSchema() {
  console.log('🔧 Updating healing_compass_responses table schema...')
  
  const sqlCommands = [
    // Drop existing table if it exists
    'DROP TABLE IF EXISTS healing_compass_responses CASCADE;',
    
    // Create new table with correct schema
    `CREATE TABLE healing_compass_responses (
      id SERIAL PRIMARY KEY,
      user_name TEXT,
      stuck_gap_description TEXT,
      stuck_reason TEXT,
      stuck_emotional_response TEXT,
      past_parallel_story TEXT,
      past_event_emotions TEXT,
      splinter_interpretation TEXT,
      connect_dots_consent TEXT,
      connect_dots_acknowledged TEXT,
      splinter_removal_consent TEXT,
      context JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Add RLS
    'ALTER TABLE healing_compass_responses ENABLE ROW LEVEL SECURITY;',
    
    // Add policies
    'CREATE POLICY "Allow anonymous inserts" ON healing_compass_responses FOR INSERT WITH CHECK (true);',
    'CREATE POLICY "Users can read own data" ON healing_compass_responses FOR SELECT USING (auth.uid() IS NOT NULL);'
  ]
  
  try {
    for (const sql of sqlCommands) {
      console.log(`🔧 Executing: ${sql.substring(0, 50)}...`)
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error('❌ SQL error:', error)
      } else {
        console.log('✅ SQL executed successfully')
      }
    }
  } catch (err) {
    console.error('❌ Schema update error:', err)
    console.log('💡 You may need to run the SQL manually in the Supabase dashboard')
  }
}

updateSchema()


