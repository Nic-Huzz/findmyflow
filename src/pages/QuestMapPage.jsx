/**
 * QuestMapPage — /quest-map
 * Standalone page wrapping QuestPathMap with its own data fetching.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import QuestPathMap from '../components/level/QuestPathMap'

export default function QuestMapPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [quests, setQuests] = useState([])
  const [questTasks, setQuestTasks] = useState({})
  const [trunkState, setTrunkState] = useState(null)
  const [safety, setSafety] = useState(0)
  const [careers, setCareers] = useState([])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const [
        { data: questData },
        { data: sessionData },
      ] = await Promise.all([
        supabase.from('quests').select('*').eq('user_id', user.id),
        supabase.from('life_path_sessions')
          .select('current_state, safety, careers')
          .eq('client_email', user.email)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const activeQuests = questData || []
      setQuests(activeQuests)

      // Fetch tasks for all quests + depth from groan_challenges
      if (activeQuests.length > 0) {
        const { data: allTasks } = await supabase
          .from('quest_tasks')
          .select('*')
          .in('quest_id', activeQuests.map(q => q.id))
          .order('sort_order')

        // Fetch depth_level from groan_challenges (no FK, separate query)
        const groanIds = (allTasks || []).filter(t => t.groan_challenge_id).map(t => t.groan_challenge_id)
        let depthMap = {}
        if (groanIds.length > 0) {
          const { data: depths } = await supabase
            .from('groan_challenges')
            .select('id, depth_level')
            .in('id', groanIds)
          depths?.forEach(d => { depthMap[d.id] = d.depth_level })
        }

        const taskMap = {}
        ;(allTasks || []).forEach(t => {
          const task = { ...t, depth_level: depthMap[t.groan_challenge_id] || null }
          if (!taskMap[task.quest_id]) taskMap[task.quest_id] = []
          taskMap[task.quest_id].push(task)
        })
        setQuestTasks(taskMap)
      }

      if (sessionData) {
        setTrunkState(sessionData.current_state)
        setSafety(sessionData.safety || 0)
        setCareers(sessionData.careers || [])
      }
    } catch (err) {
      console.error('QuestMapPage data load error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user?.id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0' }}>
        <div style={{ opacity: 0.3 }}>Loading...</div>
      </div>
    )
  }

  return (
    <QuestPathMap
      quests={quests}
      questTasks={questTasks}
      trunkState={trunkState}
      safety={safety}
      careers={careers}
      userId={user?.id}
      onUpdate={loadData}
      onClose={() => navigate('/7-day-challenge')}
    />
  )
}
