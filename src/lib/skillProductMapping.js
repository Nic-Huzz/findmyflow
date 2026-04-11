import { resolveSkillId } from './wheelTaxonomy'

/**
 * Skill-Product Mapping (v2)
 *
 * Maps Skills Wheel taxonomy segments (10 categories) to product types for the Offer Builder.
 * Each category maps directly to product recommendations.
 *
 * Used in:
 * - OfferBuilderFlow.jsx (Q8 solution type suggestions)
 * - ProductSelectionFlow.jsx (mechanism & feature suggestions)
 */

export const PRODUCT_MAPPINGS = {
  storytelling: {
    segment: 'storytelling',
    tagline: 'Writing, narrative, making meaning through story',
    primary: [
      { category: 'product', type: 'digital_product', label: 'Book / Ebook', icon: '📖' },
      { category: 'product', type: 'content_newsletter', label: 'Newsletter', icon: '📧' },
    ],
    secondary: [
      { category: 'productized', type: 'live_group', label: 'Memoir Workshop', icon: '👥' },
      { category: 'product', type: 'content', label: 'Content / Brand Stories', icon: '🎙️' },
    ],
    proficiencyGuidance: {
      mastering: 'Your stories are the product. Books, keynote narratives, brand storytelling consulting.',
      establishing: 'Start a newsletter or write guest pieces to build your voice publicly.',
      emerging: 'Journal daily and share small pieces. Your voice is still forming.',
    },
  },

  teaching: {
    segment: 'teaching',
    tagline: 'Explaining, simplifying, making the complex click',
    primary: [
      { category: 'productized', type: 'automated_group', label: 'Self-Paced Course', icon: '🎬' },
      { category: 'product', type: 'digital_product', label: 'Framework / Guide', icon: '📄' },
    ],
    secondary: [
      { category: 'productized', type: 'live_group', label: 'Live Cohort', icon: '👥' },
      { category: 'service', type: 'packaged_service', label: 'Workshop', icon: '📋' },
    ],
    proficiencyGuidance: {
      mastering: 'Create a flagship course or comprehensive framework. Charge premium.',
      establishing: 'Start with a smaller digital product (ebook, template pack) to build proof.',
      emerging: 'Guest teach or collaborate on someone else\'s course to develop the skill.',
    },
  },

  coaching: {
    segment: 'coaching',
    tagline: 'Growing people, mentoring, holding space',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Custom Service (1:1)', icon: '🎯' },
      { category: 'productized', type: 'live_group', label: 'Group Program', icon: '👥' },
    ],
    secondary: [
      { category: 'productized', type: 'membership', label: 'Membership', icon: '🏠' },
      { category: 'service', type: 'packaged_service', label: 'Retreat', icon: '📋' },
    ],
    proficiencyGuidance: {
      mastering: 'Lead a premium 1:1 practice or signature group program.',
      establishing: 'Offer coaching packages at mid-tier pricing. Document your methodology.',
      emerging: 'Peer coaching or accountability partnerships to build hours and confidence.',
    },
  },

  performing: {
    segment: 'performing',
    tagline: 'Stage, speaking, presenting, being the show',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Keynote Speaking', icon: '🎯' },
      { category: 'product', type: 'content', label: 'Podcast / YouTube', icon: '🎙️' },
    ],
    secondary: [
      { category: 'service', type: 'packaged_service', label: 'MC / Event Host', icon: '📋' },
      { category: 'productized', type: 'live_group', label: 'Live Workshop', icon: '👥' },
    ],
    proficiencyGuidance: {
      mastering: 'Premium keynotes and speaking circuits. Your presence is the product.',
      establishing: 'Start a podcast or YouTube channel. Speak at smaller events to build reel.',
      emerging: 'Practice on camera. Open mics, local events, social media lives.',
    },
  },

  creating: {
    segment: 'creating',
    tagline: 'Inventing, art, making things that didn\'t exist',
    primary: [
      { category: 'product', type: 'digital_product', label: 'Creative Product / IP', icon: '📄' },
      { category: 'productized', type: 'live_group', label: 'Creative Workshop', icon: '👥' },
    ],
    secondary: [
      { category: 'service', type: 'custom_service', label: 'Creative Direction', icon: '🎯' },
      { category: 'product', type: 'physical_product', label: 'Art / Physical Product', icon: '📦' },
    ],
    proficiencyGuidance: {
      mastering: 'Your original work IS the product. Lead with what makes it uniquely yours.',
      establishing: 'Infuse originality into a proven format (course, service, product).',
      emerging: 'Experiment widely. Your creative voice is still forming.',
    },
  },

  building: {
    segment: 'building',
    tagline: 'Making with hands, prototyping, shipping, craft',
    primary: [
      { category: 'product', type: 'software', label: 'Software / SaaS', icon: '💻' },
      { category: 'product', type: 'physical_product', label: 'Physical Product', icon: '📦' },
    ],
    secondary: [
      { category: 'productized', type: 'managed_service', label: 'Done-For-You', icon: '⚙️' },
      { category: 'product', type: 'digital_product', label: 'Digital Product', icon: '📄' },
    ],
    proficiencyGuidance: {
      mastering: 'Build and sell your own product. Premium positioning.',
      establishing: 'Build for others (Done-For-You) or contribute to a team product.',
      emerging: 'Prototype, but don\'t ship solo yet. Partner with someone who can polish.',
    },
  },

  designing: {
    segment: 'designing',
    tagline: 'Aesthetics, taste, beauty, shaping how things feel',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Custom Design', icon: '🎯' },
      { category: 'product', type: 'digital_product', label: 'Templates & Design Systems', icon: '📄' },
    ],
    secondary: [
      { category: 'service', type: 'packaged_service', label: 'Experience Design', icon: '📋' },
    ],
    proficiencyGuidance: {
      mastering: 'Premium custom design services or experience design consulting.',
      establishing: 'Create design templates and systems as digital products while building client work.',
      emerging: 'Contribute to others\' projects. Build a portfolio before going solo.',
    },
  },

  leading: {
    segment: 'leading',
    tagline: 'Strategy, vision, game-design, organizing, running things',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Consulting / Advisory', icon: '🎯' },
      { category: 'service', type: 'packaged_service', label: 'Strategy Packages', icon: '📋' },
    ],
    secondary: [
      { category: 'productized', type: 'live_group', label: 'Mastermind', icon: '👥' },
      { category: 'productized', type: 'managed_service', label: 'Fractional Leadership', icon: '⚙️' },
    ],
    proficiencyGuidance: {
      mastering: 'Premium consulting, fractional leadership, or mastermind facilitation.',
      establishing: 'Packaged strategy audits at fixed pricing. Lower risk for buyers.',
      emerging: 'Offer free strategy sessions to build a portfolio of recommendations.',
    },
  },

  connecting: {
    segment: 'connecting',
    tagline: 'Community, gathering, hosting, introducing, being glue',
    primary: [
      { category: 'productized', type: 'membership', label: 'Membership / Community', icon: '🏠' },
      { category: 'productized', type: 'live_group', label: 'Live Cohort / Retreat', icon: '👥' },
    ],
    secondary: [
      { category: 'service', type: 'packaged_service', label: 'Facilitation Service', icon: '📋' },
    ],
    proficiencyGuidance: {
      mastering: 'Launch a paid membership or recurring mastermind. You ARE the draw.',
      establishing: 'Facilitate within someone else\'s community or co-host events.',
      emerging: 'Build a free community first to develop facilitation skills.',
    },
  },

  speaking_up: {
    segment: 'speaking_up',
    tagline: 'Truth-telling, activism, courage, standing for something',
    primary: [
      { category: 'product', type: 'content', label: 'Content / Newsletter', icon: '🎙️' },
      { category: 'service', type: 'packaged_service', label: 'Advocacy / Campaign', icon: '📋' },
    ],
    secondary: [
      { category: 'productized', type: 'live_group', label: 'Movement / Cause Community', icon: '👥' },
      { category: 'service', type: 'custom_service', label: 'Speaking', icon: '🎯' },
    ],
    proficiencyGuidance: {
      mastering: 'Your platform and voice are the product. Speaking, writing, movement leadership.',
      establishing: 'Build an audience around your cause. Newsletter, podcast, social content.',
      emerging: 'Start sharing your perspective publicly in small forums. Find your angle.',
    },
  },
}

// Legacy compatibility: DIRECT_MAPPINGS and AMPLIFIER_MAPPINGS point to PRODUCT_MAPPINGS
export const DIRECT_MAPPINGS = PRODUCT_MAPPINGS
export const AMPLIFIER_MAPPINGS = {}

/**
 * Get product suggestions for a skill cluster
 *
 * @param {Object} cluster - The skill cluster with taxonomy_keys
 * @param {string} cluster.taxonomy_keys - Array of segment IDs from wheelTaxonomy.js
 * @param {string} cluster.proficiency - 'emerging' | 'establishing' | 'mastering'
 * @param {string} cluster.cluster_label - The AI-generated cluster name (fallback)
 * @returns {Object} { suggestions: [], amplifierMessage: string|null, proficiencyTip: string|null }
 */
export function getSkillProductSuggestions(cluster) {
  const taxonomyKeys = cluster?.taxonomy_keys || []
  const proficiency = cluster?.proficiency || 'establishing'
  const clusterLabel = cluster?.cluster_label || ''

  let suggestions = []
  let amplifierMessage = null
  let proficiencyTip = null

  // Try taxonomy-based mapping
  for (const rawKey of taxonomyKeys) {
    const key = resolveSkillId(rawKey) || rawKey
    if (PRODUCT_MAPPINGS[key]) {
      const mapping = PRODUCT_MAPPINGS[key]
      suggestions.push(...mapping.primary.slice(0, 2).map(s => ({
        ...s,
        reason: mapping.tagline,
        skillSegment: key
      })))
      proficiencyTip = mapping.proficiencyGuidance[proficiency]
      break
    }
  }

  // Fallback: label-based heuristics
  if (suggestions.length === 0) {
    const label = clusterLabel.toLowerCase()

    // Map label keywords to new category ids
    const labelMap = [
      [['story', 'narrative', 'memoir', 'write', 'journal', 'blog'], 'storytelling'],
      [['teach', 'explain', 'clarif', 'simplif', 'framework'], 'teaching'],
      [['coach', 'mentor', 'nurtur', 'hold space', 'support'], 'coaching'],
      [['perform', 'speak', 'present', 'stage', 'keynote', 'podcast'], 'performing'],
      [['creat', 'art', 'invent', 'original'], 'creating'],
      [['build', 'develop', 'engineer', 'code', 'prototype'], 'building'],
      [['design', 'visual', 'ux', 'aesthetic'], 'designing'],
      [['strateg', 'plan', 'consult', 'organiz', 'system', 'operation', 'lead'], 'leading'],
      [['connect', 'facilitat', 'network', 'communit', 'host'], 'connecting'],
      [['advocate', 'activis', 'truth', 'courage', 'speak up', 'justice'], 'speaking_up'],
      // Absorbed old terms
      [['analyz', 'research', 'data', 'pattern'], 'teaching'],
      [['influenc', 'sell', 'persuad', 'motivat'], 'performing'],
      [['express', 'voice'], 'storytelling'],
      [['synthes', 'integrat', 'big picture', 'wisdom'], 'teaching'],
    ]

    for (const [keywords, categoryId] of labelMap) {
      if (keywords.some(kw => label.includes(kw))) {
        const mapping = PRODUCT_MAPPINGS[categoryId]
        if (mapping) {
          suggestions = mapping.primary.slice(0, 2).map(s => ({
            ...s,
            reason: mapping.tagline,
            skillSegment: categoryId,
          }))
          proficiencyTip = mapping.proficiencyGuidance[proficiency]
          break
        }
      }
    }
  }

  // Generic fallback
  if (suggestions.length === 0) {
    if (proficiency === 'mastering') {
      suggestions = [
        { category: 'service', type: 'custom_service', label: 'Premium Service', icon: '🎯', reason: `Leverage your mastery in ${clusterLabel}` }
      ]
    } else {
      suggestions = [
        { category: 'productized', type: 'live_group', label: 'Group Program', icon: '👥', reason: `Share your ${clusterLabel} journey with others` }
      ]
    }
  }

  return {
    suggestions: suggestions.slice(0, 2),
    amplifierMessage,
    proficiencyTip,
    isAmplifier: false,
  }
}

/**
 * Get all segments from a user's skill clusters
 */
export function getSegmentsFromClusters(clusters) {
  const segmentMap = new Map()

  for (const cluster of clusters) {
    const keys = cluster.taxonomy_keys || []
    for (const key of keys) {
      const existing = segmentMap.get(key)
      const proficiencyRank = { emerging: 1, establishing: 2, mastering: 3 }
      if (!existing || proficiencyRank[cluster.proficiency] > proficiencyRank[existing.proficiency]) {
        segmentMap.set(key, {
          segment: key,
          proficiency: cluster.proficiency,
          clusterLabel: cluster.cluster_label
        })
      }
    }
  }

  return Array.from(segmentMap.values())
}

/**
 * Check if a user has any amplifier skills (legacy compat, always returns false in v2)
 */
export function hasAmplifierSkills() {
  return false
}

/**
 * Get amplifier messages (legacy compat, returns empty in v2)
 */
export function getAmplifierMessages() {
  return []
}
