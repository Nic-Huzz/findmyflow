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

export default function JourneyOnboarding({ userId }) {
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

    // Check wahoos
    supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', userId)
      .not('wahoo_category', 'is', null)
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

  // Hide entire section if everything is done
  const allDone = hasCuriosityMap && hasLifeMap && hasLifePaths && hasEssenceAvatar && (hasWahoos || hasPlaySkills) && hasHealingCompletion
  if (allDone) return null

  return (
    <div className="jo-section level-tab">
      <div className="quest-section">
        <div className="quest-section-header">
          <span className="quest-section-icon">📖</span>
          <span className="quest-section-title">Getting Started</span>
        </div>
          {/* Curiosity Map → Life Map → Life Paths (sequential, locked until previous complete) */}
          {!hasCuriosityMap && (
            <DeepDiveCard deepDive={{ id: 'curiosity_map', name: 'Map Your Curiosities', route: '/curiosity-map', narrative: 'What can\'t you stop reading, watching, and learning about?', icon: '✨' }} isCompleted={false} />
          )}
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
          {!hasEssenceAvatar && (
            <DeepDiveCard deepDive={{ id: 'hero_avatar', name: 'Create Your Hero Avatar', route: '/essence-mirror', narrative: 'Define who you are.', icon: '🦸' }} isCompleted={false} />
          )}
          {!(hasWahoos || hasPlaySkills) && hasLifePaths && (
            <div className="level-deep-dive" style={{ cursor: 'default' }}>
              <div className="level-dd-icon">🔥</div>
              <div className="level-dd-info">
                <div className="level-dd-name">Unlock Your Courage Tab</div>
                <div className="level-dd-narrative">Name what would light you up.</div>
              </div>
              <span className="level-dd-status start">Start</span>
            </div>
          )}
          {!(hasWahoos || hasPlaySkills) && !hasLifePaths && (
            <div className="level-deep-dive" style={{ opacity: 0.5 }}>
              <div className="level-dd-icon">🔒</div>
              <div className="level-dd-info">
                <div className="level-dd-name">Unlock Your Courage Tab</div>
                <div className="level-dd-narrative">Complete Life Paths first.</div>
              </div>
              <span className="level-dd-status locked">Locked</span>
            </div>
          )}
          {!hasHealingCompletion && hasLifePaths && (
            <div className="level-deep-dive" style={{ cursor: 'default' }}>
              <div className="level-dd-icon">💚</div>
              <div className="level-dd-info">
                <div className="level-dd-name">Unlock Your Healing Tab</div>
                <div className="level-dd-narrative">Remove what's blocking your path.</div>
              </div>
              <span className="level-dd-status start">Start</span>
            </div>
          )}
          {!hasHealingCompletion && !hasLifePaths && (
            <div className="level-deep-dive" style={{ opacity: 0.5 }}>
              <div className="level-dd-icon">🔒</div>
              <div className="level-dd-info">
                <div className="level-dd-name">Unlock Your Healing Tab</div>
                <div className="level-dd-narrative">Complete Life Paths first.</div>
              </div>
              <span className="level-dd-status locked">Locked</span>
            </div>
          )}
      </div>
    </div>
  )
}
