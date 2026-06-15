/**
 * TemplateSelector.jsx — AI template cards inside pipeline node detail
 *
 * Shows available templates for the current node. "Generate" fires
 * useTemplateGenerator, results show as copy-paste blocks with voice rating.
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getTemplatesForNode } from '../../lib/experienceTemplates'
import useTemplateGenerator from '../../hooks/useTemplateGenerator'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

export default function TemplateSelector({ nodeKey, experienceId, experience, userId }) {
  const templates = getTemplatesForNode(nodeKey)
  const { generate, generating, progress, results, error, clear } = useTemplateGenerator(userId)
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [ratings, setRatings] = useState({})

  if (templates.length === 0) return null

  const handleGenerate = async (templateId) => {
    hapticLight()
    setActiveTemplateId(templateId)
    setCopiedIndex(null)
    setRatings({})
    await generate(templateId, experienceId)
  }

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content).catch(() => {})
    setCopiedIndex(index)
    hapticSuccess()
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleVoiceRating = async (index, isPositive) => {
    hapticLight()
    setRatings(prev => ({ ...prev, [index]: isPositive ? 'positive' : 'negative' }))
    try {
      await supabase.from('voice_feedback').insert({
        user_id: userId,
        content_type: activeTemplateId,
        platform: results?.[index]?.platform || 'template',
        generated_content: results?.[index]?.content?.slice(0, 500) || '',
        feedback_options: isPositive ? ['sounds_like_me'] : ['doesnt_sound_like_me'],
        feedback_comment: `Template: ${activeTemplateId}, Item: ${results?.[index]?.label}`,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Voice feedback save failed:', err.message)
    }
  }

  const handleBack = () => {
    clear()
    setActiveTemplateId(null)
  }

  // ── Results view ──
  if (results && activeTemplateId) {
    return (
      <div className="pl-tpl-results">
        <div className="pl-tpl-results-header">
          <button className="pl-tpl-back" onClick={handleBack}>← Templates</button>
        </div>
        {results.map((result, i) => (
          <div key={i} className="pl-tpl-block">
            <div className="pl-tpl-block-header">
              <div className="pl-tpl-block-label">{result.label}</div>
              <button
                className={`pl-tpl-copy${copiedIndex === i ? ' copied' : ''}`}
                onClick={() => handleCopy(result.content, i)}
              >
                {copiedIndex === i ? 'Copied' : 'Copy'}
              </button>
            </div>
            {result.error ? (
              <div className="pl-tpl-block-error">Failed to generate. Try again.</div>
            ) : (
              <div className="pl-tpl-block-content">{result.content}</div>
            )}
            {!result.error && (
              <div className="pl-tpl-rating">
                <button
                  className={`pl-tpl-rate${ratings[i] === 'positive' ? ' active' : ''}`}
                  onClick={() => handleVoiceRating(i, true)}
                  disabled={!!ratings[i]}
                >
                  Sounds like me
                </button>
                <button
                  className={`pl-tpl-rate neg${ratings[i] === 'negative' ? ' active' : ''}`}
                  onClick={() => handleVoiceRating(i, false)}
                  disabled={!!ratings[i]}
                >
                  Doesn't sound like me
                </button>
              </div>
            )}
          </div>
        ))}
        <button className="pl-tpl-regen" onClick={() => handleGenerate(activeTemplateId)} disabled={generating}>
          {generating ? progress : 'Regenerate'}
        </button>
      </div>
    )
  }

  // ── Generating view ──
  if (generating) {
    return (
      <div className="pl-tpl-generating">
        <div className="pl-tpl-spinner" />
        <div className="pl-tpl-progress">{progress}</div>
      </div>
    )
  }

  // ── Template cards ──
  return (
    <div className="pl-tpl-section">
      <div className="pl-tpl-heading">Templates</div>
      {error && <div className="pl-tpl-error">{error}</div>}
      {templates.map(tpl => (
        <div key={tpl.id} className="pl-tpl-card" onClick={() => handleGenerate(tpl.id)}>
          <div className="pl-tpl-icon">{tpl.icon}</div>
          <div className="pl-tpl-info">
            <div className="pl-tpl-name">{tpl.name}</div>
            <div className="pl-tpl-desc">{tpl.description}</div>
          </div>
          <div className="pl-tpl-go">Generate</div>
        </div>
      ))}
    </div>
  )
}
