// Test script to check if healing_compass_responses table exists and is accessible
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qlwfcfypnoptsocdpxuv.supabase.co'
const supabaseKey = 'sb_publishable_Qizrwuj2oqRtuK2tJx7uxg_M7Bb9WZH'

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


