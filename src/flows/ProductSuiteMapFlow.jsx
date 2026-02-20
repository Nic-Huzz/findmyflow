/**
 * ProductSuiteMapFlow.jsx
 *
 * Interactive visual money model builder. Users drag/click completed assessment
 * results from a pool into a chain to map their product suite.
 *
 * Pool → Chain UX: completed assessments sit in a pool at top, user assembles
 * them into an ordered chain below. Custom steps can be added. Submit is blocked
 * until all 4 assessments are done.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'

const OFFER_TYPES = [
  { key: 'attraction', table: 'attraction_offer_assessments', label: 'Attraction', emoji: '\uD83E\uDDF2', route: '/attraction-offer', cssClass: 'mm-attraction' },
  { key: 'upsell', table: 'upsell_assessments', label: 'Upsell', emoji: '\u2B06\uFE0F', route: '/upsell-offer', cssClass: 'mm-upsell' },
  { key: 'downsell', table: 'downsell_assessments', label: 'Downsell', emoji: '\u2B07\uFE0F', route: '/downsell-offer', cssClass: 'mm-downsell' },
  { key: 'continuity', table: 'continuity_assessments', label: 'Continuity', emoji: '\uD83D\uDD04', route: '/continuity-offer', cssClass: 'mm-continuity' }
]

function ProductSuiteMapFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [assessments, setAssessments] = useState({})
  const [allScores, setAllScores] = useState({})           // { attraction: [{ id, name, score, confidence, disqualified }], ... }
  const [chain, setChain] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [chainDragOver, setChainDragOver] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customType, setCustomType] = useState('attraction')
  const [openDropdown, setOpenDropdown] = useState(null)    // which offer type dropdown is open
  const [showAddAnother, setShowAddAnother] = useState(false)
  const [addAnotherType, setAddAnotherType] = useState(null) // which type is being picked

  const dragSource = useRef(null) // 'pool' or 'chain'
  const draggedIdxRef = useRef(null)
  const nextId = useRef(0)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return
    const close = () => setOpenDropdown(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openDropdown])

  // Load assessment data + saved map on mount
  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadData() {
      // Fetch all 4 assessments in parallel
      const assessmentResults = await Promise.all(
        OFFER_TYPES.map(ot =>
          supabase.from(ot.table)
            .select('recommended_offer_name, recommended_offer_id, confidence_score, all_offer_scores')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        )
      )

      if (cancelled) return

      const loaded = {}
      const scores = {}
      OFFER_TYPES.forEach((ot, i) => {
        const { data, error } = assessmentResults[i]
        if (error) console.error(`Failed to load ${ot.key} assessment:`, error)
        if (data?.recommended_offer_name) {
          loaded[ot.key] = {
            name: data.recommended_offer_name,
            offerId: data.recommended_offer_id || '',
            confidence: data.confidence_score || 0
          }
          if (data.all_offer_scores?.length > 0) {
            scores[ot.key] = data.all_offer_scores.filter(s => !s.disqualified)
          }
        }
      })
      setAssessments(loaded)
      setAllScores(scores)

      // Fetch saved map
      const { data: mapData } = await supabase
        .from('product_suite_maps')
        .select('chain_data')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (mapData?.chain_data?.chain) {
        // Add stable IDs to loaded chain items
        setChain(mapData.chain_data.chain.map((item, i) => ({
          ...item,
          id: item.id || `loaded-${i}-${nextId.current++}`
        })))
      }

      setLoading(false)
    }

    loadData()
    return () => { cancelled = true }
  }, [user])

  const completedCount = Object.keys(assessments).length
  const allAssessed = OFFER_TYPES.every(ot => assessments[ot.key])
  const hasRealOffer = chain.some(item => !item.isCustom)
  const canSubmit = allAssessed && chain.length > 0 && hasRealOffer

  // Check if an offer type is already in the chain
  const isInChain = (key) => chain.some(item => !item.isCustom && item.type === key)

  // Add pool item to chain (guard inside updater to prevent double-add race)
  const addToChain = (offerType) => {
    if (!assessments[offerType.key]) return
    const assessment = assessments[offerType.key]
    setChain(prev => {
      if (prev.some(item => !item.isCustom && item.type === offerType.key)) return prev
      return [...prev, {
        id: `${offerType.key}-${nextId.current++}`,
        type: offerType.key,
        name: assessment.name,
        isCustom: false,
        confidence: assessment.confidence
      }]
    })
  }

  // Remove item from chain
  const removeFromChain = (idx) => {
    setChain(prev => prev.filter((_, i) => i !== idx))
  }

  // Add custom step
  const addCustomStep = () => {
    if (!customName.trim()) return
    setChain(prev => [...prev, {
      id: `custom-${nextId.current++}`,
      type: customType,
      name: customName.trim(),
      isCustom: true,
      parentType: customType
    }])
    setCustomName('')
    setCustomType('attraction')
    setShowCustomInput(false)
  }

  // Add another offer of an existing type to the chain
  const addAnotherOffer = (typeKey, offer) => {
    setChain(prev => [...prev, {
      id: `${typeKey}-extra-${nextId.current++}`,
      type: typeKey,
      name: offer.name,
      isCustom: false,
      confidence: offer.confidence || offer.score || 0
    }])
    setAddAnotherType(null)
    setShowAddAnother(false)
  }

  // Change the selected offer for a given type
  const handleChangeOffer = (offerTypeKey, offer) => {
    setAssessments(prev => ({
      ...prev,
      [offerTypeKey]: {
        name: offer.name,
        offerId: offer.id || '',
        confidence: offer.confidence || 0
      }
    }))
    // Also update in chain if it's already there
    setChain(prev => prev.map(item =>
      !item.isCustom && item.type === offerTypeKey
        ? { ...item, name: offer.name, confidence: offer.confidence || 0 }
        : item
    ))
    setOpenDropdown(null)
  }

  // --- Drag and Drop ---

  // Pool item drag start
  const handlePoolDragStart = (e, offerType) => {
    if (!assessments[offerType.key] || isInChain(offerType.key)) {
      e.preventDefault()
      return
    }
    dragSource.current = 'pool'
    e.dataTransfer.setData('text/plain', offerType.key)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Chain item drag start (reorder)
  const handleChainDragStart = (e, idx) => {
    dragSource.current = 'chain'
    draggedIdxRef.current = idx
    setDraggedIdx(idx)
    e.dataTransfer.setData('text/plain', String(idx))
    e.dataTransfer.effectAllowed = 'move'
  }

  // Chain item drag over (for reorder highlighting)
  const handleChainItemDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }

  // Chain zone drag over (for pool → chain drops)
  const handleChainZoneDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setChainDragOver(true)
  }

  const handleChainZoneDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setChainDragOver(false)
    }
  }

  // Drop on chain zone (pool → chain append)
  const handleChainZoneDrop = (e) => {
    e.preventDefault()
    setChainDragOver(false)

    if (dragSource.current === 'pool') {
      const key = e.dataTransfer.getData('text/plain')
      const offerType = OFFER_TYPES.find(ot => ot.key === key)
      if (offerType) addToChain(offerType)
    }

    dragSource.current = null
  }

  // Drop on chain item (reorder)
  const handleChainItemDrop = (e, dropIdx) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIdx(null)
    setChainDragOver(false)

    if (dragSource.current === 'chain' && draggedIdxRef.current !== null && draggedIdxRef.current !== dropIdx) {
      const fromIdx = draggedIdxRef.current
      setChain(prev => {
        const updated = [...prev]
        const [moved] = updated.splice(fromIdx, 1)
        updated.splice(dropIdx, 0, moved)
        return updated
      })
    } else if (dragSource.current === 'pool') {
      const key = e.dataTransfer.getData('text/plain')
      const offerType = OFFER_TYPES.find(ot => ot.key === key)
      if (offerType && assessments[offerType.key]) {
        const assessment = assessments[offerType.key]
        setChain(prev => {
          if (prev.some(item => !item.isCustom && item.type === offerType.key)) return prev
          const updated = [...prev]
          updated.splice(dropIdx, 0, {
            id: `${offerType.key}-${nextId.current++}`,
            type: offerType.key,
            name: assessment.name,
            isCustom: false,
            confidence: assessment.confidence
          })
          return updated
        })
      }
    }

    setDraggedIdx(null)
    draggedIdxRef.current = null
    dragSource.current = null
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    draggedIdxRef.current = null
    setDragOverIdx(null)
    setChainDragOver(false)
    dragSource.current = null
  }

  // Submit
  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    try {
      const chainData = {
        chain: chain.map(item => ({
          type: item.type,
          name: item.name,
          isCustom: item.isCustom || false,
          ...(item.confidence != null && { confidence: item.confidence }),
          ...(item.parentType && { parentType: item.parentType })
        })),
        assessments: Object.fromEntries(
          OFFER_TYPES.filter(ot => assessments[ot.key]).map(ot => [
            ot.key,
            {
              offer: assessments[ot.key].name,
              offerId: assessments[ot.key].offerId,
              confidence: assessments[ot.key].confidence
            }
          ])
        )
      }

      const { error: mapError } = await supabase
        .from('product_suite_maps')
        .upsert({
          user_id: user.id,
          chain_data: chainData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (mapError) {
        console.error('Error saving product suite map:', mapError)
        setSubmitting(false)
        return
      }

      await syncFlowFinderWithChallenge(user.id, 'product_suite_map')
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error submitting product suite map:', err)
      setSubmitting(false)
    }
  }

  // Resolve CSS class for a chain item type
  const getCssClass = (type) => {
    const ot = OFFER_TYPES.find(o => o.key === type)
    return ot ? ot.cssClass : 'mm-attraction'
  }

  const getEmoji = (type) => {
    const ot = OFFER_TYPES.find(o => o.key === type)
    return ot ? ot.emoji : '\uD83E\uDDF2'
  }

  const getLabel = (type) => {
    const ot = OFFER_TYPES.find(o => o.key === type)
    return ot ? ot.label : type
  }

  if (loading) {
    return (
      <div className="product-suite-map flow-base">
        <div className="psm-loading">
          <div className="spinner" />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading your assessments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="product-suite-map flow-base">
      <div className="psm-header">
        <h1>Map Your Money Model</h1>
        <p>Drag your offers into the chain below to build your product suite</p>
      </div>

      {/* Pool section */}
      <div className="psm-pool">
        <div className="psm-pool-title">
          Your Offers
          <span className="psm-pool-count">{completedCount} of 4 assessed</span>
        </div>
        <div className="psm-pool-items">
          {OFFER_TYPES.map(ot => {
            const assessed = assessments[ot.key]
            const inChain = isInChain(ot.key)
            const className = [
              'psm-pool-item',
              `type-${ot.key}`,
              assessed ? 'completed' : 'incomplete',
              inChain ? 'in-chain' : '',
              openDropdown === ot.key ? 'dropdown-open' : ''
            ].filter(Boolean).join(' ')

            return (
              <div
                key={ot.key}
                className={className}
                draggable={assessed && !inChain}
                onDragStart={(e) => handlePoolDragStart(e, ot)}
                onDragEnd={handleDragEnd}
                onClick={() => assessed && !inChain && addToChain(ot)}
              >
                <div className="pool-item-header">
                  <span className="pool-item-emoji">{ot.emoji}</span>
                  <span className={`mm-flow-badge ${ot.cssClass}`}>{ot.label}</span>
                </div>
                {assessed ? (
                  <>
                    <div className="offer-name">{assessed.name}</div>
                    <div className="confidence">{Math.round(assessed.confidence * 100)}% match</div>
                    {allScores[ot.key]?.length > 1 && (
                      <div className="psm-change-wrap">
                        <button
                          className="psm-change-btn"
                          onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === ot.key ? null : ot.key) }}
                        >
                          Change &#9662;
                        </button>
                        {openDropdown === ot.key && (
                          <div className="psm-change-dropdown">
                            {allScores[ot.key].map(offer => (
                              <button
                                key={offer.id || offer.name}
                                className={`psm-dropdown-item${offer.name === assessed.name ? ' active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleChangeOffer(ot.key, offer) }}
                              >
                                <span className="psm-dropdown-name">{offer.name}</span>
                                <span className="psm-dropdown-score">{Math.round((offer.confidence || offer.score || 0) * 100)}%</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="not-assessed">Not yet assessed</div>
                    <a href={ot.route} className="assess-link">Take Assessment &rarr;</a>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Chain section */}
      <div className="psm-chain">
        <div className="psm-chain-title">
          {chain.length > 0 ? 'Your Money Model' : 'Build Your Money Model'}
        </div>

        {chain.length === 0 ? (
          <div
            className={`psm-chain-empty${chainDragOver ? ' drag-over' : ''}`}
            onDragOver={handleChainZoneDragOver}
            onDragLeave={handleChainZoneDragLeave}
            onDrop={handleChainZoneDrop}
          >
            {completedCount > 0
              ? 'Drag offers from above or click them to start building'
              : 'Complete your assessments above, then build your chain here'
            }
          </div>
        ) : (
          <div
            className="psm-chain-list"
            onDragOver={handleChainZoneDragOver}
            onDragLeave={handleChainZoneDragLeave}
            onDrop={handleChainZoneDrop}
          >
            {chain.map((item, idx) => (
              <div key={item.id || `${item.type}-${item.name}-${idx}`}>
                {idx > 0 && <div className="psm-chain-arrow">&darr;</div>}
                <div
                  className={`psm-chain-item${draggedIdx === idx ? ' dragging' : ''}${dragOverIdx === idx ? ' drag-over-item' : ''}`}
                  draggable
                  onDragStart={(e) => handleChainDragStart(e, idx)}
                  onDragOver={(e) => handleChainItemDragOver(e, idx)}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => handleChainItemDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle">&equiv;</span>
                  <span className={`mm-flow-badge ${getCssClass(item.type)}`}>
                    {getEmoji(item.type)} {getLabel(item.type)}
                  </span>
                  <div className="chain-item-info">
                    <div className="chain-item-name">{item.name}</div>
                    {item.confidence != null && !item.isCustom && (
                      <div className="chain-item-confidence">{Math.round(item.confidence * 100)}% match</div>
                    )}
                    {item.isCustom && (
                      <div className="chain-item-confidence" style={{ color: 'rgba(255,255,255,0.4)' }}>Custom step</div>
                    )}
                  </div>
                  <button className="remove-btn" onClick={() => removeFromChain(idx)} title="Remove">&times;</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add another offer or custom step */}
        <div className="psm-add-step">
          {!showAddAnother && !showCustomInput ? (
            <div className="psm-add-buttons">
              <button className="psm-add-step-btn" onClick={() => setShowAddAnother(true)}>
                + Add Another Offer
              </button>
              <button className="psm-add-step-btn secondary" onClick={() => setShowCustomInput(true)}>
                + Add Custom Step
              </button>
            </div>
          ) : showAddAnother ? (
            <div className="psm-add-another">
              {!addAnotherType ? (
                <>
                  <div className="psm-add-another-label">Which offer type?</div>
                  <div className="psm-add-another-types">
                    {OFFER_TYPES.filter(ot => assessments[ot.key]).map(ot => (
                      <button
                        key={ot.key}
                        className={`psm-type-btn type-${ot.key}`}
                        onClick={() => {
                          // If only one scored offer, add it directly
                          const scores = allScores[ot.key]
                          if (!scores || scores.length <= 1) {
                            addAnotherOffer(ot.key, assessments[ot.key])
                          } else {
                            setAddAnotherType(ot.key)
                          }
                        }}
                      >
                        {ot.emoji} {ot.label}
                      </button>
                    ))}
                  </div>
                  <button className="psm-add-cancel" onClick={() => setShowAddAnother(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="psm-add-another-label">Pick an offer</div>
                  <div className="psm-add-another-offers">
                    {(allScores[addAnotherType] || []).map(offer => (
                      <button
                        key={offer.id || offer.name}
                        className="psm-offer-pick"
                        onClick={() => addAnotherOffer(addAnotherType, offer)}
                      >
                        <span className="psm-offer-pick-name">{offer.name}</span>
                        <span className="psm-offer-pick-score">{Math.round((offer.confidence || offer.score || 0) * 100)}%</span>
                      </button>
                    ))}
                  </div>
                  <button className="psm-add-cancel" onClick={() => setAddAnotherType(null)}>Back</button>
                </>
              )}
            </div>
          ) : (
            <div className="psm-custom-input">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Step name..."
                onKeyDown={(e) => e.key === 'Enter' && addCustomStep()}
                autoFocus
              />
              <select value={customType} onChange={(e) => setCustomType(e.target.value)}>
                {OFFER_TYPES.map(ot => (
                  <option key={ot.key} value={ot.key}>{ot.emoji} {ot.label}</option>
                ))}
              </select>
              <button className="psm-add-confirm" onClick={addCustomStep}>Add</button>
              <button className="psm-add-cancel" onClick={() => { setShowCustomInput(false); setCustomName('') }}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="psm-submit">
        <button
          className="psm-submit-btn"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Saving...' : 'Save My Money Model'}
        </button>
        {!allAssessed && (
          <div className="psm-submit-hint">
            Complete all 4 assessments to save your money model
          </div>
        )}
        {allAssessed && !hasRealOffer && (
          <div className="psm-submit-hint">
            Add at least one assessment offer to your chain
          </div>
        )}
      </div>

      {/* Back link at bottom */}
      <div className="psm-bottom-nav">
        <button className="go-back-link" onClick={() => navigate('/7-day-challenge')}>
          &larr; Back to Challenge
        </button>
      </div>
    </div>
  )
}

export default ProductSuiteMapFlow
