// Test script to check if healing_compass_responses table exists and is accessible
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

async function testTable() {
  console.log('🔍 Testing healing_compass_responses table...')
  
  try {
    // Test if table exists by trying to select from it
    const { data, error } = await supabase
      .from('healing_compass_responses')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Table error:', error)
      console.log('💡 This might mean the table doesn\'t exist or has permission issues')
    } else {
      console.log('✅ Table exists and is accessible')
      console.log('📊 Sample data:', data)
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
  }
}

testTable()


