/**
 * LifeMapFlow.jsx — /life-map
 *
 * Unified Life Map flow replacing Shadow Work + Flow Finder.
 * Users reflect on 5 life periods, AI clusters into skills/problems/personas.
 * Living document: can be revisited and expanded over time.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { useAutoSave } from '../hooks/useAutoSave'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './LifeMapFlow.css'

// ─── CONSTANTS ──────────────────────────────────────────

const PERIODS = [
  { id: 'childhood', name: 'Childhood', age: 'Pre-school + Primary School', periodNum: 1 },
  { id: 'teens', name: 'Teens', age: 'High School', periodNum: 2 },
  { id: 'young_adult', name: 'Young Adult', age: '18 – 25', periodNum: 3 },
  { id: 'career', name: 'Career', age: '25+', periodNum: 4 },
  { id: 'now', name: 'Now + Future', age: 'Where you are and where you\'re going', periodNum: 5 },
]

const QUESTIONS = {
  childhood: {
    skills: { label: 'What did you love doing?', hint: 'Hobbies, free-time, what you naturally gravitated toward', placeholders: ['e.g. Building Lego, drawing, climbing trees...', 'e.g. Playing games, making up stories...'] },
    problems: { label: 'What was hard or made you feel different?', hint: 'Challenges, struggles, things that set you apart', placeholders: ['e.g. Moving schools, feeling like the odd one out...', 'e.g. Parents splitting, being bullied...'] },
    personas: { label: 'Who were your heroes?', hint: 'Characters from movies, TV, books you absolutely loved', placeholders: ['e.g. Spider-Man, Harry Potter, a teacher...', 'e.g. An older cousin, a cartoon character...'] },
  },
  teens: {
    skills: { label: 'What were you into?', hint: 'Activities, subjects, how you spent your time', placeholders: ['e.g. Playing guitar, drama, skateboarding...', 'e.g. Coding, sports, art class...'] },
    problems: { label: 'What were the biggest challenges you faced?', hint: 'What you overcame, what pushed you', placeholders: ['e.g. Not fitting in, academic pressure...', 'e.g. Bullying, family stuff, identity...'] },
    personas: { label: 'Who inspired you?', hint: 'Role models, characters, people you looked up to', placeholders: ['e.g. A coach, Steve Jobs, a musician...', 'e.g. A fictional character, a teacher...'] },
  },
  young_adult: {
    skills: { label: 'What did you spend your energy on?', hint: 'Projects, studies, creative outlets, side hustles', placeholders: ['e.g. Started a blog, studied psychology...', 'e.g. Built an app, ran events, freelanced...'] },
    problems: { label: 'What shaped you most?', hint: 'Struggles, pivots, or moments that changed your direction', placeholders: ['e.g. Dropping out, a breakup, burnout...', 'e.g. Losing someone, hitting rock bottom...'] },
    personas: { label: 'Who did you admire?', hint: 'What about them resonated with you?', placeholders: ['e.g. Brené Brown (vulnerability as strength)...', 'e.g. A mentor, Naval Ravikant...'] },
  },
  career: {
    skills: { label: 'What energized you at work?', hint: 'Tasks, roles, projects where you felt alive', placeholders: ['e.g. Leading workshops, solving problems...', 'e.g. Designing experiences, coaching...'] },
    problems: { label: 'What frustrated you or drove you?', hint: 'Problems you wanted to solve, injustices that fired you up', placeholders: ['e.g. People stuck in jobs they hate...', 'e.g. Talented people playing small...'] },
    personas: { label: 'Who do you wish you could help?', hint: 'Who did you see struggling? Who needed what you know?', placeholders: ['e.g. Junior team members who felt lost...', 'e.g. Friends burnt out in corporate...'] },
  },
  now: {
    skills: { label: 'What lights you up right now?', hint: 'What would you do even if no one paid you?', placeholders: ['e.g. Building this app, writing, coaching...', 'e.g. Making videos, designing experiences...'] },
    problems: { label: 'What do you want to change?', hint: 'In your life, in others\' lives, in the world', placeholders: ['e.g. People wasting lives in unfulfilling careers...', 'e.g. The way mental health is treated...'] },
    personas: { label: 'Who needs what you\'ve learned?', hint: 'If you could go back and help a younger version of someone, who?', placeholders: ['e.g. The 25-year-old me who was burnt out...', 'e.g. Anyone stuck in "Head Full of Dreams"...'] },
  },
}

const SCREEN_ORDER = [
  'time_check', 'welcome',
  'period_childhood', 'period_teens', 'period_young_adult', 'period_career', 'period_now',
  'processing', 'connecting_dots', 'life_map',
  'nikigai', 'chamber_intro', 'chamber_reveal', 'gap_insight',
  'complete',
]

const CATEGORIES = ['skills', 'problems', 'personas']

const initResponses = () => {
  const r = {}
  PERIODS.forEach(p => {
    CATEGORIES.forEach(c => {
      r[`${p.id}_${c}`] = ['', '']
    })
  })
  return r
}

// ─── COMPONENT ──────────────────────────────────────────

export default function LifeMapFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Core state
  const [currentScreen, setCurrentScreen] = useState('time_check')
  const [responses, setResponses] = useState(initResponses)
  const [sessionId, setSessionId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0) // 0-3 for the 4 AI calls

  // Results
  const [skillsClusters, setSkillsClusters] = useState([])
  const [problemsClusters, setProblemsClusters] = useState([])
  const [personasClusters, setPersonasClusters] = useState([])
  const [connectingDotsNarrative, setConnectingDotsNarrative] = useState('')

  // Essence archetype
  const [essenceArchetype, setEssenceArchetype] = useState(null)
  const [essenceImage, setEssenceImage] = useState(null)

  // Living document
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false)
  const [savedSession, setSavedSession] = useState(null)

  // Favourites curation
  const [favouriteSkillIds, setFavouriteSkillIds] = useState(new Set())
  const [favouriteProblemIds, setFavouriteProblemIds] = useState(new Set())

  // Essence Chamber (pillars)
  const [essenceChamber, setEssenceChamber] = useState(null)
  const [expandedDropdown, setExpandedDropdown] = useState(null)
  const [expandedPillar, setExpandedPillar] = useState(null)

  // Mural
  const [muralUrl, setMuralUrl] = useState(null)
  const [muralLoading, setMuralLoading] = useState(false)

  // Ref to always have current responses (avoids stale closure in async runClustering)
  const responsesRef = useRef(responses)
  useEffect(() => { responsesRef.current = responses }, [responses])

  // Stable sticky note rotations (seeded once, not on every render)
  const stickyRotations = useMemo(() => {
    const rots = {}
    PERIODS.forEach(p => {
      CATEGORIES.forEach(cat => {
        for (let i = 0; i < 5; i++) {
          rots[`${p.id}_${cat}_${i}`] = (Math.random() * 3 - 1.5).toFixed(1)
        }
      })
    })
    return rots
  }, [])

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('life-map', user?.id)

  // ─── MOUNT: Check for completed session + essence ─────

  useEffect(() => {
    if (!user?.id) return
    checkPreviousCompletion()
    fetchEssenceArchetype()
  }, [user?.id])

  const checkPreviousCompletion = async () => {
    const { data } = await supabase
      .from('flow_sessions')
      .select('id, response_data')
      .eq('user_id', user.id)
      .eq('flow_type', 'life_map')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)

    if (data?.length > 0) {
      setHasCompletedBefore(true)
      setSavedSession(data[0])
      setCurrentScreen('return')
    } else {
      checkAutoSave()
    }
  }

  const fetchEssenceArchetype = async () => {
    const { data } = await supabase
      .from('lead_flow_profiles')
      .select('essence_archetype, custom_essence_name, custom_essence_image, custom_essence_fields')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (data?.length > 0) {
      setEssenceArchetype(data[0].custom_essence_name || data[0].essence_archetype)
      setEssenceImage(data[0].custom_essence_image || null)
    }
  }

  const checkAutoSave = () => {
    const saved = loadProgress()
    if (saved?.currentScreen && saved.currentScreen !== 'time_check' && saved.currentScreen !== 'complete') {
      setSavedProgressData(saved)
      setShowResumePrompt(true)
    }
  }

  // ─── AUTO-SAVE on screen/response changes ─────

  useEffect(() => {
    if (!user || ['time_check', 'return', 'complete', 'processing', 'connecting_dots', 'chamber_intro'].includes(currentScreen)) return
    saveProgress({ currentScreen, responses, essenceChamber })
  }, [currentScreen, responses, essenceChamber, saveProgress, user])

  // ─── SESSION ──────────────────────────────────────────

  const createSession = async () => {
    try {
      const { data, error } = await supabase
        .from('flow_sessions')
        .insert({ user_id: user.id, flow_type: 'life_map', status: 'in_progress' })
        .select()
        .single()
      if (error) throw error
      setSessionId(data.id)
      return data.id
    } catch (err) {
      console.error('Error creating session:', err)
    }
  }

  // ─── INPUT HANDLERS ───────────────────────────────────

  const updateResponse = (key, index, value) => {
    setResponses(prev => {
      const arr = [...prev[key]]
      arr[index] = value
      return { ...prev, [key]: arr }
    })
  }

  const addInput = (key) => {
    if (responses[key].length >= 5) return
    setResponses(prev => ({ ...prev, [key]: [...prev[key], ''] }))
    hapticLight()
  }

  const removeInput = (key, index) => {
    if (responses[key].length <= 2) return
    setResponses(prev => {
      const arr = [...prev[key]]
      arr.splice(index, 1)
      return { ...prev, [key]: arr }
    })
  }

  // ─── VALIDATION ───────────────────────────────────────

  const countFilled = (key) => responses[key].filter(r => r.trim()).length

  const isPeriodValid = (periodId) => {
    return CATEGORIES.every(cat => countFilled(`${periodId}_${cat}`) >= 1)
  }

  const totalFilledForPeriod = (periodId) => {
    return CATEGORIES.reduce((sum, cat) => sum + countFilled(`${periodId}_${cat}`), 0)
  }

  // ─── NAVIGATION ───────────────────────────────────────

  const goToScreen = (screen) => {
    setCurrentScreen(screen)
    window.scrollTo(0, 0)
  }

  const getNextPeriodScreen = (currentPeriodId) => {
    const idx = PERIODS.findIndex(p => p.id === currentPeriodId)
    if (idx < PERIODS.length - 1) return `period_${PERIODS[idx + 1].id}`
    return 'processing'
  }

  const getPrevPeriodScreen = (currentPeriodId) => {
    const idx = PERIODS.findIndex(p => p.id === currentPeriodId)
    if (idx > 0) return `period_${PERIODS[idx - 1].id}`
    return 'welcome'
  }

  // ─── MURAL GENERATION (background) ─────────────────────

  const muralStartedRef = useRef(false)

  const generateMural = async () => {
    if (muralUrl || muralLoading || muralStartedRef.current) return
    muralStartedRef.current = true
    setMuralLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-life-map-mural', {
        body: { responses: responsesRef.current }
      })
      if (error) throw error
      if (data?.url) setMuralUrl(data.url)
    } catch (err) {
      console.error('Mural generation failed:', err)
    } finally {
      setMuralLoading(false)
    }
  }

  // ─── AI PROCESSING ────────────────────────────────────

  const aggregateByCategory = (category, currentResponses) => {
    const items = []
    PERIODS.forEach(p => {
      currentResponses[`${p.id}_${category}`].forEach(val => {
        if (val.trim()) items.push(`[${p.name}] ${val.trim()}`)
      })
    })
    return items
  }

  const runClustering = async (newSessionId) => {
    // Snapshot responses at call time to avoid stale closure
    const currentResponses = { ...responsesRef.current }

    setIsProcessing(true)
    setCurrentScreen('processing')
    setProcessingStep(0)

    try {
      const sid = newSessionId || sessionId

      // Helper: call clustering with one retry on empty/error result
      const clusterWithRetry = async (stepId, prompt, type, sources, items) => {
        if (items.length === 0) return []
        const body = {
          currentStep: { id: stepId, assistant_prompt: prompt },
          userResponse: `Ready to analyze ${type} from life map`,
          shouldCluster: true,
          clusterType: type,
          clusterSources: sources,
          allResponses: [{ user_id: user.id, response_raw: items.join('\n'), store_as: sources[0] }],
          conversationHistory: [],
        }
        const result = await supabase.functions.invoke('nikigai-conversation', { body })
        // Check for error response (edge function returned 500)
        if (result.error || result.data?.error) {
          console.warn(`Life Map: ${type} clustering failed:`, result.error || result.data?.error, 'Retrying...')
          const retry = await supabase.functions.invoke('nikigai-conversation', { body })
          if (retry.error || retry.data?.error) {
            console.error(`Life Map: ${type} clustering failed on retry:`, retry.error || retry.data?.error)
            return []
          }
          return retry.data?.clusters || []
        }
        const clusters = result.data?.clusters || []
        if (clusters.length > 0) return clusters
        // Retry once if we had input but got empty output (AI returned no clusters)
        console.warn(`Life Map: ${type} clustering returned empty with ${items.length} items. Retrying...`)
        const retry = await supabase.functions.invoke('nikigai-conversation', { body })
        return retry.data?.clusters || []
      }

      // Call 1: Skills
      const skillsItems = aggregateByCategory('skills', currentResponses)
      const skillsCl = await clusterWithRetry(
        'life_map_skills', 'Life Map skills clustering', 'roles',
        ['life_map_skills'], skillsItems
      )
      setSkillsClusters(skillsCl)

      // Call 2: Problems
      setProcessingStep(1)
      const problemsItems = aggregateByCategory('problems', currentResponses)
      const problemsCl = await clusterWithRetry(
        'life_map_problems', 'Life Map problems clustering', 'problems',
        ['life_map_problems'], problemsItems
      )
      setProblemsClusters(problemsCl)

      // Call 3: Personas
      setProcessingStep(2)
      const personasItems = aggregateByCategory('personas', currentResponses)
      const personasCl = await clusterWithRetry(
        'life_map_personas', 'Life Map personas clustering', 'persona',
        ['life_map_personas'], personasItems
      )
      setPersonasClusters(personasCl)

      // Call 4: Connecting the Dots narrative
      setProcessingStep(3)
      const dotsPrompt = `You are writing a deeply personal mirror for someone who just mapped their entire life story.

THEIR RAW ANSWERS (by period):
${JSON.stringify(currentResponses)}

CLUSTERS FOUND:
Skills: ${skillsCl.map(c => c.label).join(', ')}
Problems: ${problemsCl.map(c => c.label).join(', ')}
Personas: ${personasCl.map(c => c.label).join(', ')}

${essenceArchetype ? `THEIR ESSENCE ARCHETYPE: ${essenceArchetype}` : ''}

Write exactly 3-4 paragraphs connecting the dots across their life. Rules:
1. Reference at least one SPECIFIC item from childhood, one from the middle periods, and one from now. Use their EXACT words.
2. Show them a pattern they couldn't see themselves. Connect items from different periods that point to the same truth.
3. ${essenceArchetype ? `Thread their ${essenceArchetype} essence through the narrative. Show it was present even in childhood.` : 'No essence archetype available, skip this.'}
4. Start with "From [specific childhood item]..."
5. BANNED phrases: "journey of self-discovery", "unique blend", "passion for", "making a difference", "true calling". These are horoscope language. Be specific.
6. Write as if you're a wise friend who just saw something in their story they missed. Warm, direct, no filler.
7. Use <strong> tags around the most important connecting phrases (2-3 per paragraph max).`

      const dotsResult = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'life_map_dots', assistant_prompt: dotsPrompt },
          userResponse: 'Generate the connecting the dots narrative',
          shouldCluster: false,
          conversationHistory: [],
        }
      })
      setConnectingDotsNarrative(dotsResult.data?.message || '')

      // Call 5: Derive Essence Chamber pillars
      setProcessingStep(4)
      let chamberData = null
      try {
        const chamberResult = await supabase.functions.invoke('derive-pillars', {
          body: {
            responses: currentResponses,
            skillsClusters: skillsCl,
            problemsClusters: problemsCl,
            personasClusters: personasCl,
            essenceArchetype: essenceArchetype || null,
          }
        })
        if (chamberResult.error || chamberResult.data?.error) {
          console.warn('Essence Chamber derivation failed:', chamberResult.error || chamberResult.data?.error)
        } else {
          chamberData = chamberResult.data
          setEssenceChamber(chamberData)
        }
      } catch (chamberErr) {
        console.warn('Essence Chamber call failed:', chamberErr)
      }

      // Warn if any category came back empty despite having input
      const emptyCategories = []
      if (skillsCl.length === 0 && aggregateByCategory('skills', currentResponses).length > 0) emptyCategories.push('skills')
      if (problemsCl.length === 0 && problemsItems.length > 0) emptyCategories.push('problems')
      if (personasCl.length === 0 && personasItems.length > 0) emptyCategories.push('personas')
      if (emptyCategories.length > 0) {
        console.error('Life Map: Empty clusters despite having input for:', emptyCategories.join(', '))
      }

      // Save clusters to DB
      const allClusters = [
        ...skillsCl.map(c => ({ ...c, cluster_type: 'skills' })),
        ...problemsCl.map(c => ({ ...c, cluster_type: 'problems' })),
        ...personasCl.map(c => ({ ...c, cluster_type: 'persona' })),
      ]

      // Archive old Life Map clusters (keep for history, scoped to null step_id to avoid wiping Curiosity Compass clusters)
      await supabase
        .from('nikigai_clusters')
        .update({ cluster_stage: 'archived' })
        .eq('user_id', user.id)
        .eq('cluster_stage', 'final')
        .in('cluster_type', ['skills', 'problems', 'persona'])
        .is('step_id', null)

      // Insert new clusters
      const clustersToSave = allClusters.map(c => ({
        user_id: user.id,
        session_id: sid,
        cluster_type: c.cluster_type,
        cluster_stage: 'final',
        cluster_label: c.label,
        insight: c.insight,
        proficiency: null,
        items: (c.items || []).map(item => ({ text: item })),
      }))

      if (clustersToSave.length > 0) {
        const { data: inserted } = await supabase.from('nikigai_clusters').insert(clustersToSave).select('id, cluster_type, cluster_label')
        // Attach DB ids to in-memory cluster state for favouriting
        if (inserted) {
          const attachId = (clusters, type) => clusters.map(c => {
            const row = inserted.find(r => r.cluster_type === type && r.cluster_label === c.label)
            return { ...c, id: row?.id || null }
          })
          setSkillsClusters(prev => attachId(prev, 'skills'))
          setProblemsClusters(prev => attachId(prev, 'problems'))
          setPersonasClusters(prev => attachId(prev, 'persona'))
        }
      }

      // Sync with challenge system
      await syncFlowFinderWithChallenge(user.id, 'life_map')

      // Clear auto-save
      clearProgress()

      // Go to connecting the dots (do this BEFORE metadata save so user isn't bounced on non-critical failure)
      goToScreen('connecting_dots')

      // Mark session complete + save raw responses (non-blocking)
      supabase
        .from('flow_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          response_data: {
            responses: currentResponses,
            connecting_dots_narrative: dotsResult.data?.message || '',
            essence_archetype_used: essenceArchetype || null,
            essence_chamber: chamberData || null,
          },
        })
        .eq('id', sid)
        .then(({ error }) => {
          if (error) console.error('Non-critical: Failed to save session metadata:', error)
        })
    } catch (err) {
      console.error('Error in Life Map processing:', err)
      alert('Something went wrong during analysis. Please try again.')
      goToScreen('period_now')
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── LIVING DOCUMENT: Load saved responses ────────────

  const loadSavedResponses = () => {
    if (savedSession?.response_data?.responses) {
      setResponses(savedSession.response_data.responses)
      setConnectingDotsNarrative(savedSession.response_data.connecting_dots_narrative || '')
    }
  }

  const handleReturnView = async () => {
    clearProgress()
    loadSavedResponses()
    // Restore narrative from saved session
    if (savedSession?.response_data?.connecting_dots_narrative) {
      setConnectingDotsNarrative(savedSession.response_data.connecting_dots_narrative)
    }
    // Restore Essence Chamber from saved session
    if (savedSession?.response_data?.essence_chamber) {
      setEssenceChamber(savedSession.response_data.essence_chamber)
    }
    // Load clusters from DB
    const { data: clusters } = await supabase
      .from('nikigai_clusters')
      .select('*')
      .eq('user_id', user.id)
      .eq('cluster_stage', 'final')
      .in('cluster_type', ['skills', 'problems', 'persona'])
      .order('created_at', { ascending: false })

    if (clusters) {
      const mapCluster = c => ({ id: c.id, label: c.cluster_label, insight: c.insight, items: (c.items || []).map(i => i.text || i) })
      setSkillsClusters(clusters.filter(c => c.cluster_type === 'skills').map(mapCluster))
      setProblemsClusters(clusters.filter(c => c.cluster_type === 'problems').map(mapCluster))
      setPersonasClusters(clusters.filter(c => c.cluster_type === 'persona').map(mapCluster))
      // Restore favourite selections
      const favSkills = new Set(clusters.filter(c => c.cluster_type === 'skills' && c.is_favourite).map(c => c.id))
      const favProblems = new Set(clusters.filter(c => c.cluster_type === 'problems' && c.is_favourite).map(c => c.id))
      setFavouriteSkillIds(favSkills)
      setFavouriteProblemIds(favProblems)
    }
    goToScreen('life_map')
  }

  const handleReturnAdd = async () => {
    loadSavedResponses()
    clearProgress()
    await createSession()
    goToScreen('period_childhood')
  }

  const handleReturnFresh = async () => {
    clearProgress()
    setResponses(initResponses())
    setHasCompletedBefore(false)
    setSavedSession(null)
    const sid = await createSession()
    goToScreen('welcome')
  }

  // ─── START FLOW ───────────────────────────────────────

  const handleStart = async () => {
    const sid = await createSession()
    goToScreen('period_childhood')
  }

  const handleResume = () => {
    if (savedProgressData) {
      setResponses(savedProgressData.responses || initResponses())
      if (savedProgressData.essenceChamber) setEssenceChamber(savedProgressData.essenceChamber)
      goToScreen(savedProgressData.currentScreen)
    }
    setShowResumePrompt(false)
  }

  const handleFreshStart = async () => {
    setResponses(initResponses())
    setShowResumePrompt(false)
    const sid = await createSession()
    goToScreen('welcome')
  }

  // ─── PERIOD SCREEN RENDERER ───────────────────────────

  const renderPeriodScreen = (period) => {
    const questions = QUESTIONS[period.id]
    const isLast = period.id === 'now'
    const filled = totalFilledForPeriod(period.id)
    const valid = isPeriodValid(period.id)
    const periodIdx = PERIODS.findIndex(p => p.id === period.id)

    return (
      <div className="lm-container" key={period.id}>
        <div className="lm-period-header">
          <span className="lm-era-badge">Period {period.periodNum} of 5</span>
          <h2 className="lm-period-title lm-gold-text">{period.name}</h2>
          <p className="lm-period-age">{period.age}</p>
        </div>

        <div className="lm-progress-dots">
          {PERIODS.map((p, i) => (
            <div key={p.id} className={`lm-progress-dot ${i < periodIdx ? 'done' : ''} ${i === periodIdx ? 'active' : ''}`} />
          ))}
        </div>

        <div className="lm-questions">
          {CATEGORIES.map(cat => (
            <div key={cat} className={`lm-question-card ${cat}`}>
              <div className="lm-question-label">{questions[cat].label}</div>
              <div className="lm-question-hint">{questions[cat].hint}</div>
              <div className="lm-input-list">
                {responses[`${period.id}_${cat}`].map((val, i) => (
                  <div key={i} className="lm-input-row">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateResponse(`${period.id}_${cat}`, i, e.target.value)}
                      placeholder={questions[cat].placeholders[i] || `Enter another...`}
                    />
                    {responses[`${period.id}_${cat}`].length > 2 && (
                      <button className="lm-remove-btn" onClick={() => removeInput(`${period.id}_${cat}`, i)}>×</button>
                    )}
                  </div>
                ))}
              </div>
              {responses[`${period.id}_${cat}`].length < 5 && (
                <button className="lm-add-more" onClick={() => addInput(`${period.id}_${cat}`)}>+ Add more</button>
              )}
            </div>
          ))}
        </div>

        {!valid && filled > 0 && (
          <p className="lm-min-warning">At least 1 answer per question to continue</p>
        )}

        <div className="lm-period-nav">
          <button className="lm-back-btn" onClick={() => goToScreen(getPrevPeriodScreen(period.id))}>←</button>
          {isLast ? (
            <button
              className="lm-cta-gold"
              disabled={!valid}
              onClick={async () => {
                hapticSuccess()
                const sid = sessionId || await createSession()
                runClustering(sid)
              }}
            >
              Reveal My Life Map ✨
            </button>
          ) : (
            <button
              className="lm-cta-gold"
              disabled={!valid}
              onClick={() => {
                hapticLight()
                goToScreen(getNextPeriodScreen(period.id))
              }}
            >
              Continue to {PERIODS[periodIdx + 1]?.name} →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── RENDER SCREENS ───────────────────────────────────

  // Return screen (living document)
  if (currentScreen === 'return') {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-resume" style={{ gap: 20 }}>
            <div style={{ fontSize: 48 }}>🗺️</div>
            <h2 className="lm-gold-text" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Your Life Map</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
              {savedSession?.response_data?.connecting_dots_narrative ? 'Your life story, mapped.' : 'Completed previously'}
            </p>
            <div className="lm-return-options">
              <div className="lm-return-option" onClick={handleReturnView}>
                <div className="lm-return-icon view">🗺️</div>
                <div className="lm-return-text">
                  <h4>View My Life Map</h4>
                  <p>See your sticky note timeline and cluster reveals</p>
                </div>
              </div>
              <div className="lm-return-option" onClick={handleReturnAdd}>
                <div className="lm-return-icon add">+</div>
                <div className="lm-return-text">
                  <h4>Add to My Map</h4>
                  <p>New memories surfaced? Add them and re-analyze</p>
                </div>
              </div>
              <div className="lm-return-option" onClick={handleReturnFresh}>
                <div className="lm-return-icon fresh">🔄</div>
                <div className="lm-return-text">
                  <h4>Start Fresh</h4>
                  <p>Clear everything and redo from scratch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Time check / resume
  if (currentScreen === 'time_check') {
    if (showResumePrompt) {
      return (
        <div className="life-map-app">
          <div className="lm-container">
            <div className="lm-resume">
              <div style={{ fontSize: 48 }}>🗺️</div>
              <h2 className="lm-gold-text" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Welcome Back</h2>
              <div className="lm-resume-card">
                <h3>Continue your Life Map?</h3>
                <p>You have saved progress. Pick up where you left off?</p>
                <div className="lm-resume-buttons">
                  <button className="lm-secondary-btn" style={{ flex: 1, padding: 12 }} onClick={handleFreshStart}>Start Fresh</button>
                  <button className="lm-cta-gold" style={{ flex: 1, padding: 12, maxWidth: 'none' }} onClick={handleResume}>Continue</button>
                </div>
              </div>
              <p className="lm-time-note">Your previous answers are saved</p>
            </div>
          </div>
        </div>
      )
    }

    // Default: go to welcome
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-welcome">
            <div className="lm-welcome-icon">🗺️</div>
            <h1 className="lm-welcome-title lm-gold-text">Your Life Story<br/>Holds the Answers</h1>
            <p className="lm-welcome-subtitle">
              We're going to walk through 5 periods of your life. Just reflect honestly. No right or wrong answers.
            </p>
            <div className="lm-insight-card">
              <h4>How this works</h4>
              <p>
                For each period of your life, you'll answer 3 simple questions about what you loved, what was hard, and who inspired you. At the end, we'll show you what your life has been pointing toward all along.
              </p>
            </div>
            <p className="lm-time-note">Takes about 15 minutes</p>
            <button className="lm-cta-gold" onClick={handleStart}>Let's Go</button>
          </div>
        </div>
      </div>
    )
  }

  // Welcome (shown if navigated back)
  if (currentScreen === 'welcome') {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-welcome">
            <div className="lm-welcome-icon">🗺️</div>
            <h1 className="lm-welcome-title lm-gold-text">Your Life Story<br/>Holds the Answers</h1>
            <p className="lm-welcome-subtitle">
              We're going to walk through 5 periods of your life. Just reflect honestly. No right or wrong answers.
            </p>
            <div className="lm-insight-card">
              <h4>How this works</h4>
              <p>
                For each period of your life, you'll answer 3 simple questions about what you loved, what was hard, and who inspired you. At the end, we'll show you what your life has been pointing toward all along.
              </p>
            </div>
            <p className="lm-time-note">Takes about 15 minutes</p>
            <button className="lm-cta-gold" onClick={() => goToScreen('period_childhood')}>Let's Go</button>
          </div>
        </div>
      </div>
    )
  }

  // Period screens
  const periodMatch = currentScreen.match(/^period_(.+)$/)
  if (periodMatch) {
    const period = PERIODS.find(p => p.id === periodMatch[1])
    if (period) {
      return (
        <div className="life-map-app">
          {renderPeriodScreen(period)}
        </div>
      )
    }
  }

  // Processing
  if (currentScreen === 'processing') {
    const steps = [
      'Discovering your natural skills',
      'Mapping problems you care about',
      'Revealing who you\'re meant to serve',
      'Connecting the dots',
      'Building your Essence Chamber',
    ]

    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-processing">
            <div className="lm-spinner" />
            <h2 className="lm-processing-title lm-gold-text">Reading your life story...</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>This takes about 40 seconds</p>
            <div className="lm-processing-steps">
              {steps.map((label, i) => (
                <div key={i} className={`lm-step ${i < processingStep ? 'done' : i === processingStep ? 'active' : 'pending'}`}>
                  <div className="lm-step-icon">{i < processingStep ? '✓' : ''}</div>
                  <div className="lm-step-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Connecting the Dots
  if (currentScreen === 'connecting_dots') {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-dots-screen">
            <div style={{ fontSize: 48 }}>✨</div>
            <h2 className="lm-gold-text" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
              Here's what your life<br/>has been telling you
            </h2>
            <div className="lm-dots-narrative">
              {connectingDotsNarrative ? (
                connectingDotsNarrative.split('\n\n').filter(Boolean).map((para, i) => {
                  // Sanitize: strip all HTML tags except <strong> and </strong>
                  const sanitized = para
                    .replace(/<\/?(?!strong\b)[a-z][^>]*>/gi, '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*\*/g, '')
                  return <p key={i} dangerouslySetInnerHTML={{ __html: sanitized }} />
                })
              ) : (
                <p>Your life story reveals powerful patterns across every period.</p>
              )}
            </div>
            <button className="lm-cta-gold" onClick={() => goToScreen('life_map')}>See Your Life Map →</button>
          </div>
        </div>
      </div>
    )
  }

  // Life Map (compact all-at-once sticky notes)
  if (currentScreen === 'life_map') {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-timeline-screen">
            <h2 className="lm-timeline-title lm-gold-text">Your Life Map</h2>
            <p className="lm-timeline-subtitle">Your whole life, one view</p>

            <div className="lm-legend">
              <div className="lm-legend-item"><div className="lm-legend-swatch skills-sw" /> What you loved</div>
              <div className="lm-legend-item"><div className="lm-legend-swatch problems-sw" /> What was hard</div>
              <div className="lm-legend-item"><div className="lm-legend-swatch personas-sw" /> Who inspired you</div>
            </div>

            <div className="lm-timeline-grid">
              {PERIODS.map(period => (
                <div key={period.id} className="lm-timeline-col">
                  <div className="lm-col-header">
                    <h4>{period.name}</h4>
                    <span>{period.age}</span>
                  </div>
                  {CATEGORIES.map(cat => (
                    responses[`${period.id}_${cat}`]
                      .filter(v => v.trim())
                      .map((val, i) => (
                        <div
                          key={`${cat}-${i}`}
                          className={`lm-sticky ${cat}`}
                          style={{ transform: `rotate(${stickyRotations[`${period.id}_${cat}_${i}`] || 0}deg)` }}
                        >
                          {val.length > 20 ? val.substring(0, 18) + '...' : val}
                        </div>
                      ))
                  ))}
                </div>
              ))}
            </div>

            <button className="lm-cta-gold" style={{ marginTop: 12 }} onClick={() => { generateMural(); goToScreen('nikigai') }}>
              See What This Means →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Nikigai: All 3 cluster categories on one screen ──
  if (currentScreen === 'nikigai') {
    const renderClusterCards = (clusters, colorClass) => (
      <div className="lm-cluster-cards">
        {clusters.map((cluster, i) => (
          <div key={i} className="lm-cluster-card">
            <div className={`lm-cluster-name ${colorClass}`}>{cluster.label}</div>
            <div className="lm-cluster-insight">{cluster.insight}</div>
            <div className="lm-cluster-items">
              {(cluster.items || []).map((item, j) => (
                <span key={j} className="lm-cluster-pill">{typeof item === 'string' ? item : item.text}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-reveal">
            <span className="lm-reveal-badge skills">Your Nikigai</span>
            <h2 className="lm-reveal-title lm-gold-text">Skills, Problems, Personas</h2>
            <p className="lm-reveal-subtitle">The patterns your life map revealed</p>

            <div className="lm-nikigai-section">
              <div className="lm-nikigai-header skills-color">Skills <span className="lm-nikigai-count">{skillsClusters.length} clusters</span></div>
              {renderClusterCards(skillsClusters, 'skills-name')}
            </div>

            <div className="lm-nikigai-divider" />

            <div className="lm-nikigai-section">
              <div className="lm-nikigai-header problems-color">Problems <span className="lm-nikigai-count">{problemsClusters.length} clusters</span></div>
              {renderClusterCards(problemsClusters, 'problems-name')}
            </div>

            <div className="lm-nikigai-divider" />

            <div className="lm-nikigai-section">
              <div className="lm-nikigai-header personas-color">Personas <span className="lm-nikigai-count">{personasClusters.length} clusters</span></div>
              {renderClusterCards(personasClusters, 'personas-name')}
            </div>

            {essenceArchetype && (
              <div className="lm-essence-card" style={{ marginTop: 20 }}>
                {essenceImage ? (
                  <img src={essenceImage} alt={essenceArchetype} className="lm-essence-avatar" />
                ) : (
                  <div className="lm-essence-avatar-placeholder">🦸</div>
                )}
                <div>
                  <div className="lm-essence-label">Your Essence Archetype</div>
                  <div className="lm-essence-name">{essenceArchetype}</div>
                </div>
              </div>
            )}

            <button className="lm-cta-purple" onClick={() => goToScreen(essenceChamber ? 'chamber_intro' : 'complete')}>
              {essenceChamber ? 'Go deeper' : 'See your results'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Chamber Intro ──
  if (currentScreen === 'chamber_intro') {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-chamber-intro">
            <div className="lm-chamber-intro-kicker">Beyond the patterns</div>
            <h1 className="lm-chamber-intro-title lm-gold-text">Your Essence Chamber</h1>
            <p className="lm-chamber-intro-body">
              Your skills, problems, and personas are the building blocks. But underneath them is something deeper.
            </p>
            <p className="lm-chamber-intro-body">
              Your <strong>Essence Chamber</strong> holds the expression needs that have been with you since childhood. Some are <strong>glowing</strong>. Some are <strong>flickering</strong>.
            </p>
            <button className="lm-cta-gold" onClick={() => goToScreen('chamber_reveal')}>Enter the Chamber</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Chamber Reveal: Pillars with orb timelines ──
  if (currentScreen === 'chamber_reveal' && !essenceChamber) {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-chamber-intro">
            <p className="lm-chamber-intro-body">We couldn't build your Essence Chamber this time.</p>
            <button className="lm-cta-gold" onClick={() => goToScreen('complete')}>Continue to results</button>
          </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 'chamber_reveal' && essenceChamber) {
    const PERIOD_LABELS = { childhood: 'Childhood', teens: 'Teens', young_adult: 'Young Adult', career: 'Career', now: 'Now' }

    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-reveal">
            <span className="lm-reveal-badge skills">Essence Chamber</span>
            <h2 className="lm-reveal-title lm-gold-text">Your Pillars</h2>

            <div className="lm-chamber-pillars">
              {essenceChamber.pillars.map((pillar, pi) => (
                <div
                  key={pi}
                  className={`lm-pillar-card lm-pillar-${pillar.status.toLowerCase()}`}
                  onClick={() => setExpandedPillar(expandedPillar === pi ? null : pi)}
                >
                  <div className={`lm-pillar-badge lm-pillar-badge-${pillar.status.toLowerCase()}`}>
                    <span className="lm-pillar-dot" />
                    {pillar.status === 'ACTIVE' ? 'Active' : pillar.status === 'FLICKERING' ? 'Flickering' : 'Empty'}
                  </div>
                  <div className="lm-pillar-name">{pillar.name}</div>
                  <div className="lm-pillar-confidence">{pillar.confidence_note}</div>

                  <div className="lm-orb-timeline">
                    {Object.entries(PERIOD_LABELS).map(([periodId, periodName]) => {
                      const orbs = pillar.orbs[periodId] || []
                      return (
                        <div key={periodId} className="lm-orb-period">
                          <div className={`lm-orb-dot lm-orb-${periodId} ${orbs.length === 0 ? 'lm-orb-empty' : ''}`} />
                          <div className="lm-orb-content">
                            <div className="lm-orb-period-label">{periodName}</div>
                            {orbs.length > 0 ? (
                              <div className="lm-orb-items">
                                {orbs.map((orb, oi) => (
                                  <span key={oi} className={`lm-orb-item lm-orb-item-${periodId}`}>{orb}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="lm-orb-empty-text">Nothing here</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="lm-pillar-expand-hint">
                    Wounds & Personas <span className={`lm-pillar-arrow ${expandedPillar === pi ? 'open' : ''}`}>&#9660;</span>
                  </div>

                  {expandedPillar === pi && (
                    <div className="lm-pillar-detail">
                      {pillar.wounds.length > 0 && (
                        <div className="lm-pillar-detail-section">
                          <div className="lm-pillar-detail-label">Wounds on this pillar</div>
                          {pillar.wounds.map((w, wi) => (
                            <div key={wi} className="lm-wound-tag">{w.text}</div>
                          ))}
                        </div>
                      )}
                      {pillar.personas.length > 0 && (
                        <div className="lm-pillar-detail-section">
                          <div className="lm-pillar-detail-label">Personas who embody this</div>
                          <div className="lm-pillar-personas">
                            {pillar.personas.map((p, pi2) => (
                              <span key={pi2} className="lm-persona-tag">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {essenceChamber.current_directions?.length > 0 && (
              <div className="lm-direction-card">
                <div className="lm-direction-label">Current Direction (not a pillar)</div>
                <div className="lm-direction-name">{essenceChamber.current_directions[0].name}</div>
                <div className="lm-direction-desc">{essenceChamber.current_directions[0].description}</div>
              </div>
            )}

            <button className="lm-cta-gold" onClick={() => goToScreen('gap_insight')}>See what's missing</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Gap Insight ──
  if (currentScreen === 'gap_insight' && !essenceChamber?.gap) {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-chamber-intro">
            <button className="lm-cta-gold" onClick={() => goToScreen('complete')}>Continue to results</button>
          </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 'gap_insight' && essenceChamber?.gap) {
    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-gap-screen">
            <div className="lm-gap-icon"><div className="lm-gap-icon-inner" /></div>
            <div className="lm-gap-kicker">The {essenceChamber.gap.status === 'FLICKERING' ? 'flickering' : 'empty'} pillar</div>
            <h2 className="lm-gap-pillar-name lm-gold-text">{essenceChamber.gap.pillar_name}</h2>
            <p className="lm-gap-insight-text">{essenceChamber.gap.insight}</p>
            <div className="lm-gap-question">What orb could sit on this pillar next?</div>
            <button className="lm-cta-purple" onClick={() => goToScreen('complete')}>Continue</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Complete ──
  if (currentScreen === 'complete') {
    const handleDownloadMural = async () => {
      if (!muralUrl) return
      try {
        if (navigator.share && navigator.canShare) {
          const res = await fetch(muralUrl)
          const blob = await res.blob()
          const file = new File([blob], 'my-life-map-mural.png', { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'My Life Map Mural' })
            return
          }
        }
        window.open(muralUrl, '_blank')
      } catch (err) {
        window.open(muralUrl, '_blank')
      }
    }

    const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.origin + '/life-map')
      hapticSuccess()
    }

    const toggleSection = (section) => setExpandedDropdown(expandedDropdown === section ? null : section)

    const renderDropdownClusters = (clusters, colorClass) => (
      <div className="lm-dropdown-inner">
        {clusters.map((cluster, i) => (
          <div key={i} className="lm-dropdown-cluster">
            <div className={`lm-cluster-name ${colorClass}`}>{cluster.label}</div>
            <div className="lm-cluster-insight">{cluster.insight}</div>
            <div className="lm-cluster-items">
              {(cluster.items || []).map((item, j) => (
                <span key={j} className="lm-cluster-pill">{typeof item === 'string' ? item : item.text}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <div className="life-map-app">
        <div className="lm-container">
          <div className="lm-complete">
            <div className="lm-checkmark">✓</div>
            <h1 className="lm-complete-title lm-gold-text">Your Life Map is complete</h1>
            <div className="lm-xp-card">
              <p className="lm-xp-amount">+15 RP</p>
              <p className="lm-xp-label">Life Map Complete</p>
            </div>

            {/* Mural Section */}
            <div className="lm-mural-section">
              {muralUrl ? (
                <img src={muralUrl} alt="Life Map Mural" className="lm-mural-image" />
              ) : muralLoading ? (
                <div className="lm-mural-loading">
                  <div className="lm-spinner" style={{ width: 40, height: 40 }} />
                  <p>Painting your life story...</p>
                </div>
              ) : (
                <button className="lm-cta-purple" onClick={generateMural} style={{ maxWidth: 300 }}>
                  Generate My Mural
                </button>
              )}
            </div>

            {/* Mini Chamber Summary */}
            {essenceChamber && (
              <div className="lm-mini-chamber">
                <div className="lm-mini-chamber-label">Your Essence Chamber</div>
                {essenceChamber.pillars.map((pillar, i) => (
                  <div
                    key={i}
                    className={`lm-mini-pillar lm-mini-pillar-${pillar.status.toLowerCase()}`}
                    onClick={() => goToScreen('chamber_reveal')}
                  >
                    <span className="lm-mini-pillar-dot" />
                    <div className="lm-mini-pillar-text">
                      <div className="lm-mini-pillar-name">{pillar.name}</div>
                      <div className="lm-mini-pillar-status">
                        {pillar.status === 'ACTIVE' ? 'Active' : pillar.status === 'FLICKERING' ? 'Flickering' : 'Empty'}
                      </div>
                    </div>
                    <span className="lm-mini-pillar-arrow">&#8250;</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gap Seed Nudge */}
            {essenceChamber?.gap && (
              <div className="lm-gap-seed" onClick={() => navigate('/7-day-challenge')}>
                <div className="lm-gap-seed-icon"><div className="lm-gap-seed-icon-inner" /></div>
                <div className="lm-gap-seed-text">
                  <div className="lm-gap-seed-title">Your {essenceChamber.gap.status === 'FLICKERING' ? 'flickering' : 'empty'} pillar</div>
                  <div className="lm-gap-seed-desc">
                    {essenceChamber.gap.pillar_name}. When you're ready, your Wahoo tab has suggestions designed for this pillar.
                  </div>
                </div>
                <span className="lm-gap-seed-arrow">&#8250;</span>
              </div>
            )}

            {/* Detail Dropdowns */}
            <div className="lm-detail-dropdowns">
              <div className="lm-detail-divider"><span>Your Life Map details</span></div>

              <div className={`lm-dropdown-section ${expandedDropdown === 'skills' ? 'open' : ''}`}>
                <div className="lm-dropdown-trigger" onClick={() => toggleSection('skills')}>
                  <span>Skills <span className="lm-dropdown-count">{skillsClusters.length} clusters</span></span>
                  <span className="lm-dropdown-arrow">&#9660;</span>
                </div>
                {expandedDropdown === 'skills' && renderDropdownClusters(skillsClusters, 'skills-name')}
              </div>

              <div className={`lm-dropdown-section ${expandedDropdown === 'problems' ? 'open' : ''}`}>
                <div className="lm-dropdown-trigger" onClick={() => toggleSection('problems')}>
                  <span>Problems <span className="lm-dropdown-count">{problemsClusters.length} clusters</span></span>
                  <span className="lm-dropdown-arrow">&#9660;</span>
                </div>
                {expandedDropdown === 'problems' && renderDropdownClusters(problemsClusters, 'problems-name')}
              </div>

              <div className={`lm-dropdown-section ${expandedDropdown === 'personas' ? 'open' : ''}`}>
                <div className="lm-dropdown-trigger" onClick={() => toggleSection('personas')}>
                  <span>Personas <span className="lm-dropdown-count">{personasClusters.length} clusters</span></span>
                  <span className="lm-dropdown-arrow">&#9660;</span>
                </div>
                {expandedDropdown === 'personas' && renderDropdownClusters(personasClusters, 'personas-name')}
              </div>

              <div className={`lm-dropdown-section ${expandedDropdown === 'narrative' ? 'open' : ''}`}>
                <div className="lm-dropdown-trigger" onClick={() => toggleSection('narrative')}>
                  <span>Connecting Dots</span>
                  <span className="lm-dropdown-arrow">&#9660;</span>
                </div>
                {expandedDropdown === 'narrative' && (
                  <div className="lm-dropdown-inner">
                    <div className="lm-narrative-text" dangerouslySetInnerHTML={{ __html: connectingDotsNarrative }} />
                  </div>
                )}
              </div>
            </div>

            {/* Share Buttons */}
            <div className="lm-share-buttons">
              {muralUrl && (
                <button className="lm-share-btn download" onClick={handleDownloadMural}>Save Mural</button>
              )}
              <button className="lm-share-btn copy" onClick={handleCopyLink}>Copy Link</button>
            </div>

            <button className="lm-cta-gold" onClick={() => navigate('/7-day-challenge')} style={{ marginTop: 8 }}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="life-map-app">
      <div className="lm-container">
        <p>Loading...</p>
      </div>
    </div>
  )
}
