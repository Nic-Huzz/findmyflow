import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getStageConfig } from '../lib/stageConfig'
import { normalizePersona } from '../data/personaProfiles'

function cacheBustUrl(url) {
  const v = import.meta.env.VITE_APP_VERSION || Date.now()
  return `${url}?v=${v}`
}

export default function useBusinessPageData() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [allQuests, setAllQuests] = useState([])
  const [completions, setCompletions] = useState([])
  const [activeStageTab, setActiveStageTab] = useState(null)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [stageProgress, setStageProgress] = useState(null)

  // Load quest definitions from JSON
  useEffect(() => {
    async function loadQuests() {
      try {
        const res = await fetch(cacheBustUrl('/challengeQuestsUpdate.json'))
        const data = await res.json()
        setAllQuests(data.quests || [])
      } catch (err) {
        console.error('Error loading quest data:', err)
      }
    }
    loadQuests()
  }, [])

  // Load user projects + completions + stage progress
  useEffect(() => {
    if (!user?.id) return
    loadUserData()
  }, [user?.id])

  async function loadUserData() {
    setLoading(true)
    try {
      const [projectsResult, completionsResult, stageResult] = await Promise.all([
        supabase
          .from('user_projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('quest_category', 'Business'),
        supabase
          .from('user_stage_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ])

      const userProjects = projectsResult.data || []
      setProjects(userProjects)
      setCompletions(completionsResult.data || [])
      setStageProgress(stageResult.data)

      // Select project: try localStorage, then primary, then first
      const savedId = localStorage.getItem('fmf_selected_project_id')
      const saved = savedId && userProjects.find(p => p.id === savedId)
      const primary = userProjects.find(p => p.is_primary)
      const project = saved || primary || userProjects[0] || null

      if (project) {
        setSelectedProject(project)
        setActiveStageTab(project.current_stage ?? 1)
      } else {
        setActiveStageTab(0.9) // No project — show setup
      }
    } catch (err) {
      console.error('Error loading business data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle project selection
  const selectProject = useCallback((project) => {
    setSelectedProject(project)
    setActiveStageTab(project.current_stage ?? 1)
    setShowProjectSelector(false)
    try { localStorage.setItem('fmf_selected_project_id', project.id) } catch {}
  }, [])

  // Filter quests for active stage
  const stageQuests = useMemo(() => {
    if (!activeStageTab && activeStageTab !== 0.9) return []
    const userPersona = normalizePersona(stageProgress?.persona)

    return allQuests
      .filter(q => {
        if (q.category !== 'Business') return false
        if (q.stage_required !== activeStageTab) return false
        if (q.archived) return false
        // Persona filtering
        if (q.persona_specific && userPersona) {
          const normalized = q.persona_specific.map(p => normalizePersona(p))
          if (!normalized.includes(userPersona)) return false
        }
        return true
      })
      .sort((a, b) => {
        // Explainers first, groans last
        if (a.isExplainer && !b.isExplainer) return -1
        if (!a.isExplainer && b.isExplainer) return 1
        if (a.type === 'Groan' && b.type !== 'Groan') return 1
        if (a.type !== 'Groan' && b.type === 'Groan') return -1
        return 0
      })
  }, [allQuests, activeStageTab, stageProgress])

  // Check if quest is completed
  const isQuestCompleted = useCallback((questId) => {
    return completions.some(c => c.quest_id === questId)
  }, [completions])

  // Stage progress calculation
  const stageCompletedCount = useMemo(() => {
    return stageQuests.filter(q => isQuestCompleted(q.id)).length
  }, [stageQuests, isQuestCompleted])

  const stageProgressPct = useMemo(() => {
    if (stageQuests.length === 0) return 0
    return Math.round((stageCompletedCount / stageQuests.length) * 100)
  }, [stageCompletedCount, stageQuests])

  // Next incomplete quest
  const nextQuest = useMemo(() => {
    return stageQuests.find(q => !isQuestCompleted(q.id)) || null
  }, [stageQuests, isQuestCompleted])

  // Completed stages for dots
  const completedStages = useMemo(() => {
    if (!selectedProject) return []
    const currentStage = selectedProject.current_stage ?? 1
    const done = []
    const stageIds = [0.9, 1, 2, 3, 4, 5, 6, 7]
    for (const s of stageIds) {
      if (s < currentStage) done.push(s)
    }
    return done
  }, [selectedProject])

  // Current stage config
  const currentStageConfig = useMemo(() => {
    if (activeStageTab == null) return null
    return getStageConfig(activeStageTab)
  }, [activeStageTab])

  return {
    loading,
    user,
    projects,
    selectedProject,
    selectProject,
    showProjectSelector,
    setShowProjectSelector,
    activeStageTab,
    setActiveStageTab,
    stageQuests,
    isQuestCompleted,
    stageCompletedCount,
    stageProgressPct,
    nextQuest,
    completedStages,
    currentStageConfig,
    stageProgress,
    refreshData: loadUserData
  }
}
