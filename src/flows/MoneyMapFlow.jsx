/**
 * MoneyMapFlow.jsx — /money-map
 *
 * Shows users which of their loved experiences can provide financial security.
 * Flow: Intro → Question → (Tag Experiences) → Money Map → Done
 * Comes after Choose Quests: dream first, fund second.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getDomeExperiencesForBridge } from '../lib/domeSummary'
import { getViableBridgeExperiences } from '../lib/bridgeJobUtils'
import { createFinancialSecurityPath, markMoneyMapCompleted } from '../lib/moneyMapUtils'
import { getWeekStartLocal } from '../lib/dateUtils'
import { TIER1_IDS, TIER1_CHALLENGES } from '../data/tier1Challenges'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  BoltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid'
import './MoneyMapFlow.css'

const STEPS = {
  INTRO: 'intro',
  QUESTION: 'question',
  TAG_EXPERIENCES: 'tag_experiences',
  MONEY_MAP: 'money_map',
  DONE: 'done',
}

const NS_EMOJI = {
  vibe_rise: '🔥',
  fun: '😊',
  pressure: '😰',
  growth_edge: '😰',
  bored: '😐',
}

export default function MoneyMapFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const skipLoveIt = searchParams.get('skip') === 'love_it'
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)

  // Hide bottom toolbar
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  const [step, setStep] = useState(STEPS.INTRO)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Screen 2: situation
  const [situation, setSituation] = useState(null) // 'love_it' | 'move_on' | 'not_enough'

  // Screen 2b: tag experiences
  const [taggedIds, setTaggedIds] = useState(new Set())
  const [showFun, setShowFun] = useState(false)

  // Love-it branch state
  const [userQuests, setUserQuests] = useState([])
  const [selectedQuestId, setSelectedQuestId] = useState(null)
  const [customJobName, setCustomJobName] = useState('')
  const [showDomeTag, setShowDomeTag] = useState(false)

  // Load user's active quests for love-it picker
  useEffect(() => {
    if (!user?.id) return
    supabase.from('quests')
      .select('id, label')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_current_job', false)
      .neq('label', 'Healing Work')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUserQuests(data) })
  }, [user?.id])

  // Screen 3: money map
  const [selectedTier1, setSelectedTier1] = useState(null)
  const [pathCChoice, setPathCChoice] = useState(null) // 'retry' | 'tier2'
  const [showAllOptions, setShowAllOptions] = useState(false) // force Path B from Path A

  // Screen 4: result
  const [result, setResult] = useState(null) // { quest, challenge } or { type: 'sorted', jobName } or 'skipped'

  // Dome experiences for tag step
  const { vibeRise, fun } = getDomeExperiencesForBridge(domeStates)

  // Screen 3 path detection
  const available = TIER1_IDS
  const lovedTier1 = available.filter(id => domeStates[id] === 'vibe_rise' || domeStates[id] === 'fun')
  const untriedTier1 = available.filter(id => !(id in domeStates))
  // triedNotLoved = available, in domeStates, but not vibe_rise/fun
  const triedNotLoved = available.filter(id =>
    id in domeStates && domeStates[id] !== 'vibe_rise' && domeStates[id] !== 'fun'
  )

  let moneyMapPath = 'B' // default: hasn't tried
  if (lovedTier1.length > 0 && !showAllOptions) moneyMapPath = 'A'
  else if (untriedTier1.length === 0 && triedNotLoved.length > 0 && !showAllOptions) moneyMapPath = 'C'

  // Path C: best Tier 2 from dome
  const tier2Option = () => {
    const funExps = [...vibeRise, ...fun]
      .filter(e => !TIER1_IDS.includes(e.id))
      .map(e => ({ nodeId: e.id, label: e.label }))
    const viable = getViableBridgeExperiences(funExps)
    return viable[0] || null
  }

  // Handle Tier 1 selection → create quest + challenge
  const handleSelectTier1 = async (nodeId) => {
    if (saving) return
    setSaving(true)
    setError(null)
    hapticLight()
    try {
      const res = await createFinancialSecurityPath(user.id, nodeId)
      await markMoneyMapCompleted(user.id)
      setResult(res)
      hapticSuccess()
      setStep(STEPS.DONE)
    } catch (err) {
      console.error('Money Map error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }



  // Handle skip
  const handleSkip = async () => {
    if (saving) return
    setSaving(true)
    try {
      await markMoneyMapCompleted(user.id)
      setResult('skipped')
      setStep(STEPS.DONE)
    } catch (err) {
      console.error('Skip error:', err)
      setResult('skipped')
      setStep(STEPS.DONE)
    } finally {
      setSaving(false)
    }
  }

  // Handle Path C "build from what you love" → create generic quest
  const handleTier2Path = async () => {
    if (saving) return
    const best = tier2Option()
    if (!best) return
    setSaving(true)
    setError(null)
    try {
      const { data: quest, error: questErr } = await supabase.from('quests').insert({
        user_id: user.id,
        label: best.label,
        path_type: 'financial_security',
        financial_stage: 'discovery',
        skill_node_id: best.nodeId,
        status: 'active',
        is_current_job: false,
        is_bridge_job: false,
      }).select().single()
      if (questErr) throw questErr

      // Generic first challenge
      const { data: challenge, error: challErr } = await supabase.from('groan_challenges').insert({
        user_id: user.id,
        quest_id: quest.id,
        title: `Research getting paid for ${best.label}`,
        description: `Find 3 people who earn money doing ${best.label}. What do they charge? How did they start? Write down what you learn.`,
        source_type: 'skill',
        source_id: best.nodeId,
        source_label: 'Financial Security',
        challenge_source: 'money_map',
        visibility_layer: 'screen',
        dimension_values: { identity: 2, business_commitment: 2 },
        expansion_dimensions: ['identity', 'business_commitment'],
        status: 'active',
      }).select().single()
      if (challErr) throw challErr

      // Create quest_tasks row so QuestBoardCard can discover + complete it
      await supabase.from('quest_tasks').insert({
        user_id: user.id,
        quest_id: quest.id,
        text: `Research getting paid for ${best.label}`,
        is_courage_challenge: true,
        groan_challenge_id: challenge.id,
        done: false,
      })

      await markMoneyMapCompleted(user.id)
      setResult({ quest, challenge })
      hapticSuccess()
      setStep(STEPS.DONE)
    } catch (err) {
      console.error('Tier 2 path error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // Love-it: user picks an existing quest
  const handleLoveItQuestPick = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      // 'both' because quest is already a passion path AND now financial security
      // Do NOT set is_current_job — quest stays visible in quest board
      await supabase.from('quests').update({
        path_type: 'both',
        job_relationship: 'love_it',
        bills_pulse_week: getWeekStartLocal(),
      }).eq('id', selectedQuestId)

      await markMoneyMapCompleted(user.id)
      const picked = userQuests.find(q => q.id === selectedQuestId)
      setResult({ type: 'sorted', jobName: picked?.label || 'Your job' })
      setStep(STEPS.DONE)
    } catch (err) {
      console.error('Love it quest pick error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // Love-it: user typed a custom job name + tagged dome experiences
  const handleLoveItCustomSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const { data: newQuest, error: insertErr } = await supabase.from('quests').insert({
        user_id: user.id,
        label: customJobName.trim(),
        is_current_job: true,
        is_bridge_job: false,
        path_type: 'financial_security',
        job_relationship: 'love_it',
        bills_pulse_week: getWeekStartLocal(),
        status: 'active',
      }).select().single()
      if (insertErr) throw insertErr

      if (taggedIds.size > 0) {
        const rows = [...taggedIds].map(nodeId => {
          const exp = [...vibeRise, ...fun].find(e => e.id === nodeId)
          return {
            quest_id: newQuest.id,
            user_id: user.id,
            label: exp?.label || nodeId,
            capacity_state: domeStates[nodeId] || null,
          }
        })
        await supabase.from('quest_experiences').insert(rows)
      }

      await markMoneyMapCompleted(user.id)
      setResult({ type: 'sorted', jobName: customJobName.trim() })
      setStep(STEPS.DONE)
    } catch (err) {
      console.error('Love it custom save error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (nodeId) => {
    hapticLight()
    setTaggedIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  if (domeLoading) {
    return (
      <div className="mm">
        <div className="mm-container mm-loading">
          <div className="mm-spinner" />
        </div>
      </div>
    )
  }

  // ── Screen 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="mm">
        <div className="mm-container">
          <div className="mm-intro">
            <div className="mm-intro-icon">
              <ShieldCheckIcon style={{ width: 52, height: 52, color: 'white' }} />
            </div>
            <h1>Now let's make sure you<br />can afford to build these</h1>
            <p>Your paths take time to grow. Let's find the fastest way to keep the lights on while you build.</p>
            <div className="mm-steps">
              <div className="mm-step">
                <div className="mm-step-num">1</div>
                <div className="mm-step-text">Your situation</div>
              </div>
              <div className="mm-step">
                <div className="mm-step-num">2</div>
                <div className="mm-step-text">Your options</div>
              </div>
              <div className="mm-step">
                <div className="mm-step-num">3</div>
                <div className="mm-step-text">Your engine</div>
              </div>
            </div>
            <div className="mm-fixed">
              <button className="mm-cta mm-cta-gold" onClick={() => { hapticLight(); setStep(STEPS.QUESTION) }}>
                Let's go →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Screen 2: QUESTION ──
  if (step === STEPS.QUESTION) {
    return (
      <div className="mm">
        <div className="mm-container">
          <div className="mm-question">
            <h2>Is your income coming from something you find fun?</h2>
            <div className="mm-options">
              {!skipLoveIt && (
                <button
                  className={`mm-option ${situation === 'love_it' ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setSituation('love_it') }}
                >
                  <span className="mm-option-radio" />
                  <div className="mm-option-text">
                    <span className="mm-option-title">Yes, I love what I do and it covers my bills</span>
                    <span className="mm-option-sub">I'll tag which experiences feed it</span>
                  </div>
                </button>
              )}
              <button
                className={`mm-option ${situation === 'move_on' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setSituation('move_on') }}
              >
                <span className="mm-option-radio" />
                <div className="mm-option-text">
                  <span className="mm-option-title">It pays the bills but I want to move on</span>
                  <span className="mm-option-sub">Help me find something I enjoy</span>
                </div>
              </button>
              <button
                className={`mm-option ${situation === 'not_enough' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setSituation('not_enough') }}
              >
                <span className="mm-option-radio" />
                <div className="mm-option-text">
                  <span className="mm-option-title">I don't have enough income right now</span>
                  <span className="mm-option-sub">I need financial security</span>
                </div>
              </button>
            </div>
            <div className="mm-fixed">
              <button
                className="mm-cta mm-cta-gold"
                disabled={!situation}
                onClick={() => {
                  hapticLight()
                  if (situation === 'love_it') setStep(STEPS.TAG_EXPERIENCES)
                  else setStep(STEPS.MONEY_MAP)
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Screen 2b: TAG EXPERIENCES ──
  if (step === STEPS.TAG_EXPERIENCES) {

    // ── Love-it Part A: quest picker ──
    if (situation === 'love_it' && !showDomeTag) {
      const canContinue = selectedQuestId !== null || customJobName.trim().length > 0
      return (
        <div className="mm">
          <div className="mm-container">
            <div className="mm-tag">
              <div className="mm-tag-header">
                <h2>Which of your paths covers your bills?</h2>
                <p>Pick one below, or type what you do.</p>
              </div>

              {userQuests.map(quest => (
                <button
                  key={quest.id}
                  className={`mm-exp ${selectedQuestId === quest.id ? 'selected' : ''}`}
                  onClick={() => {
                    hapticLight()
                    setSelectedQuestId(quest.id)
                    setCustomJobName('')
                  }}
                >
                  <span className="mm-exp-check">✓</span>
                  <span className="mm-exp-name">{quest.label}</span>
                </button>
              ))}

              <div className="mm-custom-input">
                <input
                  type="text"
                  placeholder="Something else..."
                  value={customJobName}
                  onChange={e => {
                    setCustomJobName(e.target.value)
                    if (e.target.value.trim().length > 0) setSelectedQuestId(null)
                  }}
                />
              </div>

              {error && <p className="mm-error">{error}</p>}

              <div className="mm-fixed">
                <button
                  className="mm-cta mm-cta-gold"
                  disabled={!canContinue || saving}
                  onClick={() => {
                    hapticLight()
                    if (selectedQuestId) {
                      handleLoveItQuestPick()
                    } else {
                      setShowDomeTag(true)
                    }
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ── Love-it Part B: dome tagger for custom name ──
    if (situation === 'love_it' && showDomeTag) {
      return (
        <div className="mm">
          <div className="mm-container">
            <div className="mm-tag">
              <div className="mm-tag-header">
                <h2>Which experiences does "{customJobName}" involve?</h2>
                <p>Tap at least one that is part of how you earn.</p>
              </div>

              {vibeRise.length > 0 && (
                <>
                  <div className="mm-divider"><span>Vibe Rise</span><hr /></div>
                  {vibeRise.map(exp => (
                    <button
                      key={exp.id}
                      className={`mm-exp ${taggedIds.has(exp.id) ? 'selected' : ''}`}
                      onClick={() => toggleTag(exp.id)}
                    >
                      <span className="mm-exp-check">✓</span>
                      <span className="mm-exp-name">{exp.label}</span>
                      <span className="mm-exp-ns">{NS_EMOJI.vibe_rise}</span>
                    </button>
                  ))}
                </>
              )}

              {(showFun || vibeRise.length === 0) && fun.length > 0 && (
                <>
                  <div className="mm-divider fun"><span>Fun</span><hr /></div>
                  {fun.map(exp => (
                    <button
                      key={exp.id}
                      className={`mm-exp ${taggedIds.has(exp.id) ? 'selected' : ''}`}
                      onClick={() => toggleTag(exp.id)}
                    >
                      <span className="mm-exp-check">✓</span>
                      <span className="mm-exp-name">{exp.label}</span>
                      <span className="mm-exp-ns">{NS_EMOJI.fun}</span>
                    </button>
                  ))}
                </>
              )}

              {!showFun && vibeRise.length > 0 && fun.length > 0 && (
                <div className="mm-fun-toggle">
                  <button onClick={() => setShowFun(true)}>Also show Fun experiences</button>
                </div>
              )}

              {error && <p className="mm-error">{error}</p>}

              <div className="mm-fixed">
                <button
                  className="mm-cta mm-cta-gold"
                  disabled={taggedIds.size === 0 || saving}
                  onClick={handleLoveItCustomSave}
                >
                  {saving ? 'Saving...' : 'Done →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // TAG_EXPERIENCES only reached by "love it" — should never fall through
    return null
  }

  // ── Screen 3: MONEY MAP ──
  if (step === STEPS.MONEY_MAP) {
    // Path A: already loves a Tier 1 skill
    if (moneyMapPath === 'A') {
      return (
        <div className="mm">
          <div className="mm-container">
            <div className="mm-map">
              <h2>You already love something that pays really well</h2>
              <div className="mm-tier1-list">
                {lovedTier1.map(id => {
                  const t = TIER1_CHALLENGES[id]
                  return (
                    <button
                      key={id}
                      className={`mm-tier1-card mm-tier1-gold ${selectedTier1 === id ? 'selected' : ''}`}
                      onClick={() => { hapticLight(); setSelectedTier1(id) }}
                    >
                      <div className="mm-tier1-top">
                        <BoltIcon style={{ width: 18, height: 18, color: '#E9A23B' }} />
                        <span className="mm-tier1-name">{t.questLabel}</span>
                      </div>
                      <div className="mm-tier1-rate">{t.rate} employed · {t.freeRate} freelance</div>
                      <div className="mm-tier1-hook">One client could cover your bills.</div>
                    </button>
                  )
                })}
              </div>
              <p className="mm-map-prompt">Pick one and we'll guide you step by step to get paid for it.</p>
              {error && <p className="mm-error">{error}</p>}
              <div className="mm-fixed">
                <button
                  className="mm-cta mm-cta-gold"
                  disabled={!selectedTier1 || saving}
                  onClick={() => handleSelectTier1(selectedTier1)}
                >
                  {saving ? 'Setting up...' : 'Yes, let\'s secure this →'}
                </button>
                <button
                  className="mm-cta mm-cta-secondary"
                  onClick={() => { setSelectedTier1(null); setShowAllOptions(true) }}
                >
                  Show me other options
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Path C: tried all, none rated Fun/Vibe Rise
    if (moneyMapPath === 'C') {
      const bestTier2 = tier2Option()
      return (
        <div className="mm">
          <div className="mm-container">
            <div className="mm-map">
              <h2>None of these clicked last time. But AI has changed the game.</h2>
              <div className="mm-options">
                <button
                  className={`mm-option ${pathCChoice === 'retry' ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setPathCChoice('retry') }}
                >
                  <span className="mm-option-radio" />
                  <div className="mm-option-text">
                    <span className="mm-option-title">Try again with AI tools</span>
                    <span className="mm-option-sub">Coding with AI is a different experience than coding alone. Pick one to retry.</span>
                  </div>
                </button>
                {bestTier2 && (
                  <button
                    className={`mm-option ${pathCChoice === 'tier2' ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setPathCChoice('tier2') }}
                  >
                    <span className="mm-option-radio" />
                    <div className="mm-option-text">
                      <span className="mm-option-title">Build from what you love</span>
                      <span className="mm-option-sub">Your fastest path: {bestTier2.label}</span>
                    </div>
                  </button>
                )}
              </div>
              {error && <p className="mm-error">{error}</p>}
              <div className="mm-fixed">
                <button
                  className="mm-cta mm-cta-gold"
                  disabled={!pathCChoice || saving}
                  onClick={() => {
                    if (pathCChoice === 'tier2') handleTier2Path()
                    else if (pathCChoice === 'retry') setShowAllOptions(true)
                  }}
                >
                  {saving ? 'Setting up...' : 'Continue →'}
                </button>
                <button className="mm-cta mm-cta-secondary" onClick={handleSkip}>
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Path B (default): hasn't tried Tier 1, or retry from Path C
    const showIds = pathCChoice === 'retry' ? triedNotLoved : untriedTier1.length > 0 ? untriedTier1 : available
    return (
      <div className="mm">
        <div className="mm-container">
          <div className="mm-map">
            <h2>
              {pathCChoice === 'retry'
                ? 'Pick one to retry with AI'
                : 'You haven\'t tried these yet. Each one could fund your paths within weeks.'}
            </h2>
            {!pathCChoice && (
              <p className="mm-map-sub">These 5 skills pay $30-100/hr and AI tools make them learnable fast.</p>
            )}
            <div className="mm-tier1-list">
              {showIds.map(id => {
                const t = TIER1_CHALLENGES[id]
                return (
                  <button
                    key={id}
                    className={`mm-tier1-card ${selectedTier1 === id ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setSelectedTier1(id) }}
                  >
                    <div className="mm-tier1-top">
                      <span className="mm-tier1-name">{t.questLabel}</span>
                    </div>
                    <div className="mm-tier1-rate">{t.rate}</div>
                    <div className="mm-tier1-hook">{t.cardDesc}</div>
                  </button>
                )
              })}
            </div>
            <p className="mm-map-prompt">Pick one and we'll guide you step by step to get paid for it.</p>
            {error && <p className="mm-error">{error}</p>}
            <div className="mm-fixed">
              <button
                className="mm-cta mm-cta-gold"
                disabled={!selectedTier1 || saving}
                onClick={() => handleSelectTier1(selectedTier1)}
              >
                {saving ? 'Setting up...' : 'Try this one →'}
              </button>
              <button className="mm-cta mm-cta-secondary" onClick={handleSkip}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Screen 4: DONE ──
  if (step === STEPS.DONE) {
    // Variant A: financial security path set
    if (result?.quest && result?.challenge) {
      return (
        <div className="mm">
          <div className="mm-container">
            <div className="mm-done">
              <div className="mm-done-check">
                <BoltIcon style={{ width: 28, height: 28, color: 'white' }} />
              </div>
              <h2>Your financial engine is set</h2>
              <div className="mm-done-card">
                <div className="mm-done-card-name">{result.challenge?.title || result.quest?.label}</div>
                <div className="mm-done-card-sub">Stage: Discovery</div>
              </div>
              <p>You'll find this on your Paths tab. Now go build your dream.</p>
              <div className="mm-fixed">
                <button className="mm-cta mm-cta-gold" onClick={() => navigate('/7-day-challenge?tab=Paths')}>
                  Go to Paths →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Variant B: already covered (love-it object or legacy 'sorted' string)
    if (result?.type === 'sorted' || result === 'sorted') {
      const jobName = result?.jobName || 'Your job'
      return (
        <div className="mm">
          <div className="mm-container">
            <div className="mm-done">
              <div className="mm-done-check mm-done-check-green">
                <CheckCircleIcon style={{ width: 28, height: 28, color: 'white' }} />
              </div>
              <h2>You're sorted</h2>
              <div className="mm-done-card">
                <div className="mm-done-card-name">{jobName}</div>
                <div className="mm-done-card-sub">Covering your bills</div>
              </div>
              <p>Focus on building your passion paths. We'll check in each week.</p>
              <div className="mm-fixed">
                <button className="mm-cta mm-cta-gold" onClick={() => navigate('/7-day-challenge?tab=Paths')}>
                  Go to Paths →
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Variant C: skipped
    return (
      <div className="mm">
        <div className="mm-container">
          <div className="mm-done">
            <div className="mm-done-check mm-done-check-neutral">
              <ArrowPathIcon style={{ width: 28, height: 28, color: 'white' }} />
            </div>
            <h2>No worries</h2>
            <p>You can come back to this anytime from your Paths tab.</p>
            <div className="mm-fixed">
              <button className="mm-cta mm-cta-gold" onClick={() => navigate('/7-day-challenge?tab=Paths')}>
                Go to Paths →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
