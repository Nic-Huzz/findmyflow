import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ❌ Missing Supabase environment variables!

    Please create a .env.local file in the project root with:

    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

    See VERCEL_ENV_VARIABLE_SETUP.md for more details.
  `
  console.error(errorMessage)
  throw new Error('Missing required Supabase environment variables. Check console for details.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Debug Supabase connection (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase client initialized successfully')
  console.log('🔧 Supabase URL:', supabaseUrl)
  console.log('🔧 Supabase Key:', supabaseAnonKey ? 'Present ✓' : 'Missing ✗')
}
