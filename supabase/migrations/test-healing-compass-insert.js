// Test script to insert data into healing_compass_responses table
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

async function testInsert() {
  console.log('🔍 Testing insert into healing_compass_responses table...')
  
  const testData = {
    user_name: 'Test User',
    stuck_gap_description: 'Test stuck gap description',
    stuck_reason: 'Test stuck reason',
    stuck_emotional_response: 'Shame',
    past_parallel_story: 'Test past parallel story',
    past_event_emotions: 'Test past event emotions',
    splinter_interpretation: 'Test splinter interpretation',
    connect_dots_consent: 'yes',
    connect_dots_acknowledged: 'yes',
    splinter_removal_consent: 'yes',
    context: { test: 'context' }
  }
  
  try {
    const { data, error } = await supabase
      .from('healing_compass_responses')
      .insert([testData])
    
    if (error) {
      console.error('❌ Insert error:', error)
    } else {
      console.log('✅ Data inserted successfully:', data)
    }
  } catch (err) {
    console.error('❌ Insert error:', err)
  }
}

testInsert()


