/**
 * CreatorHomeV2.jsx — /create
 *
 * Dark-themed Creator Portal with 3 tabs:
 *   Identity — Creator Card (holographic, shareable)
 *   Experiences — Upcoming + create + past with 3% chain
 *   Growth — KPIs, 3% chain, top fans, trajectory
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { useExperienceList, daysUntil } from '../../hooks/useExperienceData'
import { fetchCreatorChallenges } from '../../lib/checklistChallengeService'
import { ESSENCE_ARCHETYPES } from '../../data/essenceArchetypes'
import './CreatorHomeV2.css'

// ─── Constants ─────────────────────────────────────────────────────────────

const SCOPE_FOCUS = {
  stream: 'Get specific. Pick one problem.',
  lake: 'Pick one experience. Run it this month.',
  waterfall: 'Build evidence. Stay specific.',
  river: 'Earned breadth. Build the platform.',
}

const ARCHETYPE_LABELS = {
  workshop: 'Workshop Creator',
  performance: 'Live Events Creator',
  cohort: 'Cohort Creator',
  books_media: 'Content Creator',
  facilitation: 'Facilitator',
  retreats: 'Retreat Creator',
}

const PAY_RENT_LABELS = {
  day_job_side_project: 'Day Job + Side Project',
  one_on_one_service: '1:1 Service',
  free_events_paid_elsewhere: 'Free Events, Paid Elsewhere',
  small_group_paid: 'Small Group Paid Events',
  institutional_salary: 'Institutional Salary',
}

function parseRuleBreak(ruleIdentified) {
  if (!ruleIdentified) return null
  const parts = ruleIdentified.split('|').map(s => s.trim())
  const extract = (prefix) => {
    const part = parts.find(p => p.startsWith(prefix))
    return part ? part.replace(prefix, '').trim() : ''
  }
  return {
    current: extract('Current:'),
    wrong: extract('Wrong:'),
    mine: extract('Mine:'),
  }
}

function countdownLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null || d < 0) return null
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `${d} days`
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CreatorHomeV2() {
  const { user } = useAuth()
  const userId = user?.id
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('identity')
  const [loading, setLoading] = useState(true)

  // Data
  const [scopeResult, setScopeResult] = useState(null)
  const [creatorSelection, setCreatorSelection] = useState(null)
  const [dnaResult, setDnaResult] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [payRentModel, setPayRentModel] = useState(null)
  const [remarkableAngle, setRemarkableAngle] = useState(null)
  const [essenceAvatar, setEssenceAvatar] = useState(null)
  const [essenceName, setEssenceName] = useState(null)
  const [userSkills, setUserSkills] = useState([])
  const [userProblems, setUserProblems] = useState([])
  const [topFans, setTopFans] = useState([])
  const [movementXP, setMovementXP] = useState(0)

  // Set dark theme on body for BottomToolbar styling, clean up on unmount
  useEffect(() => {
    document.body.setAttribute('data-theme', 'dark')
    return () => document.body.removeAttribute('data-theme')
  }, [])

  const { experiences, loading: expLoading } = useExperienceList()

  const upcoming = experiences.filter(e => e.status === 'upcoming')
  const past = experiences
    .filter(e => e.status === 'completed' || e.status === 'archived')
    .sort((a, b) => new Date(b.experience_date || b.updated_at || 0) - new Date(a.experience_date || a.updated_at || 0))

  const [dashboardKPIs, setDashboardKPIs] = useState({ totalAttendees: 0, repeatRate: 0 })
  const [checklistCounts, setChecklistCounts] = useState({})
  const [activePlays, setActivePlays] = useState([])

  // ── Load all data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    loadData()
    fetchCreatorChallenges(userId, null).then(({ data }) => setActivePlays(data || []))
  }, [userId])

  // KPIs computed inside loadData from the same attendeeRows fetch

  // Fetch checklist progress for upcoming experiences
  const upcomingIds = upcoming.map(e => e.id).join(',')
  useEffect(() => {
    if (!upcomingIds || !userId) return
    const ids = upcomingIds.split(',')
    ;(async () => {
      const { data } = await supabase
        .from('experience_checklist_items')
        .select('experience_id, section, completed')
        .eq('user_id', userId)
        .in('experience_id', ids)
      if (!data) return
      const counts = {}
      data.forEach(item => {
        if (!counts[item.experience_id]) counts[item.experience_id] = {}
        if (!counts[item.experience_id][item.section]) counts[item.experience_id][item.section] = { total: 0, done: 0 }
        counts[item.experience_id][item.section].total++
        if (item.completed) counts[item.experience_id][item.section].done++
      })
      setChecklistCounts(counts)
    })()
  }, [upcomingIds, userId])

  async function loadData() {
    setLoading(true)
    try {
      const [
        { data: scope },
        { data: selection },
        { data: dna },
        { data: assess },
        { data: stageProgress },
        { data: remarkData },
        { data: attendeeRows },
        { data: essenceProfile },
        { data: xpData },
        { data: skillsData },
        { data: problemsData },
      ] = await Promise.all([
        supabase.from('scope_map_results').select('stage').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('experience_creator_selections').select('dominant_archetype, product_suite, selected_creators').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('founder_dna_results').select('dna_code, archetype, matched_founder').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('creator_assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('user_stage_progress').select('pay_rent_model, current_journey_level, hero_avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('remarkable_angles').select('id, wound_problem, rule_identified, combination_insight, extreme_action_plan, ai_rule_statement, ai_tribe_statement').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('experience_attendees').select('contact_id, experience_id').eq('user_id', userId),
        supabase.from('lead_flow_profiles').select('essence_archetype, custom_essence_image').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('quest_completions').select('points_earned').eq('user_id', userId).eq('quest_category', 'Movement'),
        supabase.from('nikigai_clusters').select('cluster_label').eq('user_id', userId).eq('cluster_type', 'skills'),
        supabase.from('nikigai_clusters').select('cluster_label').eq('user_id', userId).eq('cluster_type', 'problems'),
      ])

      setScopeResult(scope || null)
      setCreatorSelection(selection || null)
      setDnaResult(dna || null)
      setAssessment(assess || null)
      setPayRentModel(stageProgress?.pay_rent_model || null)
      setRemarkableAngle(remarkData || null)
      setMovementXP((xpData || []).reduce((sum, r) => sum + (r.points_earned || 0), 0))
      setUserSkills((skillsData || []).map(s => s.cluster_label))
      setUserProblems((problemsData || []).map(p => p.cluster_label))

      // Essence avatar + name
      if (essenceProfile?.essence_archetype) {
        const arch = ESSENCE_ARCHETYPES.find(a => a.name === essenceProfile.essence_archetype)
        if (arch) {
          setEssenceAvatar(essenceProfile.custom_essence_image || stageProgress?.hero_avatar_url || arch.image)
          setEssenceName(arch.name)
        }
      }

      // KPIs + Top fans from the same attendeeRows fetch
      if (attendeeRows?.length) {
        const counts = {}
        attendeeRows.forEach(a => { if (a.contact_id) counts[a.contact_id] = (counts[a.contact_id] || 0) + 1 })
        const totalAttendees = Object.keys(counts).length
        const repeats = Object.values(counts).filter(c => c >= 2).length
        const repeatRate = totalAttendees > 0 ? Math.round((repeats / totalAttendees) * 100) : 0
        setDashboardKPIs({ totalAttendees, repeatRate })

        const repeatIds = Object.entries(counts).filter(([, c]) => c >= 2).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id, count]) => ({ id, count }))
        if (repeatIds.length) {
          const { data: contacts } = await supabase.from('crm_contacts').select('id, name, email').in('id', repeatIds.map(r => r.id))
          setTopFans(repeatIds.map(r => {
            const c = contacts?.find(x => x.id === r.id)
            return { id: r.id, name: c?.name || c?.email || 'Unknown', count: r.count }
          }).filter(f => f.name !== 'Unknown'))
        }
      }
    } catch (err) {
      console.error('CreatorHomeV2 load error:', err)
    } finally {
      setLoading(false)
    }
  }


  // ── Derived ────────────────────────────────────────────────────────────
  const archetype = creatorSelection?.dominant_archetype || null
  const archetypeLabel = ARCHETYPE_LABELS[archetype] || 'Creator'
  const scopeFocus = SCOPE_FOCUS[scopeResult?.stage] || null
  const ruleBreak = parseRuleBreak(remarkableAngle?.rule_identified)
  const selectedCreators = creatorSelection?.selected_creators || []

  const threePercentChain = past
    .filter(e => e.three_percent_note)
    .map((e, i) => ({ num: past.filter(x => x.three_percent_note).length - i, note: e.three_percent_note, name: e.name, date: e.experience_date, attendees: e.attendee_count }))

  // ── Gate ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !expLoading && !creatorSelection && userId) {
      navigate('/experience-creators', { replace: true })
    }
  }, [loading, expLoading, creatorSelection, userId, navigate])

  if (loading || expLoading) {
    return <div className="ch2"><div className="ch2-loading"><div className="ch2-spinner" /></div></div>
  }
  if (!creatorSelection) {
    return <div className="ch2"><div className="ch2-loading"><div className="ch2-spinner" /></div></div>
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="ch2">
      {/* Header */}
      <div className="ch2-header">
        <div className="ch2-header-top">
          <div className="ch2-header-avatar">
            {essenceAvatar
              ? <img src={essenceAvatar} alt="" onError={e => { e.target.style.display = 'none' }} />
              : <span style={{ fontSize: 18 }}>🔥</span>
            }
          </div>
          <div>
            <div className="ch2-header-name">Movement Maker</div>
            <div className="ch2-header-sub">{archetypeLabel}</div>
          </div>
          <div className="ch2-header-xp">{movementXP} RP</div>
        </div>
        <div className="ch2-tabs">
          {['identity', 'experiences', 'growth'].map(tab => (
            <button key={tab} className={`ch2-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'identity' ? 'Identity' : tab === 'experiences' ? 'Experiences' : 'Growth'}
            </button>
          ))}
        </div>
      </div>

      <div className="ch2-content">
        {/* ═══ IDENTITY TAB ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'identity' ? ' active' : ''}`}>
          <div className="ch2-id-card">
            <div className="ch2-id-inner">

              {/* Hero */}
              <div className="ch2-id-hero">
                {essenceAvatar ? (
                  <div className="ch2-id-avatar">
                    <img src={essenceAvatar} alt="" onError={e => { e.target.style.display = 'none' }} />
                  </div>
                ) : (
                  <div className="ch2-id-avatar-empty">Complete<br />Essence<br />Mirror</div>
                )}
                <div>
                  <div className="ch2-id-type">{archetypeLabel}</div>
                  <div className="ch2-id-name">{essenceName || 'Your Identity'}</div>
                  {scopeFocus && (
                    <div className="ch2-id-focus">🎯 {scopeFocus}</div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {userSkills.length > 0 && (
                <div className="ch2-id-section">
                  <div className="ch2-label">Your Skills</div>
                  <div className="ch2-skills">
                    {userSkills.map(s => <span key={s} className="ch2-skill">{s}</span>)}
                  </div>
                </div>
              )}

              {/* Problems */}
              {userProblems.length > 0 ? (
                <div className="ch2-id-section">
                  <div className="ch2-label">Problems You're Passionate About</div>
                  <div className="ch2-skills">
                    {userProblems.map(p => <span key={p} className="ch2-skill">{p}</span>)}
                  </div>
                </div>
              ) : (
                <div className="ch2-id-section">
                  <div className="ch2-label">Problems You're Passionate About</div>
                  <button className="ch2-btn-outline" onClick={() => navigate('/life-map')} style={{ marginTop: 4, fontSize: 12, padding: '8px 14px' }}>
                    Complete your Life Map to discover these
                  </button>
                </div>
              )}

              {/* North Stars */}
              {selectedCreators.length > 0 && (
                <div className="ch2-id-section">
                  <div className="ch2-label">North Stars</div>
                  <div className="ch2-stars">
                    {selectedCreators.slice(0, 5).map(name => {
                      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                      return (
                        <div key={name} className="ch2-star">
                          <div className="ch2-star-img">
                            <img src={`/images/creators/${slug}.png`} alt="" onError={e => { e.target.style.display = 'none' }} />
                          </div>
                          <div className="ch2-star-name">{name}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="ch2-id-divider" />

              {/* Blow Up Brand */}
              {remarkableAngle ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Blow Up Brand</div>
                  {remarkableAngle.ai_rule_statement && (
                    <div className="ch2-tagline">{remarkableAngle.ai_rule_statement}</div>
                  )}
                  {ruleBreak && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">🔥</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Rule Break</div>
                        <div className="ch2-biz-val">{ruleBreak.current} → {ruleBreak.mine}</div>
                      </div>
                    </div>
                  )}
                  {remarkableAngle.combination_insight && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">🔀</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Unexpected Combo</div>
                        <div className="ch2-biz-val">{remarkableAngle.combination_insight}</div>
                      </div>
                    </div>
                  )}
                  {remarkableAngle.extreme_action_plan && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">⚡</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Extreme Action</div>
                        <div className="ch2-biz-val">{remarkableAngle.extreme_action_plan}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/create/remarkable')}>
                    <div className="ch2-locked-title">Blow Up Brand</div>
                    <div className="ch2-locked-sub">What rule do you break? What's your unexpected combo?</div>
                    <div className="ch2-locked-cta">Find Your Edge →</div>
                  </div>
                </div>
              )}

              <div className="ch2-id-divider" />

              {/* Your Model */}
              {(payRentModel || assessment) ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Your Model</div>
                  {payRentModel && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">💼</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Pay Rent</div>
                        <div className="ch2-biz-val">{PAY_RENT_LABELS[payRentModel] || payRentModel}</div>
                      </div>
                      <div className="ch2-biz-status ch2-st-done">✓</div>
                    </div>
                  )}
                  {assessment && ['attraction', 'core', 'continuity'].map(layer => {
                    const detail = assessment[`${layer}_detail`]
                    const status = assessment[`${layer}_status`]
                    const colors = { attraction: '#8b5cf6', core: '#E9A23B', continuity: '#3b82f6' }
                    return (
                      <div key={layer} className="ch2-biz-row">
                        <div className="ch2-biz-dot" style={{ background: colors[layer] }} />
                        <div className="ch2-biz-info">
                          <div className="ch2-biz-label">{layer}</div>
                          <div className="ch2-biz-val">{detail || 'Not set yet'}</div>
                        </div>
                        <div className={`ch2-biz-status ${status === 'have' ? 'ch2-st-done' : status === 'inconsistent' ? 'ch2-st-wip' : 'ch2-st-todo'}`}>
                          {status === 'have' ? '✓' : status === 'inconsistent' ? '~' : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/create/pay-rent')}>
                    <div className="ch2-locked-title">Your Model</div>
                    <div className="ch2-locked-sub">How do you pay rent? What's your attraction / core / continuity?</div>
                    <div className="ch2-locked-cta">Build Your Model →</div>
                  </div>
                </div>
              )}

              <div className="ch2-id-divider" />

              {/* Play Profile */}
              {dnaResult ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Play Profile</div>
                  <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/play-profile')}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #5e17eb, #E9A23B)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700 }}>
                      {getInitials(dnaResult.matched_founder)}
                    </div>
                    <div className="ch2-biz-info">
                      <div className="ch2-biz-label">You work like</div>
                      <div className="ch2-biz-val">{dnaResult.matched_founder || dnaResult.archetype}</div>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>See more ›</div>
                  </div>
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/play-profile')}>
                    <div className="ch2-locked-title">Play Profile</div>
                    <div className="ch2-locked-sub">How are you wired? Marathon or sprints? Fire or purpose?</div>
                    <div className="ch2-locked-cta">Take the Quiz →</div>
                  </div>
                </div>
              )}

              <div className="ch2-id-footer">
                <div className="ch2-id-brand">FINDMYFLOW</div>
                <div className="ch2-id-brand">findmyflow.nichuzz.com</div>
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button className="ch2-btn-outline" onClick={() => setActiveTab('edit-identity')} style={{ marginTop: 4 }}>
            Edit Identity
          </button>
        </div>

        {/* ═══ EXPERIENCES TAB ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'experiences' ? ' active' : ''}`}>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <div className="ch2-label" style={{ marginBottom: 8 }}>Upcoming</div>
              {upcoming.map(exp => {
                const cd = countdownLabel(exp.experience_date)
                const cl = checklistCounts[exp.id] || {}
                const marketingItems = cl.marketing || { total: 0, done: 0 }
                const orgItems = cl.organisation || { total: 0, done: 0 }

                return (
                  <div key={exp.id} className="ch2-exp-card" onClick={() => navigate(`/create/experience/${exp.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="ch2-exp-name">{exp.name}</div>
                        <div className="ch2-exp-meta">
                          {exp.experience_type?.replace(/_/g, ' ') || 'Experience'}
                          {exp.experience_date && ` · ${new Date(exp.experience_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          {cd && <span className="ch2-exp-countdown">{cd}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#5e17eb' }}>Open →</div>
                    </div>
                    {(marketingItems.total > 0 || orgItems.total > 0) && (
                      <div style={{ marginTop: 10 }}>
                        {marketingItems.total > 0 && (
                          <div className="ch2-exp-progress">
                            <div className="ch2-exp-p-icon">📣</div>
                            <div className="ch2-exp-p-info"><div className="ch2-exp-p-name">Marketing</div><div className="ch2-exp-p-count">{marketingItems.done} of {marketingItems.total}</div></div>
                            <div className="ch2-exp-p-bar"><div className="ch2-progress-track"><div className="ch2-progress-fill" style={{ width: `${(marketingItems.total ? marketingItems.done / marketingItems.total * 100 : 0)}%` }} /></div></div>
                          </div>
                        )}
                        {orgItems.total > 0 && (
                          <div className="ch2-exp-progress">
                            <div className="ch2-exp-p-icon">🗂️</div>
                            <div className="ch2-exp-p-info"><div className="ch2-exp-p-name">Organisation</div><div className="ch2-exp-p-count">{orgItems.done} of {orgItems.total}</div></div>
                            <div className="ch2-exp-p-bar"><div className="ch2-progress-track"><div className="ch2-progress-fill" style={{ width: `${(orgItems.total ? orgItems.done / orgItems.total * 100 : 0)}%` }} /></div></div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Plays linked to this experience */}
                    {(() => {
                      const expPlays = activePlays.filter(c => c.experience_id === exp.id)
                      if (!expPlays.length) return null
                      return (
                        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }} onClick={e => e.stopPropagation()}>
                          <div className="ch2-label">Active Plays</div>
                          {expPlays.map(play => (
                            <div key={play.id} className="ch2-play-item">
                              <span className="ch2-play-icon">🎯</span>
                              <span className="ch2-play-text">{play.title}</span>
                              {play.deadline && (
                                <span className="ch2-play-due">
                                  {new Date(play.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </>
          )}

          {/* Empty state for no upcoming */}
          {upcoming.length === 0 && (
            <div className="ch2-card">
              <div className="ch2-empty">
                <div className="ch2-empty-icon">🎪</div>
                <div className="ch2-empty-title">No upcoming experiences</div>
                <div className="ch2-empty-sub">Create your next experience to get a checklist that fills the room.</div>
              </div>
            </div>
          )}

          {/* Create New */}
          <div className="ch2-create-options">
            <div className="ch2-create-opt" onClick={() => navigate('/create/inspiration')}>
              <div className="ch2-create-icon">✨</div>
              <div className="ch2-create-label">Find Inspiration</div>
              <div className="ch2-create-sub">From creators you admire</div>
            </div>
            <div className="ch2-create-opt" onClick={() => navigate('/create/experience/new')}>
              <div className="ch2-create-icon">➕</div>
              <div className="ch2-create-label">New Experience</div>
              <div className="ch2-create-sub">I know what I want</div>
            </div>
          </div>

          {/* New Play CTA */}
          <div className="ch2-card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate('/create/plays')}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>🎯</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Design a New Play</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Set a courage challenge with a deadline</div>
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div className="ch2-card">
              <div className="ch2-label">Past Experiences</div>
              {past.map(exp => (
                <div key={exp.id} className="ch2-past-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/create/experience/${exp.id}`)}>
                  <div className="ch2-past-dot" />
                  <div className="ch2-past-info">
                    <div className="ch2-past-name">{exp.name}</div>
                    <div className="ch2-past-meta">
                      {exp.experience_date && new Date(exp.experience_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {exp.experience_type && ` · ${exp.experience_type.replace(/_/g, ' ')}`}
                    </div>
                  </div>
                  {exp.three_percent_note && (
                    <div className="ch2-past-3pct">3%: {exp.three_percent_note.length > 30 ? exp.three_percent_note.slice(0, 30) + '...' : exp.three_percent_note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ GROWTH TAB ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'growth' ? ' active' : ''}`}>

          {/* KPIs */}
          <div className="ch2-kpi-grid">
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{dashboardKPIs.totalAttendees || '—'}</div>
              <div className="ch2-kpi-label">Total Attendees</div>
            </div>
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{dashboardKPIs.repeatRate ? `${dashboardKPIs.repeatRate}%` : '—'}</div>
              <div className="ch2-kpi-label">Repeat Rate</div>
            </div>
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{past.length || '—'}</div>
              <div className="ch2-kpi-label">Experiences Run</div>
            </div>
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{upcoming.length}</div>
              <div className="ch2-kpi-label">Upcoming</div>
            </div>
          </div>

          {/* 3% Chain */}
          {threePercentChain.length > 0 && (
            <div className="ch2-card">
              <div className="ch2-label">3% Improvement Chain</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 10 }}>Each experience builds on the last.</div>
              {threePercentChain.map((item, i) => (
                <div key={i} className="ch2-chain-item">
                  <div className="ch2-chain-dot">{item.num}</div>
                  <div>
                    <div className="ch2-chain-exp">{item.name}</div>
                    <div className="ch2-chain-note">"{item.note}"</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Fans */}
          {topFans.length > 0 && (
            <div className="ch2-card">
              <div className="ch2-label">Your Top Fans</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginBottom: 8 }}>People who keep coming back.</div>
              {topFans.map(fan => (
                <div key={fan.id} className="ch2-fan-row">
                  <div className="ch2-fan-avatar">{getInitials(fan.name)}</div>
                  <div className="ch2-fan-name">{fan.name}</div>
                  <div className="ch2-fan-count">{fan.count} experiences</div>
                </div>
              ))}
            </div>
          )}

          {/* Trajectory */}
          {scopeResult?.stage && (
            <div className="ch2-trajectory">
              <div className="ch2-traj-label">Your Focus</div>
              <div className="ch2-traj-title">{scopeResult.stage.charAt(0).toUpperCase() + scopeResult.stage.slice(1)}</div>
              <div className="ch2-traj-desc">{SCOPE_FOCUS[scopeResult.stage]}</div>
              <button className="ch2-btn-outline" style={{ marginTop: 10 }} onClick={() => navigate('/create/scope-map')}>Retake Diagnostic →</button>
            </div>
          )}

          {/* Empty state */}
          {past.length === 0 && topFans.length === 0 && (
            <div className="ch2-card">
              <div className="ch2-empty">
                <div className="ch2-empty-icon">📊</div>
                <div className="ch2-empty-title">No data yet</div>
                <div className="ch2-empty-sub">Run your first experience to start tracking your growth.</div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ EDIT IDENTITY PANEL ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'edit-identity' ? ' active' : ''}`}>
          <div className="ch2-label" style={{ marginBottom: 12 }}>Edit Your Identity</div>
          {[
            { label: 'Your Skills', sub: 'Retake Play-Skills onboarding', path: '/get-started' },
            { label: 'North Stars', sub: 'Redo Experience Creator Matching', path: '/experience-creators' },
            { label: 'Your Position', sub: 'Retake Scope Map diagnostic', path: '/create/scope-map' },
            { label: 'Blow Up Brand', sub: 'Redo the Remarkable flow', path: '/create/remarkable' },
            { label: 'Pay Rent', sub: 'Explore how creators pay rent', path: '/create/pay-rent' },
            { label: 'Scale Income', sub: 'Redo attraction / core / continuity', path: '/create/scale-income' },
            { label: 'Play Profile', sub: 'Retake the DNA quiz', path: '/play-profile?mode=retake' },
          ].map(item => (
            <div key={item.path} className="ch2-biz-row" style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => navigate(item.path)}>
              <div className="ch2-biz-info">
                <div className="ch2-biz-val">{item.label}</div>
                <div className="ch2-biz-label">{item.sub}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>→</div>
            </div>
          ))}
          <button className="ch2-btn-outline" onClick={() => setActiveTab('identity')} style={{ marginTop: 8 }}>
            ← Back to Identity
          </button>
        </div>
      </div>
    </div>
  )
}
