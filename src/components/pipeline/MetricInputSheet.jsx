/**
 * MetricInputSheet.jsx — Bottom sheet for logging pipeline metrics
 *
 * Adapts per node:
 *   Attract: method picker (Content, Warm, Cold, Paid, Affiliates) → method-specific fields
 *   Capture: clicks/signups count
 *   Convert: tickets sold + revenue
 *   Deliver: showed up count
 *
 * CSS prefix: mis-
 */

import { useState } from 'react'
import { savePipelineMetric } from '../../hooks/useExperiencePipeline'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './MetricInputSheet.css'

const ATTRACT_METHODS = [
  { id: 'content', label: 'Content', icon: '📱', fields: [
    { key: 'posts', label: 'Posts made', type: 'number' },
    { key: 'reach', label: 'Reach / impressions', type: 'number' },
  ]},
  { id: 'warm', label: 'Warm Outreach', icon: '☀️', fields: [
    { key: 'dms_sent', label: 'DMs sent', type: 'number' },
    { key: 'replies', label: 'Replies received', type: 'number' },
  ]},
  { id: 'cold', label: 'Cold Outreach', icon: '❄️', fields: [
    { key: 'messages_sent', label: 'Messages sent', type: 'number' },
    { key: 'replies', label: 'Replies received', type: 'number' },
  ]},
  { id: 'paid', label: 'Paid Ads', icon: '💰', fields: [
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

  const isAttract = node === 'attract'
  const fields = isAttract
    ? (method ? ATTRACT_METHODS.find(m => m.id === method)?.fields || [] : [])
    : (NODE_FIELDS[node] || [])

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

    for (const field of entries) {
      if (field.key === 'partner_name') continue
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
              <button className="mis-back" onClick={() => { setMethod(null); setValues({}) }}>
                ← Different method
              </button>
            )}
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
                    autoFocus={fields.indexOf(field) === 0}
                  />
                </div>
              </label>
            ))}
            <button
              className="mis-save"
              disabled={saving || fields.filter(f => f.type === 'number').every(f => !values[f.key] || Number(values[f.key]) === 0)}
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
