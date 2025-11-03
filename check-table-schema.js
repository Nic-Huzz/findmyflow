// Check the actual schema of healing_compass_responses table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qlwfcfypnoptsocdpxuv.supabase.co'
const supabaseKey = 'sb_publishable_Qizrwuj2oqRtuK2tJx7uxg_M7Bb9WZH'

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


