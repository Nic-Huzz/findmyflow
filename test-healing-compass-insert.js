// Test script to insert data into healing_compass_responses table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qlwfcfypnoptsocdpxuv.supabase.co'
const supabaseKey = 'sb_publishable_Qizrwuj2oqRtuK2tJx7uxg_M7Bb9WZH'

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


