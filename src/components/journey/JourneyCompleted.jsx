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
      })
      .finally(() => setLoaded(true))
  }, [userId, user?.email])

  if (!loaded) return null

  // Hide if nothing completed
  const hasAnything = hasCuriosityMap || hasLifeMap || hasLifePaths || closedQuests.length > 0
  if (!hasAnything) return null

  const items = [
    ...(hasCuriosityMap ? [{ icon: '✨', label: 'Your Curiosities', route: '/curiosity-map' }] : []),
    ...(hasLifeMap ? [{ icon: '📖', label: 'Life Map', route: '/life-map' }] : []),
    ...(hasLifePaths ? [{ icon: '🗺️', label: 'Life Paths', route: '/life-paths' }] : []),
    ...closedQuests.map(q => ({
      icon: q.close_reason === 'achieved' ? '🎉' : q.close_reason === 'lost_interest' ? '🤔' : '⏳',
      label: q.label,
      status: q.close_reason === 'achieved' ? 'Achieved' : q.close_reason === 'lost_interest' ? 'Lost interest' : 'Paused',
    })),
  ]

  return (
    <div className="jc-section">
      <h3 className="jc-title">Completed</h3>
      {items.map((item, i) => (
        <div key={i} className="jc-row">
          <span className="jc-check">✓</span>
          <span className="jc-label">{item.label}</span>
          {item.route && (
            <a href={item.route} className="jc-update">Update</a>
          )}
          {item.status && (
            <span className="jc-status">{item.status}</span>
          )}
        </div>
      ))}
    </div>
  )
}
