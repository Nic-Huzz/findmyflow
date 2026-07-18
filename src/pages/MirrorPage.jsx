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
  const [addClusterText, setAddClusterText] = useState('')
  const [addClusterType, setAddClusterType] = useState('skills')
  const [addingSaving, setAddingSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true

    Promise.all([
      // Life Map clusters (final, non-archived)
      supabase.from('nikigai_clusters')
        .select('id, cluster_type, cluster_label, insight, items, resonance_rating, resonance_updated_at, behavioral_evidence, is_removed, is_favourite')
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
    ]).then(([clusterRes, reflectionRes, countRes]) => {
      if (!active) return

      // Process clusters
      const allClusters = clusterRes.data || []
      setClusters(allClusters)

      // Pre-populate ratings + removed state
      const r = {}
      const removed = new Set()
      allClusters.forEach(c => {
        if (c.resonance_rating) r[c.id] = c.resonance_rating
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
      setLoading(false)
    }).catch(err => {
      console.error('MirrorPage load error:', err)
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [userId])

  // Clarity calculation (4-point scale: avg × 25 = 0-100%)
  const keptClusters = clusters.filter(c => !removedIds.has(c.id) && !c.is_removed)
  const ratedKept = keptClusters.filter(c => ratings[c.id] != null)
  const clarityPct = ratedKept.length > 0
    ? Math.round((ratedKept.reduce((sum, c) => sum + ratings[c.id], 0) / ratedKept.length) * 25)
    : null

  const handleRate = (clusterId, value) => {
    hapticLight()
    setRatings(prev => ({ ...prev, [clusterId]: value }))
    // Auto-save rating immediately
    supabase.from('nikigai_clusters').update({
      resonance_rating: value,
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
        <div className="mp-index-row"><span className="mp-index-dots">●●●○</span><span className="mp-index-label">Yeah, that's right</span><span className="mp-index-desc">Accurate, no resistance</span></div>
        <div className="mp-index-row"><span className="mp-index-dots">●●○○</span><span className="mp-index-label">Not quite</span><span className="mp-index-desc">See why AI said it but doesn't land</span></div>
        <div className="mp-index-row"><span className="mp-index-dots">●○○○</span><span className="mp-index-label">That's not me</span><span className="mp-index-desc">Feels off, needs re-clustering</span></div>
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
                    <div className="mp-cluster-evidence">
                      {cluster.behavioral_evidence} challenges shaping this
                    </div>
                  )}
                  <div className="mp-rate-dots">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n}
                        className={`mp-rate-dot ${(ratings[cluster.id] || 0) >= n ? 'active' : ''}`}
                        onClick={() => handleRate(cluster.id, n)}
                      />
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
