/**
 * Tier 1 Financial Security challenge data.
 * Only 5 of 94 dome experiences can generate income within a month.
 * All are skills-based with immediate job market demand.
 */

export const TIER1_IDS = [
  'exp-coding',
  'exp-graphic-design',
  'exp-spreadsheets',
  'exp-selling',
]

export const TIER1_CHALLENGES = {
  'exp-coding': {
    questLabel: 'Coding',
    rate: '$40-80/hr',
    freeRate: '$80-150/hr',
    cardDesc: 'Build apps, websites, tools, and automations',
    title: 'Build a simple website with AI',
    desc: 'Use an AI coding tool to build something small. A personal page, a calculator, anything. You don\'t need to know how to code. The AI does the hard part.',
    dims: { identity: 2, business_commitment: 2 },
  },
  'exp-graphic-design': {
    questLabel: 'Graphic Design',
    rate: '$30-60/hr',
    freeRate: '$75-200/hr',
    cardDesc: 'Design websites, social posts, brand assets',
    title: 'Create 3 designs',
    desc: 'Use a free design tool to make three things: a poster, a social media graphic, and a logo concept. Share your favourite one.',
    dims: { identity: 2, vulnerability: 2 },
  },
  'exp-spreadsheets': {
    questLabel: 'Spreadsheets',
    rate: '$35-70/hr',
    freeRate: '$80-200/hr',
    cardDesc: 'Build financial models and dashboards',
    title: 'Find patterns in data with AI',
    desc: 'Find any free spreadsheet online (sports stats, weather, anything). Ask AI to help you spot the interesting patterns. Write up what you found.',
    dims: { identity: 2, business_commitment: 2 },
  },
  'exp-selling': {
    questLabel: 'Selling',
    rate: '$40-80/hr',
    freeRate: '$150-400/hr',
    cardDesc: 'Run ads, make sales calls, book meetings',
    title: 'Pitch something you believe in',
    desc: 'Pick something you genuinely think is great. Could be a product, an idea, or something you made. Pitch it to 3 people and see what happens.',
    dims: { people: 3, vulnerability: 2, stakes: 2 },
  },
}

export const FINANCIAL_STAGES = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'acquisition', label: 'Method' },
  { key: 'first_opportunity', label: 'First Opportunity' },
  { key: 'first_income', label: 'First Income' },
  { key: 'repeatable', label: 'Repeatable' },
]

/**
 * Per-skill × per-method courage challenge templates for stages 2-6.
 * Stage 1 (discovery) uses TIER1_CHALLENGES above.
 * Stage 3 (acquisition) is a picker, not a challenge.
 */
export const COURAGE_LADDER = {
  portfolio: {
    'exp-coding': {
      title: 'Build 2 apps or tools for real people',
      desc: 'Build something useful for yourself and one for a friend. Show them both and ask what they think.',
      dims: { identity: 2, business_commitment: 2 },
    },
    'exp-graphic-design': {
      title: 'Design for a real person',
      desc: 'Create designs for a real person or business (free is fine). Get their honest feedback.',
      dims: { people: 2, vulnerability: 2 },
    },
    'exp-spreadsheets': {
      title: 'Find 3 patterns in real data',
      desc: 'Find 3 interesting patterns in real data. Write a short post about each one that anyone could understand.',
      dims: { identity: 2, business_commitment: 2 },
    },
    'exp-selling': {
      title: 'Help 3 people with something',
      desc: 'Help 3 people with something they are stuck on. Track what you did and what happened.',
      dims: { people: 2, vulnerability: 2 },
    },
  },

  first_opportunity: {
    employment: {
      'exp-coding': {
        title: 'Apply to 5 roles',
        desc: 'Apply to 5 roles. Tailor each application to show what you built.',
        dims: { money: 3, stakes: 2, business_commitment: 2 },
      },
      'exp-graphic-design': {
        title: 'Apply to 3 roles or pitch 3 businesses',
        desc: 'Apply to 3 roles or pitch 3 local businesses who need design work.',
        dims: { money: 3, people: 2, stakes: 2 },
      },
      'exp-spreadsheets': {
        title: 'Apply to 5 analyst roles',
        desc: 'Apply to 5 analyst roles. Show the patterns you found as proof you can do this.',
        dims: { money: 3, stakes: 2, business_commitment: 2 },
      },
      'exp-selling': {
        title: 'Apply to 3 sales roles',
        desc: 'Apply to 3 sales roles. Your pitch practice IS your interview prep.',
        dims: { money: 3, people: 2, stakes: 2 },
      },
    },
    free_work: {
      'exp-coding': {
        title: 'Build for 5 people (free)',
        desc: 'Build something useful for 5 different people. No charge. Ask each one for a testimonial and a referral.',
        dims: { people: 2, vulnerability: 2, identity: 2 },
      },
      'exp-graphic-design': {
        title: 'Design for 5 people (free)',
        desc: 'Create designs for 5 different people. Free. Ask each one: would you have paid for this? Get testimonials.',
        dims: { people: 2, vulnerability: 2, identity: 2 },
      },
      'exp-spreadsheets': {
        title: 'Analyse data for 5 people (free)',
        desc: 'Help 5 people or businesses make sense of their data. Free. Document what you found and what they said.',
        dims: { people: 2, vulnerability: 2, identity: 2 },
      },
      'exp-selling': {
        title: 'Help 5 people sell (free)',
        desc: 'Help 5 people sell something. Free. Track the results. Ask each one to tell someone about you.',
        dims: { people: 2, vulnerability: 2, money: 2 },
      },
    },
    warm_outreach: {
      'exp-coding': {
        title: 'Tell 10 people what you build',
        desc: 'Message 10 people you know. Tell them you build apps and tools now. Ask if they know anyone who needs one.',
        dims: { people: 2, vulnerability: 2, money: 2 },
      },
      'exp-graphic-design': {
        title: 'Offer to make something for 10 people',
        desc: 'Message 10 people. Offer to make something for them (social post, logo, flyer). First one free.',
        dims: { people: 2, vulnerability: 2 },
      },
      'exp-spreadsheets': {
        title: 'Offer data insights to 10 people',
        desc: 'Message 10 people. Ask if their business has data they are not using. Offer to find the insights.',
        dims: { people: 2, vulnerability: 2, money: 2 },
      },
      'exp-selling': {
        title: 'Offer to help 10 people sell',
        desc: 'Message 10 people. Offer to help them sell something. You take a cut.',
        dims: { people: 2, money: 2, stakes: 2 },
      },
    },
    content: {
      'exp-coding': {
        title: 'Post 3 things you built',
        desc: 'Post 3 things you built this week. Show the before and after. Tag it so people can find you.',
        dims: { vulnerability: 2, rarity: 2, people: 2 },
      },
      'exp-graphic-design': {
        title: 'Post your 3 best designs',
        desc: 'Post your 3 best designs. Ask people which one they would pay for.',
        dims: { vulnerability: 2, people: 2 },
      },
      'exp-spreadsheets': {
        title: 'Post your most surprising finding',
        desc: 'Post your most surprising data finding. Make it visual. People love charts.',
        dims: { vulnerability: 2, rarity: 2 },
      },
      'exp-selling': {
        title: 'Record and post a pitch',
        desc: 'Record yourself pitching. Post it. Ask for feedback.',
        dims: { vulnerability: 2, people: 2, identity: 2 },
      },
    },
    cold_outreach: {
      _generic: {
        title: 'Reach out to 10 businesses',
        desc: 'Find 10 businesses that need your skill. Send each one a short message showing what you could do for them specifically. Not a template. Personal.',
        dims: { people: 2, money: 2, stakes: 2, vulnerability: 2 },
      },
    },
  },

  first_income: {
    _generic: {
      title: 'Complete your first paid project',
      desc: 'Complete your first paid project. Deliver great work. Ask for a testimonial.',
      dims: { money: 3, business_commitment: 2, identity: 2 },
    },
  },

  repeatable: {
    _generic: {
      title: 'Get your second client or raise your rate',
      desc: 'Get your second client or raise your rate by 20%. You have proven you can do this. Now make it stick.',
      dims: { money: 3, stakes: 2, business_commitment: 2 },
    },
  },
}
