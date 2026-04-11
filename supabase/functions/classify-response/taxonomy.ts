/**
 * Competence Wheels Taxonomy for Edge Function
 * Mirrors the frontend taxonomy for AI classification
 */

export const SKILLS_SEGMENTS = [
  {
    id: 'storytelling',
    keywords: ['story', 'write', 'narrative', 'memoir', 'content', 'journal', 'blog', 'newsletter', 'meaning'],
  },
  {
    id: 'teaching',
    keywords: ['explain', 'teach', 'simplify', 'translate', 'communicate', 'break down', 'clarify', 'framework', 'bridge'],
  },
  {
    id: 'coaching',
    keywords: ['coach', 'mentor', 'develop', 'grow', 'support', 'care', 'guide', 'patience', 'nurture', 'hold space'],
  },
  {
    id: 'performing',
    keywords: ['perform', 'present', 'speak', 'stage', 'keynote', 'podcast', 'MC', 'show', 'record', 'voice', 'body'],
  },
  {
    id: 'creating',
    keywords: ['art', 'invent', 'imagine', 'originate', 'compose', 'creative', 'hunch', 'remix', 'new', 'make'],
  },
  {
    id: 'building',
    keywords: ['build', 'make', 'code', 'engineer', 'prototype', 'ship', 'construct', 'develop', 'craft', 'hardware'],
  },
  {
    id: 'designing',
    keywords: ['design', 'UX', 'visual', 'aesthetic', 'experience', 'beautiful', 'intuitive', 'taste', 'feel', 'space'],
  },
  {
    id: 'leading',
    keywords: ['plan', 'strategy', 'prioritize', 'decide', 'vision', 'direction', 'systems', 'operations', 'organize'],
  },
  {
    id: 'connecting',
    keywords: ['network', 'empathy', 'facilitate', 'collaborate', 'community', 'relationships', 'host', 'gather'],
  },
  {
    id: 'speaking_up',
    keywords: ['truth', 'courage', 'advocate', 'activism', 'speak up', 'challenge', 'stand', 'justice', 'voice'],
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
