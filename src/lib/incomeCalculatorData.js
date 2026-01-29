/**
 * incomeCalculatorData.js
 *
 * Data definitions for the Income Calculator
 * - Wealth Ladder positions
 * - Product types
 * - Monetization models with visibility requirements
 * - Visibility layers
 * - Safety contracts
 * - Industry benchmarks
 */

// Wealth Ladder - progression from trading time to passive income
export const WEALTH_LADDER = {
  service: {
    id: 'service',
    label: 'Service',
    description: 'Trading time for money (1:1 work)',
    icon: '🤝',
    examples: ['Coaching', 'Consulting', 'Freelance'],
    visibilityLevel: 2,
    incomeRange: '$2k-8k/month'
  },
  productized: {
    id: 'productized',
    label: 'Productized',
    description: 'Packaged offerings (groups, workshops)',
    icon: '📦',
    examples: ['Group programs', 'Workshops', 'Memberships'],
    visibilityLevel: 3,
    incomeRange: '$5k-20k/month'
  },
  products: {
    id: 'products',
    label: 'Products',
    description: 'Digital, physical, or content products',
    icon: '🎯',
    examples: ['Digital downloads', 'Physical goods', 'Content monetization'],
    visibilityLevel: 4,
    incomeRange: '$1k-100k/month'
  }
}

// Product Types - organized by wealth ladder category
export const PRODUCT_TYPES = {
  // Service category
  custom_service: {
    id: 'custom_service',
    label: '1:1 Sessions',
    description: 'Customized work with individual clients',
    icon: '👤',
    wealthLadder: 'service',
    inputs: ['sessionPrice', 'sessionsPerWeek'],
    visibilityRequired: ['screen', 'money']
  },
  packaged_service: {
    id: 'packaged_service',
    label: 'Packages / VIP Days',
    description: 'Bundled services at a fixed price',
    icon: '🎁',
    wealthLadder: 'service',
    inputs: ['packagePrice', 'packagesPerMonth'],
    visibilityRequired: ['screen', 'money']
  },

  // Productized category
  live_group: {
    id: 'live_group',
    label: 'Live Groups / Workshops',
    description: 'Teaching groups in person or online',
    icon: '👥',
    wealthLadder: 'productized',
    inputs: ['ticketPrice', 'eventsPerMonth', 'capacityPerEvent'],
    visibilityRequired: ['screen', 'live', 'money']
  },
  automated_group: {
    id: 'automated_group',
    label: 'Self-Paced Programs',
    description: 'Pre-recorded content they access anytime',
    icon: '🎬',
    wealthLadder: 'productized',
    inputs: ['programPrice', 'launchesPerYear'],
    visibilityRequired: ['screen', 'live', 'money', 'authority']
  },
  managed_service: {
    id: 'managed_service',
    label: 'Retainer / Done-for-You',
    description: 'Ongoing service relationships',
    icon: '🛠️',
    wealthLadder: 'productized',
    inputs: ['retainerPrice', 'maxClients'],
    visibilityRequired: ['screen', 'money', 'authority']
  },
  membership: {
    id: 'membership',
    label: 'Membership / Community',
    description: 'Recurring access to content or community',
    icon: '🔄',
    wealthLadder: 'productized',
    inputs: ['monthlyPrice', 'targetMembers'],
    visibilityRequired: ['screen', 'live', 'money', 'authority']
  },

  // Digital Products category
  digital_download: {
    id: 'digital_download',
    label: 'Digital Downloads',
    description: 'Templates, guides, eBooks',
    icon: '📄',
    wealthLadder: 'products',
    inputs: ['productPrice', 'salesPerMonth'],
    visibilityRequired: ['screen', 'money']
  },
  software: {
    id: 'software',
    label: 'Software / SaaS',
    description: 'Apps, tools, or plugins',
    icon: '💻',
    wealthLadder: 'products',
    inputs: ['monthlyPrice', 'targetUsers'],
    visibilityRequired: ['screen', 'money', 'authority']
  },
  online_course: {
    id: 'online_course',
    label: 'Online Course',
    description: 'Comprehensive video training',
    icon: '🎓',
    wealthLadder: 'products',
    inputs: ['coursePrice', 'launchesPerYear'],
    visibilityRequired: ['screen', 'live', 'money', 'vulnerable', 'authority']
  },

  // Physical Products category
  physical_product: {
    id: 'physical_product',
    label: 'Physical Products',
    description: 'Tangible goods you ship',
    icon: '📦',
    wealthLadder: 'products',
    inputs: ['productPrice', 'profitMargin', 'salesPerMonth'],
    visibilityRequired: ['screen', 'money']
  },
  book: {
    id: 'book',
    label: 'Book / Publication',
    description: 'Published books or printed guides',
    icon: '📚',
    wealthLadder: 'products',
    inputs: ['bookPrice', 'royaltyPercent', 'salesPerMonth'],
    visibilityRequired: ['screen', 'authority']
  },

  // Content category
  podcast: {
    id: 'podcast',
    label: 'Podcast',
    description: 'Monetized through ads/sponsors',
    icon: '🎙️',
    wealthLadder: 'products',
    inputs: ['episodesPerMonth', 'downloadsPerEpisode'],
    visibilityRequired: ['screen', 'live', 'vulnerable', 'authority']
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube Channel',
    description: 'Video content monetization',
    icon: '📺',
    wealthLadder: 'products',
    inputs: ['videosPerMonth', 'viewsPerVideo'],
    visibilityRequired: ['screen', 'live', 'vulnerable', 'authority']
  },
  newsletter: {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Paid or sponsored newsletter',
    icon: '📧',
    wealthLadder: 'products',
    inputs: ['subscriberCount', 'revenueModel'],
    visibilityRequired: ['screen', 'authority']
  },
  affiliate: {
    id: 'affiliate',
    label: 'Affiliate / Sponsorships',
    description: 'Earning from recommendations',
    icon: '🤝',
    wealthLadder: 'products',
    inputs: ['audienceSize', 'dealsPerMonth'],
    visibilityRequired: ['screen', 'authority']
  }
}

// Visibility Layers - the 5 layers of visibility
export const VISIBILITY_LAYERS = {
  screen: {
    id: 'screen',
    label: 'Screen',
    icon: '📱',
    description: 'Posting content publicly',
    examples: 'Social media posts, website, profiles',
    difficulty: 1,
    fearCore: 'Being judged online'
  },
  live: {
    id: 'live',
    label: 'Live',
    icon: '⚡',
    description: 'Real-time visibility',
    examples: 'Live video, workshops, calls',
    difficulty: 2,
    fearCore: 'Real-time judgment, making mistakes'
  },
  money: {
    id: 'money',
    label: 'Money',
    icon: '💰',
    description: 'Asking for payment',
    examples: 'Pricing, sales calls, invoicing',
    difficulty: 3,
    fearCore: 'Am I worth it?'
  },
  vulnerable: {
    id: 'vulnerable',
    label: 'Vulnerable',
    icon: '💗',
    description: 'Sharing struggles openly',
    examples: 'Failures, personal stories, asking for help',
    difficulty: 4,
    fearCore: 'Rejected for my real self'
  },
  authority: {
    id: 'authority',
    label: 'Authority',
    icon: '👑',
    description: 'Claiming expertise',
    examples: 'Teaching, leading, being the expert',
    difficulty: 5,
    fearCore: 'Imposter syndrome, being exposed'
  }
}

// Safety Contracts - common limiting beliefs
export const SAFETY_CONTRACTS = [
  {
    id: 'visibility_judgment',
    text: "If I'm fully visible, I'll be judged and criticized",
    layers: ['screen', 'live'],
    category: 'visibility'
  },
  {
    id: 'money_greedy',
    text: "If I charge what I'm worth, people will think I'm greedy",
    layers: ['money'],
    category: 'money'
  },
  {
    id: 'success_abandonment',
    text: "If I succeed, I'll lose connection with people I love",
    layers: ['authority'],
    category: 'success'
  },
  {
    id: 'expertise_fraud',
    text: "If I claim expertise, I'll be exposed as a fraud",
    layers: ['authority'],
    category: 'imposter'
  },
  {
    id: 'visibility_attack',
    text: "If I'm visible at scale, I'll be attacked or trolled",
    layers: ['screen', 'live'],
    category: 'visibility'
  },
  {
    id: 'money_corrupt',
    text: "If I have money, it will corrupt me or change who I am",
    layers: ['money'],
    category: 'money'
  },
  {
    id: 'outgrow_identity',
    text: "If I outgrow my current life, I'll lose my identity",
    layers: ['authority'],
    category: 'success'
  },
  {
    id: 'success_unrelatable',
    text: "If I become too successful, I won't be relatable anymore",
    layers: ['authority', 'vulnerable'],
    category: 'success'
  }
]

// Industry Benchmarks for calculations
export const BENCHMARKS = {
  // Lead generation
  reachToLead: 0.05, // 5% of reach becomes leads
  leadToCustomer: 0.05, // 5% of leads become customers

  // Content performance
  avgReachPerPost: 500,
  avgEngagementRate: 0.035, // 3.5%

  // Sales conversions
  sessionShowRate: 0.80, // 80% show up
  sessionRebookRate: 0.60, // 60% rebook
  referralRate: 0.20, // 20% refer someone

  // Group/event
  eventFillRate: 0.75, // 75% capacity
  ticketConversion: 0.10, // 10% of leads buy tickets

  // Digital products
  listConversion: 0.02, // 2% of list buys
  launchMultiplier: 1.5, // Launch converts 1.5x evergreen
  refundRate: 0.10, // 10% refunds

  // Membership
  monthlyChurnRate: 0.05, // 5% monthly churn
  avgMemberLifespan: 6, // 6 months average

  // Content monetization
  podcastCPM: 20, // $20 per 1000 downloads
  youtubeCPM: 3, // $3 per 1000 views (varies widely)
  newsletterCPM: 30, // $30 per 1000 subscribers for sponsored

  // Physical products
  avgProfitMargin: 0.40, // 40% profit margin
  bookRoyalty: 0.10, // 10% typical royalty

  // Pricing benchmarks (low/mid/high)
  pricing: {
    session: { low: 75, mid: 150, high: 300 },
    package: { low: 500, mid: 1500, high: 5000 },
    workshop: { low: 25, mid: 75, high: 200 },
    program: { low: 500, mid: 2000, high: 10000 },
    course: { low: 47, mid: 297, high: 997 },
    membership: { low: 19, mid: 49, high: 99 },
    template: { low: 19, mid: 49, high: 149 },
    software: { low: 9, mid: 29, high: 99 }
  }
}

// Income goal presets
export const INCOME_GOALS = [
  { value: 2000, label: '$2,000/mo' },
  { value: 5000, label: '$5,000/mo' },
  { value: 10000, label: '$10,000/mo' },
  { value: 20000, label: '$20,000/mo' }
]

// Get product types for a wealth ladder position
export function getProductTypesForLadder(ladderId) {
  return Object.values(PRODUCT_TYPES).filter(pt => pt.wealthLadder === ladderId)
}

// Get visibility layers required for a product type
export function getRequiredVisibility(productTypeId) {
  const productType = PRODUCT_TYPES[productTypeId]
  if (!productType) return []
  return productType.visibilityRequired.map(id => VISIBILITY_LAYERS[id])
}

// Calculate visibility gap score (0-10)
export function calculateVisibilityGap(ratings, requiredLayers) {
  if (!ratings || !requiredLayers || requiredLayers.length === 0) return 0

  const gaps = requiredLayers.map(layerId => {
    const rating = ratings[layerId] || 5 // Default to 5 if not rated
    // Higher rating = more scary = bigger gap
    return rating
  })

  // Average of scary ratings for required layers
  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length
  return Math.round(avgGap * 10) / 10
}

// Determine recommended starting point based on visibility comfort
export function getRecommendedStart(visibilityRatings) {
  const screenComfort = 10 - (visibilityRatings?.screen || 5)
  const liveComfort = 10 - (visibilityRatings?.live || 5)
  const moneyComfort = 10 - (visibilityRatings?.money || 5)
  const authorityComfort = 10 - (visibilityRatings?.authority || 5)

  // If comfortable with all, suggest products
  if (screenComfort >= 7 && liveComfort >= 6 && moneyComfort >= 6 && authorityComfort >= 5) {
    return 'products'
  }

  // If comfortable with screen + live + money, suggest productized
  if (screenComfort >= 6 && liveComfort >= 5 && moneyComfort >= 5) {
    return 'productized'
  }

  // If comfortable with screen + money, suggest service
  if (screenComfort >= 5 && moneyComfort >= 4) {
    return 'service'
  }

  // Default to service (lowest visibility requirement)
  return 'service'
}
