/**
 * A/B Testing Utilities
 *
 * Simple A/B testing system for public flows.
 * Assigns users to variants and tracks conversions.
 */

import { supabase } from './supabaseClient'
import { trackCTAClicked } from './pixelTracking'

// ============================================
// CTA VARIANTS
// ============================================

export const CTA_VARIANTS = {
  // Variant A: Original (Control)
  control: {
    id: 'control',
    title: "Want to learn how to build your own tech tools with AI?",
    continueButton: "Continue to Find My Flow →",
    interestOptions: [
      { value: 'yes', label: "Yes, I'm interested", icon: '🚀' },
      { value: 'maybe', label: 'Maybe later', icon: '🤔' },
      { value: 'no', label: 'No thanks', icon: '👋' }
    ]
  },

  // Variant B: Urgency + Personal
  urgency: {
    id: 'urgency',
    title: "Ready to turn your results into action?",
    continueButton: "Start Building My Business →",
    interestOptions: [
      { value: 'yes', label: "Yes, show me how!", icon: '⚡' },
      { value: 'maybe', label: 'Not yet', icon: '⏰' },
      { value: 'no', label: 'Just exploring', icon: '👀' }
    ]
  },

  // Variant C: Value-focused
  value: {
    id: 'value',
    title: "Get a personalized roadmap to bring this to life",
    continueButton: "See My Roadmap →",
    interestOptions: [
      { value: 'yes', label: "Yes, I need this!", icon: '🎯' },
      { value: 'maybe', label: 'Tell me more first', icon: '💭' },
      { value: 'no', label: 'Not now', icon: '✌️' }
    ]
  }
}

// Active test configuration
const ACTIVE_CTA_TEST = {
  testName: 'cta_variant_jan2026',
  variants: ['control', 'urgency', 'value'],
  weights: [0.34, 0.33, 0.33] // Equal distribution
}

// ============================================
// VARIANT ASSIGNMENT
// ============================================

/**
 * Get or assign a CTA variant for this session
 * Uses sessionStorage for consistency within a session
 */
export function getCtaVariant(sessionToken) {
  // Check if already assigned in this session
  const stored = sessionStorage.getItem('ab_cta_variant')
  if (stored && CTA_VARIANTS[stored]) {
    return CTA_VARIANTS[stored]
  }

  // Assign a new variant based on weights
  const variant = assignVariant(ACTIVE_CTA_TEST.variants, ACTIVE_CTA_TEST.weights)

  // Store in session
  sessionStorage.setItem('ab_cta_variant', variant)

  // Record assignment in database (non-blocking)
  recordAssignment(sessionToken, ACTIVE_CTA_TEST.testName, variant).catch(console.error)

  return CTA_VARIANTS[variant]
}

/**
 * Weighted random variant selection
 */
function assignVariant(variants, weights) {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < variants.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return variants[i]
    }
  }

  return variants[variants.length - 1]
}

/**
 * Record variant assignment in database
 */
async function recordAssignment(sessionToken, testName, variant) {
  try {
    await supabase.from('ab_test_assignments').insert({
      session_token: sessionToken,
      test_name: testName,
      variant: variant
    })
  } catch (err) {
    // Ignore duplicate key errors (already assigned)
    if (!err.message?.includes('duplicate')) {
      console.error('Error recording A/B assignment:', err)
    }
  }
}

// ============================================
// CONVERSION TRACKING
// ============================================

/**
 * Track a conversion event for the A/B test
 * @param {string} sessionToken - Session identifier
 * @param {string} email - User email (optional)
 * @param {string} conversionType - Type of conversion (e.g., 'cta_clicked', 'interest_yes')
 * @param {object} metadata - Additional data
 */
export async function trackAbConversion(sessionToken, email, conversionType, metadata = {}) {
  const variant = sessionStorage.getItem('ab_cta_variant') || 'unknown'

  // Track to pixels
  trackCTAClicked(metadata.flowType, variant)

  try {
    await supabase.from('ab_test_conversions').insert({
      session_token: sessionToken,
      test_name: ACTIVE_CTA_TEST.testName,
      variant: variant,
      conversion_type: conversionType,
      email: email,
      metadata: metadata
    })
  } catch (err) {
    console.error('Error tracking A/B conversion:', err)
  }
}

/**
 * Track when user expresses interest
 */
export async function trackCtaInterest(sessionToken, email, interest, flowType) {
  await trackAbConversion(sessionToken, email, `interest_${interest}`, {
    flowType,
    interest
  })
}

/**
 * Track when user clicks continue to main site
 */
export async function trackCtaContinue(sessionToken, email, flowType) {
  await trackAbConversion(sessionToken, email, 'cta_continue', {
    flowType
  })
}

export default {
  CTA_VARIANTS,
  getCtaVariant,
  trackAbConversion,
  trackCtaInterest,
  trackCtaContinue
}
