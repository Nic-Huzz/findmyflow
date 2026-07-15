/**
 * JourneyOnboarding.jsx
 *
 * "Getting Started" onboarding checklist for Journey tab.
 * Shows sequential unlock: Curiosity Map → Life Map → Life Paths,
 * plus Hero Avatar, Courage unlock, and Healing unlock.
 * Only renders if at least one item is incomplete.
 *
 * Created: 2026-07-11
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/AuthProvider'
import DeepDiveCard from '../level/DeepDiveCard'
import '../level/LevelTab.css'
import './JourneyOnboarding.css'

export default function JourneyOnboarding({ userId, onUnlockTab }) {
  const { user } = useAuth()
  const [hasCuriosityMap, setHasCuriosityMap] = useState(false)
  const [hasLifeMap, setHasLifeMap] = useState(false)
  const [hasLifePaths, setHasLifePaths] = useState(false)
  const [hasEssenceAvatar, setHasEssenceAvatar] = useState(false)
  const [hasWahoos, setHasWahoos] = useState(false)
  const [hasPlaySkills, setHasPlaySkills] = useState(false)
  const [hasHealingCompletion, setHasHealingCompletion] = useState(false)
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

    // Check hero avatar
    supabase
      .from('lead_flow_profiles')
      .select('custom_essence_image')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.custom_essence_image) setHasEssenceAvatar(true)
      })

    // Check wahoos (any groan challenge, not just ones with old categories)
    supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'completed'])
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasWahoos(true)
      })

    // Check play skills
    supabase
      .from('nikigai_clusters')
      .select('id, step_id')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
      .then(({ data }) => {
        if (data?.length > 0) {
          if (data.some(d => d.step_id === 'get_started')) setHasPlaySkills(true)
        }
      })

    // Check healing completion
    supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('quest_category', 'Healing')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasHealingCompletion(true)
      })

      .finally(() => setLoaded(true))
  }, [userId, user?.email])

  if (!loaded) return null

  const hasCourage = hasWahoos || hasPlaySkills || hasHealingCompletion

  // Hide entire section if everything is done
  const allDone = hasCuriosityMap && hasLifeMap && hasLifePaths && hasEssenceAvatar && hasCourage
  if (allDone) return null

  return (
    <div className="jo-section level-tab">
      <div className="quest-section">
        <div className="quest-section-header">
          <span className="quest-section-icon">📖</span>
          <span className="quest-section-title">Getting Started</span>
        </div>

          {/* 1. Curiosity Map */}
          {!hasCuriosityMap && (
            <DeepDiveCard deepDive={{ id: 'curiosity_map', name: 'Map Your Curiosities', route: '/curiosity-map', narrative: 'What can\'t you stop reading, watching, and learning about?', icon: '✨' }} isCompleted={false} />
          )}

          {/* 2. Life Map (locked until Curiosity Map) */}
          {!hasLifeMap && (
            hasCuriosityMap ? (
              <DeepDiveCard deepDive={{ id: 'life_map', name: 'Life Map', route: '/life-map', narrative: 'Your life story holds the answers.', icon: '📖' }} isCompleted={false} />
            ) : (
              <div className="level-deep-dive" style={{ opacity: 0.5 }}>
                <div className="level-dd-icon">🔒</div>
                <div className="level-dd-info">
                  <div className="level-dd-name">Life Map</div>
                  <div className="level-dd-narrative">Complete Curiosity Map first.</div>
                </div>
                <span className="level-dd-status locked">Locked</span>
              </div>
            )
          )}

          {/* 3. Life Paths (locked until Life Map) */}
          {!hasLifePaths && (
            hasLifeMap ? (
              <DeepDiveCard deepDive={{ id: 'life_paths', name: 'Map Your Life Paths', route: '/life-paths', narrative: 'See which life paths are open to you right now.', icon: '🗺️' }} isCompleted={false} />
            ) : (
              <div className="level-deep-dive" style={{ opacity: 0.5 }}>
                <div className="level-dd-icon">🔒</div>
                <div className="level-dd-info">
                  <div className="level-dd-name">Map Your Life Paths</div>
                  <div className="level-dd-narrative">Complete Life Map first.</div>
                </div>
                <span className="level-dd-status locked">Locked</span>
              </div>
            )
          )}

          {/* 4. Explore Your Quests — hidden once Life Paths complete, locked until then */}
          {hasLifePaths ? null : (
            <div className="level-deep-dive" style={{ opacity: 0.5 }}>
              <div className="level-dd-icon">🔒</div>
              <div className="level-dd-info">
                <div className="level-dd-name">Explore Your Quests</div>
                <div className="level-dd-narrative">Complete Life Paths first.</div>
              </div>
              <span className="level-dd-status locked">Locked</span>
            </div>
          )}

          {/* 5. Hero Avatar (always available) */}
          {!hasEssenceAvatar && (
            <DeepDiveCard deepDive={{ id: 'hero_avatar', name: 'Create Your Hero Avatar', route: '/essence-mirror', narrative: 'Define who you are.', icon: '🦸' }} isCompleted={false} />
          )}

          {/* 6. First Courage Challenge — hidden once wahoos exist or Life Paths done with stuck points */}
          {!hasWahoos && !hasLifePaths && (
            <div className="level-deep-dive" style={{ opacity: 0.5 }}>
              <div className="level-dd-icon">🔒</div>
              <div className="level-dd-info">
                <div className="level-dd-name">Start Your First Courage Challenge</div>
                <div className="level-dd-narrative">Complete Life Paths first.</div>
              </div>
              <span className="level-dd-status locked">Locked</span>
            </div>
          )}
      </div>
    </div>
  )
}
