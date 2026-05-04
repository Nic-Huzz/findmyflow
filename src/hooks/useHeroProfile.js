import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getSegmentById } from '../lib/wheelTaxonomy'
import { essenceProfiles } from '../data/essenceProfiles'
import { protectiveProfiles } from '../data/protectiveProfiles'
import { getEssenceDisplayName, getEssenceImagePath, getEssenceFieldValue } from '../lib/essencePreferences'

/**
 * GROAN_VISIBILITY_LAYERS - Visibility progression for groan challenges
 */
const GROAN_VISIBILITY_LAYERS = [
  { id: 'screen', label: 'Screen', order: 1 },
  { id: 'live', label: 'Live', order: 2 },
  { id: 'money', label: 'Money', order: 3 },
  { id: 'vulnerable', label: 'Vulnerable', order: 4 },
  { id: 'authority', label: 'Authority', order: 5 },
]

/**
 * Get display name from taxonomy_keys array for a cluster
 * Falls back to cluster_label if no taxonomy_keys
 */
function getClusterDisplayInfo(cluster, wheelType) {
  if (!cluster) return null

  const taxonomyKeys = cluster.taxonomy_keys || []

  if (taxonomyKeys.length > 0) {
    // Use first taxonomy key for primary display
    const segment = getSegmentById(wheelType, taxonomyKeys[0])
    if (segment) {
      return {
        id: cluster.id,
        displayName: segment.displayName,
        aspirationalTitle: segment.aspirationalTitle,
        tagline: segment.tagline,
        icon: segment.icon,
        color: segment.color,
        taxonomyKeys,
        rawLabel: cluster.cluster_label,
      }
    }
  }

  // Fallback to cluster_label
  return {
    id: cluster.id,
    displayName: cluster.cluster_label || 'Unknown',
    aspirationalTitle: cluster.cluster_label || 'Unknown',
    tagline: '',
    icon: '?',
    color: '#5e17eb',
    taxonomyKeys: [],
    rawLabel: cluster.cluster_label,
  }
}

/**
 * Calculate visibility layer progress from groan challenges
 */
function calculateVisibilityProgress(challenges) {
  const progress = {}

  GROAN_VISIBILITY_LAYERS.forEach(layer => {
    const layerChallenges = challenges.filter(c => c.visibility_layer === layer.id)
    const completed = layerChallenges.filter(c => c.status === 'completed').length
    const total = layerChallenges.length

    progress[layer.id] = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      label: layer.label,
      order: layer.order,
    }
  })

  return progress
}

/**
 * Get total XP for a user from user_lifetime_scores
 */
async function fetchUserXP(userId) {
  const { data, error } = await supabase
    .from('user_lifetime_scores')
    .select('lifetime_total_score')
    .eq('user_id', userId)
    .is('project_id', null)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user XP:', error)
    return 0
  }

  return data?.lifetime_total_score || 0
}

/**
 * Hook for fetching hero profile data
 *
 * @param {string} userId - User ID
 * @param {string} projectId - Optional project ID for detail view
 * @returns {object} - Profile data, loading state, error, and refresh function
 */
export function useHeroProfile(userId, userEmail = null, projectId = null) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    archetypes: null,
    projects: [],
    totalXP: 0,
    // Project-specific data (when projectId provided)
    projectDetail: null,
    groanChallenges: [],
    visibilityProgress: {},
    // Voice tracker data
    voiceTracker: null,
    // Nervous system archetype
    nervousSystemArchetype: null,
  })

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fire all independent queries in parallel
      const profilePromise = supabase
        .from('lead_flow_profiles')
        .select('essence_archetype, protective_archetype, email, custom_essence_name, custom_essence_image, custom_essence_fields')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      const projectsPromise = supabase
        .from('user_projects')
        .select(`
          id, name, description, current_stage, total_points, status,
          linked_skill_cluster_id, linked_problem_cluster_id, linked_persona_cluster_id, created_at
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })

      const xpPromise = fetchUserXP(userId)

      const dashboardGroansPromise = !projectId
        ? supabase.from('groan_challenges').select('id, visibility_layer, status, completed_at').eq('user_id', userId)
        : Promise.resolve({ data: null })

      const voicePromise = supabase
        .from('quest_completions')
        .select('quest_id, quest_type, quest_category, completed_at')
        .eq('user_id', userId)
        .or('quest_category.eq.Voices,quest_type.eq.Voice')

      const healingPromise = supabase
        .from('quest_completions')
        .select('quest_id, quest_type, quest_category, completed_at')
        .eq('user_id', userId)
        .or('quest_category.eq.Healing,quest_type.in.(Recognise,Release,Rewire,Reconnect,Rest)')

      const nervousSystemPromise = supabase
        .from('nervous_system_responses')
        .select('archetype, archetype_description, core_fear, nervous_system_impact_limit, nervous_system_income_limit, safety_contracts, rewiring_needed, fear_interpretation')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      // Await all parallel queries
      const [profileResult, projectsResult, totalXP, dashboardGroansResult, voiceResult, healingResult, nervousSystemResult] = await Promise.all([
        profilePromise, projectsPromise, xpPromise, dashboardGroansPromise, voicePromise, healingPromise, nervousSystemPromise,
      ])

      // 1. Process profile (with email fallback if needed)
      let { data: profileData, error: profileError } = profileResult

      if (!profileError && (!profileData || profileData.length === 0) && userEmail) {
        const emailResult = await supabase
          .from('lead_flow_profiles')
          .select('essence_archetype, protective_archetype, email, custom_essence_name, custom_essence_image, custom_essence_fields')
          .ilike('email', userEmail)
          .order('created_at', { ascending: false })
          .limit(1)
        profileData = emailResult.data
        profileError = emailResult.error
      }

      if (profileError) throw profileError

      let archetypes = null
      if (profileData && profileData.length > 0) {
        const profile = profileData[0]
        const essenceData = essenceProfiles.essence_archetypes.find(
          a => a.name === profile.essence_archetype
        )
        const protectiveData = profile.protective_archetype
          ? protectiveProfiles[profile.protective_archetype]
          : null

        archetypes = {
          essence: {
            name: getEssenceDisplayName(profile),
            originalName: profile.essence_archetype,
            group: essenceData?.group || 'Unknown',
            tagline: getEssenceFieldValue(profile, 'tagline', essenceData),
            poeticLine: getEssenceFieldValue(profile, 'essence', essenceData),
            superpower: getEssenceFieldValue(profile, 'superpower', essenceData),
            vision: getEssenceFieldValue(profile, 'vision', essenceData),
            northStar: getEssenceFieldValue(profile, 'north_star', essenceData),
            innerChild: getEssenceFieldValue(profile, 'inner_child', essenceData),
            wound: getEssenceFieldValue(profile, 'wound', essenceData),
            characters: getEssenceFieldValue(profile, 'characters', essenceData) || [],
            energeticTransmission: getEssenceFieldValue(profile, 'energetic_transmission', essenceData),
            recognitionPattern: getEssenceFieldValue(profile, 'recognition_pattern', essenceData),
            visionInAction: getEssenceFieldValue(profile, 'vision_in_action', essenceData),
            image: getEssenceImagePath(profile),
            customName: profile.custom_essence_name,
            customImage: profile.custom_essence_image,
            customFields: profile.custom_essence_fields || {},
          },
          protective: {
            name: profile.protective_archetype,
            summary: protectiveData?.summary || '',
            coreNarrative: protectiveData?.coreNarrative?.belief || '',
            image: protectiveData?.image || '',
          },
        }
      }

      // 2. Process projects + cluster enrichment
      const { data: projectsData, error: projectsError } = projectsResult
      if (projectsError) throw projectsError

      const clusterIds = new Set()
      projectsData?.forEach(project => {
        if (project.linked_skill_cluster_id) clusterIds.add(project.linked_skill_cluster_id)
        if (project.linked_problem_cluster_id) clusterIds.add(project.linked_problem_cluster_id)
        if (project.linked_persona_cluster_id) clusterIds.add(project.linked_persona_cluster_id)
      })

      let clustersMap = {}
      if (clusterIds.size > 0) {
        const { data: clustersData, error: clustersError } = await supabase
          .from('nikigai_clusters')
          .select('id, cluster_label, cluster_type, taxonomy_keys')
          .in('id', Array.from(clusterIds))

        if (clustersError) throw clustersError

        clustersData?.forEach(cluster => {
          clustersMap[cluster.id] = cluster
        })
      }

      const projects = projectsData?.map(project => {
        const skillCluster = clustersMap[project.linked_skill_cluster_id]
        const problemCluster = clustersMap[project.linked_problem_cluster_id]
        const personaCluster = clustersMap[project.linked_persona_cluster_id]

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          stage: project.current_stage ?? 1,
          xp: project.total_points || 0,
          status: project.status,
          skill: getClusterDisplayInfo(skillCluster, 'skills'),
          problem: getClusterDisplayInfo(problemCluster, 'problems'),
          persona: getClusterDisplayInfo(personaCluster, 'persona'),
        }
      }) || []

      // 3. Process groan challenges
      let projectDetail = null
      let groanChallenges = []
      let visibilityProgress = {}

      if (projectId) {
        projectDetail = projects.find(p => p.id === projectId) || null

        if (projectDetail) {
          const clusterConditions = []
          if (projectDetail.skill?.id) clusterConditions.push(projectDetail.skill.id)
          if (projectDetail.problem?.id) clusterConditions.push(projectDetail.problem.id)

          if (clusterConditions.length > 0) {
            const { data: groansData, error: groansError } = await supabase
              .from('groan_challenges')
              .select('*')
              .eq('user_id', userId)
              .or(`skill_cluster_id.in.(${clusterConditions.join(',')}),problem_cluster_id.in.(${clusterConditions.join(',')})`)
              .order('created_at', { ascending: false })

            if (groansError) {
              console.error('Error fetching groan challenges:', groansError)
            } else {
              groanChallenges = groansData || []
              visibilityProgress = calculateVisibilityProgress(groanChallenges)
            }
          }
        }
      } else {
        const allGroans = dashboardGroansResult.data
        if (allGroans) {
          groanChallenges = allGroans
          visibilityProgress = calculateVisibilityProgress(allGroans)
        }
      }

      // 4. Process voice tracker
      const voiceCompletions = voiceResult.data || []
      const healingCompletions = healingResult.data || []

      const essenceCount = voiceCompletions.filter(c =>
        c.quest_id?.endsWith('_essence_voice') ||
        c.quest_id?.includes('essence') ||
        c.quest_type?.toLowerCase().includes('essence')
      ).length
      const protectiveCount = voiceCompletions.filter(c =>
        c.quest_id?.endsWith('_protective_voice') ||
        c.quest_id?.includes('protective') ||
        c.quest_type?.toLowerCase().includes('protective')
      ).length
      const totalVoice = essenceCount + protectiveCount

      const voiceTracker = {
        essenceCount,
        protectiveCount,
        totalVoiceMoments: totalVoice,
        essencePercentage: totalVoice > 0
          ? Math.round((essenceCount / totalVoice) * 100)
          : 50,
        healingByType: {
          recognise: healingCompletions.filter(c => c.quest_id?.startsWith('recognise_') || c.quest_type === 'Recognise').length,
          release: healingCompletions.filter(c => c.quest_id?.startsWith('release_') || c.quest_type === 'Release').length,
          rewire: healingCompletions.filter(c => c.quest_id?.startsWith('rewire_') || c.quest_type === 'Rewire').length,
          reconnect: healingCompletions.filter(c => c.quest_id?.startsWith('reconnect_') || c.quest_type === 'Reconnect').length,
          rest: healingCompletions.filter(c => c.quest_id?.startsWith('rest_') || c.quest_type === 'Rest').length,
        },
        totalHealingCompleted: healingCompletions.length,
      }

      // 5. Process nervous system archetype
      const nsData = nervousSystemResult.data?.[0] || null
      const nervousSystemArchetype = nsData ? {
        archetype: nsData.archetype,
        description: nsData.archetype_description,
        coreFear: nsData.core_fear,
        visibilityLimit: nsData.nervous_system_impact_limit,
        earningLimit: nsData.nervous_system_income_limit,
        safetyContracts: nsData.safety_contracts,
        rewiringNeeded: nsData.rewiring_needed,
        fearInterpretation: nsData.fear_interpretation,
      } : null

      setData({
        archetypes,
        projects,
        totalXP,
        projectDetail,
        groanChallenges,
        visibilityProgress,
        voiceTracker,
        nervousSystemArchetype,
      })
    } catch (err) {
      console.error('Error in useHeroProfile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, userEmail, projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...data,
    loading,
    error,
    refresh: fetchData,
  }
}

export default useHeroProfile
