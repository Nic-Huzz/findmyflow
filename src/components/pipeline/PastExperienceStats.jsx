/**
 * PastExperienceStats — Post-event stats dashboard for completed experiences.
 * Shows Service model metrics + pipeline node summaries with what was done.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import './PastExperienceStats.css'

export default function PastExperienceStats({ experienceId, onBack }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [exp, setExp] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (!user?.id || !experienceId) return
    loadStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, experienceId])

  async function loadStats() {
    setLoading(true)
    try {
      const [
        expRes, attendeesRes, checklistRes, wahoosRes, metricsRes, igRes,
      ] = await Promise.all([
        supabase.from('experiences').select('*').eq('id', experienceId).single(),
        supabase.from('contact_experiences')
          .select('contact_id, role, attended')
          .eq('experience_id', experienceId)
          .eq('user_id', user.id),
        supabase.from('experience_checklist_items')
          .select('section, title, completed')
          .eq('experience_id', experienceId)
          .eq('user_id', user.id),
        supabase.from('groan_challenges')
          .select('challenge_text, status, wahoo_category')
          .eq('experience_id', experienceId)
          .eq('user_id', user.id),
        supabase.from('pipeline_metrics')
          .select('node, method, metric_key, metric_value')
          .eq('experience_id', experienceId)
          .eq('user_id', user.id),
        supabase.from('instagram_posts')
          .select('reach, views, like_count, comments_count, shares, saves')
          .eq('experience_id', experienceId)
          .eq('user_id', user.id),
      ])

      setExp(expRes.data)

      const attendees = attendeesRes.data || []
      const checklist = checklistRes.data || []
      const wahoos = wahoosRes.data || []
      const metrics = metricsRes.data || []
      const igPosts = igRes.data || []

      // Check which attendees are repeats (appeared in other experiences)
      let repeatCount = 0
      if (attendees.length > 0) {
        const contactIds = attendees.map(a => a.contact_id)
        const { data: otherAppearances } = await supabase
          .from('contact_experiences')
          .select('contact_id')
          .in('contact_id', contactIds)
          .neq('experience_id', experienceId)
          .eq('user_id', user.id)
        const repeats = new Set((otherAppearances || []).map(a => a.contact_id))
        repeatCount = repeats.size
      }

      // Checklist by section
      const sections = {}
      checklist.forEach(item => {
        if (!sections[item.section]) sections[item.section] = { total: 0, done: 0, items: [] }
        sections[item.section].total++
        if (item.completed) sections[item.section].done++
        if (item.completed) sections[item.section].items.push(item.title)
      })

      // Pipeline metrics by node
      const nodeMetrics = {}
      metrics.forEach(m => {
        if (!nodeMetrics[m.node]) nodeMetrics[m.node] = {}
        nodeMetrics[m.node][m.metric_key] = m.metric_value
        if (m.method) nodeMetrics[m.node].method = m.method
      })

      // IG totals
      const igTotals = igPosts.reduce((acc, p) => ({
        reach: acc.reach + (p.reach || 0),
        views: acc.views + (p.views || 0),
        likes: acc.likes + (p.like_count || 0),
        comments: acc.comments + (p.comments_count || 0),
        shares: acc.shares + (p.shares || 0),
        saves: acc.saves + (p.saves || 0),
        count: acc.count + 1,
      }), { reach: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, count: 0 })

      setStats({
        attendeeCount: attendees.length,
        repeatCount,
        repeatRate: attendees.length > 0 ? Math.round(repeatCount / attendees.length * 100) : 0,
        sections,
        wahoos,
        completedWahoos: wahoos.filter(w => w.status === 'completed').length,
        nodeMetrics,
        igTotals,
        igPostCount: igTotals.count,
      })
    } catch (err) {
      console.error('PastExperienceStats error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="pes-loading">Loading stats...</div>
  if (!exp) return <div className="pes-loading">Experience not found</div>

  const revenue = exp.total_revenue ? parseFloat(exp.total_revenue) : null
  const fillRate = exp.capacity && stats.attendeeCount
    ? Math.round(stats.attendeeCount / exp.capacity * 100) : null

  const NODE_CONFIG = [
    {
      key: 'attract', label: 'Attract', icon: '📣', color: '#5e17eb',
      desc: 'How you got the word out',
    },
    {
      key: 'capture', label: 'Capture', icon: '🎯', color: '#7c3aed',
      desc: 'Who showed interest',
    },
    {
      key: 'convert', label: 'Convert', icon: '💰', color: '#E9A23B',
      desc: 'Who bought a ticket',
    },
    {
      key: 'deliver', label: 'Deliver', icon: '🎪', color: '#10b981',
      desc: 'The event itself',
    },
    {
      key: 'grow', label: 'Grow', icon: '🌱', color: '#059669',
      desc: 'What happened after',
    },
  ]

  // Map checklist sections to pipeline nodes
  const sectionToNode = {
    marketing: 'attract',
    awareness: 'attract',
    content: 'attract',
    capture: 'capture',
    sales: 'convert',
    pricing: 'convert',
    organisation: 'deliver',
    delivery: 'deliver',
    followup: 'grow',
    grow: 'grow',
    reflection: 'grow',
  }

  function getNodeData(nodeKey) {
    const checklist = []
    const wahooList = []
    Object.entries(stats.sections || {}).forEach(([section, data]) => {
      if (sectionToNode[section] === nodeKey && data.done > 0) {
        checklist.push({ section, ...data })
      }
    })
    stats.wahoos?.forEach(w => {
      if (w.wahoo_category === nodeKey || (!w.wahoo_category && nodeKey === 'attract')) {
        if (w.status === 'completed') wahooList.push(w)
      }
    })
    const metrics = stats.nodeMetrics?.[nodeKey] || {}
    return { checklist, wahooList, metrics }
  }

  return (
    <div className="pes-container">
      <div className="pes-topbar">
        <button className="pes-back" onClick={onBack}>←</button>
        <div className="pes-title">{exp.name}</div>
        <div className="pes-date">
          {exp.experience_date && new Date(exp.experience_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Hero stats */}
      <div className="pes-hero-grid">
        <div className="pes-hero-stat">
          <div className="pes-hero-value">{stats.attendeeCount}</div>
          <div className="pes-hero-label">Attendees</div>
        </div>
        {revenue != null && (
          <div className="pes-hero-stat">
            <div className="pes-hero-value">${revenue.toLocaleString()}</div>
            <div className="pes-hero-label">Revenue</div>
          </div>
        )}
        {fillRate != null && (
          <div className="pes-hero-stat">
            <div className="pes-hero-value">{fillRate}%</div>
            <div className="pes-hero-label">Fill rate</div>
          </div>
        )}
        <div className="pes-hero-stat">
          <div className="pes-hero-value">{stats.repeatCount}</div>
          <div className="pes-hero-label">Repeat ({stats.repeatRate}%)</div>
        </div>
      </div>

      {/* IG summary if posts exist */}
      {stats.igPostCount > 0 && (
        <div className="pes-ig-bar">
          <span className="pes-ig-label">IG ({stats.igPostCount} posts)</span>
          <span>{stats.igTotals.reach.toLocaleString()} reach</span>
          <span>{stats.igTotals.likes} likes</span>
          <span>{stats.igTotals.shares} shares</span>
        </div>
      )}

      {/* Pipeline nodes — expanded summaries */}
      <div className="pes-nodes">
        {NODE_CONFIG.map(node => {
          const data = getNodeData(node.key)
          const hasContent = data.checklist.length > 0 || data.wahooList.length > 0 || Object.keys(data.metrics).length > 0
          return (
            <div key={node.key} className="pes-node" style={{ '--node-color': node.color }}>
              <div className="pes-node-header">
                <span className="pes-node-icon">{node.icon}</span>
                <div>
                  <div className="pes-node-label">{node.label}</div>
                  <div className="pes-node-desc">{node.desc}</div>
                </div>
              </div>
              {hasContent ? (
                <div className="pes-node-content">
                  {data.checklist.map((cl, i) => (
                    <div key={i} className="pes-node-checklist">
                      <span className="pes-check-icon">✓</span>
                      <span>{cl.section}: {cl.done}/{cl.total} completed</span>
                    </div>
                  ))}
                  {data.wahooList.map((w, i) => (
                    <div key={i} className="pes-node-wahoo">
                      <span className="pes-wahoo-icon">⚡</span>
                      <span>{w.challenge_text}</span>
                    </div>
                  ))}
                  {Object.entries(data.metrics).filter(([k]) => k !== 'method').map(([key, val]) => (
                    <div key={key} className="pes-node-metric">
                      <span className="pes-metric-key">{key.replace(/_/g, ' ')}</span>
                      <span className="pes-metric-val">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pes-node-empty">No data recorded</div>
              )}
            </div>
          )
        })}
      </div>

      {/* 3% improvement note */}
      {exp.three_percent_note && (
        <div className="pes-three-pct">
          <div className="pes-three-pct-label">3% Improvement</div>
          <div className="pes-three-pct-text">{exp.three_percent_note}</div>
        </div>
      )}
    </div>
  )
}
