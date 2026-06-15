/**
 * MetricInputSheet.jsx — Bottom sheet for logging pipeline metrics
 *
 * Adapts per node:
 *   Attract: method picker (Content, Warm, Cold, Paid, Affiliates) → method-specific fields
 *   Content + Warm: screenshot upload option that auto-fills fields via AI
 *   Capture: clicks/signups count
 *   Convert: tickets sold + revenue
 *   Deliver: showed up count
 *
 * CSS prefix: mis-
 */

import { useState, useRef } from 'react'
import { savePipelineMetric } from '../../hooks/useExperiencePipeline'
import { analyzeMetricsScreenshot, analyzeLeadsScreenshot } from '../../lib/screenshotAnalysis'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './MetricInputSheet.css'

const ATTRACT_METHODS = [
  { id: 'content', label: 'Content', icon: '📱', hasScreenshot: true, fields: [
    { key: 'posts', label: 'Posts made', type: 'number' },
    { key: 'reach', label: 'Reach / impressions', type: 'number' },
  ]},
  { id: 'warm', label: 'Warm Outreach', icon: '☀️', hasScreenshot: true, fields: [
    { key: 'dms_sent', label: 'DMs sent', type: 'number' },
    { key: 'replies', label: 'Replies received', type: 'number' },
  ]},
  { id: 'cold', label: 'Cold Outreach', icon: '❄️', fields: [
    { key: 'messages_sent', label: 'Messages sent', type: 'number' },
    { key: 'replies', label: 'Replies received', type: 'number' },
  ]},
  { id: 'paid', label: 'Paid Ads', icon: '💰', hasScreenshot: true, fields: [
    { key: 'spend', label: 'Ad spend', type: 'number' },
    { key: 'reach', label: 'Impressions', type: 'number' },
    { key: 'clicks', label: 'Clicks', type: 'number' },
  ]},
  { id: 'affiliates', label: 'Affiliates', icon: '🤝', fields: [
    { key: 'partner_name', label: 'Partner name', type: 'text' },
    { key: 'referral_signups', label: 'Referral signups', type: 'number' },
    { key: 'commission', label: 'Commission paid', type: 'number' },
  ]},
]

const NODE_FIELDS = {
  capture: [
    { key: 'clicks', label: 'Link clicks', type: 'number' },
    { key: 'signups', label: 'Signups / expressions of interest', type: 'number' },
  ],
  convert: [
    { key: 'tickets', label: 'Tickets sold', type: 'number' },
    { key: 'revenue', label: 'Revenue', type: 'number', prefix: '$' },
  ],
  deliver: [
    { key: 'showed_up', label: 'People who showed up', type: 'number' },
  ],
}

export default function MetricInputSheet({ node, experienceId, userId, onSaved, onClose }) {
  const [method, setMethod] = useState(null)
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const fileInputRef = useRef(null)

  const isAttract = node === 'attract'
  const currentMethod = isAttract ? ATTRACT_METHODS.find(m => m.id === method) : null
  const fields = isAttract
    ? (currentMethod?.fields || [])
    : (NODE_FIELDS[node] || [])
  const hasScreenshot = currentMethod?.hasScreenshot

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAnalyzing(true)
    setAnalyzeError(null)
    hapticLight()

    try {
      if (method === 'content' || method === 'paid') {
        const result = await analyzeMetricsScreenshot(file)
        if (result?.metrics) {
          const m = result.metrics
          setValues(prev => ({
            ...prev,
            posts: m.posts || prev.posts || '',
            reach: m.reach || m.impressions || prev.reach || '',
            spend: m.spend || prev.spend || '',
            clicks: m.link_clicks || m.clicks || prev.clicks || '',
          }))
          hapticSuccess()
        } else {
          setAnalyzeError('Could not extract metrics. Try entering manually.')
        }
      } else if (method === 'warm') {
        const result = await analyzeLeadsScreenshot(file)
        if (result?.leads) {
          setValues(prev => ({
            ...prev,
            dms_sent: result.total_leads_found || prev.dms_sent || '',
            replies: result.leads.filter(l => l.engagement_type === 'dm' && l.temperature !== 'cold').length || prev.replies || '',
          }))
          hapticSuccess()
        } else {
          setAnalyzeError('Could not extract outreach data. Try entering manually.')
        }
      }
    } catch (err) {
      console.error('Screenshot analysis error:', err)
      setAnalyzeError('Analysis failed. Try entering manually.')
    }
    setAnalyzing(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    hapticLight()

    const entries = fields
      .filter(f => values[f.key] && String(values[f.key]).trim())
      .filter(f => f.type === 'number' ? Number(values[f.key]) > 0 : true)

    if (entries.length === 0) {
      setSaving(false)
      return
    }

    const partnerName = isAttract && method === 'affiliates' ? values.partner_name : null
    const saveable = entries.filter(f => f.key !== 'partner_name')

    if (saveable.length === 0) {
      setSaving(false)
      return
    }

    for (const field of saveable) {
      await savePipelineMetric(userId, experienceId, {
        node,
        method: isAttract ? method : null,
        metric_key: field.key,
        metric_value: Number(values[field.key]) || 0,
        partner_name: partnerName || null,
      })
    }

    hapticSuccess()
    setSaving(false)
    onSaved?.()
    onClose()
  }

  return (
    <div className="mis-overlay" onClick={onClose}>
      <div className="mis-sheet" onClick={e => e.stopPropagation()}>
        <div className="mis-header">
          <h3 className="mis-title">
            {isAttract ? 'Log Attraction Activity' : `Update ${node.charAt(0).toUpperCase() + node.slice(1)}`}
          </h3>
          <button className="mis-close" onClick={onClose}>×</button>
        </div>

        {/* Attract: method picker */}
        {isAttract && !method && (
          <div className="mis-methods">
            <p className="mis-prompt">Which method are you using?</p>
            {ATTRACT_METHODS.map(m => (
              <button
                key={m.id}
                className="mis-method-btn"
                onClick={() => { hapticLight(); setMethod(m.id) }}
              >
                <span className="mis-method-icon">{m.icon}</span>
                <span className="mis-method-label">{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Fields */}
        {fields.length > 0 && (
          <div className="mis-fields">
            {isAttract && method && (
              <button className="mis-back" onClick={() => { setMethod(null); setValues({}); setAnalyzeError(null) }}>
                ← Different method
              </button>
            )}

            {/* Screenshot upload option */}
            {hasScreenshot && (
              <div className="mis-screenshot">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshot}
                  style={{ display: 'none' }}
                />
                <button
                  className="mis-screenshot-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                >
                  {analyzing ? '🔍 Analyzing...' : '📸 Upload Screenshot'}
                </button>
                <span className="mis-screenshot-hint">
                  {method === 'content' ? 'Instagram insights, post metrics' : method === 'warm' ? 'DM conversations, message list' : 'Ad manager dashboard'}
                </span>
                {analyzeError && <span className="mis-screenshot-error">{analyzeError}</span>}
              </div>
            )}

            {hasScreenshot && <div className="mis-divider"><span>or enter manually</span></div>}

            {fields.map(field => (
              <label key={field.key} className="mis-field">
                <span className="mis-field-label">{field.label}</span>
                <div className="mis-field-input-wrap">
                  {field.prefix && <span className="mis-field-prefix">{field.prefix}</span>}
                  <input
                    className="mis-field-input"
                    type={field.type === 'number' ? 'number' : 'text'}
                    inputMode={field.type === 'number' ? 'numeric' : 'text'}
                    value={values[field.key] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </label>
            ))}
            <button
              className="mis-save"
              disabled={saving || analyzing || (
                !(isAttract && method === 'affiliates' && values.partner_name?.trim()) &&
                fields.filter(f => f.type === 'number').every(f => !values[f.key] || Number(values[f.key]) === 0)
              )}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
