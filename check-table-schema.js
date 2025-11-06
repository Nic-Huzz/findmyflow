// Check the actual schema of healing_compass_responses table
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

async function checkSchema() {
  console.log('🔍 Checking healing_compass_responses table schema...')
  
  try {
    // Try to get table info by attempting a simple select
    const { data, error } = await supabase
      .from('healing_compass_responses')
      .select('*')
      .limit(0)
    
    if (error) {
      console.error('❌ Schema check error:', error)
    } else {
      console.log('✅ Table accessible')
    }
  } catch (err) {
    console.error('❌ Schema check error:', err)
  }
}

checkSchema()


