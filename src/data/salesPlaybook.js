/**
 * salesPlaybook.js
 *
 * Structured data for Alex Hormozi's 7 sales frameworks.
 * Source: "My Best Sales Advice From Selling $100's of Millions" (Ep 757)
 *
 * Exports:
 *   THREE_DISTORTIONS       – Full objection handling tree (Circumstances / Others / Self)
 *   CLOSER_FRAMEWORK        – 6-step call structure (C-L-O-S-E-R)
 *   NINE_THINGS             – 9 habits of top salespeople
 *   CONVICTION_TONALITY     – Belief & tone principles
 *   THREE_THINGS_ON_CALL    – Questions, Restatements, Stories
 *   SELL_THE_VACATION       – Outcome-first framing
 *   CASE_STUDY_DATA         – Before/after metrics
 *   KEY_PRINCIPLES          – 10 core sales principles
 *   LOSS_REASON_MIGRATION_MAP   – Maps legacy loss reasons to distortion paths
 *   DISTORTION_REASON_LABELS    – Human-readable labels for distortion categories
 */

// ---------------------------------------------------------------------------
// 1. THREE DISTORTIONS
// ---------------------------------------------------------------------------

export const THREE_DISTORTIONS = {
  layers: [
    {
      id: 'circumstances',
      name: 'Circumstances',
      icon: '🌍',
      description: 'They blame external factors',
      categories: [
        {
          id: 'time_macro',
          name: 'Time (Macro)',
          subtitle: '"This is a busy season for me"',
          strategies: [
            {
              id: 'when_then_fallacy',
              name: 'When-Then Fallacy',
              shortScript:
                'When I have X, then I will do Y — but that flips the sequence. The program IS how you get X.',
              fullScript:
                "Totally get it... Do you want this to last for the long term? Do you think you're gonna be busy again in the future? Well then, don't you think it'd be best to start now when you are busy? Because if you learn how to do it when you're busy, you'll be able to do it forever. If you can only learn it during a perfect circumstance, you'll fall off when it gets busy again.",
              keywords: ['busy', 'season', 'later', 'when', 'future'],
            },
            {
              id: 'start_when_busy',
              name: 'Start When Busy',
              shortScript:
                'If you learn to do it while busy, you can do it forever. Perfect conditions never come.',
              fullScript:
                "Isn't the time you're most busy the time you'd want the most support? If you can only learn it during a perfect circumstance, then you're gonna fall off when it gets busy again.",
              keywords: ['busy', 'overwhelmed', 'too much'],
            },
          ],
        },
        {
          id: 'time_micro',
          name: 'Time (Micro)',
          subtitle: '"I don\'t have any time in my day"',
          strategies: [
            {
              id: 'phone_time_story',
              name: 'Phone Time Story',
              shortScript:
                "Share the story about screen time revealing hidden hours. It's not about adding — it's about removing what's not working.",
              fullScript:
                'I had the same issue. I used to complain all the time about not having time to be successful. And my wife got so sick of it, she pulled my phone out and was like "Look, I guess I just found your time, didn\'t I?" The first thing any good program does is cut out the 90% of stuff that\'s causing you to feel overwhelmed. It\'s not about adding to your plate — it\'s about removing what\'s not working.',
              keywords: ['time', 'day', 'schedule', 'hours'],
            },
          ],
        },
        {
          id: 'price',
          name: 'Price',
          subtitle: '"I can\'t afford it"',
          strategies: [
            {
              id: 'a_lot_is_good',
              name: '"A Lot Is GOOD"',
              shortScript:
                "If it's a lot of money to you, that means you'll try harder. The best success stories come from people in your exact situation.",
              fullScript:
                "Is this a lot of money to you? That's the exact reason you're gonna be successful — because you're all in. The best stories always come from people like you in your exact situation. That shouldn't be a reason not to do it. That should be THE reason to do it.",
              keywords: ['expensive', 'afford', 'cost', 'lot'],
            },
            {
              id: 'value_comparison',
              name: 'Value Comparison',
              shortScript:
                "It's a lot in absolute terms, but relative to the result, it's very little. If it does what we say, is it worth it?",
              fullScript:
                "It's a lot in terms of absolute amount, but relative amount it's very little. If all this does is add $10,000 a month to your income, is it worth it? Then it's not about the price — it's about whether you believe me. So let's talk about that.",
              keywords: ['worth', 'value', 'roi', 'return'],
            },
            {
              id: 'money_or_time',
              name: 'Money or Time?',
              shortScript:
                "You're going to buy this program either way — the question is whether you pay with money or with time. 12 weeks or 12 years?",
              fullScript:
                "You're gonna spend this money either way over the next 12 months. And you're going to buy this program — the question is whether you pay for it in money or in time. Do you want it to take 12 weeks or 12 years? The question is, 12 months from now, is that money gonna be spent on stuff that didn't get you anywhere, or stuff that did? You've probably been paying with time the last six years. How's that working for you?",
              keywords: ['money', 'pay', 'investment', 'spend'],
            },
          ],
        },
        {
          id: 'fit',
          name: 'Fit',
          subtitle: '"Not sure it\'s for me"',
          strategies: [
            {
              id: 'new_identity',
              name: 'New Identity, New Priorities',
              shortScript:
                'We vote with our dollars about what we care about. New identity = new priorities. Step into who you want to become.',
              fullScript:
                "We vote with our dollars about the things that we care about. You've had priorities aligned with your old identity. There's the you that spends money on things you shouldn't. And there's the you that you want to be. Do you want to keep walking down the road you've been walking? Or step into a new identity? With that new identity comes new priorities.",
              keywords: ['fit', 'right', 'me', 'different'],
            },
            {
              id: 'change_the_change',
              name: 'Change the Change',
              shortScript:
                "What you've been doing has been getting you what you've been getting. The pain of staying the same vs. the pain of change.",
              fullScript:
                "You gotta change the change. What you've been doing has been getting what you've been getting. The question is whether the pain of staying the same is greater than the pain of change. Are you in enough pain? If not — gain 50 more pounds and come back. Everyone has a rock bottom.",
              keywords: ['change', 'different', "don't like", 'aspect'],
            },
            {
              id: 'unicorn_close',
              name: 'Unicorn Close',
              shortScript:
                "If this were perfect, would you do it? If yes: what's the gap? If no: it's not about the program — they don't trust you.",
              fullScript:
                "If this were perfect, would you do it? On a scale from 1 to 10, where is this? Cool, what would make it a 10? If someone says no to \"if this were perfect\" — it has nothing to do with what you're selling. They don't trust you. Now we can talk about that. What's the difference between perfection and what we've got? Most of the time they'll say \"I don't know\" — because it's nothing to do with the program, it's all to do with you.",
              keywords: ['trust', 'perfect', 'sure', 'believe', 'skeptical'],
            },
          ],
        },
      ],
    },
    {
      id: 'others',
      name: 'Others',
      icon: '👥',
      description: 'They blame other people',
      categories: [
        {
          id: 'authority',
          name: 'Authority',
          subtitle: '"I have to talk to my spouse/partner"',
          strategies: [
            {
              id: 'support_not_permission',
              name: 'Support, Not Permission',
              shortScript:
                "You're asking for permission instead of support. It's YOUR life. If you don't own the decision, you'll resent them later.",
              fullScript:
                "What do you think they wouldn't like about it? Do they approve of your current struggle? Are they happy you're struggling? No. Then why would they not approve of something that's gonna fix something they already don't approve of? If the roles were reversed and they needed this, would you support them? Then why wouldn't you support you? The real problem is you're asking for permission instead of support. Because it's your life, not theirs. If you give that power to them and two years later you're still stuck, who are you gonna blame? That's when resentment builds. It's about support, not permission.",
              keywords: [
                'spouse',
                'partner',
                'husband',
                'wife',
                'permission',
                'ask',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'self',
      name: 'Self',
      icon: '🪞',
      description: 'They avoid the decision itself',
      categories: [
        {
          id: 'avoidance_past',
          name: 'Past Frame',
          subtitle: '"This is happening too fast" / Bad past experience',
          strategies: [
            {
              id: 'not_fast_decision',
              name: 'Not a Fast Decision',
              shortScript:
                "You've been making this decision for years. All we're doing is deciding to actually do something about it.",
              fullScript:
                "This is NOT a fast decision. You've been making this decision for the last six years. You continually make the decision. All we're saying is — are you going to actually do something about it? You did all these things to get here because it's important to you. So don't let that distortion stop you from getting what you want. What are you most afraid of having happen?",
              keywords: ['fast', 'quick', 'rush', 'slow down'],
            },
            {
              id: 'struggled_to_decide',
              name: 'Struggled to Decide',
              shortScript:
                "Do you think you're in this position because you've struggled to make decisions in the past? One decision can change your life.",
              fullScript:
                "Do you think that you're maybe in this position because you have struggled to make a decision in the past? You have waffled when it came time to make the hard call? Have you been in this conversation and said no before? Do you think that's why you're here? Do you think that might be the reason you should change that? One decision can change your life.",
              keywords: ['think', 'decide', 'sure', 'uncertain'],
            },
            {
              id: 'cost_of_inaction',
              name: 'Cost of Inaction',
              shortScript:
                "Are you tired of another year of almost? The question isn't what it costs — it's how much it's cost you NOT to decide.",
              fullScript:
                "Are you tired of another year of almost? Almost hitting your goals, almost getting to 10K a month, almost hiring the team you wanted. The question isn't what it costs you — but how much has it cost you to NOT decide up to this point? We never regret the things we did. We regret the things we didn't do, the opportunities we let pass by.",
              keywords: ['almost', 'year', 'waiting', 'inaction'],
            },
            {
              id: 'dont_let_it_burn_twice',
              name: "Don't Let It Burn You Twice",
              shortScript:
                'A bad past experience burned you once. Don\'t let it burn you twice by stopping you from a good investment.',
              fullScript:
                "You let a bad decision burn you twice — once when you made the poor investment, and a second time when you let that bad investment stop you from a good one. Don't let the bad one control your next decision. You're gonna have to do these actions whether you're part of this program or not. So you might as well have somebody who'll get you there faster.",
              keywords: ['burned', 'before', 'tried', 'failed', 'scam', 'program'],
            },
          ],
        },
        {
          id: 'avoidance_present',
          name: 'Present Frame',
          subtitle: '"I need to think about it"',
          strategies: [
            {
              id: 'rocking_chair',
              name: 'Rocking Chair',
              shortScript:
                "You're not going to sit in a rocking chair and ponder this. Life will take over. It doesn't take time to decide — it takes information, and I'm the source.",
              fullScript:
                "You're not gonna go home, sit in the rocking chair, and stare at the clouds wondering. You're gonna get in your car, pick up the kids, do groceries, do laundry. And three days from now, you'll have made the decision by not making one. It doesn't take time to make decisions — it takes information. And I'm the only source of information you've got. So let's talk. I'm here for you.",
              keywords: ['think', 'consider', 'sleep on it', 'mull'],
            },
            {
              id: 'three_decision_questions',
              name: '3 Decision Questions',
              shortScript:
                "1) Will this help you get closer to your goals? 2) Do you trust me to fulfill my word? 3) Do you think it'll work for you?",
              fullScript:
                "There are three things we need to understand: 1) Do you think this is gonna help you get closer to your goals? Yes or no? 2) Do you trust me to fulfill my word? 3) Do you think it'll work for you? If yes to all three — do you have or have access to the amount to get started? If I was giving you a Ferrari for $5,000, you'd find the money. So find the money. Let's do it.",
              keywords: ['decide', 'how', 'decision', 'help'],
            },
            {
              id: 'guarantees',
              name: 'Guarantees Close',
              shortScript:
                "You can't make an informed decision until you've tried it from the inside. That's why we have a guarantee.",
              fullScript:
                "How can you make an informed decision if you haven't even tried it? I'm not asking you to make a decision right now. I'm asking you to make an INFORMED decision — which you can only do on the inside. And if after 30 days I'm not what I said, I'll give you the money back.",
              keywords: ['guarantee', 'refund', 'risk', 'try'],
            },
            {
              id: 'definition_of_decision',
              name: 'Definition of Decision',
              shortScript:
                'Decidere = "to cut off." Which future are we killing today — your dreams or your past?',
              fullScript:
                'Do you know what "deciding" even means? It comes from Latin — "decidere" — which means to cut off, to kill off. So the question is: which future are we killing off today? Are we killing your dreams? Or are we killing your past? Because indecision IS a decision. Inaction IS an active decision.',
              keywords: ['indecisive', 'decide', 'choice', 'options'],
            },
          ],
        },
        {
          id: 'avoidance_future',
          name: 'Future Frame',
          subtitle: '"I\'m still not sure"',
          strategies: [
            {
              id: 'magnifying_pain',
              name: 'Magnifying Pain',
              shortScript:
                "It's been 5 years of struggle. How does another 5 sound? Let's consider the options — only one guarantees you don't get there.",
              fullScript:
                "You got here, it's been five years, you've been struggling. How's another five years sound? Let's consider the options: Option 1 — you do the thing, you get the result, life is awesome. Option 2 — you don't do the thing, you don't get the result. Option 3 — you do the thing but don't get the result (but we have a guarantee). Only one option guarantees you won't get where you want — walking out the door.",
              keywords: ['pain', 'struggling', 'years', 'same'],
            },
            {
              id: 'consider_options',
              name: 'Consider the Options',
              shortScript:
                "Three options: Do it and succeed. Don't do it and stay stuck. Do it and it doesn't work (but you're guaranteed). Only one has zero upside.",
              fullScript:
                "Option one: you do the thing, get the result, life is awesome. Option two: you don't do the thing, don't get the result. Option three: you do the thing but don't get the result — but we have a guarantee so it's risk-free. Only one of them has a TRUE guarantee of not getting you where you want: walking out the door. So which risk-free option do you want?",
              keywords: ['options', 'choice', 'risk'],
            },
            {
              id: 'urgency_direction',
              name: 'Urgency / Direction',
              shortScript:
                "You're gonna do something about this eventually. Might as well start now. We don't need to be snipers — just directionally right.",
              fullScript:
                "You're not gonna struggle forever, right? You're gonna do something about this. If you're gonna fix it eventually, you might as well start now so you can enjoy the fruits sooner. Would you prefer making more money faster or slower? We don't need to be snipers — we need to be directionally right. If we do that long enough, we'll get there. No one program changed my life, but the decision to invest in education changed my life forever.",
              keywords: ['eventually', 'someday', 'soon', 'ready'],
            },
          ],
        },
      ],
    },
  ],
  bonus: {
    id: 'reason_is_reason',
    name: 'The Reason IS the Reason',
    icon: '🔑',
    shortScript:
      'Whatever reason they give for NOT doing it — that\'s the very reason they NEED to do it.',
    fullScript:
      "The fact that you can't afford it is the reason you need to do this. The fact that you don't have time is the very reason you need to do this. The fact that you're dependent on your spouse is the reason you need to own this decision. Whatever reason is holding you back is the biggest chain you're enslaving yourself to. Break that chain and the power comes back to you. The ignorance of not knowing how to create a million dollars a year IS costing you a million dollars a year.",
    keywords: ['reason', 'but', 'because'],
  },
}

// ---------------------------------------------------------------------------
// 2. CLOSER FRAMEWORK
// ---------------------------------------------------------------------------

export const CLOSER_FRAMEWORK = {
  name: 'CLOSER Framework',
  description: 'The 6-step call structure for closing with logic',
  steps: [
    {
      id: 'C',
      letter: 'C',
      title: "Clarify Why They're There",
      description:
        'Understand their situation. Ask why they booked the call.',
      guidance:
        'Use QUESTIONS here, not statements. Let them talk. Discover their real motivation.',
      templateText:
        'So {{name}}, tell me — what made you book this call today? What\'s going on in your {{niche}} right now?',
    },
    {
      id: 'L',
      letter: 'L',
      title: 'Label Them With a Problem',
      description:
        'Name their problem. Show you understand it deeply.',
      guidance:
        'Use RESTATEMENTS here. Mirror back what they said. "So it sounds like..."',
      templateText:
        "So it sounds like you're dealing with {{problem}} and it's been affecting {{impact}}. Is that right?",
    },
    {
      id: 'O',
      letter: 'O',
      title: 'Overview Past Experience',
      description:
        "Explore what they've tried before and why it didn't work.",
      guidance:
        'Ask about past attempts. Use childlike curiosity. "Have you tried to solve this before? What happened?"',
      templateText:
        'Have you tried to solve this before? What did you do? What happened?',
    },
    {
      id: 'S',
      letter: 'S',
      title: 'Sell the Vacation',
      description:
        'Paint the dream outcome. Not your process — their destination.',
      guidance:
        'Use ANECDOTAL STORIES here. "Sell the destination, not the plane ride." Paint what life looks like after.',
      templateText:
        'Imagine {{dream_outcome}}. What would that mean for you and your {{family/business/life}}?',
      crossLink: { path: '/offer-builder', label: 'Edit in Offer Builder' },
    },
    {
      id: 'E',
      letter: 'E',
      title: 'Explain Concerns',
      description:
        'Surface and address their objections using the Three Distortions.',
      guidance:
        'This is where objection handling happens. Walk through their concerns with childlike curiosity. Use the Three Distortions framework.',
      templateText: 'What concerns do you have about getting started?',
      crossLink: {
        label: 'Three Distortions →',
        frameworkId: 'three_distortions',
      },
    },
    {
      id: 'R',
      letter: 'R',
      title: 'Reinforce the Decision',
      description:
        'Summarize, confirm, and help them take action.',
      guidance:
        "Restate their goals and how you've addressed their concerns. Make the decision feel easy and logical.",
      templateText:
        "So just to recap — you said {{goals}}. We've addressed {{concerns}}. {{guarantee_text}} What would you like to do?",
    },
  ],
}

// ---------------------------------------------------------------------------
// 3. NINE THINGS
// ---------------------------------------------------------------------------

export const NINE_THINGS = [
  {
    id: 'bamfam',
    name: 'BAMFAM',
    fullName: 'Book A Meeting From A Meeting',
    description:
      'Always book the next meeting before hanging up. Never leave a call without the next step scheduled.',
    isPhase1: true,
    nudgeTrigger: 'after_call_outcome',
    nudgeMessage: 'Did you book the next meeting? (BAMFAM)',
  },
  {
    id: 'kill_zombies',
    name: 'Kill Zombies',
    fullName: 'Kill Zombie Deals',
    description:
      "Deals that haven't moved in 14+ days are zombies. Either close them or move on. Don't let dead deals clog your pipeline.",
    isPhase1: true,
    nudgeTrigger: 'stale_deal',
    nudgeMessage: 'Kill the zombie — close or move on.',
  },
  {
    id: 'ask_again',
    name: 'Ask Again',
    fullName: 'Keep Asking',
    description:
      'Most sales happen after the 3rd to 5th ask. Most salespeople stop after 1. Follow up relentlessly with value.',
    isPhase1: true,
    nudgeTrigger: 'low_touchpoints',
    nudgeMessage: 'Most sales happen after the 3rd-5th ask.',
  },
  {
    id: 'pull_up_appointments',
    name: 'Pull-Up Appointments',
    fullName: 'Pull Up Appointments',
    description:
      "Don't wait for the scheduled time. Call them before the appointment to confirm and build rapport.",
    isPhase1: false,
  },
  {
    id: 'kill_zombies_upfront',
    name: 'Kill Zombies Upfront',
    fullName: 'Qualify Hard at the Start',
    description:
      "Disqualify bad fits early. Don't waste time on people who will never buy.",
    isPhase1: false,
  },
  {
    id: 'looping',
    name: 'Looping',
    fullName: 'Loop Back to Earlier Wins',
    description:
      'When someone objects, loop back to an earlier agreement. "But you said X was important to you..."',
    isPhase1: false,
  },
  {
    id: 'track_everything',
    name: 'Track Everything',
    fullName: 'Track All Your Numbers',
    description:
      'What gets measured gets managed. Track calls, shows, closes, revenue. Every number.',
    isPhase1: false,
  },
  {
    id: 'practice_daily',
    name: 'Practice Daily',
    fullName: 'Practice Sales Daily',
    description:
      'Role-play calls, review recordings, practice scripts. The best sellers practice more than anyone.',
    isPhase1: false,
  },
  {
    id: 'show_up_early',
    name: 'Show Up Early',
    fullName: 'Show Up Early & Prepared',
    description:
      'Arrive early, be prepared, review notes. Respect their time and yours.',
    isPhase1: false,
  },
]

// ---------------------------------------------------------------------------
// 4. CONVICTION & TONALITY
// ---------------------------------------------------------------------------

export const CONVICTION_TONALITY = [
  {
    id: 'conviction_transfers',
    title: 'Conviction Transfers',
    description:
      "If YOU believe, THEY believe. When you stop believing, you stop closing — even with the same skills. Fill your conviction daily.",
    icon: '🔥',
  },
  {
    id: 'tone_for_hard_questions',
    title: 'Playful & Confident Tone',
    description:
      "Say hard things with a playful, confident tone — never apologetic. Childlike curiosity, not confrontation. It's seduction, not a fight.",
    icon: '🎭',
  },
  {
    id: 'say_the_price',
    title: "Say the Price Like It's Nothing",
    description:
      "The value dwarfs the cost. If you didn't get a gasp from the price tag, you didn't go high enough. Then you can walk down with a beautiful price anchor.",
    icon: '💎',
  },
  {
    id: 'stories_over_logic',
    title: 'Stories > Logic',
    description:
      'Anecdotal stories create belief faster than any logical argument. Step into their shoes and walk them through the epiphany you experienced.',
    icon: '📖',
  },
]

// ---------------------------------------------------------------------------
// 5. THREE THINGS ON A CALL
// ---------------------------------------------------------------------------

export const THREE_THINGS_ON_CALL = {
  title: 'Three Things on a Sales Call',
  subtitle: "That's all you do.",
  items: [
    {
      id: 'questions',
      label: 'Questions',
      color: '#4A90D9',
      description: 'Ask to understand, not to argue. Childlike curiosity.',
    },
    {
      id: 'restatements',
      label: 'Restatements',
      color: '#27AE60',
      description: 'Mirror back what they said. "So it sounds like..."',
    },
    {
      id: 'stories',
      label: 'Anecdotal Stories',
      color: '#E9A23B',
      description: 'Share relevant stories. Step into their shoes.',
    },
  ],
}

// ---------------------------------------------------------------------------
// 6. SELL THE VACATION
// ---------------------------------------------------------------------------

export const SELL_THE_VACATION = {
  title: 'Sell the Vacation, Not the Plane Ride',
  description:
    "Paint the dream outcome. What does their life look like AFTER? Don't describe your process — that's the plane ride. They're buying the destination.",
  guidance:
    'When describing your offer, focus 80% on the outcome and 20% (or less) on the mechanism. Use vivid, specific language about their life after.',
}

// ---------------------------------------------------------------------------
// 7. CASE STUDY DATA
// ---------------------------------------------------------------------------

export const CASE_STUDY_DATA = {
  title: 'What Happens When You Apply These Frameworks',
  subtitle: 'Real results from implementing this system',
  metrics: [
    { label: 'Show Rate', before: 49, after: 70, unit: '%' },
    { label: 'Close Rate', before: 27, after: 41, unit: '%' },
    { label: 'Cash Collected', before: 47, after: 82, unit: '%' },
    { label: 'Units/Month', before: 56, after: 93, unit: '' },
  ],
}

// ---------------------------------------------------------------------------
// 8. KEY PRINCIPLES
// ---------------------------------------------------------------------------

export const KEY_PRINCIPLES = [
  {
    id: 1,
    text: "Expect no — it IS the job. If they already said yes, you're not necessary.",
  },
  {
    id: 2,
    text: 'Closing is a dance, not a fight — use childlike curiosity, not confrontation.',
  },
  {
    id: 3,
    text: 'Selling = transference of belief over a bridge of trust. You need both.',
  },
  {
    id: 4,
    text: 'The person who cares most about the prospect wins the sale. Even more than they care about themselves.',
  },
  {
    id: 5,
    text: "Obstacles before the ask, objections after. Handle obstacles upfront — they're easier.",
  },
  {
    id: 6,
    text: "Frameworks, not scripts — understand the principles, don't memorize words.",
  },
  {
    id: 7,
    text: 'KPI: identify their desire and help them find it. The sale is about THEM, not you.',
  },
  {
    id: 8,
    text: "Three things on a call: questions, restatements, anecdotal stories. That's all you do.",
  },
  {
    id: 9,
    text: "Conviction transfers — 90% tonality, 10% words. If you believe, they'll question their own excuses.",
  },
  {
    id: 10,
    text: 'BAMFAM — always book the next meeting before hanging up. Never end without a next step.',
  },
]

// ---------------------------------------------------------------------------
// MIGRATION & LABEL MAPS
// ---------------------------------------------------------------------------

// Maps old flat loss reasons to new Three Distortions layer/category format
export const LOSS_REASON_MIGRATION_MAP = {
  price: 'circumstances/price',
  timing: 'circumstances/time_macro',
  competitor: 'circumstances/fit',
  no_decision: 'self/avoidance_present',
  fit: 'circumstances/fit',
  trust: 'self/avoidance_past',
}

// Human-readable labels for Three Distortions categories (used in ObjectionPatterns, DealOutcomeModal)
export const DISTORTION_REASON_LABELS = {
  'circumstances/time_macro': 'Time (Macro) — Busy season',
  'circumstances/time_micro': 'Time (Micro) — No daily time',
  'circumstances/price': "Price — Can't afford it",
  'circumstances/fit': "Fit — Not sure it's for me",
  'others/authority': 'Authority — Need partner approval',
  'self/avoidance_past': 'Past — Bad experience / too fast',
  'self/avoidance_present': 'Present — Need to think about it',
  'self/avoidance_future': 'Future — Not sure / still deciding',
}
