/**
 * IdentifyTopicsFlow.jsx
 *
 * Topic/problem identification flow for the Play-List tab.
 *
 * Steps:
 *   1. Copy prompt (12 category names, no placemakes)
 *   2. Paste AI response
 *   3. Parse → extract personal problems mapped to categories
 *   4. Cluster → send category names to nikigai-conversation for thematic grouping
 *   5. Cluster selection → user picks a cluster to explore
 *   6. Sub-select → per-category checkboxes (AI extracted + pre-defined + custom)
 *   7. Satisfaction check → save or add more
 *   8. Save to DB
 *
 * Route: /identify-topics
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { PROBLEM_SEGMENTS, findProblemSegment } from '../lib/wheelTaxonomy'
import '../components/onboarding/JourneyOnboarding.css'
import './IdentifyTopicsFlow.css'

// ─── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt() {
  const categoryList = PROBLEM_SEGMENTS.map((seg, i) =>
    `${i + 1}. ${seg.displayName}`
  ).join('\n')

  return `Analyze our entire conversation history and identify the specific problems I care about and gravitate toward.

For each problem you identify, write it in MY voice based on what I've actually said and shown. Then map it to one of these 12 categories:

${categoryList}

Extract in this EXACT format:

---START EXTRACTION---

- PROBLEM: [The specific problem in my own words, under 20 words]
  CATEGORY: [Exact category name from the 12 above]
  EVIDENCE: [Specific quote or pattern from our conversations]

(List 1-3 problems per category. Only add a second or third if the evidence genuinely supports a distinct angle. Only include categories where you have real evidence. Aim for 4-7 categories.)

---END EXTRACTION---`
}

// ─── Parser ─────────────────────────────────────────────────────────────────

function parseExtraction(rawText) {
  const results = []

  // Strip everything outside extraction markers if present
  let cleaned = rawText
  const startMatch = cleaned.match(/---\s*START EXTRACTION\s*---/i)
  const endMatch = cleaned.match(/---\s*END EXTRACTION\s*---/i)
  if (startMatch) cleaned = cleaned.slice(startMatch.index + startMatch[0].length)
  if (endMatch) cleaned = cleaned.slice(0, cleaned.lastIndexOf(endMatch[0]))
  // Strip markdown bold/italic markers
  const text = cleaned.replace(/\*{1,2}/g, '')

  // Split on PROBLEM: at the start of each item (allowing optional bullet prefix)
  const blocks = text.split(/(?=[-•*]?\s*(?:PROBLEM|PLACEMAKE)\s*:)/i).filter(b => /(?:PROBLEM|PLACEMAKE)\s*:/i.test(b))

  for (const block of blocks) {
    const rawProblem = block.match(/(?:PROBLEM|PLACEMAKE)\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawCategory = block.match(/CATEGORY\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''
    const rawEvidence = block.match(/EVIDENCE\s*:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || ''

    if (!rawProblem || !rawCategory) continue

    // Match category name to segment id
    const categoryLower = rawCategory.toLowerCase().replace(/[.*"]/g, '')
    const seg = PROBLEM_SEGMENTS.find(s => {
      const dn = s.displayName.toLowerCase()
      return dn === categoryLower || categoryLower.includes(dn.slice(0, 20)) || dn.includes(categoryLower.slice(0, 20))
    })
    if (!seg) continue

    const extraction = {
      problem: rawProblem,
      evidence: rawEvidence,
      matchedPlayskills: [],
    }

    const existing = results.find(r => r.categoryId === seg.id)
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

// ─── Cluster categories via nikigai-conversation ────────────────────────────

async function clusterCategories(categoryResults) {
  // Build input: category names with context for nikigai
  const lines = categoryResults.map((r, i) => {
    const seg = findProblemSegment(r.categoryId)
    const problemSummaries = r.extractions.map(e => e.problem).join('. ')
    return `${i + 1}. ${seg?.displayName || r.categoryId} (context: ${problemSummaries})`
  }).join('\n')

  const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
    body: {
      currentStep: {
        id: 'problems_final',
        assistant_prompt: 'Group these problem category labels into 2-4 thematic clusters. Use ONLY the exact category names as items in your clusters array. The context after each label is for your understanding only.',
      },
      userResponse: 'Group my problem categories',
      shouldCluster: true,
      clusterType: 'problems',
      clusterSources: ['problems_all'],
      allResponses: [{
        user_id: 'clustering',
        response_raw: lines,
        store_as: 'problems_all',
      }],
      conversationHistory: [],
    },
  })

  if (error) throw error

  // Parse clusters and match category names back to segment IDs
  const clusters = (data?.clusters || []).map(cluster => {
    const categoryIds = cluster.items
      .map(item => {
        // Extract category name — item may be "Category Name — context..." or just "Category Name"
        const cleanItem = item.split('—')[0].split('(context')[0].replace(/^\d+\.\s*/, '').trim().toLowerCase().replace(/[.*"]/g, '')
        const seg = PROBLEM_SEGMENTS.find(s => {
          const dn = s.displayName.toLowerCase()
          return dn === cleanItem || cleanItem.includes(dn.slice(0, 20)) || dn.includes(cleanItem.slice(0, 20))
        })
        return seg?.id || null
      })
      .filter(Boolean)

    return {
      label: cluster.label,
      insight: cluster.insight,
      categoryIds,
    }
  }).filter(c => c.categoryIds.length > 0)

  return clusters
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function IdentifyTopicsFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Steps: copy | paste | clustering | clusters | sub_select | satisfaction | extra_pick | no_topics
  const [step, setStep] = useState('copy')
  const [copied, setCopied] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Parsed AI extractions grouped by category
  const [categoryExtractions, setCategoryExtractions] = useState({})

  // Cluster state
  const [clusters, setClusters] = useState([])

  // Sub-selection state
  const [keptCategoryIds, setKeptCategoryIds] = useState([])
  const [subSelectionIndex, setSubSelectionIndex] = useState(0)
  const [subSelectionStartIndex, setSubSelectionStartIndex] = useState(0)
  const [selectedItems, setSelectedItems] = useState({})
  const [customTopicText, setCustomTopicText] = useState('')

  // Extra categories from satisfaction "some are missing"
  const [extraCategories, setExtraCategories] = useState([])

  // Hide bottom toolbar during flow
  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => document.body.classList.remove('onboarding-active')
  }, [])

  const prompt = buildPrompt()

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse extraction → cluster via nikigai
  const handleParse = async () => {
    if (!rawResponse.trim()) return
    setIsProcessing(true)
    setError(null)

    const results = parseExtraction(rawResponse)

    if (results.length === 0) {
      setError("Couldn't match any problem categories. Make sure you copied the full extraction output.")
      setIsProcessing(false)
      return
    }

    // Store extractions
    const extractionMap = {}
    results.forEach(r => { extractionMap[r.categoryId] = r.extractions })
    setCategoryExtractions(extractionMap)

    // Show clustering loading
    setStep('clustering')

    // Call nikigai-conversation to cluster categories
    try {
      const clusterResult = await clusterCategories(results)

      if (clusterResult.length === 0) {
        throw new Error('No clusters returned')
      }

      setClusters(clusterResult)
      setStep('clusters')
    } catch (err) {
      console.error('Clustering error:', err)
      setError('Failed to analyse your problem spaces. Please try again.')
      setStep('paste')
    }
    setIsProcessing(false)
  }

  // User selects a cluster → enter sub-select for its categories
  // Continue from cluster overview → sub-select ALL categories sequentially
  const handleClusterContinue = () => {
    const allCatIds = clusters.flatMap(c => c.categoryIds)
    setKeptCategoryIds(allCatIds)

    // Pre-select AI items for all categories
    const preSelected = {}
    allCatIds.forEach(catId => {
      const aiItems = (categoryExtractions[catId] || []).map(e => e.problem)
      preSelected[catId] = [...aiItems]
    })
    setSelectedItems(preSelected)
    setSubSelectionIndex(0)
    setSubSelectionStartIndex(0)
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
    const catId = keptCategoryIds[subSelectionIndex]
    if (!customTopicText.trim() || !catId) return
    setSelectedItems(prev => ({
      ...prev,
      [catId]: [...(prev[catId] || []), customTopicText.trim()],
    }))
    setCustomTopicText('')
  }

  const handleSubSelectionContinue = () => {
    if (subSelectionIndex < keptCategoryIds.length - 1) {
      setSubSelectionIndex(subSelectionIndex + 1)
      setCustomTopicText('')
    } else {
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
    const preSelected = { ...selectedItems }
    extraCategories.forEach(catId => {
      if (!preSelected[catId]) preSelected[catId] = []
    })
    setSelectedItems(preSelected)

    const startIdx = keptCategoryIds.length
    const allKept = [...keptCategoryIds, ...extraCategories]
    setKeptCategoryIds(allKept)
    setSubSelectionIndex(startIdx)
    setSubSelectionStartIndex(startIdx)
    setCustomTopicText('')
    setStep('sub_select')
  }

  // Get all category IDs that have been sub-selected (across all explored clusters)
  const getAllKeptCategoryIds = () => {
    return Object.keys(selectedItems).filter(catId =>
      (selectedItems[catId] || []).length > 0
    )
  }

  const handleSave = async () => {
    if (!user?.id) return
    setIsProcessing(true)
    setError(null)

    const allKept = getAllKeptCategoryIds()

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

      // Build rows from selectedItems
      const rows = []
      for (const catId of allKept) {
        const items = selectedItems[catId] || []
        const aiExtractions = categoryExtractions[catId] || []

        for (const itemText of items) {
          const aiMatch = aiExtractions.find(e => e.problem === itemText)
          const seg = findProblemSegment(catId)

          const validCatId = PROBLEM_SEGMENTS.some(s => s.id === catId) ? catId : null
          rows.push({
            session_id: session.id,
            user_id: user.id,
            cluster_type: 'problems',
            cluster_stage: 'final',
            step_id: 'identify_topics',
            cluster_label: itemText,
            problem_tags: validCatId ? [validCatId] : [],
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
            }).then(r => {
              if (r.error) console.warn('Playlist quest insert:', r.error.message)
              supabase.rpc('increment_scores', { p_user_id: user.id, p_project_id: null, p_category: 'play_list', p_points: 10, p_week_start: new Date().toISOString().slice(0, 10) }).then(r2 => { if (r2.error) console.warn('Playlist score sync:', r2.error.message) })
            }).then(r => { if (r?.error) console.warn('Playlist quest chain:', r.error.message) })
          }
        }).then(r => { if (r?.error) console.warn('Playlist quest check:', r.error.message) })

      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }
    setIsProcessing(false)
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

  // ─── Step 3: Clustering loading ───────────────────────────────────────────

  if (step === 'clustering') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="idt-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="loading-state"><div className="spinner" /></div>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1.5rem', fontStyle: 'italic' }}>
            Analysing your problem spaces...
          </p>
        </div>
      </div>
    )
  }

  // ─── Step 4: Cluster selection ────────────────────────────────────────────

  if (step === 'clusters') {
    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="idt-container">
          <div className="card" style={{ background: 'none', boxShadow: 'none', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="idt-title">Your Problem Spaces</h1>
            <p className="idt-subtitle">
              We found {clusters.length} themes in what you care about. Review them, then we'll walk through each one.
            </p>

            {clusters.map((cluster, i) => (
              <div key={i} className="idt-cluster-card" style={{ cursor: 'default' }}>
                <div className="idt-cluster-name">{cluster.label}</div>
                <div className="idt-cluster-insight">{cluster.insight}</div>
                <div className="idt-cluster-tags">
                  {cluster.categoryIds.map(catId => {
                    const seg = findProblemSegment(catId)
                    return (
                      <span key={catId} className="idt-cluster-tag">
                        {seg?.icon} {seg?.displayName}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              className="jo-cta-button"
              onClick={handleClusterContinue}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <span className="jo-shimmer-layer" />
              Review my topics →
            </button>

            <button className="pso-back-link" onClick={() => setStep('paste')}>
              ← Back to paste
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 5: Sub-selections ───────────────────────────────────────────────

  if (step === 'sub_select' && keptCategoryIds.length > 0) {
    const catId = keptCategoryIds[subSelectionIndex]
    const seg = findProblemSegment(catId)
    const aiExtractions = categoryExtractions[catId] || []
    const aiItems = aiExtractions.map(e => e.problem)
    const preDefinedItems = seg?.placemakes || []
    const catItems = selectedItems[catId] || []

    // Pre-defined items excluding any that match AI extracted (avoid duplicates)
    const filteredPreDefined = preDefinedItems.filter(item => !aiItems.includes(item))

    // Custom items (not in AI or pre-defined lists)
    const customItems = catItems.filter(item =>
      !aiItems.includes(item) && !preDefinedItems.includes(item)
    )

    return (
      <div className="journey-onboarding idt-flow">
        <div className="idt-container">
          <div className="card">
            <div className="idt-sub-progress">
              {subSelectionIndex + 1} of {keptCategoryIds.length}
            </div>
            <div className="idt-sub-header">
              <span style={{ fontSize: '1.4rem' }}>{seg?.icon}</span>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{seg?.displayName || catId}</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Tick the specific problems that light you up.
            </p>

            {aiExtractions.length > 0 && (
              <>
                <div className="idt-sub-label">From Your Conversations</div>
                {aiExtractions.map((ext, i) => (
                  <label key={`ai-${i}`} className="idt-checkbox-row">
                    <input
                      type="checkbox"
                      checked={catItems.includes(ext.problem)}
                      onChange={() => toggleItem(catId, ext.problem)}
                    />
                    <span>
                      {ext.problem}
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

            <div className="idt-sub-label">Pre-Defined</div>
            {filteredPreDefined.map((item, i) => (
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
              disabled={catItems.length === 0}
              style={{ width: '100%', marginTop: '1.25rem' }}
            >
              {subSelectionIndex < keptCategoryIds.length - 1
                ? `Continue (${catItems.length} selected) →`
                : `Done (${catItems.length} selected) →`
              }
            </button>
            <button className="pso-back-link" onClick={() => {
              if (subSelectionIndex > subSelectionStartIndex) {
                setSubSelectionIndex(subSelectionIndex - 1)
              } else if (subSelectionStartIndex > 0) {
                setStep('satisfaction')
              } else {
                setStep('clusters')
              }
            }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Satisfaction check ──────────────────────────────────────────────────

  if (step === 'satisfaction') {
    const allKept = getAllKeptCategoryIds()
    const totalItems = allKept.reduce((sum, catId) => sum + (selectedItems[catId]?.length || 0), 0)

    return (
      <div className="journey-onboarding idt-flow">
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="idt-container">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
            <h2>{allKept.length} topic areas, {totalItems} problems identified</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Do these capture the problems you care about, or are some missing?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="pso-gate-btn pso-gate-primary"
                onClick={handleSave}
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
            {error && <p className="idt-error" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  // ─── Extra category picker ────────────────────────────────────────────────

  if (step === 'extra_pick') {
    const allKept = getAllKeptCategoryIds()

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
                const alreadyKept = allKept.includes(seg.id)
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
              onClick={extraCategories.length > 0 ? handleExtraContinue : handleSave}
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

  // ─── No topics ────────────────────────────────────────────────────────────

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
            <button className="jo-cta-button" onClick={() => setStep('paste')} style={{ width: '100%', marginBottom: '0.5rem' }}>
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

  return null
}
