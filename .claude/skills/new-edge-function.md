---
description: Create a new Supabase Edge Function
agent: Explore
context: fork
---
# Create Supabase Edge Function

You are creating a new Edge Function for FindMyFlow's Supabase backend.

## Steps

1. **Understand existing patterns** - Read an existing function:
   - `supabase/functions/nikigai-conversation/index.ts` - AI conversation pattern
   - `supabase/functions/graduation-check/index.ts` - database query pattern
   - `supabase/functions/scheduled-notifications/index.ts` - cron job pattern

2. **Gather requirements** - Ask user for:
   - Function name (kebab-case)
   - Purpose/what it does
   - Input parameters expected
   - Whether it needs: Supabase client, Anthropic API, external APIs
   - Authentication requirements

3. **Create function directory**: `supabase/functions/<function-name>/`

4. **Create index.ts** with standard structure:
   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }

   serve(async (req) => {
     // Handle CORS preflight
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders })
     }

     try {
       // Get auth header for user context
       const authHeader = req.headers.get('Authorization')

       // Initialize Supabase client
       const supabase = createClient(
         Deno.env.get('SUPABASE_URL') ?? '',
         Deno.env.get('SUPABASE_ANON_KEY') ?? '',
         { global: { headers: { Authorization: authHeader ?? '' } } }
       )

       // Parse request body
       const { param1, param2 } = await req.json()

       // Your logic here

       return new Response(
         JSON.stringify({ success: true, data: result }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     } catch (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       )
     }
   })
   ```

5. **If using Anthropic API**, add the pattern from `nikigai-conversation`

6. **Update deploy script** if needed: `scripts/deploy-functions.sh`

7. **Remind user** about deployment:
   - Local testing: `supabase functions serve <function-name>`
   - Deploy: `supabase functions deploy <function-name>`
   - Set secrets: `supabase secrets set KEY=value`

## Output
Show complete function code and deployment instructions.
