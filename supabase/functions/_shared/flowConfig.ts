// supabase/functions/_shared/flowConfig.ts
// Shared flow configuration — single source of truth for agent-submit and mcp-server.
// Mirrors src/flows/moneyModelConfigs.js for DB table/column mappings.

export interface FlowConfig {
  offersPath: string
  questionsPath: string
  dbTable: string
  dbColumns: { recommendedId: string; recommendedName: string; allScores: string }
  name: string
  description: string
}

export const FLOW_CONFIG: Record<string, FlowConfig> = {
  attraction_offer: {
    offersPath: '/Money Model/Attraction/offers.json',
    questionsPath: '/attraction-offer-questions.json',
    dbTable: 'attraction_offer_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
    name: 'Attraction Offer Assessment',
    description: 'Discover your ideal front-end offer to attract new customers — free trials, low-ticket products, or lead magnets.',
  },
  upsell_offer: {
    offersPath: '/Money Model/Upsell/offers.json',
    questionsPath: '/upsell-questions.json',
    dbTable: 'upsell_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
    name: 'Upsell Offer Assessment',
    description: 'Find the best upsell strategy to maximize revenue — Classic, Menu, Anchor, or Rollover.',
  },
  downsell_offer: {
    offersPath: '/Money Model/Downsell/offers.json',
    questionsPath: '/downsell-questions.json',
    dbTable: 'downsell_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
    name: 'Downsell Offer Assessment',
    description: 'Identify the right downsell approach to capture revenue from buyers who decline your core offer.',
  },
  continuity_offer: {
    offersPath: '/Money Model/Continuity/offers.json',
    questionsPath: '/continuity-questions.json',
    dbTable: 'continuity_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
    name: 'Continuity Offer Assessment',
    description: 'Determine the best recurring revenue model for your business — memberships, subscriptions, or retainers.',
  },
  leads_strategy: {
    offersPath: '/leads-strategy-offers.json',
    questionsPath: '/leads-strategy-questions.json',
    dbTable: 'leads_assessments',
    dbColumns: { recommendedId: 'recommended_strategy_id', recommendedName: 'recommended_strategy_name', allScores: 'all_strategy_scores' },
    name: 'Leads Strategy Assessment',
    description: 'Find the optimal lead generation strategy based on your network, time, budget, and business model.',
  },
  lead_magnet_offer: {
    offersPath: '/lead-magnet-offers.json',
    questionsPath: '/lead-magnet-questions.json',
    dbTable: 'lead_magnet_assessments',
    dbColumns: { recommendedId: 'recommended_type_id', recommendedName: 'recommended_type_name', allScores: 'all_type_scores' },
    name: 'Lead Magnet Assessment',
    description: 'Discover which type of lead magnet will convert best for your audience and business model.',
  },
}

export const VALID_FLOW_IDS = Object.keys(FLOW_CONFIG)
