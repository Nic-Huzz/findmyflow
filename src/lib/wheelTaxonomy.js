/**
 * Competence Wheels Taxonomy
 *
 * Defines the predefined segment taxonomy for all three wheels:
 * - Skills Wheel: What capabilities you bring
 * - Problem Wheel: What problems resonate with you
 * - Persona Wheel: Who you're drawn to serve
 *
 * These segments replace AI-generated cluster names with consistent,
 * predefined categories that flow through the entire app.
 */

// ============================================================================
// SKILLS WHEEL SEGMENTS
// Organized by value creation type
// ============================================================================

// Backwards-compat: map old v1 category ids to new v2 ids.
// Existing users have these stored in DB. Once they re-do the flow,
// new ids overwrite old ones and this mapping becomes unused.
export const LEGACY_SKILL_ID_MAP = {
  clarifying: 'teaching',
  analyzing: 'teaching',
  strategizing: 'leading',
  organizing: 'leading',
  expressing: 'storytelling',
  influencing: 'performing',
  nurturing: 'coaching',
  synthesizing: 'teaching',
  // These ids are unchanged between v1 and v2:
  // building, creating, designing, connecting
}

// Resolve a skill segment id (handles both old and new ids)
export function resolveSkillId(id) {
  if (!id) return null
  return LEGACY_SKILL_ID_MAP[id] || id
}

// Find a skill segment by id (handles legacy ids)
export function findSkillSegment(id) {
  const resolved = resolveSkillId(id)
  return SKILLS_SEGMENTS.find(s => s.id === resolved) || null
}

export const SKILLS_SEGMENTS = [
  {
    id: 'storytelling',
    displayName: 'Storytelling',
    aspirationalTitle: 'The Storyteller',
    tagline: 'Writing, narrative, making meaning through story',
    keywords: ['story', 'write', 'narrative', 'memoir', 'content', 'journal', 'blog', 'newsletter', 'meaning'],
    recognitionPhrases: [
      "You turn what you've lived into something others can hold",
      "You show up to the page whether you feel like it or not",
      "People say your stories change how they see things",
    ],
    exampleJobs: ['Author', 'Content Creator', 'Copywriter', 'Memoirist', 'Brand Storyteller', 'Newsletter Writer'],
    color: '#FF6B6B',
    icon: '📖',
    valueCreated: 'Books, newsletters, brand stories, memoir workshops, content',
    placemakes: [
      'Turning what you lived into something others can hold',
      'Showing up to the page whether you feel like it or not',
      'Telling the story the room needs to hear',
      'Going against the grain of how your world tells stories',
      'Noticing the detail that becomes the whole story',
    ],
  },
  {
    id: 'teaching',
    displayName: 'Teaching',
    aspirationalTitle: 'The Teacher',
    tagline: 'Explaining, simplifying, making the complex click',
    keywords: ['explain', 'teach', 'simplify', 'translate', 'communicate', 'break down', 'clarify', 'framework', 'bridge'],
    recognitionPhrases: [
      "You make complicated things feel simple",
      "You create the moment something finally clicks",
      "You build frameworks others can use without you",
    ],
    exampleJobs: ['Course Creator', 'Workshop Leader', 'YouTube Educator', 'Author', 'Framework Designer'],
    color: '#FF8E53',
    icon: '💡',
    valueCreated: 'Courses, workshops, YouTube education, masterclasses, books, frameworks',
    placemakes: [
      'Making the complex simple enough that anyone can hold it',
      'Creating the moment something finally clicks',
      'Building a framework others can use without you',
      'Bridging two worlds that don\'t know they need each other',
    ],
  },
  {
    id: 'coaching',
    displayName: 'Coaching',
    aspirationalTitle: 'The Coach',
    tagline: 'Growing people, mentoring, holding space',
    keywords: ['coach', 'mentor', 'develop', 'grow', 'support', 'care', 'guide', 'patience', 'nurture', 'hold space'],
    recognitionPhrases: [
      "You hold someone through the hard moments",
      "You see potential in people before they see it themselves",
      "People grow faster when you step back and let them",
    ],
    exampleJobs: ['Life Coach', 'Executive Coach', 'Therapist', 'Retreat Facilitator', 'Talent Developer'],
    color: '#8BC34A',
    icon: '🌱',
    valueCreated: '1:1 coaching, group programs, retreats, facilitation, talent development',
    placemakes: [
      'Holding someone through a hard moment',
      'Showing up with patience until something clicks',
      'Helping someone see what they can\'t see yet',
      'Stepping back so someone else can step forward',
    ],
  },
  {
    id: 'performing',
    displayName: 'Performing',
    aspirationalTitle: 'The Performer',
    tagline: 'Stage, speaking, presenting, being the show',
    keywords: ['perform', 'present', 'speak', 'stage', 'keynote', 'podcast', 'MC', 'show', 'record', 'voice', 'body'],
    recognitionPhrases: [
      "You make the moment itself the message",
      "People lean in when you take the stage",
      "You perform with nothing but your body and voice",
    ],
    exampleJobs: ['Keynote Speaker', 'MC', 'Podcaster', 'YouTuber', 'Event Producer', 'Workshop Leader'],
    color: '#FF5722',
    icon: '🎙️',
    valueCreated: 'Keynote speaking, MC work, podcasting, live events, YouTube, event production, workshops',
    placemakes: [
      'Making the moment itself the message',
      'Getting a room to lean forward',
      'Putting yourself on record',
      'Performing with nothing but your body and voice',
    ],
  },
  {
    id: 'creating',
    displayName: 'Creating',
    aspirationalTitle: 'The Creator',
    tagline: 'Inventing, art, making things that didn\'t exist',
    keywords: ['art', 'invent', 'imagine', 'originate', 'compose', 'creative', 'hunch', 'remix', 'new', 'make'],
    recognitionPhrases: [
      "You make things that didn't exist before",
      "You follow hunches everyone else ignores",
      "You make something with your hands every single day",
    ],
    exampleJobs: ['Artist', 'Inventor', 'Creative Director', 'Product Creator', 'Experience Designer'],
    color: '#E91E63',
    icon: '✨',
    valueCreated: 'Art, products, creative direction, IP, experiences, category creation',
    placemakes: [
      'Making something that didn\'t exist before',
      'Following a hunch everyone said was wrong',
      'Remixing two things nobody thought to combine',
      'Making something with your hands every single day',
    ],
  },
  {
    id: 'building',
    displayName: 'Building',
    aspirationalTitle: 'The Builder',
    tagline: 'Making with hands, prototyping, shipping, craft',
    keywords: ['build', 'make', 'code', 'engineer', 'prototype', 'ship', 'construct', 'develop', 'craft', 'hardware'],
    recognitionPhrases: [
      "You get your hands on the actual thing",
      "You prototype until it works no matter how many tries",
      "You do whatever it takes to physically bring it into existence",
    ],
    exampleJobs: ['Software Developer', 'Engineer', 'Maker', 'Carpenter', 'Product Builder', 'Craftsperson'],
    color: '#4D96FF',
    icon: '🔨',
    valueCreated: 'Products, apps, physical goods, maker businesses, hardware, bootstrapped ventures',
    placemakes: [
      'Getting your hands on the actual thing',
      'Prototyping until it works no matter how many tries',
      'Doing whatever it takes to physically bring it into existence',
      'Building something from scratch because nothing good enough exists',
      'Noticing what\'s broken and not being able to leave it alone',
    ],
  },
  {
    id: 'designing',
    displayName: 'Designing',
    aspirationalTitle: 'The Designer',
    tagline: 'Aesthetics, taste, beauty, shaping how things feel',
    keywords: ['design', 'UX', 'visual', 'aesthetic', 'experience', 'beautiful', 'intuitive', 'taste', 'feel', 'space'],
    recognitionPhrases: [
      "You shape how a space or moment feels",
      "You obsess over the detail everyone else skips",
      "You strip away everything that doesn't belong",
    ],
    exampleJobs: ['Experience Designer', 'Event Designer', 'Interior Designer', 'UX Designer', 'Brand Designer'],
    color: '#9B59B6',
    icon: '🎨',
    valueCreated: 'Experience design, event design, interior design, hospitality, UX, brand',
    placemakes: [
      'Shaping how a space or moment feels',
      'Obsessing over the detail everyone else skips',
      'Stripping away everything that doesn\'t belong',
    ],
  },
  {
    id: 'leading',
    displayName: 'Leading',
    aspirationalTitle: 'The Leader',
    tagline: 'Strategy, vision, game-design, organizing, running things',
    keywords: ['plan', 'strategy', 'prioritize', 'decide', 'vision', 'direction', 'systems', 'operations', 'organize'],
    recognitionPhrases: [
      "You see a future nobody else sees and build the rules to get there",
      "You build systems that run without you in the room",
      "You turn a mess no one wants to touch into something that runs",
    ],
    exampleJobs: ['Consultant', 'Fractional Leader', 'Operations Advisor', 'Strategist', 'Turnaround Specialist'],
    color: '#FFD93D',
    icon: '🎯',
    valueCreated: 'Consulting, fractional leadership, operations, advisory, turnaround',
    placemakes: [
      'Seeing a future nobody else sees and building the rules to get there',
      'Building a system that runs without you in the room',
      'Making the right call when the stakes are highest',
      'Turning a mess no one wants to touch into something that runs',
      'Spotting the number everyone else walked past',
    ],
  },
  {
    id: 'connecting',
    displayName: 'Connecting',
    aspirationalTitle: 'The Connector',
    tagline: 'Community, gathering, hosting, introducing, being glue',
    keywords: ['network', 'empathy', 'facilitate', 'collaborate', 'community', 'relationships', 'host', 'gather'],
    recognitionPhrases: [
      "You build communities from nothing",
      "You hold space for conversations nobody else will host",
      "You're the person who holds a scattered room together",
    ],
    exampleJobs: ['Community Builder', 'Event Host', 'Retreat Leader', 'Facilitator', 'Partnership Broker'],
    color: '#00BCD4',
    icon: '🤝',
    valueCreated: 'Community building, events, retreats, facilitation, partnerships, network-weaving',
    placemakes: [
      'Building a community from nothing',
      'Holding space for a conversation nobody else will host',
      'Making a gathering people walk away changed by',
      'Being the person who holds a scattered room together',
    ],
  },
  {
    id: 'speaking_up',
    displayName: 'Speaking up',
    aspirationalTitle: 'The Truth-Teller',
    tagline: 'Truth-telling, activism, courage, standing for something',
    keywords: ['truth', 'courage', 'advocate', 'activism', 'speak up', 'challenge', 'stand', 'justice', 'voice'],
    recognitionPhrases: [
      "You speak truth to power face to face",
      "You stand alone against an industry that rewards silence",
      "You challenge the room you have to keep working in tomorrow",
    ],
    exampleJobs: ['Advocate', 'Journalist', 'Campaign Leader', 'Movement Builder', 'Cause Entrepreneur'],
    color: '#F44336',
    icon: '🔥',
    valueCreated: 'Advocacy, journalism, campaigns, movement-building, cause-based entrepreneurship, speaking',
    placemakes: [
      'Speaking truth to power face to face',
      'Speaking from inside your own wound',
      'Standing alone against an industry that rewards silence',
      'Refusing to stop saying it when no one\'s listening yet',
      'Challenging the room you have to keep working in tomorrow',
    ],
  },
];

// ============================================================================
// PROBLEM WHEEL SEGMENTS
// Organized by Spheres of Impact: Self → Relational → Community → World
// ============================================================================

// Backwards-compat: map old v1 problem ids to new v2 ids.
export const LEGACY_PROBLEM_ID_MAP = {
  physical_vitality: 'pain_not_believed',
  mental_wellbeing: 'forgot_what_for',
  personal_mastery: 'feeling_stupid',
  intimate_bonds: 'left_behind',
  service_care: 'left_behind',
  creative_expression: 'work_treated_nothing',
  local_impact: 'left_behind',
  cultural_movements: 'voice_taken',
  economic_freedom: 'work_hollows',
  social_justice: 'life_not_yours',
  planetary_health: 'world_losing',
  human_progress: 'feeling_stupid',
}

export function resolveProblemId(id) {
  if (!id) return null
  return LEGACY_PROBLEM_ID_MAP[id] || id
}

export function findProblemSegment(id) {
  const resolved = resolveProblemId(id)
  return PROBLEM_SEGMENTS.find(s => s.id === resolved) || null
}

export const PROBLEM_SEGMENTS = [
  {
    id: 'kids_deserved_better',
    displayName: 'Kids who deserved better',
    tagline: 'Children dismissed, labelled, hit, or left to face the worst alone',
    keywords: ['children', 'kids', 'parenting', 'education', 'youth', 'childhood', 'school', 'student', 'play', 'development'],
    recognitionPhrases: [
      "You can't stand how we treat kids",
      "Every child deserves someone who actually sees them",
      "You remember what it felt like to not be heard as a kid",
    ],
    color: '#FF6B6B',
    icon: '🧸',
    placemakes: [
      'Kids being talked at instead of talked to',
      'Children written off before anyone gives them a real chance',
      'Children facing the worst moments of history with no adult beside them',
      'Students not learning because nobody in the building actually likes them',
      'Children being pushed into a life their parents chose for them',
    ],
  },
  {
    id: 'voice_taken',
    displayName: 'The voice that got taken',
    tagline: 'People whose voice was taken, suppressed, or erased before they could use it',
    keywords: ['silence', 'voice', 'suppressed', 'censored', 'erased', 'identity', 'invisible', 'unheard', 'gender', 'expression'],
    recognitionPhrases: [
      "You know what it feels like to have your voice taken",
      "You help people say what they were never allowed to",
      "You carry the stories nobody else will tell",
    ],
    color: '#FF8E53',
    icon: '🤐',
    placemakes: [
      'Childhood trauma stealing your ability to speak',
      'Women being told to sit down and be quiet for thousands of years',
      'Speaking the truth and losing your country for it',
      'Being forced to hide who you really are just to be accepted',
      'Carrying shame in silence because nobody models speaking about it',
    ],
  },
  {
    id: 'pain_not_believed',
    displayName: 'Pain that nobody takes seriously',
    tagline: 'Physical suffering that nobody names, treats, or believes is real',
    keywords: ['pain', 'health', 'body', 'illness', 'chronic', 'dying', 'sleep', 'burnout', 'exhaustion', 'disability'],
    recognitionPhrases: [
      "You know what it's like when nobody believes your pain is real",
      "You've seen what happens when the body is ignored",
      "You help people when the medical system has given up",
    ],
    color: '#E91E63',
    icon: '💔',
    placemakes: [
      'A body in constant pain with no way to tell anyone what it feels like',
      'People dying in pain because the building they are in was not designed for dying',
      'Poor people dying of treatable diseases because someone decided they were not worth treating',
      'Burnout being treated as a badge of honour until your body forces you to stop',
    ],
  },
  {
    id: 'world_losing',
    displayName: 'The world we\'re losing',
    tagline: 'Ecological destruction, species loss, and climate crisis happening while most people look away',
    keywords: ['climate', 'environment', 'sustainability', 'planet', 'nature', 'conservation', 'species', 'ecological', 'green'],
    recognitionPhrases: [
      "You feel the weight of what we're doing to this planet",
      "You can't look away from what's disappearing",
      "You believe the future depends on what we change now",
    ],
    color: '#8BC34A',
    icon: '🌍',
    placemakes: [
      'The natural world being poisoned while governments look the other way',
      'The climate crisis being treated as tomorrow\'s problem when it is already here',
      'Businesses profiting from nature while destroying it',
      'Our language making it impossible to treat the natural world as alive',
    ],
  },
  {
    id: 'life_not_yours',
    displayName: 'A life that isn\'t yours to live',
    tagline: 'Systems of control that own, oppress, or decide your life for you',
    keywords: ['oppression', 'control', 'rights', 'freedom', 'justice', 'discrimination', 'colonialism', 'apartheid', 'slavery'],
    recognitionPhrases: [
      "You can't look away when someone's life isn't their own",
      "You fight for people who don't have a seat at the table",
      "You know what it feels like to have your choices made for you",
    ],
    color: '#F44336',
    icon: '⛓️',
    placemakes: [
      'People being owned as property by other people',
      'An entire population being dehumanized by law based on the colour of their skin',
      'Democracies dying because people obey before they are even asked to',
      'Ordinary people having no power against the institutions that run their lives',
    ],
  },
  {
    id: 'feeling_stupid',
    displayName: 'Feeling stupid when you\'re not',
    tagline: 'Knowledge made unnecessarily hard, wrapped in jargon, or explained so badly you blame yourself',
    keywords: ['jargon', 'confusing', 'complicated', 'explain', 'simplify', 'education', 'literacy', 'understand', 'clarity'],
    recognitionPhrases: [
      "You've been made to feel stupid by someone who just couldn't explain it",
      "You believe if someone doesn't understand, the teacher failed, not the student",
      "You make hard things feel obvious",
    ],
    color: '#FFD93D',
    icon: '💡',
    placemakes: [
      'Important knowledge buried behind jargon nobody can get through',
      'The whole world being wrong about basic facts and nobody correcting them',
      'Mathematics being taught so badly that people decide they are not smart enough',
      'Being afraid to cook because nobody taught you the why, only the recipe',
      'Software designed to impress IT departments instead of helping actual humans',
    ],
  },
  {
    id: 'locked_out',
    displayName: 'Locked out of what you need',
    tagline: 'Education, healthcare, opportunity, or basic dignity blocked by cost, credentials, or gatekeeping',
    keywords: ['access', 'cost', 'affordable', 'gatekeeping', 'credentials', 'privilege', 'inequality', 'poverty', 'opportunity'],
    recognitionPhrases: [
      "You've seen talented people stuck because the door was locked from outside",
      "You believe access shouldn't depend on privilege",
      "You build bridges over walls other people built",
    ],
    color: '#4D96FF',
    icon: '🔒',
    placemakes: [
      'Education being out of reach for anyone who can not pay',
      'Girls being told they cannot go to school on pain of death',
      'Tools you need being too expensive or complicated for anyone without training',
      'Talented people stuck in poverty because the doors are locked from outside',
    ],
  },
  {
    id: 'work_treated_nothing',
    displayName: 'Your work being treated as nothing',
    tagline: 'Art, craft, and creative vision being blocked, stolen, ignored, or treated as less than serious',
    keywords: ['art', 'creativity', 'dismissed', 'ignored', 'stolen', 'credit', 'recognition', 'invisible', 'craft'],
    recognitionPhrases: [
      "You know what it's like to pour yourself into something and have it dismissed",
      "You've watched someone else get credit for what you built",
      "You help people treat their creative work as serious work",
    ],
    color: '#9B59B6',
    icon: '🎭',
    placemakes: [
      'The world not being ready for what a woman artist already knows',
      'Being told your designs are impossible when the real issue is who drew them',
      'Choosing between making honest work and paying the rent',
      'Someone else getting credit for what you built',
      'Having to will yourself into existence because nobody makes room for you',
    ],
  },
  {
    id: 'left_behind',
    displayName: 'Being left behind',
    tagline: 'People abandoned by systems built without them, falling through cracks nobody designed a net for',
    keywords: ['abandoned', 'forgotten', 'homeless', 'displaced', 'refugee', 'veteran', 'elderly', 'community', 'mutual aid', 'invisible'],
    recognitionPhrases: [
      "You go back for the people everyone else has left behind",
      "You build the net that should have been there all along",
      "You know the system wasn't built for everyone",
    ],
    color: '#00BCD4',
    icon: '🕳️',
    placemakes: [
      'Homeless people being asked to prove they deserve a meal before they get one',
      'Communities being abandoned by everyone who could leave',
      'Veterans suffering not from war but from coming home to a society with no place for them',
      'People going hungry in disasters because the relief system is slower than a kitchen',
      'Cities built for cars and planners instead of the people who actually live there',
    ],
  },
  {
    id: 'forgot_what_for',
    displayName: 'Forgetting what it was all for',
    tagline: 'The search for purpose, connection, and what makes a life worth living when the old answers stop working',
    keywords: ['meaning', 'purpose', 'lost', 'direction', 'existential', 'spiritual', 'soul', 'why', 'emptiness', 'stuck'],
    recognitionPhrases: [
      "You've woken up and not known why you're doing any of it",
      "You help people find what they lost along the way",
      "You sit with the questions that don't have easy answers",
    ],
    color: '#673AB7',
    icon: '🌑',
    placemakes: [
      'Losing everything and having to choose whether meaning still exists',
      'Not being able to see your own life story as something that matters',
      'Your mind being your own worst enemy every morning before you even get out of bed',
      'Chasing winning so hard you forget to build the character that makes winning worth it',
    ],
  },
  {
    id: 'stopped_wondering',
    displayName: 'People who stopped wondering',
    tagline: 'The damage done when people stop questioning and start knowing, in science, politics, or daily life',
    keywords: ['certainty', 'dogma', 'rigid', 'closed', 'questioning', 'curious', 'dialogue', 'bias', 'assumptions', 'critical thinking'],
    recognitionPhrases: [
      "You've been in rooms where nobody asks questions anymore",
      "You know the damage that certainty does when it stops being curious",
      "You help people sit with not knowing",
    ],
    color: '#FF5722',
    icon: '🔮',
    placemakes: [
      'Absolute certainty turning people into the worst version of themselves',
      'Smart people making terrible decisions because they only use one lens',
      'Groups that can not think together because everyone is defending their position',
      'Fooling yourself and calling it science',
    ],
  },
  {
    id: 'work_hollows',
    displayName: 'Work that hollows you out',
    tagline: 'Jobs that strip dignity, businesses that exploit, and systems that treat workers as disposable',
    keywords: ['burnout', 'work', 'job', 'career', 'exploit', 'dignity', 'corporate', 'quit', 'toxic', 'hustle', 'grind'],
    recognitionPhrases: [
      "You've felt your job slowly eating you alive",
      "You know work should build people up, not break them down",
      "You help people find work that feeds them instead of draining them",
    ],
    color: '#6BCB77',
    icon: '🏭',
    placemakes: [
      'Watching your father come home from work with his dignity gone',
      'Doing a job that produces nothing and knowing it every single day',
      'Wall Street punishing companies for treating their workers well',
      'Workers being treated as disposable by companies that could not function without them',
    ],
  },
];

// ============================================================================
// PERSONA WHEEL SEGMENTS
// Psychographic types of customers you serve
// ============================================================================

export const PERSONA_SEGMENTS = [
  {
    id: 'seekers',
    displayName: 'Seekers',
    aspirationalTitle: 'The Compass',
    tagline: 'You guide lost souls home',
    keywords: ['lost', 'direction', 'purpose', 'meaning', 'clarity', 'finding themselves', 'confused'],
    recognitionPhrases: [
      "They know something needs to change but not what",
      "They've been searching for their thing and haven't found it",
      "They feel lost but ready to be found",
    ],
    color: '#FF6B6B',
    icon: '🧭',
    coreDrive: 'Direction',
    whatTheySeeking: 'Clarity on their path',
    yourRole: 'Guide, compass',
  },
  {
    id: 'builders',
    displayName: 'Builders',
    aspirationalTitle: 'The Architect',
    tagline: 'You help dreams take shape',
    keywords: ['creating', 'building', 'making', 'entrepreneurship', 'starting', 'launching', 'project'],
    recognitionPhrases: [
      "They have an idea burning inside them",
      "They're ready to create something but need the blueprint",
      "They don't want to dream about it — they want to build it",
    ],
    color: '#FF8E53',
    icon: '🏗️',
    coreDrive: 'Creation',
    whatTheySeeking: 'Help building something',
    yourRole: 'Architect, enabler',
  },
  {
    id: 'healers',
    displayName: 'Healers',
    aspirationalTitle: 'The Mender',
    tagline: 'You restore what\'s broken',
    keywords: ['hurting', 'recovering', 'healing', 'trauma', 'pain', 'suffering', 'broken', 'wounded'],
    recognitionPhrases: [
      "They're carrying something heavy",
      "They've tried to fix it alone and hit a wall",
      "They need someone who truly gets it, not just advice",
    ],
    color: '#FFD93D',
    icon: '🩹',
    coreDrive: 'Wholeness',
    whatTheySeeking: 'Recovery from pain',
    yourRole: 'Healer, supporter',
  },
  {
    id: 'teachers',
    displayName: 'Teachers',
    aspirationalTitle: 'The Illuminator',
    tagline: 'You light the path of knowledge',
    keywords: ['learning', 'growing', 'developing', 'knowledge', 'education', 'skills', 'improve'],
    recognitionPhrases: [
      "They're hungry to learn and grow",
      "They know they're capable of more",
      "They want a mentor, not just a course",
    ],
    color: '#6BCB77',
    icon: '📚',
    coreDrive: 'Growth',
    whatTheySeeking: 'Knowledge and skills',
    yourRole: 'Mentor, expert',
  },
  {
    id: 'connectors',
    displayName: 'Connectors',
    aspirationalTitle: 'The Weaver',
    tagline: 'You create belonging',
    keywords: ['lonely', 'isolated', 'community', 'belonging', 'connection', 'friends', 'tribe'],
    recognitionPhrases: [
      "They feel like no one really understands them",
      "They're looking for their people",
      "They're tired of doing it alone",
    ],
    color: '#4D96FF',
    icon: '🕸️',
    coreDrive: 'Belonging',
    whatTheySeeking: 'Community and relationships',
    yourRole: 'Host, facilitator',
  },
  {
    id: 'achievers',
    displayName: 'Achievers',
    aspirationalTitle: 'The Accelerator',
    tagline: 'You propel success',
    keywords: ['success', 'winning', 'status', 'recognition', 'ambitious', 'goals', 'competitive'],
    recognitionPhrases: [
      "They've already had success but want the next level",
      "They're driven, competitive, and impatient",
      "They don't want encouragement — they want a game plan",
    ],
    color: '#9B59B6',
    icon: '🏆',
    coreDrive: 'Success',
    whatTheySeeking: 'Status and recognition',
    yourRole: 'Coach, accelerator',
  },
  {
    id: 'explorers',
    displayName: 'Explorers',
    aspirationalTitle: 'The Liberator',
    tagline: 'You set the caged free',
    keywords: ['freedom', 'adventure', 'autonomy', 'escape', 'flexibility', 'travel', 'independent'],
    recognitionPhrases: [
      "They feel caged by their current life",
      "They crave freedom more than security",
      "They'd rather risk everything than stay stuck",
    ],
    color: '#E91E63',
    icon: '🗺️',
    coreDrive: 'Freedom',
    whatTheySeeking: 'Adventure and autonomy',
    yourRole: 'Liberator, guide',
  },
  {
    id: 'visionaries',
    displayName: 'Visionaries',
    aspirationalTitle: 'The Pioneer',
    tagline: 'You chart new territories',
    keywords: ['future', 'change', 'innovation', 'big ideas', 'transformation', 'vision', 'disrupt'],
    recognitionPhrases: [
      "They see a future no one else can see yet",
      "They're tired of people saying 'be realistic'",
      "They need a partner, not a doubter",
    ],
    color: '#FF5722',
    icon: '🔭',
    coreDrive: 'Impact',
    whatTheySeeking: 'Change the future',
    yourRole: 'Partner, amplifier',
  },
  {
    id: 'protectors',
    displayName: 'Protectors',
    aspirationalTitle: 'The Shield',
    tagline: 'You create safety',
    keywords: ['security', 'safety', 'stability', 'risk', 'protection', 'cautious', 'secure'],
    recognitionPhrases: [
      "They worry about what could go wrong",
      "They need to feel safe before they can move forward",
      "They protect the people they love — sometimes at their own expense",
    ],
    color: '#00BCD4',
    icon: '🛡️',
    coreDrive: 'Security',
    whatTheySeeking: 'Safety and stability',
    yourRole: 'Guardian, advisor',
  },
  {
    id: 'creators',
    displayName: 'Creators',
    aspirationalTitle: 'The Muse',
    tagline: 'You inspire expression',
    keywords: ['expression', 'art', 'originality', 'creativity', 'voice', 'unique', 'artistic'],
    recognitionPhrases: [
      "They need to express something that's uniquely theirs",
      "They feel suffocated when they can't create",
      "They don't want to fit in — they want to stand out",
    ],
    color: '#F44336',
    icon: '🎨',
    coreDrive: 'Expression',
    whatTheySeeking: 'Voice and originality',
    yourRole: 'Muse, champion',
  },
  {
    id: 'nurturers',
    displayName: 'Nurturers',
    aspirationalTitle: 'The Anchor',
    tagline: 'You hold families together',
    keywords: ['family', 'caring', 'devoted', 'loved ones', 'support', 'children', 'parents'],
    recognitionPhrases: [
      "Everything they do is for someone they love",
      "They put everyone else first and themselves last",
      "They need support so they can keep supporting others",
    ],
    color: '#8BC34A',
    icon: '⚓',
    coreDrive: 'Care',
    whatTheySeeking: 'Support for loved ones',
    yourRole: 'Helper, resource',
  },
  {
    id: 'challengers',
    displayName: 'Challengers',
    aspirationalTitle: 'The Truth Teller',
    tagline: 'You speak what must be said',
    keywords: ['injustice', 'change', 'disruption', 'truth', 'advocacy', 'rebel', 'fight'],
    recognitionPhrases: [
      "They can't stay silent when something is wrong",
      "They'd rather be unpopular than dishonest",
      "They're looking for allies, not audiences",
    ],
    color: '#673AB7',
    icon: '⚡',
    coreDrive: 'Justice',
    whatTheySeeking: 'Fight against injustice',
    yourRole: 'Ally, activist',
  },
];

// ============================================================================
// DIMENSIONAL DATA
// Second dimensions for 2D wheel mapping
// ============================================================================

/**
 * Problem Types - Second dimension for Problem Wheel
 * Captures WHAT KIND of problem it is, not just the domain
 */
export const PROBLEM_TYPES = [
  {
    id: 'access',
    label: 'Access',
    description: "They can't get what they need",
    examples: ["I can't afford therapy", "There's no gym near me"],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    description: "They don't know how",
    examples: ["I don't know how to start a business", "I don't understand nutrition"],
  },
  {
    id: 'capability',
    label: 'Capability',
    description: "They lack the skills",
    examples: ["I can't code", "I'm not good at public speaking"],
  },
  {
    id: 'motivation',
    label: 'Motivation',
    description: "They can't make themselves do it",
    examples: ["I keep procrastinating", "I start but never finish"],
  },
  {
    id: 'connection',
    label: 'Connection',
    description: "They're isolated",
    examples: ["I have no network", "I don't know anyone in my industry"],
  },
  {
    id: 'system',
    label: 'System',
    description: "They're trapped by structures",
    examples: ["My job won't let me work remotely", "The system is rigged against me"],
  },
];

/**
 * Journey Stages - Rings for Persona Wheel
 * Where the customer is in their awareness journey
 */
export const JOURNEY_STAGES = [
  {
    id: 'awakening',
    label: 'Awakening',
    ring: 'inner',
    color: '#E9A23B', // Orange
    description: 'Just realized they have this problem',
    mindset: 'Something needs to change',
    businessAdvice: 'Educational content, free resources, awareness building',
  },
  {
    id: 'struggling',
    label: 'Struggling',
    ring: 'middle',
    color: '#E9A23B', // Orange
    description: 'Actively trying to solve, hitting walls',
    mindset: "I've tried things, nothing works",
    businessAdvice: 'Done-with-you offers, coaching, guided programs',
  },
  {
    id: 'ready',
    label: 'Ready',
    ring: 'outer',
    color: '#E9A23B', // Orange
    description: 'Have budget, urgency, seeking solution',
    mindset: 'I need help NOW, take my money',
    businessAdvice: 'Premium offers, done-for-you, high-touch services',
  },
];

/**
 * Problems Proficiency Rings - 3-ring system for Problems wheel
 * Based on opportunity stage: have you explored, pursued, or proven this problem space?
 */
export const PROBLEMS_PROFICIENCY_RINGS = [
  {
    id: 'exploring',
    label: 'Exploring',
    ring: 'inner',
    color: '#E9A23B', // Orange
    description: 'New opportunity, curious but haven\'t pursued yet',
    indicators: ['Interested but haven\'t started', 'Researching the space', 'No track record yet'],
    businessAdvice: 'Research more, test interest before committing, find mentors in this space',
  },
  {
    id: 'pursuing',
    label: 'Pursuing',
    ring: 'middle',
    color: '#E9A23B', // Orange
    description: 'Currently working on this problem',
    indicators: ['Actively building solutions', 'Learning through doing', 'Growing experience'],
    businessAdvice: 'Build here, document your journey, create offers while learning',
  },
  {
    id: 'proven',
    label: 'Proven',
    ring: 'outer',
    color: '#E9A23B', // Orange
    description: 'Previously pursued, have results and experience',
    indicators: ['Have success stories', 'Battle-tested knowledge', 'Others seek your advice'],
    businessAdvice: 'Lead with this, case studies, premium positioning, teaching content',
  },
];

/**
 * Role Archetypes - Rings for Skills Wheel (Primary 2D dimension)
 * How you primarily express each skill
 */
export const ROLES = [
  {
    id: 'maker',
    label: 'Maker',
    ring: 'ring-1', // Innermost
    description: 'Builds products, systems, content',
    jobTypes: ['Engineer', 'Developer', 'Creator', 'Producer'],
    deliveryMode: 'Products, Tools, Content',
  },
  {
    id: 'guide',
    label: 'Guide',
    ring: 'ring-2',
    description: 'Develops people directly',
    jobTypes: ['Coach', 'Teacher', 'Mentor', 'Therapist'],
    deliveryMode: '1:1 or Group Sessions',
  },
  {
    id: 'analyst',
    label: 'Analyst',
    ring: 'ring-3',
    description: 'Researches, discovers insights',
    jobTypes: ['Researcher', 'Data Scientist', 'Investigator'],
    deliveryMode: 'Reports, Analysis, Recommendations',
  },
  {
    id: 'strategist',
    label: 'Strategist',
    ring: 'ring-4',
    description: 'Plans, advises, directs',
    jobTypes: ['Consultant', 'Advisor', 'Fractional Executive'],
    deliveryMode: 'Strategy, Roadmaps, Decisions',
  },
  {
    id: 'connector',
    label: 'Connector',
    ring: 'ring-5', // Outermost
    description: 'Facilitates, networks, hosts',
    jobTypes: ['Community Builder', 'Networker', 'Facilitator'],
    deliveryMode: 'Events, Introductions, Spaces',
  },
];

/**
 * Proficiency Rings - 3-ring system for Skills/Problems/Persona wheels
 * Based on user self-assessment: "Could I confidently teach this?"
 */
export const PROFICIENCY_RINGS = [
  {
    id: 'emerging',
    label: 'Emerging',
    ring: 'inner',
    color: '#E9A23B', // Orange
    description: 'Still learning, passionate but developing',
    indicators: ['Still learning', 'Wouldn\'t offer professionally yet', 'Need more practice'],
    businessAdvice: 'Growth opportunity - develop before monetizing, or partner with experts',
  },
  {
    id: 'establishing',
    label: 'Establishing',
    ring: 'middle',
    color: '#E9A23B', // Orange
    description: 'Competent and building experience',
    indicators: ['Can do it well', 'Wouldn\'t call myself expert', 'Building track record'],
    businessAdvice: 'Supporting offer - "done for you" services, share your journey',
  },
  {
    id: 'mastering',
    label: 'Mastering',
    ring: 'outer',
    color: '#E9A23B', // Orange
    description: 'Expert level, could teach others',
    indicators: ['Could teach this confidently', 'People come to me for advice', 'Significant experience'],
    businessAdvice: 'Lead with this - core offer, premium pricing, teaching content',
  },
];

/**
 * Skill Maturity - Legacy dimension (kept for reference)
 * How developed the skill is
 */
export const SKILL_MATURITY = [
  {
    id: 'emerging',
    label: 'Emerging',
    ring: 'inner',
    description: 'Beginning to develop',
    indicators: ['Just learning', 'Basic awareness', 'Needs guidance'],
  },
  {
    id: 'proficient',
    label: 'Proficient',
    ring: 'middle',
    description: 'Competent and growing',
    indicators: ['Can work independently', 'Solid foundation', 'Getting results'],
  },
  {
    id: 'mastery',
    label: 'Mastery',
    ring: 'outer',
    description: 'Expert level',
    indicators: ['Can teach others', 'Innovative applications', 'Industry recognition'],
  },
];

/**
 * Energy Source - Bonus dimension for Skills Wheel
 * Where the motivation to use this skill comes from
 */
export const ENERGY_SOURCES = [
  {
    id: 'intrinsic',
    label: 'Intrinsic',
    description: 'You LOVE doing this - it energizes you',
    flowCompassCorrelation: 'north', // Correlates with Flow state
  },
  {
    id: 'developed',
    label: 'Developed',
    description: "You're good at it but it's effort",
    flowCompassCorrelation: 'east', // Correlates with Redirect state
  },
  {
    id: 'compensated',
    label: 'Compensated',
    description: 'You only do it if well paid',
    flowCompassCorrelation: 'west', // Correlates with Honour state
  },
];

/**
 * Engagement Depth - Bonus dimension for Persona Wheel
 * What level of help they want
 */
export const ENGAGEMENT_DEPTH = [
  {
    id: 'diy',
    label: 'DIY',
    description: 'Content, templates, self-serve',
    priceLevel: 'Low ticket',
    examples: ['eBooks', 'Templates', 'Courses'],
  },
  {
    id: 'guided',
    label: 'Guided',
    description: 'Courses, group coaching, community',
    priceLevel: 'Mid ticket',
    examples: ['Group programs', 'Cohort courses', 'Membership'],
  },
  {
    id: 'done_with',
    label: 'Done-With',
    description: '1:1 coaching, consulting, high-touch',
    priceLevel: 'High ticket',
    examples: ['1:1 coaching', 'Consulting', 'VIP days'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get segment by ID for any wheel type
 */
export function getSegmentById(wheelType, segmentId) {
  const segments = getSegmentsForWheel(wheelType);
  return segments.find(s => s.id === segmentId);
}

/**
 * Get all segments for a wheel type
 */
export function getSegmentsForWheel(wheelType) {
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

/**
 * Get dimensional data for a wheel type
 *
 * Skills: 12 segments × 5 roles = 60 cells (2D throughout flow)
 * Problems: 12 domains × 6 problem types = 72 cells (1D during flow, 2D on summary)
 * Persona: 12 psychographics × 3 journey stages = 36 cells (1D during flow, 2D on summary)
 */
export function getDimensionsForWheel(wheelType) {
  switch (wheelType) {
    case 'skills':
      return { rings: ROLES, bonus: ENERGY_SOURCES }; // 5 role rings
    case 'problems':
      return { rings: PROBLEM_TYPES, bonus: null }; // 6 problem type rings
    case 'persona':
      return { rings: JOURNEY_STAGES, bonus: ENGAGEMENT_DEPTH }; // 3 journey stage rings
    default:
      throw new Error(`Unknown wheel type: ${wheelType}`);
  }
}

/**
 * Get combined identity statement from lit segments
 */
export function getCombinedIdentity(skillSegments, problemSegments, personaSegments) {
  const primarySkill = skillSegments[0];
  const primaryProblem = problemSegments[0];
  const primaryPersona = personaSegments[0];

  if (!primarySkill || !primaryProblem || !primaryPersona) {
    return null;
  }

  // Build a combined title
  const skillTitle = primarySkill.aspirationalTitle.replace('The ', '');
  const problemTitle = primaryProblem.aspirationalTitle;
  const personaTitle = primaryPersona.aspirationalTitle.replace('The ', '');

  return {
    title: `The ${skillTitle} ${problemTitle}`,
    description: `A ${skillTitle} who helps ${primaryPersona.displayName.toLowerCase()} ${primaryProblem.tagline.toLowerCase()}.`,
    superpower: `Your superpower: ${primarySkill.valueCreated} for ${primaryPersona.displayName.toLowerCase()}.`,
  };
}

/**
 * Get classification prompt for AI
 */
export function getClassificationPrompt(wheelType, response) {
  const segments = getSegmentsForWheel(wheelType);
  const segmentList = segments
    .map(s => `- ${s.id}: ${s.keywords.join(', ')}`)
    .join('\n');

  return `
Classify this user response into the predefined categories.

Response: "${response}"

Categories:
${segmentList}

Return JSON with segments array (can be 1-3 matches) and confidence scores (0-1).
Format: { "segments": [{ "id": "teaching", "confidence": 0.9 }] }
`;
}

/**
 * Feature matrix for Product Blueprint
 * Maps problem domains to recommended product features
 */
export const FEATURE_ARCHETYPES = [
  { id: 'tracking', label: 'Tracking', description: 'Progress tracking, metrics, dashboards' },
  { id: 'analysis', label: 'Analysis', description: 'Reports, insights, recommendations' },
  { id: 'planning', label: 'Planning', description: 'Goal setting, roadmaps, schedules' },
  { id: 'communication', label: 'Communication', description: 'Messaging, notifications, sharing' },
  { id: 'creation', label: 'Creation', description: 'Content creation, templates, builders' },
  { id: 'learning', label: 'Learning', description: 'Courses, lessons, resources' },
  { id: 'accountability', label: 'Accountability', description: 'Check-ins, streaks, commitments' },
  { id: 'community', label: 'Community', description: 'Forums, groups, connections' },
  { id: 'matching', label: 'Matching', description: 'Discovery, recommendations, pairing' },
  { id: 'automation', label: 'Automation', description: 'Workflows, reminders, scheduling' },
];

/**
 * Maps problem domains to recommended features
 */
export const DOMAIN_FEATURE_MAP = {
  physical_vitality: ['tracking', 'analysis', 'accountability', 'planning'],
  mental_wellbeing: ['tracking', 'learning', 'accountability', 'community'],
  personal_mastery: ['learning', 'tracking', 'community', 'accountability'],
  intimate_bonds: ['communication', 'planning', 'tracking', 'learning'],
  service_care: ['planning', 'communication', 'matching', 'tracking'],
  creative_expression: ['creation', 'community', 'matching', 'learning'],
  local_impact: ['communication', 'planning', 'community', 'tracking'],
  cultural_movements: ['community', 'communication', 'creation', 'matching'],
  economic_freedom: ['analysis', 'planning', 'learning', 'automation'],
  social_justice: ['community', 'communication', 'matching', 'creation'],
  planetary_health: ['tracking', 'community', 'analysis', 'learning'],
  human_progress: ['learning', 'creation', 'community', 'analysis'],
};

/**
 * Maps problem types to feature priorities
 */
export const PROBLEM_TYPE_FEATURE_MAP = {
  access: ['matching', 'community', 'analysis'],
  knowledge: ['learning', 'analysis', 'creation'],
  capability: ['learning', 'tracking', 'accountability'],
  motivation: ['accountability', 'community', 'tracking'],
  connection: ['matching', 'communication', 'community'],
  system: ['planning', 'analysis', 'automation'],
};
