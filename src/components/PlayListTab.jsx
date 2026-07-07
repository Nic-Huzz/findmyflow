/**
 * PlayListTab.jsx
 *
 * Play-List tab for the 7-Day Challenge page.
 *
 * States:
 *   1. No category wahoos and no playskills → WahooDiscoveryFlow (first-visit)
 *   2. Otherwise → category bubbles + Active Wahoos + WahooCreator (free text
 *      + bucket list) + WahooInspiration ("Need inspiration?")
 *
 * Active Wahoos come from priority_weekly_picks.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import { createGroanChallenge } from '../lib/crm/groanChallengeService'
import { hapticLight } from '../lib/haptics'
import GroanCompletionModal from './GroanCompletionModal'
import WahooCreator from './WahooCreator'
import WahooDiscoveryFlow from './WahooDiscoveryFlow'
import WahooInspiration from './WahooInspiration'

const WAHOO_CATEGORIES = [
  { id: 'appearance', name: 'Appearance', icon: '👤' },
  { id: 'creation', name: 'Creation', icon: '🎨' },
  { id: 'connection', name: 'Connection', icon: '🤝' },
]

export default function PlayListTab({
  userId,
  currentVisibilityLayer = 'screen',
  onQuestComplete,
  onRefreshPoints,
  wahooCount = 0,
}) {
  const navigate = useNavigate()
  const [playskills, setPlayskills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)
  const [wahooCreatorKey, setWahooCreatorKey] = useState(0)
  const [showWahooModal, setShowWahooModal] = useState(false)

  useEffect(() => {
    if (showWahooModal) {
      document.body.classList.add('modal-active')
      return () => document.body.classList.remove('modal-active')
    }
  }, [showWahooModal])
  const [allTimeWahoos, setAllTimeWahoos] = useState(0)
  const [categoryWahoos, setCategoryWahoos] = useState({ appearance: [], creation: [], connection: [] })
  const [expandedBubble, setExpandedBubble] = useState(null)
  const [quickAddText, setQuickAddText] = useState('')
  const [quickAddSaving, setQuickAddSaving] = useState(false)

  // Fetch all wahoos with categories (completed + queued bucket list)
  const fetchCategoryWahoos = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('groan_challenges')
      .select('id, title, challenge_text, description, status, wahoo_category, completed_at, accepted_at')
      .eq('user_id', userId)
      .not('wahoo_category', 'is', null)
      .order('created_at', { ascending: false })
    if (data) {
      const grouped = { appearance: [], creation: [], connection: [] }
      data.forEach(w => {
        if (grouped[w.wahoo_category]) {
          grouped[w.wahoo_category].push(w)
        }
      })
      setCategoryWahoos(grouped)
    }
  }, [userId])

  // Fetch playskills (extracted so WahooInspiration's PlaySkillPicker can refresh)
  const fetchPlayskills = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, cluster_type, items, step_id')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
    if (data) setPlayskills(data)
  }, [userId])

  // Fetch playskills + active challenges + category wahoos
  useEffect(() => {
    if (!userId) return

    Promise.all([
      fetchPlayskills(),
      fetchActiveChallenges(),
      supabase
        .from('groan_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      fetchCategoryWahoos(),
    ]).then(([, , { count }]) => {
      setAllTimeWahoos(count || 0)
      setLoading(false)
    }).catch(err => {
      console.error('PlayListTab fetch error:', err)
      setLoading(false)
    })
  }, [userId])

  // Quick-add a future wahoo (saved as generated, not accepted)
  async function handleQuickAdd(catId) {
    if (!quickAddText.trim() || quickAddSaving) return
    setQuickAddSaving(true)
    try {
      await createGroanChallenge({
        userId,
        title: quickAddText.trim(),
        description: quickAddText.trim(),
        visibilityLayer: 'screen',
        sourceType: 'skill',
        sourceLabel: 'Bucket list',
        scaryScore: 7,
        wahooScore: 7,
        wahooCategory: catId,
      })
      setQuickAddText('')
      fetchCategoryWahoos()
    } catch (err) {
      console.error('Quick-add error:', err)
    } finally {
      setQuickAddSaving(false)
    }
  }

  const fetchActiveChallenges = async () => {
    // Fetch all picks (not just current week) — wahoos persist until completed
    const { data } = await supabase
      .from('priority_weekly_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('pick_type', 'groan')
      .order('week_start_date', { ascending: false })

    if (data) {
      // Deduplicate by reference_id (keep most recent pick)
      const seen = new Set()
      const unique = data.filter(pick => {
        if (seen.has(pick.reference_id)) return false
        seen.add(pick.reference_id)
        return true
      })
      // Enrich with source label from groan_challenges
      const enriched = await Promise.all(unique.map(async pick => {
        const { data: challenge } = await supabase
          .from('groan_challenges')
          .select('source_label, status')
          .eq('id', pick.reference_id)
          .single()
        return { ...pick, _source_label: challenge?.source_label, _status: challenge?.status }
      }))
      setActiveChallenges(enriched.filter(e => e._status !== 'completed'))
    }
  }

  // Extract category ids from playskills
  const categoryIds = useMemo(() => {
    const ids = new Set()
    playskills.forEach(ps => {
      const catId = ps.items?.[0]?.category
      if (catId) ids.add(catId)
    })
    return [...ids]
  }, [playskills])

  // ─── Active Wahoos renderer ─────────────────────────────────────────────────

  function renderActiveWahoos() {
    return (
      <div className="plt-section-card">
        <div className="plt-section-header">
          <div className="plt-section-header-left">
            <span className="plt-section-icon">🔥</span>
            <span className="plt-section-title">Active Wahoos</span>
          </div>
          <span className="plt-section-count">{activeChallenges.length}</span>
        </div>
        <div className="plt-section-items">
          {activeChallenges.map(pick => {
            const isLoading = loadingChallengeId === pick.reference_id
            return (
              <div key={pick.id || pick.reference_id} className="plt-item-row">
                <span className="plt-item-check"></span>
                <div className="plt-item-body">
                  <div className="plt-item-name">{pick.display_name}</div>
                  <div className="plt-item-meta">{pick._source_label || 'Courage'}</div>
                </div>
                <button
                  className="plt-item-action"
                  disabled={isLoading}
                  onClick={async () => {
                    setLoadingChallengeId(pick.reference_id)
                    const { data } = await supabase
                      .from('groan_challenges')
                      .select('*')
                      .eq('id', pick.reference_id)
                      .single()
                    setLoadingChallengeId(null)
                    if (data) setCompletingChallenge(data)
                  }}
                >
                  {isLoading ? '...' : 'I Did It!'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="playlist-tab"><div className="loading-state"><div className="spinner" /></div></div>
  }

  // ─── State 1: First visit (no category wahoos, no playskills) ──────────────

  const hasCategoryWahoos = Object.values(categoryWahoos).flat().length > 0

  if (playskills.length === 0 && !hasCategoryWahoos) {
    return (
      <div className="playlist-tab">
        {activeChallenges.length > 0 && renderActiveWahoos()}

        <WahooDiscoveryFlow
          userId={userId}
          currentVisibilityLayer={currentVisibilityLayer}
          onComplete={() => {
            fetchCategoryWahoos()
            fetchActiveChallenges()
            onRefreshPoints?.()
          }}
        />

        {completingChallenge && (
          <GroanCompletionModal
            challenge={completingChallenge}
            userId={userId}
            onComplete={() => {
              setCompletingChallenge(null)
              fetchActiveChallenges()
              onRefreshPoints?.()
            }}
            onClose={() => setCompletingChallenge(null)}
          />
        )}
      </div>
    )
  }

  // ─── State 2: Has wahoos or playskills → WahooCreator ──────────────────────

  return (
    <div className="playlist-tab">
      {/* Expression Header + Category Bubbles */}
      <div className="plt-expression-header">
        <div className="plt-expression-tagline">Actions that expand what feels possible for your path</div>
        <div className="plt-category-bubbles">
          {WAHOO_CATEGORIES.map(cat => {
            const items = categoryWahoos[cat.id] || []
            const completedCount = items.length
            const isExpanded = expandedBubble === cat.id
            return (
              <div key={cat.id} className="plt-bubble-wrapper">
                <button
                  className={`plt-category-bubble ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => { hapticLight(); setExpandedBubble(isExpanded ? null : cat.id); setQuickAddText('') }}
                >
                  <span className="plt-bubble-icon">{cat.icon}</span>
                  <span className="plt-bubble-name">{cat.name}</span>
                  <span className="plt-bubble-count">{completedCount}</span>
                </button>
                {isExpanded && (
                  <div className="plt-bubble-modal-overlay" onClick={() => { setExpandedBubble(null); setQuickAddText('') }}>
                    <div className="plt-bubble-modal" onClick={e => e.stopPropagation()}>
                      <div className="plt-modal-header">
                        <span className="plt-modal-title">{cat.icon} {cat.name} Wahoos</span>
                        <button className="plt-modal-close" onClick={() => { setExpandedBubble(null); setQuickAddText('') }}>✕</button>
                      </div>
                      <div className="plt-quickadd">
                        <input
                          className="plt-quickadd-input"
                          placeholder="Add a future wahoo..."
                          value={quickAddText}
                          onChange={e => setQuickAddText(e.target.value)}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && quickAddText.trim()) {
                              handleQuickAdd(cat.id)
                            }
                          }}
                        />
                        <button
                          className="plt-quickadd-btn"
                          disabled={!quickAddText.trim() || quickAddSaving}
                          onClick={() => handleQuickAdd(cat.id)}
                        >
                          {quickAddSaving ? '...' : '+'}
                        </button>
                      </div>
                      {items.length === 0 && (
                        <div className="plt-dropdown-empty">No wahoos yet</div>
                      )}
                      {[...items].sort((a, b) => {
                        if (a.status === 'completed' && b.status !== 'completed') return 1
                        if (a.status !== 'completed' && b.status === 'completed') return -1
                        return 0
                      }).map(w => {
                        const name = w.title || w.challenge_text
                        const isDone = w.status === 'completed'
                        return (
                          <div key={w.id} className={`plt-dropdown-item ${isDone ? 'done' : ''}`}>
                            <span className="plt-dropdown-check">{isDone ? '✓' : '○'}</span>
                            <span className={`plt-dropdown-name ${isDone ? 'crossed' : ''}`}>{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Wahoos */}
      {activeChallenges.length > 0 && renderActiveWahoos()}

      {/* Add a Wahoo button */}
      <button
        className="wc-add-btn"
        onClick={() => setShowWahooModal(true)}
      >
        + Add a Wahoo
      </button>

      {/* WahooCreator Modal */}
      {showWahooModal && (
        <div className="wc-modal-overlay" onClick={() => { setWahooCreatorKey(k => k + 1); setShowWahooModal(false) }}>
          <div className="wc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => { setWahooCreatorKey(k => k + 1); setShowWahooModal(false) }}>&times;</button>
            <WahooCreator
              key={wahooCreatorKey}
              userId={userId}
              currentVisibilityLayer={currentVisibilityLayer}
              bucketList={Object.values(categoryWahoos).flat().filter(w => w.status !== 'completed' && !w.accepted_at)}
              onWahooAccepted={() => {
                fetchActiveChallenges()
                fetchCategoryWahoos()
                onRefreshPoints?.()
              }}
              onClose={() => {
                fetchActiveChallenges()
                fetchCategoryWahoos()
                setWahooCreatorKey(k => k + 1)
                setShowWahooModal(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Need inspiration? — play-skills + Ikigai Mix (+ future pillar gaps) */}
      <WahooInspiration
        userId={userId}
        categories={categoryIds}
        currentVisibilityLayer={currentVisibilityLayer}
        onWahooAccepted={() => {
          fetchActiveChallenges()
          fetchCategoryWahoos()
          onRefreshPoints?.()
        }}
        onWahooSaved={fetchCategoryWahoos}
        onPlaySkillsUpdated={fetchPlayskills}
      />

      {/* Completion modal */}
      {completingChallenge && (
        <GroanCompletionModal
          challenge={completingChallenge}
          userId={userId}
          onComplete={() => {
            setCompletingChallenge(null)
            fetchActiveChallenges()
            onRefreshPoints?.()
          }}
          onClose={() => setCompletingChallenge(null)}
        />
      )}
    </div>
  )
}
