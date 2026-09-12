/**
 * Zone Cal Radar: 8 dimensions for the life-path calibration tool.
 * Used with GenericRadar component.
 */

export const ZONE_CAL_DIMENSIONS = [
  {
    id: 'identity',
    name: 'Identity',
    emoji: '\u{1FA9E}',
    question: 'Who am I underneath the roles?',
    maxLevel: 5,
    levels: [
      { level: 1, label: "Haven't thought about it", description: 'My job title and my roles describe me. That feels right.' },
      { level: 2, label: 'Starting to question', description: "Some things about me don't match my roles, but I can't name what's underneath." },
      { level: 3, label: 'Glimpses', description: "I've had moments where I felt like the REAL me, but I can't sustain it or describe it." },
      { level: 4, label: 'I can name it', description: "I can describe who I am underneath the roles. Not perfectly, but I know what's real vs installed." },
      { level: 5, label: 'I live from it', description: "My decisions come from that place. I don't need external validation to confirm it." },
    ],
  },
  {
    id: 'vulnerability',
    name: 'Vulnerability',
    emoji: '\u{1F49C}',
    question: 'Can I let myself be seen?',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Behind the wall', description: 'I keep the real stuff private. People know the surface version.' },
      { level: 2, label: 'Safe people only', description: 'I can be honest with 1-2 trusted people, but nowhere else.' },
      { level: 3, label: 'In small groups', description: 'I can share something real in a small, safe setting. A workshop, a close circle.' },
      { level: 4, label: 'Publicly', description: "I've shared something vulnerable publicly. Online, on stage, or with strangers." },
      { level: 5, label: 'Nothing to hide', description: "Being seen is my default, not my exception. I don't perform a version of myself." },
    ],
  },
  {
    id: 'direction',
    name: 'Direction',
    emoji: '\u{1F9ED}',
    question: "What's mine to create?",
    maxLevel: 5,
    levels: [
      { level: 1, label: 'No idea', description: "I don't know what I want to build. I'm still looking." },
      { level: 2, label: 'Hunches', description: "I have some sense of what pulls me, but I couldn't explain it to someone." },
      { level: 3, label: 'I can describe it', description: 'I can name the general direction. The domain, the people, the type of work.' },
      { level: 4, label: "I'm building it", description: "I know what's mine AND I've started building it." },
      { level: 5, label: 'Clear and active', description: "I can name my thing in one sentence, I'm doing it, and it serves others." },
    ],
  },
  {
    id: 'worth',
    name: 'Worth',
    emoji: '\u{1F451}',
    question: 'Do I believe I deserve this?',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Not at all', description: "I regularly doubt whether I'm good enough. I feel like a fraud." },
      { level: 2, label: 'On good days', description: 'Sometimes I believe it. Then the inner critic shows up and I shrink.' },
      { level: 3, label: 'Mostly yes', description: 'I believe I deserve it, but I still undercharge, over-deliver, or wait for permission.' },
      { level: 4, label: "I charge what I'm worth", description: 'I name my price without apologizing. I accept praise without deflecting.' },
      { level: 5, label: 'Deep belief', description: "I know I'm enough. Not arrogant, just not fighting myself anymore." },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    emoji: '\u{1F331}',
    question: 'Am I stretching at the right level?',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Comfort zone', description: "I'm not doing anything that scares me. Everything is familiar." },
      { level: 2, label: 'Occasional stretch', description: "Once in a while something pushes me, but it's not deliberate." },
      { level: 3, label: 'Regular challenges', description: 'I deliberately do things that stretch me, at least monthly.' },
      { level: 4, label: 'Right at the edge', description: "I'm consistently at the edge of my ability. Challenged but not overwhelmed." },
      { level: 5, label: 'The edge is home', description: 'I seek the growth zone and know how to recover from it. Stretching is my default.' },
    ],
  },
  {
    id: 'output',
    name: 'Output',
    emoji: '\u{1F528}',
    question: 'Am I building without burning out?',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Not creating', description: "I have ideas but I'm not making anything." },
      { level: 2, label: 'Starting and stopping', description: 'I create in bursts, then crash or abandon it.' },
      { level: 3, label: 'Consistent but draining', description: "I'm producing regularly, but it costs me. Burning faster than replenishing." },
      { level: 4, label: 'Sustainable pace', description: 'I create consistently without burning out. I know when to push and when to rest.' },
      { level: 5, label: 'Effortless output', description: 'Creating feels like breathing. It flows from who I am, not from discipline alone.' },
    ],
  },
  {
    id: 'risk',
    name: 'Risk',
    emoji: '\u{1F3B2}',
    question: 'Am I betting on things that light me up?',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Playing it safe', description: "I haven't put anything meaningful on the line." },
      { level: 2, label: 'Small bets', description: "I've taken some risks, but only ones I could afford to lose." },
      { level: 3, label: 'Meaningful stakes', description: "I've bet time, money, or reputation on something I believe in." },
      { level: 4, label: 'All in on something aligned', description: 'My biggest bets are on things that genuinely light me up.' },
      { level: 5, label: 'Aligned risk is natural', description: 'I take risks from alignment, not desperation. The scary stuff excites me.' },
    ],
  },
  {
    id: 'play',
    name: 'Play',
    emoji: '\u{1F3AA}',
    question: 'Does this feel like play or obligation?',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Obligation', description: 'Most of what I do feels like I have to, not like I want to.' },
      { level: 2, label: 'Glimpses of fun', description: 'Occasionally something lights me up, but it\'s the exception.' },
      { level: 3, label: 'Some play, some grind', description: 'Parts of my life feel like play. Other parts feel like grinding.' },
      { level: 4, label: 'Mostly play', description: 'The majority of my time feels like something I\'d choose to do.' },
      { level: 5, label: 'This IS play', description: 'Even the hard parts feel meaningful. I\'d do this for free.' },
    ],
  },
]

// ── Shape diagnosis matching ──

export const ZONE_CAL_DIAGNOSES = [
  {
    id: 'the_crack',
    name: 'The Crack',
    headline: 'Everything is about to change.',
    description: "You're at the beginning. The gap between who you are and who you could be just became visible. That's not a problem. It's the starting point.",
    match: (scores) => {
      const vals = Object.values(scores)
      return vals.length >= 8 && vals.every(v => v <= 2)
    },
  },
  {
    id: 'head_full_of_dreams',
    name: 'Head Full of Dreams',
    headline: 'You know everything. You do nothing about it.',
    description: "High self-knowledge, low action. A bodyguard is guarding the action side. You don't need more clarity. You need one scary step.",
    match: (scores) => {
      const inner = ['identity', 'vulnerability', 'direction', 'worth']
      const outer = ['growth', 'output', 'risk', 'play']
      const innerAvg = inner.reduce((s, k) => s + (scores[k] || 0), 0) / inner.length
      const outerAvg = outer.reduce((s, k) => s + (scores[k] || 0), 0) / outer.length
      return innerAvg - outerAvg >= 1.5
    },
  },
  {
    id: 'misguided_hustle',
    name: 'Misguided Hustle',
    headline: "You're building fast. On someone else's foundation.",
    description: "High action, low self-knowledge. You skipped the inner work. You're productive but not aligned. Pause and ask: whose dream is this?",
    match: (scores) => {
      const inner = ['identity', 'vulnerability', 'direction', 'worth']
      const outer = ['growth', 'output', 'risk', 'play']
      const innerAvg = inner.reduce((s, k) => s + (scores[k] || 0), 0) / inner.length
      const outerAvg = outer.reduce((s, k) => s + (scores[k] || 0), 0) / outer.length
      return outerAvg - innerAvg >= 1.5
    },
  },
  {
    id: 'hinge_and_grind',
    name: 'The Hinge Block + Grinding',
    headline: 'Two flat spokes. Worth and Play are both stuck.',
    description: "You're growing everywhere except the two places that matter most: believing you deserve it (Worth) and enjoying the ride (Play). The inner critic blocks one. Missing joy blocks the other.",
    match: (scores) => {
      const worthVal = scores.worth || 0
      const playVal = scores.play || 0
      const others = Object.entries(scores)
        .filter(([k]) => k !== 'worth' && k !== 'play')
        .map(([, v]) => v)
      const othersMin = Math.min(...others)
      return worthVal <= 2 && playVal <= 2 && othersMin >= 3
    },
  },
  {
    id: 'hinge_block',
    name: 'The Hinge Block',
    headline: 'Everything else is growing. This is the ceiling.',
    description: "Worth is your flat spoke. You know who you are, you see the path, you're stretching. But you don't believe you deserve what you're building. This is the most common block.",
    match: (scores) => {
      const worthVal = scores.worth || 0
      const playVal = scores.play || 0
      const others = Object.entries(scores).filter(([k]) => k !== 'worth').map(([, v]) => v)
      const othersMin = Math.min(...others)
      return worthVal <= 2 && playVal > 2 && othersMin >= worthVal + 2
    },
  },
  {
    id: 'grinding',
    name: 'Grinding',
    headline: "You're doing everything right. It just doesn't feel alive.",
    description: "Play is your flat spoke. The work is happening but the joy is missing. This isn't burnout. It's doing the right things for the wrong reasons, or forgetting why you started.",
    match: (scores) => {
      const playVal = scores.play || 0
      const worthVal = scores.worth || 0
      const others = Object.entries(scores).filter(([k]) => k !== 'play').map(([, v]) => v)
      const othersMin = Math.min(...others)
      return playVal <= 2 && worthVal > 2 && othersMin >= playVal + 2
    },
  },
  {
    id: 'knows_wont_charge',
    name: "Knows But Won't Charge",
    headline: "You see the path. You don't believe you deserve to walk it.",
    description: "High Identity and Direction, low Worth and Risk. You know who you are and where you're going, but the inner critic won't let you bet on it.",
    match: (scores) => {
      return (scores.identity || 0) >= 4 && (scores.direction || 0) >= 4 &&
             (scores.worth || 0) <= 2 && (scores.risk || 0) <= 2
    },
  },
  {
    id: 'your_flow',
    name: 'Your Flow',
    headline: "You're on the diagonal. Keep going.",
    description: "Action and self-knowledge growing together. The merge point is close, or you're already living it. This is what the app was named after.",
    match: (scores) => {
      const vals = Object.values(scores)
      return vals.length >= 8 && vals.every(v => v >= 4)
    },
  },
  {
    id: 'balanced_mid',
    name: 'The Middle',
    headline: "You're in motion. No single thing is broken.",
    description: "Your shape is roughly even. No spoke is critically low, but none are high either. You don't need to fix anything. You need to pick one dimension and push it. Growth comes from creating imbalance on purpose.",
    match: (scores) => {
      const vals = Object.values(scores)
      if (vals.length < 8) return false
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length
      return avg >= 2.5 && avg <= 3.5 && vals.every(v => v >= 2 && v <= 4)
    },
  },
]

/**
 * getDiagnosis - Run scores through diagnosis matchers in priority order.
 * Returns the first match, or a fallback pointing at the lowest spoke.
 */
export function getDiagnosis(scores) {
  for (const d of ZONE_CAL_DIAGNOSES) {
    if (d.match(scores)) return d
  }
  // Fallback: find the lowest spoke
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1])
  const lowest = sorted[0]
  const dim = ZONE_CAL_DIMENSIONS.find(d => d.id === lowest[0])
  return {
    id: 'focus_spoke',
    name: `Focus: ${dim?.name || lowest[0]}`,
    headline: `${dim?.name || lowest[0]} is where the growth edge is.`,
    description: `Your shape shows ${dim?.name || lowest[0]} as the dimension with the most room to expand. Start here.`,
  }
}

/**
 * getNextSpoke - Returns the dimension object for the lowest-scoring spoke.
 * Returns null if all spokes are >= 4 (Your Flow state).
 */
export function getNextSpoke(scores) {
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1])
  if (sorted[0][1] >= 4) return null
  const lowestId = sorted[0][0]
  return ZONE_CAL_DIMENSIONS.find(d => d.id === lowestId)
}
