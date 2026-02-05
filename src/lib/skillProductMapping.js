/**
 * Skill-Product Mapping
 *
 * Maps Skills Wheel taxonomy segments to product types for the Offer Builder.
 * See docs/skill-product-mapping.md for full documentation.
 *
 * Used in:
 * - OfferBuilderFlow.jsx (Q8 solution type suggestions)
 * - ProductSelectionFlow.jsx (mechanism & feature suggestions)
 */

/**
 * Direct Mappings (8 of 12)
 * These segments point to specific product types
 */
export const DIRECT_MAPPINGS = {
  building: {
    segment: 'building',
    tagline: 'You turn ideas into reality',
    primary: [
      { category: 'product', type: 'software', label: 'Software/SaaS', icon: '💻' },
      { category: 'product', type: 'digital_product', label: 'Digital Product', icon: '📄' },
      { category: 'product', type: 'physical_product', label: 'Physical Product', icon: '📦' }
    ],
    secondary: [
      { category: 'productized', type: 'managed_service', label: 'Done-For-You', icon: '⚙️' }
    ],
    proficiencyGuidance: {
      mastering: 'Build and sell your own product. Premium positioning.',
      establishing: 'Build for others (Done-For-You) or contribute to a team product.',
      emerging: 'Prototype, but don\'t ship solo yet. Partner with someone who can polish.'
    }
  },

  clarifying: {
    segment: 'clarifying',
    tagline: 'You make the complex simple',
    primary: [
      { category: 'productized', type: 'automated_group', label: 'Self-Paced Course', icon: '🎬' },
      { category: 'product', type: 'digital_product', label: 'Digital Product', icon: '📄' }
    ],
    secondary: [
      { category: 'productized', type: 'live_group', label: 'Live Cohort', icon: '👥' },
      { category: 'service', type: 'packaged_service', label: 'Packaged Service', icon: '📋' }
    ],
    proficiencyGuidance: {
      mastering: 'Create a flagship course or comprehensive guide. Charge premium.',
      establishing: 'Start with a smaller digital product (ebook, template pack) to build proof.',
      emerging: 'Guest teach or collaborate on someone else\'s course to develop the skill.'
    }
  },

  nurturing: {
    segment: 'nurturing',
    tagline: 'You develop potential in others',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Custom Service (1:1)', icon: '🎯' },
      { category: 'productized', type: 'live_group', label: 'Group Program', icon: '👥' }
    ],
    secondary: [
      { category: 'productized', type: 'membership', label: 'Membership', icon: '🏠' },
      { category: 'service', type: 'packaged_service', label: 'Packaged Service', icon: '📋' }
    ],
    proficiencyGuidance: {
      mastering: 'Lead a premium 1:1 practice or signature group program.',
      establishing: 'Offer coaching packages at mid-tier pricing. Document your methodology.',
      emerging: 'Peer coaching or accountability partnerships to build hours and confidence.'
    }
  },

  connecting: {
    segment: 'connecting',
    tagline: 'You bring people together',
    primary: [
      { category: 'productized', type: 'membership', label: 'Membership', icon: '🏠' },
      { category: 'productized', type: 'live_group', label: 'Live Cohort', icon: '👥' }
    ],
    secondary: [
      { category: 'service', type: 'packaged_service', label: 'Facilitation Service', icon: '📋' }
    ],
    proficiencyGuidance: {
      mastering: 'Launch a paid membership or recurring mastermind. You ARE the draw.',
      establishing: 'Facilitate within someone else\'s community or co-host events.',
      emerging: 'Build a free community first to develop facilitation skills.'
    }
  },

  organizing: {
    segment: 'organizing',
    tagline: 'You create order from chaos',
    primary: [
      { category: 'productized', type: 'managed_service', label: 'Done-For-You', icon: '⚙️' },
      { category: 'product', type: 'software', label: 'Software/SaaS', icon: '💻' },
      { category: 'service', type: 'packaged_service', label: 'Packaged Service', icon: '📋' }
    ],
    secondary: [
      { category: 'product', type: 'digital_product', label: 'Templates & SOPs', icon: '📄' }
    ],
    proficiencyGuidance: {
      mastering: 'Sell your systems — either as a service (Done-For-You setup) or as a tool (SaaS).',
      establishing: 'Create template packs and SOPs as digital products.',
      emerging: 'Document and systematise your own workflow first. Sell it once it\'s proven.'
    }
  },

  strategizing: {
    segment: 'strategizing',
    tagline: 'You think 10 moves ahead',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Consulting', icon: '🎯' },
      { category: 'service', type: 'packaged_service', label: 'Strategy Packages', icon: '📋' }
    ],
    secondary: [
      { category: 'productized', type: 'live_group', label: 'Mastermind', icon: '👥' }
    ],
    proficiencyGuidance: {
      mastering: 'Premium 1:1 consulting or strategy retainers. Mastermind facilitation.',
      establishing: 'Packaged strategy audits at fixed pricing. Lower risk for buyers.',
      emerging: 'Offer free strategy sessions to build a portfolio of recommendations.'
    }
  },

  analyzing: {
    segment: 'analyzing',
    tagline: 'You see what others miss',
    primary: [
      { category: 'service', type: 'packaged_service', label: 'Audit Packages', icon: '📋' },
      { category: 'product', type: 'software', label: 'Analytics Tools', icon: '💻' }
    ],
    secondary: [
      { category: 'product', type: 'digital_product', label: 'Scorecards & Frameworks', icon: '📄' }
    ],
    proficiencyGuidance: {
      mastering: 'Premium audit packages or build an analytics tool. Your insight is the product.',
      establishing: 'Create scorecard templates or diagnostic frameworks as digital products.',
      emerging: 'Offer free audits to build case studies and sharpen your diagnostic process.'
    }
  },

  designing: {
    segment: 'designing',
    tagline: 'You shape how things feel',
    primary: [
      { category: 'service', type: 'custom_service', label: 'Custom Design', icon: '🎯' }
    ],
    secondary: [
      { category: 'product', type: 'digital_product', label: 'Templates & Design Systems', icon: '📄' },
      { category: 'service', type: 'packaged_service', label: 'Packaged Service', icon: '📋' }
    ],
    proficiencyGuidance: {
      mastering: 'Premium custom design services. Your portfolio speaks for itself.',
      establishing: 'Create design templates and systems as digital products while building client work.',
      emerging: 'Contribute to others\' projects. Build a portfolio before going solo.'
    }
  }
}

/**
 * Amplifier Mappings (4 of 12)
 * These segments amplify whatever product the user builds
 */
export const AMPLIFIER_MAPPINGS = {
  creating: {
    segment: 'creating',
    tagline: 'You bring new things into existence',
    amplifies: 'Originality',
    defaultProducts: [
      { category: 'productized', type: 'live_group', label: 'Group Program', icon: '👥' },
      { category: 'product', type: 'digital_product', label: 'Digital Product', icon: '📄' }
    ],
    uiMessage: 'Your creating skill means your offer will stand out through originality. Whatever you build, lead with what makes it uniquely yours.',
    proficiencyGuidance: {
      mastering: 'Your original work IS the product. Lead with it.',
      establishing: 'Infuse originality into a proven format (course, service, product).',
      emerging: 'Experiment widely. Your creative voice is still forming.'
    }
  },

  expressing: {
    segment: 'expressing',
    tagline: 'You give form to what matters',
    amplifies: 'Visibility & Reach',
    defaultProducts: [
      { category: 'product', type: 'content', label: 'Content', icon: '🎙️' },
      { category: 'product', type: 'content_podcast', label: 'Podcast', icon: '🎙️' },
      { category: 'product', type: 'content_newsletter', label: 'Newsletter', icon: '📧' }
    ],
    uiMessage: 'Your expressing skill is your marketing superpower. Whether you build content as your product or use it to promote another offer, your voice will be what draws people in.',
    proficiencyGuidance: {
      mastering: 'Content can BE your product (podcast, newsletter, YouTube). Or use it as the growth engine for any other offer.',
      establishing: 'Start sharing your journey publicly. Build an audience alongside your core offer.',
      emerging: 'Practice expressing in low-stakes formats (writing, short videos) before going live.'
    }
  },

  influencing: {
    segment: 'influencing',
    tagline: 'You move people to action',
    amplifies: 'Conversion & Sales',
    defaultProducts: [
      { category: 'service', type: 'custom_service', label: 'High-Ticket Service', icon: '🎯' }
    ],
    uiMessage: 'Your influencing skill means you can sell whatever you build. This is rare — most people build great things but struggle to sell them. You won\'t have that problem.',
    proficiencyGuidance: {
      mastering: 'You can sell premium. High-ticket consulting, sales training, or be the sales engine for any business.',
      establishing: 'Use your influence to pre-sell and validate before building. Your conversion rate is your advantage.',
      emerging: 'Practice selling other people\'s products (affiliate, partnerships) to build the muscle.'
    }
  },

  synthesizing: {
    segment: 'synthesizing',
    tagline: 'You see the whole picture',
    amplifies: 'Depth & Integration',
    defaultProducts: [
      { category: 'product', type: 'content', label: 'Content', icon: '🎙️' },
      { category: 'productized', type: 'live_group', label: 'Group Program', icon: '👥' }
    ],
    uiMessage: 'Your synthesizing skill means you see connections others miss. Your offer will stand out through depth and integration — the \'aha\' moments only you can create.',
    proficiencyGuidance: {
      mastering: 'Create integrative frameworks and thought leadership content. Consulting at the highest level.',
      establishing: 'Build productised services that combine multiple disciplines. Your cross-domain thinking is the value.',
      emerging: 'Write and share your synthesis publicly. Frameworks and models are how you demonstrate this skill.'
    }
  }
}

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
  let isAmplifier = false

  // First, try taxonomy-based mapping
  for (const key of taxonomyKeys) {
    // Check direct mappings first
    if (DIRECT_MAPPINGS[key]) {
      const mapping = DIRECT_MAPPINGS[key]
      // Add primary suggestions (max 2)
      suggestions.push(...mapping.primary.slice(0, 2).map(s => ({
        ...s,
        reason: mapping.tagline,
        skillSegment: key
      })))
      proficiencyTip = mapping.proficiencyGuidance[proficiency]
      break // Use first matching segment
    }

    // Check amplifier mappings
    if (AMPLIFIER_MAPPINGS[key]) {
      const mapping = AMPLIFIER_MAPPINGS[key]
      amplifierMessage = mapping.uiMessage
      isAmplifier = true
      // Add default products for amplifiers
      suggestions.push(...mapping.defaultProducts.slice(0, 2).map(s => ({
        ...s,
        reason: `Amplifies: ${mapping.amplifies}`,
        skillSegment: key,
        isAmplifier: true
      })))
      proficiencyTip = mapping.proficiencyGuidance[proficiency]
      break
    }
  }

  // Fallback: If no taxonomy match, use label-based heuristics (legacy support)
  if (suggestions.length === 0) {
    const label = clusterLabel.toLowerCase()

    // Map common label patterns to segments
    if (label.includes('coach') || label.includes('mentor') || label.includes('nurtur')) {
      const mapping = DIRECT_MAPPINGS.nurturing
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('build') || label.includes('develop') || label.includes('engineer')) {
      const mapping = DIRECT_MAPPINGS.building
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('teach') || label.includes('explain') || label.includes('clarif')) {
      const mapping = DIRECT_MAPPINGS.clarifying
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('connect') || label.includes('facilitat') || label.includes('network')) {
      const mapping = DIRECT_MAPPINGS.connecting
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('organiz') || label.includes('system') || label.includes('process')) {
      const mapping = DIRECT_MAPPINGS.organizing
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('strateg') || label.includes('plan') || label.includes('consult')) {
      const mapping = DIRECT_MAPPINGS.strategizing
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('analyz') || label.includes('research') || label.includes('data')) {
      const mapping = DIRECT_MAPPINGS.analyzing
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('design') || label.includes('visual') || label.includes('UX')) {
      const mapping = DIRECT_MAPPINGS.designing
      suggestions = mapping.primary.slice(0, 2).map(s => ({ ...s, reason: mapping.tagline }))
    } else if (label.includes('creat') || label.includes('art') || label.includes('invent')) {
      const mapping = AMPLIFIER_MAPPINGS.creating
      suggestions = mapping.defaultProducts.slice(0, 2).map(s => ({ ...s, reason: `Amplifies: ${mapping.amplifies}`, isAmplifier: true }))
      amplifierMessage = mapping.uiMessage
      isAmplifier = true
    } else if (label.includes('express') || label.includes('speak') || label.includes('present') || label.includes('story')) {
      const mapping = AMPLIFIER_MAPPINGS.expressing
      suggestions = mapping.defaultProducts.slice(0, 2).map(s => ({ ...s, reason: `Amplifies: ${mapping.amplifies}`, isAmplifier: true }))
      amplifierMessage = mapping.uiMessage
      isAmplifier = true
    } else if (label.includes('influenc') || label.includes('sell') || label.includes('persuad')) {
      const mapping = AMPLIFIER_MAPPINGS.influencing
      suggestions = mapping.defaultProducts.slice(0, 2).map(s => ({ ...s, reason: `Amplifies: ${mapping.amplifies}`, isAmplifier: true }))
      amplifierMessage = mapping.uiMessage
      isAmplifier = true
    } else if (label.includes('synthes') || label.includes('integrat') || label.includes('big picture')) {
      const mapping = AMPLIFIER_MAPPINGS.synthesizing
      suggestions = mapping.defaultProducts.slice(0, 2).map(s => ({ ...s, reason: `Amplifies: ${mapping.amplifies}`, isAmplifier: true }))
      amplifierMessage = mapping.uiMessage
      isAmplifier = true
    } else {
      // Generic fallback based on proficiency
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
  }

  return {
    suggestions: suggestions.slice(0, 2), // Max 2 suggestions
    amplifierMessage,
    proficiencyTip,
    isAmplifier
  }
}

/**
 * Get all segments from a user's skill clusters
 * Returns the unique taxonomy segments and their proficiency levels
 */
export function getSegmentsFromClusters(clusters) {
  const segmentMap = new Map()

  for (const cluster of clusters) {
    const keys = cluster.taxonomy_keys || []
    for (const key of keys) {
      // Store highest proficiency for each segment
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
 * Check if a user has any amplifier skills
 */
export function hasAmplifierSkills(clusters) {
  const amplifierSegments = Object.keys(AMPLIFIER_MAPPINGS)
  for (const cluster of clusters) {
    const keys = cluster.taxonomy_keys || []
    if (keys.some(k => amplifierSegments.includes(k))) {
      return true
    }
  }
  return false
}

/**
 * Get amplifier messages for display
 */
export function getAmplifierMessages(clusters) {
  const messages = []
  const amplifierSegments = Object.keys(AMPLIFIER_MAPPINGS)

  for (const cluster of clusters) {
    const keys = cluster.taxonomy_keys || []
    for (const key of keys) {
      if (AMPLIFIER_MAPPINGS[key]) {
        messages.push({
          segment: key,
          amplifies: AMPLIFIER_MAPPINGS[key].amplifies,
          message: AMPLIFIER_MAPPINGS[key].uiMessage,
          proficiency: cluster.proficiency
        })
      }
    }
  }

  return messages
}
