/**
 * PublicOfferAuditFlow - Public Offer Audit Assessment (no auth required)
 *
 * Assesses business offer stack completeness and systems maturity.
 * Used as lead magnet - captures email before showing results.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BackButton } from '../components/MoneyModelShared'
import PublicEmailGate from '../components/PublicEmailGate'
import PublicFlowCTA from '../components/PublicFlowCTA'
import DownloadResultsButton from '../components/DownloadResultsButton'
import { FlowFeedback } from '../components/FlowFeedback'
import {
  trackFlowStarted,
  trackFlowProgress50,
  trackFlowCompleted,
  trackEmailCaptured
} from '../lib/pixelTracking'
import { cacheBustUrl } from '../lib/fetchJson'
import './PublicOfferAuditFlow.css'

// Stages for the flow
const STAGES = {
  TIME_CHECK: 'time_check',
  WELCOME: 'welcome',
  QUESTIONS: 'questions',
  CALCULATING: 'calculating',
  REVEAL: 'reveal'
}

// Negative emotions that trigger the stuck_duration question
const NEGATIVE_EMOTIONS = ['frustrated', 'overwhelmed', 'lost', 'stuck']

// Scoring weights for each answer
const SCORING = {
  // Offer Stack Scoring
  q6_attraction_offer: {
    attraction_working: 25,
    attraction_not_converting: 15,
    attraction_unclear: 10,
    no_attraction: 0
  },
  q7_upsell_offer: {
    upsell_working: 25,
    upsell_not_converting: 15,
    upsell_ad_hoc: 10,
    no_upsell: 0
  },
  q8_downsell_offer: {
    downsell_working: 20,
    downsell_rarely_used: 12,
    downsell_ad_hoc: 8,
    no_downsell: 0
  },
  q9_continuity_offer: {
    continuity_strong: 20,
    continuity_small: 12,
    continuity_failed: 5,
    no_continuity: 0
  },
  // Systems Scoring
  q10_funnel_tracking: {
    tracking_full: 5,
    tracking_partial: 3,
    tracking_basic: 1,
    no_tracking: 0
  },
  q11_crm_system: {
    crm_active: 5,
    crm_underutilized: 3,
    crm_basic: 1,
    no_crm: 0
  }
}

// Gap definitions based on answers
const GAP_DEFINITIONS = {
  no_attraction: {
    icon: '🎯',
    title: 'Missing Attraction Offer',
    description: 'You need a low-friction front-end offer to bring in new customers consistently.'
  },
  attraction_not_converting: {
    icon: '🎯',
    title: 'Attraction Offer Not Converting',
    description: 'Your front-end offer exists but needs optimization to convert browsers into buyers.'
  },
  no_upsell: {
    icon: '⬆️',
    title: 'Missing Upsell',
    description: 'Without a premium tier, you\'re leaving money on the table from your best customers.'
  },
  upsell_not_converting: {
    icon: '⬆️',
    title: 'Upsell Not Converting',
    description: 'Your premium offer exists but needs better positioning or timing.'
  },
  no_downsell: {
    icon: '⬇️',
    title: 'Missing Downsell',
    description: 'You\'re losing customers who want to buy but can\'t afford your main offer.'
  },
  no_continuity: {
    icon: '🔄',
    title: 'No Recurring Revenue',
    description: 'Without continuity, you\'re stuck on the revenue treadmill of constant new sales.'
  },
  continuity_failed: {
    icon: '🔄',
    title: 'Continuity Needs Work',
    description: 'Your recurring offer didn\'t stick - worth revisiting with a different approach.'
  },
  no_tracking: {
    icon: '📊',
    title: 'No Funnel Tracking',
    description: 'You can\'t improve what you don\'t measure. Tracking is essential for growth.'
  },
  no_crm: {
    icon: '💾',
    title: 'No CRM System',
    description: 'Without a system to track customers, leads fall through the cracks.'
  },
  // Alignment gaps
  misaligned: {
    icon: '😓',
    title: 'Passion-Income Misalignment',
    description: 'You\'re being paid for work that drains you. Time to realign what you offer with what lights you up.'
  },
  necessity: {
    icon: '⚡',
    title: 'Running on Duty, Not Energy',
    description: 'You\'re doing what\'s necessary but not what energises you. There\'s an opportunity to shift toward more fulfilling work.'
  },
  searching: {
    icon: '🔍',
    title: 'Still Finding Your Spark',
    description: 'You haven\'t found what truly lights you up yet. Discovery is the first step to building something meaningful.'
  }
}

// Category scoring configuration
const CATEGORY_CONFIG = {
  journey: {
    name: 'Journey Clarity',
    icon: '🧭',
    color: '#8B5CF6' // Purple
  },
  alignment: {
    name: 'Alignment',
    icon: '✨',
    color: '#EC4899' // Pink
  },
  offerStack: {
    name: 'Offer Stack',
    icon: '📦',
    color: '#F59E0B' // Amber
  },
  systems: {
    name: 'Systems',
    icon: '📊',
    color: '#10B981' // Green
  }
}

// Level definitions
const LEVELS = {
  1: { name: 'Foundation', description: 'Just starting' },
  2: { name: 'Building', description: 'In progress' },
  3: { name: 'Optimized', description: 'Strong' }
}

// Calculate category levels from answers
function calculateCategoryLevels(answers) {
  const wealthLadder = answers.q2_wealth_ladder?.value
  const journeyStage = answers.q1_journey_stage?.value
  // Treat "exploring from day job" as pre-ladder since they skip q2
  const isPreLadder = wealthLadder === 'pre_ladder' || journeyStage === 'employed_exploring'

  const levels = {
    journey: 1,
    alignment: 1,
    offerStack: null, // null = N/A for pre-ladder
    systems: isPreLadder ? null : 1 // Also N/A for pre-ladder
  }

  // Journey Clarity - based on emotion and goal clarity
  const emotion = answers.q4_current_emotion?.value
  const goal = answers.q3_primary_goal?.value

  // Positive emotions boost journey clarity
  const positiveEmotions = ['excited', 'hopeful', 'motivated']
  const hasPositiveEmotion = positiveEmotions.includes(emotion)
  const hasClarity = goal && !isPreLadder

  if (hasPositiveEmotion && hasClarity) {
    levels.journey = 3
  } else if (hasPositiveEmotion || hasClarity) {
    levels.journey = 2
  } else {
    levels.journey = 1
  }

  // Alignment - based on work energy and paid alignment
  const workEnergy = answers.q2b_work_energy?.value
  const paidAlignment = answers.q2c_paid_alignment?.value

  // Calculate alignment score
  let alignmentScore = 0

  // Work energy scoring
  if (workEnergy === 'energised') alignmentScore += 3
  else if (workEnergy === 'partial_energy') alignmentScore += 2
  else if (workEnergy === 'necessity') alignmentScore += 1
  else if (workEnergy === 'searching') alignmentScore += 0

  // Paid alignment scoring (if answered)
  if (paidAlignment === 'well_aligned') alignmentScore += 3
  else if (paidAlignment === 'some_alignment') alignmentScore += 2
  else if (paidAlignment === 'misaligned') alignmentScore += 1
  else if (paidAlignment === 'not_monetised') alignmentScore += 1

  // Calculate level (max 6 points if both answered, max 3 if only work_energy)
  const maxScore = paidAlignment ? 6 : 3
  const alignmentRatio = alignmentScore / maxScore

  if (alignmentRatio >= 0.8) levels.alignment = 3
  else if (alignmentRatio >= 0.5) levels.alignment = 2
  else levels.alignment = 1

  // Offer Stack - only for non-pre-ladder users
  if (wealthLadder && !isPreLadder) {
    let offerScore = 0
    let offerCount = 0

    // Attraction offer
    const attraction = answers.q6_attraction_offer?.value
    if (attraction === 'attraction_working') offerScore += 3
    else if (attraction === 'attraction_not_converting' || attraction === 'attraction_unclear') offerScore += 2
    else if (attraction === 'no_attraction') offerScore += 0
    if (attraction) offerCount++

    // Upsell
    const upsell = answers.q7_upsell_offer?.value
    if (upsell === 'upsell_working') offerScore += 3
    else if (upsell === 'upsell_not_converting' || upsell === 'upsell_ad_hoc') offerScore += 2
    else if (upsell === 'no_upsell') offerScore += 0
    if (upsell) offerCount++

    // Downsell
    const downsell = answers.q8_downsell_offer?.value
    if (downsell === 'downsell_working') offerScore += 3
    else if (downsell === 'downsell_rarely_used' || downsell === 'downsell_ad_hoc') offerScore += 2
    else if (downsell === 'no_downsell') offerScore += 0
    if (downsell) offerCount++

    // Continuity
    const continuity = answers.q9_continuity_offer?.value
    if (continuity === 'continuity_strong') offerScore += 3
    else if (continuity === 'continuity_small' || continuity === 'continuity_failed') offerScore += 2
    else if (continuity === 'no_continuity') offerScore += 0
    if (continuity) offerCount++

    // Calculate level (max 12 points = 3 per offer × 4 offers)
    if (offerCount > 0) {
      const avgScore = offerScore / offerCount
      if (avgScore >= 2.5) levels.offerStack = 3
      else if (avgScore >= 1.5) levels.offerStack = 2
      else levels.offerStack = 1
    }
  }

  // Systems - only for non-pre-ladder users
  if (!isPreLadder) {
    let systemsScore = 0

    const tracking = answers.q10_funnel_tracking?.value
    if (tracking === 'tracking_full') systemsScore += 3
    else if (tracking === 'tracking_partial') systemsScore += 2
    else if (tracking === 'tracking_basic') systemsScore += 1

    const crm = answers.q11_crm_system?.value
    if (crm === 'crm_active') systemsScore += 3
    else if (crm === 'crm_underutilized') systemsScore += 2
    else if (crm === 'crm_basic') systemsScore += 1

    // Only calculate if user answered systems questions
    if (tracking || crm) {
      if (systemsScore >= 5) levels.systems = 3
      else if (systemsScore >= 3) levels.systems = 2
      else levels.systems = 1
    }
  }

  return levels
}

// Audit Wheel Component
function AuditWheel({ categoryLevels }) {
  const categories = [
    { key: 'journey', ...CATEGORY_CONFIG.journey, level: categoryLevels.journey },
    { key: 'alignment', ...CATEGORY_CONFIG.alignment, level: categoryLevels.alignment },
    { key: 'offerStack', ...CATEGORY_CONFIG.offerStack, level: categoryLevels.offerStack },
    { key: 'systems', ...CATEGORY_CONFIG.systems, level: categoryLevels.systems }
  ]

  const size = 280
  const center = size / 2
  const maxRadius = 120
  const ringWidth = 35
  const gapAngle = 6 // degrees between segments

  // Calculate segment paths
  const numCategories = categories.length
  const segmentAngle = (360 - (gapAngle * numCategories)) / numCategories

  const polarToCartesian = (cx, cy, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians)
    }
  }

  const describeArc = (cx, cy, innerRadius, outerRadius, startAngle, endAngle) => {
    const start1 = polarToCartesian(cx, cy, outerRadius, endAngle)
    const end1 = polarToCartesian(cx, cy, outerRadius, startAngle)
    const start2 = polarToCartesian(cx, cy, innerRadius, startAngle)
    const end2 = polarToCartesian(cx, cy, innerRadius, endAngle)

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return [
      'M', start1.x, start1.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 0, end1.x, end1.y,
      'L', start2.x, start2.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, end2.x, end2.y,
      'Z'
    ].join(' ')
  }

  return (
    <div className="audit-wheel-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {categories.map((cat, index) => {
          const startAngle = index * (segmentAngle + gapAngle)
          const endAngle = startAngle + segmentAngle
          const isNA = cat.level === null

          return (
            <g key={cat.key}>
              {/* Level 1 - Inner ring */}
              <path
                d={describeArc(center, center, maxRadius - ringWidth * 3, maxRadius - ringWidth * 2, startAngle, endAngle)}
                fill={isNA ? 'rgba(255,255,255,0.1)' : (cat.level >= 1 ? cat.color : 'rgba(255,255,255,0.1)')}
                opacity={isNA ? 0.3 : (cat.level >= 1 ? 1 : 0.3)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              {/* Level 2 - Middle ring */}
              <path
                d={describeArc(center, center, maxRadius - ringWidth * 2, maxRadius - ringWidth, startAngle, endAngle)}
                fill={isNA ? 'rgba(255,255,255,0.1)' : (cat.level >= 2 ? cat.color : 'rgba(255,255,255,0.1)')}
                opacity={isNA ? 0.3 : (cat.level >= 2 ? 0.85 : 0.3)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              {/* Level 3 - Outer ring */}
              <path
                d={describeArc(center, center, maxRadius - ringWidth, maxRadius, startAngle, endAngle)}
                fill={isNA ? 'rgba(255,255,255,0.1)' : (cat.level >= 3 ? cat.color : 'rgba(255,255,255,0.1)')}
                opacity={isNA ? 0.3 : (cat.level >= 3 ? 0.7 : 0.3)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            </g>
          )
        })}
        {/* Center circle */}
        <circle cx={center} cy={center} r={maxRadius - ringWidth * 3 - 5} fill="rgba(255,255,255,0.05)" />
      </svg>

      {/* Legend */}
      <div className="audit-wheel-legend">
        {categories.map(cat => (
          <div key={cat.key} className={`legend-item ${cat.level === null ? 'na' : ''}`}>
            <span className="legend-icon">{cat.icon}</span>
            <div className="legend-text">
              <span className="legend-name">{cat.name}</span>
              <span className="legend-level" style={{ color: cat.level === null ? 'rgba(255,255,255,0.4)' : cat.color }}>
                {cat.level === null ? 'N/A' : LEVELS[cat.level].name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// How Find My Flow helps with each gap
const GAP_TO_HELP = {
  no_attraction: {
    feature: 'Attraction Offer Builder',
    description: 'Our guided flow helps you craft a compelling front-end offer that converts strangers into customers.',
    icon: '🎯'
  },
  attraction_not_converting: {
    feature: 'Offer Optimization',
    description: 'Audit and refine your attraction offer with our $100M Offers framework to boost conversions.',
    icon: '🔧'
  },
  attraction_unclear: {
    feature: 'Offer Positioning',
    description: 'Clarify and position your attraction offer so customers understand exactly what they\'re getting.',
    icon: '💡'
  },
  no_upsell: {
    feature: 'Upsell Strategy Builder',
    description: 'Design a premium tier that your best customers will love upgrading to.',
    icon: '⬆️'
  },
  upsell_not_converting: {
    feature: 'Upsell Optimization',
    description: 'Refine your upsell timing and positioning to increase conversion rates.',
    icon: '📈'
  },
  upsell_ad_hoc: {
    feature: 'Systematic Upsell Flow',
    description: 'Turn your ad-hoc upselling into a consistent, repeatable system.',
    icon: '🔄'
  },
  no_downsell: {
    feature: 'Downsell Strategy',
    description: 'Create a lower-priced option to capture customers who can\'t afford your main offer.',
    icon: '⬇️'
  },
  downsell_rarely_used: {
    feature: 'Downsell Automation',
    description: 'Build a system to automatically offer your downsell at the right moment.',
    icon: '⚡'
  },
  downsell_ad_hoc: {
    feature: 'Structured Downsell',
    description: 'Replace reactive discounting with a strategic downsell offer.',
    icon: '📋'
  },
  no_continuity: {
    feature: 'Continuity Offer Builder',
    description: 'Design a recurring revenue stream that creates predictable monthly income.',
    icon: '🔁'
  },
  continuity_failed: {
    feature: 'Continuity Relaunch',
    description: 'Redesign your continuity offer with proven retention strategies.',
    icon: '🔄'
  },
  continuity_small: {
    feature: 'Continuity Growth',
    description: 'Scale your existing recurring revenue with retention and upsell strategies.',
    icon: '📊'
  },
  no_tracking: {
    feature: 'Funnel Calculator',
    description: 'Track your entire funnel from awareness to conversion with our built-in analytics.',
    icon: '📈'
  },
  tracking_basic: {
    feature: 'Advanced Funnel Metrics',
    description: 'Go beyond basic tracking to understand conversion at every stage.',
    icon: '🎯'
  },
  tracking_partial: {
    feature: 'Complete Funnel View',
    description: 'Fill in the gaps in your tracking to see the full picture.',
    icon: '👁️'
  },
  no_crm: {
    feature: 'CRM Dashboard',
    description: 'Manage leads, track conversations, and never let a prospect fall through the cracks.',
    icon: '💾'
  },
  crm_basic: {
    feature: 'CRM Upgrade',
    description: 'Move from spreadsheets to a purpose-built system for managing your pipeline.',
    icon: '📊'
  },
  crm_underutilized: {
    feature: 'CRM Optimization',
    description: 'Get more from your CRM with templates, automations, and best practices.',
    icon: '⚙️'
  },
  // Alignment help
  misaligned: {
    feature: 'Realignment Journey',
    description: 'Discover what truly lights you up and build offers around your natural strengths instead of draining work.',
    icon: '🔄'
  },
  necessity: {
    feature: 'Energy Audit',
    description: 'Identify which parts of your work energise you vs drain you, and restructure your offers accordingly.',
    icon: '⚡'
  },
  searching: {
    feature: 'Flow Finder Discovery',
    description: 'Our AI-guided flow helps you identify the skills, problems, and personas that align with your natural strengths.',
    icon: '🔍'
  },
  some_alignment: {
    feature: 'Offer Refinement',
    description: 'Shift more of your income toward work that lights you up by refining your offer stack.',
    icon: '✨'
  },
  not_monetised: {
    feature: 'Monetisation Strategy',
    description: 'Turn what you love doing into income with a clear path from passion to paying customers.',
    icon: '💡'
  }
}

// Strength definitions
const STRENGTH_DEFINITIONS = {
  attraction_working: {
    icon: '✅',
    title: 'Strong Attraction Offer',
    description: 'Your front-end offer is bringing in new customers consistently.'
  },
  upsell_working: {
    icon: '✅',
    title: 'Strong Upsell',
    description: 'Your premium offer is converting well.'
  },
  downsell_working: {
    icon: '✅',
    title: 'Effective Downsell',
    description: 'You\'re capturing customers who would otherwise say no.'
  },
  continuity_strong: {
    icon: '✅',
    title: 'Strong Recurring Revenue',
    description: 'Your continuity offer is providing stable, predictable income.'
  },
  tracking_full: {
    icon: '✅',
    title: 'Full Funnel Tracking',
    description: 'You know your numbers at every stage - this is rare and powerful.'
  },
  crm_active: {
    icon: '✅',
    title: 'Active CRM Usage',
    description: 'You\'re systematically managing your customer relationships.'
  },
  // Alignment strengths
  energised: {
    icon: '✨',
    title: 'Work That Energises You',
    description: 'You genuinely love what you do - this is the foundation for sustainable success.'
  },
  well_aligned: {
    icon: '💰',
    title: 'Passion-Income Alignment',
    description: 'You\'re being well paid for work you enjoy. This is the goal!'
  }
}

export default function PublicOfferAuditFlow() {
  // Session management (no auth)
  const [sessionToken] = useState(() => {
    const existing = sessionStorage.getItem('publicFlowSession')
    if (existing) return existing
    const token = crypto.randomUUID()
    sessionStorage.setItem('publicFlowSession', token)
    return token
  })

  // Core state
  const [stage, setStage] = useState(STAGES.TIME_CHECK)
  const [questionsData, setQuestionsData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [error, setError] = useState(null)

  // Results state
  const [score, setScore] = useState(0)
  const [gaps, setGaps] = useState([])
  const [strengths, setStrengths] = useState([])
  const [helpItems, setHelpItems] = useState([])
  const [categoryLevels, setCategoryLevels] = useState({ journey: 1, alignment: 1, offerStack: null, systems: 1 })

  // Email gate state
  const [email, setEmail] = useState(null)
  const [name, setName] = useState(null)
  const [showEmailGate, setShowEmailGate] = useState(false)

  // Load questions JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(cacheBustUrl('/offer-audit-questions.json'))
        if (!res.ok) throw new Error('Failed to load assessment data')
        const data = await res.json()
        setQuestionsData(data)
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`)
      }
    }
    loadData()
  }, [])

  // Get active questions (filtering out conditional ones that shouldn't show)
  const getActiveQuestions = () => {
    if (!questionsData?.questions) return []

    return questionsData.questions.filter(q => {
      // If no conditional, always show
      if (!q.conditional) return true

      // Check if conditional is met
      const { field, values } = q.conditional
      const answerValue = answers[field]?.value
      return values.includes(answerValue)
    })
  }

  const activeQuestions = getActiveQuestions()
  const totalQuestions = activeQuestions.length
  const currentQuestion = activeQuestions[currentQuestionIndex]

  // Calculate results
  const calculateResults = () => {
    let totalScore = 0
    const identifiedGaps = []
    const identifiedStrengths = []
    const identifiedHelpItems = []

    // Calculate score and identify gaps/strengths/help items
    Object.entries(answers).forEach(([questionId, answer]) => {
      const questionScoring = SCORING[questionId]
      if (questionScoring && questionScoring[answer.value] !== undefined) {
        totalScore += questionScoring[answer.value]
      }

      // Check for gaps
      if (GAP_DEFINITIONS[answer.value]) {
        identifiedGaps.push(GAP_DEFINITIONS[answer.value])
      }

      // Check for strengths
      if (STRENGTH_DEFINITIONS[answer.value]) {
        identifiedStrengths.push(STRENGTH_DEFINITIONS[answer.value])
      }

      // Check for help items (any answer that has a help mapping)
      if (GAP_TO_HELP[answer.value]) {
        identifiedHelpItems.push(GAP_TO_HELP[answer.value])
      }
    })

    return {
      score: totalScore,
      gaps: identifiedGaps,
      strengths: identifiedStrengths,
      helpItems: identifiedHelpItems
    }
  }

  // Handle option selection
  const handleOptionSelect = (questionId, option) => {
    const newAnswers = {
      ...answers,
      [questionId]: { value: option.value, label: option.label }
    }
    setAnswers(newAnswers)

    // Track progress at 50%
    if (currentQuestionIndex === Math.floor(totalQuestions / 2)) {
      trackFlowProgress50('offer_audit')
    }

    // Check if this is the last question
    // Need to recalculate active questions with new answer
    const updatedActiveQuestions = questionsData.questions.filter(q => {
      if (!q.conditional) return true
      const { field, values } = q.conditional
      const answerValue = field === questionId ? option.value : newAnswers[field]?.value
      return values.includes(answerValue)
    })

    if (currentQuestionIndex < updatedActiveQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Questions complete - show email gate
      setShowEmailGate(true)
    }
  }

  // Handle email submission
  const handleEmailSubmit = async (submittedEmail, submittedName) => {
    setEmail(submittedEmail)
    setName(submittedName)
    setShowEmailGate(false)
    setStage(STAGES.CALCULATING)

    // Track email capture
    trackEmailCaptured('offer_audit')

    // Calculate results
    setTimeout(async () => {
      const results = calculateResults()
      setScore(results.score)
      setGaps(results.gaps)
      setStrengths(results.strengths)
      setHelpItems(results.helpItems)

      // Calculate category levels for wheel
      const levels = calculateCategoryLevels(answers)
      setCategoryLevels(levels)

      // Save to database
      try {
        await supabase.from('public_offer_audits').insert({
          session_token: sessionToken,
          respondent_name: submittedName,
          respondent_email: submittedEmail,
          responses: answers,
          score: results.score,
          gaps: results.gaps.map(g => g.title),
          strengths: results.strengths.map(s => s.title),
          category_levels: levels
        })

        // Save to public_leads
        await supabase.from('public_leads').upsert({
          email: submittedEmail,
          name: submittedName,
          source_flow: 'offer_audit',
          personalization_tokens: {
            name: submittedName,
            score: results.score,
            top_gap: results.gaps[0]?.title || null,
            wealth_ladder: answers.q2_wealth_ladder?.value || null,
            work_energy: answers.q2b_work_energy?.value || null,
            paid_alignment: answers.q2c_paid_alignment?.value || null,
            emotion: answers.q4_current_emotion?.value || null,
            category_levels: levels
          },
          flow_results: {
            score: results.score,
            gaps_count: results.gaps.length,
            strengths_count: results.strengths.length,
            category_levels: levels
          }
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })

        // Enroll in email sequence
        await supabase.functions.invoke('enroll-email-sequence', {
          body: {
            email: submittedEmail,
            name: submittedName,
            sequence_type: 'offer_audit',
            personalization_tokens: {
              name: submittedName,
              score: results.score,
              top_gap: results.gaps[0]?.title || null,
              wealth_ladder: answers.q2_wealth_ladder?.value || null,
              work_energy: answers.q2b_work_energy?.value || null,
              paid_alignment: answers.q2c_paid_alignment?.value || null
            }
          }
        })
      } catch (err) {
        console.error('Error saving assessment:', err)
      }

      // Track completion
      trackFlowCompleted('offer_audit', {
        score: results.score,
        gaps_count: results.gaps.length
      })

      setStage(STAGES.REVEAL)
    }, 1500)
  }

  // Go back handler
  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      setStage(STAGES.WELCOME)
    }
  }

  // Get score interpretation
  const getScoreInterpretation = (score) => {
    if (score >= 80) return { label: 'Excellent', description: 'Your offer stack is well-developed. Focus on optimization and scaling.' }
    if (score >= 60) return { label: 'Good', description: 'You have a solid foundation. A few strategic additions will unlock growth.' }
    if (score >= 40) return { label: 'Developing', description: 'You\'re building momentum. Filling key gaps will accelerate your progress.' }
    if (score >= 20) return { label: 'Early Stage', description: 'You\'re just getting started. Focus on your core offer first, then expand.' }
    return { label: 'Foundation Needed', description: 'Time to build your offer stack from the ground up. Start with one strong offer.' }
  }

  // Check if user is pre-ladder (still discovering, no business yet)
  // Also treat "exploring from day job" as pre-ladder since they skip q2
  const isPreLadder = answers.q2_wealth_ladder?.value === 'pre_ladder' ||
    answers.q1_journey_stage?.value === 'employed_exploring'

  // Generate PDF content
  const generatePdfContent = () => {
    const interpretation = getScoreInterpretation(score)
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Generate wheel visualization for PDF
    const generateWheelHtml = () => {
      const categories = [
        { name: 'Journey Clarity', icon: '🧭', color: '#8B5CF6', level: categoryLevels.journey },
        { name: 'Alignment', icon: '✨', color: '#EC4899', level: categoryLevels.alignment },
        { name: 'Offer Stack', icon: '📦', color: '#F59E0B', level: categoryLevels.offerStack },
        { name: 'Systems', icon: '📊', color: '#10B981', level: categoryLevels.systems }
      ]

      return `
        <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <h3 style="font-size: 16px; color: rgba(255,255,255,0.9); margin: 0 0 20px; text-align: center;">Your Assessment Levels</h3>
          ${categories.map(cat => {
            const isNA = cat.level === null
            const levelName = isNA ? 'N/A' : LEVELS[cat.level].name
            const levelBars = isNA ? '' : Array.from({ length: 3 }, (_, i) => {
              const filled = i < cat.level
              return `<div style="width: 60px; height: 8px; background: ${filled ? cat.color : 'rgba(255,255,255,0.2)'}; border-radius: 4px;"></div>`
            }).join('')

            return `
              <div style="display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 24px;">${cat.icon}</div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: white;">${cat.name}</div>
                  <div style="font-size: 13px; color: ${isNA ? 'rgba(255,255,255,0.4)' : cat.color};">${levelName}</div>
                </div>
                <div style="display: flex; gap: 4px;">
                  ${isNA ? '<span style="color: rgba(255,255,255,0.4); font-size: 12px;">Not applicable</span>' : levelBars}
                </div>
              </div>
            `
          }).join('')}
        </div>
      `
    }

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px; min-height: 100vh;">
        <div style="text-align: center; border-bottom: 2px solid rgba(251, 191, 36, 0.3); padding-bottom: 24px; margin-bottom: 32px;">
          <div style="font-size: 28px; font-weight: 700; color: #fbbf24;">Find My Flow</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">Offer Audit Results</div>
        </div>

        ${generateWheelHtml()}

        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 24px; font-weight: 600;">${interpretation.label}</div>
          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-top: 8px;">${interpretation.description}</div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 16px;">Generated on ${date}</div>
        </div>

        ${gaps.length > 0 ? `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="font-size: 18px; color: #fca5a5; margin: 0 0 16px;">Gaps to Address</h3>
            ${gaps.map(gap => `
              <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: 700;">${gap.icon} ${gap.title}</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.7);">${gap.description}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${strengths.length > 0 ? `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="font-size: 18px; color: #6ee7b7; margin: 0 0 16px;">Your Strengths</h3>
            ${strengths.map(s => `
              <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: 700;">${s.icon} ${s.title}</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.7);">${s.description}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 12px;">
          <p>Ready to build your complete offer stack?</p>
          <p style="margin-top: 24px;">© ${new Date().getFullYear()} Find My Flow | findmyflow.nichuzz.com</p>
        </div>
      </div>
    `
  }

  // ============ RENDER ============

  // Loading state
  if (!questionsData) {
    return (
      <div className="offer-audit-flow">
        <div className="loading-state">
          {error ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
              <h2>Error Loading Assessment</h2>
              <p>{error}</p>
            </div>
          ) : (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Email Gate
  if (showEmailGate) {
    return (
      <div className="offer-audit-flow">
        <div className="progress-container">
          <div className="progress-dots">
            {activeQuestions.map((_, i) => (
              <div
                key={i}
                className={`progress-dot ${i < currentQuestionIndex ? 'completed' : ''} ${i === currentQuestionIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        <PublicEmailGate
          flowType="offer_audit"
          onEmailSubmit={handleEmailSubmit}
          title="Your results are ready!"
          subtitle="Enter your email to see your Offer Audit score and personalized recommendations"
        />
      </div>
    )
  }

  // Time Check
  if (stage === STAGES.TIME_CHECK) {
    return (
      <div className="offer-audit-flow">
        <div className="welcome-container">
          <h1 className="welcome-greeting">Offer Audit</h1>
          <div className="welcome-message">
            <p><span className="time-icon">⏱️</span></p>
            <p><strong>This takes about 2-3 minutes</strong></p>
            <p className="explainer-text">
              The key to <strong>monetising your mission for location + financial independence</strong> is creating a business model that maximises how much you're paid for doing stuff that lights you up.
            </p>
            <p className="explainer-text">
              This means building an <strong>offer stack</strong> — a strategic combination of products at different price points that maximises customer value while playing to your strengths.
            </p>
            <p className="explainer-highlight">
              This quick audit will reveal where you are on your journey, which pieces you have in place, and where to focus next.
            </p>
          </div>
          <button
            className="primary-button glow-button"
            onClick={() => {
              trackFlowStarted('offer_audit')
              setStage(STAGES.WELCOME)
            }}
          >
            I've Got Time, Let's Go
          </button>
        </div>
      </div>
    )
  }

  // Welcome
  if (stage === STAGES.WELCOME) {
    return (
      <div className="offer-audit-flow">
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">What We'll Assess</h1>
            <div className="audit-checklist">
              <div className="checklist-item">
                <span className="checklist-icon">🧭</span>
                <div className="checklist-text">
                  <strong>Where You Are on Your Journey</strong>
                  <span>Your current stage and what you've built so far</span>
                </div>
              </div>
              <div className="checklist-item">
                <span className="checklist-icon">📦</span>
                <div className="checklist-text">
                  <strong>Your Offer Stack</strong>
                  <span>Attraction, upsell, downsell, and continuity offers</span>
                </div>
              </div>
              <div className="checklist-item">
                <span className="checklist-icon">📊</span>
                <div className="checklist-text">
                  <strong>Your Systems & Analytics</strong>
                  <span>CRM and funnel tracking to measure growth</span>
                </div>
              </div>
            </div>
            <p className="welcome-note">Answer honestly based on where your business is today — not where you want it to be.</p>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.QUESTIONS)}>
            Let's Audit My Offers
          </button>
          <BackButton onClick={() => setStage(STAGES.TIME_CHECK)} />
        </div>
      </div>
    )
  }

  // Questions
  if (stage === STAGES.QUESTIONS && currentQuestion) {
    return (
      <div className="offer-audit-flow">
        <div className="progress-container">
          <div className="progress-dots">
            {activeQuestions.map((_, i) => (
              <div
                key={i}
                className={`progress-dot ${i < currentQuestionIndex ? 'completed' : ''} ${i === currentQuestionIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="question-container">
          <div className="question-number">Question {currentQuestionIndex + 1} of {totalQuestions}</div>
          <h2 className="question-text">{currentQuestion.question}</h2>
          {currentQuestion.subtext && <p className="question-subtext">{currentQuestion.subtext}</p>}
          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className="option-card"
                onClick={() => handleOptionSelect(currentQuestion.id, option)}
              >
                <div className="option-label">{option.label}</div>
                {option.description && <div className="option-description">{option.description}</div>}
              </button>
            ))}
          </div>
          <BackButton onClick={goBack} />
        </div>
      </div>
    )
  }

  // Calculating
  if (stage === STAGES.CALCULATING) {
    return (
      <div className="offer-audit-flow">
        <div className="calculating-container">
          <h2 className="calculating-title">Analysing Your Answers...</h2>
          <div className="calculating-steps">
            <div className="calculating-step active">Evaluating your journey stage</div>
            <div className="calculating-step active">Assessing offer stack completeness</div>
            <div className="calculating-step active">Identifying gaps and opportunities</div>
          </div>
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // Reveal Results
  if (stage === STAGES.REVEAL) {
    const interpretation = getScoreInterpretation(score)
    const flowResults = {
      score,
      gaps_count: gaps.length,
      strengths_count: strengths.length,
      categoryLevels,
      flow_type: 'offer_audit'
    }

    // Pre-ladder users get a different experience focused on discovery
    if (isPreLadder) {
      return (
        <div className="offer-audit-flow">
          <div className="reveal-container">
            <div className="reveal-badge">Your Journey Assessment</div>

            {/* Wheel showing only Journey Clarity */}
            <AuditWheel categoryLevels={categoryLevels} />

            <h2 className="score-interpretation">You're at the Discovery Stage</h2>
            <p className="score-description">
              You're still exploring what to build — and that's exactly the right place to start.
              Most entrepreneurs rush into building before they have clarity, which leads to wasted time and frustration.
            </p>

            {/* Discovery Stage Content */}
            <div className="discovery-section">
              <h3 className="discovery-title">What This Means</h3>
              <div className="discovery-items">
                <div className="discovery-item">
                  <span className="discovery-icon">🧭</span>
                  <div className="discovery-content">
                    <h4>Journey Clarity: {LEVELS[categoryLevels.journey].name}</h4>
                    <p>
                      {categoryLevels.journey === 3
                        ? "You have strong clarity on your direction — you know what excites you and where you want to go."
                        : categoryLevels.journey === 2
                        ? "You're building clarity on your path. Some pieces are coming together."
                        : "You're still figuring out your direction. That's okay — discovery takes time."}
                    </p>
                  </div>
                </div>
                <div className="discovery-item">
                  <span className="discovery-icon">📦</span>
                  <div className="discovery-content">
                    <h4>Offer Stack: Not Yet Applicable</h4>
                    <p>Once you've validated your idea and found your first customers, you'll build out your offer stack (attraction, upsell, downsell, continuity).</p>
                  </div>
                </div>
                <div className="discovery-item">
                  <span className="discovery-icon">📊</span>
                  <div className="discovery-content">
                    <h4>Systems: Not Yet Applicable</h4>
                    <p>CRM and funnel tracking become important once you have something to sell. For now, focus on discovery.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps for Discovery Stage */}
            <div className="help-section">
              <h3 className="help-title">Your Next Steps</h3>
              <p className="help-subtitle">Here's what to focus on at this stage:</p>
              <div className="help-item">
                <span className="help-icon">🎯</span>
                <div className="help-content">
                  <h4 className="help-feature">Flow Finder: Discover Your Unique Strengths</h4>
                  <p className="help-description">An AI-guided flow that helps you identify the skills, problems, and personas that align with your natural strengths.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">💡</span>
                <div className="help-content">
                  <h4 className="help-feature">Validation Before Building</h4>
                  <p className="help-description">Test your ideas with real people before investing time building something nobody wants.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">🗺️</span>
                <div className="help-content">
                  <h4 className="help-feature">Clear Roadmap to Follow</h4>
                  <p className="help-description">A step-by-step journey from discovery to your first paying customers — no guesswork required.</p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <DownloadResultsButton
              label="Download Your Results"
              onDownload={() => {
                const pdfContent = generatePdfContent()
                const printWindow = window.open('', '_blank', 'width=800,height=600')
                if (!printWindow) {
                  alert('Please allow popups to download your PDF')
                  return
                }
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head><title>Journey Assessment - Find My Flow</title></head>
                  <body style="margin: 0;">
                    ${pdfContent}
                    <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
                  </body>
                  </html>
                `)
                printWindow.document.close()
              }}
            />

            {/* Feedback */}
            <FlowFeedback
              flowType="offer_audit"
              sessionToken={sessionToken}
            />

            {/* CTA */}
            <PublicFlowCTA
              email={email}
              flowType="offer_audit"
              flowResults={flowResults}
              answers={answers}
            />
          </div>
        </div>
      )
    }

    // Regular results for users with a business
    return (
      <div className="offer-audit-flow">
        <div className="reveal-container">
          <div className="reveal-badge">Your Offer Audit Results</div>

          {/* Wheel Visualization */}
          <AuditWheel categoryLevels={categoryLevels} />

          <h2 className="score-interpretation">{interpretation.label}</h2>
          <p className="score-description">{interpretation.description}</p>

          {/* Gaps Section */}
          {gaps.length > 0 && (
            <div className="gaps-section">
              <h3 className="gaps-title">Gaps to Address ({gaps.length})</h3>
              {gaps.map((gap, index) => (
                <div key={index} className="gap-item">
                  <span className="gap-icon">{gap.icon}</span>
                  <div className="gap-content">
                    <h4 className="gap-title">{gap.title}</h4>
                    <p className="gap-description">{gap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Strengths Section */}
          {strengths.length > 0 && (
            <div className="strengths-section">
              <h3 className="strengths-title">Your Strengths ({strengths.length})</h3>
              {strengths.map((strength, index) => (
                <div key={index} className="strength-item">
                  <span className="gap-icon">{strength.icon}</span>
                  <div className="gap-content">
                    <h4 className="gap-title">{strength.title}</h4>
                    <p className="gap-description">{strength.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* How Find My Flow Will Help Section */}
          {helpItems.length > 0 && (
            <div className="help-section">
              <h3 className="help-title">How Find My Flow Will Help</h3>
              <p className="help-subtitle">Based on your answers, here's how we can support you:</p>
              {helpItems.map((item, index) => (
                <div key={index} className="help-item">
                  <span className="help-icon">{item.icon}</span>
                  <div className="help-content">
                    <h4 className="help-feature">{item.feature}</h4>
                    <p className="help-description">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Download Button */}
          <DownloadResultsButton
            label="Download Your Results"
            onDownload={() => {
              const pdfContent = generatePdfContent()
              const printWindow = window.open('', '_blank', 'width=800,height=600')
              if (!printWindow) {
                alert('Please allow popups to download your PDF')
                return
              }
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head><title>Offer Audit Results - Find My Flow</title></head>
                <body style="margin: 0;">
                  ${pdfContent}
                  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
                </body>
                </html>
              `)
              printWindow.document.close()
            }}
          />

          {/* Feedback */}
          <FlowFeedback
            flowType="offer_audit"
            sessionToken={sessionToken}
          />

          {/* CTA */}
          <PublicFlowCTA
            email={email}
            flowType="offer_audit"
            flowResults={flowResults}
            answers={answers}
          />
        </div>
      </div>
    )
  }

  return null
}
