/**
 * MoneyModelCard.jsx — Direction Card 5: How people earn from this
 *
 * Step 1: "Where are you?" — user picks their business stage
 * Step 2: Shows money models relevant to that stage with strategies
 *         Expandable to see the full growth path
 *
 * Deal sizes are domain-specific when possible (from experiencePricing.js),
 * averaged across the user's Vibe Rise dome experiences.
 * Falls back to universal pricing from moneyModelLadder.js.
 */

import { useState, useEffect } from 'react'
import { MONEY_MODEL_LADDER } from '../../data/moneyModelLadder'
import { BUSINESS_STAGES } from '../../data/businessStages'
import { EXPERIENCE_PRICING } from '../../data/experiencePricing'
import { getModelReadiness } from '../../data/domeBusinessModels'
import useSafetyDome from '../../hooks/useSafetyDome'
import { getDomeFuel } from '../../lib/directionEngine'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './MoneyModelCard.css'

// Build a lookup from model ID to ladder entry
const MODEL_MAP = {}
MONEY_MODEL_LADDER.forEach(m => { MODEL_MAP[m.id] = m })

// Try to get domain-specific deal size for a model level
function getDomainDealSize(pricingKey, modelId) {
  const entry = EXPERIENCE_PRICING[pricingKey]
  if (!entry) return null
  const fieldMap = {
    employed: 'employed',
    per_session: 'per_session',
    group_program: 'group_program',
    content: null, // Content is always $0
    digital_product: 'group_program', // Digital product pricing is similar to group
    membership: 'per_session', // Membership per-person is similar to session pricing
    certification: 'workshop_retreat',
  }
  const field = fieldMap[modelId]
  return field ? entry[field] : null
}

export default function MoneyModelCard({ userId, onComplete, onClose }) {
  const [stage, setStage] = useState(null) // business stage selection
  const [expanded, setExpanded] = useState(new Set())
  const [showFullPath, setShowFullPath] = useState(false)
  const [saving, setSaving] = useState(false)
  const [topExperiences, setTopExperiences] = useState([]) // labels of top dome experiences
  const dome = useSafetyDome(userId)

  // Load user's top Vibe Rise experiences for domain-specific pricing
  useEffect(() => {
    if (!userId) return
    supabase
      .from('experience_dome_ratings')
      .select('node_id')
      .eq('user_id', userId)
      .eq('ns_state', 'vibe_rise')
      .then(({ data }) => {
        if (!data?.length) return
        // Look up labels from experienceIndustryMap (imported inline to avoid circular)
        import('../../data/experienceIndustryMap.json').then(mod => {
          const map = (mod.default || mod)
          const nodes = map.nodes || map
          const labels = data
            .map(d => nodes[d.node_id]?.label)
            .filter(l => l && EXPERIENCE_PRICING[l])
          setTopExperiences([...new Set(labels)])
        }).catch(() => {})
      })
  }, [userId])

  const selectStage = (s) => {
    hapticLight()
    setStage(s)
    // Auto-expand first current model
    if (s.currentModels.length) {
      setExpanded(new Set([s.currentModels[0]]))
    }
  }

  const toggleModel = (modelId) => {
    hapticLight()
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) next.delete(modelId)
      else next.add(modelId)
      return next
    })
  }

  const handleDone = async () => {
    if (saving) return
    setSaving(true)
    hapticSuccess()

    await supabase.from('direction_reveals').upsert({
      user_id: userId,
      reveal_type: 'money_model',
      reveal_data: {
        stage: stage?.id,
        viewed_at: new Date().toISOString(),
      },
    }, { onConflict: 'user_id,reveal_type' })

    onComplete?.()
  }

  // Get deal size: try domain-specific first, fall back to universal
  const getDealSize = (modelId) => {
    if (topExperiences.length > 0) {
      // Try first matching experience
      for (const label of topExperiences) {
        const domain = getDomainDealSize(label, modelId)
        if (domain) return domain
      }
    }
    return MODEL_MAP[modelId]?.dealSize || ''
  }

  const renderModel = (modelId, type) => {
    const model = MODEL_MAP[modelId]
    if (!model) return null
    const isOpen = expanded.has(modelId)
    const dealSize = getDealSize(modelId)
    const { ready } = getModelReadiness(dome.domeEdges, modelId)

    return (
      <div key={modelId} className={`mmc-level ${isOpen ? 'open' : ''} ${type === 'next' ? 'mmc-next' : ''}`}>
        <button className="mmc-level-header" onClick={() => toggleModel(modelId)}>
          <span className="mmc-level-num">{type === 'next' ? '→' : model.level}</span>
          <div className="mmc-level-info">
            <span className="mmc-level-label">{model.icon} {model.label}</span>
            {ready && <span className="mmc-ready-badge">Ready ✓</span>}
            <span className="mmc-level-deal">{dealSize}</span>
          </div>
          <span className="mmc-level-chevron">{isOpen ? '▾' : '▸'}</span>
        </button>

        {isOpen && (
          <div className="mmc-level-body">
            <p className="mmc-level-desc">{model.description}</p>

            <div className="mmc-strategies">
              <div className="mmc-strategies-label">How to get there</div>
              {model.strategies.map((s, i) => (
                <div key={i} className="mmc-strategy">
                  <span className="mmc-strategy-dot">•</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className="mmc-courage">
              <span className="mmc-courage-icon">⚡</span>
              <span className="mmc-courage-text">{model.courageChallenge}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Step 1: Pick your stage ──
  if (!stage) {
    return (
      <div className="mmc-container">
        <button className="mmc-close" onClick={onClose}>&times;</button>

        <div className="mmc-header">
          <h2 className="mmc-title">Where are you right now?</h2>
          <p className="mmc-subtitle">Pick the stage that fits best. No wrong answer.</p>
        </div>

        <div className="mmc-stages">
          {BUSINESS_STAGES.map((s) => (
            <button key={s.id} className="mmc-stage-btn" onClick={() => selectStage(s)}>
              <span className="mmc-stage-icon">{s.icon}</span>
              <div className="mmc-stage-text">
                <span className="mmc-stage-label">{s.label}</span>
                <span className="mmc-stage-sub">{s.subtitle}</span>
              </div>
              <span className="mmc-stage-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Step 2: Show models for their stage ──
  const allModelIds = [...stage.currentModels, ...stage.nextModels]
  const remainingModels = MONEY_MODEL_LADDER.filter(m => !allModelIds.includes(m.id))

  return (
    <div className="mmc-container">
      <button className="mmc-close" onClick={onClose}>&times;</button>

      <div className="mmc-header">
        <button className="mmc-back" onClick={() => { setStage(null); setExpanded(new Set()); setShowFullPath(false) }}>
          ← Change stage
        </button>
        <div className="mmc-stage-badge">
          <span>{stage.icon}</span> {stage.label}
        </div>
        <h2 className="mmc-title">How to earn from what you love</h2>
      </div>

      {/* Current models */}
      {stage.currentModels.length > 0 && (
        <div className="mmc-section">
          <div className="mmc-section-label">Where you are now</div>
          <div className="mmc-ladder">
            {stage.currentModels.map(id => renderModel(id, 'current'))}
          </div>
        </div>
      )}

      {/* Next step */}
      {stage.nextModels.length > 0 && (
        <div className="mmc-section">
          <div className="mmc-section-label">Your next step: {stage.nextPrompt}</div>
          <div className="mmc-ladder">
            {stage.nextModels.map(id => renderModel(id, 'next'))}
          </div>
        </div>
      )}

      {/* Show full path toggle */}
      {remainingModels.length > 0 && (
        <>
          <button
            className="mmc-fullpath-toggle"
            onClick={() => { hapticLight(); setShowFullPath(!showFullPath) }}
          >
            {showFullPath ? 'Hide full growth path ▴' : 'See full growth path ▾'}
          </button>

          {showFullPath && (
            <div className="mmc-section">
              <div className="mmc-section-label">The full path</div>
              <div className="mmc-ladder">
                {remainingModels.map(m => renderModel(m.id, 'future'))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mmc-fixed">
        <button className="mmc-cta" onClick={handleDone} disabled={saving}>
          {saving ? 'Saving...' : 'Got it'}
        </button>
      </div>
    </div>
  )
}
