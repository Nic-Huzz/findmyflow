/**
 * Competence Wheels Taxonomy for Edge Function
 * Mirrors the frontend taxonomy for AI classification
 */

export const SKILLS_SEGMENTS = [
  {
    id: 'clarifying',
    keywords: ['explain', 'teach', 'simplify', 'translate', 'communicate', 'make clear', 'break down'],
  },
  {
    id: 'analyzing',
    keywords: ['data', 'patterns', 'logic', 'debug', 'diagnose', 'research', 'investigate', 'numbers', 'spreadsheets'],
  },
  {
    id: 'strategizing',
    keywords: ['plan', 'strategy', 'prioritize', 'decide', 'roadmap', 'vision', 'direction', 'big picture'],
  },
  {
    id: 'organizing',
    keywords: ['systems', 'processes', 'operations', 'logistics', 'order', 'structure', 'efficiency'],
  },
  {
    id: 'building',
    keywords: ['make', 'build', 'code', 'engineer', 'create things', 'construct', 'develop', 'prototype'],
  },
  {
    id: 'designing',
    keywords: ['design', 'UX', 'visual', 'aesthetic', 'experience', 'interface', 'beautiful', 'intuitive'],
  },
  {
    id: 'creating',
    keywords: ['art', 'write', 'ideate', 'invent', 'imagine', 'originate', 'compose', 'creative'],
  },
  {
    id: 'expressing',
    keywords: ['story', 'perform', 'present', 'voice', 'speak', 'share', 'articulate', 'storytelling'],
  },
  {
    id: 'connecting',
    keywords: ['network', 'empathy', 'facilitate', 'collaborate', 'bring together', 'relationships', 'listen'],
  },
  {
    id: 'influencing',
    keywords: ['sell', 'persuade', 'convince', 'motivate', 'negotiate', 'advocate', 'inspire'],
  },
  {
    id: 'nurturing',
    keywords: ['coach', 'mentor', 'develop', 'grow', 'support', 'care', 'guide', 'patience'],
  },
  {
    id: 'synthesizing',
    keywords: ['integrate', 'wisdom', 'big-picture', 'meaning', 'philosophy', 'connect dots', 'holistic'],
  },
];

export const PROBLEM_SEGMENTS = [
  {
    id: 'physical_vitality',
    keywords: ['health', 'fitness', 'energy', 'body', 'sleep', 'nutrition', 'illness', 'longevity', 'chronic'],
  },
  {
    id: 'mental_wellbeing',
    keywords: ['anxiety', 'stress', 'mindset', 'emotions', 'mental health', 'burnout', 'depression', 'overwhelm'],
  },
  {
    id: 'personal_mastery',
    keywords: ['skills', 'learning', 'productivity', 'habits', 'growth', 'development', 'discipline', 'potential'],
  },
  {
    id: 'intimate_bonds',
    keywords: ['relationship', 'marriage', 'dating', 'family', 'parenting', 'love', 'romance', 'partnership'],
  },
  {
    id: 'service_care',
    keywords: ['caregiving', 'elder', 'disability', 'support', 'helping others', 'healthcare', 'childcare'],
  },
  {
    id: 'creative_expression',
    keywords: ['art', 'creativity', 'voice', 'identity', 'expression', 'blocked', 'authentic', 'brand'],
  },
  {
    id: 'local_impact',
    keywords: ['team', 'organization', 'community', 'neighborhood', 'local', 'culture', 'workplace'],
  },
  {
    id: 'cultural_movements',
    keywords: ['belonging', 'identity', 'culture', 'movement', 'trends', 'subcultures', 'social'],
  },
  {
    id: 'economic_freedom',
    keywords: ['money', 'business', 'career', 'job', 'income', 'financial', 'work', 'entrepreneur', 'freedom', '9-5'],
  },
  {
    id: 'social_justice',
    keywords: ['inequality', 'discrimination', 'access', 'rights', 'fairness', 'advocacy', 'diversity'],
  },
  {
    id: 'planetary_health',
    keywords: ['climate', 'environment', 'sustainability', 'planet', 'nature', 'conservation', 'green'],
  },
  {
    id: 'human_progress',
    keywords: ['technology', 'innovation', 'knowledge', 'future', 'advancement', 'education', 'breakthrough'],
  },
];

export const PERSONA_SEGMENTS = [
  {
    id: 'seekers',
    keywords: ['lost', 'direction', 'purpose', 'meaning', 'clarity', 'finding themselves', 'confused'],
  },
  {
    id: 'builders',
    keywords: ['creating', 'building', 'making', 'entrepreneurship', 'starting', 'launching', 'project'],
  },
  {
    id: 'healers',
    keywords: ['hurting', 'recovering', 'healing', 'trauma', 'pain', 'suffering', 'broken', 'wounded'],
  },
  {
    id: 'teachers',
    keywords: ['learning', 'growing', 'developing', 'knowledge', 'education', 'skills', 'improve'],
  },
  {
    id: 'connectors',
    keywords: ['lonely', 'isolated', 'community', 'belonging', 'connection', 'friends', 'tribe'],
  },
  {
    id: 'achievers',
    keywords: ['success', 'winning', 'status', 'recognition', 'ambitious', 'goals', 'competitive'],
  },
  {
    id: 'explorers',
    keywords: ['freedom', 'adventure', 'autonomy', 'escape', 'flexibility', 'travel', 'independent'],
  },
  {
    id: 'visionaries',
    keywords: ['future', 'change', 'innovation', 'big ideas', 'transformation', 'vision', 'disrupt'],
  },
  {
    id: 'protectors',
    keywords: ['security', 'safety', 'stability', 'risk', 'protection', 'cautious', 'secure'],
  },
  {
    id: 'creators',
    keywords: ['expression', 'art', 'originality', 'creativity', 'voice', 'unique', 'artistic'],
  },
  {
    id: 'nurturers',
    keywords: ['family', 'caring', 'devoted', 'loved ones', 'support', 'children', 'parents'],
  },
  {
    id: 'challengers',
    keywords: ['injustice', 'change', 'disruption', 'truth', 'advocacy', 'rebel', 'fight'],
  },
];

export function getSegmentsForWheel(wheelType: string) {
  switch (wheelType) {
    case 'skills':
      return SKILLS_SEGMENTS;
    case 'problems':
      return PROBLEM_SEGMENTS;
    case 'persona':
      return PERSONA_SEGMENTS;
    default:
      throw new Error(`Unknown wheel type: ${wheelType}`);
  }
}
