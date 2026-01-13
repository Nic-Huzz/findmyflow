/**
 * Nervous System Insights Generator
 *
 * Generates personalized warning signs and insights based on
 * flow responses. No AI required - uses coded logic.
 */

// ============================================
// HELPERS
// ============================================

/**
 * Parse goal string to number
 * "100+" -> 100, "1,000+" -> 1000, "$500,000+" -> 500000
 */
function parseGoalNumber(goalString) {
  if (!goalString) return 0
  const cleaned = goalString.replace(/[$,+]/g, '')
  return parseInt(cleaned, 10) || 0
}

/**
 * Format people count for display
 */
function formatPeople(num) {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

/**
 * Format money for display
 */
function formatMoney(num) {
  if (!num) return '$0'
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
  return `$${num}`
}

// ============================================
// WARNING SIGN GENERATORS
// ============================================

/**
 * Generate warning signs based on nervous system responses
 * @param {object} responses - Flow responses object
 * @returns {array} Array of warning sign objects
 */
export function generateWarningSigns(responses) {
  const warnings = []

  // Get active contracts
  const activeContracts = Object.entries(responses.contracts_tested || {})
    .filter(([_, response]) => response === 'yes')
    .map(([contract]) => contract)

  // Parse goals for comparison
  const impactGoalNum = parseGoalNumber(responses.impact_goal)
  const incomeGoalNum = parseGoalNumber(responses.income_goal)
  const beingSeenEdge = responses.being_seen_edge || 0
  const earningEdge = responses.earning_edge || 0

  // ----------------------------------------
  // 1. Self-Sabotage Warning
  // ----------------------------------------
  if (responses.test4_self_sabotage === 'yes') {
    warnings.push({
      id: 'self_sabotage',
      icon: '🎭',
      title: 'Self-Sabotage Near Success',
      description: 'Your nervous system may create problems when things are going well. Watch for unexplained drama, health issues, or relationship conflicts that conveniently appear near milestones.',
      triggers: [
        'When you\'re about to hit a revenue goal',
        'After receiving positive attention or praise',
        'When a launch is going "too well"'
      ],
      practice: 'When you notice sabotage patterns, pause and ask: "What feels unsafe about this success?" The awareness alone can interrupt the pattern.'
    })
  }

  // ----------------------------------------
  // 2. Visibility Edge Warning
  // ----------------------------------------
  if (beingSeenEdge > 0 && impactGoalNum > 0) {
    const visibilityGap = beingSeenEdge / impactGoalNum

    if (visibilityGap < 0.1) {
      // Huge gap - edge is less than 10% of goal
      warnings.push({
        id: 'visibility_major_gap',
        icon: '👁️',
        title: 'Major Visibility Resistance',
        description: `Your nervous system feels safe being seen by ${formatPeople(beingSeenEdge)} people, but your goal is ${responses.impact_goal}. This ${Math.round(impactGoalNum / beingSeenEdge)}x gap will create strong pullback.`,
        triggers: [
          'Viral moments or unexpected attention',
          'Being featured or interviewed',
          'Audience growth spurts'
        ],
        practice: 'Expand gradually. Each time you reach a new visibility level, pause and let your system acclimate before pushing further.'
      })
    } else if (visibilityGap < 0.5) {
      // Moderate gap
      warnings.push({
        id: 'visibility_moderate_gap',
        icon: '👁️',
        title: 'Visibility Pullback Pattern',
        description: `Your edge is ${formatPeople(beingSeenEdge)} people but you want to reach ${responses.impact_goal}. Expect urges to hide, delete content, or avoid exposure when visibility grows beyond your edge.`,
        triggers: [
          'Post goes viral or gets more engagement than usual',
          'Speaking opportunities or interviews',
          'Growth in followers or subscribers'
        ],
        practice: 'Before posting or speaking, repeat: "I am safe being seen by [current audience + 10%]." Gradually expand the number.'
      })
    }
  }

  // ----------------------------------------
  // 3. Earning Edge Warning
  // ----------------------------------------
  if (earningEdge > 0 && incomeGoalNum > 0) {
    const earningGap = earningEdge / incomeGoalNum

    if (earningGap < 0.15) {
      // Huge gap - edge is less than 15% of goal
      warnings.push({
        id: 'earning_major_gap',
        icon: '💰',
        title: 'Major Earning Resistance',
        description: `Your system feels safe earning ${formatMoney(earningEdge)}/year, but your goal is ${responses.income_goal}. This ${Math.round(incomeGoalNum / earningEdge)}x gap will trigger strong self-sabotage around money.`,
        triggers: [
          'Large payments coming in',
          'Opportunities to charge more',
          'Approaching your earning edge'
        ],
        practice: 'Start by raising prices 10-20% on something small. Let your system adjust to receiving more before aiming for the full goal.'
      })
    } else if (earningGap < 0.5) {
      // Moderate gap
      warnings.push({
        id: 'earning_moderate_gap',
        icon: '💰',
        title: 'Undercharging Pattern',
        description: `Your edge is ${formatMoney(earningEdge)}/year but you want ${responses.income_goal}. Watch for urges to discount, avoid sales conversations, or give away work for free.`,
        triggers: [
          'Sales calls or negotiations',
          'Setting prices for new offers',
          'When clients ask for discounts'
        ],
        practice: 'Before any pricing conversation, state your price internally 3 times without justifying it. Your worth is not up for negotiation.'
      })
    }
  }

  // ----------------------------------------
  // 4. Contract-Specific Warnings
  // ----------------------------------------

  // Greed/Worth Contract
  if (activeContracts.includes("If I charge what I'm worth, people will think I'm greedy")) {
    warnings.push({
      id: 'greed_contract',
      icon: '🏷️',
      title: 'Pricing Guilt Pattern',
      description: 'You carry a belief that charging well makes you "greedy." This leads to chronic undercharging, over-delivering without payment, and resentment in client relationships.',
      triggers: [
        'Setting prices for anything',
        'Seeing competitors charge more',
        'Being asked "what do you charge?"'
      ],
      practice: 'Reframe: Undercharging attracts clients who don\'t value your work. Premium pricing attracts committed clients who get better results.'
    })
  }

  // Visibility/Judgment Contract
  if (activeContracts.includes("If I'm visible, I'll be judged and criticized")) {
    warnings.push({
      id: 'judgment_contract',
      icon: '🎯',
      title: 'Visibility Avoidance Pattern',
      description: 'You expect judgment when visible, so you unconsciously stay small. This shows up as perfectionism (never publishing), hiding behind others, or only sharing when "ready."',
      triggers: [
        'About to post content',
        'Opportunity to speak or be featured',
        'Sharing wins or achievements'
      ],
      practice: 'Post before you\'re ready. The fear of judgment is almost always worse than actual judgment. And critics aren\'t your customers anyway.'
    })
  }

  // Success/Identity Contract
  if (activeContracts.includes("If I outgrow my current life, I'll lose my identity")) {
    warnings.push({
      id: 'identity_contract',
      icon: '🪞',
      title: 'Identity Preservation Pattern',
      description: 'Part of you fears that success will change who you are. You may unconsciously stay stuck to preserve your current identity and relationships.',
      triggers: [
        'Opportunities that would level you up',
        'Outgrowing your peer group',
        'Lifestyle changes that come with success'
      ],
      practice: 'You don\'t lose yourself in growth—you become more yourself. The version of you that\'s afraid of change is just one part, not the whole.'
    })
  }

  // Relatability Contract
  if (activeContracts.includes("If I become too successful, I won't be relatable anymore")) {
    warnings.push({
      id: 'relatability_contract',
      icon: '🤝',
      title: 'Dimming to Stay Connected',
      description: 'You may downplay wins, hide success, or stay smaller than you could be to maintain connection with your current circle.',
      triggers: [
        'Sharing achievements with friends/family',
        'When your success makes others uncomfortable',
        'Opportunities that would separate you from peers'
      ],
      practice: 'Your people will celebrate your success. Those who can\'t handle it were never your people. New connections come at new levels.'
    })
  }

  // Abandonment/Rejection Contract
  if (activeContracts.includes("If I pursue my ambitions, I'll lose the people I care about") ||
      activeContracts.includes("If I'm too successful, I'll be rejected or abandoned")) {
    warnings.push({
      id: 'abandonment_contract',
      icon: '💔',
      title: 'Success = Abandonment Fear',
      description: 'Deep down, you link success with losing love. This keeps you playing small to maintain relationships that may not actually be at risk.',
      triggers: [
        'Making decisions that prioritize your goals',
        'When success requires time away from loved ones',
        'Outpacing a partner or close friend'
      ],
      practice: 'Have direct conversations about your ambitions with those you fear losing. Real relationships can hold your growth.'
    })
  }

  // Fraud/Imposter Contract
  if (activeContracts.includes("If I reach my goals, they'll discover I'm a fraud")) {
    warnings.push({
      id: 'imposter_contract',
      icon: '🎭',
      title: 'Imposter Pattern',
      description: 'You believe that reaching your goals will expose you as a fraud. This creates self-sabotage near success to avoid being "found out."',
      triggers: [
        'Completing big projects or launches',
        'Receiving praise or recognition',
        'Moments of high visibility'
      ],
      practice: 'Imposter syndrome is actually a sign you\'re growing. If you felt 100% qualified, you wouldn\'t be stretching. Collect evidence of your wins.'
    })
  }

  // Shine/Diminishing Others Contract
  if (activeContracts.includes("If I shine too bright, I'll make others feel bad about themselves")) {
    warnings.push({
      id: 'dimming_contract',
      icon: '✨',
      title: 'Light-Dimming Pattern',
      description: 'You learned that your brightness threatens others, so you hide your gifts. This shows up as deflecting compliments, minimizing achievements, and staying in the background.',
      triggers: [
        'Being praised or recognized',
        'Opportunities to lead or be visible',
        'When your success highlights others\' stuckness'
      ],
      practice: 'Your light gives others permission to shine too. Dimming yourself helps no one. The people meant for you will be inspired, not threatened.'
    })
  }

  // Not Enough Contract
  if (activeContracts.includes("If I'm fully seen, people will discover I'm not enough")) {
    warnings.push({
      id: 'not_enough_contract',
      icon: '🕳️',
      title: 'Core Unworthiness Pattern',
      description: 'Underneath it all, you believe you\'re "not enough." This drives perfectionism, hiding, and never feeling ready—because being seen risks confirming this fear.',
      triggers: [
        'Any situation requiring vulnerability',
        'Sharing work before it\'s "perfect"',
        'Intimate or authentic conversations'
      ],
      practice: 'The belief "I\'m not enough" was installed by someone else\'s limitations. It was never true. You were always enough—the wounding made you forget.'
    })
  }

  // ----------------------------------------
  // 5. Unsafe Pursuing Warning
  // ----------------------------------------
  if (responses.test3_safe_pursuing === 'no') {
    warnings.push({
      id: 'unsafe_pursuing',
      icon: '🛑',
      title: 'Ambition Feels Dangerous',
      description: 'Your body signaled that pursuing your stated ambition doesn\'t feel safe. This creates constant internal friction—wanting something your system is actively blocking.',
      triggers: [
        'Taking action toward your goals',
        'Making commitments or investments',
        'When things start working'
      ],
      practice: 'Start smaller. What version of this ambition DOES feel safe? Build from there. You can\'t outrun your nervous system—you have to bring it along.'
    })
  }

  // ----------------------------------------
  // 6. General Feels Unsafe Warning
  // ----------------------------------------
  if (responses.test5_feels_unsafe === 'yes') {
    warnings.push({
      id: 'vision_unsafe',
      icon: '⚡',
      title: 'Vision Triggers Alarm',
      description: 'Part of you experiences your own vision as a threat. This isn\'t weakness—it\'s protection from a system that learned big dreams can lead to big pain.',
      triggers: [
        'Thinking about your full potential',
        'Setting big goals',
        'When someone believes in you strongly'
      ],
      practice: 'Your nervous system is trying to protect you from a past pain. Thank it, but remind it: you\'re not that person anymore, and this isn\'t that situation.'
    })
  }

  // Return top 4 most relevant warnings to avoid overwhelm
  return warnings.slice(0, 4)
}

/**
 * Get a summary of the gap between edges and goals
 * @param {object} responses - Flow responses
 * @returns {object} Gap analysis
 */
export function getEdgeGapAnalysis(responses) {
  const impactGoalNum = parseGoalNumber(responses.impact_goal)
  const incomeGoalNum = parseGoalNumber(responses.income_goal)
  const beingSeenEdge = responses.being_seen_edge || 0
  const earningEdge = responses.earning_edge || 0

  return {
    visibility: {
      edge: beingSeenEdge,
      goal: impactGoalNum,
      gap: impactGoalNum > 0 ? Math.round((1 - beingSeenEdge / impactGoalNum) * 100) : 0,
      multiplier: beingSeenEdge > 0 ? Math.round(impactGoalNum / beingSeenEdge * 10) / 10 : 0,
      edgeFormatted: formatPeople(beingSeenEdge),
      goalFormatted: responses.impact_goal
    },
    earning: {
      edge: earningEdge,
      goal: incomeGoalNum,
      gap: incomeGoalNum > 0 ? Math.round((1 - earningEdge / incomeGoalNum) * 100) : 0,
      multiplier: earningEdge > 0 ? Math.round(incomeGoalNum / earningEdge * 10) / 10 : 0,
      edgeFormatted: formatMoney(earningEdge),
      goalFormatted: responses.income_goal
    }
  }
}

export default {
  generateWarningSigns,
  getEdgeGapAnalysis
}
