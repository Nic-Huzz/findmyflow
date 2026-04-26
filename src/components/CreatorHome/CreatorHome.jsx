/**
 * CreatorHome.jsx
 *
 * The Creator Portal home page. Standalone route at /create.
 * Three tabs:
 *   My Business — Product suite, 4-layer assessment, Scope Map position
 *   Experiences — Active experience card + challenges, past experiences with 3% chain
 *   Dashboard — KPIs, 4-layer progress, 3% chain, CRM quick links
 *
 * Head Full of Dreams → Self-Actualisation (the Build phase).
 * /7-day-challenge handles Repair phase (Unfulfilment → Head Full of Dreams).
 *
 * Design: V2 minimal (white header, underline tabs, borderless cards, purple accents)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
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

export default function CreatorHome() {
  const { user } = useAuth()
  const userId = user?.id
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('experiences')
  const [scopeResult, setScopeResult] = useState(null)
  const [creatorSelection, setCreatorSelection] = useState(null)
  const [dnaResult, setDnaResult] = useState(null)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [assessment, setAssessment] = useState(null)
  const [editingAssessment, setEditingAssessment] = useState(false)
  const [assessmentDraft, setAssessmentDraft] = useState(null)
  const [savingAssessment, setSavingAssessment] = useState(false)
  const [loading, setLoading] = useState(true)

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
  const [dashboardKPIs, setDashboardKPIs] = useState({ totalAttendees: 0, repeatRate: 0, totalCosts: 0, totalRevenue: 0 })

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

  // Load dashboard KPIs
  useEffect(() => {
    if (!userId) return
    loadDashboardKPIs()
  }, [userId, completedCount])

  const loadDashboardKPIs = async () => {
    try {
      // Fetch all attendance records, compute unique + repeat from one query
      const { data: attendanceData } = await supabase
        .from('experience_attendees')
        .select('contact_id, experience_id')
        .eq('user_id', userId)

      let uniqueAttendees = 0
      let repeatCount = 0
      if (attendanceData?.length) {
        const contactCounts = {}
        attendanceData.forEach(a => {
          contactCounts[a.contact_id] = (contactCounts[a.contact_id] || 0) + 1
        })
        uniqueAttendees = Object.keys(contactCounts).length
        repeatCount = Object.values(contactCounts).filter(c => c >= 2).length
      }

      const repeatRate = uniqueAttendees > 0 ? Math.round((repeatCount / uniqueAttendees) * 100) : 0

      // Total costs
      const { data: costsData } = await supabase
        .from('experience_costs')
        .select('amount')
        .eq('user_id', userId)

      const totalCosts = (costsData || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)

      setDashboardKPIs({ totalAttendees: uniqueAttendees, repeatRate, totalCosts, totalRevenue: 0 })
    } catch (err) {
      console.error('Dashboard KPIs error:', err)
    }
  }

  const loadCreatorData = async () => {
    setLoading(true)
    try {
      const [{ data: scope }, { data: selection }, { data: dna }, { data: assess }] = await Promise.all([
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
        supabase
          .from('creator_assessments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setScopeResult(scope || null)
      setCreatorSelection(selection || null)
      setDnaResult(dna || null)
      setAssessment(assess || null)
    } catch (err) {
      console.error('CreatorHome loadCreatorData error:', err)
    } finally {
      setLoading(false)
    }
  }

  const stage = STAGES[scopeResult?.stage] || null
  const archetype = creatorSelection?.dominant_archetype || null

  const LAYERS = [
    { key: 'attraction', label: 'Attraction', color: '#8b5cf6' },
    { key: 'core', label: 'Core', color: '#E9A23B' },
    { key: 'scale', label: 'Scale', color: '#10b981' },
    { key: 'continuity', label: 'Continuity', color: '#3b82f6' },
  ]

  const STATUS_LABELS = { have: 'Have it', inconsistent: 'Inconsistent', missing: 'Missing' }
  const STATUS_CLASSES = { have: 'ch-s-have', inconsistent: 'ch-s-working', missing: 'ch-s-missing' }

  const startEditAssessment = () => {
    setAssessmentDraft({
      attraction_status: assessment?.attraction_status || 'missing',
      attraction_detail: assessment?.attraction_detail || '',
      core_status: assessment?.core_status || 'missing',
      core_detail: assessment?.core_detail || '',
      scale_status: assessment?.scale_status || 'missing',
      scale_detail: assessment?.scale_detail || '',
      continuity_status: assessment?.continuity_status || 'missing',
      continuity_detail: assessment?.continuity_detail || '',
    })
    setEditingAssessment(true)
  }

  const updateDraft = (field, value) => {
    setAssessmentDraft(prev => ({ ...prev, [field]: value }))
  }

  const saveAssessment = async () => {
    if (!userId || !assessmentDraft) return
    setSavingAssessment(true)
    try {
      const { error: err } = await supabase
        .from('creator_assessments')
        .insert({ user_id: userId, ...assessmentDraft })

      if (!err) {
        setAssessment({ ...assessmentDraft, user_id: userId })
        setEditingAssessment(false)
        setAssessmentDraft(null)
      }
    } catch (err) {
      console.error('Save assessment error:', err)
    }
    setSavingAssessment(false)
  }

  // 3% chain from past experiences
  const threePercentChain = past
    .filter(e => e.three_percent_note)
    .map((e, i) => ({ num: i + 1, note: e.three_percent_note, name: e.name }))
    .reverse()

  // Gate: redirect to Experience Creator Matching if not completed
  useEffect(() => {
    if (!loading && !expLoading && !creatorSelection && userId) {
      navigate('/experience-creators', { replace: true })
    }
  }, [loading, expLoading, creatorSelection, userId, navigate])

  if (loading || expLoading) {
    return (
      <div className="creator-home">
        <div className="ch-loading">
          <div className="ch-spinner" />
        </div>
      </div>
    )
  }

  // Still waiting for redirect
  if (!creatorSelection) {
    return (
      <div className="creator-home">
        <div className="ch-loading">
          <div className="ch-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="creator-home">

      {/* ═══ HEADER ═══ */}
      <div className="ch-header">
        <div className="ch-header-row">
          <h2 className="ch-title">Creator Portal</h2>
        </div>
        <div className="ch-stats-row">
          <div className="ch-stat">
            <span className="ch-stat-val">{completedCount}</span>
            <span className="ch-stat-label">experiences</span>
          </div>
          <div className="ch-stat">
            <span className="ch-stat-val">{dashboardKPIs.totalAttendees || '—'}</span>
            <span className="ch-stat-label">attendees</span>
          </div>
          <div className="ch-stat">
            <span className="ch-stat-val">{dashboardKPIs.repeatRate ? `${dashboardKPIs.repeatRate}%` : '—'}</span>
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

          {/* ── 1. Where am I on my journey? ── */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">Where am I on my journey?</span>
              {stage && (
                <button className="ch-retake-btn" onClick={() => navigate('/scope-map')}>
                  Retake
                </button>
              )}
            </div>
            {stage ? (
              <div className="ch-rr-row">
                <div className="ch-rr-icon" style={{ background: `${stage.color}10` }}>{stage.icon}</div>
                <div>
                  <div className="ch-rr-name" style={{ color: stage.color }}>{stage.name}</div>
                  <div className="ch-rr-desc">{stage.description}</div>
                </div>
              </div>
            ) : (
              <>
                <p className="ch-empty-text">A 3-question diagnostic to figure out where you are and what to do next.</p>
                <button className="ch-dna-cta" onClick={() => navigate('/scope-map')}>
                  Find Out
                </button>
              </>
            )}
          </div>

          {/* ── 2. How to Pay Rent Now ── */}
          <div className="ch-card" onClick={() => navigate('/create/pay-rent')} style={{ cursor: 'pointer' }}>
            <div className="ch-card-head">
              <span className="ch-card-title">💼 How to Pay Rent Now</span>
            </div>
            <p className="ch-muted-text">How your favourite creators actually funded the early days.</p>
          </div>

          {/* ── 3. How to Blow Up Your Brand ── */}
          <div className="ch-card" onClick={() => navigate('/create/remarkable')} style={{ cursor: 'pointer' }}>
            <div className="ch-card-head">
              <span className="ch-card-title">🔥 How to Blow Up Your Brand</span>
            </div>
            <p className="ch-muted-text">Find your remarkable angle. The thing that makes people talk.</p>
          </div>

          {/* ── 4. How to Scale Your Income ── */}
          <div className="ch-card" onClick={() => navigate('/create/scale-income')} style={{ cursor: 'pointer' }}>
            <div className="ch-card-head">
              <span className="ch-card-title">📈 How to Scale Your Income</span>
            </div>
            <p className="ch-muted-text">Build your 3-layer business model: attraction, core, continuity.</p>
          </div>

          {/* ── 5. How do I work best? ── */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">How do I work best?</span>
              {dnaResult && <span className="ch-badge ch-badge-purple">{dnaResult.archetype}</span>}
            </div>
            {dnaResult ? (
              <>
                <div className="ch-dna-card">
                  <div className="ch-dna-icon">🧬</div>
                  <div>
                    <div className="ch-dna-name">{dnaResult.matched_founder || dnaResult.archetype}</div>
                    <div className="ch-dna-desc">Your work style personalizes how challenges are framed.</div>
                  </div>
                </div>

                {/* Focus this week */}
                <div className="ch-focus-section">
                  <div className="ch-focus-title">Focus this week</div>
                  {activeChallenges.length > 0 ? (
                    <div className="ch-focus-list">
                      {activeChallenges.slice(0, 3).map(ch => {
                        const isDone = ch.status === 'completed'
                        const daysLeft = ch.deadline ? Math.ceil((new Date(ch.deadline) - new Date()) / (24 * 60 * 60 * 1000)) : null
                        return (
                          <div key={ch.id} className="ch-focus-item">
                            <div className={`ch-challenge-dot ${isDone ? 'ch-dot-done' : 'ch-dot-pending'}`} />
                            <span className={`ch-focus-text ${isDone ? 'ch-struck' : ''}`}>{ch.title}</span>
                            {!isDone && daysLeft != null && (
                              <span className={`ch-challenge-due ${daysLeft <= 3 ? 'ch-due-urgent' : ''}`}>{daysLeft}d</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="ch-empty-text" style={{ fontSize: '0.82rem' }}>
                      No active challenges. Convert checklist items with the lightning bolt to set your focus.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="ch-empty-text">Discover how you operate so we can personalize your challenges.</p>
                <button className="ch-dna-cta" onClick={() => navigate('/play-profile')}>
                  Find Out
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

              <button className="ch-btn-sm" onClick={() => navigate(`/create/experience/${activeExp.id}`)}>
                View Checklist →
              </button>
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
                <div className="ch-kpi-val">{dashboardKPIs.totalAttendees || 0}</div>
                <div className="ch-kpi-label">Total Attendees</div>
              </div>
              <div className="ch-kpi">
                <div className="ch-kpi-val">{dashboardKPIs.repeatRate}%</div>
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

          {/* 4-Layer Progress */}
          <div className="ch-card">
            <div className="ch-card-head">
              <span className="ch-card-title">4-Layer Progress</span>
            </div>
            <div className="ch-lp-rows">
              {LAYERS.map(layer => {
                const status = assessment?.[`${layer.key}_status`]
                const pct = status === 'have' ? 100 : status === 'inconsistent' ? 50 : 0
                return (
                  <div key={layer.key} className="ch-lp-row">
                    <span className="ch-lp-name">{layer.label}</span>
                    <div className="ch-lp-bar">
                      <div className="ch-lp-fill" style={{ width: `${pct}%`, background: layer.color }} />
                    </div>
                    <span className="ch-lp-pct">{pct}%</span>
                  </div>
                )
              })}
            </div>
            {!assessment && (
              <p className="ch-empty-text" style={{ marginTop: '0.5rem' }}>Complete your 4-layer assessment to track progress.</p>
            )}
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
                { icon: '🔔', label: 'Facilitator Nudges', route: '/crm/alerts' },
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
