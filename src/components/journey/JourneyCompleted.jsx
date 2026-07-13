/**
 * JourneyCompleted.jsx
 *
 * Completed exercises and closed quests section for Journey tab.
 * Shows completed Curiosity Map, Life Map, Life Paths as DeepDiveCards,
 * plus any closed quests with their close reason.
 *
 * Created: 2026-07-11
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/AuthProvider'
import DeepDiveCard from '../level/DeepDiveCard'
import '../level/LevelTab.css'
import './JourneyCompleted.css'

export default function JourneyCompleted({ userId }) {
  const { user } = useAuth()
  const [hasCuriosityMap, setHasCuriosityMap] = useState(false)
  const [hasLifeMap, setHasLifeMap] = useState(false)
  const [hasLifePaths, setHasLifePaths] = useState(false)
  const [closedQuests, setClosedQuests] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) { setLoaded(true); return }

    // Check curiosity map
    supabase
      .from('curiosity_clusters')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasCuriosityMap(true)
      })

    // Check life map
    supabase
      .from('flow_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('flow_type', 'life_map')
      .eq('status', 'completed')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasLifeMap(true)
      })

    // Check life paths
    if (user?.email) {
      supabase
        .from('life_path_sessions')
        .select('id, careers')
        .eq('client_email', user.email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.careers?.length) setHasLifePaths(true)
        })
    }

    // Load closed quests
    supabase
      .from('quests')
      .select('id, label, status, close_reason')
      .eq('user_id', userId)
      .neq('status', 'active')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setClosedQuests(data)
        setLoaded(true)
      })
  }, [userId, user?.email])

  if (!loaded) return null

  // Hide if nothing completed
  const hasAnything = hasCuriosityMap || hasLifeMap || hasLifePaths || closedQuests.length > 0
  if (!hasAnything) return null

  return (
    <div className="jc-section">
      <h3 className="jc-title">Completed</h3>

      {/* Wrap DeepDiveCards in level-tab for CSS scoping */}
      <div className="level-tab">
        {hasCuriosityMap && (
          <DeepDiveCard deepDive={{ id: 'curiosity_map', name: 'Your Curiosities', route: '/curiosity-map', narrative: 'See and update your curiosity landscape.', icon: '✨' }} isCompleted={true} />
        )}
        {hasLifeMap && (
          <DeepDiveCard deepDive={{ id: 'life_map', name: 'Life Map', route: '/life-map', narrative: 'Your life story.', icon: '📖' }} isCompleted={true} />
        )}
        {hasLifePaths && (
          <DeepDiveCard deepDive={{ id: 'life_paths', name: 'Map Your Life Paths', route: '/life-paths', narrative: 'See which life paths are open to you right now.', icon: '🗺️' }} isCompleted={true} />
        )}
      </div>

      {closedQuests.map(q => (
        <div key={q.id} className="jc-quest">
          <span className="jc-icon">{q.close_reason === 'achieved' ? '🎉' : q.close_reason === 'lost_interest' ? '🤔' : '⏳'}</span>
          <span className="jc-label">{q.label}</span>
          <span className="jc-status">{q.close_reason === 'achieved' ? 'Achieved' : q.close_reason === 'lost_interest' ? 'Lost interest' : 'Paused'}</span>
        </div>
      ))}
    </div>
  )
}
