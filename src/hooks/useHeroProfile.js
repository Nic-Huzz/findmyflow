import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getSegmentById } from '../lib/wheelTaxonomy'
import { essenceProfiles } from '../data/essenceProfiles'
import { protectiveProfiles } from '../data/protectiveProfiles'
import { getEssenceDisplayName, getEssenceImagePath } from '../lib/essencePreferences'

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
  })

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch archetypes from lead_flow_profiles
      // Try user_id first, fallback to email match
      let profileQuery = supabase
        .from('lead_flow_profiles')
        .select('essence_archetype, protective_archetype, email, custom_essence_name, custom_essence_image')

      // Try user_id first
      let { data: profileData, error: profileError } = await profileQuery
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      // Fallback to email if no result
      if (!profileError && (!profileData || profileData.length === 0) && userEmail) {
        const emailResult = await supabase
          .from('lead_flow_profiles')
          .select('essence_archetype, protective_archetype, email, custom_essence_name, custom_essence_image')
          .ilike('email', userEmail)
          .order('created_at', { ascending: false })
          .limit(1)
        profileData = emailResult.data
        profileError = emailResult.error
      }

      if (profileError) throw profileError

      // Get archetype details from data files
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
            poeticLine: essenceData?.poetic_line || '',
            superpower: essenceData?.superpower || '',
            northStar: essenceData?.north_star || '',
            characters: essenceData?.characters || [],
            image: getEssenceImagePath(profile),
            customName: profile.custom_essence_name,
            customImage: profile.custom_essence_image,
          },
          protective: {
            name: profile.protective_archetype,
            summary: protectiveData?.summary || '',
            coreNarrative: protectiveData?.coreNarrative?.belief || '',
            image: protectiveData?.image || '',
          },
        }
      }

      // 2. Fetch user projects with linked cluster IDs
      const { data: projectsData, error: projectsError } = await supabase
        .from('user_projects')
        .select(`
          id,
          name,
          description,
          current_stage,
          total_points,
          status,
          linked_skill_cluster_id,
          linked_problem_cluster_id,
          linked_persona_cluster_id,
          created_at
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // 3. Collect all cluster IDs to fetch
      const clusterIds = new Set()
      projectsData?.forEach(project => {
        if (project.linked_skill_cluster_id) clusterIds.add(project.linked_skill_cluster_id)
        if (project.linked_problem_cluster_id) clusterIds.add(project.linked_problem_cluster_id)
        if (project.linked_persona_cluster_id) clusterIds.add(project.linked_persona_cluster_id)
      })

      // 4. Fetch nikigai_clusters by IDs
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

      // 5. Build projects with cluster display info
      const projects = projectsData?.map(project => {
        const skillCluster = clustersMap[project.linked_skill_cluster_id]
        const problemCluster = clustersMap[project.linked_problem_cluster_id]
        const personaCluster = clustersMap[project.linked_persona_cluster_id]

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          stage: project.current_stage || 1,
          xp: project.total_points || 0,
          status: project.status,
          // Wheel taxonomy display info
          skill: getClusterDisplayInfo(skillCluster, 'skills'),
          problem: getClusterDisplayInfo(problemCluster, 'problems'),
          persona: getClusterDisplayInfo(personaCluster, 'persona'),
        }
      }) || []

      // 6. Fetch total user XP
      const totalXP = await fetchUserXP(userId)

      // 7. If projectId provided, fetch project-specific groan challenges
      let projectDetail = null
      let groanChallenges = []
      let visibilityProgress = {}

      if (projectId) {
        projectDetail = projects.find(p => p.id === projectId) || null

        if (projectDetail) {
          // Fetch groan challenges matching project's clusters
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
        // For main dashboard, fetch all user's groan challenges for overall progress
        const { data: allGroans, error: allGroansError } = await supabase
          .from('groan_challenges')
          .select('id, visibility_layer, status')
          .eq('user_id', userId)

        if (!allGroansError && allGroans) {
          groanChallenges = allGroans
          visibilityProgress = calculateVisibilityProgress(allGroans)
        }
      }

      // 8. Fetch voice tracker data (essence vs protective + healing journey)
      const [voiceResult, healingResult] = await Promise.all([
        supabase
          .from('quest_completions')
          .select('quest_id, completed_at')
          .eq('user_id', userId)
          .like('quest_id', 'voice_stage_%'),
        supabase
          .from('quest_completions')
          .select('quest_id, quest_type, quest_category, completed_at')
          .eq('user_id', userId)
          .in('quest_category', ['Healing', 'Recognise', 'Release', 'Rewire', 'Reconnect']),
      ])

      const voiceCompletions = voiceResult.data || []
      const healingCompletions = healingResult.data || []

      const essenceCount = voiceCompletions.filter(c => c.quest_id?.endsWith('_essence_voice')).length
      const protectiveCount = voiceCompletions.filter(c => c.quest_id?.endsWith('_protective_voice')).length
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
        },
        totalHealingCompleted: healingCompletions.length,
      }

      setData({
        archetypes,
        projects,
        totalXP,
        projectDetail,
        groanChallenges,
        visibilityProgress,
        voiceTracker,
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
