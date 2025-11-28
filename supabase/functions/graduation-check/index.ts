import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Persona stages configuration
const PERSONA_STAGES = {
  vibe_seeker: {
    stages: ['validation', 'creation', 'testing'],
    graduation_requirements: {
      validation: {
        flows_required: ['nikigai'],
        conversations_required: 3,
        description: 'Complete Nikigai + talk to 3 people about your idea'
      },
      creation: {
        milestones: ['product_created'],
        description: 'Create your first product/offering'
      },
      testing: {
        milestones: ['tested_with_3'],
        description: 'Test your product with 3 people'
      }
    }
  },
  vibe_riser: {
    stages: ['validation', 'creation', 'testing', 'scale'],
    graduation_requirements: {
      validation: {
        flows_required: ['100m_offer'],
        conversations_required: 3,
        description: 'Complete $100M Offer flow + talk to 3 people'
      },
      creation: {
        milestones: ['offer_created'],
        description: 'Create your offer'
      },
      testing: {
        milestones: ['offer_tested_with_3'],
        description: 'Test offer with 3 people'
      },
      scale: {
        flows_required: ['100m_leads'],
        challenge_streak: 7,
        description: 'Complete $100M Leads + 7-day challenge streak'
      }
    }
  },
  movement_maker: {
    stages: ['validation', 'creation', 'testing', 'scale'],
    graduation_requirements: {
      validation: {
        flows_required: ['100m_money_model'],
        conversations_required: 3,
        description: 'Complete $100M Money Model + talk to 3 people'
      },
      creation: {
        milestones: ['model_built'],
        description: 'Build your money model'
      },
      testing: {
        milestones: ['model_tested_with_3'],
        description: 'Test model with 3 people'
      },
      scale: {
        flows_required: ['100m_leads'],
        milestones: ['acquisition_offer_launched'],
        description: 'Complete $100M Leads + launch acquisition offer'
      }
    }
  }
}

// Helper: Check if flows are completed
async function checkFlowsCompleted(supabase: any, userId: string, flowsRequired: string[] = []) {
  if (!flowsRequired || flowsRequired.length === 0) return true

  const { data: completedFlows } = await supabase
    .from('nikigai_responses')
    .select('flow_type')
    .eq('user_id', userId)
    .in('flow_type', flowsRequired)

  const completedFlowTypes = new Set(completedFlows?.map((f: any) => f.flow_type) || [])
  return flowsRequired.every(flow => completedFlowTypes.has(flow))
}

// Helper: Check if milestones are completed
async function checkMilestones(supabase: any, userId: string, milestonesRequired: string[] = []) {
  if (!milestonesRequired || milestonesRequired.length === 0) return true

  const { data: completedMilestones } = await supabase
    .from('milestone_completions')
    .select('milestone_id')
    .eq('user_id', userId)
    .in('milestone_id', milestonesRequired)

  const completedMilestoneIds = new Set(completedMilestones?.map((m: any) => m.milestone_id) || [])
  return milestonesRequired.every(milestone => completedMilestoneIds.has(milestone))
}

// Helper: Check if streak requirement is met
async function checkStreak(supabase: any, userId: string, streakRequired: number | undefined) {
  if (!streakRequired) return true

  const { data: challengeProgress } = await supabase
    .from('challenge_progress')
    .select('streak_days')
    .eq('user_id', userId)
    .order('streak_days', { ascending: false })
    .limit(1)
    .single()

  return (challengeProgress?.streak_days || 0) >= streakRequired
}

// Helper: Get next stage
function getNextStage(persona: string, currentStage: string) {
  const personaData = PERSONA_STAGES[persona as keyof typeof PERSONA_STAGES]
  if (!personaData) return null

  const currentIndex = personaData.stages.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === personaData.stages.length - 1) {
    return null
  }

  return personaData.stages[currentIndex + 1]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, auto_graduate } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's current stage progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('user_stage_progress')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (progressError || !progress) {
      return new Response(
        JSON.stringify({
          eligible: false,
          error: 'No stage progress found for user',
          checks: {},
          next_stage: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { persona, current_stage, conversations_logged } = progress

    // Get requirements for current stage
    const personaData = PERSONA_STAGES[persona as keyof typeof PERSONA_STAGES]
    if (!personaData) {
      return new Response(
        JSON.stringify({
          eligible: false,
          error: 'Invalid persona',
          checks: {},
          next_stage: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requirements = personaData.graduation_requirements[current_stage as keyof typeof personaData.graduation_requirements]
    if (!requirements) {
      return new Response(
        JSON.stringify({
          eligible: false,
          error: 'Invalid stage',
          checks: {},
          next_stage: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check all requirements
    const checks = {
      flows_completed: await checkFlowsCompleted(supabaseClient, user_id, requirements.flows_required),
      conversations_logged: conversations_logged >= (requirements.conversations_required || 0),
      milestones_met: await checkMilestones(supabaseClient, user_id, requirements.milestones),
      streak_met: await checkStreak(supabaseClient, user_id, requirements.challenge_streak)
    }

    const eligible = Object.values(checks).every(check => check === true)
    const next_stage = getNextStage(persona, current_stage)

    // If auto_graduate flag is set and user is eligible, perform graduation
    if (auto_graduate && eligible && next_stage) {
      // Record graduation
      await supabaseClient.from('stage_graduations').insert({
        user_id,
        persona,
        from_stage: current_stage,
        to_stage: next_stage,
        graduation_reason: checks
      })

      // Update current stage
      await supabaseClient
        .from('user_stage_progress')
        .update({
          current_stage: next_stage,
          stage_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)

      return new Response(
        JSON.stringify({
          eligible: true,
          graduated: true,
          checks,
          current_stage,
          new_stage: next_stage,
          requirements
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Otherwise, just return eligibility status
    return new Response(
      JSON.stringify({
        eligible,
        graduated: false,
        checks,
        current_stage,
        next_stage,
        requirements,
        persona
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in graduation-check:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        eligible: false,
        checks: {},
        next_stage: null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
