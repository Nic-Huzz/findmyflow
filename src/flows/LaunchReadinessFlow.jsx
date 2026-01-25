/**
 * LaunchReadinessFlow.jsx - Launch Readiness Check (+25 pts)
 *
 * Assesses if user is ready to launch by checking:
 * 1. Sales infrastructure (where do people buy?)
 * 2. Pricing confirmed (from Money Models)
 * 3. Social proof inventory
 * 4. Pre-launch audience size
 * 5. Launch approach (beta, founding, public)
 *
 * Surfaces gaps and creates action items before launch.
 *
 * Created: January 2026
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { ProgressDots } from '../components/MoneyModelShared'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import './LaunchReadinessFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  SALES_INFRASTRUCTURE: 'sales_infrastructure',
  PRICING_CHECK: 'pricing_check',
  SOCIAL_PROOF: 'social_proof',
  AUDIENCE_SIZE: 'audience_size',
  LAUNCH_APPROACH: 'launch_approach',
  RESULTS: 'results',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Start', stages: [STAGES.LOADING, STAGES.WELCOME] },
  { id: 'sales', label: 'Sales', stages: [STAGES.SALES_INFRASTRUCTURE] },
  { id: 'pricing', label: 'Pricing', stages: [STAGES.PRICING_CHECK] },
  { id: 'proof', label: 'Proof', stages: [STAGES.SOCIAL_PROOF] },
  { id: 'audience', label: 'Audience', stages: [STAGES.AUDIENCE_SIZE] },
  { id: 'approach', label: 'Approach', stages: [STAGES.LAUNCH_APPROACH] },
  { id: 'results', label: 'Results', stages: [STAGES.RESULTS, STAGES.SUCCESS] }
]

const SOCIAL_PROOF_TYPES = [
  { id: 'testimonials', label: 'Written Testimonials', icon: '💬', placeholder: 'How many? From whom?' },
  { id: 'video_testimonials', label: 'Video Testimonials', icon: '🎥', placeholder: 'How many? What results do they share?' },
  { id: 'case_studies', label: 'Case Studies', icon: '📊', placeholder: 'What transformations can you document?' },
  { id: 'before_after', label: 'Before/After Results', icon: '📈', placeholder: 'What measurable changes can you show?' },
  { id: 'media_features', label: 'Media Features / Press', icon: '📰', placeholder: 'Where have you been featured?' },
  { id: 'credentials', label: 'Credentials / Certifications', icon: '🏆', placeholder: 'What qualifications do you have?' }
]

const LAUNCH_APPROACHES = [
  {
    id: 'beta',
    name: 'Beta Launch',
    icon: '🧪',
    description: 'Test with 5-10 people at free or heavily discounted rate',
    bestFor: 'First-time offers, no social proof yet',
    benefits: ['Get testimonials', 'Refine your offer', 'Find bugs/gaps', 'Build confidence'],
    risk: 'Low'
  },
  {
    id: 'founding',
    name: 'Founding Members',
    icon: '🌟',
    description: 'Limited spots at special founding price (20-50% off)',
    bestFor: 'Some proof, ready to sell but want urgency',
    benefits: ['Real revenue', 'Built-in scarcity', 'Early adopter community', 'Price anchoring'],
    risk: 'Medium'
  },
  {
    id: 'public',
    name: 'Public Launch',
    icon: '🚀',
    description: 'Full price, full marketing, go live',
    bestFor: 'Proven offer, strong proof, established audience',
    benefits: ['Maximum revenue', 'Full positioning', 'Scalable'],
    risk: 'Higher (if not ready)'
  }
]

function LaunchReadinessFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Data from previous flows
  const [existingPricing, setExistingPricing] = useState(null)
  const [offerName, setOfferName] = useState('')

  // User inputs
  const [salesData, setSalesData] = useState({
    hasPage: null, // 'yes', 'no', 'in_progress'
    pageUrl: '',
    pageType: '', // 'sales_page', 'checkout', 'booking', 'other'
    checkoutReady: null // 'yes', 'no'
  })

  const [pricingData, setPricingData] = useState({
    coreOfferPrice: '',
    upsellPrice: '',
    downsellPrice: '',
    confirmed: false
  })

  const [proofData, setProofData] = useState({
    types: {}, // { testimonials: { selected: true, details: '...' }, ... }
    totalPieces: 0
  })

  const [audienceData, setAudienceData] = useState({
    currentListSize: '',
    listGoal: '',
    primaryChannel: '',
    engagementLevel: '' // 'cold', 'warm', 'hot'
  })

  const [launchApproach, setLaunchApproach] = useState('')
  const [launchNotes, setLaunchNotes] = useState('')

  // Offer names from Money Model flows
  const [upsellOfferName, setUpsellOfferName] = useState('')
  const [downsellOfferName, setDownsellOfferName] = useState('')

  // Campaign progress from quest completions
  const [campaignProgress, setCampaignProgress] = useState({
    launch_sequence: { status: 'not_started', label: 'Launch Sequence' },
    content_plan: { status: 'not_started', label: 'Content Creation Plan' },
    lead_capture: { status: 'not_started', label: 'Lead Capture Setup' },
    nurture_sequence: { status: 'not_started', label: 'Nurture Sequence' },
    crm_setup: { status: 'not_started', label: 'CRM & Tracking Setup' }
  })

  // Load existing data on mount
  useEffect(() => {
    if (user) {
      loadExistingData()
    }
  }, [user])

  // Note: Removed auto-register useEffect that was causing duplicate quest completions
  // Quest completion now only happens once when flow is completed

  async function loadExistingData() {
    try {
      let corePrice = ''
      let upsellPrice = ''
      let downsellPrice = ''

      // Load Grand Slam offer for chosen product, name, and proof data
      const { data: grandSlamData } = await supabase
        .from('grand_slam_offers')
        .select('chosen_product_name, chosen_product_data, proof_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (grandSlamData?.chosen_product_name) {
        setOfferName(grandSlamData.chosen_product_name)
        // Try to get price from chosen product data
        if (grandSlamData.chosen_product_data?.price) {
          corePrice = grandSlamData.chosen_product_data.price
        }
      }

      // Load proof data from Grand Slam
      if (grandSlamData?.proof_data) {
        const gsProof = grandSlamData.proof_data
        const mappedProof = {}

        // Map Grand Slam proof fields to social proof types
        // Grand Slam stores: testimonials, case_studies, before_after, credentials, etc.
        if (gsProof.testimonials) {
          mappedProof.testimonials = { selected: true, details: gsProof.testimonials }
        }
        if (gsProof.video_testimonials) {
          mappedProof.video_testimonials = { selected: true, details: gsProof.video_testimonials }
        }
        if (gsProof.case_studies) {
          mappedProof.case_studies = { selected: true, details: gsProof.case_studies }
        }
        if (gsProof.before_after) {
          mappedProof.before_after = { selected: true, details: gsProof.before_after }
        }
        if (gsProof.media_features) {
          mappedProof.media_features = { selected: true, details: gsProof.media_features }
        }
        if (gsProof.credentials) {
          mappedProof.credentials = { selected: true, details: gsProof.credentials }
        }

        // Also check for alternative field names
        if (gsProof.results || gsProof.proof_results) {
          mappedProof.before_after = { selected: true, details: gsProof.results || gsProof.proof_results }
        }
        if (gsProof.certifications) {
          mappedProof.credentials = { selected: true, details: gsProof.certifications }
        }

        if (Object.keys(mappedProof).length > 0) {
          setProofData(prev => ({
            ...prev,
            types: mappedProof
          }))
          console.log('📊 Launch Readiness - Loaded proof from Grand Slam:', mappedProof)
        }
      }

      // Load Offer Stack for offer name (fallback)
      const { data: offerStackData } = await supabase
        .from('offer_stack_builds')
        .select('offer_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (offerStackData?.offer_name && !grandSlamData?.chosen_product_name) {
        setOfferName(offerStackData.offer_name)
      }

      // Load Upsell assessment - get the recommended offer name (not price)
      const { data: upsellData } = await supabase
        .from('upsell_assessments')
        .select('recommended_offer_name, recommended_offer_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Load Downsell assessment - get the recommended offer name (not price)
      const { data: downsellData } = await supabase
        .from('downsell_assessments')
        .select('recommended_offer_name, recommended_offer_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Store the offer names for display in pricing section
      setUpsellOfferName(upsellData?.recommended_offer_name || '')
      setDownsellOfferName(downsellData?.recommended_offer_name || '')

      console.log('📊 Upsell offer:', upsellData?.recommended_offer_name)
      console.log('📊 Downsell offer:', downsellData?.recommended_offer_name)

      // Set pricing data if we found any
      if (corePrice || upsellPrice || downsellPrice) {
        setExistingPricing({ coreOffer: corePrice, upsell: upsellPrice, downsell: downsellPrice })
        setPricingData(prev => ({
          ...prev,
          coreOfferPrice: corePrice || prev.coreOfferPrice,
          upsellPrice: upsellPrice || prev.upsellPrice,
          downsellPrice: downsellPrice || prev.downsellPrice
        }))
      }

      console.log('📊 Launch Readiness - Loaded pricing:', { corePrice, upsellPrice, downsellPrice })

      // Load campaign quest completions
      const questIds = [
        'milestone_launch_sequence',
        'milestone_content_plan',
        'milestone_lead_capture',
        'milestone_nurture_sequence',
        'milestone_crm_setup'
      ]

      // Fetch all user's quest completions and filter in JS (simpler than complex OR query)
      const { data: allCompletions, error: questError } = await supabase
        .from('quest_completions')
        .select('quest_id, response_text')
        .eq('user_id', user.id)

      const questCompletions = allCompletions?.filter(c => questIds.includes(c.quest_id)) || []
      console.log('📊 Quest completions:', questCompletions)

      if (questCompletions && questCompletions.length > 0) {
        const progressMap = { ...campaignProgress }

        questCompletions.forEach(completion => {
          const questKey = completion.quest_id.replace('milestone_', '')
          if (progressMap[questKey]) {
            // Determine status from response_text (the selected dropdown value)
            const responseValue = completion.response_text || 'completed_other'
            progressMap[questKey] = {
              ...progressMap[questKey],
              status: responseValue.includes('completed') ? responseValue : 'completed_other'
            }
          }
        })

        setCampaignProgress(progressMap)
        console.log('📊 Launch Readiness - Loaded campaign progress:', progressMap)
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading existing data:', err)
      setStage(STAGES.WELCOME)
    }
  }

  function calculateReadinessScore() {
    let score = 0
    let maxScore = 100
    const gaps = []
    const strengths = []

    // Sales Infrastructure (25 points)
    if (salesData.hasPage === 'yes' && salesData.pageUrl) {
      score += 20
      strengths.push('Sales page ready')
      if (salesData.checkoutReady === 'yes') {
        score += 5
        strengths.push('Checkout configured')
      } else {
        gaps.push({ area: 'Checkout', message: 'Set up payment processing', priority: 'high' })
      }
    } else if (salesData.hasPage === 'in_progress') {
      score += 10
      gaps.push({ area: 'Sales Page', message: 'Finish your sales page', priority: 'high' })
    } else {
      gaps.push({ area: 'Sales Page', message: 'Create a sales page or checkout', priority: 'critical' })
    }

    // Pricing (20 points)
    if (pricingData.confirmed && pricingData.coreOfferPrice) {
      score += 20
      strengths.push('Pricing confirmed')
    } else if (pricingData.coreOfferPrice) {
      score += 10
      gaps.push({ area: 'Pricing', message: 'Confirm your final pricing', priority: 'medium' })
    } else {
      gaps.push({ area: 'Pricing', message: 'Set your offer pricing', priority: 'high' })
    }

    // Social Proof (25 points)
    const proofCount = Object.values(proofData.types).filter(p => p.selected).length
    if (proofCount >= 3) {
      score += 25
      strengths.push('Strong social proof')
    } else if (proofCount >= 1) {
      score += 15
      gaps.push({ area: 'Social Proof', message: 'Gather more testimonials/proof', priority: 'medium' })
    } else {
      gaps.push({ area: 'Social Proof', message: 'No social proof yet - consider beta launch', priority: 'high' })
    }

    // Audience (20 points)
    const listSize = parseInt(audienceData.currentListSize) || 0
    const listGoal = parseInt(audienceData.listGoal) || 100
    if (listSize >= listGoal) {
      score += 20
      strengths.push('Audience goal met')
    } else if (listSize >= listGoal * 0.5) {
      score += 12
      gaps.push({ area: 'Audience', message: `${listGoal - listSize} more leads to goal`, priority: 'medium' })
    } else if (listSize > 0) {
      score += 5
      gaps.push({ area: 'Audience', message: 'Build your pre-launch list', priority: 'high' })
    } else {
      gaps.push({ area: 'Audience', message: 'Start building your email list', priority: 'critical' })
    }

    // Launch Approach (10 points)
    if (launchApproach) {
      score += 10
      strengths.push(`${LAUNCH_APPROACHES.find(a => a.id === launchApproach)?.name} planned`)
    }

    return { score, maxScore, gaps, strengths }
  }

  function getScoreGrade(score) {
    if (score >= 85) return { grade: 'A', label: 'Launch Ready', color: '#10B981' }
    if (score >= 70) return { grade: 'B', label: 'Almost Ready', color: '#84CC16' }
    if (score >= 50) return { grade: 'C', label: 'Needs Work', color: '#FBBF24' }
    if (score >= 30) return { grade: 'D', label: 'Not Ready', color: '#F97316' }
    return { grade: 'F', label: 'Start Here', color: '#EF4444' }
  }

  function getRecommendedApproach(score, proofCount) {
    if (proofCount === 0) return 'beta'
    if (score < 50) return 'beta'
    if (score < 70) return 'founding'
    return 'public'
  }

  async function handleSave() {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const { score, gaps, strengths } = calculateReadinessScore()
      const gradeInfo = getScoreGrade(score)

      const assessmentData = {
        user_id: user.id,
        sales_data: salesData,
        pricing_data: pricingData,
        proof_data: proofData,
        audience_data: audienceData,
        launch_approach: launchApproach,
        launch_notes: launchNotes,
        readiness_score: score,
        readiness_grade: gradeInfo.grade,
        gaps: gaps,
        strengths: strengths,
        created_at: new Date().toISOString()
      }

      console.log('💾 Saving Launch Readiness assessment:', assessmentData)

      const { data: savedData, error: saveError } = await supabase
        .from('launch_readiness_assessments')
        .insert(assessmentData)
        .select()

      if (saveError) {
        console.error('❌ Save error:', saveError)
        // Table might not exist, continue anyway
      } else {
        console.log('✅ Launch Readiness saved:', savedData)
      }

      // Complete quest
      console.log('🎯 Completing launch_readiness quest...')
      const questResult = await completeFlowQuest({
        userId: user.id,
        flowId: 'launch_readiness',
        pointsEarned: 25
      })
      console.log('🎯 Quest completion result:', questResult)

      setStage(STAGES.SUCCESS)
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleProofToggle(proofId) {
    setProofData(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [proofId]: {
          ...prev.types[proofId],
          selected: !prev.types[proofId]?.selected,
          details: prev.types[proofId]?.details || ''
        }
      }
    }))
  }

  function handleProofDetails(proofId, details) {
    setProofData(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [proofId]: {
          ...prev.types[proofId],
          details
        }
      }
    }))
  }

  // RENDER

  if (stage === STAGES.LOADING) {
    return (
      <div className="launch-readiness-flow">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your offer data...</p>
        </div>
      </div>
    )
  }

  if (stage === STAGES.WELCOME) {
    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1>Launch Readiness Check</h1>
          <p className="welcome-subtitle">
            Before you launch, let's make sure everything is in place.
          </p>

          {offerName && (
            <div className="lr-offer-badge">
              Checking readiness for: <strong>{offerName}</strong>
            </div>
          )}

          <div className="lr-checklist-preview">
            <div className="lr-check-item">
              <span className="lr-check-icon">🛒</span>
              <span>Sales page & checkout</span>
            </div>
            <div className="lr-check-item">
              <span className="lr-check-icon">💰</span>
              <span>Pricing confirmed</span>
            </div>
            <div className="lr-check-item">
              <span className="lr-check-icon">⭐</span>
              <span>Social proof ready</span>
            </div>
            <div className="lr-check-item">
              <span className="lr-check-icon">👥</span>
              <span>Audience size</span>
            </div>
            <div className="lr-check-item">
              <span className="lr-check-icon">🚀</span>
              <span>Launch approach</span>
            </div>
          </div>

          <p className="lr-time-estimate">Takes about 5 minutes</p>

          <button className="primary-button" onClick={() => setStage(STAGES.SALES_INFRASTRUCTURE)}>
            Start Check
          </button>
          <button className="secondary-button" onClick={() => navigate('/7-day-challenge')} style={{ marginTop: 12 }}>
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  if (stage === STAGES.SALES_INFRASTRUCTURE) {
    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="lr-section">
          <h2>Sales Infrastructure</h2>
          <p className="lr-subtitle">Where will people actually buy your offer?</p>

          <div className="lr-question">
            <label>Do you have a sales page or checkout set up?</label>
            <div className="lr-options">
              <button
                className={`lr-option ${salesData.hasPage === 'yes' ? 'selected' : ''}`}
                onClick={() => setSalesData(prev => ({ ...prev, hasPage: 'yes' }))}
              >
                <span className="lr-option-icon">✅</span>
                <span>Yes, it's ready</span>
              </button>
              <button
                className={`lr-option ${salesData.hasPage === 'in_progress' ? 'selected' : ''}`}
                onClick={() => setSalesData(prev => ({ ...prev, hasPage: 'in_progress' }))}
              >
                <span className="lr-option-icon">🔨</span>
                <span>In progress</span>
              </button>
              <button
                className={`lr-option ${salesData.hasPage === 'no' ? 'selected' : ''}`}
                onClick={() => setSalesData(prev => ({ ...prev, hasPage: 'no' }))}
              >
                <span className="lr-option-icon">❌</span>
                <span>Not yet</span>
              </button>
            </div>
          </div>

          {salesData.hasPage === 'yes' && (
            <>
              <div className="lr-question">
                <label>What type of page?</label>
                <div className="lr-options horizontal">
                  {[
                    { id: 'sales_page', label: 'Sales Page' },
                    { id: 'checkout', label: 'Direct Checkout' },
                    { id: 'booking', label: 'Booking Page' },
                    { id: 'other', label: 'Other' }
                  ].map(type => (
                    <button
                      key={type.id}
                      className={`lr-option small ${salesData.pageType === type.id ? 'selected' : ''}`}
                      onClick={() => setSalesData(prev => ({ ...prev, pageType: type.id }))}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lr-question">
                <label>Page URL (optional)</label>
                <input
                  type="url"
                  value={salesData.pageUrl}
                  onChange={(e) => setSalesData(prev => ({ ...prev, pageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="lr-input"
                />
              </div>

              <div className="lr-question">
                <label>Is checkout/payment ready to accept orders?</label>
                <div className="lr-options horizontal">
                  <button
                    className={`lr-option small ${salesData.checkoutReady === 'yes' ? 'selected' : ''}`}
                    onClick={() => setSalesData(prev => ({ ...prev, checkoutReady: 'yes' }))}
                  >
                    Yes
                  </button>
                  <button
                    className={`lr-option small ${salesData.checkoutReady === 'no' ? 'selected' : ''}`}
                    onClick={() => setSalesData(prev => ({ ...prev, checkoutReady: 'no' }))}
                  >
                    Not yet
                  </button>
                </div>
              </div>
            </>
          )}

          {salesData.hasPage === 'no' && (
            <div className="lr-info-box warning">
              <strong>You'll need a way to collect payment.</strong>
              <p>Options: FindMyFlow CRM (includes checkout pages), a direct checkout link, booking page, or a full sales page.</p>
            </div>
          )}

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.WELCOME)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.PRICING_CHECK)}
              disabled={!salesData.hasPage}
            >
              Next: Pricing
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === STAGES.PRICING_CHECK) {
    // Calculate potential revenue per sale
    const corePrice = parseFloat(pricingData.coreOfferPrice) || 0
    const upsellPrice = parseFloat(pricingData.upsellPrice) || 0
    const downsellPrice = parseFloat(pricingData.downsellPrice) || 0
    const maxRevenue = corePrice + upsellPrice
    const minRevenue = downsellPrice > 0 ? downsellPrice : corePrice
    const avgRevenue = corePrice > 0 ? Math.round((maxRevenue + minRevenue + corePrice) / 3) : 0

    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="lr-section">
          <h2>Your Pricing Stack</h2>
          <p className="lr-subtitle">Review and confirm your offer prices</p>

          {/* Visual Pricing Stack */}
          <div className="lr-pricing-stack">
            {/* Core Offer - Main Card */}
            <div className="lr-stack-card core">
              <div className="lr-stack-header">
                <span className="lr-stack-icon">💎</span>
                <div className="lr-stack-title">
                  <h3>Core Offer</h3>
                  <span className="lr-stack-subtitle">Your main product</span>
                </div>
              </div>
              <div className="lr-stack-price-row">
                <span className="lr-currency-large">$</span>
                <input
                  type="number"
                  className="lr-stack-price-input"
                  value={pricingData.coreOfferPrice}
                  onChange={(e) => setPricingData(prev => ({ ...prev, coreOfferPrice: e.target.value }))}
                  placeholder="997"
                />
              </div>
            </div>

            {/* Upsell Card */}
            <div className={`lr-stack-card upsell ${upsellPrice > 0 ? 'active' : ''}`}>
              <div className="lr-stack-header">
                <span className="lr-stack-icon">📈</span>
                <div className="lr-stack-title">
                  <h3>Upsell</h3>
                  <span className="lr-stack-subtitle">Premium add-on</span>
                </div>
                {upsellOfferName && (
                  <span className="lr-strategy-tag upsell">{upsellOfferName}</span>
                )}
              </div>
              <div className="lr-stack-price-row">
                <span className="lr-currency-large">$</span>
                <input
                  type="number"
                  className="lr-stack-price-input"
                  value={pricingData.upsellPrice}
                  onChange={(e) => setPricingData(prev => ({ ...prev, upsellPrice: e.target.value }))}
                  placeholder="297"
                />
              </div>
              <p className="lr-stack-hint">Offered after core purchase</p>
            </div>

            {/* Downsell Card */}
            <div className={`lr-stack-card downsell ${downsellPrice > 0 ? 'active' : ''}`}>
              <div className="lr-stack-header">
                <span className="lr-stack-icon">🎯</span>
                <div className="lr-stack-title">
                  <h3>Downsell</h3>
                  <span className="lr-stack-subtitle">Entry-level option</span>
                </div>
                {downsellOfferName && (
                  <span className="lr-strategy-tag downsell">{downsellOfferName}</span>
                )}
              </div>
              <div className="lr-stack-price-row">
                <span className="lr-currency-large">$</span>
                <input
                  type="number"
                  className="lr-stack-price-input"
                  value={pricingData.downsellPrice}
                  onChange={(e) => setPricingData(prev => ({ ...prev, downsellPrice: e.target.value }))}
                  placeholder="47"
                />
              </div>
              <p className="lr-stack-hint">Offered if core is declined</p>
            </div>
          </div>

          {/* Revenue Calculator */}
          {corePrice > 0 && (
            <div className="lr-revenue-calc">
              <h4>Potential Revenue Per Customer</h4>
              <div className="lr-revenue-scenarios">
                <div className="lr-scenario">
                  <span className="lr-scenario-label">Core Only</span>
                  <span className="lr-scenario-value">${corePrice.toLocaleString()}</span>
                </div>
                {upsellPrice > 0 && (
                  <div className="lr-scenario max">
                    <span className="lr-scenario-label">Core + Upsell</span>
                    <span className="lr-scenario-value">${maxRevenue.toLocaleString()}</span>
                  </div>
                )}
                {downsellPrice > 0 && (
                  <div className="lr-scenario min">
                    <span className="lr-scenario-label">Downsell Only</span>
                    <span className="lr-scenario-value">${downsellPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {(upsellPrice > 0 || downsellPrice > 0) && (
                <div className="lr-avg-revenue">
                  <span>Average customer value:</span>
                  <strong>${avgRevenue.toLocaleString()}</strong>
                </div>
              )}
            </div>
          )}

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.SALES_INFRASTRUCTURE)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.SOCIAL_PROOF)}
              disabled={!pricingData.coreOfferPrice}
            >
              Next: Social Proof
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === STAGES.SOCIAL_PROOF) {
    const selectedCount = Object.values(proofData.types).filter(p => p.selected).length

    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="lr-section">
          <h2>Social Proof Inventory</h2>
          <p className="lr-subtitle">What proof do you have that your offer works?</p>

          <div className="lr-proof-list">
            {SOCIAL_PROOF_TYPES.map(proof => (
              <div key={proof.id} className={`lr-proof-item ${proofData.types[proof.id]?.selected ? 'selected' : ''}`}>
                <button
                  className="lr-proof-toggle"
                  onClick={() => handleProofToggle(proof.id)}
                >
                  <span className="lr-proof-check">
                    {proofData.types[proof.id]?.selected && <span className="checkmark">✓</span>}
                  </span>
                  <span className="lr-proof-icon">{proof.icon}</span>
                  <span className="lr-proof-label">{proof.label}</span>
                </button>

                {proofData.types[proof.id]?.selected && (
                  <div className="lr-proof-details">
                    <input
                      type="text"
                      value={proofData.types[proof.id]?.details || ''}
                      onChange={(e) => handleProofDetails(proof.id, e.target.value)}
                      placeholder={proof.placeholder}
                      className="lr-input"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lr-proof-summary">
            <span className="lr-proof-count">{selectedCount}</span> types of proof selected
            {selectedCount === 0 && (
              <p className="lr-proof-warning">No proof yet? Consider a beta launch to gather testimonials.</p>
            )}
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.PRICING_CHECK)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.AUDIENCE_SIZE)}
            >
              Next: Audience
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === STAGES.AUDIENCE_SIZE) {
    const currentSize = parseInt(audienceData.currentListSize) || 0
    const goalSize = parseInt(audienceData.listGoal) || 0
    const progress = goalSize > 0 ? Math.min((currentSize / goalSize) * 100, 100) : 0

    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="lr-section">
          <h2>Pre-Launch Audience</h2>
          <p className="lr-subtitle">Who will you launch to?</p>

          <div className="lr-audience-grid">
            <div className="lr-audience-item">
              <label>Current email list size</label>
              <input
                type="number"
                value={audienceData.currentListSize}
                onChange={(e) => setAudienceData(prev => ({ ...prev, currentListSize: e.target.value }))}
                placeholder="0"
                className="lr-input large"
              />
            </div>

            <div className="lr-audience-item">
              <label>Launch list goal</label>
              <input
                type="number"
                value={audienceData.listGoal}
                onChange={(e) => setAudienceData(prev => ({ ...prev, listGoal: e.target.value }))}
                placeholder="100"
                className="lr-input large"
              />
            </div>
          </div>

          {goalSize > 0 && (
            <div className="lr-progress-container">
              <div className="lr-progress-bar">
                <div className="lr-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="lr-progress-text">
                {currentSize >= goalSize ? (
                  <span className="success">Goal reached! Ready to launch.</span>
                ) : (
                  <span>{goalSize - currentSize} more leads needed to reach goal</span>
                )}
              </p>
            </div>
          )}

          <div className="lr-question">
            <label>Primary audience channel</label>
            <div className="lr-options horizontal wrap">
              {['Email list', 'Instagram', 'LinkedIn', 'Twitter/X', 'YouTube', 'TikTok', 'Facebook', 'Other'].map(channel => (
                <button
                  key={channel}
                  className={`lr-option small ${audienceData.primaryChannel === channel ? 'selected' : ''}`}
                  onClick={() => setAudienceData(prev => ({ ...prev, primaryChannel: channel }))}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div className="lr-question">
            <label>How engaged is your audience?</label>
            <div className="lr-options">
              <button
                className={`lr-option ${audienceData.engagementLevel === 'hot' ? 'selected' : ''}`}
                onClick={() => setAudienceData(prev => ({ ...prev, engagementLevel: 'hot' }))}
              >
                <span className="lr-option-icon">🔥</span>
                <div>
                  <strong>Hot</strong>
                  <span className="lr-option-desc">They know me, trust me, reply to my content</span>
                </div>
              </button>
              <button
                className={`lr-option ${audienceData.engagementLevel === 'warm' ? 'selected' : ''}`}
                onClick={() => setAudienceData(prev => ({ ...prev, engagementLevel: 'warm' }))}
              >
                <span className="lr-option-icon">👋</span>
                <div>
                  <strong>Warm</strong>
                  <span className="lr-option-desc">They follow me but limited interaction</span>
                </div>
              </button>
              <button
                className={`lr-option ${audienceData.engagementLevel === 'cold' ? 'selected' : ''}`}
                onClick={() => setAudienceData(prev => ({ ...prev, engagementLevel: 'cold' }))}
              >
                <span className="lr-option-icon">❄️</span>
                <div>
                  <strong>Cold</strong>
                  <span className="lr-option-desc">New followers or purchased list</span>
                </div>
              </button>
            </div>
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.SOCIAL_PROOF)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.LAUNCH_APPROACH)}
            >
              Next: Launch Approach
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === STAGES.LAUNCH_APPROACH) {
    const proofCount = Object.values(proofData.types).filter(p => p.selected).length
    const { score } = calculateReadinessScore()
    const recommended = getRecommendedApproach(score, proofCount)

    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="lr-section">
          <h2>Launch Approach</h2>
          <p className="lr-subtitle">How do you want to launch?</p>

          <div className="lr-approach-options">
            {LAUNCH_APPROACHES.map(approach => (
              <button
                key={approach.id}
                className={`lr-approach-card ${launchApproach === approach.id ? 'selected' : ''} ${approach.id === recommended ? 'recommended' : ''}`}
                onClick={() => setLaunchApproach(approach.id)}
              >
                {approach.id === recommended && <span className="lr-recommended-badge">Recommended</span>}
                <div className="lr-approach-header">
                  <span className="lr-approach-icon">{approach.icon}</span>
                  <h3>{approach.name}</h3>
                </div>
                <p className="lr-approach-desc">{approach.description}</p>
                <p className="lr-approach-best"><strong>Best for:</strong> {approach.bestFor}</p>
                <ul className="lr-approach-benefits">
                  {approach.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {launchApproach && (
            <div className="lr-question">
              <label>Any notes about your launch plan?</label>
              <textarea
                value={launchNotes}
                onChange={(e) => setLaunchNotes(e.target.value)}
                placeholder="E.g., Planning to launch in 2 weeks, targeting founding members first..."
                className="lr-textarea"
                rows={3}
              />
            </div>
          )}

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.AUDIENCE_SIZE)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.RESULTS)}
              disabled={!launchApproach}
            >
              See My Readiness Score
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === STAGES.RESULTS) {
    const { score, gaps, strengths } = calculateReadinessScore()
    const gradeInfo = getScoreGrade(score)
    const selectedApproach = LAUNCH_APPROACHES.find(a => a.id === launchApproach)

    return (
      <div className="launch-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="lr-results">
          <h2>Your Launch Readiness</h2>

          <div className="lr-score-display" style={{ borderColor: gradeInfo.color }}>
            <div className="lr-score-circle" style={{ background: `linear-gradient(135deg, ${gradeInfo.color}40, ${gradeInfo.color}20)` }}>
              <span className="lr-score-number" style={{ color: gradeInfo.color }}>{score}</span>
              <span className="lr-score-max">/100</span>
            </div>
            <div className="lr-grade-badge" style={{ background: gradeInfo.color }}>
              {gradeInfo.grade}
            </div>
            <p className="lr-grade-label">{gradeInfo.label}</p>
          </div>

          <div className="lr-approach-summary">
            <span className="lr-approach-icon">{selectedApproach?.icon}</span>
            <span>Launch Approach: <strong>{selectedApproach?.name}</strong></span>
          </div>

          {strengths.length > 0 && (
            <div className="lr-strengths">
              <h3>✅ Strengths</h3>
              <ul>
                {strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {gaps.length > 0 && (
            <div className="lr-gaps">
              <h3>⚠️ Gaps to Address</h3>
              <ul>
                {gaps.map((gap, i) => (
                  <li key={i} className={`priority-${gap.priority}`}>
                    <strong>{gap.area}:</strong> {gap.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Campaign Progress Tracker */}
          <div className="lr-campaign-progress">
            <h3>📋 Campaign Setup Progress</h3>
            <div className="lr-progress-items">
              {Object.entries(campaignProgress).map(([key, item]) => {
                const statusIcon = item.status.includes('completed') ? '✅' :
                                   item.status === 'in_progress' ? '🔄' : '⬜'
                const statusLabel = item.status === 'completed_crm' ? 'Done in CRM' :
                                    item.status === 'completed_other' ? 'Completed' :
                                    item.status === 'in_progress' ? 'In Progress' : 'Not Started'
                return (
                  <div key={key} className={`lr-progress-item ${item.status}`}>
                    <span className="lr-progress-icon">{statusIcon}</span>
                    <span className="lr-progress-label">{item.label}</span>
                    <span className="lr-progress-status">{statusLabel}</span>
                  </div>
                )
              })}
            </div>
            <p className="lr-progress-hint">
              Update progress on the 7-Day Challenge page
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.LAUNCH_APPROACH)}>Back</button>
            <button
              className="primary-button glow-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Complete Check (+25 pts)'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === STAGES.SUCCESS) {
    const { score, gaps } = calculateReadinessScore()
    const gradeInfo = getScoreGrade(score)
    const selectedApproach = LAUNCH_APPROACHES.find(a => a.id === launchApproach)

    return (
      <div className="launch-readiness-flow">
        <div className="lr-success">
          <div className="lr-success-icon">🎯</div>
          <h1>Readiness Check Complete!</h1>
          <p className="lr-success-points">+25 points earned</p>

          <div className="lr-success-summary">
            <div className="lr-success-score" style={{ color: gradeInfo.color }}>
              Score: {score}/100 ({gradeInfo.grade})
            </div>
            <p>Launch Approach: {selectedApproach?.icon} {selectedApproach?.name}</p>
          </div>

          {gaps.length > 0 && (
            <div className="lr-success-next">
              <h3>Before you launch, address these:</h3>
              <ul>
                {gaps.slice(0, 3).map((gap, i) => (
                  <li key={i}>{gap.area}: {gap.message}</li>
                ))}
              </ul>
            </div>
          )}

          <FlowFeedback flowType="launch_readiness" userId={user?.id} />

          <button className="primary-button" onClick={() => navigate('/7-day-challenge')} style={{ marginTop: '24px' }}>
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default LaunchReadinessFlow
