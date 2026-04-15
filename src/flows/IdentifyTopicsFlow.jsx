/**
 * IdentifyTopicsFlow.jsx
 *
 * Topic/problem identification flow for the Play-List tab.
 *
 * Steps:
 *   1. Copy prompt (playskills + 12 problem categories baked in)
 *   2. Paste AI response
 *   3. Parse (maps extractions to problem categories)
 *   4. Swipe 12 category cards with AI-extracted preview bullets
 *      → "That's me" pauses swipe → sub-selection drawer
 *        (AI extracted + pre-defined placemakes + identify your own)
 *      → Continue → next card
 *   5. Save to DB
 *   6. Success
 *
 * Route: /identify-topics
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { PROBLEM_SEGMENTS, findProblemSegment } from '../lib/wheelTaxonomy'
import SwipeCardDeck from '../components/SwipeCardDeck/SwipeCardDeck'
import '../components/onboarding/JourneyOnboarding.css'
import './IdentifyTopicsFlow.css'

// ─── Image lookup ───────────────────────────────────────────────────────────

const PROBLEM_IMAGES = {}
PROBLEM_SEGMENTS.forEach(seg => {
  PROBLEM_IMAGES[seg.id] = `/images/problems/problem-${seg.id}.png`
})

// ─── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(playskills) {
  const skillList = playskills.map(ps => `- ${ps}`).join('\n')

  const categoryList = PROBLEM_SEGMENTS.map((seg, i) => {
    const pms = (seg.placemakes || []).map(pm => `   - ${pm}`).join('\n')
    return `${i + 1}. ${seg.displayName.toUpperCase()}\n${pms}`
  }).join('\n\n')

  return `Analyze our entire conversation history. I want you to identify which of these 12 problem categories I naturally gravitate toward.

For each category, I've listed specific examples of what the problem looks like. Only flag a category if you can cite specific evidence from our conversations.

THE 12 PROBLEMS:

${categoryList}

---

For each category I connect with, also note which of my play-skills would naturally apply:

MY PLAY-SKILLS:
${skillList}

Extract in this EXACT format:

---START EXTRACTION---

PROBLEMS
- CATEGORY: [Category name from the 12 above]
  PROBLEM: [Your own short description of MY specific version of this problem, under 15 words]
  EVIDENCE: [Specific quote or pattern from our conversations]
  MATCHED PLAY-SKILLS: [List the exact play-skill phrases that fit, separated by semicolons]

(only include categories where you have real evidence, aim for 4-7)

---END EXTRACTION---`
}

// ─── Parser ─────────────────────────────────────────────────────────────────

function parseExtraction(rawText, userPlayskills) {
  const results = []

  // Strip markdown bold/italic markers so **PROBLEM:** becomes PROBLEM:
  const text = rawText.replace(/\*{1,2}/g, '')

  // Split into per-entry blocks by CATEGORY keyword (robust against field reordering)
  const blocks = text.split(/(?=[-•*]?\s*CATEGORY\s*:)/i).filter(b => /CATEGORY\s*:/i.test(b))

  for (const block of blocks) {
    const rawCategory = block.match(/CATEGORY\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawProblem = block.match(/(?:PROBLEM|PLACEMAKE)\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawEvidence = block.match(/EVIDENCE\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawMatched = block.match(/MATCHED PLAY-SKILLS\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''

    if (!rawCategory) continue

    // Match category name to segment id
    const categoryLower = rawCategory.toLowerCase().replace(/[.*"]/g, '')
    const seg = PROBLEM_SEGMENTS.find(s => {
      const dn = s.displayName.toLowerCase()
      return dn === categoryLower || categoryLower.includes(dn.slice(0, 20)) || dn.includes(categoryLower.slice(0, 20))
    })
    if (!seg) continue

    // Parse matched playskills
    const parsedSkills = rawMatched
      .split(/[;,]/)
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(s => s.length > 10)

    const matched = parsedSkills
      .map(parsed => {
        const exact = userPlayskills.find(ps => ps === parsed)
        if (exact) return exact
        const partial = userPlayskills.find(ps =>
          parsed.toLowerCase().includes(ps.toLowerCase().slice(0, 30)) ||
          ps.toLowerCase().includes(parsed.toLowerCase().slice(0, 30))
        )
        return partial || null
      })
      .filter(Boolean)

    // Group by category (multiple extractions per category possible)
    const existing = results.find(r => r.categoryId === seg.id)
    const extraction = {
      problem: rawProblem,
      evidence: rawEvidence,
      matchedPlayskills: [...new Set(matched)],
    }

    if (existing) {
      existing.extractions.push(extraction)
    } else {
      results.push({
        categoryId: seg.id,
        extractions: [extraction],
      })
    }
  }

  return results
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function IdentifyTopicsFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('copy') // copy | paste | swipe | save_success
  const [playskills, setPlayskills] = useState([])
  const [loadingPlayskills, setLoadingPlayskills] = useState(true)
  const [copied, setCopied] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Parsed AI extractions grouped by category
  const [categoryExtractions, setCategoryExtractions] = useState({}) // { [categoryId]: [{ problem, evidence, matchedPlayskills }] }

  // Swipe state
  const [swipeCards, setSwipeCards] = useState([])

  // Sub-selection state
  const [selectedItems, setSelectedItems] = useState({}) // { [categoryId]: string[] }
  const [customTopicText, setCustomTopicText] = useState('')

  // Hide bottom toolbar during flow
  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => document.body.classList.remove('onboarding-active')
  }, [])

  // Load playskills
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('nikigai_clusters')
      .select('cluster_label')
      .eq('user_id', user.id)
      .eq('cluster_type', 'skills')
      .eq('step_id', 'get_started')
      .then(({ data }) => {
        if (data?.length > 0) setPlayskills(data.map(d => d.cluster_label))
        setLoadingPlayskills(false)
      })
      .catch(() => setLoadingPlayskills(false))
  }, [user?.id])

  const prompt = buildPrompt(playskills)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleParse = () => {
    if (!rawResponse.trim()) return
    setIsProcessing(true)
    setError(null)

    const results = parseExtraction(rawResponse, playskills)

    // Build extraction map
    const extractionMap = {}
    results.forEach(r => { extractionMap[r.categoryId] = r.extractions })
    setCategoryExtractions(extractionMap)

    // Build swipe cards only for categories that had AI matches
    const matchedCatIds = results.map(r => r.categoryId)
    const cards = PROBLEM_SEGMENTS
      .filter(seg => matchedCatIds.includes(seg.id))
      .map(seg => ({
        id: seg.id,
        categoryId: seg.id,
        displayName: seg.displayName,
        tagline: seg.tagline,
        icon: seg.icon,
        aiExtractions: extractionMap[seg.id] || [],
      }))

    if (cards.length === 0) {
      setError("Couldn't match any problem categories. Make sure you copied the full extraction output.")
      setIsProcessing(false)
      return
    }

    setSwipeCards(cards)
    setStep('swipe')
    setIsProcessing(false)
  }

  // Swipe complete — collect kept category IDs, then show sub-selections
  const [swipeKeptIds, setSwipeKeptIds] = useState([]) // category IDs from swipe
  const [subSelectionIndex, setSubSelectionIndex] = useState(0) // which kept category we're drilling into

  const handleSwipeComplete = (keptIds) => {
    const kept = keptIds.filter(id => swipeCards.some(c => c.id === id))
    setSwipeKeptIds(kept)

    if (kept.length === 0) {
      // No categories kept — show empty message, not success
      setStep('no_topics')
      return
    }

    // Pre-select AI items for all kept categories
    const preSelected = {}
    kept.forEach(catId => {
      const aiItems = (categoryExtractions[catId] || []).map(e => e.problem)
      preSelected[catId] = [...aiItems]
    })
    setSelectedItems(preSelected)
    setSubSelectionIndex(0)
    setStep('sub_select')
  }

  const toggleItem = (categoryId, item) => {
    setSelectedItems(prev => {
      const current = prev[categoryId] || []
      if (current.includes(item)) {
        return { ...prev, [categoryId]: current.filter(i => i !== item) }
      }
      return { ...prev, [categoryId]: [...current, item] }
    })
  }

  const handleAddCustom = () => {
    const catId = swipeKeptIds[subSelectionIndex]
    if (!customTopicText.trim() || !catId) return
    setSelectedItems(prev => ({
      ...prev,
      [catId]: [...(prev[catId] || []), customTopicText.trim()],
    }))
    setCustomTopicText('')
  }

  // Extra categories selected from satisfaction "some are missing" step
  const [extraCategories, setExtraCategories] = useState([])

  const handleSubSelectionContinue = () => {
    if (subSelectionIndex < swipeKeptIds.length - 1) {
      setSubSelectionIndex(subSelectionIndex + 1)
      setCustomTopicText('')
    } else {
      // All sub-selections done — show satisfaction check
      setStep('satisfaction')
    }
  }

  const toggleExtraCategory = (catId) => {
    setExtraCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  const handleExtraContinue = () => {
    if (extraCategories.length === 0) return
    // Pre-select pre-defined placemakes for extra categories
    const preSelected = { ...selectedItems }
    extraCategories.forEach(catId => {
      if (!preSelected[catId]) preSelected[catId] = []
    })
    setSelectedItems(preSelected)

    // Add extra categories to swipeKeptIds and show sub-selections for them
    const allKept = [...swipeKeptIds, ...extraCategories]
    setSwipeKeptIds(allKept)
    setSubSelectionIndex(swipeKeptIds.length) // start from where new ones begin
    setCustomTopicText('')
    setStep('sub_select')
  }

  const handleSave = async (keptCats) => {
    if (!user?.id) return
    setIsProcessing(true)
    setError(null)

    try {
      // Delete old identify_topics clusters
      await supabase.from('nikigai_clusters')
        .delete()
        .eq('user_id', user.id)
        .eq('step_id', 'identify_topics')

      // Create flow session
      const { data: session, error: sessionError } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'identify_topics',
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).select('id').single()
      if (sessionError || !session) throw sessionError || new Error('Failed to create session')

      // Build rows from selectedItems for kept categories
      const rows = []
      for (const catId of keptCats) {
        const items = selectedItems[catId] || []
        const aiExtractions = categoryExtractions[catId] || []

        for (const itemText of items) {
          // Find matching AI extraction for this item (if any)
          const aiMatch = aiExtractions.find(e => e.problem === itemText)
          const seg = findProblemSegment(catId)

          rows.push({
            session_id: session.id,
            user_id: user.id,
            cluster_type: 'problems',
            cluster_stage: 'final',
            step_id: 'identify_topics',
            cluster_label: itemText,
            items: [{
              text: itemText,
              categoryId: catId,
              categoryName: seg?.displayName || catId,
              evidence: aiMatch?.evidence || '',
              matchedPlayskills: aiMatch?.matchedPlayskills || [],
              source: aiMatch ? 'ai_extracted' : 'pre_defined',
            }],
          })
        }
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('nikigai_clusters').insert(rows)
        if (insertError) throw insertError
      }

      // Mark playlist_challenge quest as complete (fire and forget)
      supabase.from('quest_completions')
        .select('id').eq('user_id', user.id).eq('quest_id', 'playlist_challenge').maybeSingle()
        .then(({ data: existing }) => {
          if (!existing) {
            supabase.from('quest_completions').insert({
              user_id: user.id,
              quest_id: 'playlist_challenge',
              quest_category: 'Groans',
              quest_type: 'Rewire',
              points_earned: 10,
              challenge_day: 0,
            }).catch(() => {})
          }
        }).catch(() => {})

      // Navigate straight back
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }
    setIsProcessing(false)
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loadingPlayskills) {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="idt-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="loading-state"><div className="spinner" /></div>
          </div>
        </div>
      </div>
    )
  }

  if (playskills.length === 0 && user?.id) {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="idt-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧭</div>
            <h2>Identify your play-skills first</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              Before identifying topics, you need to discover what lights you up.
            </p>
            <button className="jo-cta-button" onClick={() => navigate('/get-started')}>
              Go to Get Started →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 1: Copy prompt ──────────────────────────────────────────────────

  if (step === 'copy') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="idt-container">
          <div className="card">
            <h1 className="idt-title">Identify Your Topics</h1>
            <p className="idt-subtitle">
              Paste this prompt into the AI you've been chatting with. It will find which problems you naturally care about.
            </p>

            <div className="idt-prompt-preview">
              {prompt.substring(0, 200)}...
            </div>

            <button className="jo-cta-button" onClick={handleCopyPrompt} style={{ width: '100%' }}>
              {copied ? '✓ Copied!' : 'Copy Prompt'}
            </button>

            <div className="idt-external-links">
              <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer"
                className="pso-back-link">Open ChatGPT</a>
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                className="pso-back-link">Open Claude</a>
            </div>

            <button className="jo-cta-button" onClick={() => setStep('paste')} style={{ width: '100%', marginTop: '1.5rem' }}>
              I have my results →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 2: Paste ────────────────────────────────────────────────────────

  if (step === 'paste') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="idt-container">
          <div className="card">
            <h2>Paste your AI extraction</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              Paste the topics extraction from your AI conversation below.
            </p>

            <textarea
              value={rawResponse}
              onChange={(e) => setRawResponse(e.target.value)}
              placeholder="Paste the extraction here..."
              className="idt-textarea"
            />

            {error && <p className="idt-error">{error}</p>}

            <div className="nav-buttons" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                className="jo-cta-button"
                onClick={handleParse}
                disabled={!rawResponse.trim() || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Find My Topics →'}
              </button>
              <button className="pso-back-link" onClick={() => setStep('copy')}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 3: Swipe + Sub-selection ────────────────────────────────────────

  // ─── Step 3: Swipe ─────────────────────────────────────────────────────────

  if (step === 'swipe') {
    return (
      <div className="journey-onboarding idt-flow idt-swipe-view">
        <SwipeCardDeck
          cards={swipeCards}
          headerText="Does this problem pull you in?"
          onComplete={handleSwipeComplete}
          onBackFromFirst={() => setStep('paste')}
          renderCard={(card) => {
            const imgSrc = PROBLEM_IMAGES[card.categoryId]
            const aiExtractions = card.aiExtractions || []
            return (
              <>
                {imgSrc && (
                  <img
                    className="idt-card-image"
                    src={imgSrc}
                    alt={card.displayName}
                    draggable={false}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="idt-card-name">{card.displayName}</div>
                <div className="idt-card-tagline">{card.tagline}</div>
                {aiExtractions.length > 0 && (
                  <div className="idt-card-extractions">
                    <div className="idt-card-ext-label">Analysis found:</div>
                    {aiExtractions.map((ext, i) => (
                      <div key={i} className="idt-card-ext-bullet">
                        {ext.problem}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          }}
        />
      </div>
    )
  }

  // ─── Step 3b: Sub-selections (sequential, one per kept category) ────────

  if (step === 'sub_select' && swipeKeptIds.length > 0) {
    const catId = swipeKeptIds[subSelectionIndex]
    const seg = findProblemSegment(catId)
    const aiItems = (categoryExtractions[catId] || []).map(e => e.problem)
    const preDefinedItems = seg?.placemakes || []
    const catItems = selectedItems[catId] || []

    // Custom items (not in AI or pre-defined lists)
    const customItems = catItems.filter(item =>
      !aiItems.includes(item) && !preDefinedItems.includes(item)
    )

    return (
      <div className="journey-onboarding idt-flow">
        <div className="idt-container">
          <div className="card">
            <div className="idt-sub-progress">
              {subSelectionIndex + 1} of {swipeKeptIds.length}
            </div>
            <div className="idt-sub-header">
              <span style={{ fontSize: '1.4rem' }}>{seg?.icon}</span>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{seg?.displayName || catId}</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Tick the specific problems that light you up.
            </p>

            {aiItems.length > 0 && (
              <>
                <div className="idt-sub-label">AI Extracted</div>
                {aiItems.map((item, i) => (
                  <label key={`ai-${i}`} className="idt-checkbox-row">
                    <input
                      type="checkbox"
                      checked={catItems.includes(item)}
                      onChange={() => toggleItem(catId, item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </>
            )}

            <div className="idt-sub-label">Pre-Defined</div>
            {preDefinedItems.map((item, i) => (
              <label key={`pd-${i}`} className="idt-checkbox-row">
                <input
                  type="checkbox"
                  checked={catItems.includes(item)}
                  onChange={() => toggleItem(catId, item)}
                />
                <span>{item}</span>
              </label>
            ))}

            <div className="idt-sub-label">Identify your own</div>
            <div className="idt-custom-row">
              <input
                type="text"
                className="idt-custom-input"
                placeholder="Type a topic..."
                value={customTopicText}
                onChange={e => setCustomTopicText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
              <button
                className="idt-custom-add"
                disabled={!customTopicText.trim()}
                onClick={handleAddCustom}
              >
                Add
              </button>
            </div>

            {customItems.map((item, i) => (
              <label key={`custom-${i}`} className="idt-checkbox-row">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggleItem(catId, item)}
                />
                <span>{item} <em style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>(custom)</em></span>
              </label>
            ))}

            <button
              className="jo-cta-button"
              onClick={handleSubSelectionContinue}
              disabled={catItems.length === 0 || isProcessing}
              style={{ width: '100%', marginTop: '1.25rem' }}
            >
              {isProcessing ? 'Saving...' : subSelectionIndex < swipeKeptIds.length - 1
                ? `Continue (${catItems.length} selected) →`
                : `Save ${catItems.length} topics →`
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── No topics selected ────────────────────────────────────────────────────

  // ─── Satisfaction check ──────────────────────────────────────────────────

  if (step === 'satisfaction') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="idt-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
            <h2>{swipeKeptIds.length} topic areas identified</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Do these capture the problems you care about, or are some missing?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="pso-gate-btn pso-gate-primary"
                onClick={() => handleSave(swipeKeptIds)}
                disabled={isProcessing}
              >
                <span className="pso-gate-icon">✅</span>
                <span className="pso-gate-text">
                  <strong>{isProcessing ? 'Saving...' : 'These capture me'}</strong>
                  <span>Save and continue</span>
                </span>
              </button>
              <button
                className="pso-gate-btn"
                onClick={() => setStep('extra_pick')}
              >
                <span className="pso-gate-icon">🎯</span>
                <span className="pso-gate-text">
                  <strong>Some are missing</strong>
                  <span>Browse and add more categories</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Extra category picker ────────────────────────────────────────────────

  if (step === 'extra_pick') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="idt-container">
          <div className="card">
            <h2>Add more topic areas</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Select categories you also care about.
            </p>
            <div className="pso-category-grid">
              {PROBLEM_SEGMENTS.map(seg => {
                const alreadyKept = swipeKeptIds.includes(seg.id)
                const isExtra = extraCategories.includes(seg.id)
                return (
                  <button
                    key={seg.id}
                    onClick={() => !alreadyKept && toggleExtraCategory(seg.id)}
                    disabled={alreadyKept}
                    className={`pso-category-card ${isExtra ? 'selected' : ''} ${alreadyKept ? 'identified' : ''}`}
                  >
                    {alreadyKept && <div className="pso-cat-identified-tag">Identified</div>}
                    <div className="pso-cat-icon">{seg.icon}</div>
                    <div className="pso-cat-name">{seg.displayName}</div>
                    <div className="pso-cat-tagline">{seg.tagline}</div>
                  </button>
                )
              })}
            </div>
            <button
              className="jo-cta-button"
              onClick={extraCategories.length > 0 ? handleExtraContinue : () => handleSave(swipeKeptIds)}
              disabled={isProcessing}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              <span className="jo-shimmer-layer" />
              {isProcessing ? 'Saving...' : extraCategories.length > 0 ? `Continue with ${extraCategories.length} more →` : 'Save as is →'}
            </button>
            <button className="pso-back-link" onClick={() => setStep('satisfaction')}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── No topics selected ───────────────────────────────────────────────────

  if (step === 'no_topics') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="idt-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🤔</div>
            <h2>No topics selected</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              None of the categories resonated this time. You can try again or go back.
            </p>
            <button className="jo-cta-button" onClick={() => { setStep('swipe'); setSwipeKeptIds([]) }} style={{ width: '100%', marginBottom: '0.5rem' }}>
              Try again
            </button>
            <button className="pso-back-link" onClick={() => navigate('/7-day-challenge')} style={{ width: '100%' }}>
              Back to Play-List
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 4: Success ──────────────────────────────────────────────────────

  if (step === 'save_success') {
    const totalItems = swipeKeptIds.reduce(
      (sum, catId) => sum + (selectedItems[catId]?.length || 0), 0
    )

    return (
      <div className="journey-onboarding idt-flow">
        <div className="idt-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🎯</div>
            <h2>{swipeKeptIds.length} categories, {totalItems} topics saved!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Your Play-List is ready. Choose a category and create your first challenge.
            </p>
            <button className="jo-cta-button" onClick={() => navigate('/7-day-challenge')} style={{ width: '100%', marginTop: '1rem' }}>
              Go to Play-List →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
