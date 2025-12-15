import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Persona stages configuration - MUST match src/lib/personaStages.js
const PERSONA_STAGES = {
  vibe_seeker: {
    stages: ['clarity'],
    initial_stage: 'clarity',
    graduation_requirements: {
      clarity: {
        flows_required: ['nikigai_skills', 'nikigai_problems', 'nikigai_persona', 'nikigai_integration'],
        milestones: ['groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete all 4 Flow Finder flows, and inside a 7-day challenge complete a Groan Challenge and complete at least 1 challenge a day for 7 days'
      }
    }
  },
  vibe_riser: {
    stages: ['validation', 'creation', 'testing', 'launch'],
    initial_stage: 'validation',
    graduation_requirements: {
      validation: {
        flows_required: ['persona_selection'],
        milestones: ['validation_form_sent', 'validation_responses_3', 'groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete persona selection, send validation form, get 3 responses, complete a groan challenge, and complete a 7-day challenge'
      },
      creation: {
        flows_required: ['100m_offer', 'lead_magnet_offer'],
        milestones: ['product_created', 'lead_magnet_created', 'groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete offer flows, create product and lead magnet, complete a groan challenge, and complete a 7-day challenge'
      },
      testing: {
        milestones: ['testing_complete', 'feedback_responses_3', 'improvements_identified', 'groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete testing, get 3 feedback responses, identify improvements, complete a groan challenge, and complete a 7-day challenge'
      },
      launch: {
        flows_required: ['100m_leads'],
        milestones: ['strategy_identified', 'funnel_stages_defined', 'groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete leads flow, define strategy and funnel, complete a groan challenge, and complete a 7-day challenge'
      }
    }
  },
  movement_maker: {
    stages: ['ideation', 'creation', 'launch'],
    initial_stage: 'ideation',
    graduation_requirements: {
      ideation: {
        milestones: ['read_putting_it_together', 'decide_acquisition', 'decide_upsell', 'decide_downsell', 'decide_continuity', 'groan_challenge_completed'],
        flows_required: ['attraction_offer', 'upsell_flow', 'downsell_flow', 'continuity_flow'],
        challenge_streak: 7,
        description: 'Read overview, complete all 4 money model flows, decide on each offer type, complete a groan challenge, and complete a 7-day challenge'
      },
      creation: {
        milestones: ['create_acquisition_offer', 'create_upsell_offer', 'create_downsell_offer', 'create_continuity_offer', 'groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Create all 4 offer types, complete a groan challenge, and complete a 7-day challenge: Acquisition, Upsell, Downsell, Continuity'
      },
      launch: {
        flows_required: ['100m_leads'],
        milestones: ['strategy_identified', 'funnel_stages_defined', 'groan_challenge_completed'],
        challenge_streak: 7,
        description: 'Complete leads flow, define strategy and funnel, complete a groan challenge, and complete a 7-day challenge'
      }
    }
  }
}

// Helper: Check if flows are completed
async function checkFlowsCompleted(supabase: any, userId: string, flowsRequired: string[] = []) {
  if (!flowsRequired || flowsRequired.length === 0) return true

  const { data: completedSessions } = await supabase
    .from('flow_sessions')
    .select('flow_type, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('flow_type', flowsRequired)

  const completedFlowTypes = new Set(completedSessions?.map((s: any) => s.flow_type) || [])
  return flowsRequired.every(flow => completedFlowTypes.has(flow))
}

// Helper: Check if milestones are completed (combines milestones and milestones_additional)
// Now persona-aware to prevent cross-persona milestone contamination
// Groan Challenge must be completed within the current 7-day challenge
async function checkMilestones(supabase: any, userId: string, persona: string, milestonesRequired: string[] = [], milestonesAdditional: string[] = []) {
  const allMilestones = [...milestonesRequired, ...milestonesAdditional]
  if (!allMilestones || allMilestones.length === 0) return true

  // Get active challenge start date for groan_challenge check
  const { data: activeChallenge } = await supabase
    .from('challenge_progress')
    .select('challenge_start_date')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('challenge_start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const challengeStartDate = activeChallenge?.challenge_start_date

  // Get all completed milestones for this persona
  const { data: completedMilestones } = await supabase
    .from('milestone_completions')
    .select('milestone_id, created_at')
    .eq('user_id', userId)
    .eq('persona', persona)
    .in('milestone_id', allMilestones)

  // Check each required milestone
  return allMilestones.every(milestone => {
    const completion = completedMilestones?.find((m: any) => m.milestone_id === milestone)
    if (!completion) return false

    // Groan Challenge must be completed within the current 7-day challenge
    if (milestone === 'groan_challenge_completed' && challengeStartDate) {
      const completedAt = new Date(completion.created_at)
      const challengeStart = new Date(challengeStartDate)
      if (completedAt < challengeStart) {
        console.log('⚠️ Groan challenge was completed before current challenge started')
        return false
      }
    }

    return true
  })
}

// Helper: Check if streak requirement is met
// Uses longest_streak from the ACTIVE challenge (matches client-side graduationChecker.js)
async function checkStreak(supabase: any, userId: string, streakRequired: number | undefined) {
  if (!streakRequired) return true

  // Get the active challenge for this user (corresponds to current persona/stage)
  const { data: activeChallenge } = await supabase
    .from('challenge_progress')
    .select('longest_streak')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('challenge_start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Use longest_streak (max ever achieved in this challenge), not current streak_days
  return (activeChallenge?.longest_streak || 0) >= streakRequired
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
      milestones_met: await checkMilestones(supabaseClient, user_id, persona, requirements.milestones, requirements.milestones_additional),
      streak_met: await checkStreak(supabaseClient, user_id, requirements.challenge_streak)
    }

    const eligible = Object.values(checks).every(check => check === true)
    const next_stage = getNextStage(persona, current_stage)

    // If auto_graduate flag is set and user is eligible, perform graduation
    if (auto_graduate && eligible) {
      // Special case: Vibe Seeker graduating from Clarity becomes Vibe Riser
      if (persona === 'vibe_seeker' && current_stage === 'clarity' && !next_stage) {
        // Record graduation from Vibe Seeker
        await supabaseClient.from('stage_graduations').insert({
          user_id,
          persona: 'vibe_seeker',
          from_stage: 'clarity',
          to_stage: null,
          graduation_reason: checks
        })

        // Update persona in profiles
        await supabaseClient
          .from('profiles')
          .update({ persona: 'vibe_riser' })
          .eq('id', user_id)

        // Update to Vibe Riser Validation stage
        await supabaseClient
          .from('user_stage_progress')
          .update({
            persona: 'vibe_riser',
            current_stage: 'validation',
            stage_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        return new Response(
          JSON.stringify({
            eligible: true,
            graduated: true,
            persona_switched: true,
            checks,
            current_stage: 'clarity',
            new_persona: 'vibe_riser',
            new_stage: 'validation',
            requirements
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Normal graduation (non-Vibe Seeker)
      if (next_stage) {
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
