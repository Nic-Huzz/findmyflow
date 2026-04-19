/**
 * PlaySkillsOnboarding.jsx
 *
 * /get-started flow for discovering play-skills.
 *
 * Beats:
 *   1. Hook slides (childhood → remember → where did they go)
 *   2. AI-usage gate ("Do you use ChatGPT or Claude?")
 *   3a. Path A (AI):
 *       Copy prompt → Paste → Parse → map-to-playskills (images) →
 *       nikigai-conversation (clusters) → Cluster overview →
 *       Swipe ALL cards sequentially → Sub-select per category →
 *       Satisfaction → Reveal → Signup/Save
 *   3b. Path B (Manual): Wheel category picker → Swipe placemakes → Reveal → Signup/Save
 *   4. Reveal (kept skills grouped by category)
 *   5. Signup (name + email → OTP) or direct save if authenticated
 *   6. Verify (6-digit code)
 *
 * Pre-auth state stored in localStorage. Hydrated to DB after signup.
 *
 * Created: 2026-04-11 | Rebuilt: 2026-04-19
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { SKILLS_SEGMENTS, findSkillSegment } from '../../lib/wheelTaxonomy'
import SwipeCardDeck from '../SwipeCardDeck/SwipeCardDeck'
import './JourneyOnboarding.css'
import './PlaySkillsOnboarding.css'
import '../../flows/IdentifyTopicsFlow.css'

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'playskills_onboarding_progress'
const RESULT_KEY = 'playskills_onboarding_result'

// Build placemake → image path lookup
const PLACEMAKE_IMAGES = {}
SKILLS_SEGMENTS.forEach(seg => {
  ;(seg.placemakes || []).forEach((pm, i) => {
    PLACEMAKE_IMAGES[pm] = `/images/placemakes/placemake-${seg.id}-${i + 1}.png`
  })
})

const CATEGORY_FAMOUS = {
  storytelling: 'Brené Brown, J.K. Rowling, Ira Glass',
  teaching: 'Richard Feynman, Sal Khan, Maria Montessori',
  coaching: 'Phil Jackson, Brené Brown, Tony Robbins',
  performing: 'Steve Jobs, Oprah Winfrey, Dave Chappelle',
  creating: 'Frida Kahlo, Nikola Tesla, James Dyson',
  building: 'Elon Musk, James Dyson, Sara Blakely',
  designing: 'Jony Ive, Coco Chanel, Dieter Rams',
  leading: 'Jeff Bezos, Jacinda Ardern, Nelson Mandela',
  connecting: 'Oprah Winfrey, Keith Ferrazzi, Priya Parker',
  speaking_up: 'Malala Yousafzai, Greta Thunberg, Martin Luther King Jr.',
}

const MAX_CATEGORIES = 3

const BEATS = {
  HOOK: 'hook',
  AI_GATE: 'ai_gate',
  // Path A
  COPY_PROMPT: 'copy_prompt',
  PASTE: 'paste',
  MAPPING: 'mapping',       // loading: parse + map-to-playskills + nikigai
  CLUSTERS: 'clusters',     // cluster overview (read-only)
  SWIPE: 'swipe',           // swipe ALL cards sequentially
  SUB_SELECT: 'sub_select', // per-category checkboxes
  SATISFACTION: 'satisfaction',
  // Path B
  WHEEL_CATEGORIES: 'wheel_categories',
  // Shared
  REVEAL: 'reveal',
  SIGNUP: 'signup',
  VERIFY: 'verify',
}

const HOOK_SLIDES = [
  { id: 'childhood', text: 'Take a moment to think about you as a kid.', subtext: 'How playful you were. How full of love. How care-free.' },
  { id: 'remember', text: 'Remember that?', subtext: null },
  { id: 'question', text: 'So where did they go?', subtext: null },
]

// ─── Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt() {
  const categoryList = SKILLS_SEGMENTS.map((seg, i) =>
    `${i + 1}. ${seg.displayName}`
  ).join('\n')

  return `Analyze our entire conversation history and identify the specific skills I naturally use and gravitate toward.

For each skill you identify, write it in MY voice based on what I've actually said and shown. Then map it to one of these 10 categories:

${categoryList}

Extract in this EXACT format:

---START EXTRACTION---

- SKILL: [The specific skill in my own words, under 15 words]
  CATEGORY: [Exact category name from the 10 above]
  EVIDENCE: [Specific quote or pattern from our conversations]

(List 1-3 skills per category. Only add a second or third if the evidence genuinely supports a distinct angle. Only include categories where you have real evidence.)

---END EXTRACTION---`
}

// ─── Parser ─────────────────────────────────────────────────────────────────

function parseSkillExtraction(rawText) {
  const results = []
  const text = rawText.replace(/\*{1,2}/g, '')
  const blocks = text.split(/(?=[-•*]?\s*SKILL\s*:)/i).filter(b => /SKILL\s*:/i.test(b))

  for (const block of blocks) {
    const rawSkill = block.match(/SKILL\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawCategory = block.match(/CATEGORY\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawEvidence = block.match(/EVIDENCE\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''

    if (!rawSkill) continue

    results.push({
      name: rawSkill,
      evidence: rawEvidence,
      category: rawCategory || 'Other',
    })
  }

  // Fallback: line-by-line if structured parse fails
  if (results.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
    lines.forEach(line => {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim()
      if (cleaned.length > 2 && cleaned.length < 100) {
        results.push({ name: cleaned, evidence: '', category: 'Other' })
      }
    })
  }

  return results
}

// ─── Cluster categories via nikigai-conversation ────────────────────────────

async function clusterSkillCategories(mappedItems) {
  // Group by category, build context from personal skill names
  const catMap = {}
  mappedItems.forEach(item => {
    if (!catMap[item.categoryId]) catMap[item.categoryId] = []
    catMap[item.categoryId].push(item.originalName)
  })

  const lines = Object.entries(catMap).map(([catId, skills], i) => {
    const seg = findSkillSegment(catId)
    return `${i + 1}. ${seg?.displayName || catId} (context: ${skills.join('; ')})`
  }).join('\n')

  const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
    body: {
      currentStep: {
        id: 'skills_final',
        assistant_prompt: 'Group these skill category labels into 2-4 thematic clusters. Use ONLY the exact category names as items in your clusters array. The context after each label is for your understanding only.',
      },
      userResponse: 'Group my skill categories',
      shouldCluster: true,
      clusterType: 'skills',
      clusterSources: ['skills_all'],
      allResponses: [{
        user_id: 'clustering',
        response_raw: lines,
        store_as: 'skills_all',
      }],
      conversationHistory: [],
    },
  })

  if (error) throw error

  const clusters = (data?.clusters || []).map(cluster => {
    const categoryIds = cluster.items
      .map(item => {
        const cleanItem = item.split('—')[0].split('(context')[0].replace(/^\d+\.\s*/, '').trim().toLowerCase().replace(/[.*"]/g, '')
        const seg = SKILLS_SEGMENTS.find(s => {
          const dn = s.displayName.toLowerCase()
          return dn === cleanItem || cleanItem.includes(dn.slice(0, 15)) || dn.includes(cleanItem.slice(0, 15))
        })
        return seg?.id || null
      })
      .filter(Boolean)
    return { label: cluster.label, insight: cluster.insight, categoryIds }
  }).filter(c => c.categoryIds.length > 0)

  return clusters
}

// ─── Swipe Card Content ─────────────────────────────────────────────────────

function SwipeCardContent({ card }) {
  const [evidenceExpanded, setEvidenceExpanded] = useState(false)
  const seg = findSkillSegment(card.categoryId)
  const imgSrc = PLACEMAKE_IMAGES[card.placemake]
  const famous = CATEGORY_FAMOUS[card.categoryId]
  // Show personal skill name as headline, not the generic placemake
  const headline = card.originalName || card.placemake
  const isLong = card.evidence && card.evidence.length > 120

  return (
    <>
      <div className="pso-card-badge">
        {seg?.icon} {seg?.displayName || card.categoryId}
      </div>
      {imgSrc && (
        <img
          className="pso-card-image"
          src={imgSrc}
          alt={card.placemake}
          draggable={false}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="pso-card-placemake">{headline}</div>
      {famous && (
        <div className="pso-card-famous">
          Think {famous}
        </div>
      )}
      {card.evidence && (
        <div className={`pso-card-evidence ${!evidenceExpanded && isLong ? 'truncated' : ''}`}>
          Analysis shows: &ldquo;{card.evidence}&rdquo;
        </div>
      )}
      {isLong && !evidenceExpanded && (
        <button
          className="pso-card-show-more"
          onClick={(e) => { e.stopPropagation(); setEvidenceExpanded(true) }}
        >
          Show more
        </button>
      )}
    </>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PlaySkillsOnboarding() {
  const { user, signInWithCode, verifyCode } = useAuth()
  const navigate = useNavigate()
  const isAuthenticated = !!user

  // Beat state
  const [currentBeat, setCurrentBeat] = useState(BEATS.HOOK)
  const [path, setPath] = useState(null)

  // Hook
  const [hookSlideIndex, setHookSlideIndex] = useState(0)

  // Path A: external AI
  const [copied, setCopied] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [mappedCards, setMappedCards] = useState([])
  const [keptPlacemakes, setKeptPlacemakes] = useState([])
  const [clusters, setClusters] = useState([])

  // Path A: sub-select state
  const [subSelectCatIds, setSubSelectCatIds] = useState([])
  const [subSelectIndex, setSubSelectIndex] = useState(0)
  const [selectedItems, setSelectedItems] = useState({})
  const [customText, setCustomText] = useState('')
  // categoryExtractions: { [categoryId]: [{ skill, evidence, placemake }] }
  const [categoryExtractions, setCategoryExtractions] = useState({})

  // Path B: wheel picker
  const [selectedCategories, setSelectedCategories] = useState([])

  // Auth
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Shared
  const [error, setError] = useState(null)

  // Transitions
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [slideDirection, setSlideDirection] = useState('right')

  const touchStartX = useRef(0)
  const textareaRef = useRef(null)

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => document.body.classList.remove('onboarding-active')
  }, [])

  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentBeat, hookSlideIndex])

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const p = JSON.parse(saved)
        if (Date.now() - p.timestamp < 24 * 60 * 60 * 1000) {
          let beat = p.currentBeat
          // Don't restore transient loading states
          if (beat === BEATS.MAPPING) beat = BEATS.PASTE
          if (beat === BEATS.SWIPE && (!p.mappedCards || p.mappedCards.length === 0)) {
            beat = p.path === 'b' ? BEATS.WHEEL_CATEGORIES : BEATS.PASTE
          }
          if (beat) setCurrentBeat(beat)
          if (p.path) setPath(p.path)
          if (p.hookSlideIndex !== undefined) setHookSlideIndex(p.hookSlideIndex)
          if (p.selectedCategories) setSelectedCategories(p.selectedCategories)
          if (p.keptPlacemakes) setKeptPlacemakes(p.keptPlacemakes)
          if (p.mappedCards) setMappedCards(p.mappedCards)
          if (p.rawResponse) setRawResponse(p.rawResponse)
          if (p.userName) setUserName(p.userName)
          if (p.email) setEmail(p.email)
          if (p.clusters) setClusters(p.clusters)
          if (p.categoryExtractions) setCategoryExtractions(p.categoryExtractions)
          if (p.selectedItems) setSelectedItems(p.selectedItems)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {}
  }, [])

  // Save progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentBeat, path, hookSlideIndex,
      selectedCategories, keptPlacemakes, mappedCards,
      rawResponse, userName, email,
      clusters, categoryExtractions, selectedItems,
      timestamp: Date.now(),
    }))
  }, [currentBeat, path, hookSlideIndex, selectedCategories, keptPlacemakes, mappedCards, rawResponse, userName, email, clusters, categoryExtractions, selectedItems])

  // ─── Navigation ──────────────────────────────────────────────────────────

  const transitionTo = useCallback((beat, direction = 'right') => {
    if (isTransitioning) return
    setSlideDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentBeat(beat)
      setIsTransitioning(false)
      setIsEntering(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 250)
  }, [isTransitioning])

  const transitionClass = `${isTransitioning ? 'jo-transitioning' : ''} ${isEntering ? 'jo-entering' : ''}`
  const directionClass = slideDirection === 'left' ? 'jo-slide-left' : 'jo-slide-right'

  // ─── Hook handlers ────────────────────────────────────────────────────────

  const handleHookTap = () => {
    if (hookSlideIndex < HOOK_SLIDES.length - 1) {
      setSlideDirection('right')
      setIsTransitioning(true)
      setTimeout(() => {
        setHookSlideIndex(hookSlideIndex + 1)
        setIsTransitioning(false)
        setIsEntering(true)
      }, 250)
    } else {
      transitionTo(BEATS.AI_GATE)
    }
  }

  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX }
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX
    if (currentBeat === BEATS.HOOK) {
      if (diff > 50) handleHookTap()
    }
  }

  // ─── Path A handlers ──────────────────────────────────────────────────────

  const prompt = buildPrompt()

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleParse = async () => {
    if (!rawResponse.trim()) return
    setIsLoading(true)
    setError(null)

    const parsed = parseSkillExtraction(rawResponse)
    if (parsed.length === 0) {
      setError("Couldn't find any skills. Make sure you copied the full extraction output.")
      setIsLoading(false)
      return
    }

    setCurrentBeat(BEATS.MAPPING)

    try {
      // Step 1: map-to-playskills → get placemake matches + images
      const { data: mapData, error: mapError } = await supabase.functions.invoke('map-to-playskills', {
        body: { items: parsed },
      })
      if (mapError) throw mapError

      const mapped = (mapData?.mappedItems || []).map((item, i) => ({
        id: `${item.categoryId}_${i}_${item.placemake.slice(0, 20)}`,
        placemake: item.placemake,
        categoryId: item.categoryId,
        evidence: item.evidence,
        originalName: item.originalName,
      }))

      if (mapped.length === 0) {
        setError('Could not map your skills. Please try again.')
        transitionTo(BEATS.PASTE, 'left')
        setIsLoading(false)
        return
      }

      setMappedCards(mapped)

      // Build category extractions for sub-select
      const extMap = {}
      mapped.forEach(item => {
        if (!extMap[item.categoryId]) extMap[item.categoryId] = []
        extMap[item.categoryId].push({
          skill: item.originalName,
          evidence: item.evidence,
          placemake: item.placemake,
        })
      })
      setCategoryExtractions(extMap)

      // Step 2: nikigai cluster the categories
      const clusterResult = await clusterSkillCategories(mapped)

      if (clusterResult.length > 0) {
        setClusters(clusterResult)
        transitionTo(BEATS.CLUSTERS)
      } else {
        // Fallback: skip clusters, go straight to swipe
        transitionTo(BEATS.SWIPE)
      }
    } catch (err) {
      console.error('Processing error:', err)
      setError('Something went wrong. Please try again.')
      transitionTo(BEATS.PASTE, 'left')
    }
    setIsLoading(false)
  }

  // After swipe: enter sub-select for all kept categories
  const handleSwipeComplete = (keptIds) => {
    const newlyKept = mappedCards.filter(c => keptIds.includes(c.id))

    if (path === 'b' || keptPlacemakes.length > 0) {
      // Path B or wheel top-up: merge and go to reveal
      const existingTexts = new Set(keptPlacemakes.map(k => k.placemake))
      const unique = newlyKept.filter(k => !existingTexts.has(k.placemake))
      setKeptPlacemakes([...keptPlacemakes, ...unique])
      transitionTo(BEATS.REVEAL)
      return
    }

    // Path A: enter sub-select
    setKeptPlacemakes(newlyKept)

    // Get unique category IDs from kept cards
    const catIds = [...new Set(newlyKept.map(c => c.categoryId))]
    if (catIds.length === 0) {
      transitionTo(BEATS.SATISFACTION)
      return
    }
    setSubSelectCatIds(catIds)
    setSubSelectIndex(0)

    // Pre-select AI items
    const preSelected = {}
    catIds.forEach(catId => {
      const aiItems = newlyKept.filter(c => c.categoryId === catId).map(c => c.originalName)
      preSelected[catId] = [...aiItems]
    })
    setSelectedItems(preSelected)
    transitionTo(BEATS.SUB_SELECT)
  }

  // Sub-select handlers
  const toggleItem = (categoryId, item) => {
    setSelectedItems(prev => {
      const current = prev[categoryId] || []
      if (current.includes(item)) return { ...prev, [categoryId]: current.filter(i => i !== item) }
      return { ...prev, [categoryId]: [...current, item] }
    })
  }

  const handleAddCustom = () => {
    const catId = subSelectCatIds[subSelectIndex]
    if (!customText.trim() || !catId) return
    setSelectedItems(prev => ({
      ...prev,
      [catId]: [...(prev[catId] || []), customText.trim()],
    }))
    setCustomText('')
  }

  const handleSubSelectContinue = () => {
    if (subSelectIndex < subSelectCatIds.length - 1) {
      setSubSelectIndex(subSelectIndex + 1)
      setCustomText('')
    } else {
      transitionTo(BEATS.SATISFACTION)
    }
  }

  // ─── Path B handlers ──────────────────────────────────────────────────────

  const toggleCategory = (id) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_CATEGORIES) return prev
      return [...prev, id]
    })
  }

  const handleWheelContinue = () => {
    const alreadyKept = new Set(keptPlacemakes.map(k => k.placemake))
    const cards = []
    let idx = 0
    for (const catId of selectedCategories) {
      const seg = findSkillSegment(catId)
      for (const pm of (seg?.placemakes || [])) {
        if (alreadyKept.has(pm)) continue
        cards.push({
          id: `wheel_${catId}_${idx++}_${pm.slice(0, 20)}`,
          placemake: pm,
          categoryId: catId,
          evidence: '',
          originalName: '',
        })
      }
    }
    setMappedCards(cards)
    transitionTo(BEATS.SWIPE)
  }

  // ─── Save + Auth ──────────────────────────────────────────────────────────

  const getFinalKeptItems = () => {
    // For Path A with sub-select: build from selectedItems
    if (path === 'a' && Object.keys(selectedItems).length > 0) {
      const items = []
      Object.entries(selectedItems).forEach(([catId, skills]) => {
        skills.forEach(skillName => {
          // Find matching mapped card for placemake/evidence
          const match = mappedCards.find(c => c.categoryId === catId && c.originalName === skillName)
          items.push({
            placemake: match?.placemake || skillName,
            categoryId: catId,
            evidence: match?.evidence || '',
            originalName: skillName,
          })
        })
      })
      return items
    }
    return keptPlacemakes
  }

  const saveToDb = async (userId) => {
    const finalItems = getFinalKeptItems()
    if (finalItems.length === 0) return

    await supabase.from('nikigai_clusters')
      .delete().eq('user_id', userId).eq('step_id', 'get_started')

    const { data: session, error: sessionError } = await supabase.from('flow_sessions').insert({
      user_id: userId,
      flow_type: 'get_started_playskills',
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).select('id').single()
    if (sessionError || !session) throw sessionError || new Error('Failed to create session')

    const rows = finalItems.map(item => ({
      session_id: session.id,
      user_id: userId,
      cluster_type: 'skills',
      cluster_label: item.originalName || item.placemake,
      cluster_stage: 'final',
      step_id: 'get_started',
      items: [{
        text: item.originalName || item.placemake,
        placemake: item.placemake,
        category: item.categoryId,
        evidence: item.evidence || '',
        isStarred: true,
      }],
    }))

    const { error: insertError } = await supabase.from('nikigai_clusters').insert(rows)
    if (insertError) throw insertError

    await supabase.from('user_stage_progress').upsert({
      user_id: userId,
      onboarding_v2_completed: true,
    }, { onConflict: 'user_id' })
  }

  const handleAuthenticatedSave = async () => {
    if (!user?.id) return
    setIsLoading(true)
    setError(null)
    try {
      await saveToDb(user.id)
      localStorage.removeItem(STORAGE_KEY)
      navigate('/me')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }
    setIsLoading(false)
  }

  const handleSignUp = () => {
    const finalItems = getFinalKeptItems()
    localStorage.setItem(RESULT_KEY, JSON.stringify({
      path,
      keptPlacemakes: finalItems,
      userName,
      completedAt: new Date().toISOString(),
    }))
    localStorage.removeItem(STORAGE_KEY)
    transitionTo(BEATS.SIGNUP)
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || isLoading) return
    setIsLoading(true)
    setAuthError(null)
    try {
      const result = await signInWithCode(email.toLowerCase().trim())
      if (result.success) {
        transitionTo(BEATS.VERIFY)
      } else {
        setAuthError(result.message || 'Failed to send verification code')
      }
    } catch {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeVerify = async (e) => {
    e.preventDefault()
    if (!verificationCode || isLoading) return
    setIsLoading(true)
    setAuthError(null)
    try {
      const result = await verifyCode(email.toLowerCase().trim(), verificationCode)
      if (result.success) {
        try {
          const { data: { user: newUser } } = await supabase.auth.getUser()
          if (newUser?.id) {
            await saveToDb(newUser.id)
            if (userName?.trim()) {
              await supabase.auth.updateUser({ data: { display_name: userName.trim() } })
            }
            localStorage.removeItem(RESULT_KEY)
            localStorage.removeItem(STORAGE_KEY)
          }
        } catch (saveErr) {
          console.warn('Direct save after verify failed, hydration will retry:', saveErr)
        }
        navigate('/me')
      } else {
        setAuthError(result.message || 'Invalid code. Please try again.')
      }
    } catch {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // BEAT 1: Hook
  if (currentBeat === BEATS.HOOK) {
    const slide = HOOK_SLIDES[hookSlideIndex]
    const isLast = hookSlideIndex === HOOK_SLIDES.length - 1

    return (
      <div
        className={`journey-onboarding jo-hook ${transitionClass} ${directionClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleHookTap}
        style={{ cursor: 'pointer' }}
      >
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-hook-content">
          <div className="jo-hook-text-container">
            <h1 className="jo-hook-text" key={slide.id}>{slide.text}</h1>
            {slide.subtext && <p className="jo-hook-subtext">{slide.subtext}</p>}
          </div>
        </div>
        <div className="jo-slide-dots">
          {HOOK_SLIDES.map((_, i) => (
            <span key={i} className={`jo-slide-dot ${i === hookSlideIndex ? 'active' : ''}`} />
          ))}
        </div>
        {isLast ? (
          <button className="jo-hook-continue" onClick={(e) => { e.stopPropagation(); handleHookTap() }}>
            <span className="jo-shimmer-layer" />
            Let's find out
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
        ) : (
          <div className="jo-tap-anywhere-hint">Tap anywhere to continue</div>
        )}
      </div>
    )
  }

  // BEAT 2: AI Gate
  if (currentBeat === BEATS.AI_GATE) {
    return (
      <div className={`journey-onboarding pso-gate ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-gate-content">
          <h2 className="pso-gate-title">Do you use ChatGPT or Claude regularly?</h2>
          <p className="pso-gate-subtitle">
            If you have conversation history with an AI, we can mine it for patterns you can't see yourself.
          </p>
          <div className="pso-gate-options">
            <button className="pso-gate-btn pso-gate-primary" onClick={() => { setPath('a'); transitionTo(BEATS.COPY_PROMPT) }}>
              <span className="pso-gate-icon">🧠</span>
              <span className="pso-gate-text">
                <strong>Yes, I use AI frequently</strong>
                <span>Deeper analysis, best results</span>
              </span>
            </button>
            <button className="pso-gate-btn" onClick={() => { setPath('b'); transitionTo(BEATS.WHEEL_CATEGORIES) }}>
              <span className="pso-gate-icon">🎯</span>
              <span className="pso-gate-text">
                <strong>No, or only a little</strong>
                <span>Pick from a curated menu instead</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // BEAT 3a-1: Copy Prompt
  if (currentBeat === BEATS.COPY_PROMPT) {
    return (
      <div className={`journey-onboarding pso-copy ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-copy-content">
          <h2>Copy this prompt</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            Paste it into the AI you've been chatting with. It will analyze your conversation and find what lights you up.
          </p>
          <div className="pso-prompt-preview">{prompt.substring(0, 180)}...</div>
          <button className="jo-cta-button" onClick={handleCopyPrompt} style={{ width: '100%' }}>
            <span className="jo-shimmer-layer" />
            {copied ? '✓ Copied!' : 'Copy Prompt'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="pso-external-link">Open ChatGPT</a>
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="pso-external-link">Open Claude</a>
          </div>
          <button className="jo-cta-button" onClick={() => transitionTo(BEATS.PASTE)} style={{ width: '100%', marginTop: '1.5rem' }}>
            <span className="jo-shimmer-layer" />
            I have my results
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.AI_GATE, 'left')}>← Back</button>
        </div>
      </div>
    )
  }

  // BEAT 3a-2: Paste
  if (currentBeat === BEATS.PASTE) {
    return (
      <div className={`journey-onboarding pso-paste ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-paste-content">
          <h2>Paste your AI extraction</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Paste the skills extraction from your AI conversation below.
          </p>
          <textarea ref={textareaRef} value={rawResponse} onChange={(e) => setRawResponse(e.target.value)}
            placeholder="Paste the extraction here..." className="pso-textarea" />
          {error && <p className="pso-error">{error}</p>}
          <button className="jo-cta-button" onClick={handleParse} disabled={!rawResponse.trim() || isLoading} style={{ width: '100%' }}>
            <span className="jo-shimmer-layer" />
            {isLoading ? 'Processing...' : 'Find my play-skills'}
            {!isLoading && <span className="jo-btn-arrow">&#8594;</span>}
          </button>
          <a href="https://wa.me/61423220241?text=Hey%20Huzz!%20I'm%20having%20trouble%20with%20the%20AI%20extract%20to%20get%20started%20in%20Find%20My%20Flow"
            target="_blank" rel="noopener noreferrer" className="pso-help-link">Need help? Message me</a>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.COPY_PROMPT, 'left')}>← Back</button>
        </div>
      </div>
    )
  }

  // BEAT 3a-3: Loading (mapping + clustering)
  if (currentBeat === BEATS.MAPPING) {
    return (
      <div className={`journey-onboarding pso-mapping ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="pso-mapping-content">
          <div className="pso-mapping-spinner" />
          <h2>Analysing your skills...</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Finding patterns in what lights you up
          </p>
        </div>
      </div>
    )
  }

  // BEAT 3a-4: Cluster Overview (read-only, then continue to swipe all)
  if (currentBeat === BEATS.CLUSTERS) {
    return (
      <div className={`journey-onboarding pso-gate ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="pso-gate-content" style={{ textAlign: 'left' }}>
          <h2 className="pso-gate-title" style={{ textAlign: 'center' }}>Your Skill Spaces</h2>
          <p className="pso-gate-subtitle" style={{ textAlign: 'center' }}>
            We found {clusters.length} themes in how you show up. Review them, then we'll walk through each skill.
          </p>

          {clusters.map((cluster, i) => {
            const skillCount = cluster.categoryIds.reduce((sum, catId) =>
              sum + mappedCards.filter(c => c.categoryId === catId).length, 0)
            return (
              <div key={i} className="idt-cluster-card">
                <div className="idt-cluster-name">{cluster.label}</div>
                <div className="idt-cluster-insight">{cluster.insight}</div>
                <div className="idt-cluster-tags">
                  {cluster.categoryIds.map(catId => {
                    const seg = findSkillSegment(catId)
                    return <span key={catId} className="idt-cluster-tag">{seg?.icon} {seg?.displayName}</span>
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                  {skillCount} skill{skillCount !== 1 ? 's' : ''} identified
                </div>
              </div>
            )
          })}

          <button className="jo-cta-button" onClick={() => transitionTo(BEATS.SWIPE)} style={{ width: '100%', marginTop: '0.5rem' }}>
            <span className="jo-shimmer-layer" />
            Review my skills →
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.PASTE, 'left')}>← Back to paste</button>
        </div>
      </div>
    )
  }

  // BEAT 3a-5 / 3b: Swipe Deck (all cards)
  if (currentBeat === BEATS.SWIPE && mappedCards.length > 0) {
    return (
      <div className={`journey-onboarding pso-swipe ${transitionClass} ${directionClass}`}>
        <div className="pso-swipe-container">
          <SwipeCardDeck
            cards={mappedCards}
            headerText="Does this skill sound like you?"
            onComplete={handleSwipeComplete}
            onBackFromFirst={() => transitionTo(
              clusters.length > 0 ? BEATS.CLUSTERS :
              selectedCategories.length > 0 ? BEATS.WHEEL_CATEGORIES : BEATS.PASTE,
              'left'
            )}
            renderCard={(card) => <SwipeCardContent card={card} />}
          />
        </div>
      </div>
    )
  }

  // BEAT 3a-6: Sub-select (per category)
  if (currentBeat === BEATS.SUB_SELECT && subSelectCatIds.length > 0) {
    const catId = subSelectCatIds[subSelectIndex]
    const seg = findSkillSegment(catId)
    const aiExtractions = categoryExtractions[catId] || []
    const aiSkillNames = aiExtractions.map(e => e.skill)
    const preDefinedItems = (seg?.placemakes || []).filter(pm => !aiSkillNames.includes(pm))
    const catItems = selectedItems[catId] || []
    const customItems = catItems.filter(item => !aiSkillNames.includes(item) && !(seg?.placemakes || []).includes(item))

    return (
      <div className={`journey-onboarding pso-gate ${transitionClass} ${directionClass}`}>
        <div className="pso-gate-content" style={{ textAlign: 'left' }}>
          <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem' }}>
            {subSelectIndex + 1} of {subSelectCatIds.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '1.3rem' }}>{seg?.icon}</span>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{seg?.displayName || catId}</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Tick the skills that light you up.
          </p>

          {aiExtractions.length > 0 && (
            <>
              <div className="idt-sub-label" style={{ color: 'rgba(233,162,59,0.7)' }}>From Your Conversations</div>
              {aiExtractions.map((ext, i) => (
                <label key={`ai-${i}`} className="idt-checkbox-row">
                  <input type="checkbox" checked={catItems.includes(ext.skill)} onChange={() => toggleItem(catId, ext.skill)} />
                  <span>
                    {ext.skill}
                    {ext.evidence && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        {ext.evidence.length > 100 ? ext.evidence.slice(0, 100) + '...' : ext.evidence}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </>
          )}

          <div className="idt-sub-label" style={{ color: 'rgba(255,255,255,0.3)' }}>Pre-Defined</div>
          {preDefinedItems.map((item, i) => (
            <label key={`pd-${i}`} className="idt-checkbox-row">
              <input type="checkbox" checked={catItems.includes(item)} onChange={() => toggleItem(catId, item)} />
              <span>{item}</span>
            </label>
          ))}

          <div className="idt-sub-label" style={{ color: 'rgba(255,255,255,0.3)' }}>Identify your own</div>
          <div className="idt-custom-row">
            <input type="text" className="idt-custom-input" placeholder="Type a skill..."
              value={customText} onChange={e => setCustomText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustom()} />
            <button className="idt-custom-add" disabled={!customText.trim()} onClick={handleAddCustom}>Add</button>
          </div>

          {customItems.map((item, i) => (
            <label key={`custom-${i}`} className="idt-checkbox-row">
              <input type="checkbox" checked={true} onChange={() => toggleItem(catId, item)} />
              <span>{item} <em style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>(custom)</em></span>
            </label>
          ))}

          <button className="jo-cta-button" onClick={handleSubSelectContinue} disabled={catItems.length === 0}
            style={{ width: '100%', marginTop: '1.25rem' }}>
            {subSelectIndex < subSelectCatIds.length - 1
              ? `Continue (${catItems.length} selected) →`
              : `Done (${catItems.length} selected) →`}
          </button>
          <button className="pso-back-link" onClick={() => {
            if (subSelectIndex > 0) setSubSelectIndex(subSelectIndex - 1)
            else transitionTo(BEATS.SWIPE, 'left')
          }}>← Back</button>
        </div>
      </div>
    )
  }

  // BEAT: Satisfaction
  if (currentBeat === BEATS.SATISFACTION) {
    const allKept = Object.keys(selectedItems).filter(catId => (selectedItems[catId] || []).length > 0)
    const totalItems = allKept.reduce((sum, catId) => sum + (selectedItems[catId]?.length || 0), 0)

    return (
      <div className={`journey-onboarding pso-gate ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="pso-gate-content">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>✨</div>
          <h2 className="pso-gate-title">{allKept.length} categories, {totalItems} play-skills found</h2>
          <p className="pso-gate-subtitle">Do these capture what lights you up, or are some missing?</p>
          <div className="pso-gate-options">
            <button className="pso-gate-btn pso-gate-primary" onClick={() => transitionTo(BEATS.REVEAL)}>
              <span className="pso-gate-icon">✅</span>
              <span className="pso-gate-text">
                <strong>These capture me</strong>
                <span>Move on to my results</span>
              </span>
            </button>
            <button className="pso-gate-btn" onClick={() => transitionTo(BEATS.WHEEL_CATEGORIES)}>
              <span className="pso-gate-icon">🎯</span>
              <span className="pso-gate-text">
                <strong>Some are missing</strong>
                <span>Browse and add more from the menu</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // BEAT 3b-1: Wheel Categories
  if (currentBeat === BEATS.WHEEL_CATEGORIES) {
    const identifiedCategories = new Set(keptPlacemakes.map(k => k.categoryId))
    const comingFromSatisfaction = keptPlacemakes.length > 0

    return (
      <div className={`journey-onboarding pso-wheel ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-wheel-content">
          <h2>{comingFromSatisfaction ? 'Add more play-skills' : 'Which of these sound fun?'}</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {comingFromSatisfaction
              ? `Pick up to ${MAX_CATEGORIES} more categories to explore.`
              : `Pick up to ${MAX_CATEGORIES}. (${selectedCategories.length}/${MAX_CATEGORIES})`}
          </p>
          <div className="pso-category-grid">
            {SKILLS_SEGMENTS.map(seg => {
              const isIdentified = identifiedCategories.has(seg.id)
              const isSelected = selectedCategories.includes(seg.id)
              const disabled = !isSelected && !isIdentified && selectedCategories.length >= MAX_CATEGORIES
              return (
                <button key={seg.id} onClick={() => !isIdentified && toggleCategory(seg.id)}
                  disabled={disabled || isIdentified}
                  className={`pso-category-card ${isSelected ? 'selected' : ''} ${isIdentified ? 'identified' : ''} ${disabled ? 'disabled' : ''}`}>
                  {isIdentified && <div className="pso-cat-identified-tag">Identified</div>}
                  <div className="pso-cat-icon">{seg.icon}</div>
                  <div className="pso-cat-name">{seg.displayName}</div>
                  <div className="pso-cat-tagline">{seg.tagline}</div>
                </button>
              )
            })}
          </div>
          <button className="jo-cta-button" onClick={handleWheelContinue} disabled={selectedCategories.length === 0}
            style={{ width: '100%', marginTop: '1rem' }}>
            <span className="jo-shimmer-layer" />Continue →
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(comingFromSatisfaction ? BEATS.SATISFACTION : BEATS.AI_GATE, 'left')}>← Back</button>
        </div>
      </div>
    )
  }

  // BEAT 4: Reveal
  if (currentBeat === BEATS.REVEAL) {
    const finalItems = getFinalKeptItems()
    const grouped = {}
    finalItems.forEach(item => {
      if (!grouped[item.categoryId]) grouped[item.categoryId] = []
      grouped[item.categoryId].push(item)
    })

    return (
      <div className={`journey-onboarding pso-reveal ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="pso-reveal-content">
          <div className="pso-reveal-icon">✨</div>
          <h2 className="pso-reveal-title">Your Play-Skills</h2>
          <p className="pso-reveal-subtitle">
            {path === 'a'
              ? "Here's what lights you up, pulled from your own words."
              : "Here's what you chose. These will power your journey."}
          </p>
          <div className="pso-reveal-groups">
            {Object.entries(grouped).map(([catId, items]) => {
              const seg = findSkillSegment(catId)
              return (
                <div key={catId} className="pso-reveal-group">
                  <div className="pso-reveal-cat">{seg?.icon} {seg?.displayName || catId}</div>
                  {items.map((item, i) => (
                    <div key={i} className="pso-reveal-item">{item.originalName || item.placemake}</div>
                  ))}
                </div>
              )
            })}
          </div>
          <button className="jo-cta-button" onClick={isAuthenticated ? handleAuthenticatedSave : handleSignUp}
            disabled={isLoading} style={{ width: '100%', marginTop: '1.5rem' }}>
            <span className="jo-shimmer-layer" />
            {isLoading ? 'Saving...' : isAuthenticated ? 'Add to my Play-List' : 'Save my play-skills'}
            {!isLoading && <span className="jo-btn-arrow">&#8594;</span>}
          </button>
          {error && <p className="pso-error">{error}</p>}
        </div>
      </div>
    )
  }

  // BEAT 5: Signup
  if (currentBeat === BEATS.SIGNUP) {
    return (
      <div className={`journey-onboarding jo-signup ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-signup-content">
          <h2 className="jo-signup-heading">Save your play-skills</h2>
          <p className="jo-signup-subtext">Create your account to start your journey</p>
          <form className="jo-signup-form" onSubmit={(e) => {
            e.preventDefault()
            if (userName.trim() && email.trim()) handleEmailSubmit(e)
          }}>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
              placeholder="Your first name" className="jo-signup-input" autoFocus />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" className="jo-signup-input" />
            <button type="submit" className="jo-cta-button" disabled={isLoading || !userName.trim() || !email.trim()}>
              {isLoading ? <span>Sending code...</span> : (
                <><span className="jo-shimmer-layer" />Send Verification Code<span className="jo-btn-arrow">&#8594;</span></>
              )}
            </button>
          </form>
          {authError && <p className="jo-auth-error">{authError}</p>}
        </div>
      </div>
    )
  }

  // BEAT 6: Verify
  if (currentBeat === BEATS.VERIFY) {
    return (
      <div className={`journey-onboarding jo-verify ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-verify-content">
          <h2 className="jo-verify-heading">Check your email</h2>
          <p className="jo-verify-subtext">We sent a code to <strong>{email}</strong></p>
          <form className="jo-verify-form" onSubmit={handleCodeVerify}>
            <input type="text" value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code" className="jo-signup-input jo-code-input"
              maxLength={6} autoFocus inputMode="numeric" autoComplete="one-time-code" />
            <button type="submit" className="jo-cta-button" disabled={isLoading || verificationCode.length !== 6}>
              {isLoading ? <span>Verifying...</span> : (
                <><span className="jo-shimmer-layer" />Verify &amp; Start<span className="jo-btn-arrow">&#8594;</span></>
              )}
            </button>
          </form>
          {authError && <p className="jo-auth-error">{authError}</p>}
          <button className="pso-back-link" onClick={() => {
            setVerificationCode('')
            setAuthError(null)
            handleEmailSubmit({ preventDefault: () => {} })
          }}>Resend code</button>
        </div>
      </div>
    )
  }

  return null
}
