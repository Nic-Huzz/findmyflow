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
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
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

// Attraction Offer details and lead magnet positioning
const ATTRACTION_OFFER_DETAILS = {
  win_your_money_back: {
    name: 'Win Your Money Back',
    icon: '🏆',
    description: 'Results-driven offer where customers earn back their investment',
    leadMagnetPosition: 'before', // Lead magnet comes before attraction offer
    leadMagnetRole: 'Preview before joining',
    leadMagnetSuggestion: 'Give a free preview (video training, PDF guide, or mini-challenge) that shows what they\'ll learn in the paid challenge',
    bestMagnetTypes: ['free_step_1', 'reveal_problem'],
    funnelPattern: 'Lead Magnet → Build Trust → Attraction Offer → Challenge → Results'
  },
  giveaway: {
    name: 'Flagship Giveaway',
    icon: '🎁',
    description: 'High-attraction offer using a compelling prize or scholarship',
    leadMagnetPosition: 'bonus', // Lead magnet is bonus for entering
    leadMagnetRole: 'Bonus for entering',
    leadMagnetSuggestion: 'Add a valuable bonus everyone gets just for entering (instant PDF, video training, or resource) while they wait for results',
    bestMagnetTypes: ['free_step_1', 'reveal_problem'],
    funnelPattern: 'Giveaway Entry → Instant Lead Magnet Bonus → Nurture → Non-Winner Offer'
  },
  decoy_offer: {
    name: 'Decoy Offer (Good/Better/Best)',
    icon: '📊',
    description: 'Tiered pricing where a weaker offer makes premium look attractive',
    leadMagnetPosition: 'before', // Lead magnet helps them decide
    leadMagnetRole: 'Comparison helper',
    leadMagnetSuggestion: 'Offer a free assessment or quiz that helps them identify which tier is right for them',
    bestMagnetTypes: ['reveal_problem', 'free_trial'],
    funnelPattern: 'Lead Magnet → Identify Needs → Decoy Pricing Page → Convert to Best Tier'
  },
  buy_x_get_y_free: {
    name: 'Buy X Get Y Free',
    icon: '🛒',
    description: 'Value-stacking offer where buying includes bonus units/products',
    leadMagnetPosition: 'sample', // Lead magnet is a sample
    leadMagnetRole: 'Sample/taste',
    leadMagnetSuggestion: 'Give them a free sample or trial-size version so they can experience the quality before buying the bundle',
    bestMagnetTypes: ['free_trial', 'free_step_1'],
    funnelPattern: 'Free Sample → Experience Quality → Bundle Offer → Repeat Purchase'
  },
  pay_less_now_or_pay_more_later: {
    name: 'Pay Less Now or Pay More Later',
    icon: '⏰',
    description: 'Time-sensitive pricing creating urgency for early buyers',
    leadMagnetPosition: 'urgency', // Lead magnet amplifies urgency
    leadMagnetRole: 'Urgency amplifier',
    leadMagnetSuggestion: 'Offer a free resource that demonstrates value + shows what they\'ll miss. Tie lead magnet to the deadline.',
    bestMagnetTypes: ['free_step_1', 'reveal_problem'],
    funnelPattern: 'Lead Magnet → Demonstrate Value → Time-Limited Offer → Deadline → Re-offer at Full Price'
  },
  free_with_consumption_to_upsell: {
    name: 'Free With Consumption',
    icon: '🎯',
    description: 'First session/module free, experience leads to premium upsell',
    leadMagnetPosition: 'merged', // Lead magnet IS the attraction offer
    leadMagnetRole: 'Is the attraction offer',
    leadMagnetSuggestion: 'Your lead magnet and attraction offer are the same thing! The free experience IS both the hook and the value exchange.',
    bestMagnetTypes: ['free_trial'],
    funnelPattern: 'Free Experience (LM + AO merged) → Consumption → Natural Upsell → Premium'
  }
}

function FunnelBuilderFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [coreStrategy, setCoreStrategy] = useState(null)
  const [attractionOffer, setAttractionOffer] = useState(null)
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

  // Note: Removed auto-register useEffect that was causing duplicate quest completions
  // Quest completion now only happens once when flow is completed

  async function loadPrerequisites() {
    if (!user) return

    try {
      // Load Core Four selection from leads_assessments
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

      // Load Attraction Offer selection from attraction_offer_assessments
      const { data: attractionData, error: attractionError } = await supabase
        .from('attraction_offer_assessments')
        .select('responses, recommended_offer_id, recommended_offer_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (attractionError) {
        console.error('Error loading attraction offer assessment:', attractionError)
      }

      console.log('📊 Attraction offer data:', attractionData)

      // Load Lead Magnet selection from offer_stack_builds (Offer Stack Builder)
      const { data: offerStackData, error: offerStackError } = await supabase
        .from('offer_stack_builds')
        .select('lead_magnet_product, lead_magnet_type, lead_magnet_idea, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (offerStackError) {
        console.error('Error loading offer stack build:', offerStackError)
      }

      console.log('📊 Offer Stack Builder data:', offerStackData)
      console.log('📊 Offer Stack status:', offerStackData?.status)
      console.log('📊 Lead magnet type:', offerStackData?.lead_magnet_type)
      console.log('📊 Lead magnet idea:', offerStackData?.lead_magnet_idea)

      // Set Core Four strategy
      if (leadsData?.recommended_strategy_id) {
        setCoreStrategy(leadsData.recommended_strategy_id)
      } else if (leadsData?.recommended_strategy_name) {
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

      // Set Attraction Offer
      if (attractionData?.recommended_offer_id) {
        setAttractionOffer(attractionData.recommended_offer_id)
      } else if (attractionData?.recommended_offer_name) {
        // Map name to ID
        const nameToId = {
          'Win Your Money Back': 'win_your_money_back',
          'Flagship Giveaway': 'giveaway',
          'Decoy Offer (Good/Better/Best)': 'decoy_offer',
          'Buy X Get Y Free': 'buy_x_get_y_free',
          'Pay Less Now or Pay More Later': 'pay_less_now_or_pay_more_later',
          'Free With Consumption': 'free_with_consumption_to_upsell'
        }
        const mappedId = nameToId[attractionData.recommended_offer_name]
        if (mappedId) {
          setAttractionOffer(mappedId)
        }
      }

      // Set Lead Magnet type from Offer Stack Builder
      // Check if Offer Stack is completed (status = 'completed')
      const offerStackComplete = offerStackData?.status === 'completed'

      if (offerStackData?.lead_magnet_type) {
        setLeadMagnetType(offerStackData.lead_magnet_type)
        // Set details including the selected product
        setLeadMagnetDetails({
          type: offerStackData.lead_magnet_type,
          product: offerStackData.lead_magnet_product,
          idea: offerStackData.lead_magnet_idea
        })
      } else if (offerStackComplete) {
        // Offer Stack completed but no lead magnet type - use a placeholder
        // This allows the flow to proceed even if lead magnet wasn't selected
        setLeadMagnetType('offer_stack_complete')
        setLeadMagnetDetails({
          type: null,
          product: offerStackData.lead_magnet_product,
          idea: offerStackData.lead_magnet_idea
        })
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
          attraction_offer: attractionOffer,
          lead_magnet_type: leadMagnetType,
          lead_magnet_role: attractionDetails?.leadMagnetRole,
          funnel_pattern: attractionDetails?.funnelPattern,
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
      await completeFlowQuest({
        userId: user.id,
        flowId: 'funnel_builder',
        pointsEarned: 35
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
  const attractionDetails = attractionOffer ? ATTRACTION_OFFER_DETAILS[attractionOffer] : null
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
    const hasAttraction = !!attractionOffer
    const hasMagnet = !!leadMagnetType
    const ready = hasStrategy && hasAttraction && hasMagnet

    return (
      <div className="funnel-builder-flow flow-base">
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

            <div className={`fb-prereq-item ${hasAttraction ? 'complete' : 'incomplete'}`}>
              <div className="fb-prereq-icon">{hasAttraction ? '✓' : '2'}</div>
              <div className="fb-prereq-content">
                <h3>Attraction Offer</h3>
                {hasAttraction ? (
                  <p className="fb-prereq-value">{attractionDetails?.icon} {attractionDetails?.name}</p>
                ) : (
                  <p>Choose your hook that captures attention</p>
                )}
              </div>
              {!hasAttraction && (
                <Link to="/attraction-offer" className="fb-prereq-link">Complete →</Link>
              )}
            </div>

            <div className={`fb-prereq-item ${hasMagnet ? 'complete' : 'incomplete'}`}>
              <div className="fb-prereq-icon">{hasMagnet ? '✓' : '3'}</div>
              <div className="fb-prereq-content">
                <h3>Offer Stack Builder</h3>
                {hasMagnet ? (
                  <p className="fb-prereq-value">
                    🧲 Lead Magnet: {leadMagnetDetails?.product?.name || leadMagnetDetails?.idea || magnetDetails?.name || 'Selected'}
                  </p>
                ) : (
                  <p>Build your offer stack with lead magnet</p>
                )}
              </div>
              {!hasMagnet && (
                <Link to="/offer-stack-builder" className="fb-prereq-link">Complete →</Link>
              )}
            </div>
          </div>

          <div className="fb-prereq-actions">
            {ready ? (
              <>
                <button
                  className="primary-button"
                  onClick={() => setStage(STAGES.WELCOME)}
                >
                  Let's Build Your Funnel
                </button>
                <button
                  className="go-back-link"
                  onClick={() => navigate('/7-day-challenge')}
                >
                  ← Go Back
                </button>
              </>
            ) : (
              <>
                <p className="fb-prereq-note">Complete all steps above to unlock the Funnel Builder</p>
                <button
                  className="go-back-link"
                  onClick={() => navigate('/7-day-challenge')}
                >
                  ← Go Back
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render welcome
  if (stage === STAGES.WELCOME) {
    const isMerged = attractionDetails?.leadMagnetPosition === 'merged'

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
              <p className="fb-card-desc">{strategyDetails?.description}</p>
            </div>

            <div className="fb-plus">→</div>

            <div className="fb-strategy-card">
              <div className="fb-strategy-icon">{attractionDetails?.icon}</div>
              <h3>{attractionDetails?.name}</h3>
              <p className="fb-card-desc">The Hook</p>
            </div>

            <div className="fb-plus">→</div>

            <div className="fb-strategy-card">
              <div className="fb-strategy-icon">🧲</div>
              <h3>{magnetDetails?.name}</h3>
              <p className="fb-card-desc">Value Exchange</p>
            </div>
          </div>

          {/* Lead Magnet Positioning Insight */}
          <div className="fb-positioning-insight">
            <h4>How Your Lead Magnet Connects</h4>
            <div className="fb-insight-content">
              <div className="fb-insight-role">
                <span className="fb-insight-label">Role:</span>
                <span className="fb-insight-value">{attractionDetails?.leadMagnetRole}</span>
              </div>
              <p className="fb-insight-suggestion">{attractionDetails?.leadMagnetSuggestion}</p>
            </div>
          </div>

          <div className="fb-funnel-preview">
            <h3>Your Funnel Pattern</h3>
            <p className="fb-pattern-text">{attractionDetails?.funnelPattern}</p>

            <div className="fb-funnel-steps">
              <div className="fb-funnel-step">
                <span className="fb-step-num">1</span>
                <span>Attract with {strategyDetails?.name}</span>
              </div>
              <div className="fb-funnel-arrow">↓</div>
              <div className="fb-funnel-step highlight">
                <span className="fb-step-num">2</span>
                <span>Hook with {attractionDetails?.name}</span>
              </div>
              <div className="fb-funnel-arrow">↓</div>
              {isMerged ? (
                <div className="fb-funnel-step merged">
                  <span className="fb-step-num">✓</span>
                  <span>Lead Magnet = Attraction Offer (merged)</span>
                </div>
              ) : (
                <div className="fb-funnel-step">
                  <span className="fb-step-num">3</span>
                  <span>Capture with {magnetDetails?.name} ({attractionDetails?.leadMagnetRole})</span>
                </div>
              )}
              <div className="fb-funnel-arrow">↓</div>
              <div className="fb-funnel-step">
                <span className="fb-step-num">{isMerged ? '3' : '4'}</span>
                <span>Nurture & Build Trust</span>
              </div>
              <div className="fb-funnel-arrow">↓</div>
              <div className="fb-funnel-step">
                <span className="fb-step-num">{isMerged ? '4' : '5'}</span>
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
    const isMerged = attractionDetails?.leadMagnetPosition === 'merged'

    return (
      <div className="funnel-builder-flow flow-base">
        <BackButton onClick={handleBack} />
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Step 1: Lead Magnet Delivery</h2>
          <p className="fb-section-subtitle">
            How will people get your {magnetDetails?.name.toLowerCase()}?
          </p>

          {/* Context box showing attraction offer connection */}
          <div className="info-box highlight">
            <strong>{attractionDetails?.icon} {attractionDetails?.name}</strong> → <strong>🧲 {magnetDetails?.name}</strong>
            <br />
            <span className="fb-info-role">Lead Magnet Role: {attractionDetails?.leadMagnetRole}</span>
            {isMerged && (
              <div className="fb-merged-note">
                Since your lead magnet and attraction offer are merged, the "free experience" serves both purposes!
              </div>
            )}
          </div>

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
              placeholder={attractionDetails?.leadMagnetSuggestion || `E.g., "After they complete the quiz, they'll see their results on a thank you page and get a detailed PDF via email..."`}
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
    const isMerged = attractionDetails?.leadMagnetPosition === 'merged'

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
            <span className="fb-summary-plus">→</span>
            <div className="fb-summary-strategy">
              <span>{attractionDetails?.icon}</span>
              <span>{attractionDetails?.name}</span>
            </div>
            <span className="fb-summary-plus">→</span>
            <div className="fb-summary-magnet">
              <span>🧲</span>
              <span>{magnetDetails?.name}</span>
            </div>
          </div>

          <div className="fb-summary-pattern">
            <strong>Pattern:</strong> {attractionDetails?.funnelPattern}
          </div>

          <div className="fb-summary-steps">
            <div className="fb-summary-step">
              <div className="fb-summary-step-header">
                <span className="fb-summary-step-num">1</span>
                <h4>Lead Magnet Delivery</h4>
              </div>
              <p className="fb-summary-role">{attractionDetails?.leadMagnetRole}</p>
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
              <span>{attractionDetails?.icon} {attractionDetails?.name}</span>
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
              <li>Create your {attractionDetails?.name?.toLowerCase()} hook</li>
              <li>Build your lead magnet ({attractionDetails?.leadMagnetRole?.toLowerCase()})</li>
              <li>Set up your delivery mechanism</li>
              <li>Create your nurture content/sequence</li>
              <li>Prepare your conversion process</li>
            </ul>
          </div>

          <FlowFeedback flowType="funnel_builder" userId={user?.id} />

          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '24px' }}
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
