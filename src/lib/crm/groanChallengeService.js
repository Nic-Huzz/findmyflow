/**
 * Groan Challenge Service
 * Handles CRUD operations for the Groan Matrix system
 *
 * Features:
 * - Challenge generation and management
 * - Proof collection (links, screenshots, text)
 * - Contract evidence tracking
 * - Streak management
 * - Outcome tracking (48hr follow-up)
 * - User preferences
 */
import { supabase } from '../supabaseClient'
import {
  GROAN_VISIBILITY_LAYERS,
  GROAN_SOURCE_TYPES,
  GROAN_CHALLENGE_STATUS,
  calculateEssenceZone,
  getStreakBadge
} from '../stageConfig'

// =============================================================================
// CHALLENGE CRUD
// =============================================================================

/**
 * Fetch all challenges for a user
 * @param {string} userId
 * @param {object} options - Filter options
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function fetchGroanChallenges(userId, options = {}) {
  const {
    status = null,
    visibilityLayer = null,
    sourceType = null,
    limit = 50
  } = options

  let query = supabase
    .from('groan_challenges')
    .select(`
      *,
      groan_proof(count),
      groan_contract_evidence(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }
  if (visibilityLayer) {
    query = query.eq('visibility_layer', visibilityLayer)
  }
  if (sourceType) {
    query = query.eq('source_type', sourceType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching groan challenges:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch a single challenge by ID
 */
export async function fetchGroanChallenge(challengeId) {
  const { data, error } = await supabase
    .from('groan_challenges')
    .select(`
      *,
      groan_proof(*),
      groan_contract_evidence(*),
      groan_outcomes(*)
    `)
    .eq('id', challengeId)
    .single()

  if (error) {
    console.error('Error fetching groan challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Create a new groan challenge (usually from AI generation)
 * @param {object} challengeData
 * @returns {Promise<{data: object, error: Error}>}
 */
export async function createGroanChallenge(challengeData) {
  const {
    userId,
    title,
    description,
    visibilityLayer,
    sourceType,
    sourceId = null,
    sourceLabel = null,
    scaryScore = 5,
    wahooScore = 5,
    linkedContractId = null,
    generationPrompt = null
  } = challengeData

  // Calculate essence zone
  const essenceZone = calculateEssenceZone(scaryScore, wahooScore)

  const { data, error } = await supabase
    .from('groan_challenges')
    .insert({
      user_id: userId,
      title,
      description,
      visibility_layer: visibilityLayer,
      source_type: sourceType,
      source_id: sourceId,
      source_label: sourceLabel,
      scary_score: scaryScore,
      wahoo_score: wahooScore,
      essence_zone: essenceZone.zone,
      essence_insight: essenceZone.insight,
      linked_contract_id: linkedContractId,
      generation_prompt: generationPrompt,
      status: GROAN_CHALLENGE_STATUS.GENERATED
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating groan challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Accept a challenge (user commits to doing it)
 */
export async function acceptGroanChallenge(challengeId) {
  const { data, error } = await supabase
    .from('groan_challenges')
    .update({
      status: GROAN_CHALLENGE_STATUS.ACCEPTED,
      accepted_at: new Date().toISOString()
    })
    .eq('id', challengeId)
    .select()
    .single()

  if (error) {
    console.error('Error accepting challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Complete a challenge with reflection data
 */
export async function completeGroanChallenge(challengeId, completionData) {
  const {
    reflectionText = null,
    scaryScoreAfter = null,
    wahooScoreAfter = null
  } = completionData

  const { data, error } = await supabase
    .from('groan_challenges')
    .update({
      status: GROAN_CHALLENGE_STATUS.COMPLETED,
      completed_at: new Date().toISOString(),
      reflection_text: reflectionText,
      scary_score_after: scaryScoreAfter,
      wahoo_score_after: wahooScoreAfter
    })
    .eq('id', challengeId)
    .select()
    .single()

  if (error) {
    console.error('Error completing challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Skip a challenge with feedback for protective pattern detection
 */
export async function skipGroanChallenge(challengeId, skipData) {
  const {
    skipReason,
    skipFeedback = null
  } = skipData

  const { data, error } = await supabase
    .from('groan_challenges')
    .update({
      status: GROAN_CHALLENGE_STATUS.SKIPPED,
      skipped_at: new Date().toISOString(),
      skip_reason: skipReason,
      skip_feedback: skipFeedback
    })
    .eq('id', challengeId)
    .select()
    .single()

  if (error) {
    console.error('Error skipping challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Update scary/wahoo scores (pre-completion rating)
 */
export async function updateChallengeScores(challengeId, scores) {
  const { scaryScore, wahooScore } = scores

  // Recalculate essence zone
  const essenceZone = calculateEssenceZone(scaryScore, wahooScore)

  const { data, error } = await supabase
    .from('groan_challenges')
    .update({
      scary_score: scaryScore,
      wahoo_score: wahooScore,
      essence_zone: essenceZone.zone,
      essence_insight: essenceZone.insight
    })
    .eq('id', challengeId)
    .select()
    .single()

  if (error) {
    console.error('Error updating challenge scores:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// =============================================================================
// PROOF COLLECTION
// =============================================================================

/**
 * Add proof to a completed challenge
 */
export async function addGroanProof(proofData) {
  const {
    challengeId,
    userId,
    proofType, // 'link', 'screenshot', 'text'
    proofUrl = null,
    proofText = null,
    revenueAmount = null,
    revenueCurrency = 'USD'
  } = proofData

  const { data, error } = await supabase
    .from('groan_proof')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      proof_type: proofType,
      proof_url: proofUrl,
      proof_text: proofText,
      revenue_amount: revenueAmount,
      revenue_currency: revenueCurrency
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding proof:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch all proof for a challenge
 */
export async function fetchGroanProof(challengeId) {
  const { data, error } = await supabase
    .from('groan_proof')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching proof:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Delete proof
 */
export async function deleteGroanProof(proofId) {
  const { error } = await supabase
    .from('groan_proof')
    .delete()
    .eq('id', proofId)

  if (error) {
    console.error('Error deleting proof:', error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

/**
 * Upload screenshot to storage and add as proof
 */
export async function uploadProofScreenshot(challengeId, userId, file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${challengeId}/${Date.now()}.${fileExt}`

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('groan-proof')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Error uploading screenshot:', uploadError)
    return { data: null, error: uploadError }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('groan-proof')
    .getPublicUrl(fileName)

  // Add as proof
  return addGroanProof({
    challengeId,
    userId,
    proofType: 'screenshot',
    proofUrl: publicUrl
  })
}

// =============================================================================
// CONTRACT EVIDENCE (NS Limiting Beliefs)
// =============================================================================

/**
 * Add evidence that disproves a limiting belief
 */
export async function addContractEvidence(evidenceData) {
  const {
    challengeId,
    userId,
    contractId, // ID of the nervous_system_responses entry
    beliefText,
    evidenceText,
    disproves = true
  } = evidenceData

  const { data, error } = await supabase
    .from('groan_contract_evidence')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      contract_id: contractId,
      belief_text: beliefText,
      evidence_text: evidenceText,
      disproves
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding contract evidence:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch evidence for a specific contract/belief
 */
export async function fetchContractEvidence(userId, contractId = null) {
  let query = supabase
    .from('groan_contract_evidence')
    .select(`
      *,
      groan_challenges(title, visibility_layer)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (contractId) {
    query = query.eq('contract_id', contractId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching contract evidence:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get contract progress view data
 */
export async function getContractProgress(userId) {
  const { data, error } = await supabase
    .from('groan_contract_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching contract progress:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// =============================================================================
// OUTCOMES (48hr Follow-up)
// =============================================================================

/**
 * Record an outcome from a completed challenge
 */
export async function recordGroanOutcome(outcomeData) {
  const {
    challengeId,
    userId,
    outcomeType, // 'lead', 'sale', 'connection', 'opportunity', 'insight', 'none'
    outcomeDescription = null,
    revenueAmount = null,
    revenueCurrency = 'USD'
  } = outcomeData

  const { data, error } = await supabase
    .from('groan_outcomes')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      outcome_type: outcomeType,
      outcome_description: outcomeDescription,
      revenue_amount: revenueAmount,
      revenue_currency: revenueCurrency
    })
    .select()
    .single()

  if (error) {
    console.error('Error recording outcome:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get challenges needing 48hr follow-up
 */
export async function getChallengesNeedingFollowUp(userId) {
  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

  const { data, error } = await supabase
    .from('groan_challenges')
    .select(`
      *,
      groan_outcomes(count)
    `)
    .eq('user_id', userId)
    .eq('status', GROAN_CHALLENGE_STATUS.COMPLETED)
    .lte('completed_at', fortyEightHoursAgo.toISOString())
    .is('groan_outcomes', null) // No outcomes recorded yet

  if (error) {
    console.error('Error fetching follow-up challenges:', error)
    return { data: null, error }
  }

  // Filter to only those without outcomes
  const needsFollowUp = (data || []).filter(c =>
    !c.groan_outcomes || c.groan_outcomes[0]?.count === 0
  )

  return { data: needsFollowUp, error: null }
}

// =============================================================================
// STREAKS
// =============================================================================

/**
 * Fetch user's streak data
 */
export async function fetchGroanStreak(userId) {
  const { data, error } = await supabase
    .from('groan_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // Not found is ok
    console.error('Error fetching streak:', error)
    return { data: null, error }
  }

  // Calculate badge if streak exists
  if (data) {
    data.currentBadge = getStreakBadge(data.current_streak)
  }

  return { data: data || null, error: null }
}

/**
 * Get streak with next badge milestone
 */
export async function getStreakWithProgress(userId) {
  const { data: streak, error } = await fetchGroanStreak(userId)

  if (error) return { data: null, error }

  if (!streak) {
    return {
      data: {
        currentStreak: 0,
        longestStreak: 0,
        currentBadge: null,
        nextBadge: { weeks: 4, badge: 'Courage Starter', icon: '🌱' },
        weeksToNextBadge: 4
      },
      error: null
    }
  }

  const nextBadge = [
    { weeks: 4, badge: 'Courage Starter', icon: '🌱' },
    { weeks: 12, badge: 'Fear Fighter', icon: '⚔️' },
    { weeks: 26, badge: 'Comfort Zone Crusher', icon: '💪' },
    { weeks: 52, badge: 'Essence Embodied', icon: '👑' }
  ].find(b => b.weeks > streak.current_streak)

  return {
    data: {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      lastCompletedWeek: streak.last_completed_week,
      currentBadge: streak.currentBadge,
      nextBadge,
      weeksToNextBadge: nextBadge ? nextBadge.weeks - streak.current_streak : 0
    },
    error: null
  }
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

/**
 * Fetch user's groan preferences
 */
export async function fetchGroanPreferences(userId) {
  const { data, error } = await supabase
    .from('groan_user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error)
    return { data: null, error }
  }

  // Return defaults if no preferences exist
  const defaults = {
    show_archetype_language: false,
    show_outcome_tracking: true,
    preferred_difficulty: 3,
    zarlo_before_enabled: true,
    zarlo_after_enabled: true,
    confetti_enabled: true
  }

  return { data: data || defaults, error: null }
}

/**
 * Update user's groan preferences
 */
export async function updateGroanPreferences(userId, preferences) {
  const { data, error } = await supabase
    .from('groan_user_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating preferences:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// =============================================================================
// ANALYTICS & STATS
// =============================================================================

/**
 * Get protective patterns (from skipped challenges)
 */
export async function getProtectivePatterns(userId) {
  const { data, error } = await supabase
    .from('groan_protective_patterns')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching protective patterns:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get revenue attribution by visibility layer
 */
export async function getRevenueByLayer(userId) {
  const { data, error } = await supabase
    .from('groan_revenue_by_layer')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching revenue by layer:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get essence zones stats
 */
export async function getEssenceZoneStats(userId) {
  const { data, error } = await supabase
    .from('groan_essence_zones')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching essence zones:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get overall groan stats for a user
 */
export async function getGroanStats(userId) {
  const { data: challenges, error: challengesError } = await supabase
    .from('groan_challenges')
    .select('status, visibility_layer, essence_zone')
    .eq('user_id', userId)

  if (challengesError) {
    console.error('Error fetching groan stats:', challengesError)
    return { data: null, error: challengesError }
  }

  const stats = {
    total: challenges.length,
    completed: challenges.filter(c => c.status === 'completed').length,
    skipped: challenges.filter(c => c.status === 'skipped').length,
    inProgress: challenges.filter(c => c.status === 'accepted').length,
    byLayer: {},
    byEssenceZone: {}
  }

  // Count by visibility layer
  GROAN_VISIBILITY_LAYERS.forEach(layer => {
    const layerChallenges = challenges.filter(c => c.visibility_layer === layer.id)
    stats.byLayer[layer.id] = {
      total: layerChallenges.length,
      completed: layerChallenges.filter(c => c.status === 'completed').length
    }
  })

  // Count by essence zone
  const zones = ['essence', 'protective', 'comfort', 'neutral', 'growth']
  zones.forEach(zone => {
    const zoneChallenges = challenges.filter(c => c.essence_zone === zone)
    stats.byEssenceZone[zone] = {
      total: zoneChallenges.length,
      completed: zoneChallenges.filter(c => c.status === 'completed').length
    }
  })

  // Calculate completion rate
  stats.completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  return { data: stats, error: null }
}

// =============================================================================
// MATRIX DATA
// =============================================================================

/**
 * Fetch Flow Finder data for matrix rows
 * Returns skills, problems, and personas from nikigai_clusters
 */
export async function fetchFlowFinderData(userId) {
  const { data, error } = await supabase
    .from('nikigai_clusters')
    .select('*')
    .eq('user_id', userId)
    .in('cluster_type', ['skill', 'problem', 'persona'])
    .order('proficiency', { ascending: false })

  if (error) {
    console.error('Error fetching Flow Finder data:', error)
    return { data: null, error }
  }

  // Organize by type
  const organized = {
    skills: (data || []).filter(c => c.cluster_type === 'skill'),
    problems: (data || []).filter(c => c.cluster_type === 'problem'),
    personas: (data || []).filter(c => c.cluster_type === 'persona')
  }

  return { data: organized, error: null }
}

/**
 * Get matrix cell data (challenges for a specific source + layer combination)
 */
export async function getMatrixCellChallenges(userId, sourceType, sourceId, visibilityLayer) {
  const { data, error } = await supabase
    .from('groan_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('visibility_layer', visibilityLayer)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching matrix cell challenges:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get current active challenge for weekly planning
 */
export async function getCurrentWeekChallenge(userId) {
  // Get the start of current week (Monday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(now.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('groan_challenges')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['generated', 'accepted'])
    .gte('created_at', weekStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current week challenge:', error)
    return { data: null, error }
  }

  return { data: data || null, error: null }
}

/**
 * Check if user has completed Flow Finder (required for personalized challenges)
 */
export async function hasCompletedFlowFinder(userId) {
  const { data, error } = await supabase
    .from('flow_sessions')
    .select('flow_type')
    .eq('user_id', userId)
    .in('flow_type', ['nikigai_skills', 'nikigai_problems', 'nikigai_persona'])

  if (error) {
    console.error('Error checking Flow Finder completion:', error)
    return { completed: false, error }
  }

  const completedFlows = new Set((data || []).map(s => s.flow_type))
  const required = ['nikigai_skills', 'nikigai_problems', 'nikigai_persona']
  const allComplete = required.every(f => completedFlows.has(f))

  return {
    completed: allComplete,
    missing: required.filter(f => !completedFlows.has(f)),
    error: null
  }
}

// =============================================================================
// SKILL × PROBLEM MATRIX
// =============================================================================

/**
 * Create a Skill × Problem challenge
 * Stores both skill and problem cluster IDs for matrix lookup
 * @param {object} challengeData
 * @returns {Promise<{data: object, error: Error}>}
 */
export async function createSkillProblemChallenge(challengeData) {
  const {
    userId,
    title,
    description,
    skillId,
    skillLabel,
    problemId,
    problemLabel,
    personaId = null,
    personaLabel = null,
    scaryScore = 5,
    wahooScore = 5,
    generationPrompt = null
  } = challengeData

  // Calculate essence zone
  const essenceZone = calculateEssenceZone(scaryScore, wahooScore)

  // Combine labels for source_label field
  const combinedLabel = personaLabel
    ? `${skillLabel} × ${problemLabel} (for ${personaLabel})`
    : `${skillLabel} × ${problemLabel}`

  const { data, error } = await supabase
    .from('groan_challenges')
    .insert({
      user_id: userId,
      title,
      description,
      // Use 'skill_x_problem' as source_type for this matrix type
      source_type: 'skill_x_problem',
      source_id: skillId, // Primary source is skill
      source_label: combinedLabel,
      // New columns for Skill × Problem matrix
      skill_cluster_id: skillId,
      problem_cluster_id: problemId,
      persona_cluster_id: personaId,
      // Scores
      scary_score: scaryScore,
      wahoo_score: wahooScore,
      essence_zone: essenceZone.zone,
      essence_insight: essenceZone.insight,
      generation_prompt: generationPrompt,
      status: GROAN_CHALLENGE_STATUS.GENERATED
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating skill × problem challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get challenge for a specific Skill × Problem cell
 * @param {string} userId
 * @param {string} skillId - Skill cluster ID
 * @param {string} problemId - Problem cluster ID
 * @param {string|null} personaId - Optional persona filter
 * @returns {Promise<{data: object|null, error: Error}>}
 */
export async function getSkillProblemCellChallenge(userId, skillId, problemId, personaId = null) {
  let query = supabase
    .from('groan_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_cluster_id', skillId)
    .eq('problem_cluster_id', problemId)
    .order('created_at', { ascending: false })

  if (personaId) {
    query = query.eq('persona_cluster_id', personaId)
  } else {
    query = query.is('persona_cluster_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching skill × problem cell challenge:', error)
    return { data: null, error }
  }

  // Return most relevant challenge (prioritize: accepted > generated > completed)
  if (!data || data.length === 0) return { data: null, error: null }

  const accepted = data.find(c => c.status === 'accepted')
  if (accepted) return { data: accepted, error: null }

  const generated = data.find(c => c.status === 'generated')
  if (generated) return { data: generated, error: null }

  // Return most recently completed
  const completed = data
    .filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

  return { data: completed[0] || null, error: null }
}

/**
 * Get all Skill × Problem challenges for a user
 * Useful for populating the entire matrix at once
 * @param {string} userId
 * @param {string|null} personaId - Optional persona filter
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getAllSkillProblemChallenges(userId, personaId = null) {
  let query = supabase
    .from('groan_challenges')
    .select('*')
    .eq('user_id', userId)
    .not('skill_cluster_id', 'is', null)
    .not('problem_cluster_id', 'is', null)
    .order('created_at', { ascending: false })

  if (personaId) {
    query = query.eq('persona_cluster_id', personaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all skill × problem challenges:', error)
    return { data: null, error }
  }

  return { data: data || [], error: null }
}
