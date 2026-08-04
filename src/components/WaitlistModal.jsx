/**
 * WaitlistModal.jsx
 * Captures waitlist signups: Name, Email, WhatsApp
 * Matches to flow-audit submissions by email
 */

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './WaitlistModal.css'

export default function WaitlistModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('Please enter your name')
      return
    }
    if (step === 2 && !formData.email.trim()) {
      setError('Please enter your email')
      return
    }
    if (step === 2 && !formData.email.includes('@')) {
      setError('Please enter a valid email')
      return
    }
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if they've done the flow-audit by email (table may not exist)
      let flowAuditId = null
      try {
        const { data: auditData } = await supabase
          .from('public_offer_audit_assessments')
          .select('id')
          .eq('respondent_email', formData.email.toLowerCase().trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        flowAuditId = auditData?.id
      } catch {
        // Table doesn't exist or no match - that's fine
      }

      // Insert waitlist signup
      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          whatsapp: formData.whatsapp.trim() || null,
          flow_audit_id: flowAuditId,
          source: 'landing_page'
        })

      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate email
          setError('This email is already on the waitlist!')
        } else {
          throw insertError
        }
        return
      }

      // Notify lead capture (fire-and-forget)
      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: formData.email.toLowerCase().trim(),
          name: formData.name.trim(),
          source: 'Waitlist Signup',
          meta: { whatsapp: formData.whatsapp.trim() }
        }
      }).catch(() => {})

      setSuccess(true)
    } catch (err) {
      console.error('Waitlist signup error:', err)
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setStep(1)
    setFormData({ name: '', email: '', whatsapp: '' })
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="waitlist-modal-overlay" onClick={handleClose}>
      <div className="waitlist-modal" onClick={e => e.stopPropagation()}>
        <button className="waitlist-close" onClick={handleClose}>×</button>

        {success ? (
          <div className="waitlist-success">
            <div className="success-icon">🎉</div>
            <h2>You're on the list!</h2>
            <p>We'll be in touch soon with early access.</p>
            <button className="waitlist-done-btn" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="waitlist-header">
              <h2>Join the Waiting List</h2>
              <p>Be first to access Find My Flow</p>
            </div>

            <div className="waitlist-progress">
              <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
              <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
              <div className={`progress-dot ${step >= 3 ? 'active' : ''}`} />
            </div>

            <div className="waitlist-form">
              {step === 1 && (
                <div className="waitlist-step">
                  <label className="waitlist-label">What's your name?</label>
                  <input
                    type="text"
                    className="waitlist-input"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    autoFocus
                  />
                </div>
              )}

              {step === 2 && (
                <div className="waitlist-step">
                  <label className="waitlist-label">What's your email?</label>
                  <input
                    type="email"
                    className="waitlist-input"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    autoFocus
                  />
                </div>
              )}

              {step === 3 && (
                <div className="waitlist-step">
                  <label className="waitlist-label">What's your WhatsApp number? (optional)</label>
                  <p className="waitlist-hint">We'll send updates via WhatsApp if provided</p>
                  <input
                    type="tel"
                    className="waitlist-input"
                    placeholder="+61 400 000 000"
                    value={formData.whatsapp}
                    onChange={e => handleChange('whatsapp', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <p className="waitlist-error">{error}</p>
              )}

              <div className="waitlist-actions">
                {step > 1 && (
                  <button
                    className="waitlist-back-btn"
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    className="waitlist-next-btn"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="waitlist-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Joining...' : 'Join Waitlist'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
