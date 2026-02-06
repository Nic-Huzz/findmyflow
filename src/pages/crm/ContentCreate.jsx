/**
 * ContentCreate.jsx
 * Landing page for triggered content generation
 * Receives context from recommendations/triggers and opens Content Generator
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { parseContentTriggerParams, CONTENT_TRIGGERS } from '../../lib/crm/contentTriggers'
import ContentGenerator from '../../components/crm/ContentGenerator'
import './ContentCreate.css'

export default function ContentCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [triggerConfig, setTriggerConfig] = useState(null)
  const [showGenerator, setShowGenerator] = useState(false)

  useEffect(() => {
    // Parse URL params to get trigger configuration
    const config = parseContentTriggerParams(searchParams)
    if (config.triggerId) {
      setTriggerConfig(config)
      // Auto-open generator after brief delay to show context
      setTimeout(() => setShowGenerator(true), 500)
    }
  }, [searchParams])

  function handleContentGenerated(content) {
    // Content was generated and user clicked "Use This"
    // Could save to content_history here or navigate away
    console.log('Content generated:', content)
    navigate('/crm/marketing')
  }

  // No trigger - show trigger selection
  if (!triggerConfig?.triggerId) {
    return (
      <div className="content-create">
        {/* Top Toolbar */}
        <div className="cc-toolbar">
          <button className="cc-toolbar-back" onClick={() => navigate('/crm/attract')}>
            ←
          </button>
          <h2 className="cc-toolbar-title">Create Content</h2>
          <span className="cc-toolbar-icon">✨</span>
        </div>

        <header className="cc-header">
          <div className="header-content">
            <h1>Create Content</h1>
            <p>Choose what type of content to create</p>
          </div>
        </header>

        <div className="cc-trigger-grid">
          {Object.values(CONTENT_TRIGGERS).filter(t => t.contentConfig).map(trigger => (
            <button
              key={trigger.id}
              className="cc-trigger-card"
              onClick={() => {
                const params = new URLSearchParams({
                  trigger: trigger.id,
                  type: trigger.contentConfig.type,
                  platform: trigger.contentConfig.platform,
                })
                navigate(`/crm/content-create?${params.toString()}`)
              }}
            >
              <span className="cc-trigger-category">{trigger.category}</span>
              <h3>{trigger.name}</h3>
              <p>{trigger.description}</p>
              <span className="cc-trigger-action">{trigger.actionText} →</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const trigger = triggerConfig.trigger

  return (
    <div className="content-create">
      {/* Top Toolbar */}
      <div className="cc-toolbar">
        <button className="cc-toolbar-back" onClick={() => navigate('/crm/attract')}>
          ←
        </button>
        <h2 className="cc-toolbar-title">Create Content</h2>
        <span className="cc-toolbar-icon">✨</span>
      </div>

      <header className="cc-header">
        <div className="header-content">
          <h1>Create Content</h1>
          <p>AI-powered content from your recommendation</p>
        </div>
      </header>

      {/* Trigger Context Banner */}
      <div className="cc-trigger-banner">
        <div className="cc-trigger-info">
          <span className="cc-trigger-badge">{trigger?.category || 'Content'}</span>
          <h2>{trigger?.name || 'Custom Content'}</h2>
          <p>{trigger?.description}</p>
        </div>

        {triggerConfig.triggerContext && Object.keys(triggerConfig.triggerContext).length > 0 && (
          <div className="cc-trigger-context">
            <span className="context-label">Based on your data:</span>
            <div className="context-chips">
              {triggerConfig.triggerContext.count && (
                <span className="context-chip">{triggerConfig.triggerContext.count} occurrences</span>
              )}
              {triggerConfig.triggerContext.rate !== undefined && (
                <span className="context-chip">{triggerConfig.triggerContext.rate}% conversion</span>
              )}
              {triggerConfig.triggerContext.competitor && (
                <span className="context-chip">vs {triggerConfig.triggerContext.competitor}</span>
              )}
              {triggerConfig.triggerContext.utilization && (
                <span className="context-chip">{triggerConfig.triggerContext.utilization}% capacity</span>
              )}
              {triggerConfig.triggerContext.wins && (
                <span className="context-chip">{triggerConfig.triggerContext.wins} recent wins</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pre-filled Instructions Preview */}
      <div className="cc-instructions-preview">
        <h3>AI Instructions</h3>
        <p className="cc-instructions-hint">
          The Content Generator will use these instructions based on your trigger:
        </p>
        <div className="cc-instructions-box">
          {triggerConfig.instructions}
        </div>
      </div>

      {/* Content Generator Embedded */}
      <div className="cc-generator-wrapper">
        {showGenerator ? (
          <ContentGeneratorWithContext
            userId={user?.id}
            initialType={triggerConfig.type}
            initialPlatform={triggerConfig.platform}
            initialInstructions={triggerConfig.instructions}
            onContentGenerated={handleContentGenerated}
          />
        ) : (
          <div className="cc-loading">
            <div className="cc-spinner"></div>
            <p>Preparing AI Content Generator...</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Wrapper that opens ContentGenerator with pre-filled values
 * This is a workaround since ContentGenerator uses internal state
 */
function ContentGeneratorWithContext({
  userId,
  initialType,
  initialPlatform,
  initialInstructions,
  onContentGenerated,
}) {
  const [key, setKey] = useState(0)

  // Force re-render when params change
  useEffect(() => {
    setKey(k => k + 1)
  }, [initialType, initialPlatform, initialInstructions])

  return (
    <div className="cc-generator-embedded" key={key}>
      <ContentGeneratorInline
        userId={userId}
        initialType={initialType}
        initialPlatform={initialPlatform}
        initialInstructions={initialInstructions}
        onContentGenerated={onContentGenerated}
      />
    </div>
  )
}

/**
 * Inline version of ContentGenerator (always visible, no trigger button)
 * This is a simplified version for the triggered flow
 */
import { useState as useStateInline, useEffect as useEffectInline, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { gatherContentContext, getContextCompleteness, buildContextString } from '../../lib/contentContext'
import { fetchVoiceProfile, buildVoiceInstructions, getVoiceProfileSummary, getVoiceFeedbackInsights, buildEnhancedVoiceInstructions } from '../../lib/voiceProfile'

const CONTENT_TYPES = [
  { id: 'transformation_story', name: 'Transformation Story', icon: '🦋', desc: 'Before/after narrative' },
  { id: 'educational', name: 'Educational Post', icon: '📚', desc: 'Teach something valuable' },
  { id: 'pain_agitation', name: 'Pain Agitation', icon: '🎯', desc: 'Surface the problem' },
  { id: 'social_proof', name: 'Social Proof', icon: '⭐', desc: 'Showcase wins' },
  { id: 'offer_teaser', name: 'Offer Teaser', icon: '🎁', desc: 'Create curiosity' }
]

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', limit: 2200, optimal: 150 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', limit: 3000, optimal: 1300 },
  { id: 'twitter', name: 'X/Twitter', icon: '🐦', limit: 280, optimal: 240 },
  { id: 'email', name: 'Email', icon: '📧', limit: null, optimal: 500 },
  { id: 'facebook', name: 'Facebook', icon: '👥', limit: 63206, optimal: 400 }
]

const REFINEMENTS = [
  { id: 'shorter', label: 'Make Shorter', icon: '✂️' },
  { id: 'longer', label: 'Add More Detail', icon: '📝' },
  { id: 'professional', label: 'More Professional', icon: '👔' },
  { id: 'casual', label: 'More Casual', icon: '😊' },
  { id: 'urgency', label: 'Add Urgency', icon: '⚡' },
  { id: 'storytelling', label: 'More Storytelling', icon: '📖' }
]

function ContentGeneratorInline({
  userId,
  initialType,
  initialPlatform,
  initialInstructions,
  onContentGenerated,
}) {
  const navigate = useNavigate()
  const [loading, setLoading] = useStateInline(false)
  const [contextLoading, setContextLoading] = useStateInline(false)
  const [context, setContext] = useStateInline(null)
  const [completeness, setCompleteness] = useStateInline(null)
  const [voiceProfile, setVoiceProfile] = useStateInline(null)
  const [voiceFeedbackInsights, setVoiceFeedbackInsights] = useStateInline(null)
  const [selectedType, setSelectedType] = useStateInline(initialType || 'transformation_story')
  const [selectedPlatform, setSelectedPlatform] = useStateInline(initialPlatform || 'linkedin')
  const [additionalInstructions, setAdditionalInstructions] = useStateInline(initialInstructions || '')
  const [generatedContent, setGeneratedContent] = useStateInline(null)
  const [editedContent, setEditedContent] = useStateInline('')
  const [error, setError] = useStateInline(null)
  const [copied, setCopied] = useStateInline(false)
  const [refining, setRefining] = useStateInline(false)

  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform)
  const charCount = editedContent.length
  const isOverLimit = currentPlatform?.limit && charCount > currentPlatform.limit

  useEffectInline(() => {
    if (userId) {
      loadContext()
    }
  }, [userId])

  async function loadContext() {
    setContextLoading(true)
    try {
      const [ctx, voiceResult, feedbackInsights] = await Promise.all([
        gatherContentContext(userId),
        fetchVoiceProfile(userId),
        getVoiceFeedbackInsights(userId)
      ])

      setContext(ctx)
      setCompleteness(getContextCompleteness(ctx))

      if (voiceResult.data) {
        setVoiceProfile(voiceResult.data)
      }
      if (feedbackInsights) {
        setVoiceFeedbackInsights(feedbackInsights)
      }
    } catch (err) {
      console.error('Error loading context:', err)
    } finally {
      setContextLoading(false)
    }
  }

  async function handleGenerate(refinement = null) {
    if (refinement) {
      setRefining(true)
    } else {
      setLoading(true)
      setGeneratedContent(null)
    }
    setError(null)

    try {
      const voiceInstructions = voiceProfile
        ? buildEnhancedVoiceInstructions(voiceProfile, voiceFeedbackInsights)
        : ''

      let instructions = additionalInstructions

      if (refinement && editedContent) {
        const refinementMap = {
          shorter: 'Make this content significantly shorter and more concise while keeping the key message.',
          longer: 'Expand this content with more detail, examples, and depth.',
          professional: 'Rewrite this in a more professional, business-appropriate tone.',
          casual: 'Rewrite this in a more casual, friendly, conversational tone.',
          urgency: 'Add more urgency and FOMO (fear of missing out) to encourage immediate action.',
          storytelling: 'Reframe this with more storytelling elements - setup, conflict, resolution.'
        }
        instructions = `${voiceInstructions}\n${refinementMap[refinement]}\n\nOriginal content to refine:\n${editedContent}`
      } else {
        instructions = `${voiceInstructions}\n${additionalInstructions}`.trim()
      }

      const response = await supabase.functions.invoke('content-generator', {
        body: {
          action: 'generate',
          contentType: selectedType,
          platform: selectedPlatform,
          context: context || {},
          additionalInstructions: instructions,
          voiceProfile: voiceProfile || null
        }
      })

      if (response.error) throw response.error

      setGeneratedContent(response.data)
      setEditedContent(response.data.content || '')
    } catch (err) {
      console.error('Error generating content:', err)
      setError('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
      setRefining(false)
    }
  }

  async function handleCopy() {
    if (editedContent) {
      await navigator.clipboard.writeText(editedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleUseContent() {
    if (onContentGenerated && generatedContent) {
      onContentGenerated({ ...generatedContent, content: editedContent })
    }
  }

  return (
    <div className="cc-inline-generator">
      {contextLoading ? (
        <div className="cc-context-loading">
          <div className="cc-spinner"></div>
          <span>Loading your profile data...</span>
        </div>
      ) : (
        <>
          {/* Type & Platform Selection */}
          {!generatedContent && (
            <>
              <div className="cc-section">
                <h3>Content Type</h3>
                <div className="cc-type-grid">
                  {CONTENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      className={`cc-type-btn ${selectedType === type.id ? 'selected' : ''}`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <span className="type-icon">{type.icon}</span>
                      <span className="type-name">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="cc-section">
                <h3>Platform</h3>
                <div className="cc-platform-grid">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      className={`cc-platform-btn ${selectedPlatform === platform.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPlatform(platform.id)}
                    >
                      <span className="platform-icon">{platform.icon}</span>
                      <span className="platform-name">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="cc-section">
                <h3>Additional Instructions</h3>
                <textarea
                  className="cc-instructions-textarea"
                  value={additionalInstructions}
                  onChange={e => setAdditionalInstructions(e.target.value)}
                  rows={6}
                  placeholder="The AI will use these instructions along with your profile data..."
                />
              </div>

              {error && <div className="cc-error">{error}</div>}

              <button
                className="cc-generate-btn"
                onClick={() => handleGenerate()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="cc-spinner small"></span>
                    Generating...
                  </>
                ) : (
                  '✨ Generate Content'
                )}
              </button>
            </>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <div className="cc-result">
              <div className="cc-result-header">
                <span className="result-type">
                  {CONTENT_TYPES.find(t => t.id === selectedType)?.icon}
                  {CONTENT_TYPES.find(t => t.id === selectedType)?.name}
                </span>
                <span className="result-platform">
                  {currentPlatform?.icon} {currentPlatform?.name}
                </span>
              </div>

              <textarea
                className="cc-content-editable"
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
              />

              <div className={`cc-char-counter ${isOverLimit ? 'over-limit' : ''}`}>
                {charCount.toLocaleString()}
                {currentPlatform?.limit && ` / ${currentPlatform.limit.toLocaleString()}`}
                {isOverLimit && <span className="limit-warning"> Over limit!</span>}
              </div>

              {/* Refinements */}
              <div className="cc-refinements">
                <span className="refinement-label">Refine:</span>
                {REFINEMENTS.map(ref => (
                  <button
                    key={ref.id}
                    className="refinement-btn"
                    onClick={() => handleGenerate(ref.id)}
                    disabled={refining || loading}
                    title={ref.label}
                  >
                    {ref.icon}
                  </button>
                ))}
                {refining && <span className="refining-indicator">Refining...</span>}
              </div>

              {error && <div className="cc-error">{error}</div>}

              <div className="cc-result-actions">
                <button className="cc-action-btn copy" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button
                  className="cc-action-btn regenerate"
                  onClick={() => handleGenerate()}
                  disabled={loading || refining}
                >
                  🔄 New Version
                </button>
                <button className="cc-action-btn use" onClick={handleUseContent}>
                  ✅ Use This
                </button>
                <button
                  className="cc-action-btn new"
                  onClick={() => {
                    setGeneratedContent(null)
                    setEditedContent('')
                  }}
                >
                  ← Start Over
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
