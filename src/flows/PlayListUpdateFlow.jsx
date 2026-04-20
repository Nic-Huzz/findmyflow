/**
 * PlayListUpdateFlow.jsx — /playlist-update
 *
 * Post-Life Map curation flow. Shows the user's Life Map problem clusters
 * and lets them confirm which ones to add to their Play-List.
 * Confirmed problems get saved with step_id: 'identify_topics' so the
 * MobilePlaylistPicker can find them.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { PROBLEM_SEGMENTS } from '../lib/wheelTaxonomy'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './LifeMapFlow.css' // Reuse Life Map brand styles

// Match a problem cluster label to the closest PROBLEM_SEGMENTS category
function matchToCategory(clusterLabel, clusterInsight) {
  const text = `${clusterLabel} ${clusterInsight}`.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const seg of PROBLEM_SEGMENTS) {
    let score = 0
    // Check keywords
    for (const kw of seg.keywords) {
      if (text.includes(kw)) score += 2
    }
    // Check placemakes
    for (const pm of seg.placemakes) {
      const pmWords = pm.toLowerCase().split(/\s+/)
      const matches = pmWords.filter(w => w.length > 4 && text.includes(w))
      score += matches.length
    }
    // Check display name
    if (text.includes(seg.displayName.toLowerCase())) score += 5

    if (score > bestScore) {
      bestScore = score
      bestMatch = seg
    }
  }

  // Default to 'forgot_what_for' (purpose/meaning) if no strong match
  return bestMatch || PROBLEM_SEGMENTS.find(s => s.id === 'forgot_what_for')
}

export default function PlayListUpdateFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [problemClusters, setProblemClusters] = useState([])
  const [skillsClusters, setSkillsClusters] = useState([])
  const [selections, setSelections] = useState({}) // { clusterId: true/false }
  const [existingTopics, setExistingTopics] = useState([]) // already in play-list

  useEffect(() => {
    if (!user?.id) return
    loadData()
  }, [user?.id])

  const loadData = async () => {
    setLoading(true)

    // Load Life Map clusters (problems + skills)
    const { data: clusters } = await supabase
      .from('nikigai_clusters')
      .select('*')
      .eq('user_id', user.id)
      .eq('cluster_stage', 'final')
      .is('step_id', null) // Life Map clusters have null step_id
      .in('cluster_type', ['problems', 'skills'])
      .order('created_at', { ascending: false })

    const problems = (clusters || []).filter(c => c.cluster_type === 'problems')
    const skills = (clusters || []).filter(c => c.cluster_type === 'skills')
    setProblemClusters(problems)
    setSkillsClusters(skills)

    // Pre-select all by default
    const defaultSelections = {}
    problems.forEach(c => { defaultSelections[c.id] = true })
    setSelections(defaultSelections)

    // Load existing play-list topics to avoid duplicates
    const { data: existing } = await supabase
      .from('nikigai_clusters')
      .select('cluster_label')
      .eq('user_id', user.id)
      .eq('cluster_type', 'problems')
      .eq('step_id', 'identify_topics')

    setExistingTopics((existing || []).map(e => e.cluster_label.toLowerCase()))
    setLoading(false)
  }

  const toggleSelection = (clusterId) => {
    hapticLight()
    setSelections(prev => ({ ...prev, [clusterId]: !prev[clusterId] }))
  }

  const getSelectedCount = () => Object.values(selections).filter(Boolean).length

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedClusters = problemClusters.filter(c => selections[c.id])

      // Create a flow session
      const { data: session } = await supabase
        .from('flow_sessions')
        .insert({ user_id: user.id, flow_type: 'playlist_update', status: 'completed', completed_at: new Date().toISOString() })
        .select()
        .single()

      // For each selected problem cluster, create a nikigai_clusters row with step_id: 'identify_topics'
      const rowsToInsert = []

      for (const cluster of selectedClusters) {
        // Skip if already in play-list
        if (existingTopics.includes(cluster.cluster_label.toLowerCase())) continue

        const category = matchToCategory(cluster.cluster_label, cluster.insight || '')

        // Get matched playskills from skills clusters
        const matchedPlayskills = skillsClusters.map(s => s.cluster_label)

        // Each cluster item becomes its own row (matching IdentifyTopicsFlow pattern)
        const items = cluster.items || []
        if (items.length === 0) {
          // If no items, use the cluster label itself
          rowsToInsert.push({
            session_id: session?.id,
            user_id: user.id,
            cluster_type: 'problems',
            cluster_stage: 'final',
            step_id: 'identify_topics',
            cluster_label: cluster.cluster_label,
            insight: cluster.insight,
            items: [{
              text: cluster.cluster_label,
              categoryId: category.id,
              categoryName: `${category.icon} ${category.displayName}`,
              evidence: cluster.insight || '',
              matchedPlayskills,
              source: 'life_map',
            }],
          })
        } else {
          // Create one row per item
          for (const item of items) {
            const itemText = typeof item === 'string' ? item : item.text
            if (!itemText) continue

            rowsToInsert.push({
              session_id: session?.id,
              user_id: user.id,
              cluster_type: 'problems',
              cluster_stage: 'final',
              step_id: 'identify_topics',
              cluster_label: itemText,
              insight: cluster.insight,
              items: [{
                text: itemText,
                categoryId: category.id,
                categoryName: `${category.icon} ${category.displayName}`,
                evidence: cluster.insight || '',
                matchedPlayskills,
                source: 'life_map',
              }],
            })
          }
        }
      }

      if (rowsToInsert.length > 0) {
        await supabase.from('nikigai_clusters').insert(rowsToInsert)
      }

      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving play-list update:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-processing">
            <div className="lm-spinner" />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading your Life Map results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (problemClusters.length === 0) {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-welcome">
            <div style={{ fontSize: 48 }}>🗺️</div>
            <h2 className="lm-gold-text" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>No Problems Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              Complete your Life Map first to discover the problems you care about.
            </p>
            <button className="lm-cta-gold" onClick={() => navigate('/life-map')}>Go to Life Map</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="life-map-app">
      <div className="lm-container">
        <div style={{ padding: '24px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <h2 className="lm-gold-text" style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>
              Set Up Your Play-List
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
              Your Life Map revealed these problem areas. Which ones do you want to work on in your Play-List challenges?
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {problemClusters.map(cluster => {
              const selected = selections[cluster.id]
              const category = matchToCategory(cluster.cluster_label, cluster.insight || '')
              const alreadyExists = existingTopics.includes(cluster.cluster_label.toLowerCase())

              return (
                <div
                  key={cluster.id}
                  onClick={() => !alreadyExists && toggleSelection(cluster.id)}
                  style={{
                    background: selected ? 'rgba(233, 162, 59, 0.12)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${selected ? 'rgba(233, 162, 59, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 16,
                    padding: 18,
                    cursor: alreadyExists ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: alreadyExists ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: selected ? '#E9A23B' : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: selected ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s',
                    }}>
                      {alreadyExists ? '✓' : selected ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {cluster.cluster_label}
                      </div>
                      {cluster.insight && (
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginBottom: 8 }}>
                          {cluster.insight}
                        </div>
                      )}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 8, fontSize: 11,
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                      }}>
                        {category.icon} {category.displayName}
                      </div>
                      {alreadyExists && (
                        <div style={{ fontSize: 11, color: 'rgba(52, 211, 153, 0.8)', marginTop: 6 }}>
                          Already in your Play-List
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show items */}
                  {(cluster.items || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10, paddingLeft: 40 }}>
                      {(cluster.items || []).map((item, i) => (
                        <span key={i} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 10,
                          background: 'rgba(196, 181, 253, 0.12)', color: 'rgba(196, 181, 253, 0.8)',
                        }}>
                          {typeof item === 'string' ? item : item.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="lm-cta-gold"
              onClick={handleSave}
              disabled={saving || getSelectedCount() === 0}
            >
              {saving ? 'Saving...' : `Add ${getSelectedCount()} to Play-List`}
            </button>
            <button
              className="lm-secondary-btn"
              onClick={() => navigate('/7-day-challenge')}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
