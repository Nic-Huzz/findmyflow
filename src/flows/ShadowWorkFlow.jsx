/**
 * ShadowWorkFlow — 14-step deep dive into shadow traits and their origins
 *
 * 5 Acts from the live workshop, adapted as a solo flow:
 *   1-2. Teach: What are shadows + shadows & light
 *   3. Input: Write 1-5 shadow traits
 *   4. Input: What scares you about each shadow
 *   5. Teach: Root emotions (shame/guilt/fear)
 *   6. Input: Label each shadow with root emotion
 *   7. Teach: Protective archetypes (5 cards)
 *   8. Input: Map each shadow to an archetype
 *   9. Teach: Suppressed essence — authentic parts become shadows
 *   10. Input: Identify a suppressed essence trait
 *   11. Teach: Origin story setup
 *   12. Input: Timeline — trace it back
 *   13. Connect the Dots — auto-generated mirror moment
 *   14. Complete — save + closing
 *
 * Saves to quest_completions.response_data as JSON.
 * Repeatable once per calendar week (Mon-Sun).
 *
 * Route: /shadow-work
 * Quest: recognise_shadow_work (Healing > Recognise > Deep Dive, 8 pts)
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import { getAllVoices } from '../data/protectiveVoices'
import './NervousSystemHealingCompass.css'
import './ShadowWorkFlow.css'

// ============================================
// Constants
// ============================================

const ROOT_EMOTIONS = [
  { key: 'shame', label: 'Shame', description: '"Something is wrong with me"' },
  { key: 'guilt', label: 'Guilt', description: '"I shouldn\'t be this way"' },
  { key: 'fear', label: 'Fear', description: '"If I express this, I\'ll lose safety"' },
]

const ARCHETYPES = getAllVoices().map(v => ({
  key: v.id,
  label: v.name,
  icon: v.icon,
  lie: v.lie,
  origin: v.origin,
}))

const TIMELINE_EMOTIONS = [
  { key: 'shame', label: 'Shame' },
  { key: 'guilt', label: 'Guilt' },
  { key: 'fear', label: 'Fear' },
  { key: 'embarrassment', label: 'Embarrassment' },
  { key: 'rejection', label: 'Rejection' },
  { key: 'loneliness', label: 'Loneliness' },
]

const SCREEN_ORDER = [
  'loading', 'time_check',
  'teach_what_are_shadows',
  'teach_shadows_and_light',
  'input_shadow_traits',
  'input_what_scares_you',
  'teach_root_emotions',
  'input_label_shadows',
  'teach_protective_archetypes',
  'input_map_armour',
  'teach_heartbreaking_truth',
  'input_suppressed_essence',
  'teach_origin_story',
  'input_timeline',
  'connect_the_dots',
  'complete'
]

const TOTAL_DOTS = 14 // teach_what_are_shadows through connect_the_dots

const GUIDED_PROMPTS = [
  'What situations make you play smaller than you truly are?',
  'Where in your life do you push, perform, or prove something?',
  'Where do you avoid saying how you really feel?',
  'What trait do you hide because you believe it won\'t be accepted?',
]

// ============================================
// Helpers
// ============================================

const getScreenIndex = (screen) => {
  const map = {
    teach_what_are_shadows: 0,
    teach_shadows_and_light: 1,
    input_shadow_traits: 2,
    input_what_scares_you: 3,
    teach_root_emotions: 4,
    input_label_shadows: 5,
    teach_protective_archetypes: 6,
    input_map_armour: 7,
    teach_heartbreaking_truth: 8,
    input_suppressed_essence: 9,
    teach_origin_story: 10,
    input_timeline: 11,
    connect_the_dots: 12,
    complete: 13,
  }
  return map[screen] ?? 0
}

const getScreenDisplayName = (screen) => {
  const names = {
    teach_what_are_shadows: 'Step 1 — What Are Shadows?',
    teach_shadows_and_light: 'Step 2 — Shadows & Light',
    input_shadow_traits: 'Step 3 — Your Shadow Traits',
    input_what_scares_you: 'Step 4 — What Scares You?',
    teach_root_emotions: 'Step 5 — Root Emotions',
    input_label_shadows: 'Step 6 — Label Your Shadows',
    teach_protective_archetypes: 'Step 7 — Protective Archetypes',
    input_map_armour: 'Step 8 — Map Your Armour',
    teach_heartbreaking_truth: 'Step 9 — The Heartbreaking Truth',
    input_suppressed_essence: 'Step 10 — Suppressed Essence',
    teach_origin_story: 'Step 11 — Your Origin Story',
    input_timeline: 'Step 12 — Timeline',
    connect_the_dots: 'Step 13 — Connect the Dots',
  }
  return names[screen] || screen
}

/**
 * Check if shadow work was completed this calendar week (Mon-Sun)
 */
async function checkWeeklyCompletion(userId) {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('quest_completions')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('quest_id', 'recognise_shadow_work')
    .gte('created_at', monday.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    // Calculate next Monday
    const nextMonday = new Date(monday)
    nextMonday.setDate(monday.getDate() + 7)
    return { completed: true, completedAt: data[0].created_at, availableAt: nextMonday }
  }

  return { completed: false }
}

// ============================================
// Component
// ============================================

export default function ShadowWorkFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('loading')
  const [saving, setSaving] = useState(false)

  // Weekly lock state
  const [weeklyLock, setWeeklyLock] = useState(null)

  // Core data
  const [shadows, setShadows] = useState([{ trait: '' }])
  const [suppressedEssence, setSuppressedEssence] = useState({
    trait: '', whats_stopping: '', archetype: ''
  })
  const [origin, setOrigin] = useState({
    event: '', emotion: '', feelings: ''
  })

  // User's known archetype (for pre-selection)
  const [userArchetype, setUserArchetype] = useState(null)

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('shadow-work', user?.id)

  // ============================================
  // Navigation
  // ============================================

  const goBack = (fromScreen) => {
    const idx = SCREEN_ORDER.indexOf(fromScreen)
    if (idx > 2) { // Don't go back past time_check
      setCurrentScreen(SCREEN_ORDER[idx - 1])
    }
  }

  const goNext = (fromScreen) => {
    const idx = SCREEN_ORDER.indexOf(fromScreen)
    if (idx < SCREEN_ORDER.length - 1) {
      setCurrentScreen(SCREEN_ORDER[idx + 1])
    }
  }

  const BackButton = ({ fromScreen }) => (
    <button
      className="ns-hc-back-button"
      onClick={() => goBack(fromScreen)}
      style={{
        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontSize: '14px', padding: '4px 0 2px 0',
        marginTop: '16px', marginBottom: '0', display: 'block', width: '100%', textAlign: 'center'
      }}
    >
      ← Go Back
    </button>
  )

  // ============================================
  // Shadow array helpers
  // ============================================

  const updateShadow = (index, field, value) => {
    setShadows(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const addShadow = () => {
    if (shadows.length < 5) {
      setShadows(prev => [...prev, { trait: '' }])
    }
  }

  const removeShadow = (index) => {
    if (shadows.length > 1) {
      setShadows(prev => prev.filter((_, i) => i !== index))
    }
  }

  // ============================================
  // Validation
  // ============================================

  const hasShadowTraits = shadows.some(s => s.trait.trim().length >= 5)
  const allShadowsHaveEmotion = shadows.filter(s => s.trait.trim()).every(s => s.root_emotion)
  const allShadowsHaveArchetype = shadows.filter(s => s.trait.trim()).every(s => s.archetype)
  const hasEssence = suppressedEssence.trait.trim().length >= 5 && suppressedEssence.archetype
  const hasTimeline = origin.event.trim().length >= 10 && origin.emotion

  // ============================================
  // Auto-save & resume
  // ============================================

  const handleResumeProgress = () => {
    if (savedProgressData) {
      setCurrentScreen(savedProgressData.currentScreen)
      if (savedProgressData.shadows) setShadows(savedProgressData.shadows)
      if (savedProgressData.suppressedEssence) setSuppressedEssence(savedProgressData.suppressedEssence)
      if (savedProgressData.origin) setOrigin(savedProgressData.origin)
    }
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }

  const handleStartFresh = () => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
    setCurrentScreen('teach_what_are_shadows')
  }

  const getTimeSinceSave = () => {
    if (!savedProgressData?.savedAt) return null
    const minutesAgo = Math.floor((Date.now() - savedProgressData.savedAt) / 60000)
    if (minutesAgo < 1) return 'just now'
    if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
    const hoursAgo = Math.floor(minutesAgo / 60)
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
  }

  // ============================================
  // Init: check weekly lock, load progress, fetch archetype
  // ============================================

  useEffect(() => {
    if (!user) return

    const init = async () => {
      // Check weekly completion
      const lock = await checkWeeklyCompletion(user.id)
      setWeeklyLock(lock)

      // Fetch user's known archetype
      const { data: profile } = await supabase
        .from('lead_flow_profiles')
        .select('protective_archetype')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (profile && profile.length > 0 && profile[0].protective_archetype) {
        setUserArchetype(profile[0].protective_archetype)
      }

      // Check for saved progress
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'time_check' &&
          saved.currentScreen !== 'complete' && saved.currentScreen !== 'loading') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
        setCurrentScreen('time_check')
      } else {
        setCurrentScreen('time_check')
      }
    }

    init()
  }, [user, loadProgress])

  // Auto-save on state changes
  useEffect(() => {
    if (!user || currentScreen === 'time_check' || currentScreen === 'complete' || currentScreen === 'loading') return
    saveProgress({ currentScreen, shadows, suppressedEssence, origin })
  }, [currentScreen, shadows, suppressedEssence, origin, user, saveProgress])

  // ============================================
  // Connect the Dots — auto-generated text
  // ============================================

  const generateMirrorText = () => {
    const essenceTrait = suppressedEssence.trait.trim() || shadows.find(s => s.trait.trim())?.trait || 'this part of yourself'
    const archetypeKey = suppressedEssence.archetype || shadows.find(s => s.archetype)?.archetype
    const archetype = ARCHETYPES.find(a => a.key === archetypeKey)
    const archetypeName = archetype?.label || 'a protective version of yourself'
    const emotionLabel = TIMELINE_EMOTIONS.find(e => e.key === origin.emotion)?.label || origin.emotion
    const event = origin.event.trim() || 'that experience'

    return {
      text: `This experience of "${event}" made you feel ${emotionLabel}. To protect yourself, you started hiding "${essenceTrait}" and became ${archetypeName} instead.`,
      event,
      emotion: emotionLabel,
      trait: essenceTrait,
      archetype: archetypeName,
    }
  }

  // ============================================
  // Save & Complete
  // ============================================

  const saveAndComplete = async () => {
    if (saving) return
    setSaving(true)

    try {
      const mirror = generateMirrorText()
      const responseData = {
        shadows: shadows.filter(s => s.trait.trim()),
        suppressed_essence: suppressedEssence,
        origin,
        connect_the_dots: mirror.text,
      }

      // Save to quest_completions via completeFlowQuest
      const result = await completeFlowQuest({
        userId: user.id,
        flowId: 'shadow_work',
        pointsEarned: 8,
      })

      // Also store the response data directly
      // completeFlowQuest doesn't pass response_data, so we update the row
      if (result.success) {
        // Find the completion we just created and update with response_data
        const { data: latestCompletion } = await supabase
          .from('quest_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('quest_id', 'recognise_shadow_work')
          .order('created_at', { ascending: false })
          .limit(1)

        if (latestCompletion && latestCompletion.length > 0) {
          await supabase
            .from('quest_completions')
            .update({ response_data: responseData })
            .eq('id', latestCompletion[0].id)
        }
      } else if (result.reason === 'no_active_challenge') {
        // User completed the flow outside of an active challenge.
        // Still save the data to quest_completions so it's not lost.
        const { error: directInsertError } = await supabase
          .from('quest_completions')
          .insert([{
            user_id: user.id,
            quest_id: 'recognise_shadow_work',
            quest_category: 'Healing',
            quest_type: 'Recognise',
            points_earned: 8,
            challenge_day: 0,
            response_data: responseData,
          }])

        if (directInsertError) {
          console.error('Error saving shadow work (no active challenge):', directInsertError)
        }
      }

      clearProgress()
      setCurrentScreen('complete')
    } catch (err) {
      console.error('Error saving shadow work:', err)
      alert('Error saving your data. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // Progress
  // ============================================

  const currentScreenIndex = getScreenIndex(currentScreen)

  // ============================================
  // Screens
  // ============================================

  // ----- Loading -----
  const renderLoading = () => (
    <div className="ns-hc-container ns-hc-processing-container">
      <div className="ns-hc-spinner"></div>
      <div className="ns-hc-processing-text">Loading...</div>
    </div>
  )

  // ----- Time Check -----
  const renderTimeCheck = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Shadow Work Workshop</h1>

      {/* Weekly lock */}
      {weeklyLock?.completed && !showResumePrompt && (
        <div className="ns-hc-resume-prompt">
          <p className="ns-hc-resume-title">Completed this week</p>
          <p className="ns-hc-resume-info">
            You've already completed Shadow Work this week.
            <br />
            <span className="ns-hc-resume-time">
              Available again {weeklyLock.availableAt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </p>
          <div className="ns-hc-resume-actions">
            <button className="ns-hc-primary-button" style={{ margin: 0, maxWidth: '280px' }} onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>
        </div>
      )}

      {/* Resume prompt */}
      {showResumePrompt && savedProgressData && (
        <div className="ns-hc-resume-prompt">
          <p className="ns-hc-resume-title">Welcome back!</p>
          <p className="ns-hc-resume-info">
            You have saved progress at <strong>{getScreenDisplayName(savedProgressData.currentScreen)}</strong>
            <br />
            <span className="ns-hc-resume-time">Last saved {getTimeSinceSave()}</span>
          </p>
          <div className="ns-hc-resume-actions">
            <button className="ns-hc-primary-button" style={{ margin: 0, maxWidth: '280px' }} onClick={handleResumeProgress}>
              Continue Where I Left Off
            </button>
            <button className="ns-hc-secondary-button" style={{ margin: '12px 0 0 0', maxWidth: '280px' }} onClick={handleStartFresh}>
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* Normal start */}
      {!showResumePrompt && !weeklyLock?.completed && (
        <>
          <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
            <p><span className="time-icon">&#9201;</span></p>
            <p><strong>This flow takes about 15-20 minutes</strong></p>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>14 steps to uncover the parts of yourself you've been hiding, trace them to their origin, and bring them into the light.</p>
            <p>Find a quiet space where you can be honest with yourself.</p>
            <p><strong>This is deep self-work — be honest, not perfect.</strong></p>
          </div>

          <button className="primary-button glow-button" onClick={() => setCurrentScreen('teach_what_are_shadows')}>
            I'm Ready
          </button>
          <button
            className="primary-button"
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none', marginTop: '12px' }}
          >
            Come Back Later
          </button>
        </>
      )}
    </div>
  )

  // ----- Step 1: What Are Shadows? -----
  const renderTeachWhatAreShadows = () => (
    <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
      <div className="ns-hc-question-number">Step 1 of 14</div>
      <h2 className="ns-hc-question-text">What Are Shadows?</h2>

      <div className="ns-hc-intro-kicker">
        <p>A shadow is any part of yourself you suppress.</p>
        <p>We suppress for two reasons:</p>
        <p><strong>1. Society or culture told us it's "wrong" or "bad"</strong></p>
        <p><strong>2. It's a trait we've hidden because we've been hurt emotionally</strong></p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => goNext('teach_what_are_shadows')}>
          Continue
        </button>
        <BackButton fromScreen="teach_what_are_shadows" />
      </div>
    </div>
  )

  // ----- Step 2: Shadows & Light -----
  const renderTeachShadowsAndLight = () => (
    <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
      <div className="ns-hc-question-number">Step 2 of 14</div>
      <h2 className="ns-hc-question-text">Shadows & Light</h2>

      <div className="ns-hc-intro-kicker">
        <p>Fun fact about shadows?</p>
        <p><strong>They can't survive in the light.</strong></p>
        <p>Throughout this flow, I'll invite you to bring yours into the light — by writing them down, you're already beginning.</p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => goNext('teach_shadows_and_light')}>
          Continue
        </button>
        <BackButton fromScreen="teach_shadows_and_light" />
      </div>
    </div>
  )

  // ----- Step 3: Your Shadow Traits -----
  const renderInputShadowTraits = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 3 of 14</div>
      <h2 className="ns-hc-question-text">Your Shadow Traits</h2>
      <p className="ns-hc-question-subtext">Write down up to 5 things you suppress about yourself — interests, desires, thoughts, traits.</p>

      <div className="sw-shadow-list">
        {shadows.map((shadow, i) => (
          <div key={i} className="sw-shadow-input-row">
            <textarea
              placeholder={GUIDED_PROMPTS[i] || 'Another part of yourself you suppress...'}
              value={shadow.trait}
              onChange={(e) => updateShadow(i, 'trait', e.target.value)}
              rows={2}
            />
            {shadows.length > 1 && (
              <button className="sw-remove-btn" onClick={() => removeShadow(i)} title="Remove">
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {shadows.length < 5 && (
        <button className="sw-add-shadow-btn" onClick={addShadow}>
          + Add another shadow
        </button>
      )}

      <div className="sw-guided-prompts">
        <p className="sw-guided-prompt">What situations make you play smaller than you truly are?</p>
        <p className="sw-guided-prompt">Where do you avoid saying how you really feel?</p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => goNext('input_shadow_traits')}
          disabled={!hasShadowTraits}
          style={{ opacity: hasShadowTraits ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="input_shadow_traits" />
      </div>
    </div>
  )

  // ----- Step 4: What Scares You? -----
  const renderInputWhatScaresYou = () => {
    const activeShadows = shadows.filter(s => s.trait.trim())
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Step 4 of 14</div>
        <h2 className="ns-hc-question-text">What Scares You?</h2>
        <p className="ns-hc-question-subtext">Think about sharing each shadow with the world. What are you scared would happen?</p>

        {activeShadows.map((shadow, i) => {
          const realIndex = shadows.indexOf(shadow)
          return (
            <div key={realIndex} className="sw-shadow-card">
              <div className="sw-shadow-card-number">Shadow {i + 1}</div>
              <div className="sw-shadow-card-trait">"{shadow.trait}"</div>
              <div className="ns-hc-text-input-container" style={{ margin: 0 }}>
                <textarea
                  className="ns-hc-text-area"
                  placeholder="What are you scared would happen if you shared this?"
                  value={shadow.fear || ''}
                  onChange={(e) => updateShadow(realIndex, 'fear', e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
            </div>
          )
        })}

        <div className="ns-hc-sticky-nav">
          <button className="ns-hc-primary-button" onClick={() => goNext('input_what_scares_you')}>
            Continue
          </button>
          <BackButton fromScreen="input_what_scares_you" />
        </div>
      </div>
    )
  }

  // ----- Step 5: Root Emotions -----
  const renderTeachRootEmotions = () => (
    <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
      <div className="ns-hc-question-number">Step 5 of 14</div>
      <h2 className="ns-hc-question-text">Root Emotions</h2>

      <div className="ns-hc-intro-kicker">
        <p>Almost all shadows stem from a fear of feeling one of three root emotions:</p>
      </div>

      <div className="ns-hc-contract-list" style={{ marginTop: 16 }}>
        {ROOT_EMOTIONS.map(e => (
          <div key={e.key} className="ns-hc-contract-option" style={{ cursor: 'default', pointerEvents: 'none' }}>
            <strong>{e.label}</strong>
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{e.description}</span>
          </div>
        ))}
      </div>

      <p className="ns-hc-intro-body" style={{ marginTop: 20 }}>
        Nobody likes feeling shame, fear, or guilt. So to hide these shadows, we adopt <span className="ns-hc-highlight">protective behaviours</span>.
      </p>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => goNext('teach_root_emotions')}>
          Continue
        </button>
        <BackButton fromScreen="teach_root_emotions" />
      </div>
    </div>
  )

  // ----- Step 6: Label Your Shadows -----
  const renderInputLabelShadows = () => {
    const activeShadows = shadows.filter(s => s.trait.trim())
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Step 6 of 14</div>
        <h2 className="ns-hc-question-text">Label Your Shadows</h2>
        <p className="ns-hc-question-subtext">Which root emotion sits behind each shadow trait?</p>

        {activeShadows.map((shadow, i) => {
          const realIndex = shadows.indexOf(shadow)
          return (
            <div key={realIndex} className="sw-shadow-card">
              <div className="sw-shadow-card-number">Shadow {i + 1}</div>
              <div className="sw-shadow-card-trait">"{shadow.trait}"</div>
              {shadow.fear && (
                <div className="sw-annotation">Fear: <strong>{shadow.fear}</strong></div>
              )}
              <div className="sw-emotion-selector">
                {ROOT_EMOTIONS.map(e => (
                  <button
                    key={e.key}
                    className={`sw-emotion-btn ${shadow.root_emotion === e.key ? 'selected' : ''}`}
                    onClick={() => updateShadow(realIndex, 'root_emotion', e.key)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        <div className="ns-hc-sticky-nav">
          <button
            className="ns-hc-primary-button"
            onClick={() => goNext('input_label_shadows')}
            disabled={!allShadowsHaveEmotion}
            style={{ opacity: allShadowsHaveEmotion ? 1 : 0.5 }}
          >
            Continue
          </button>
          <BackButton fromScreen="input_label_shadows" />
        </div>
      </div>
    )
  }

  // ----- Step 7: Protective Archetypes -----
  const renderTeachProtectiveArchetypes = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 7 of 14</div>
      <h2 className="ns-hc-question-text">Protective Archetypes</h2>

      <div className="ns-hc-intro-kicker">
        <p>To avoid feeling those emotions, we adopt these protective behaviours as our armour:</p>
      </div>

      <div className="sw-archetype-teach-grid">
        {ARCHETYPES.map(a => (
          <div key={a.key} className="sw-archetype-teach-card">
            <span className="sw-at-icon">{a.icon}</span>
            <div>
              <span className="sw-at-name">{a.label}</span>
              <span className="sw-at-lie">{a.lie}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="ns-hc-intro-body" style={{ marginTop: 16 }}>
        Anytime you're a protective archetype, it's creating a shadow to hide a part of you.
      </p>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => goNext('teach_protective_archetypes')}>
          Continue
        </button>
        <BackButton fromScreen="teach_protective_archetypes" />
      </div>
    </div>
  )

  // ----- Step 8: Map Your Armour -----
  // Pre-select user's known archetype when first entering step 8
  const archetypePreselected = useRef(false)
  useEffect(() => {
    if (currentScreen === 'input_map_armour' && userArchetype && !archetypePreselected.current) {
      setShadows(prev => {
        const needsPreselect = prev.some(s => s.trait.trim() && !s.archetype)
        if (!needsPreselect) return prev
        archetypePreselected.current = true
        return prev.map(s =>
          s.trait.trim() && !s.archetype ? { ...s, archetype: userArchetype } : s
        )
      })
    }
    if (currentScreen !== 'input_map_armour') {
      archetypePreselected.current = false
    }
  }, [currentScreen, userArchetype])

  const renderInputMapArmour = () => {
    const activeShadows = shadows.filter(s => s.trait.trim())
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Step 8 of 14</div>
        <h2 className="ns-hc-question-text">Map Your Armour</h2>
        <p className="ns-hc-question-subtext">Which protective archetype do you become to hide each shadow?</p>

        {activeShadows.map((shadow, i) => {
          const realIndex = shadows.indexOf(shadow)
          const emotionLabel = ROOT_EMOTIONS.find(e => e.key === shadow.root_emotion)?.label
          return (
            <div key={realIndex} className="sw-shadow-card">
              <div className="sw-shadow-card-number">Shadow {i + 1}</div>
              <div className="sw-shadow-card-trait">"{shadow.trait}"</div>
              {emotionLabel && (
                <div className="sw-annotation">Root emotion: <strong>{emotionLabel}</strong></div>
              )}
              <div className="sw-archetype-selector">
                {ARCHETYPES.map(a => (
                  <button
                    key={a.key}
                    className={`sw-archetype-btn ${shadow.archetype === a.key ? 'selected' : ''}`}
                    onClick={() => updateShadow(realIndex, 'archetype', a.key)}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        <div className="ns-hc-sticky-nav">
          <button
            className="ns-hc-primary-button"
            onClick={() => goNext('input_map_armour')}
            disabled={!allShadowsHaveArchetype}
            style={{ opacity: allShadowsHaveArchetype ? 1 : 0.5 }}
          >
            Continue
          </button>
          <BackButton fromScreen="input_map_armour" />
        </div>
      </div>
    )
  }

  // ----- Step 9: The Heartbreaking Truth -----
  const renderTeachHeartbreakingTruth = () => (
    <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
      <div className="ns-hc-question-number">Step 9 of 14</div>
      <h2 className="ns-hc-question-text">The Heartbreaking Truth</h2>

      <div className="ns-hc-intro-kicker">
        <p>Sometimes <strong>authentic</strong> parts of ourselves become a shadow too.</p>
        <p>Think about yourself as a kid — things you used to love to do.</p>
        <p>Now imagine getting teased, made fun of, or rejected for those things.</p>
        <p>How would that feel?</p>
        <p>Horrible. Shameful. Embarrassing.</p>
        <p>And we never want to feel that way again. So we suppress that authentic part of us.</p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => goNext('teach_heartbreaking_truth')}>
          Continue
        </button>
        <BackButton fromScreen="teach_heartbreaking_truth" />
      </div>
    </div>
  )

  // ----- Step 10: Suppressed Essence -----
  const renderInputSuppressedEssence = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 10 of 14</div>
      <h2 className="ns-hc-question-text">Suppressed Essence</h2>
      <p className="ns-hc-question-subtext">Identify an authentic thing you'd love to do or experience but hold yourself back from.</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="What's one authentic thing you'd love to do or experience but hold yourself back from?"
          value={suppressedEssence.trait}
          onChange={(e) => setSuppressedEssence(prev => ({ ...prev, trait: e.target.value }))}
        />
      </div>

      <div className="ns-hc-text-input-container" style={{ marginTop: 0 }}>
        <textarea
          className="ns-hc-text-area"
          placeholder="What's stopping you from doing it?"
          value={suppressedEssence.whats_stopping}
          onChange={(e) => setSuppressedEssence(prev => ({ ...prev, whats_stopping: e.target.value }))}
        />
      </div>

      <p className="hc-script-prompt" style={{ marginTop: 16, marginBottom: 8 }}>
        Instead of expressing it, which protective archetype do you become?
      </p>

      <div className="ns-hc-contract-list">
        {ARCHETYPES.map(a => (
          <button
            key={a.key}
            className={`ns-hc-contract-option ${suppressedEssence.archetype === a.key ? 'selected' : ''}`}
            onClick={() => setSuppressedEssence(prev => ({ ...prev, archetype: a.key }))}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>{a.icon}</span>
            <strong>{a.label}</strong>
          </button>
        ))}
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => goNext('input_suppressed_essence')}
          disabled={!hasEssence}
          style={{ opacity: hasEssence ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="input_suppressed_essence" />
      </div>
    </div>
  )

  // ----- Step 11: Your Origin Story -----
  const renderTeachOriginStory = () => (
    <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
      <div className="ns-hc-question-number">Step 11 of 14</div>
      <h2 className="ns-hc-question-text">Your Origin Story</h2>

      <div className="ns-hc-intro-kicker">
        <p>You didn't wake up today and decide to be this protective archetype.</p>
        <p>Something from the time you were a kid to today has caused it to show up.</p>
        <p><strong>Let's trace it back.</strong></p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => goNext('teach_origin_story')}>
          Continue
        </button>
        <BackButton fromScreen="teach_origin_story" />
      </div>
    </div>
  )

  // ----- Step 12: Timeline -----
  const renderInputTimeline = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 12 of 14</div>
      <h2 className="ns-hc-question-text">Timeline</h2>
      <p className="ns-hc-question-subtext">Can you think of a time when you first embodied this archetype? A particular moment or series of events?</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="What happened? What moment or series of events caused pain?"
          value={origin.event}
          onChange={(e) => setOrigin(prev => ({ ...prev, event: e.target.value }))}
        />
      </div>

      <p className="hc-script-prompt" style={{ marginTop: 16, marginBottom: 8 }}>
        How did it make you feel?
      </p>

      <select
        className="sw-emotion-dropdown"
        value={origin.emotion}
        onChange={(e) => setOrigin(prev => ({ ...prev, emotion: e.target.value }))}
      >
        <option value="" disabled>Select an emotion...</option>
        {TIMELINE_EMOTIONS.map(e => (
          <option key={e.key} value={e.key}>{e.label}</option>
        ))}
      </select>

      <div className="ns-hc-text-input-container" style={{ marginTop: 16 }}>
        <textarea
          className="ns-hc-text-area"
          placeholder="Describe how it felt... (optional)"
          value={origin.feelings}
          onChange={(e) => setOrigin(prev => ({ ...prev, feelings: e.target.value }))}
          style={{ minHeight: '80px' }}
        />
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => goNext('input_timeline')}
          disabled={!hasTimeline}
          style={{ opacity: hasTimeline ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="input_timeline" />
      </div>
    </div>
  )

  // ----- Step 13: Connect the Dots -----
  const renderConnectTheDots = () => {
    const mirror = generateMirrorText()
    return (
      <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
        <div className="ns-hc-question-number">Step 13 of 14</div>
        <h2 className="ns-hc-question-text">Connect the Dots</h2>

        <div className="sw-mirror-text">
          This experience of <strong>"{mirror.event}"</strong> made you feel <strong>{mirror.emotion}</strong>.
          <br /><br />
          To protect yourself, you started hiding <strong>"{mirror.trait}"</strong> and became <strong>{mirror.archetype}</strong> instead.
        </div>

        <p className="ns-hc-intro-body" style={{ marginTop: 20 }}>
          This is the pattern that's been running your life. And now you can see it.
        </p>

        <div className="ns-hc-sticky-nav">
          <button className="ns-hc-primary-button" onClick={saveAndComplete} disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Save & Complete'}
          </button>
          <BackButton fromScreen="connect_the_dots" />
        </div>
      </div>
    )
  }

  // ----- Complete -----
  const renderComplete = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <h1 className="ns-hc-welcome-greeting">Shadows in the Light</h1>
      <div className="ns-hc-welcome-message">
        <p>Your shadows exist because parts of you were made to feel unaccepted.</p>
        <p><strong>All shadows are actually authentic parts of you.</strong></p>
        <p>Now that you've brought them into the light, the healing has already begun.</p>
        <p>You can come back each week to explore different shadows — building a deeper understanding of yourself over time.</p>
      </div>

      <FlowFeedback flowType="shadow_work" userId={user?.id} />

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => navigate('/7-day-challenge?tab=healing')}
        >
          Back to Healing Quests
        </button>
      </div>
    </div>
  )

  // ============================================
  // Render
  // ============================================

  return (
    <div className="ns-hc-app">
      {/* Progress dots */}
      {currentScreen !== 'loading' && currentScreen !== 'time_check' && currentScreen !== 'complete' && (
        <div className="ns-hc-progress-container">
          <div className="ns-hc-progress-dots">
            {Array.from({ length: TOTAL_DOTS }).map((_, index) => (
              <div
                key={index}
                className={`ns-hc-progress-dot ${
                  index < currentScreenIndex ? 'completed' :
                  index === currentScreenIndex ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screen content */}
      {currentScreen === 'loading' && renderLoading()}
      {currentScreen === 'time_check' && renderTimeCheck()}
      {currentScreen === 'teach_what_are_shadows' && renderTeachWhatAreShadows()}
      {currentScreen === 'teach_shadows_and_light' && renderTeachShadowsAndLight()}
      {currentScreen === 'input_shadow_traits' && renderInputShadowTraits()}
      {currentScreen === 'input_what_scares_you' && renderInputWhatScaresYou()}
      {currentScreen === 'teach_root_emotions' && renderTeachRootEmotions()}
      {currentScreen === 'input_label_shadows' && renderInputLabelShadows()}
      {currentScreen === 'teach_protective_archetypes' && renderTeachProtectiveArchetypes()}
      {currentScreen === 'input_map_armour' && renderInputMapArmour()}
      {currentScreen === 'teach_heartbreaking_truth' && renderTeachHeartbreakingTruth()}
      {currentScreen === 'input_suppressed_essence' && renderInputSuppressedEssence()}
      {currentScreen === 'teach_origin_story' && renderTeachOriginStory()}
      {currentScreen === 'input_timeline' && renderInputTimeline()}
      {currentScreen === 'connect_the_dots' && renderConnectTheDots()}
      {currentScreen === 'complete' && renderComplete()}
    </div>
  )
}
