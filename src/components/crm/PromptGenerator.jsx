/**
 * PromptGenerator - AI Prompt Generation Modal
 *
 * Modal interface for generating copy prompts that users can paste into
 * their preferred AI tool (ChatGPT, Claude, etc.)
 *
 * Features:
 * - Shows data completeness from challenge flows
 * - Generates personalized prompts using user data
 * - Copy-to-clipboard functionality
 * - Links to complete missing data
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { gatherContentContext } from '../../lib/contentContext'
import { fetchAllChallengeData, getChallengeCompleteness } from '../../lib/crm/challengeDataService'
import { PROMPT_TEMPLATES, checkTemplateReadiness } from '../../lib/crm/promptTemplates'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './PromptGenerator.css'

// Data source labels and routes
const DATA_SOURCES = {
  persona: { label: 'FlowFinder (Skills/Persona)', route: '/nikigai/skills', icon: '🎯' },
  offer: { label: 'Offer Stack Builder', route: '/offer-stack-builder', icon: '💼' },
  validation: { label: 'Validation Insights', route: '/validation-flows', icon: '✅' },
  voice: { label: 'Voice Profile', route: '/voice-training', icon: '🎙️' },
  proof: { label: 'Grand Slam Evaluation', route: '/grand-slam-matrix', icon: '🏆' },
  launch: { label: 'Launch Readiness', route: '/launch-readiness', icon: '🚀' }
}

export default function PromptGenerator({ isOpen, onClose, defaultTemplate = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate || 'landingPage')
  const [additionalContext, setAdditionalContext] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  // Data state
  const [contentData, setContentData] = useState(null)
  const [challengeData, setChallengeData] = useState(null)
  const [completeness, setCompleteness] = useState(null)

  // Load all user data
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [content, challenge, complete] = await Promise.all([
        gatherContentContext(user.id),
        fetchAllChallengeData(user.id),
        getChallengeCompleteness(user.id)
      ])

      setContentData(content)
      setChallengeData(challenge)
      setCompleteness(complete)
    } catch (err) {
      console.error('Error loading prompt data:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isOpen && user?.id) {
      loadData()
    }
  }, [isOpen, user?.id, loadData])

  // Reset state when template changes
  useEffect(() => {
    setGeneratedPrompt('')
    setCopied(false)
  }, [selectedTemplate])

  // Combine data sources for template
  const getCombinedData = () => {
    return {
      // From contentContext
      persona: contentData?.persona,
      voice: contentData?.voice,

      // From challengeData (prefer this for offer/validation/proof/launch)
      offer: challengeData?.offer || contentData?.offer,
      validation: challengeData?.validation || contentData?.validation,
      proof: challengeData?.proof,
      launch: challengeData?.launch,

      // Additional context
      products: challengeData?.products,
      psychological: challengeData?.psychological
    }
  }

  // Check what data is available
  const getAvailableData = () => {
    const data = getCombinedData()
    return {
      persona: !!data.persona,
      offer: !!data.offer?.name || !!data.offer?.dreamOutcome || !!data.offer?.leadMagnet,
      validation: !!data.validation?.painPoints?.length || !!data.validation?.objections?.length,
      voice: !!data.voice?.voice_summary || !!data.voice?.origin_story,
      proof: !!data.proof?.stack || !!data.proof?.score,
      launch: !!data.launch?.pricing || !!data.launch?.approach
    }
  }

  // Generate the prompt
  const handleGenerate = async () => {
    const template = PROMPT_TEMPLATES[selectedTemplate]
    if (!template) return

    setGenerating(true)
    hapticLight()

    try {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 300))

      const combinedData = getCombinedData()
      const prompt = template.generator(combinedData, additionalContext)
      setGeneratedPrompt(prompt)
      hapticMedium()
    } catch (err) {
      console.error('Error generating prompt:', err)
    } finally {
      setGenerating(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    if (!generatedPrompt) return

    try {
      await navigator.clipboard.writeText(generatedPrompt)
      setCopied(true)
      hapticMedium()

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Navigate to complete missing data
  const handleCompleteData = (dataKey) => {
    const source = DATA_SOURCES[dataKey]
    if (source?.route) {
      onClose()
      navigate(source.route)
    }
  }

  if (!isOpen) return null

  const template = PROMPT_TEMPLATES[selectedTemplate]
  const availableData = getAvailableData()
  const readiness = checkTemplateReadiness(selectedTemplate, availableData)

  return (
    <div className="prompt-generator-overlay" onClick={onClose}>
      <div className="prompt-generator-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="pg-header">
          <h2>Generate AI Prompt</h2>
          <button className="pg-close" onClick={onClose} aria-label="Close">
            <span>×</span>
          </button>
        </header>

        {loading ? (
          <div className="pg-loading">
            <div className="pg-spinner" />
            <p>Loading your data...</p>
          </div>
        ) : (
          <div className="pg-content">
            {/* Template Selection */}
            <section className="pg-section">
              <label className="pg-label">What do you want to create?</label>
              <div className="pg-template-grid">
                {Object.values(PROMPT_TEMPLATES).map(t => (
                  <button
                    key={t.id}
                    className={`pg-template-card ${selectedTemplate === t.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTemplate(t.id)
                      hapticLight()
                    }}
                  >
                    <span className="pg-template-icon">{t.icon}</span>
                    <span className="pg-template-name">{t.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Data Completeness */}
            <section className="pg-section">
              <label className="pg-label">
                Data we'll use
                <span className="pg-completeness-badge" data-level={
                  readiness.completeness >= 80 ? 'high' :
                    readiness.completeness >= 50 ? 'medium' : 'low'
                }>
                  {readiness.completeness}% complete
                </span>
              </label>

              <div className="pg-data-list">
                {/* Required data */}
                {template.requiredData.map(key => {
                  const source = DATA_SOURCES[key]
                  const hasData = availableData[key]
                  return (
                    <div key={key} className={`pg-data-item ${hasData ? 'available' : 'missing'}`}>
                      <span className="pg-data-status">
                        {hasData ? '✅' : '⚠️'}
                      </span>
                      <span className="pg-data-icon">{source?.icon}</span>
                      <span className="pg-data-label">
                        {source?.label}
                        <span className="pg-data-tag required">Required</span>
                      </span>
                      {!hasData && (
                        <button
                          className="pg-data-action"
                          onClick={() => handleCompleteData(key)}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Recommended data */}
                {template.recommendedData.map(key => {
                  const source = DATA_SOURCES[key]
                  const hasData = availableData[key]
                  return (
                    <div key={key} className={`pg-data-item ${hasData ? 'available' : 'optional'}`}>
                      <span className="pg-data-status">
                        {hasData ? '✅' : '○'}
                      </span>
                      <span className="pg-data-icon">{source?.icon}</span>
                      <span className="pg-data-label">
                        {source?.label}
                        <span className="pg-data-tag optional">Optional</span>
                      </span>
                      {!hasData && (
                        <button
                          className="pg-data-action secondary"
                          onClick={() => handleCompleteData(key)}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Additional Context */}
            <section className="pg-section">
              <label className="pg-label" htmlFor="additional-context">
                Additional context (optional)
              </label>
              <textarea
                id="additional-context"
                className="pg-textarea"
                placeholder="Add any specific details, focus areas, or constraints..."
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                rows={3}
              />
            </section>

            {/* Generate Button */}
            <div className="pg-actions">
              <button
                className="pg-generate-btn"
                onClick={handleGenerate}
                disabled={generating || !readiness.ready}
              >
                {generating ? (
                  <>
                    <span className="pg-btn-spinner" />
                    Generating...
                  </>
                ) : (
                  <>Generate Prompt</>
                )}
              </button>

              {!readiness.ready && (
                <p className="pg-warning">
                  Complete the required data above to generate this prompt
                </p>
              )}
            </div>

            {/* Generated Prompt Output */}
            {generatedPrompt && (
              <section className="pg-section pg-output">
                <div className="pg-output-header">
                  <label className="pg-label">Your Prompt</label>
                  <button
                    className={`pg-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>✓ Copied!</>
                    ) : (
                      <>📋 Copy to Clipboard</>
                    )}
                  </button>
                </div>

                <div className="pg-prompt-output">
                  <pre>{generatedPrompt}</pre>
                </div>

                <p className="pg-instructions">
                  Copy this prompt and paste it into ChatGPT, Claude, or your preferred AI tool.
                </p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook to use PromptGenerator easily from any component
 */
export function usePromptGenerator() {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultTemplate, setDefaultTemplate] = useState(null)

  const open = (template = null) => {
    setDefaultTemplate(template)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setDefaultTemplate(null)
  }

  const PromptGeneratorModal = () => (
    <PromptGenerator
      isOpen={isOpen}
      onClose={close}
      defaultTemplate={defaultTemplate}
    />
  )

  return {
    open,
    close,
    isOpen,
    PromptGeneratorModal
  }
}
