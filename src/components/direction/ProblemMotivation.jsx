/**
 * ProblemMotivation.jsx — Card 2: What drives you
 *
 * "Which of these do you feel like the experiences you love are motivated by?"
 * Shows taxonomy categories ranked by frequency from user's Life Map clusters.
 * Multi-select 1-3 categories.
 */

import { useState, useEffect } from 'react'
import { getProblemProfile } from '../../lib/directionEngine'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import problemTaxonomy from '../../../public/data/problemTaxonomyV2.json'
import './ProblemMotivation.css'

// Build lookup from taxonomy
const CATEGORY_META = {}
problemTaxonomy.categories.forEach(c => {
  CATEGORY_META[c.id] = { displayName: c.displayName, tagline: c.tagline, turnsInto: c.turnsInto }
})

export default function ProblemMotivation({ userId, onComplete, onClose }) {
  const [profile, setProfile] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triggeredClassify, setTriggeredClassify] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    const data = await getProblemProfile(userId)
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [userId])

  // If no tagged problems, trigger classify-problem-domains for untagged clusters
  useEffect(() => {
    if (loading || triggeredClassify) return
    if (profile && profile.length === 0) {
      setTriggeredClassify(true)
      // Fire classify for all untagged problem clusters, then reload
      supabase
        .from('nikigai_clusters')
        .select('id, cluster_label, insight')
        .eq('user_id', userId)
        .eq('cluster_type', 'problems')
        .is('problem_tags', null)
        .is('is_removed', null)
        .then(async ({ data: untagged }) => {
          if (!untagged?.length) return
          // Classify in parallel (cap at 10 to avoid rate limits)
          const batch = untagged.slice(0, 10)
          await Promise.all(batch.map(async (row) => {
            const { data: tagData } = await supabase.functions.invoke('classify-problem-domains', {
              body: { label: row.cluster_label, insight: row.insight },
            })
            if (tagData?.problem_tags?.length) {
              await supabase.from('nikigai_clusters')
                .update({ problem_tags: tagData.problem_tags })
                .eq('id', row.id)
            }
          }))
          // Reload profile
          loadProfile()
        })
    }
  }, [loading, profile, triggeredClassify, userId])

  const toggleCategory = (id) => {
    hapticLight()
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (saving || selected.size === 0) return
    setSaving(true)
    hapticSuccess()

    const selectedArray = [...selected]

    await supabase.from('direction_reveals').upsert({
      user_id: userId,
      reveal_type: 'problem_motivation',
      reveal_data: { selected: selectedArray },
    }, { onConflict: 'user_id,reveal_type' })

    onComplete?.()
  }

  if (loading) {
    return (
      <div className="pm-container">
        <div className="pm-loading">Looking at your story...</div>
      </div>
    )
  }

  if (triggeredClassify && (!profile || profile.length === 0)) {
    return (
      <div className="pm-container">
        <div className="pm-loading">Processing your story...</div>
      </div>
    )
  }

  if (!profile || profile.length === 0) {
    return (
      <div className="pm-container">
        <button className="pm-close" onClick={onClose}>&times;</button>
        <div className="pm-empty">
          <h2>No problem data yet</h2>
          <p>Complete the Life Map first so we can find the problems that drive you.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pm-container">
      <button className="pm-close" onClick={onClose}>&times;</button>

      <div className="pm-header">
        <h2 className="pm-title">What drives you</h2>
        <p className="pm-subtitle">
          Which of these do you feel like the experiences you love are motivated by?
        </p>
        <p className="pm-hint">Select 1-3</p>
      </div>

      <div className="pm-categories">
        {profile.map(({ id, count }) => {
          const meta = CATEGORY_META[id]
          if (!meta) return null
          const isSelected = selected.has(id)

          return (
            <button
              key={id}
              className={`pm-cat ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleCategory(id)}
            >
              <div className="pm-cat-top">
                <span className="pm-cat-check">{isSelected ? '●' : '○'}</span>
                <span className="pm-cat-name">{meta.displayName}</span>
                <span className="pm-cat-count">{count}</span>
              </div>
              <div className="pm-cat-tagline">{meta.tagline}</div>
            </button>
          )
        })}
      </div>

      <div className="pm-fixed">
        <button
          className="pm-cta"
          disabled={selected.size === 0 || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : selected.size === 0 ? 'Select at least 1' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
