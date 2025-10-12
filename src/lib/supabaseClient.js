import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qlwfcfypnoptsocdpxuv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Qizrwuj2oqRtuK2tJx7uxg_M7Bb9WZH'

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Please create a .env.local file with:')
  console.warn('VITE_SUPABASE_URL=https://qlwfcfypnoptsocdpxuv.supabase.co')
  console.warn('VITE_SUPABASE_ANON_KEY=sb_publishable_Qizrwuj2oqRtuK2tJx7uxg_M7Bb9WZH')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Debug Supabase connection
console.log('🔧 Supabase client initialized:', !!supabase)
console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔧 Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')
