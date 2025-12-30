/**
 * FunnelBuilderFlow - Build Your Lead Generation Funnel (+35 pts)
 *
 * Integrates:
 * - Core Four strategy selection (from Leads Strategy flow)
 * - Lead Magnet type (from Lead Magnet Selection flow)
 *
 * Walks user through designing their specific funnel:
 * 1. Lead Magnet delivery
 * 2. Nurture sequence
 * 3. Conversion mechanism
 * 4. Follow-up strategy
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './FunnelBuilderFlow.css'

const STAGES = {
  LOADING: 'loading',
  PREREQUISITES_CHECK: 'prerequisites_check',
  WELCOME: 'welcome',
  LEAD_MAGNET_DELIVERY: 'lead_magnet_delivery',
  NURTURE_SEQUENCE: 'nurture_sequence',
  CONVERSION_MECHANISM: 'conversion_mechanism',
  FOLLOW_UP: 'follow_up',
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Overview', stages: [STAGES.WELCOME] },
  { id: 'lead_magnet', label: 'Lead Magnet', stages: [STAGES.LEAD_MAGNET_DELIVERY] },
  { id: 'nurture', label: 'Nurture', stages: [STAGES.NURTURE_SEQUENCE] },
  { id: 'convert', label: 'Convert', stages: [STAGES.CONVERSION_MECHANISM] },
  { id: 'follow_up', label: 'Follow-Up', stages: [STAGES.FOLLOW_UP] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUMMARY, STAGES.SUCCESS] }
]

// Core Four strategy details
const CORE_FOUR_DETAILS = {
  warm_outreach: {
    name: 'Warm Outreach',
    icon: '🤝',
    description: 'Leverage your existing network through 1-on-1 conversations',
    funnelFocus: 'Personal touch and relationship building',
    deliveryMethods: ['Direct message with link', 'Personal email', 'Voice note with link'],
    nurtureTactics: ['Personal follow-up messages', 'Share relevant content 1:1', 'Check-in conversations'],
    conversionMethods: ['Discovery call booking', 'Direct offer in conversation', 'Free value → paid transition']
  },
  cold_outreach: {
    name: 'Cold Outreach',
    icon: '📧',
    description: 'Reach strangers who match your ideal customer profile',
    funnelFocus: 'Building trust with people who don\'t know you yet',
    deliveryMethods: ['Cold email sequence', 'LinkedIn message', 'Community DM'],
    nurtureTactics: ['Value-first email sequence', 'Share case studies', 'Provide free resources'],
    conversionMethods: ['Call booking after nurture', 'Low-ticket offer first', 'Free consultation']
  },
  post_free_content: {
    name: 'Post Free Content',
    icon: '📱',
    description: 'Attract audiences through valuable public content',
    funnelFocus: '1-to-many value delivery and audience building',
    deliveryMethods: ['Link in bio', 'Content CTA', 'Comment trigger'],
    nurtureTactics: ['Email newsletter', 'Content series', 'Community access'],
    conversionMethods: ['Webinar/workshop', 'Launch sequence', 'Evergreen sales page']
  },
  run_paid_ads: {
    name: 'Run Paid Ads',
    icon: '💰',
    description: 'Invest in paid advertising to reach cold audiences at scale',
    funnelFocus: 'Scalable lead capture and automated conversion',
    deliveryMethods: ['Landing page opt-in', 'Lead form ad', 'Messenger bot'],
    nurtureTactics: ['Automated email sequence', 'Retargeting ads', 'Video ad series'],
    conversionMethods: ['Sales page', 'VSL (Video Sales Letter)', 'Booked call funnel']
  }
}

// Lead Magnet type details
const LEAD_MAGNET_DETAILS = {
  reveal_problem: {
    name: 'Reveal the Problem',
    examples: 'Quiz, Assessment, Calculator',
    deliveryNote: 'Results page with personalized insights'
  },
  free_trial: {
    name: 'Free Trial',
    examples: 'Free session, Sample, Demo',
    deliveryNote: 'Direct access to experience your offer'
  },
  free_step_1: {
    name: 'Free Step 1',
    examples: 'Template, Guide, Mini-course',
    deliveryNote: 'Downloadable resource or email course'
  }
}

function FunnelBuilderFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [coreStrategy, setCoreStrategy] = useState(null)
  const [leadMagnetType, setLeadMagnetType] = useState(null)
  const [leadMagnetDetails, setLeadMagnetDetails] = useState(null)

  // Funnel answers
  const [funnelData, setFunnelData] = useState({
    deliveryMethod: '',
    deliveryDetails: '',
    nurtureMethod: '',
    nurtureDetails: '',
    conversionMethod: '',
    conversionDetails: '',
    followUpPlan: ''
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load prerequisites on mount
  useEffect(() => {
    loadPrerequisites()
  }, [user])

  async function loadPrerequisites() {
    if (!user) return

    try {
      // Load Core Four selection from leads_assessments
      // Column names: recommended_strategy_id, recommended_strategy_name
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_assessments')
        .select('responses, recommended_strategy_id, recommended_strategy_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (leadsError) {
        console.error('Error loading leads assessment:', leadsError)
      }

      console.log('📊 Leads assessment data:', leadsData)

      // Load Lead Magnet selection from offer_builder_assessments
      // Data is in responses.lead_magnet_selections.types
      const { data: offerData, error: offerError } = await supabase
        .from('offer_builder_assessments')
        .select('responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (offerError) {
        console.error('Error loading offer builder assessment:', offerError)
      }

      // Extract lead magnet selections from offer builder data
      const leadMagnetSelections = offerData?.responses?.lead_magnet_selections
      console.log('📊 Lead magnet selections:', leadMagnetSelections)

      // Set Core Four strategy
      if (leadsData?.recommended_strategy_id) {
        setCoreStrategy(leadsData.recommended_strategy_id)
      } else if (leadsData?.recommended_strategy_name) {
        // Fallback: map name to ID
        const nameToId = {
          'Warm Outreach': 'warm_outreach',
          'Cold Outreach': 'cold_outreach',
          'Post Free Content': 'post_free_content',
          'Run Paid Ads': 'run_paid_ads'
        }
        const mappedId = nameToId[leadsData.recommended_strategy_name]
        if (mappedId) {
          setCoreStrategy(mappedId)
        }
      }

      // Set Lead Magnet type from offer builder selections
      if (leadMagnetSelections?.types) {
        // Get the first selected type (user may have multiple lead magnets)
        const selectedTypes = Object.values(leadMagnetSelections.types)
        if (selectedTypes.length > 0) {
          setLeadMagnetType(selectedTypes[0])
          setLeadMagnetDetails(leadMagnetSelections)
        }
      }

      // Move to prerequisites check
      setStage(STAGES.PREREQUISITES_CHECK)

    } catch (err) {
      console.error('Error loading prerequisites:', err)
      setError('Failed to load your previous selections')
      setStage(STAGES.PREREQUISITES_CHECK)
    }
  }

  function handleInputChange(field, value) {
    setFunnelData(prev => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    const stageOrder = [
      STAGES.WELCOME,
      STAGES.LEAD_MAGNET_DELIVERY,
      STAGES.NURTURE_SEQUENCE,
      STAGES.CONVERSION_MECHANISM,
      STAGES.FOLLOW_UP,
      STAGES.SUMMARY
    ]

    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex < stageOrder.length - 1) {
      setStage(stageOrder[currentIndex + 1])
    }
  }

  function handleBack() {
    const stageOrder = [
      STAGES.WELCOME,
      STAGES.LEAD_MAGNET_DELIVERY,
      STAGES.NURTURE_SEQUENCE,
      STAGES.CONVERSION_MECHANISM,
      STAGES.FOLLOW_UP,
      STAGES.SUMMARY
    ]

    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex > 0) {
      setStage(stageOrder[currentIndex - 1])
    }
  }

  async function handleSave() {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      // Save funnel plan
      const { error: saveError } = await supabase
        .from('funnel_plans')
        .upsert({
          user_id: user.id,
          core_strategy: coreStrategy,
          lead_magnet_type: leadMagnetType,
          delivery_method: funnelData.deliveryMethod,
          delivery_details: funnelData.deliveryDetails,
          nurture_method: funnelData.nurtureMethod,
          nurture_details: funnelData.nurtureDetails,
          conversion_method: funnelData.conversionMethod,
          conversion_details: funnelData.conversionDetails,
          follow_up_plan: funnelData.followUpPlan,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (saveError) throw saveError

      // Complete quest
      await completeFlowQuest(user.id, 'funnel_builder', {
        core_strategy: coreStrategy,
        lead_magnet_type: leadMagnetType,
        funnel_data: funnelData
      })

      setStage(STAGES.SUCCESS)

    } catch (err) {
      console.error('Error saving funnel:', err)
      setError('Failed to save your funnel plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const strategyDetails = coreStrategy ? CORE_FOUR_DETAILS[coreStrategy] : null
  const magnetDetails = leadMagnetType ? LEAD_MAGNET_DETAILS[leadMagnetType] : null

  // Render loading
  if (stage === STAGES.LOADING) {
    return (
      <div className="funnel-builder-flow flow-base">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your strategy selections...</p>
        </div>
      </div>
    )
  }

  // Render prerequisites check
  if (stage === STAGES.PREREQUISITES_CHECK) {
    const hasStrategy = !!coreStrategy
    const hasMagnet = !!leadMagnetType
    const ready = hasStrategy && hasMagnet

    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={() => navigate('/7-day-challenge')} />

        <div className="fb-prerequisites">
          <h1>Build Your Funnel</h1>
          <p className="fb-subtitle">Before we design your funnel, you need to complete these steps:</p>

          <div className="fb-prereq-list">
            <div className={`fb-prereq-item ${hasStrategy ? 'complete' : 'incomplete'}`}>
              <div className="fb-prereq-icon">{hasStrategy ? '✓' : '1'}</div>
              <div className="fb-prereq-content">
                <h3>Core Four Strategy</h3>
                {hasStrategy ? (
                  <p className="fb-prereq-value">{strategyDetails?.icon} {strategyDetails?.name}</p>
                ) : (
                  <p>Choose your lead generation approach</p>
                )}
              </div>
              {!hasStrategy && (
                <Link to="/leads-strategy" className="fb-prereq-link">Complete →</Link>
              )}
            </div>

            <div className={`fb-prereq-item ${hasMagnet ? 'complete' : 'incomplete'}`}>
              <div className="fb-prereq-icon">{hasMagnet ? '✓' : '2'}</div>
              <div className="fb-prereq-content">
                <h3>Lead Magnet Type</h3>
                {hasMagnet ? (
                  <p className="fb-prereq-value">{magnetDetails?.name}</p>
                ) : (
                  <p>Choose your lead magnet approach</p>
                )}
              </div>
              {!hasMagnet && (
                <Link to="/lead-magnet-selection" className="fb-prereq-link">Complete →</Link>
              )}
            </div>
          </div>

          {ready ? (
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.WELCOME)}
            >
              Let's Build Your Funnel
            </button>
          ) : (
            <p className="fb-prereq-note">Complete both steps above to unlock the Funnel Builder</p>
          )}
        </div>
      </div>
    )
  }

  // Render welcome
  if (stage === STAGES.WELCOME) {
    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={() => navigate('/7-day-challenge')} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-welcome">
          <h1>Your Funnel Blueprint</h1>

          <div className="fb-strategy-summary">
            <div className="fb-strategy-card">
              <div className="fb-strategy-icon">{strategyDetails?.icon}</div>
              <h3>{strategyDetails?.name}</h3>
              <p>{strategyDetails?.description}</p>
            </div>

            <div className="fb-plus">+</div>

            <div className="fb-strategy-card">
              <div className="fb-strategy-icon">🧲</div>
              <h3>{magnetDetails?.name}</h3>
              <p>{magnetDetails?.examples}</p>
            </div>
          </div>

          <div className="fb-funnel-preview">
            <h3>Your Funnel Flow</h3>
            <div className="fb-funnel-steps">
              <div className="fb-funnel-step">
                <span className="fb-step-num">1</span>
                <span>Attract with {strategyDetails?.name}</span>
              </div>
              <div className="fb-funnel-arrow">↓</div>
              <div className="fb-funnel-step">
                <span className="fb-step-num">2</span>
                <span>Capture with {magnetDetails?.name}</span>
              </div>
              <div className="fb-funnel-arrow">↓</div>
              <div className="fb-funnel-step">
                <span className="fb-step-num">3</span>
                <span>Nurture & Build Trust</span>
              </div>
              <div className="fb-funnel-arrow">↓</div>
              <div className="fb-funnel-step">
                <span className="fb-step-num">4</span>
                <span>Convert to Customer</span>
              </div>
            </div>
          </div>

          <p className="fb-welcome-cta">Let's design each step of your funnel...</p>

          <button className="primary-button" onClick={handleNext}>
            Start Building
          </button>
        </div>
      </div>
    )
  }

  // Render Lead Magnet Delivery
  if (stage === STAGES.LEAD_MAGNET_DELIVERY) {
    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={handleBack} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Step 1: Lead Magnet Delivery</h2>
          <p className="fb-section-subtitle">
            How will people get your {magnetDetails?.name.toLowerCase()}?
          </p>

          <div className="info-box">
            <strong>Your Lead Magnet:</strong> {magnetDetails?.name}
            <br />
            <span className="fb-info-note">{magnetDetails?.deliveryNote}</span>
          </div>

          <div className="fb-options">
            <p className="fb-label">Choose your delivery method:</p>
            {strategyDetails?.deliveryMethods.map((method, i) => (
              <button
                key={i}
                className={`option-btn ${funnelData.deliveryMethod === method ? 'selected' : ''}`}
                onClick={() => handleInputChange('deliveryMethod', method)}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Describe your delivery process:</label>
            <textarea
              value={funnelData.deliveryDetails}
              onChange={(e) => handleInputChange('deliveryDetails', e.target.value)}
              placeholder={`E.g., "After they complete the quiz, they'll see their results on a thank you page and get a detailed PDF via email..."`}
              rows={4}
            />
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={handleBack}>Back</button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!funnelData.deliveryMethod}
            >
              Next: Nurture Sequence
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Nurture Sequence
  if (stage === STAGES.NURTURE_SEQUENCE) {
    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={handleBack} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Step 2: Nurture Sequence</h2>
          <p className="fb-section-subtitle">
            How will you build trust after they get your lead magnet?
          </p>

          <div className="info-box">
            <strong>Strategy Focus:</strong> {strategyDetails?.funnelFocus}
          </div>

          <div className="fb-options">
            <p className="fb-label">Choose your nurture approach:</p>
            {strategyDetails?.nurtureTactics.map((tactic, i) => (
              <button
                key={i}
                className={`option-btn ${funnelData.nurtureMethod === tactic ? 'selected' : ''}`}
                onClick={() => handleInputChange('nurtureMethod', tactic)}
              >
                {tactic}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Describe your nurture plan:</label>
            <textarea
              value={funnelData.nurtureDetails}
              onChange={(e) => handleInputChange('nurtureDetails', e.target.value)}
              placeholder={`E.g., "I'll send a 5-email sequence over 7 days: Day 1 - Welcome + quick win, Day 3 - My story, Day 5 - Case study..."`}
              rows={4}
            />
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={handleBack}>Back</button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!funnelData.nurtureMethod}
            >
              Next: Conversion
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Conversion Mechanism
  if (stage === STAGES.CONVERSION_MECHANISM) {
    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={handleBack} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Step 3: Conversion Mechanism</h2>
          <p className="fb-section-subtitle">
            How will you convert nurtured leads into customers?
          </p>

          <div className="fb-options">
            <p className="fb-label">Choose your conversion method:</p>
            {strategyDetails?.conversionMethods.map((method, i) => (
              <button
                key={i}
                className={`option-btn ${funnelData.conversionMethod === method ? 'selected' : ''}`}
                onClick={() => handleInputChange('conversionMethod', method)}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Describe your conversion process:</label>
            <textarea
              value={funnelData.conversionDetails}
              onChange={(e) => handleInputChange('conversionDetails', e.target.value)}
              placeholder={`E.g., "After the nurture sequence, I'll invite them to a free 30-min strategy call where I'll offer my coaching package..."`}
              rows={4}
            />
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={handleBack}>Back</button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!funnelData.conversionMethod}
            >
              Next: Follow-Up
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Follow-Up
  if (stage === STAGES.FOLLOW_UP) {
    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={handleBack} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Step 4: Follow-Up Strategy</h2>
          <p className="fb-section-subtitle">
            What happens when someone doesn't convert immediately?
          </p>

          <div className="info-box">
            <strong>Remember:</strong> Most people need 7+ touchpoints before buying. Your follow-up is crucial!
          </div>

          <div className="input-group">
            <label>Describe your follow-up plan for non-buyers:</label>
            <textarea
              value={funnelData.followUpPlan}
              onChange={(e) => handleInputChange('followUpPlan', e.target.value)}
              placeholder={`E.g., "Add to long-term nurture list, send weekly value emails, retarget with testimonial ads, re-offer during launches..."`}
              rows={5}
            />
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={handleBack}>Back</button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!funnelData.followUpPlan}
            >
              Review Funnel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Summary
  if (stage === STAGES.SUMMARY) {
    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={handleBack} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-summary">
          <h2>Your Funnel Plan</h2>

          <div className="fb-summary-header">
            <div className="fb-summary-strategy">
              <span>{strategyDetails?.icon}</span>
              <span>{strategyDetails?.name}</span>
            </div>
            <span className="fb-summary-plus">+</span>
            <div className="fb-summary-magnet">
              <span>🧲</span>
              <span>{magnetDetails?.name}</span>
            </div>
          </div>

          <div className="fb-summary-steps">
            <div className="fb-summary-step">
              <div className="fb-summary-step-header">
                <span className="fb-summary-step-num">1</span>
                <h4>Lead Magnet Delivery</h4>
              </div>
              <p className="fb-summary-method">{funnelData.deliveryMethod}</p>
              <p className="fb-summary-details">{funnelData.deliveryDetails}</p>
            </div>

            <div className="fb-summary-arrow">↓</div>

            <div className="fb-summary-step">
              <div className="fb-summary-step-header">
                <span className="fb-summary-step-num">2</span>
                <h4>Nurture Sequence</h4>
              </div>
              <p className="fb-summary-method">{funnelData.nurtureMethod}</p>
              <p className="fb-summary-details">{funnelData.nurtureDetails}</p>
            </div>

            <div className="fb-summary-arrow">↓</div>

            <div className="fb-summary-step">
              <div className="fb-summary-step-header">
                <span className="fb-summary-step-num">3</span>
                <h4>Conversion</h4>
              </div>
              <p className="fb-summary-method">{funnelData.conversionMethod}</p>
              <p className="fb-summary-details">{funnelData.conversionDetails}</p>
            </div>

            <div className="fb-summary-arrow">↓</div>

            <div className="fb-summary-step">
              <div className="fb-summary-step-header">
                <span className="fb-summary-step-num">4</span>
                <h4>Follow-Up</h4>
              </div>
              <p className="fb-summary-details">{funnelData.followUpPlan}</p>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="nav-buttons">
            <button className="secondary-button" onClick={handleBack}>Edit</button>
            <button
              className="primary-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Funnel Plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Success
  if (stage === STAGES.SUCCESS) {
    return (
      <div className="funnel-builder-flow flow-base">
        <div className="fb-success">
          <div className="fb-success-icon">🎉</div>
          <h1>Funnel Plan Complete!</h1>
          <p className="fb-success-points">+35 points earned</p>

          <div className="fb-success-summary">
            <p>You now have a complete lead generation funnel:</p>
            <div className="fb-success-flow">
              <span>{strategyDetails?.icon} {strategyDetails?.name}</span>
              <span>→</span>
              <span>🧲 {magnetDetails?.name}</span>
              <span>→</span>
              <span>💬 {funnelData.nurtureMethod}</span>
              <span>→</span>
              <span>💰 {funnelData.conversionMethod}</span>
            </div>
          </div>

          <div className="fb-success-next">
            <h3>Next Steps</h3>
            <ul>
              <li>Build your lead magnet if you haven't already</li>
              <li>Set up your delivery mechanism</li>
              <li>Create your nurture content/sequence</li>
              <li>Prepare your conversion process</li>
            </ul>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
          >
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default FunnelBuilderFlow
