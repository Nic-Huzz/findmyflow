/**
 * moneyModelLadder.js — Static money model progression for experience creators
 *
 * Deal-size anchored (not annual income). Universal strategies per model.
 * Each level includes a first courage challenge to get started.
 *
 * V1: Static strategies. V2: Creator examples per model.
 * AI-personalised strategies live in Scale Portal (paid).
 */

export const MONEY_MODEL_LADDER = [
  {
    level: 1,
    id: 'per_session',
    label: 'Per Session',
    dealSize: '$20-50 per person',
    description: 'Charge people to attend your session, class, or workshop.',
    strategies: [
      'Partner with venues or studios that already have an audience.',
      'Offer free taster sessions at community events to build word of mouth.',
      'Start with friends-of-friends. Your first 10 clients come from your network.',
    ],
    courageChallenge: 'Run one paid session for at least 5 people.',
    icon: '🎟',
  },
  {
    level: 2,
    id: 'group_program',
    label: 'Group Program',
    dealSize: '$97-497 per person',
    description: 'Run a structured program with a specific outcome over 4-8 weeks.',
    strategies: [
      'Pre-sell before building. If 8 people pay upfront, you have the program.',
      'Use your per-session audience as the funnel. They already trust you.',
      'Promise a specific transformation, not just "sessions". People pay for outcomes.',
    ],
    courageChallenge: 'Pre-sell a 4-week program to 8 people.',
    icon: '👥',
  },
  {
    level: 3,
    id: 'content',
    label: 'Content',
    dealSize: '$0 (builds trust + reach)',
    description: 'Share what you know publicly to build an audience that trusts you.',
    strategies: [
      'Rule breaks: do something nobody in your space does.',
      'Yap: share your genuine opinions and frameworks out loud.',
      'Document the journey, don\'t perform it. Real beats polished.',
    ],
    courageChallenge: 'Post 3 pieces of content this week about what you do.',
    icon: '📱',
  },
  {
    level: 4,
    id: 'digital_product',
    label: 'Digital Product',
    dealSize: '$27-197 per product',
    description: 'Package what you teach live into something people can buy anytime.',
    strategies: [
      'Record your next live session and sell access to the recording.',
      'Turn your group program into a self-paced course.',
      'Start with a simple guide or template, not a full course.',
    ],
    courageChallenge: 'Record your next live session and sell access.',
    icon: '📦',
  },
  {
    level: 5,
    id: 'membership',
    label: 'Membership',
    dealSize: '$27-97/month per member',
    description: 'People pay monthly to be in your world. Recurring revenue.',
    strategies: [
      'Convert group program alumni into an ongoing community.',
      'One weekly live touchpoint plus async value (content, challenges, support).',
      'Start with 10 members. Prove you can retain before you grow.',
    ],
    courageChallenge: 'Invite 10 past participants to a monthly membership.',
    icon: '🔄',
  },
  {
    level: 6,
    id: 'certification',
    label: 'Certification',
    dealSize: '$2,000-5,000 per trainee',
    description: 'Train others to deliver your method. Requires proven results first.',
    strategies: [
      'Document your method step by step so someone else could follow it.',
      'Run a pilot cohort of 3-5 trainees to test the training.',
      'License the method, don\'t franchise the brand. Keep quality control.',
    ],
    courageChallenge: 'Write out your method in a way someone else could follow.',
    icon: '🏅',
  },
]
