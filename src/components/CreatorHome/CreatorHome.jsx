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
import { ESSENCE_ARCHETYPES } from '../../data/essenceArchetypes'
import { LEVEL_CONFIG } from '../level/LevelConfig'
import MovementHealthDashboard from './MovementHealthDashboard'
import './MovementHealthDashboard.css'
import './CreatorHome.css'

// ─── Stage metadata ────────────────────────────────────────────────────────

const STAGES = {
  stream: { name: 'The Stream', icon: '💧', color: '#6c757d', description: "You're skilled in someone else's channel. Time to find yours." },
  lake: { name: 'The Lake', icon: '🌊', color: '#3b82f6', description: "Self-knowledge is flooding in but hasn't found its edge. Pick one problem. Run one experience." },
  waterfall: { name: 'The Waterfall', icon: '🌊', color: '#10b981', description: "You found your specific thing. Build the evidence base. Stay here longer than you want to." },
  river: { name: 'The River', icon: '🏞️', color: '#E9A23B', description: "Earned breadth. Your specificity became a platform." },
}

// Parse "Current: X | Wrong: Y | Mine: Z" into { current, wrong, mine }
function parseMovement(ruleIdentified) {
  if (!ruleIdentified) return null
  const parts = ruleIdentified.split('|').map(s => s.trim())
  const extract = (prefix) => {
    const part = parts.find(p => p.startsWith(prefix))
    return part ? part.replace(prefix, '').trim() : ''
  }
  const current = extract('Current:')
  const wrong = extract('Wrong:')
  const mine = extract('Mine:')
  if (!current || !wrong || !mine) return null
  return { current, wrong, mine }
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
  const [payRentModel, setPayRentModel] = useState(null)
  const [remarkableAngle, setRemarkableAngle] = useState(null)
  const [topFans, setTopFans] = useState([])
  const [essenceAvatar, setEssenceAvatar] = useState(null)
  const [movementXP, setMovementXP] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [editingRule, setEditingRule] = useState(false)
  const [editingTribe, setEditingTribe] = useState(false)
  const [ruleEdit, setRuleEdit] = useState('')
  const [tribeEdit, setTribeEdit] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [damExpanded, setDamExpanded] = useState(false)
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

  const completedCount = past.length
  const [dashboardKPIs, setDashboardKPIs] = useState({ totalAttendees: 0, repeatRate: 0, totalCosts: 0, totalRevenue: 0 })

  useEffect(() => {
    if (!userId) return
    loadCreatorData()
  }, [userId])

  // Load active challenges
  useEffect(() => {
    if (!userId) return
    fetchCreatorChallenges(userId, null).then(({ data }) => {
      setActiveChallenges(data || [])
    })
  }, [userId])

  // Load dashboard KPIs
  useEffect(() => {
    if (!userId) return
    loadDashboardKPIs()
  }, [userId, completedCount])

  const loadDashboardKPIs = async () => {
    try {
      // Fetch all attendance records, compute unique + repeat from one query
      const { data: attendanceData } = await supabase
        .from('contact_experiences')
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
      const [{ data: scope }, { data: selection }, { data: dna }, { data: assess }, { data: stageProgress }, { data: remarkData }, { data: attendeeRows }, { data: essenceProfile }, { data: xpData }] = await Promise.all([
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
        supabase
          .from('user_stage_progress')
          .select('pay_rent_model, current_journey_level')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('remarkable_angles')
          .select('id, wound_problem, rule_identified, combination_insight, extreme_action_plan, ai_rule_statement, ai_remarkable_bio, ai_tribe_statement')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('contact_experiences')
          .select('contact_id, experience_id')
          .eq('user_id', userId),
        supabase
          .from('lead_flow_profiles')
          .select('essence_archetype, custom_essence_image')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('quest_completions')
          .select('points_earned')
          .eq('user_id', userId)
          .eq('quest_category', 'Movement'),
      ])

      setScopeResult(scope || null)
      setCreatorSelection(selection || null)
      setDnaResult(dna || null)
      setAssessment(assess || null)
      setPayRentModel(stageProgress?.pay_rent_model || null)
      setCurrentLevel(stageProgress?.current_journey_level || 0)
      setRemarkableAngle(remarkData || null)
      setMovementXP((xpData || []).reduce((sum, row) => sum + (row.points_earned || 0), 0))

      // Resolve essence archetype avatar
      if (essenceProfile?.essence_archetype) {
        const arch = ESSENCE_ARCHETYPES.find(a => a.name === essenceProfile.essence_archetype)
        if (arch) {
          setEssenceAvatar({
            name: arch.name,
            image: essenceProfile.custom_essence_image || arch.image,
          })
        }
      }

      // Compute top fans (contacts attending 2+ experiences)
      if (attendeeRows?.length) {
        const counts = {}
        attendeeRows.forEach(a => {
          if (a.contact_id) counts[a.contact_id] = (counts[a.contact_id] || 0) + 1
        })
        const repeatContactIds = Object.entries(counts)
          .filter(([, c]) => c >= 2)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id, count]) => ({ id, count }))
        if (repeatContactIds.length) {
          const { data: contactNames, error: fanErr } = await supabase
            .from('crm_contacts')
            .select('id, name, email')
            .in('id', repeatContactIds.map(r => r.id))
          if (fanErr) console.error('Top fans lookup failed:', fanErr)
          const fans = repeatContactIds.map(r => {
            const contact = contactNames?.find(c => c.id === r.id)
            return { id: r.id, name: contact?.name || contact?.email || 'Unknown', count: r.count }
          }).filter(f => f.name !== 'Unknown')
          setTopFans(fans)
        }
      }
    } catch (err) {
      console.error('CreatorHome loadCreatorData error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save edited AI distillation
  const saveAiField = async (field, value) => {
    if (!remarkableAngle || !userId) return
    try {
      await supabase.from('remarkable_angles')
        .update({ [field]: value })
        .eq('id', remarkableAngle.id || '')
        .eq('user_id', userId)
      setRemarkableAngle(prev => ({ ...prev, [field]: value }))
    } catch (err) {
      console.error('Save AI field error:', err)
    }
  }

  // Regenerate AI distillations
  const regenerateAi = async () => {
    if (!remarkableAngle || regenerating) return
    setRegenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-remarkable-angle', {
        body: {
          wound_problem: remarkableAngle.wound_problem,
          rule_identified: remarkableAngle.rule_identified,
          combination_insight: remarkableAngle.combination_insight || '',
          extreme_action_plan: remarkableAngle.extreme_action_plan || '',
        },
      })
      if (error) throw error
      if (data?.rule_statement) {
        await saveAiField('ai_rule_statement', data.rule_statement)
      }
      if (data?.tribe_statement) {
        await saveAiField('ai_tribe_statement', data.tribe_statement)
      }
    } catch (err) {
      console.error('Regenerate error:', err)
    }
    setRegenerating(false)
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
      <div className="ch-header ch-header-branded">
        <div className="ch-header-top">
          <h2 className="ch-title">Movement Maker</h2>
          {essenceAvatar && (
            <img
              className="ch-essence-avatar"
              src={essenceAvatar.image}
              alt={essenceAvatar.name}
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
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
            <span className="ch-stat-val ch-stat-gold">{movementXP}</span>
            <span className="ch-stat-label">movement xp</span>
          </div>
        </div>
        <div className="ch-xp-meta">
          <span>Level {currentLevel}: {LEVEL_CONFIG[currentLevel]?.name || 'Getting Set Up'}</span>
          <span>{movementXP} total RP</span>
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
              <>
                <div className="ch-rr-row">
                  <div className="ch-rr-icon" style={{ background: `${stage.color}10` }}>{stage.icon}</div>
                  <div>
                    <div className="ch-rr-name" style={{ color: stage.color }}>{stage.name}</div>
                    <div className="ch-rr-desc">{stage.description}</div>
                  </div>
                </div>
                {scopeResult?.positioning_statement && (
                  <div className="ch-positioning">
                    <div className="ch-positioning-label">Your positioning</div>
                    <div className="ch-positioning-text">{scopeResult.positioning_statement}</div>
                  </div>
                )}
              </>
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
              <span className="ch-card-title"><span className="ch-card-emoji">💼</span> How to Pay Rent Now</span>
              {payRentModel && <span className="ch-badge ch-badge-gold">Done</span>}
            </div>
            {payRentModel ? (
              <div className="ch-rr-row">
                <div className="ch-rr-icon" style={{ background: 'rgba(233,162,59,0.1)' }}>
                  {payRentModel === 'day_job_side_project' ? '💼' : payRentModel === 'one_on_one_service' ? '🤝' : payRentModel === 'free_events_paid_elsewhere' ? '🎁' : payRentModel === 'small_group_paid' ? '🎪' : '🏛️'}
                </div>
                <div>
                  <div className="ch-rr-name" style={{ color: '#E9A23B' }}>
                    {payRentModel === 'day_job_side_project' ? 'Day Job + Side Project' : payRentModel === 'one_on_one_service' ? '1:1 Service' : payRentModel === 'free_events_paid_elsewhere' ? 'Free Events, Paid Elsewhere' : payRentModel === 'small_group_paid' ? 'Small Group Paid Events' : 'Institutional Salary'}
                  </div>
                  <div className="ch-rr-desc">Your early revenue model</div>
                </div>
              </div>
            ) : (
              <p className="ch-muted-text">How your favourite creators actually funded the early days.</p>
            )}
          </div>

          {/* ── 3. How to Blow Up Your Brand / My Movement ── */}
          {remarkableAngle && parseMovement(remarkableAngle.rule_identified) ? (() => {
            const mv = parseMovement(remarkableAngle.rule_identified)
            return (
              <div className="ch-card ch-movement-card">
                <div className="ch-card-head">
                  <span className="ch-card-title"><span className="ch-card-emoji">🔥</span> How to Blow Up Your Brand</span>
                  <button className="ch-retake-btn" onClick={() => navigate('/create/remarkable')}>Refine</button>
                </div>
                <div className="ch-mv-subheading">My Movement</div>

                {/* One-liner — always visible */}
                {remarkableAngle.ai_rule_statement && (
                  <div className="ch-mv-oneliner">
                    <div className="ch-mv-dam-label-row">
                      <span className="ch-mv-dam-label">Your one-liner</span>
                      {!editingRule && (
                        <button className="ch-mv-inline-btn" onClick={() => { setRuleEdit(remarkableAngle.ai_rule_statement); setEditingRule(true) }}>edit</button>
                      )}
                    </div>
                    {editingRule ? (
                      <div className="ch-mv-edit-row">
                        <textarea
                          className="ch-mv-edit-input"
                          value={ruleEdit}
                          onChange={e => setRuleEdit(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="ch-mv-edit-actions">
                          <button className="ch-mv-edit-save" onClick={async () => { await saveAiField('ai_rule_statement', ruleEdit); setEditingRule(false) }}>Save</button>
                          <button className="ch-mv-edit-cancel" onClick={() => setEditingRule(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="ch-mv-ai-rule">{remarkableAngle.ai_rule_statement}</div>
                    )}
                  </div>
                )}

                {/* Collapsible: Q1/Q2/Q3 + pitch + tribe */}
                <button className="ch-mv-expand-btn" onClick={() => setDamExpanded(!damExpanded)}>
                  {damExpanded ? 'Less' : 'See more'} {damExpanded ? '▴' : '▾'}
                </button>

                {damExpanded && (
                  <div className="ch-mv-expanded">
                    <div className="ch-mv-section">
                      <div className="ch-mv-label">The world solves this with</div>
                      <div className="ch-mv-answer">{mv.current}</div>
                    </div>
                    <div className="ch-mv-section">
                      <div className="ch-mv-label">What's wrong with that</div>
                      <div className="ch-mv-answer">{mv.wrong}</div>
                    </div>
                    <div className="ch-mv-section">
                      <div className="ch-mv-label">How I solve it</div>
                      <div className="ch-mv-answer ch-mv-mine">{mv.mine}</div>
                    </div>

                    <div className="ch-mv-section">
                      <div className="ch-mv-dam-label">Your pitch</div>
                      <div className="ch-mv-dam-text">
                        You think you need {mv.current.toLowerCase().endsWith('.') ? mv.current.slice(0, -1).toLowerCase() : mv.current.toLowerCase()}. But {mv.wrong.charAt(0).toLowerCase() + mv.wrong.slice(1).replace(/\.$/, '')}. What you actually need is {mv.mine.toLowerCase().replace(/\.$/, '')}.
                      </div>
                    </div>

                    {remarkableAngle.ai_tribe_statement && (
                      <div className="ch-mv-section">
                        <div className="ch-mv-dam-label-row">
                          <span className="ch-mv-tribe-label">Your tribe</span>
                          {!editingTribe && (
                            <button className="ch-mv-inline-btn" onClick={() => { setTribeEdit(remarkableAngle.ai_tribe_statement); setEditingTribe(true) }}>edit</button>
                          )}
                        </div>
                        {editingTribe ? (
                          <div className="ch-mv-edit-row">
                            <textarea
                              className="ch-mv-edit-input"
                              value={tribeEdit}
                              onChange={e => setTribeEdit(e.target.value)}
                              rows={2}
                              autoFocus
                            />
                            <div className="ch-mv-edit-actions">
                              <button className="ch-mv-edit-save" onClick={async () => { await saveAiField('ai_tribe_statement', tribeEdit); setEditingTribe(false) }}>Save</button>
                              <button className="ch-mv-edit-cancel" onClick={() => setEditingTribe(false)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="ch-mv-ai-tribe">{remarkableAngle.ai_tribe_statement}</div>
                        )}
                      </div>
                    )}

                    <div className="ch-mv-dam-actions">
                      <button
                        className="ch-mv-action-btn ch-mv-action-regen"
                        onClick={regenerateAi}
                        disabled={regenerating}
                      >
                        {regenerating ? 'Regenerating...' : 'Regenerate both'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })() : (
            <div className="ch-card" onClick={() => navigate('/create/remarkable')} style={{ cursor: 'pointer' }}>
              <div className="ch-card-head">
                <span className="ch-card-title"><span className="ch-card-emoji">🔥</span> How to Blow Up Your Brand</span>
              </div>
              <p className="ch-muted-text">Find your remarkable angle. The thing that makes people talk.</p>
            </div>
          )}

          {/* ── 4. How to Scale Your Income ── */}
          <div className="ch-card" onClick={() => navigate('/create/scale-income')} style={{ cursor: 'pointer' }}>
            <div className="ch-card-head">
              <span className="ch-card-title"><span className="ch-card-emoji">📈</span> How to Scale Your Income</span>
              {assessment && <span className="ch-badge ch-badge-gold">Done</span>}
            </div>
            {assessment ? (
              <div style={{ fontSize: '0.82rem', color: '#6c757d', lineHeight: 1.5 }}>
                <div><strong style={{ color: '#8b5cf6' }}>Attraction:</strong> {assessment.attraction_detail || 'Not set'}</div>
                <div><strong style={{ color: '#E9A23B' }}>Core:</strong> {assessment.core_detail || 'Not set'}</div>
                <div><strong style={{ color: '#3b82f6' }}>Continuity:</strong> {assessment.continuity_detail || 'Not set'}</div>
              </div>
            ) : (
              <p className="ch-muted-text">Build your 3-layer business model: attraction, core, continuity.</p>
            )}
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
          {/* Upcoming experiences */}
          {upcoming.length > 0 ? upcoming.map(exp => (
            <div key={exp.id} className="ch-card ch-exp-card">
              <div className="ch-card-head">
                <span className="ch-card-title">{exp.name}</span>
                {exp.experience_date && (
                  <span className="ch-badge ch-badge-gold">
                    {formatExperienceDate(exp.experience_date)}
                  </span>
                )}
              </div>
              <div className="ch-exp-meta">
                {(() => { const cd = countdownLabel(exp.experience_date); return cd && <span><strong>{cd}</strong> away</span> })()}
                {exp.experience_type && (
                  <span>🎪 {exp.experience_type}</span>
                )}
              </div>

              {/* Active challenges for this experience */}
              {activeChallenges.filter(c => c.experience_id === exp.id).length > 0 && (
                <>
                  <div className="ch-challenges-header">
                    <span>This Fortnight's Challenges</span>
                    <span style={{ color: '#E9A23B' }}>
                      {activeChallenges.filter(c => c.experience_id === exp.id && c.status === 'completed').length}/{activeChallenges.filter(c => c.experience_id === exp.id).length}
                    </span>
                  </div>
                  {activeChallenges.filter(c => c.experience_id === exp.id).slice(0, 5).map(ch => {
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

              <button className="ch-btn-sm" onClick={() => navigate(`/create/experience/${exp.id}`)}>
                View Checklist →
              </button>

              {/* Strikes linked to this experience */}
              {activeChallenges.filter(c => c.challenge_source === 'strike' && c.experience_id === exp.id).length > 0 && (
                <div className="ch-strikes-section">
                  <div className="ch-strikes-label">Active Wahoos</div>
                  {activeChallenges.filter(c => c.challenge_source === 'strike' && c.experience_id === exp.id).map(ch => {
                    const isDone = ch.status === 'completed'
                    const daysLeft = ch.deadline ? Math.ceil((new Date(ch.deadline) - new Date()) / (24 * 60 * 60 * 1000)) : null
                    return (
                      <div key={ch.id} className="ch-strike-item">
                        <span className="ch-strike-icon">{isDone ? '✓' : '🔥'}</span>
                        <span className={`ch-strike-text ${isDone ? 'ch-struck' : ''}`}>{ch.title}</span>
                        <span className={`ch-strike-due ${isDone ? 'ch-strike-done' : ''}`}>
                          {isDone ? 'done' : daysLeft != null ? `${daysLeft}d` : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )) : (
            <div className="ch-card">
              <div className="ch-empty-text">No upcoming experience. Create one to get started.</div>
            </div>
          )}

          {/* Group Call — Coming Soon */}
          <div className="ch-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div className="ch-card-head">
              <span className="ch-card-title">Group Call</span>
              <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming soon</span>
            </div>
            <p className="ch-muted-text" style={{ marginBottom: 0 }}>Fortnightly call with your cohort. Design Wahoos, set commitments, debrief what worked.</p>
          </div>

          {/* Past experiences */}
          {past.length > 0 && (
            <div className="ch-card">
              <div className="ch-card-head">
                <span className="ch-card-title">Past Experiences</span>
              </div>
              {past.slice(0, 5).map(exp => (
                <div key={exp.id} className="ch-past-item">
                  <div
                    className="ch-past-main"
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
                  <button
                    className="ch-run-again-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/create/experience/new?from=${exp.id}`) }}
                  >
                    Run Again
                  </button>
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

          {/* Top Fans (Superconsumers) */}
          {topFans.length > 0 && (
            <div className="ch-card">
              <div className="ch-card-head">
                <span className="ch-card-title">Your Top Fans</span>
                <span className="ch-muted-text">{topFans.length} repeat{topFans.length !== 1 ? 's' : ''}</span>
              </div>
              <p className="ch-fan-intro">These people keep coming back. Design your next experience for them.</p>
              {topFans.map(fan => (
                <div key={fan.id} className="ch-fan-row">
                  <div className="ch-fan-avatar">{fan.name.charAt(0).toUpperCase()}</div>
                  <div className="ch-fan-info">
                    <div className="ch-fan-name">{fan.name}</div>
                    <div className="ch-fan-count">{fan.count} experiences attended</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Movement Health / Trajectory */}
          <MovementHealthDashboard
            userId={userId}
            completedExperiences={past}
            dashboardKPIs={dashboardKPIs}
          />

          {/* Quick Access — locked for now */}
          <div className="ch-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div className="ch-card-head">
              <span className="ch-card-title">Quick Access</span>
              <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coming soon</span>
            </div>
            <div className="ch-crm-links">
              {[
                { icon: '👥', label: 'Attendees' },
                { icon: '📧', label: 'Follow-up Sequences' },
                { icon: '📣', label: 'Marketing Assets' },
                { icon: '🔔', label: 'Facilitator Nudges' },
              ].map(link => (
                <div key={link.label} className="ch-crm-link">
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
