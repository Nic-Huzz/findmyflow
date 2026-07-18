/**
 * MirrorPage.jsx — /mirror
 * The home for Clarity. Shows who you are and how that's evolving.
 * Clusters with resonance ratings, identity statements, re-generation prompts.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight } from '../lib/haptics'
import './MirrorPage.css'

export default function MirrorPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Hide bottom toolbar on this page
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])
  const userId = user?.id

  const [loading, setLoading] = useState(true)
  const [clusters, setClusters] = useState([])
  const [ratings, setRatings] = useState({})
  const [removedIds, setRemovedIds] = useState(new Set())
  const [identityStatements, setIdentityStatements] = useState([])
  const [courageCount, setCourageCount] = useState(0)
  const [regenClusters, setRegenClusters] = useState([]) // clusters with behavioral_evidence >= 5
  const [skillProgress, setSkillProgress] = useState([])
  const [addClusterText, setAddClusterText] = useState('')
  const [addClusterType, setAddClusterType] = useState('skills')
  const [addingSaving, setAddingSaving] = useState(false)
  const [regenLoading, setRegenLoading] = useState(null) // cluster id being regenerated
  const [regenResult, setRegenResult] = useState(null) // { clusterId, oldLabel, newLabel, reason }

  useEffect(() => {
    if (!userId) return
    let active = true

    Promise.all([
      // Life Map clusters (final, non-archived)
      supabase.from('nikigai_clusters')
        .select('id, cluster_type, cluster_label, insight, items, resonance_rating, resonance_state, resonance_updated_at, behavioral_evidence, is_removed, is_favourite')
        .eq('user_id', userId)
        .in('cluster_type', ['skills', 'problems', 'persona'])
        .is('step_id', null)
        .eq('cluster_stage', 'final')
        .order('cluster_type')
        .order('created_at'),

      // Identity statements from courage completions
      supabase.from('quest_completions')
        .select('reflection_text')
        .eq('user_id', userId)
        .eq('quest_category', 'Groans')
        .not('reflection_text', 'is', null),

      // Courage challenge count
      supabase.from('quest_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('quest_category', 'Groans'),

      // Skill progress
      supabase.from('user_skill_progress')
        .select('skill_id, xp, level')
        .eq('user_id', userId)
        .gt('xp', 0)
        .order('xp', { ascending: false }),
    ]).then(([clusterRes, reflectionRes, countRes, skillRes]) => {
      if (!active) return

      // Process clusters
      const allClusters = clusterRes.data || []
      setClusters(allClusters)

      // Pre-populate ratings + removed state
      const r = {}
      const removed = new Set()
      allClusters.forEach(c => {
        if (c.resonance_state) r[c.id] = c.resonance_state
        else if (c.resonance_rating) r[c.id] = c.resonance_rating >= 4 ? 'vibe_rise' : c.resonance_rating >= 3 ? 'fun' : 'bored'
        if (c.is_removed) removed.add(c.id)
      })
      setRatings(r)
      setRemovedIds(removed)

      // Find clusters ready for re-generation
      setRegenClusters(allClusters.filter(c => (c.behavioral_evidence || 0) >= 5 && !c.is_removed))

      // Process identity statements
      const stmtCounts = {}
      ;(reflectionRes.data || []).forEach(row => {
        try {
          const parsed = JSON.parse(row.reflection_text)
          if (parsed.identity_statement) {
            const stmt = parsed.identity_statement.trim().toLowerCase()
            if (stmt) stmtCounts[stmt] = (stmtCounts[stmt] || 0) + 1
          }
        } catch {} // not JSON, skip
      })
      const sorted = Object.entries(stmtCounts)
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
      setIdentityStatements(sorted)

      setCourageCount(countRes.count || 0)
      setSkillProgress(skillRes.data || [])
      setLoading(false)
    }).catch(err => {
      console.error('MirrorPage load error:', err)
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [userId])

  // Clarity calculation: % of clusters rated vibe_rise or fun (aligned)
  const keptClusters = clusters.filter(c => !removedIds.has(c.id) && !c.is_removed)
  const ratedKept = keptClusters.filter(c => ratings[c.id] && ['vibe_rise', 'fun'].includes(ratings[c.id]))
  const clarityPct = keptClusters.length > 0
    ? Math.round((ratedKept.length / keptClusters.length) * 100)
    : null

  const handleRate = (clusterId, state) => {
    hapticLight()
    if (state === 'bored') {
      handleRemove(clusterId)
      return
    }
    setRatings(prev => ({ ...prev, [clusterId]: state }))
    // Auto-save state immediately
    supabase.from('nikigai_clusters').update({
      resonance_state: state,
      resonance_rating: state === 'vibe_rise' ? 4 : state === 'fun' ? 3 : state === 'stressed' ? 2 : 1,
      resonance_updated_at: new Date().toISOString(),
    }).eq('id', clusterId).then(({ error }) => {
      if (error) console.warn('Rating save failed:', error)
    })
  }

  const handleRemove = (clusterId) => {
    hapticLight()
    setRemovedIds(prev => new Set([...prev, clusterId]))
    setRatings(prev => { const n = { ...prev }; delete n[clusterId]; return n })
    // Auto-save removal
    supabase.from('nikigai_clusters').update({
      is_removed: true,
      resonance_updated_at: new Date().toISOString(),
    }).eq('id', clusterId).then(() => {})
  }

  const handleRestore = (clusterId) => {
    hapticLight()
    setRemovedIds(prev => { const n = new Set(prev); n.delete(clusterId); return n })
    // Auto-save restore
    supabase.from('nikigai_clusters').update({
      is_removed: false,
      resonance_updated_at: new Date().toISOString(),
    }).eq('id', clusterId).then(() => {})
  }

  const handleRegenerate = async (cluster) => {
    if (regenLoading) return
    setRegenLoading(cluster.id)
    try {
      // Fetch challenge outcomes for this cluster's skills
      const { data: completions } = await supabase
        .from('quest_completions')
        .select('reflection_text')
        .eq('user_id', userId)
        .eq('quest_category', 'Groans')
        .not('reflection_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)

      const outcomes = []
      ;(completions || []).forEach(row => {
        try {
          const p = JSON.parse(row.reflection_text)
          if (p.wahoo_classification) outcomes.push({
            title: p.source_label || 'Challenge',
            classification: p.wahoo_classification,
            identity_statement: p.identity_statement || null,
          })
        } catch {}
      })

      const { data, error } = await supabase.functions.invoke('regenerate-cluster', {
        body: {
          cluster_label: cluster.cluster_label,
          cluster_type: cluster.cluster_type,
          original_items: cluster.items,
          challenge_outcomes: outcomes.slice(0, 10),
        },
      })

      if (error || !data) throw error || new Error('No response')

      if (data.confidence >= 0.6 && data.evolved_label !== cluster.cluster_label) {
        setRegenResult({
          clusterId: cluster.id,
          oldLabel: cluster.cluster_label,
          newLabel: data.evolved_label,
          newInsight: data.evolved_insight,
          reason: data.evolution_reason,
        })
      } else {
        // Low confidence or no change — mark as attempted, suppress for 30 days
        await supabase.from('nikigai_clusters').update({
          regen_attempted_at: new Date().toISOString(),
          behavioral_evidence: 0,
        }).eq('id', cluster.id)
        setRegenClusters(prev => prev.filter(c => c.id !== cluster.id))
      }
    } catch (err) {
      console.warn('Regen error:', err)
    }
    setRegenLoading(null)
  }

  const handleAcceptRegen = async () => {
    if (!regenResult) return
    await supabase.from('nikigai_clusters').update({
      cluster_label: regenResult.newLabel,
      insight: regenResult.newInsight,
      behavioral_evidence: 0,
      regen_attempted_at: new Date().toISOString(),
      regen_notified: false,
      resonance_state: null,
      resonance_rating: null,
    }).eq('id', regenResult.clusterId)
    setClusters(prev => prev.map(c => c.id === regenResult.clusterId
      ? { ...c, cluster_label: regenResult.newLabel, insight: regenResult.newInsight,
          behavioral_evidence: 0, resonance_state: null, resonance_rating: null }
      : c
    ))
    setRatings(prev => { const n = { ...prev }; delete n[regenResult.clusterId]; return n })
    setRegenClusters(prev => prev.filter(c => c.id !== regenResult.clusterId))
    setRegenResult(null)
  }

  const handleKeepOriginal = async () => {
    if (!regenResult) return
    await supabase.from('nikigai_clusters').update({
      behavioral_evidence: 0,
      regen_attempted_at: new Date().toISOString(),
      regen_notified: false,
    }).eq('id', regenResult.clusterId)
    setRegenClusters(prev => prev.filter(c => c.id !== regenResult.clusterId))
    setRegenResult(null)
  }

  const handleAddCluster = async () => {
    if (!addClusterText.trim() || addingSaving) return
    setAddingSaving(true)
    const { data, error } = await supabase.from('nikigai_clusters').insert({
      user_id: userId,
      cluster_type: addClusterType,
      cluster_stage: 'final',
      cluster_label: addClusterText.trim(),
      items: [],
      user_modified: true,
    }).select('*').single()
    if (error) console.warn('Add cluster failed:', error)
    if (data) {
      setClusters(prev => [...prev, data])
      hapticLight()
    }
    setAddClusterText('')
    setAddingSaving(false)
  }

  if (loading) {
    return (
      <div className="mp-page">
        <div className="mp-toolbar">
          <button className="mp-back" onClick={() => navigate('/7-day-challenge')}>← Back</button>
          <h1 className="mp-title">Your Mirror</h1>
          <div style={{ width: 60 }} />
        </div>
        <div className="mp-loading">Loading...</div>
      </div>
    )
  }

  const activeClusters = clusters.filter(c => !removedIds.has(c.id) && !c.is_removed)
  const removedClusters = clusters.filter(c => removedIds.has(c.id) || c.is_removed)
  const typeLabel = { skills: 'Skills', problems: 'Problems', persona: 'Personas' }
  const typeColor = { skills: '#5e17eb', problems: '#E9A23B', persona: '#10b981' }

  return (
    <div className="mp-page">
      <div className="mp-toolbar">
        <button className="mp-back" onClick={() => navigate('/7-day-challenge')}>← Back</button>
        <h1 className="mp-title">Your Mirror</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Re-generation banner */}
      {regenClusters.length > 0 && (
        <div className="mp-regen-banner">
          <span className="mp-regen-icon">✨</span>
          <div className="mp-regen-text">
            <strong>{regenClusters.length} cluster{regenClusters.length > 1 ? 's have' : ' has'} new evidence</strong>
            <span>Your challenges are showing who you're becoming. Re-rate below.</span>
          </div>
        </div>
      )}

      {/* Courage counter + identity statements */}
      {courageCount > 0 && (
        <IdentitySection count={courageCount} statements={identityStatements} />
      )}

      {/* Rating index */}
      <div className="mp-rating-index">
        <div className="mp-index-title">How to rate</div>
        <div className="mp-index-row"><span className="mp-index-dots">●●●●</span><span className="mp-index-label">This IS me</span><span className="mp-index-desc">Goosebumps. You'd screenshot it.</span></div>
        <div className="mp-index-row"><span className="mp-index-emoji">🔥</span><span className="mp-index-label">I would absolutely love this</span></div>
        <div className="mp-index-row"><span className="mp-index-emoji">😌</span><span className="mp-index-label">Yeah, sounds fun</span></div>
        <div className="mp-index-row"><span className="mp-index-emoji">😰</span><span className="mp-index-label">I could do it but feels stressful</span></div>
        <div className="mp-index-row mp-index-row-remove"><span className="mp-index-emoji">😶</span><span className="mp-index-label">I could but it doesn't excite me</span><span className="mp-index-desc">Auto-removed</span></div>
      </div>

      {/* Cluster cards grouped by type */}
      {['skills', 'problems', 'persona'].map(type => {
        const typeClusters = activeClusters.filter(c => c.cluster_type === type)
        if (typeClusters.length === 0) return null
        return (
          <div key={type} className="mp-section">
            <h3 className="mp-section-title" style={{ color: typeColor[type] }}>
              {typeLabel[type]}
            </h3>
            {typeClusters.map(cluster => {
              const isRegen = regenClusters.some(r => r.id === cluster.id)
              return (
                <div key={cluster.id} className={`mp-cluster-card${isRegen ? ' mp-cluster-regen' : ''}`}>
                  <div className="mp-cluster-top">
                    <div className="mp-cluster-label">{cluster.cluster_label}</div>
                    <button className="mp-cluster-remove" onClick={() => handleRemove(cluster.id)}>
                      Remove
                    </button>
                  </div>
                  {isRegen && (
                    <div className="mp-cluster-evidence-row">
                      <div className="mp-cluster-evidence">
                        {cluster.behavioral_evidence} challenges shaping this
                      </div>
                      <button className="mp-regen-btn"
                        onClick={() => handleRegenerate(cluster)}
                        disabled={regenLoading === cluster.id}>
                        {regenLoading === cluster.id ? '...' : 'Review'}
                      </button>
                    </div>
                  )}
                  <div className="mp-state-pills">
                    {[
                      { id: 'vibe_rise', emoji: '🔥', label: 'Love this' },
                      { id: 'fun', emoji: '😌', label: 'Sounds fun' },
                      { id: 'stressed', emoji: '😰', label: 'Stressful' },
                      { id: 'bored', emoji: '😶', label: 'Not excited' },
                    ].map(s => (
                      <button key={s.id}
                        className={`mp-state-pill ${ratings[cluster.id] === s.id ? 'active' : ''} mp-state-${s.id}`}
                        onClick={() => handleRate(cluster.id, s.id)}
                      >{s.emoji} {s.label}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Removed clusters */}
      {removedClusters.length > 0 && (
        <div className="mp-section mp-removed-section">
          <h3 className="mp-section-title mp-removed-title">Removed</h3>
          {removedClusters.map(c => (
            <div key={c.id} className="mp-cluster-card mp-cluster-removed">
              <div className="mp-cluster-top">
                <div className="mp-cluster-label">{c.cluster_label}</div>
                <button className="mp-cluster-restore" onClick={() => handleRestore(c.id)}>
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill Progress */}
      {skillProgress.length > 0 && (
        <div className="mp-section">
          <h3 className="mp-section-title" style={{ color: '#5e17eb' }}>Your Skills</h3>
          {skillProgress.map(skill => {
            const THRESHOLDS = [0, 3, 8, 15, 25]
            const LABELS = ['L0', 'L1', 'L2', 'L3', 'L4']
            let levelIdx = 0
            for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
              if (skill.xp >= THRESHOLDS[i]) { levelIdx = i; break }
            }
            const SKILL_NAMES = {
              storytelling: 'Storytelling', teaching: 'Teaching', coaching: 'Coaching',
              performing: 'Performing', creating: 'Creating', building: 'Building',
              designing: 'Designing', leading: 'Leading', connecting: 'Connecting',
              speaking_up: 'Speaking Up',
            }
            return (
              <div key={skill.skill_id} className="mp-skill-row">
                <span className="mp-skill-name">{SKILL_NAMES[skill.skill_id] || skill.skill_id}</span>
                <div className="mp-skill-segments">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={`mp-skill-seg ${i <= levelIdx ? 'lit' : ''}`} />
                  ))}
                </div>
                <span className="mp-skill-level">{LABELS[levelIdx]}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Add your own cluster */}
      <div className="mp-section">
        <div className="mp-add-cluster">
          <input
            className="mp-add-input"
            type="text"
            value={addClusterText}
            onChange={e => setAddClusterText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCluster()}
            placeholder="Add a cluster the AI missed..."
          />
          <div className="mp-add-row">
            <div className="mp-add-type-btns">
              {[['skills', 'Skill'], ['problems', 'Problem'], ['persona', 'Persona']].map(([id, label]) => (
                <button key={id}
                  className={`mp-add-type-btn ${addClusterType === id ? 'active' : ''}`}
                  onClick={() => setAddClusterType(id)}
                >{label}</button>
              ))}
            </div>
            <button className="mp-add-btn" onClick={handleAddCluster}
              disabled={!addClusterText.trim() || addingSaving}>
              {addingSaving ? '...' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* Clarity Score — bottom summary */}
      {clarityPct != null && (
        <div className="mp-clarity-hero">
          <div className="mp-clarity-number">{clarityPct}%</div>
          <div className="mp-clarity-label">Clarity</div>
          <div className="mp-clarity-sub">How well you know who you are</div>
        </div>
      )}

      {/* No clusters state */}
      {clusters.length === 0 && (
        <div className="mp-empty">
          <p className="mp-empty-text">Complete your Life Map to see your mirror.</p>
          <button className="mp-cta" onClick={() => navigate('/life-map')}>
            Start Life Map
          </button>
        </div>
      )}

      {/* All clusters removed state */}
      {clusters.length > 0 && activeClusters.length === 0 && removedClusters.length > 0 && (
        <div className="mp-empty">
          <p className="mp-empty-text">You've removed all your clusters. Restore some below, or re-run your Life Map.</p>
        </div>
      )}

      {/* Re-generation comparison modal */}
      {regenResult && (
        <div className="mp-regen-overlay" onClick={() => setRegenResult(null)}>
          <div className="mp-regen-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-regen-compare">
              <div className="mp-regen-old">
                <div className="mp-regen-label">Was</div>
                <div className="mp-regen-name">{regenResult.oldLabel}</div>
              </div>
              <div className="mp-regen-arrow">→</div>
              <div className="mp-regen-new">
                <div className="mp-regen-label">Now</div>
                <div className="mp-regen-name">{regenResult.newLabel}</div>
              </div>
            </div>
            <p className="mp-regen-reason">{regenResult.reason}</p>
            <div className="mp-regen-actions">
              <button className="mp-regen-accept" onClick={handleAcceptRegen}>Accept</button>
              <button className="mp-regen-keep" onClick={handleKeepOriginal}>Keep original</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Identity Statement Section ──
function IdentitySection({ count, statements }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mp-identity-section">
      <button className="mp-identity-header" onClick={() => setExpanded(!expanded)}>
        <div className="mp-identity-count">{count}</div>
        <div className="mp-identity-info">
          <div className="mp-identity-title">courage challenges completed</div>
          {statements.length > 0 && (
            <div className="mp-identity-top">
              Top: "I am someone who {statements[0].text}" ({'\u00D7'}{statements[0].count})
            </div>
          )}
        </div>
        <span className="mp-identity-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && statements.length > 0 && (
        <div className="mp-identity-list">
          {statements.map((s, i) => (
            <div key={i} className="mp-identity-row">
              <span className="mp-identity-text">I am someone who {s.text}</span>
              <span className="mp-identity-badge">{'\u00D7'}{s.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
