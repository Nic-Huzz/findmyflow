/**
 * earthquakeQuizConfig.js
 *
 * All questions, scoring maps, voice result content, DAM copy,
 * stage descriptions, and block descriptions for the Earthquake Quiz.
 */

// ─── QUESTIONS ────────────────────────────────────────────────

export const QUESTIONS = [
  // ── Screen 1: Q1-Q3 ──
  {
    id: 'q1_stage',
    question: 'Right now, which feels most true?',
    type: 'single',
    options: [
      { id: 'matrix', label: "I know something's off but I can't name it yet" },
      { id: 'earthquake', label: "I know what I want but I don't know how" },
      { id: 'early_training', label: "I know what I want but I can't seem to do it" },
      { id: 'training', label: "I'm building my thing but hitting walls" },
    ],
  },
  {
    id: 'q2_first_reaction',
    question: "When you think about putting yourself out there, what's the FIRST thing that comes up?",
    type: 'multi',
    options: [
      { id: 'perfectionist', label: "It's not ready yet. I need to prepare more." },
      { id: 'people_pleaser', label: 'What will people think of me?' },
      { id: 'controller', label: "I need to figure out every detail before I start." },
      { id: 'ghost', label: "I don't feel comfortable putting myself out there." },
      { id: 'auto_pilot', label: "Honestly, I can't seem to care enough to start." },
    ],
  },
  {
    id: 'q3_behavioral',
    question: 'Which pattern do you recognize most in yourself?',
    type: 'multi',
    options: [
      { id: 'perfectionist', label: 'I endlessly prepare, revise, and polish — but rarely ship' },
      { id: 'people_pleaser', label: 'I say yes to everything and hide what I really think' },
      { id: 'controller', label: "I need to control every detail and can't stop working" },
      { id: 'ghost', label: 'I have great work but I pull back from sharing it' },
      { id: 'auto_pilot', label: "I go through the motions but nothing excites me anymore" },
    ],
  },

  // ── Screen 2: Q4-Q6 ──
  {
    id: 'q4_real_reason',
    question: "What's the REAL reason you haven't made the leap?",
    type: 'multi',
    options: [
      { id: 'visibility', label: "I'm scared of being judged or failing publicly", voice: 'ghost' },
      { id: 'money', label: "I can't afford the risk / need financial security first", voice: 'controller' },
      { id: 'action', label: "I know what to do but I just... can't start", voice: 'perfectionist' },
      { id: 'clarity', label: "I don't know what my 'thing' actually is yet", voice: null },
    ],
  },
  {
    id: 'q5_chest_tightens',
    question: 'Which sentence makes your chest tighten?',
    type: 'multi',
    options: [
      { id: 'perfectionist', label: "Just post it. It doesn't have to be perfect." },
      { id: 'people_pleaser', label: 'Tell them what you really think.' },
      { id: 'controller', label: "Let go. Stop managing everything." },
      { id: 'ghost', label: 'Share something personal right now.' },
      { id: 'auto_pilot', label: "What do you actually want?" },
    ],
  },
  {
    id: 'q6_tried_so_far',
    question: 'What have you tried so far to figure this out?',
    type: 'multi',
    options: [
      { id: 'books', label: 'Books + podcasts (Pathless Path, Ikigai, 4HWW...)' },
      { id: 'courses', label: 'Online courses + programs (altMBA, coaching certs...)' },
      { id: 'therapy', label: 'Therapy or coaching (1-on-1 sessions)' },
      { id: 'quizzes', label: 'Quizzes + personality tests (MBTI, Enneagram, Sparketype...)' },
      { id: 'nothing', label: "Nothing yet — I'm just starting to look" },
    ],
  },

  // ── Screen 3: Q7-Q9 ──
  {
    id: 'q7_resonates',
    question: 'Which of these phrases resonates most with you?',
    type: 'multi',
    options: [
      { id: 'pre_language', label: "I feel stuck but I don't know why" },
      { id: 'pathless_path', label: "I'm on the pathless path but I don't have a system" },
      { id: 'nervous_system', label: 'I know my nervous system is blocking me' },
      { id: 'escape', label: 'I need to escape the default path' },
      { id: 'tactical', label: 'I just want to find my thing and make money from it' },
    ],
  },
  {
    id: 'q8_course_count',
    question: 'How many courses, books, or programs have you done in the last 2 years trying to figure this out?',
    type: 'single',
    options: [
      { id: '0-2', label: "0-2 (I'm just starting to look)" },
      { id: '3-5', label: "3-5 (I've been exploring)" },
      { id: '6-10', label: "6-10 (I've invested serious time and money)" },
      { id: '10+', label: '10+ (I have a problem)' },
    ],
  },
  {
    id: 'q9_emotional_state',
    question: 'When thinking about your current progress — where are you on the emotional spectrum?',
    type: 'single',
    options: [
      { id: 'acceptance', label: 'Acceptance', icon: '😌', description: 'It is what it is, I can work with this' },
      { id: 'courage', label: 'Courage', icon: '🦁', description: "I'll do it even though it's scary" },
      { id: 'fear', label: 'Fear', icon: '😰', description: 'What if something bad happens?' },
      { id: 'anger', label: 'Anger', icon: '😤', description: "This isn't fair / They're wrong" },
      { id: 'shame', label: 'Shame', icon: '😔', description: "I'm not good enough" },
      { id: 'apathy', label: 'Apathy', icon: '😶', description: "What's the point?" },
    ],
  },
]


// ─── SCORING ──────────────────────────────────────────────────

/**
 * Compute voice scores from answers.
 * Q2: 3pts, Q3: 2pts, Q4: 1pt (mapped via voice field), Q5: 2pts.
 * Returns { perfectionist, people_pleaser, controller, ghost, auto_pilot }
 */
export function computeVoiceScores(answers) {
  const scores = { perfectionist: 0, people_pleaser: 0, controller: 0, ghost: 0, auto_pilot: 0 }

  // Q2 — first reaction (3 pts each, multi-select)
  const q2 = answers.q2_first_reaction || []
  const q2Arr = Array.isArray(q2) ? q2 : [q2]
  for (const voice of q2Arr) {
    if (scores[voice] !== undefined) scores[voice] += 3
  }

  // Q3 — behavioral (2 pts each, multi-select)
  const q3 = answers.q3_behavioral || []
  const q3Arr = Array.isArray(q3) ? q3 : [q3]
  for (const voice of q3Arr) {
    if (scores[voice] !== undefined) scores[voice] += 2
  }

  // Q4 — block reason (1 pt to mapped voice, multi-select)
  const q4 = answers.q4_real_reason || []
  const q4Arr = Array.isArray(q4) ? q4 : [q4]
  const q4Options = QUESTIONS.find(q => q.id === 'q4_real_reason')?.options || []
  for (const blockId of q4Arr) {
    const opt = q4Options.find(o => o.id === blockId)
    if (opt?.voice && scores[opt.voice] !== undefined) scores[opt.voice] += 1
  }

  // Q5 — chest tightens (2 pts each, multi-select)
  const q5 = answers.q5_chest_tightens || []
  const q5Arr = Array.isArray(q5) ? q5 : [q5]
  for (const voice of q5Arr) {
    if (scores[voice] !== undefined) scores[voice] += 2
  }

  return scores
}

/**
 * Determine the primary (loudest) voice. Tie-break: first Q2 answer.
 */
export function getPrimaryVoice(scores, q2Answer) {
  const maxScore = Math.max(...Object.values(scores))
  const winners = Object.entries(scores).filter(([, v]) => v === maxScore).map(([k]) => k)
  if (winners.length === 1) return winners[0]
  // Tie-break: use Q2 answers (strongest signal) — first match wins
  const q2Arr = Array.isArray(q2Answer) ? q2Answer : [q2Answer]
  const tieBreak = q2Arr.find(v => winners.includes(v))
  if (tieBreak) return tieBreak
  return winners[0]
}

/**
 * Determine awakening stage from Q1, modified by Q4 and Q8.
 */
export function getAwakeningStage(answers) {
  let stage = answers.q1_stage || 'earthquake'

  // Q4: "don't know my thing" → override to earthquake (multi-select)
  const q4 = answers.q4_real_reason || []
  const q4Arr = Array.isArray(q4) ? q4 : [q4]
  if (q4Arr.includes('clarity')) {
    stage = 'earthquake'
  }

  // Q8: 6+ courses and still stuck → clamp to earthquake or early_training
  if (['6-10', '10+'].includes(answers.q8_course_count)) {
    if (stage === 'matrix') {
      stage = 'earthquake' // Chronic course consumer is past pre-awakening
    } else if (stage === 'training') {
      stage = 'early_training'
    }
  }

  return stage
}

/**
 * Determine primary block from Q4, cross-referenced with voice.
 */
export function getPrimaryBlock(answers, primaryVoice) {
  // Primary signal from Q4 (multi-select — use first non-clarity selection)
  const q4 = answers.q4_real_reason || []
  const q4Arr = Array.isArray(q4) ? q4 : [q4]
  let block = q4Arr.find(b => b !== 'clarity') || q4Arr[0] || 'action'

  // Q4 "clarity" maps to the voice-based default
  if (block === 'clarity') {
    // Cross-reference with voice
    const voiceBlockMap = {
      ghost: 'visibility',
      people_pleaser: 'visibility',
      controller: 'money',
      perfectionist: 'action',
      auto_pilot: 'action',
    }
    block = voiceBlockMap[primaryVoice] || 'action'
  }

  return block
}

/**
 * Compute all results from answers.
 */
export function computeResults(answers) {
  const voiceScores = computeVoiceScores(answers)
  const primaryVoice = getPrimaryVoice(voiceScores, answers.q2_first_reaction)
  const awakeningStage = getAwakeningStage(answers)
  const primaryBlock = getPrimaryBlock(answers, primaryVoice)
  const languageLevel = answers.q7_resonates || ['pre_language']
  const damSelections = answers.q6_tried_so_far || []
  const courseCount = answers.q8_course_count || '0-2'
  const emotionalState = answers.q9_emotional_state || null

  return {
    primaryVoice,
    voiceScores,
    awakeningStage,
    primaryBlock,
    languageLevel,
    damSelections,
    courseCount,
    emotionalState,
  }
}

// ─── VOICE RESULT CONTENT ─────────────────────────────────────

export const VOICE_CONTENT = {
  ghost: {
    name: 'The Ghost',
    icon: '\uD83D\uDC7B',
    theLie: 'Visibility is dangerous. Stay small. Don\'t attract attention.',
    howItProtected: 'This voice developed to protect you from the pain of being seen. It kept you safe when showing up meant getting hurt.',
    howItBlocks: 'Nobody knows about your gifts. Your work is invisible. You have ideas that could help people but they never see the light.',
    kryptonite: 'Being seen anyway. One post. One video. One conversation where you show up as yourself.',
    stat: '73% of Find My Flow users with The Ghost as primary voice say visibility is their #1 block.',
  },
  perfectionist: {
    name: 'The Perfectionist',
    icon: '\u2728',
    theLie: "You're not ready yet. One more revision. One more course.",
    howItProtected: 'Prevented public failure. Kept your self-image safe.',
    howItBlocks: "You prepare endlessly but never ship. You've started 10 things and finished none. Your standards are so high nothing ever feels \"good enough.\"",
    kryptonite: 'Shipping something imperfect. Done beats perfect.',
    stat: 'People with The Perfectionist as primary voice have an average of 6.2 unfinished projects.',
  },
  controller: {
    name: 'The Controller',
    icon: '\uD83C\uDFAE',
    theLie: "Leaving it to chance isn't an option.",
    howItProtected: 'Prevented chaos and rejection. Kept you safe through control and performance.',
    howItBlocks: "You can't let go, can't rest, can't delegate. You manage every outcome and control how people see you until you burn out.",
    kryptonite: 'Letting go. Resting without guilt. Trusting others to handle it.',
    stat: 'Controller-dominant users spend 3x longer planning than executing.',
  },
  auto_pilot: {
    name: 'The Auto-Pilot',
    icon: '\uD83D\uDECB\uFE0F',
    theLie: "I'm fine, just tired.",
    howItProtected: 'Kept you functioning by checking out. When feeling everything was too much, numbness became survival.',
    howItBlocks: "You go through the motions but nothing excites you. You can't remember the last time you felt genuinely alive. Days blur together.",
    kryptonite: 'Asking yourself "What do I actually want?" and sitting with the answer.',
    stat: 'Auto-Pilot types are the hardest to reach because they don\'t know they\'re stuck.',
  },
  people_pleaser: {
    name: 'The People Pleaser',
    icon: '\uD83E\uDE9E',
    theLie: "They won't like the real you. Keep everyone happy.",
    howItProtected: 'Prevented conflict and rejection by making you agreeable.',
    howItBlocks: "You can't say what you really think. Your \"personal brand\" is everyone else's opinion of you. You've never shown the world who you actually are.",
    kryptonite: 'Saying something true that might make someone uncomfortable.',
    stat: 'People Pleaser types are 4x more likely to abandon projects when they receive negative feedback.',
  },
}

// ─── STAGE CONTENT ────────────────────────────────────────────

export const STAGES = [
  { id: 'matrix', label: 'Matrix', order: 0 },
  { id: 'earthquake', label: 'Earthquake', order: 1 },
  { id: 'early_training', label: 'Training', order: 2 },
  { id: 'training', label: 'Becoming', order: 3 },
]

export const STAGE_DESCRIPTIONS = {
  matrix: "You're still in the Matrix. Something feels off but you can't name it yet. That nagging feeling? It's the first signal. You're not crazy — you're waking up.",
  earthquake: "You've felt the crack. You know something needs to change. But you haven't found the system to actually make the move. You're in the most important — and most uncomfortable — stage.",
  early_training: "You know what you want but something keeps stopping you. This isn't a knowledge gap — it's a nervous system gap. Your Protective Voice is running interference.",
  training: "You're building, but hitting walls. The blocks you're facing aren't random — they're your Protective Voice's last stand. You're closer than you think.",
}

// ─── BLOCK CONTENT ────────────────────────────────────────────

export const BLOCK_CONTENT = {
  visibility: {
    name: 'Visibility',
    description: "Your nervous system has learned that being seen = danger. This isn't a mindset problem. It's a safety mechanism.",
    reframe: "The path forward isn't \"just do it.\" It's gradual nervous system expansion through play — starting small, building evidence that visibility is safe.",
  },
  money: {
    name: 'Money',
    description: "Financial fear is real — but it's also the Controller's favorite weapon. It uses \"I can't afford the risk\" to keep you paralyzed in safety.",
    reframe: "The path forward isn't reckless risk. It's proving the model works at small scale first — one person, one transaction, one proof point at a time.",
  },
  action: {
    name: 'Action',
    description: "You have the knowledge. You have the ideas. But the gap between knowing and doing feels impossible to cross.",
    reframe: "The path forward isn't more motivation. It's smaller actions that bypass your Protective Voice entirely — tasks so small they don't trigger resistance.",
  },
}

// ─── DAM COPY (per Q6 selection) ──────────────────────────────

export const DAM_COPY = {
  books: "You've got the language. Now you need the system.",
  courses: "You don't need more information. You need integration.",
  therapy: 'Therapy heals the past. Find My Flow builds the future. You need both.',
  quizzes: 'Quizzes give labels. You need daily action that expands what feels safe.',
  nothing: "Good — you're starting fresh. No bad habits to unlearn.",
}

// ─── HOOK SCREEN COPY ─────────────────────────────────────────

export const HOOK_COPY = {
  title: 'THE EARTHQUAKE QUIZ',
  lines: [
    'Something shifted. You feel it deep in your being.',
    '',
    "You want to change things up. You've read the books. Explored courses. Deep dived with AI.",
    '',
    'And you still feel stuck.',
  ],
  tagline: 'Not because you\'re broken. Not because you lack ambition.',
  taglineBold: 'Because something inside you doesn\'t feel safe.',
  meta: 'Ready to overcome it?',
  cta: 'Discover What\'s Blocking You',
}
