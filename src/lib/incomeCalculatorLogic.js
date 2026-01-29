/**
 * incomeCalculatorLogic.js
 *
 * Calculator functions for the Income Calculator
 * - Revenue calculations by product type
 * - Funnel math
 * - Content requirements
 */

import { BENCHMARKS, PRODUCT_TYPES } from './incomeCalculatorData'

/**
 * Calculate requirements for 1:1 sessions
 */
export function calculateSessionModel({ incomeGoal, sessionPrice, sessionsPerWeek = 10 }) {
  const price = parseFloat(sessionPrice) || BENCHMARKS.pricing.session.mid
  const maxSessions = parseInt(sessionsPerWeek) || 10

  const sessionsNeeded = Math.ceil(incomeGoal / price)
  const sessionsPerWeekNeeded = Math.ceil(sessionsNeeded / 4.33)
  const capacityOk = sessionsPerWeekNeeded <= maxSessions

  const clientsNeeded = Math.ceil(sessionsNeeded / 4)
  const leadsNeeded = Math.ceil(clientsNeeded / BENCHMARKS.leadToCustomer)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'session',
    revenue: { goal: incomeGoal, perSession: price, monthly: sessionsNeeded * price },
    requirements: {
      sessionsPerMonth: sessionsNeeded,
      sessionsPerWeek: sessionsPerWeekNeeded,
      clientsNeeded,
      capacityOk,
      maxCapacity: maxSessions * 4.33
    },
    funnel: { leadsNeeded, reachNeeded },
    content: { postsPerWeek: Math.max(3, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: capacityOk ? [] : [
      `You need ${sessionsPerWeekNeeded} sessions/week but capacity is ${maxSessions}. Consider raising your price.`
    ]
  }
}

/**
 * Calculate requirements for packages/VIP days
 */
export function calculatePackageModel({ incomeGoal, packagePrice, packagesPerMonth = 4 }) {
  const price = parseFloat(packagePrice) || BENCHMARKS.pricing.package.mid
  const maxPackages = parseInt(packagesPerMonth) || 4

  const packagesNeeded = Math.ceil(incomeGoal / price)
  const capacityOk = packagesNeeded <= maxPackages

  const leadsNeeded = Math.ceil(packagesNeeded / BENCHMARKS.leadToCustomer)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'package',
    revenue: { goal: incomeGoal, perPackage: price, monthly: packagesNeeded * price },
    requirements: { packagesPerMonth: packagesNeeded, capacityOk, maxCapacity: maxPackages },
    funnel: { leadsNeeded, reachNeeded },
    content: { postsPerWeek: Math.max(3, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: capacityOk ? [] : [
      `You need ${packagesNeeded} packages/month but capacity is ${maxPackages}. Consider raising your price.`
    ]
  }
}

/**
 * Calculate requirements for live groups/workshops
 */
export function calculateLiveGroupModel({ incomeGoal, ticketPrice, eventsPerMonth = 4, capacityPerEvent = 20 }) {
  const price = parseFloat(ticketPrice) || BENCHMARKS.pricing.workshop.mid
  const events = parseInt(eventsPerMonth) || 4
  const capacity = parseInt(capacityPerEvent) || 20

  const ticketsNeeded = Math.ceil(incomeGoal / price)
  const ticketsPerEvent = Math.ceil(ticketsNeeded / events)
  const seatsNeeded = Math.ceil(ticketsPerEvent / BENCHMARKS.eventFillRate)
  const capacityOk = seatsNeeded <= capacity

  const eventsNeeded = capacityOk ? events : Math.ceil(ticketsNeeded / (capacity * BENCHMARKS.eventFillRate))

  const leadsNeeded = Math.ceil(ticketsNeeded / BENCHMARKS.ticketConversion)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'live_group',
    revenue: { goal: incomeGoal, perTicket: price, perEvent: ticketsPerEvent * price, monthly: ticketsNeeded * price },
    requirements: { ticketsNeeded, ticketsPerEvent, seatsNeeded, eventsPerMonth: eventsNeeded, capacityOk, maxCapacity: capacity },
    funnel: { leadsNeeded, reachNeeded, ticketConversion: BENCHMARKS.ticketConversion },
    content: { postsPerWeek: Math.max(3, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: capacityOk ? [] : [`You need ${seatsNeeded} seats but capacity is ${capacity}. Consider ${eventsNeeded} events instead.`]
  }
}

/**
 * Calculate requirements for self-paced programs
 */
export function calculateProgramModel({ incomeGoal, programPrice, launchesPerYear = 2 }) {
  const price = parseFloat(programPrice) || BENCHMARKS.pricing.program.mid
  const launches = parseInt(launchesPerYear) || 2

  const yearlyGoal = incomeGoal * 12
  const salesNeeded = Math.ceil(yearlyGoal / price)
  const salesPerLaunch = Math.ceil(salesNeeded / launches)
  const listNeeded = Math.ceil(salesPerLaunch / (BENCHMARKS.listConversion * BENCHMARKS.launchMultiplier))

  return {
    model: 'program',
    revenue: { goal: incomeGoal, perSale: price, perLaunch: salesPerLaunch * price, yearly: salesNeeded * price, monthlyEquivalent: (salesNeeded * price) / 12 },
    requirements: { salesNeeded, salesPerLaunch, launchesPerYear: launches, listSizeNeeded: listNeeded },
    funnel: { listConversion: BENCHMARKS.listConversion, launchConversion: BENCHMARKS.listConversion * BENCHMARKS.launchMultiplier },
    content: { postsPerWeek: 5, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: listNeeded > 10000 ? [`You need a list of ${listNeeded.toLocaleString()}. This takes time to build.`] : []
  }
}

/**
 * Calculate requirements for retainer/done-for-you
 */
export function calculateRetainerModel({ incomeGoal, retainerPrice, maxClients = 5 }) {
  const price = parseFloat(retainerPrice) || 2000
  const max = parseInt(maxClients) || 5

  const clientsNeeded = Math.ceil(incomeGoal / price)
  const capacityOk = clientsNeeded <= max

  const leadsNeeded = Math.ceil(clientsNeeded / BENCHMARKS.leadToCustomer)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'retainer',
    revenue: { goal: incomeGoal, perClient: price, monthly: clientsNeeded * price },
    requirements: { clientsNeeded, capacityOk, maxCapacity: max },
    funnel: { leadsNeeded, reachNeeded },
    content: { postsPerWeek: Math.max(2, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: capacityOk ? [] : [`You need ${clientsNeeded} clients but can only handle ${max}. Raise your retainer price.`]
  }
}

/**
 * Calculate requirements for membership
 */
export function calculateMembershipModel({ incomeGoal, monthlyPrice, targetMembers = 100 }) {
  const price = parseFloat(monthlyPrice) || BENCHMARKS.pricing.membership.mid
  const target = parseInt(targetMembers) || 100

  const membersNeeded = Math.ceil(incomeGoal / price)
  const capacityOk = membersNeeded <= target
  const monthlyChurn = Math.ceil(membersNeeded * BENCHMARKS.monthlyChurnRate)
  const newMembersNeeded = monthlyChurn

  const leadsNeeded = Math.ceil(newMembersNeeded / BENCHMARKS.leadToCustomer)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'membership',
    revenue: { goal: incomeGoal, perMember: price, monthly: membersNeeded * price },
    requirements: { membersNeeded, monthlyChurn, newMembersNeededMonthly: newMembersNeeded, capacityOk, targetCapacity: target },
    funnel: { leadsNeeded, reachNeeded, churnRate: BENCHMARKS.monthlyChurnRate },
    content: { postsPerWeek: Math.max(3, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: membersNeeded > 500 ? [`${membersNeeded} members is ambitious. Most memberships take 12-24 months to reach this.`] : []
  }
}

/**
 * Calculate requirements for digital downloads
 */
export function calculateDigitalDownloadModel({ incomeGoal, productPrice, salesPerMonth = 50 }) {
  const price = parseFloat(productPrice) || BENCHMARKS.pricing.template.mid
  const targetSales = parseInt(salesPerMonth) || 50

  const salesNeeded = Math.ceil(incomeGoal / price)
  const capacityOk = salesNeeded <= targetSales * 2 // Digital has high capacity

  const leadsNeeded = Math.ceil(salesNeeded / BENCHMARKS.listConversion)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'digital_download',
    revenue: { goal: incomeGoal, perSale: price, monthly: salesNeeded * price },
    requirements: { salesNeeded, salesPerMonth: salesNeeded, capacityOk },
    funnel: { leadsNeeded, reachNeeded, conversionRate: BENCHMARKS.listConversion },
    content: { postsPerWeek: Math.max(4, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: salesNeeded > 200 ? [`${salesNeeded} sales/month requires significant traffic. Consider bundling products.`] : []
  }
}

/**
 * Calculate requirements for software/SaaS
 */
export function calculateSoftwareModel({ incomeGoal, monthlyPrice, targetUsers = 100 }) {
  const price = parseFloat(monthlyPrice) || BENCHMARKS.pricing.software.mid
  const target = parseInt(targetUsers) || 100

  const usersNeeded = Math.ceil(incomeGoal / price)
  const capacityOk = usersNeeded <= target * 2
  const monthlyChurn = Math.ceil(usersNeeded * BENCHMARKS.monthlyChurnRate)

  return {
    model: 'software',
    revenue: { goal: incomeGoal, perUser: price, monthly: usersNeeded * price, mrr: usersNeeded * price },
    requirements: { usersNeeded, monthlyChurn, newUsersNeeded: monthlyChurn, capacityOk },
    funnel: { churnRate: BENCHMARKS.monthlyChurnRate },
    content: { postsPerWeek: 3, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: usersNeeded > 500 ? [`${usersNeeded} users is a significant SaaS. Expect 12-24 months to reach this.`] : []
  }
}

/**
 * Calculate requirements for online course
 */
export function calculateCourseModel({ incomeGoal, coursePrice, launchesPerYear = 2 }) {
  const price = parseFloat(coursePrice) || BENCHMARKS.pricing.course.mid
  const launches = parseInt(launchesPerYear) || 2

  const yearlyGoal = incomeGoal * 12
  const salesNeeded = Math.ceil(yearlyGoal / price)
  const salesPerLaunch = Math.ceil(salesNeeded / launches)
  const listNeeded = Math.ceil(salesPerLaunch / (BENCHMARKS.listConversion * BENCHMARKS.launchMultiplier))

  return {
    model: 'online_course',
    revenue: { goal: incomeGoal, perSale: price, perLaunch: salesPerLaunch * price, yearly: salesNeeded * price, monthlyEquivalent: (salesNeeded * price) / 12 },
    requirements: { salesNeeded, salesPerLaunch, launchesPerYear: launches, listSizeNeeded: listNeeded },
    funnel: { listConversion: BENCHMARKS.listConversion, launchConversion: BENCHMARKS.listConversion * BENCHMARKS.launchMultiplier },
    content: { postsPerWeek: 5, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: listNeeded > 5000 ? [`You need a list of ${listNeeded.toLocaleString()} for this course revenue.`] : []
  }
}

/**
 * Calculate requirements for physical products
 */
export function calculatePhysicalProductModel({ incomeGoal, productPrice, profitMargin = 40, salesPerMonth = 50 }) {
  const price = parseFloat(productPrice) || 50
  const margin = parseFloat(profitMargin) / 100 || BENCHMARKS.avgProfitMargin
  const targetSales = parseInt(salesPerMonth) || 50

  const profitPerSale = price * margin
  const salesNeeded = Math.ceil(incomeGoal / profitPerSale)
  const revenueNeeded = salesNeeded * price

  const leadsNeeded = Math.ceil(salesNeeded / BENCHMARKS.leadToCustomer)
  const reachNeeded = Math.ceil(leadsNeeded / BENCHMARKS.reachToLead)
  const postsPerWeek = Math.ceil(reachNeeded / BENCHMARKS.avgReachPerPost / 4.33)

  return {
    model: 'physical_product',
    revenue: { goal: incomeGoal, perSale: price, profitPerSale, grossRevenue: revenueNeeded, netProfit: salesNeeded * profitPerSale },
    requirements: { salesNeeded, salesPerMonth: salesNeeded, profitMargin: margin * 100 },
    funnel: { leadsNeeded, reachNeeded },
    content: { postsPerWeek: Math.max(4, postsPerWeek), reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: salesNeeded > 500 ? [`${salesNeeded} units/month requires strong fulfillment and marketing.`] : []
  }
}

/**
 * Calculate requirements for book/publication
 */
export function calculateBookModel({ incomeGoal, bookPrice, royaltyPercent = 10, salesPerMonth = 100 }) {
  const price = parseFloat(bookPrice) || 20
  const royalty = parseFloat(royaltyPercent) / 100 || BENCHMARKS.bookRoyalty
  const targetSales = parseInt(salesPerMonth) || 100

  const royaltyPerSale = price * royalty
  const salesNeeded = Math.ceil(incomeGoal / royaltyPerSale)

  return {
    model: 'book',
    revenue: { goal: incomeGoal, perSale: price, royaltyPerSale, grossSales: salesNeeded * price, netRoyalty: salesNeeded * royaltyPerSale },
    requirements: { salesNeeded, salesPerMonth: salesNeeded, royaltyPercent: royalty * 100 },
    funnel: {},
    content: { postsPerWeek: 3, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: salesNeeded > 1000 ? [`${salesNeeded} book sales/month is bestseller territory. Consider speaking or courses to supplement.`] : []
  }
}

/**
 * Calculate requirements for podcast
 */
export function calculatePodcastModel({ incomeGoal, episodesPerMonth = 4, downloadsPerEpisode = 5000 }) {
  const episodes = parseInt(episodesPerMonth) || 4
  const downloads = parseInt(downloadsPerEpisode) || 5000

  const monthlyDownloads = episodes * downloads
  const adRevenue = (monthlyDownloads / 1000) * BENCHMARKS.podcastCPM
  const downloadsNeeded = Math.ceil((incomeGoal / BENCHMARKS.podcastCPM) * 1000)
  const downloadsPerEpNeeded = Math.ceil(downloadsNeeded / episodes)

  return {
    model: 'podcast',
    revenue: { goal: incomeGoal, cpm: BENCHMARKS.podcastCPM, currentMonthlyRevenue: adRevenue, monthlyDownloads },
    requirements: { downloadsNeeded, downloadsPerEpisode: downloadsPerEpNeeded, episodesPerMonth: episodes },
    funnel: {},
    content: { postsPerWeek: episodes, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: downloadsPerEpNeeded > 50000 ? [`${downloadsPerEpNeeded.toLocaleString()} downloads/ep is top 1% of podcasts. Consider sponsorships + courses.`] : []
  }
}

/**
 * Calculate requirements for YouTube
 */
export function calculateYouTubeModel({ incomeGoal, videosPerMonth = 4, viewsPerVideo = 10000 }) {
  const videos = parseInt(videosPerMonth) || 4
  const views = parseInt(viewsPerVideo) || 10000

  const monthlyViews = videos * views
  const adRevenue = (monthlyViews / 1000) * BENCHMARKS.youtubeCPM
  const viewsNeeded = Math.ceil((incomeGoal / BENCHMARKS.youtubeCPM) * 1000)
  const viewsPerVidNeeded = Math.ceil(viewsNeeded / videos)

  return {
    model: 'youtube',
    revenue: { goal: incomeGoal, cpm: BENCHMARKS.youtubeCPM, currentMonthlyRevenue: adRevenue, monthlyViews },
    requirements: { viewsNeeded, viewsPerVideo: viewsPerVidNeeded, videosPerMonth: videos },
    funnel: {},
    content: { postsPerWeek: videos, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: viewsPerVidNeeded > 500000 ? [`${viewsPerVidNeeded.toLocaleString()} views/video is very high. Consider products/sponsorships.`] : []
  }
}

/**
 * Calculate requirements for newsletter
 */
export function calculateNewsletterModel({ incomeGoal, subscriberCount = 5000, revenueModel = 'sponsored' }) {
  const subscribers = parseInt(subscriberCount) || 5000

  // Sponsored model: CPM based
  const sponsoredRevenue = (subscribers / 1000) * BENCHMARKS.newsletterCPM
  const subscribersNeeded = Math.ceil((incomeGoal / BENCHMARKS.newsletterCPM) * 1000)

  return {
    model: 'newsletter',
    revenue: { goal: incomeGoal, cpm: BENCHMARKS.newsletterCPM, currentMonthlyRevenue: sponsoredRevenue, subscribers },
    requirements: { subscribersNeeded, currentSubscribers: subscribers },
    funnel: {},
    content: { postsPerWeek: 2, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: subscribersNeeded > 50000 ? [`${subscribersNeeded.toLocaleString()} subscribers takes time. Consider paid newsletter or products.`] : []
  }
}

/**
 * Calculate requirements for affiliate/sponsorships
 */
export function calculateAffiliateModel({ incomeGoal, audienceSize = 10000, dealsPerMonth = 2 }) {
  const audience = parseInt(audienceSize) || 10000
  const deals = parseInt(dealsPerMonth) || 2

  const avgDealValue = 500 // Estimate
  const currentRevenue = deals * avgDealValue
  const dealsNeeded = Math.ceil(incomeGoal / avgDealValue)

  return {
    model: 'affiliate',
    revenue: { goal: incomeGoal, avgDealValue, currentRevenue, deals },
    requirements: { dealsNeeded, dealsPerMonth: dealsNeeded, audienceSize: audience },
    funnel: {},
    content: { postsPerWeek: 3, reachPerPost: BENCHMARKS.avgReachPerPost },
    warnings: dealsNeeded > 10 ? [`${dealsNeeded} deals/month requires significant audience and relationships.`] : []
  }
}

/**
 * Main calculator function - routes to the right model
 */
export function calculateForProductType(productTypeId, inputs) {
  const calculators = {
    custom_service: calculateSessionModel,
    packaged_service: calculatePackageModel,
    live_group: calculateLiveGroupModel,
    automated_group: calculateProgramModel,
    managed_service: calculateRetainerModel,
    membership: calculateMembershipModel,
    digital_download: calculateDigitalDownloadModel,
    software: calculateSoftwareModel,
    online_course: calculateCourseModel,
    physical_product: calculatePhysicalProductModel,
    book: calculateBookModel,
    podcast: calculatePodcastModel,
    youtube: calculateYouTubeModel,
    newsletter: calculateNewsletterModel,
    affiliate: calculateAffiliateModel
  }

  const calculator = calculators[productTypeId]
  if (!calculator) {
    console.error('Unknown product type:', productTypeId)
    return null
  }

  return calculator(inputs)
}

/**
 * Generate paths/recommendations based on visibility comfort
 */
export function generatePaths(visibilityRatings, currentProductType) {
  const paths = []

  const screenComfort = 10 - (visibilityRatings?.screen || 5)
  const liveComfort = 10 - (visibilityRatings?.live || 5)
  const moneyComfort = 10 - (visibilityRatings?.money || 5)

  if (screenComfort < 6 || moneyComfort < 5) {
    paths.push({
      id: 'foundation',
      title: 'Build Your Foundation',
      description: 'Start with 1:1 work to build confidence and client proof',
      productType: 'custom_service',
      visibilityLevel: 2,
      reason: 'Lower visibility requirements while you build skills and testimonials'
    })
  }

  if (screenComfort >= 5) {
    paths.push({
      id: 'content',
      title: 'Content Marketing Path',
      description: 'Build audience through consistent valuable content',
      activities: ['Post 3-5x per week', 'Share client wins', 'Teach what you know'],
      visibilityLayers: ['screen'],
      reason: 'You rated screen visibility as manageable'
    })
  }

  if (liveComfort >= 5) {
    paths.push({
      id: 'events',
      title: 'Live Events Path',
      description: 'Host workshops, webinars, or live sessions',
      activities: ['Monthly workshops', 'Weekly live Q&A', 'Guest teaching'],
      visibilityLayers: ['screen', 'live'],
      reason: 'You rated live visibility as manageable'
    })
  }

  paths.push({
    id: 'networking',
    title: 'Networking & Referrals Path',
    description: 'Build relationships that lead to referrals',
    activities: ['Engage with peers', 'Ask happy clients for referrals', 'Collaborate'],
    visibilityLayers: ['screen'],
    reason: 'Lower visibility option that works for all comfort levels'
  })

  return paths
}

/**
 * Format currency for display
 */
export function formatCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
  return `$${amount}`
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return num.toLocaleString()
}
