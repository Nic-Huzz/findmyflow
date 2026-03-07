/**
 * matrixCodeQuiz.js — Shared quiz data for protective archetype identification.
 * Used by both /protective-identify (public) and in-app deep dive quest.
 */

export const MATRIX_CODES = [
  {
    id: 'success_status',
    label: "I tend to measure success by external recognition, like followers, income, or praise.",
    title: 'Success = Status',
    core_belief: 'Success means being seen, praised, and validated.',
    surface_behavior: "You chase visibility, growth, or recognition and feel like a failure if you're not hitting numbers.",
    deep_driver: 'Believes external markers (likes, clients, money) = internal worth.',
  },
  {
    id: 'safety_sameness',
    label: "I stick to what's familiar, accepted, or approved, like following traditional career or education paths.",
    title: 'Safety = Sameness',
    core_belief: 'Being different is dangerous.',
    surface_behavior: "You shrink, tone things down, or abandon ideas that are too 'out there' or controversial.",
    deep_driver: 'Fears being rejected, isolated, or cast out for being too much.',
  },
  {
    id: 'worth_productivity',
    label: "I judge myself when I'm not productive, creating, or achieving.",
    title: 'Worth = Productivity',
    core_belief: 'I must be useful, helpful, or productive to be worthy.',
    surface_behavior: 'You overextend, over-deliver, or overthink rest. You collapse when you stop achieving.',
    deep_driver: 'Believes doing = deserving. Worthiness must be earned.',
  },
  {
    id: 'emotions_unsafe',
    label: "I filter or suppress emotions because I fear being a burden to others or seen as dramatic or weak.",
    title: 'Emotions = Unsafe',
    core_belief: 'Feeling is dangerous, or makes me a burden.',
    surface_behavior: 'You bottle it up. Filter your words. Shut down or over-rationalize instead of expressing.',
    deep_driver: 'Believes emotional expression causes disconnection or shame.',
  },
  {
    id: 'visibility_risk',
    label: "I feel unsafe showing up fully online or in person, especially when it involves vulnerability or bold truth.",
    title: 'Visibility = Risk',
    core_belief: "If I'm seen, I'll be judged or attacked.",
    surface_behavior: "You procrastinate on launching, hide behind vague words, or say only what's 'safe.'",
    deep_driver: 'Believes visibility = exposure = attack.',
  },
]

export const BEHAVIOR_MAP = {
  success_status: {
    prompt: 'When chasing success, what behavior feels most familiar?',
    options: [
      { emoji: '\u{1F3AD}', label: "Picking the path that sounds bold or successful, even if it's not what you truly want.", archetype: 'Performer' },
      { emoji: '\u{1F91D}', label: "Leaning toward options you believe others will support or admire.", archetype: 'People Pleaser' },
      { emoji: '\u{1F6E1}\u{FE0F}', label: "Choosing the thing that feels most predictable or manageable, avoiding uncertainty.", archetype: 'Controller' },
      { emoji: '\u{2728}', label: "Avoiding choosing until you feel 100% clear, prepared, or educated, often delaying for weeks.", archetype: 'Perfectionist' },
      { emoji: '\u{1F47B}', label: "Staying vague, keeping doors open, or distracting yourself instead of deciding, afraid to commit and be seen.", archetype: 'Ghost' },
    ],
  },
  safety_sameness: {
    prompt: 'When it comes to being fully yourself in public, which pattern feels most familiar?',
    options: [
      { emoji: '\u{1F3AD}', label: "I blend in by following what's respected or approved, even if it's not me.", archetype: 'Performer' },
      { emoji: '\u{1F91D}', label: "I adjust who I am to match the room. I don't want to make others uncomfortable.", archetype: 'People Pleaser' },
      { emoji: '\u{1F6E1}\u{FE0F}', label: "I filter my truth to stay in control. Unpredictability feels dangerous.", archetype: 'Controller' },
      { emoji: '\u{2728}', label: "I wait until I have the perfect words or full clarity before showing who I am.", archetype: 'Perfectionist' },
      { emoji: '\u{1F47B}', label: "I avoid standing out altogether. It feels safer to be invisible than misunderstood.", archetype: 'Ghost' },
    ],
  },
  worth_productivity: {
    prompt: 'When it comes to your productivity or feeling valuable, which behavior feels most familiar?',
    options: [
      { emoji: '\u{1F3AD}', label: "I tie my worth to output. If I'm not producing, I feel like I'm falling behind or not enough.", archetype: 'Performer' },
      { emoji: '\u{1F91D}', label: "I say yes even when I'm stretched. I give more than asked, and find it hard to stop helping.", archetype: 'People Pleaser' },
      { emoji: '\u{1F6E1}\u{FE0F}', label: "I try to run everything solo. It feels safer if I'm in control of the outcome.", archetype: 'Controller' },
      { emoji: '\u{2728}', label: "I burn out chasing 'perfect.' Even when it's good enough, I find myself continuing to refine.", archetype: 'Perfectionist' },
      { emoji: '\u{1F47B}', label: "I start with energy, but when things get real, I quietly fade or disappear.", archetype: 'Ghost' },
    ],
  },
  emotions_unsafe: {
    prompt: "When you're struggling emotionally, what do you tend to do?",
    options: [
      { emoji: '\u{1F3AD}', label: "I keep showing up like I'm fine. I'd rather hold the mask than risk the drama of being seen.", archetype: 'Performer' },
      { emoji: '\u{1F91D}', label: "I filter how I feel to keep things comfortable. I don't want to be seen as a burden.", archetype: 'People Pleaser' },
      { emoji: '\u{1F6E1}\u{FE0F}', label: "I shift into doing mode. Instead of feeling what's happening, I try to fix it, structure it, or move through it fast.", archetype: 'Controller' },
      { emoji: '\u{2728}', label: "I turn it inward. If I'm struggling, I assume I've failed somehow. I feel like I should have figured this out by now.", archetype: 'Perfectionist' },
      { emoji: '\u{1F47B}', label: "When it gets too much, I vanish. It feels safer to be alone than to be seen like this.", archetype: 'Ghost' },
    ],
  },
  visibility_risk: {
    prompt: "When it's time to show up, to post, speak, or be seen, what feels most familiar?",
    options: [
      { emoji: '\u{1F3AD}', label: "I only share once things look polished or powerful. People see the win, not the wobble that came before it.", archetype: 'Performer' },
      { emoji: '\u{1F91D}', label: "I hold back unless I know it'll be received well. I don't want to lose connection or approval.", archetype: 'People Pleaser' },
      { emoji: '\u{1F6E1}\u{FE0F}', label: "I prefer to share when I've had time to shape the message.", archetype: 'Controller' },
      { emoji: '\u{2728}', label: "I wait until every piece is perfect, the visuals, the words, the vibe, before sharing or showing up.", archetype: 'Perfectionist' },
      { emoji: '\u{1F47B}', label: "I fade out when attention builds. I go quiet when things start feeling real.", archetype: 'Ghost' },
    ],
  },
}

export const PROTECTIVE_ARCHETYPES = {
  Performer: {
    name: 'The Performer',
    sabotage_pattern: "I keep chasing the next thing, hoping to feel recognised and good enough but end up burning out.",
    core_wound: 'Love must be earned through excellence, charisma, or usefulness.',
    safety_contract: "If I impress, I'll be loved.",
    blockage: "Equates visibility with worth. Collapses if output isn't celebrated.",
  },
  Ghost: {
    name: 'The Ghost',
    sabotage_pattern: "When things get real, I procrastinate or slow down my progress, even when it's what I wanted.",
    core_wound: 'Being visible = being unsafe.',
    safety_contract: "If I stay small, I'll stay safe.",
    blockage: 'Equates being seen with danger. Chooses invisibility to feel safe.',
  },
  Controller: {
    name: 'The Controller',
    sabotage_pattern: "Structure helps me feel safe but ends up limiting my growth.",
    core_wound: 'Chaos = danger. Letting go = failure.',
    safety_contract: "If I stay in control, I can't be hurt.",
    blockage: 'Believes surrender = collapse. Safety = control.',
  },
  Perfectionist: {
    name: 'The Perfectionist',
    sabotage_pattern: 'I over-prepare to avoid being judged.',
    core_wound: 'Mistakes = unworthiness.',
    safety_contract: "If it's flawless, I can't be shamed.",
    blockage: "Believes flaws = unworthiness. Waits for perfect to feel safe.",
  },
  'People Pleaser': {
    name: 'The People Pleaser',
    sabotage_pattern: "I give more than I can sustain, then burn out.",
    core_wound: 'Authenticity threatens belonging.',
    safety_contract: "If I'm agreeable and useful, I'll be accepted.",
    blockage: 'Believes truth = conflict. Associates needs with guilt.',
  },
}
