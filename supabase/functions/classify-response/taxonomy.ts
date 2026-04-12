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
    id: 'kids_deserved_better',
    keywords: ['children', 'kids', 'parenting', 'education', 'youth', 'childhood', 'school', 'student', 'play', 'development'],
  },
  {
    id: 'voice_taken',
    keywords: ['silence', 'voice', 'suppressed', 'censored', 'erased', 'identity', 'invisible', 'unheard', 'gender', 'expression'],
  },
  {
    id: 'pain_not_believed',
    keywords: ['pain', 'health', 'body', 'illness', 'chronic', 'dying', 'sleep', 'burnout', 'exhaustion', 'disability'],
  },
  {
    id: 'world_losing',
    keywords: ['climate', 'environment', 'sustainability', 'planet', 'nature', 'conservation', 'species', 'ecological', 'green'],
  },
  {
    id: 'life_not_yours',
    keywords: ['oppression', 'control', 'rights', 'freedom', 'justice', 'discrimination', 'colonialism', 'apartheid', 'slavery'],
  },
  {
    id: 'feeling_stupid',
    keywords: ['jargon', 'confusing', 'complicated', 'explain', 'simplify', 'education', 'literacy', 'understand', 'clarity'],
  },
  {
    id: 'locked_out',
    keywords: ['access', 'cost', 'affordable', 'gatekeeping', 'credentials', 'privilege', 'inequality', 'poverty', 'opportunity'],
  },
  {
    id: 'work_treated_nothing',
    keywords: ['art', 'creativity', 'dismissed', 'ignored', 'stolen', 'credit', 'recognition', 'invisible', 'craft'],
  },
  {
    id: 'left_behind',
    keywords: ['abandoned', 'forgotten', 'homeless', 'displaced', 'refugee', 'veteran', 'elderly', 'community', 'mutual aid', 'invisible'],
  },
  {
    id: 'forgot_what_for',
    keywords: ['meaning', 'purpose', 'lost', 'direction', 'existential', 'spiritual', 'soul', 'why', 'emptiness', 'stuck'],
  },
  {
    id: 'stopped_wondering',
    keywords: ['certainty', 'dogma', 'rigid', 'closed', 'questioning', 'curious', 'dialogue', 'bias', 'assumptions', 'critical thinking'],
  },
  {
    id: 'work_hollows',
    keywords: ['burnout', 'work', 'job', 'career', 'exploit', 'dignity', 'corporate', 'quit', 'toxic', 'hustle', 'grind'],
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
