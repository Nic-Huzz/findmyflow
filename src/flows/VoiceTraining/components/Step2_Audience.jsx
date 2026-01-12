/**
 * Step 2: Audience Description
 * Captures how they describe their ideal client + learns descriptive voice
 * Can pull from FindMyFlow if available
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function Step2_Audience({ value, onChange, userId, onContinue }) {
  const [text, setText] = useState(value || '')
  const [findMyFlowData, setFindMyFlowData] = useState(null)

  // Try to load FindMyFlow data for context
  useEffect(() => {
    async function loadFMF() {
      if (!userId) return

      const { data } = await supabase
        .from('nikigai_clusters')
        .select('ideal_customer, core_problem')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setFindMyFlowData(data)
      }
    }

    loadFMF()
  }, [userId])

  const handleContinue = () => {
    onChange(text.trim())
    onContinue()
  }

  const isValid = text.trim().length >= 50

  return (
    <div className="vt-step">
      <div className="vt-step-header">
        <h2>Describe your ideal client</h2>
        <p>
          Talk about them like you&apos;re telling a friend over coffee.
          Who are they? What&apos;s their daily life like?
        </p>
      </div>

      {findMyFlowData && (
        <div className="vt-tip" style={{ marginBottom: '20px', background: '#e8f5e9' }}>
          <span className="vt-tip-icon">🧭</span>
          <div className="vt-tip-content" style={{ color: '#2e7d32' }}>
            <strong>From your FindMyFlow:</strong><br />
            {findMyFlowData.ideal_customer && (
              <>Ideal customer: {findMyFlowData.ideal_customer}<br /></>
            )}
            {findMyFlowData.core_problem && (
              <>Problem you solve: {findMyFlowData.core_problem}</>
            )}
            <br /><br />
            <em>Now describe them in YOUR words - how you naturally talk about them.</em>
          </div>
        </div>
      )}

      <textarea
        className="vt-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="She's the mom who has a million ideas but zero time. She's on her phone at 11pm researching 'how to start a business' while everyone else sleeps. She knows she's meant for more but feels guilty for wanting it..."
        maxLength={1000}
      />

      <div className="vt-char-count">
        {text.length}/1000 characters (min 50)
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>We&apos;re learning:</strong> How you describe others, your empathy expression,
          specificity level, and the language you use when talking about your audience.
        </div>
      </div>

      <button
        className="vt-continue-btn"
        onClick={handleContinue}
        disabled={!isValid}
      >
        Continue →
      </button>
    </div>
  )
}
