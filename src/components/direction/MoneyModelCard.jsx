/**
 * MoneyModelCard.jsx — Direction Card 5: How people earn from this
 *
 * Step 1: "Where are you?" — user picks their business stage
 * Step 2: Shows money models relevant to that stage with strategies
 *         + personalised revenue model insights from dome data
 *         Expandable to see the full growth path
 *
 * Revenue model tags from experienceRevenueModels.js drive personalisation.
 * Content multiplier + consumer-primary logic shows contextual insights.
 */

import { useState, useEffect } from 'react'
import { MONEY_MODEL_LADDER } from '../../data/moneyModelLadder'
import { BUSINESS_STAGES } from '../../data/businessStages'
import { EXPERIENCE_PRICING } from '../../data/experiencePricing'
import {
  EXPERIENCE_REVENUE_MODELS,
  REVENUE_MODEL_META,
  CONTENT_MULTIPLIER_EXPERIENCES,
  CONSUMER_PRIMARY_EXPERIENCES,
} from '../../data/experienceRevenueModels'
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
    content: null,
    digital_product: 'group_program',
    membership: 'per_session',
    certification: 'workshop_retreat',
  }
  const field = fieldMap[modelId]
  return field ? entry[field] : null
}

export default function MoneyModelCard({ userId, onComplete, onClose }) {
  const [stage, setStage] = useState(null)
  const [expanded, setExpanded] = useState(new Set())
  const [showFullPath, setShowFullPath] = useState(false)
  const [saving, setSaving] = useState(false)
  const [topExperiences, setTopExperiences] = useState([])
  const [revenueInsights, setRevenueInsights] = useState(null)

  // Load user's Vibe Rise dome experiences + derive revenue insights
  useEffect(() => {
    if (!userId) return

    async function loadDomeData() {
      const { data } = await supabase
        .from('experience_dome_ratings')
        .select('node_id, ns_state')
        .eq('user_id', userId)

      if (!data?.length) return

      // Build label lookup from all sources
      let nodeLabels
      try {
        const [indMod, configMod] = await Promise.all([
          import('../../data/experienceIndustryMap.json'),
          import('../../lib/experienceDomeConfig.js'),
        ])
        const indNodes = (indMod.default || indMod).nodes || (indMod.default || indMod)
        const getLabel = configMod.getExperienceLabel
        const virtualNodes = configMod.VIRTUAL_EXPERIENCE_NODES || []

        // Build virtual node label lookup (exp-surfing → 'Surfing')
        const virtualLabels = {}
        virtualNodes.forEach(n => { if (n.id && n.label) virtualLabels[n.id] = n.label })

        nodeLabels = {}
        data.forEach(d => {
          const label = getLabel?.(d.node_id, indNodes[d.node_id]?.label)
            || virtualLabels[d.node_id]
            || indNodes[d.node_id]?.label
          if (label) nodeLabels[d.node_id] = label
        })
      } catch {
        return
      }

      // Get Vibe Rise experience labels
      const vibeRiseLabels = data
        .filter(d => d.ns_state === 'vibe_rise')
        .map(d => nodeLabels[d.node_id])
        .filter(Boolean)

      // Domain-specific pricing labels
      const pricingLabels = vibeRiseLabels.filter(l => EXPERIENCE_PRICING[l])
      setTopExperiences([...new Set(pricingLabels)])

      // Revenue model tag aggregation
      const tagCounts = {}
      vibeRiseLabels.forEach(label => {
        const tags = EXPERIENCE_REVENUE_MODELS[label]
        if (tags) tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
      })

      // Sort by frequency
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([tag, count]) => ({ tag, count, ...REVENUE_MODEL_META[tag] }))

      // Content multiplier check
      const hasContentMultiplier = vibeRiseLabels.some(l =>
        CONTENT_MULTIPLIER_EXPERIENCES.includes(l)
      )
      const contentExperiences = vibeRiseLabels.filter(l =>
        CONTENT_MULTIPLIER_EXPERIENCES.includes(l)
      )

      // Consumer-primary check
      const consumerCount = vibeRiseLabels.filter(l =>
        CONSUMER_PRIMARY_EXPERIENCES.includes(l)
      ).length
      const isConsumerHeavy = consumerCount > vibeRiseLabels.length * 0.5

      setRevenueInsights({
        topTags,
        hasContentMultiplier,
        contentExperiences,
        isConsumerHeavy,
        consumerCount,
        totalVibeRise: vibeRiseLabels.length,
      })
    }

    loadDomeData()
  }, [userId])

  const selectStage = (s) => {
    hapticLight()
    setStage(s)
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
        topTags: revenueInsights?.topTags?.map(t => t.tag) || [],
        hasContentMultiplier: revenueInsights?.hasContentMultiplier || false,
        viewed_at: new Date().toISOString(),
      },
    }, { onConflict: 'user_id,reveal_type' })

    onComplete?.()
  }

  // Get deal size: try domain-specific first, fall back to universal
  const getDealSize = (modelId) => {
    if (topExperiences.length > 0) {
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

    return (
      <div key={modelId} className={`mmc-level ${isOpen ? 'open' : ''} ${type === 'next' ? 'mmc-next' : ''}`}>
        <button className="mmc-level-header" onClick={() => toggleModel(modelId)}>
          <span className="mmc-level-num">{type === 'next' ? '→' : model.level}</span>
          <div className="mmc-level-info">
            <span className="mmc-level-label">{model.icon} {model.label}</span>
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

        {/* Revenue model insights from dome */}
        {revenueInsights?.topTags?.length > 0 && (
          <div className="mmc-insights">
            <div className="mmc-insights-label">Based on what you love, your top money paths are</div>
            <div className="mmc-insights-tags">
              {revenueInsights.topTags.map(t => (
                <span key={t.tag} className="mmc-insight-tag">
                  {t.icon} {t.label}
                </span>
              ))}
            </div>

            {revenueInsights.hasContentMultiplier && (
              <div className="mmc-insight-content">
                You also love making content. That means everything you do can also earn through brand deals and sponsorships.
              </div>
            )}

            {revenueInsights.isConsumerHeavy && !revenueInsights.hasContentMultiplier && (
              <div className="mmc-insight-consumer">
                The experiences you love are things you enjoy doing. To earn from them, you'd curate events, build communities, or make content about them.
              </div>
            )}
          </div>
        )}

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

      {/* Content multiplier insight */}
      {revenueInsights?.hasContentMultiplier && (
        <div className="mmc-insight-content mmc-insight-inline">
          📢 You love {revenueInsights.contentExperiences.slice(0, 2).join(' and ').toLowerCase()}. Brand deals and sponsorships are available at every stage.
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
