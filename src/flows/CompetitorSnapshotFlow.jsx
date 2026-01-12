/**
 * CompetitorSnapshotFlow - Capture competitive landscape
 *
 * Part of Tier 4 Autonomous System setup.
 * ~3 minute flow that captures competitor intelligence.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './CompetitorSnapshotFlow.css'

export default function CompetitorSnapshotFlow({ userId }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [competitors, setCompetitors] = useState([
    { name: '', pricing: '', positioning: '', strength: '', weakness: '' },
    { name: '', pricing: '', positioning: '', strength: '', weakness: '' },
    { name: '', pricing: '', positioning: '', strength: '', weakness: '' },
  ])
  const [yourAdvantage, setYourAdvantage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load existing data
  useEffect(() => {
    if (userId) {
      loadExistingData()
    }
  }, [userId])

  async function loadExistingData() {
    try {
      const { data } = await supabase
        .from('competitor_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(3)

      if (data?.length) {
        const loaded = data.map(c => ({
          name: c.competitor_name || '',
          pricing: c.their_pricing?.mid || '',
          positioning: c.their_positioning || '',
          strength: c.their_strengths?.[0] || '',
          weakness: c.their_weaknesses?.[0] || '',
        }))
        // Pad to 3 if less
        while (loaded.length < 3) {
          loaded.push({ name: '', pricing: '', positioning: '', strength: '', weakness: '' })
        }
        setCompetitors(loaded)
        setYourAdvantage(data[0]?.your_advantage || '')
      }
    } catch (err) {
      // No existing data, that's fine
    }
  }

  const STEPS = [
    {
      id: 'competitors',
      title: 'Your Competitors',
      subtitle: 'Who else do your customers consider?',
      icon: '🎯',
    },
    {
      id: 'details_0',
      title: `About ${competitors[0]?.name || 'Competitor 1'}`,
      subtitle: 'Help AI understand how they position themselves',
      icon: '1️⃣',
      competitorIndex: 0,
    },
    {
      id: 'details_1',
      title: `About ${competitors[1]?.name || 'Competitor 2'}`,
      subtitle: 'Help AI understand how they position themselves',
      icon: '2️⃣',
      competitorIndex: 1,
    },
    {
      id: 'details_2',
      title: `About ${competitors[2]?.name || 'Competitor 3'}`,
      subtitle: 'Help AI understand how they position themselves',
      icon: '3️⃣',
      competitorIndex: 2,
    },
    {
      id: 'advantage',
      title: 'Your Edge',
      subtitle: 'What makes YOU the better choice?',
      icon: '💪',
    },
  ]

  const currentStep = STEPS[step]

  const handleCompetitorChange = (index, field, value) => {
    setCompetitors(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const canProceed = () => {
    if (currentStep.id === 'competitors') {
      // At least one competitor name
      return competitors.some(c => c.name.trim())
    }
    if (currentStep.id === 'advantage') {
      return yourAdvantage.trim()
    }
    if (currentStep.competitorIndex !== undefined) {
      const comp = competitors[currentStep.competitorIndex]
      // Skip if no name for this competitor
      if (!comp.name.trim()) return true
      // Need at least positioning or pricing
      return comp.positioning.trim() || comp.pricing.trim()
    }
    return true
  }

  const shouldSkipStep = (stepIndex) => {
    const s = STEPS[stepIndex]
    if (s.competitorIndex !== undefined) {
      return !competitors[s.competitorIndex]?.name.trim()
    }
    return false
  }

  const handleNext = () => {
    let nextStep = step + 1
    // Skip steps for empty competitors
    while (nextStep < STEPS.length - 1 && shouldSkipStep(nextStep)) {
      nextStep++
    }

    if (nextStep < STEPS.length) {
      setStep(nextStep)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    let prevStep = step - 1
    // Skip steps for empty competitors
    while (prevStep > 0 && shouldSkipStep(prevStep)) {
      prevStep--
    }

    if (prevStep >= 0) {
      setStep(prevStep)
    } else {
      navigate('/crm/setup')
    }
  }

  async function handleComplete() {
    setSaving(true)
    setError(null)

    try {
      // Delete existing competitors first
      await supabase
        .from('competitor_analysis')
        .delete()
        .eq('user_id', userId)

      // Insert competitors that have names
      const validCompetitors = competitors.filter(c => c.name.trim())

      for (const comp of validCompetitors) {
        await supabase
          .from('competitor_analysis')
          .insert({
            user_id: userId,
            competitor_name: comp.name,
            their_pricing: { mid: comp.pricing || null },
            their_positioning: comp.positioning || null,
            their_strengths: comp.strength ? [comp.strength] : [],
            their_weaknesses: comp.weakness ? [comp.weakness] : [],
            your_advantage: yourAdvantage,
          })
      }

      // Update progress tracker
      await supabase
        .from('autonomous_setup_progress')
        .upsert({
          user_id: userId,
          competitor_snapshot_completed: true,
          competitor_snapshot_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      navigate('/crm/setup')
    } catch (err) {
      console.error('Error saving competitor data:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Calculate actual progress accounting for skipped steps
  const filledCompetitors = competitors.filter(c => c.name.trim()).length
  const totalSteps = 2 + filledCompetitors // competitors + details for each + advantage
  const currentProgress = step === 0 ? 1 :
    step === STEPS.length - 1 ? totalSteps :
    1 + competitors.slice(0, STEPS[step]?.competitorIndex + 1).filter(c => c.name.trim()).length

  return (
    <div className="competitor-flow">
      {/* Header */}
      <div className="competitor-header">
        <button className="back-btn" onClick={handleBack}>
          ← {step === 0 ? 'Exit' : 'Back'}
        </button>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentProgress / Math.max(totalSteps, 2)) * 100}%` }}
          />
        </div>
        <span className="step-counter">{currentProgress}/{totalSteps}</span>
      </div>

      {/* Content */}
      <div className="competitor-content">
        <div className="step-header">
          <span className="step-icon">{currentStep.icon}</span>
          <h2>{currentStep.title}</h2>
          <p>{currentStep.subtitle}</p>
        </div>

        {/* Step: Competitor Names */}
        {currentStep.id === 'competitors' && (
          <div className="fields">
            <p className="field-intro">
              List up to 3 alternatives your customers consider before choosing you.
              These could be direct competitors, DIY solutions, or doing nothing.
            </p>
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="competitor-name-row">
                <span className="competitor-number">{idx + 1}</span>
                <input
                  type="text"
                  className="text-input"
                  value={competitors[idx]?.name || ''}
                  onChange={(e) => handleCompetitorChange(idx, 'name', e.target.value)}
                  placeholder={
                    idx === 0 ? 'e.g., Competitor X, Agency Y, DIY' :
                    idx === 1 ? 'Another alternative...' :
                    'Optional third...'
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Step: Competitor Details */}
        {currentStep.competitorIndex !== undefined && (
          <div className="fields">
            <div className="field-group">
              <label className="field-label">What do they charge?</label>
              <p className="field-help">Their typical price point</p>
              <div className="pricing-input">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  value={competitors[currentStep.competitorIndex]?.pricing || ''}
                  onChange={(e) => handleCompetitorChange(currentStep.competitorIndex, 'pricing', e.target.value)}
                  placeholder="e.g., 2000 or 500/mo"
                />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">How do they position themselves?</label>
              <p className="field-help">Their main selling point or promise</p>
              <textarea
                className="textarea-input"
                value={competitors[currentStep.competitorIndex]?.positioning || ''}
                onChange={(e) => handleCompetitorChange(currentStep.competitorIndex, 'positioning', e.target.value)}
                placeholder='e.g., "The cheapest option", "Done-for-you service", "AI-powered solution"'
                rows={2}
              />
            </div>

            <div className="field-group">
              <label className="field-label">What do they do well?</label>
              <input
                type="text"
                className="text-input"
                value={competitors[currentStep.competitorIndex]?.strength || ''}
                onChange={(e) => handleCompetitorChange(currentStep.competitorIndex, 'strength', e.target.value)}
                placeholder="e.g., Strong brand recognition, lower price"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Where do they fall short?</label>
              <input
                type="text"
                className="text-input"
                value={competitors[currentStep.competitorIndex]?.weakness || ''}
                onChange={(e) => handleCompetitorChange(currentStep.competitorIndex, 'weakness', e.target.value)}
                placeholder="e.g., Poor support, generic solutions"
              />
            </div>
          </div>
        )}

        {/* Step: Your Advantage */}
        {currentStep.id === 'advantage' && (
          <div className="fields">
            <div className="field-group">
              <label className="field-label">
                What's your key advantage over all of them?
                <span className="required">*</span>
              </label>
              <p className="field-help">
                The #1 reason customers should choose YOU
              </p>
              <textarea
                className="textarea-input"
                value={yourAdvantage}
                onChange={(e) => setYourAdvantage(e.target.value)}
                placeholder='e.g., "I combine strategy with hands-on implementation - they get both the plan AND the execution without hiring multiple people"'
                rows={4}
              />
            </div>

            <div className="advantage-tips">
              <p className="tips-title">Good advantages are:</p>
              <ul>
                <li>Specific and concrete</li>
                <li>Hard for competitors to copy</li>
                <li>Meaningful to your ideal customer</li>
              </ul>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Footer */}
      <div className="competitor-footer">
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={!canProceed() || saving}
        >
          {saving ? 'Saving...' : currentStep.id === 'advantage' ? 'Complete' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
