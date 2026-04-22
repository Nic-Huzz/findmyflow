/**
 * CreatorHome.jsx
 *
 * The Creator Portal home page. Three tabs:
 *   My Business — Product suite, 4-layer assessment, Scope Map position
 *   Experiences — Active experience card + challenges, past experiences with 3% chain
 *   Dashboard — KPIs, 4-layer progress, 3% chain, CRM quick links
 *
 * Renders inside the Create tab in Challenge.jsx.
 * First-time users without a Scope Map result see ScopeMapFlow via ExperienceCatalog.
 *
 * Design: V2 minimal (white header, underline tabs, borderless cards, purple accents)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useExperienceList, daysUntil, formatExperienceDate } from '../../hooks/useExperienceData'
import { fetchCreatorChallenges } from '../../lib/checklistChallengeService'
import './CreatorHome.css'

// ─── Stage metadata ────────────────────────────────────────────────────────

const STAGES = {
  stream: { name: 'The Stream', icon: '💧', color: '#6c757d', description: "You're skilled in someone else's channel. Time to find yours." },
  lake: { name: 'The Lake', icon: '🌊', color: '#3b82f6', description: "Self-knowledge is flooding in but hasn't found its edge. Pick one problem. Run one experience." },
  waterfall: { name: 'The Waterfall', icon: '🌊', color: '#10b981', description: "You found your specific thing. Build the evidence base. Stay here longer than you want to." },
  river: { name: 'The River', icon: '🏞️', color: '#E9A23B', description: "Earned breadth. Your specificity became a platform." },
}

function countdownLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return null
  if (d > 1) return `${d} days`
  if (d === 1) return 'Tomorrow'
  if (d === 0) return 'Today'
  return null
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CreatorHome({ userId }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('experiences')
  const [scopeResult, setScopeResult] = useState(null)
  const [creatorSelection, setCreatorSelection] = useState(null)
  const [dnaResult, setDnaResult] = useState(null)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [loading, setLoading] = useState(false)

  const { experiences, loading: expLoading } = useExperienceList()

  const upcoming = experiences.filter(e => e.status === 'upcoming')
  const past = experiences
    .filter(e => e.status === 'completed' || e.status === 'archived')
    .sort((a, b) => {
      const da = a.experience_date || a.updated_at || a.created_at
      const db = b.experience_date || b.updated_at || b.created_at
      return new Date(db || 0) - new Date(da || 0)
    })

  const activeExp = upcoming[0] || null
  const completedCount = past.length
  const totalAttendees = '—' // Phase 4: wire to CRM
  const repeatRate = '—' // Phase 4: wire to CRM

  useEffect(() => {
    if (!userId) return
    loadCreatorData()
  }, [userId])

  // Load active challenges
  useEffect(() => {
    if (!userId) return
    fetchCreatorChallenges(userId, activeExp?.id || null).then(({ data }) => {
      setActiveChallenges(data || [])
    })
  }, [userId, activeExp?.id])

  const loadCreatorData = async () => {
    setLoading(true)
    try {
      const [{ data: scope }, { data: selection }, { data: dna }] = await Promise.all([
        supabase
          .from('scope_map_results')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('experience_creator_selections')
          .select('dominant_archetype, product_suite')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('founder_dna_results')
          .select('dna_code, archetype, matched_founder')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setScopeResult(scope || null)
      setCreatorSelection(selection || null)
      setDnaResult(dna || null)
    } catch (err) {
      console.error('CreatorHome loadCreatorData error:', err)
    } finally {
      setLoading(false)
    }
  }

  const stage = STAGES[scopeResult?.stage] || null
  const archetype = creatorSelection?.dominant_archetype || null

  // 3% chain from past experiences
  const threePercentChain = past
    .filter(e => e.three_percent_note)
    .map((e, i) => ({ num: i + 1, note: e.three_percent_note, name: e.name }))
    .reverse()

  if (loading || expLoading) {
    return (
      <div className="ch-loading">
        <div className="ch-spinner" />
      </div>
    )
  }

  return (
    <div className="creator-home">

      {/* ═══ HEADER ═══ */}
      <div className="ch-header">
        <div className="ch-header-row">
          <h2 className="ch-title">Create</h2>
          {stage && (
            <span className="ch-stage-badge" style={{ color: stage.color, background: `${stage.color}12` }}>
              {stage.icon} {stage.name}
            </span>
          )}
        </div>
        <div className="ch-stats-row">
          <div className="ch-stat">
            <span className="ch-stat-val">{completedCount}</span>
            <span className="ch-stat-label">experiences</span>
          </div>
          <div className="ch-stat">
            <span className="ch-stat-val">{totalAttendees}</span>
            <span className="ch-stat-label">attendees</span>
          </div>
          <div className="ch-stat">
            <span className="ch-stat-val">{repeatRate}</span>
            <span className="ch-stat-label">repeat</span>
          </div>
          <div className="ch-stat">
            <span className="ch-stat-val">{threePercentChain.length}/{completedCount || 0}</span>
            <span className="ch-stat-label">3%</span>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="ch-tabs">
        {['My Business', 'Experiences', 'Dashboard'].map(tab => {
          const key = tab.toLowerCase().replace(/\s+/g, '-')
          return (
            <button
              key={key}
              className={`ch-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ═══ MY BUSINESS ═══ */}
      {activeTab === 'my-business' && (
        <div className="ch-section">
          {/* Product Suite */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">Product Suite</span>
              {archetype && <span className="ch-badge ch-badge-purple">{archetype}</span>}
            </div>
            <div className="ch-suite-layers">
              <div className="ch-suite-layer">
                <div className="ch-suite-dot" style={{ background: '#8b5cf6' }} />
                <span className="ch-suite-name">Attraction</span>
                <span className="ch-suite-value">—</span>
                <span className="ch-suite-status ch-s-missing">Not set</span>
              </div>
              <div className="ch-suite-layer">
                <div className="ch-suite-dot" style={{ background: '#E9A23B' }} />
                <span className="ch-suite-name">Core</span>
                <span className="ch-suite-value">—</span>
                <span className="ch-suite-status ch-s-missing">Not set</span>
              </div>
              <div className="ch-suite-layer">
                <div className="ch-suite-dot" style={{ background: '#10b981' }} />
                <span className="ch-suite-name">Scale</span>
                <span className="ch-suite-value">—</span>
                <span className="ch-suite-status ch-s-missing">Not set</span>
              </div>
              <div className="ch-suite-layer">
                <div className="ch-suite-dot" style={{ background: '#3b82f6' }} />
                <span className="ch-suite-name">Continuity</span>
                <span className="ch-suite-value">—</span>
                <span className="ch-suite-status ch-s-missing">Not set</span>
              </div>
            </div>
            <button className="ch-edit-btn">Set Up Assessment</button>
          </div>

          {/* Scope Map Position */}
          {stage && (
            <div className="ch-card">
              <div className="ch-card-head">
                <span className="ch-card-title">Your Position</span>
              </div>
              <div className="ch-rr-row">
                <div className="ch-rr-icon" style={{ background: `${stage.color}10` }}>{stage.icon}</div>
                <div>
                  <div className="ch-rr-name" style={{ color: stage.color }}>{stage.name}</div>
                  <div className="ch-rr-desc">{stage.description}</div>
                </div>
              </div>
            </div>
          )}

          {!stage && (
            <div className="ch-card">
              <div className="ch-card-head">
                <span className="ch-card-title">Your Position</span>
              </div>
              <p className="ch-empty-text">Complete the Scope Map diagnostic to see where you are.</p>
            </div>
          )}

          {/* Play Profile */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">Work Style</span>
              {dnaResult && <span className="ch-badge ch-badge-purple">{dnaResult.archetype}</span>}
            </div>
            {dnaResult ? (
              <div className="ch-dna-card">
                <div className="ch-dna-icon">🧬</div>
                <div>
                  <div className="ch-dna-name">{dnaResult.matched_founder || dnaResult.archetype}</div>
                  <div className="ch-dna-desc">Your work style personalizes how challenges are framed.</div>
                </div>
              </div>
            ) : (
              <>
                <p className="ch-empty-text">Discover your work style to get personalized challenges.</p>
                <button className="ch-dna-cta" onClick={() => navigate('/play-profile')}>
                  Discover Your Work Style
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ EXPERIENCES ═══ */}
      {activeTab === 'experiences' && (
        <div className="ch-section">
          {/* Active experience */}
          {activeExp && (
            <div className="ch-card ch-exp-card">
              <div className="ch-card-head">
                <span className="ch-card-title">{activeExp.name}</span>
                {activeExp.experience_date && (
                  <span className="ch-badge ch-badge-gold">
                    {formatExperienceDate(activeExp.experience_date)}
                  </span>
                )}
              </div>
              <div className="ch-exp-meta">
                {(() => { const cd = countdownLabel(activeExp.experience_date); return cd && <span><strong>{cd}</strong> away</span> })()}
                {activeExp.experience_type && (
                  <span>🎪 {activeExp.experience_type}</span>
                )}
              </div>

              {/* Active challenges */}
              {activeChallenges.length > 0 && (
                <>
                  <div className="ch-challenges-header">
                    <span>This Fortnight's Challenges</span>
                    <span style={{ color: '#E9A23B' }}>
                      {activeChallenges.filter(c => c.status === 'completed').length}/{activeChallenges.length}
                    </span>
                  </div>
                  {activeChallenges.slice(0, 5).map(ch => {
                    const isDone = ch.status === 'completed'
                    const isUrgent = ch.deadline && new Date(ch.deadline) - new Date() < 3 * 24 * 60 * 60 * 1000
                    const daysLeft = ch.deadline ? Math.ceil((new Date(ch.deadline) - new Date()) / (24 * 60 * 60 * 1000)) : null
                    return (
                      <div key={ch.id} className="ch-challenge-item">
                        <div className={`ch-challenge-dot ${isDone ? 'ch-dot-done' : 'ch-dot-pending'}`} />
                        <span className={`ch-challenge-text ${isDone ? 'ch-struck' : ''}`}>{ch.title}</span>
                        <span className={`ch-challenge-due ${isUrgent ? 'ch-due-urgent' : ''}`}>
                          {isDone ? 'done' : daysLeft != null ? `${daysLeft}d` : ''}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}

              <div className="ch-exp-btns">
                <button className="ch-btn-primary" onClick={() => navigate(`/create/experience/${activeExp.id}`)}>
                  View Checklist
                </button>
                <button className="ch-btn-secondary" onClick={() => navigate(`/create/experience/${activeExp.id}`)}>
                  + Add Challenge
                </button>
              </div>
            </div>
          )}

          {/* No active experience */}
          {!activeExp && (
            <div className="ch-card">
              <div className="ch-empty-text">No upcoming experience. Create one to get started.</div>
            </div>
          )}

          {/* Past experiences */}
          {past.length > 0 && (
            <div className="ch-card">
              <div className="ch-card-head">
                <span className="ch-card-title">Past Experiences</span>
              </div>
              {past.slice(0, 5).map(exp => (
                <div
                  key={exp.id}
                  className="ch-past-item"
                  onClick={() => navigate(`/create/experience/${exp.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="ch-past-chk">&#10003;</span>
                  <div>
                    <div className="ch-past-name">{exp.name}</div>
                    <div className="ch-past-date">
                      {formatExperienceDate(exp.experience_date)}
                    </div>
                    {exp.three_percent_note && (
                      <div className="ch-past-3pct">3%: "{exp.three_percent_note}"</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="ch-new-btn" onClick={() => navigate('/create/experience/new')}>
            + New Experience
          </button>
        </div>
      )}

      {/* ═══ DASHBOARD ═══ */}
      {activeTab === 'dashboard' && (
        <div className="ch-section">
          {/* KPIs */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">Key Metrics</span>
              <span className="ch-muted-text">Last 90 days</span>
            </div>
            <div className="ch-kpi-grid">
              <div className="ch-kpi">
                <div className="ch-kpi-val">{totalAttendees}</div>
                <div className="ch-kpi-label">Total Attendees</div>
              </div>
              <div className="ch-kpi">
                <div className="ch-kpi-val">{repeatRate}</div>
                <div className="ch-kpi-label">Repeat Rate</div>
              </div>
              <div className="ch-kpi">
                <div className="ch-kpi-val">{completedCount}</div>
                <div className="ch-kpi-label">Experiences Run</div>
              </div>
              <div className="ch-kpi">
                <div className="ch-kpi-val">{threePercentChain.length}/{completedCount || 0}</div>
                <div className="ch-kpi-label">3% Implemented</div>
              </div>
            </div>
          </div>

          {/* 4-Layer Progress - placeholder until assessment exists */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">4-Layer Progress</span>
            </div>
            <div className="ch-lp-rows">
              {[
                { name: 'Attraction', color: '#8b5cf6', pct: 0 },
                { name: 'Core', color: '#E9A23B', pct: 0 },
                { name: 'Scale', color: '#10b981', pct: 0 },
                { name: 'Continuity', color: '#3b82f6', pct: 0 },
              ].map(layer => (
                <div key={layer.name} className="ch-lp-row">
                  <span className="ch-lp-name">{layer.name}</span>
                  <div className="ch-lp-bar">
                    <div className="ch-lp-fill" style={{ width: `${layer.pct}%`, background: layer.color }} />
                  </div>
                  <span className="ch-lp-pct">{layer.pct}%</span>
                </div>
              ))}
            </div>
            <p className="ch-empty-text" style={{ marginTop: '0.5rem' }}>Complete your 4-layer assessment to track progress.</p>
          </div>

          {/* 3% Chain */}
          {threePercentChain.length > 0 && (
            <div className="ch-card ch-chain-card">
              <div className="ch-chain-title">3% Improvement Chain</div>
              {threePercentChain.map(item => (
                <div key={item.num} className="ch-chain-item">
                  <span className="ch-chain-num">{item.num}.</span>
                  <span>{item.note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Access */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">Quick Access</span>
            </div>
            <div className="ch-crm-links">
              {[
                { icon: '👥', label: 'Attendees', route: '/crm/contacts' },
                { icon: '📧', label: 'Follow-up Sequences', route: '/crm/email-sequences' },
                { icon: '📣', label: 'Marketing Assets', route: '/crm/content/create' },
                { icon: '🔔', label: 'Facilitator Nudges', route: '/crm/smart-alerts' },
              ].map(link => (
                <div key={link.route} className="ch-crm-link" onClick={() => navigate(link.route)}>
                  <div className="ch-crm-left">
                    <span className="ch-crm-icon">{link.icon}</span>
                    <span className="ch-crm-label">{link.label}</span>
                  </div>
                  <span className="ch-crm-arrow">&#8250;</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
