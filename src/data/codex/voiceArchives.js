/**
 * Voice Archives - Deep profiles of each Protective Voice
 *
 * These are NOT villains to destroy. They're parts of us that developed
 * to keep us safe in environments that weren't safe for our authentic self.
 */

import { UNLOCK_TRIGGERS } from './index'

export const VOICE_ARCHIVES = [
  // ============================================
  // THE PERFECTIONIST
  // ============================================
  {
    id: 'voice_perfectionist',
    category: 'voiceArchives',
    title: 'The Perfectionist',
    icon: '🎭',
    order: 1,
    unlockTrigger: UNLOCK_TRIGGERS.VOICE_IDENTIFIED,
    unlockValue: 'perfectionist',
    altUnlockTrigger: UNLOCK_TRIGGERS.VOICE_FACED,
    altUnlockValue: 'perfectionist',

    content: {
      origin: {
        title: 'The Origin',
        body: `Before the Matrix taught you that mistakes were dangerous, you tried things freely.

Maybe it was a classroom where your wrong answer drew laughter. A parent whose love felt conditional on your grades. A moment where "good enough" was met with "you can do better." Or perhaps it was subtler—a pattern of praise only when things were perfect, silence when they weren't.

The Perfectionist emerged to protect you. If you never finish, you never fail. If you keep revising, no one can criticize the final version. If you're "still working on it," you're safe from judgment.

And it worked. You became known for quality. For attention to detail. For never shipping something embarrassing.

But protection became paralysis.`,
      },

      lie: {
        title: 'The Lie It Tells',
        quote: "You're not ready yet. One more revision. One more course. One more draft.",
        body: `The Perfectionist speaks in reasonable tones:

- *"Let's just polish this a bit more before anyone sees it."*
- *"You need more credentials first."*
- *"What if there's a typo? What if they find a flaw?"*
- *"This isn't your best work. You know you can do better."*

The cruelest part? It uses your own standards against you. It knows you care about quality, and it weaponizes that care into infinite delay.`,
      },

      protection: {
        title: 'How It Protected You',
        body: `The Perfectionist kept you safe by keeping you preparing. In environments where mistakes meant shame, endless preparation was a shield.

**It served you when:**
- Errors led to punishment or ridicule
- Your worth felt tied to your output quality
- "Good enough" was never actually good enough for the people around you
- Perfection was the only path to approval

*Thank the Perfectionist for its service. It protected you from shame when shame felt unbearable.*`,
      },

      blocking: {
        title: "Why It's Blocking Your Flow Now",
        body: `Your unique gift requires shipping to create impact.

The people who need what only you can offer? They're waiting while you revise. The transformation you're meant to create? It can't happen if your work stays in drafts.

**The Perfectionist's cost:**
- Brilliant ideas die in "draft" folders
- You watch others succeed with work worse than yours—because they shipped
- Opportunities pass while you prepare for them
- You're exhausted from the labor of never being done

The tragedy: seeking perfection, you achieve nothing. The imperfect shipped thing would have helped people. The perfect unshipped thing helps no one.`,
      },

      kryptonite: {
        title: 'The Kryptonite',
        body: `**Shipping something imperfect. On purpose. In public.**

Not despite the flaws—*because* of them. The Perfectionist dissolves when you prove that imperfect work can still create value, still be received well, still matter.

**Playground challenges that weaken The Perfectionist:**
- Post something with a typo you don't fix
- Share work-in-progress before it's ready
- Launch with a minimum viable version
- Ask for feedback on a rough draft
- Set a timer and ship when it goes off, ready or not

Every imperfect thing you ship is evidence that done beats perfect.`,
      },

      rewiring: {
        title: 'The Rewiring',
        quote: 'Done is better than perfect. Shipped is better than polished. Real is better than flawless.',
        body: `The wound of perfectionism becomes the gift of iteration. You know what it costs to wait for perfect—which makes you passionate about helping others ship.

**Affirmation:**
*"Thank you for protecting me from shame. I can handle imperfection now. My work doesn't need to be perfect to be valuable. I ship, I learn, I improve. 3% better each time is the path."*`,
      },

      heroes: {
        title: 'Heroes Who Faced The Perfectionist',
        body: `*"I spent two years 'perfecting' my course. When I finally launched, someone asked why I waited so long—the V1 was already better than most things out there. Two years of people who could have been helped, waiting."* — Marcus, The Translator

*"My Perfectionist convinced me I needed one more certification. Then one more. I had five certifications and zero clients. The day I posted 'I help people with X' without being 'ready' was the day my business started."* — Priya, The Bridge Builder`,
      },
    },
  },

  // ============================================
  // THE PEOPLE PLEASER
  // ============================================
  {
    id: 'voice_people_pleaser',
    category: 'voiceArchives',
    title: 'The People Pleaser',
    icon: '🪞',
    order: 2,
    unlockTrigger: UNLOCK_TRIGGERS.VOICE_IDENTIFIED,
    unlockValue: 'people-pleaser',
    altUnlockTrigger: UNLOCK_TRIGGERS.VOICE_FACED,
    altUnlockValue: 'people-pleaser',

    content: {
      origin: {
        title: 'The Origin',
        body: `Before the Matrix taught you that acceptance required agreement, you had opinions.

Maybe it was a family where peace was kept by compliance. A friendship where your real thoughts cost you belonging. A moment where being yourself led to being excluded. Or perhaps it was subtler—learning that the easiest version of you was the most loved version.

The People Pleaser emerged to protect you. If you agree with everyone, no one rejects you. If you adapt to each room, you always fit in. If you never have a controversial opinion, you're never alone.

And it worked. You became likeable. Easy to be around. Someone who "gets along with everyone."

But protection became erasure.`,
      },

      lie: {
        title: 'The Lie It Tells',
        quote: "They won't like the real you. Keep everyone happy. Don't rock the boat.",
        body: `The People Pleaser speaks in caring tones:

- *"Don't share that opinion—what if they disagree?"*
- *"Just go along with it. It's not worth the conflict."*
- *"They seem to like this version of you. Don't ruin it."*
- *"What if you disappoint them?"*

The cruelest part? It uses your empathy against you. It knows you care about others' feelings, and it weaponizes that care into self-abandonment.`,
      },

      protection: {
        title: 'How It Protected You',
        body: `The People Pleaser kept you safe by keeping you agreeable. In environments where authenticity meant rejection, adaptation was survival.

**It served you when:**
- Being yourself led to exclusion or conflict
- Belonging required conformity
- Your opinions weren't welcome or safe
- Love felt conditional on being "easy"

*Thank the People Pleaser for its service. It kept you connected when connection felt fragile.*`,
      },

      blocking: {
        title: "Why It's Blocking Your Flow Now",
        body: `Your unique gift requires you to show up as YOU—not a mirror of what others want.

The people who need what only you can offer? They can't find you if you're shapeshifting. The authentic service you're meant to provide? It requires having a point of view.

**The People Pleaser's cost:**
- You build an audience that likes a version of you that doesn't exist
- You attract clients who want someone you're exhausted pretending to be
- You feel increasingly disconnected from your own preferences
- You say yes to everything and mean none of it

The tragedy: seeking universal approval, you lose yourself. The few who would have loved the real you never get to meet them.`,
      },

      kryptonite: {
        title: 'The Kryptonite',
        body: `**Showing up as yourself. Having an opinion. Saying no.**

Not to hurt anyone—but to honor yourself. The People Pleaser dissolves when you prove that authentic you is actually more loveable than performing you.

**Playground challenges that weaken The People Pleaser:**
- Share an unpopular opinion you actually hold
- Say no to something you don't want to do
- Disagree with someone (kindly) in public
- Post content that won't appeal to everyone
- Set a boundary and hold it

Every time you're yourself and still loved, the lie loses power.`,
      },

      rewiring: {
        title: 'The Rewiring',
        quote: 'The right people will love the real me. The wrong people filtering out is a feature, not a bug.',
        body: `The wound of people-pleasing becomes the gift of authentic connection. You know what it costs to perform—which makes you passionate about creating spaces where others can be real.

**Affirmation:**
*"Thank you for protecting me from rejection. I can handle not being liked by everyone now. The people who matter will love the real me. My authenticity is the gift, not the risk."*`,
      },

      heroes: {
        title: 'Heroes Who Faced The People Pleaser',
        body: `*"I built a following by being what I thought they wanted. It worked—and I was miserable. The day I posted 'here's what I actually think' and lost 200 followers was the day I found my people. The ones who stayed are my actual community."* — Aisha, The Truth-Teller

*"My People Pleaser had me saying yes to every client request. I was exhausted and resentful. The first time I said 'that's not how I work,' I expected to be fired. Instead, they respected me more. Boundaries created trust."* — David, The Grounded Guardian`,
      },
    },
  },

  // ============================================
  // THE CONTROLLER (absorbs The Performer)
  // ============================================
  {
    id: 'voice_controller',
    category: 'voiceArchives',
    title: 'The Controller',
    icon: '🎮',
    order: 3,
    unlockTrigger: UNLOCK_TRIGGERS.VOICE_IDENTIFIED,
    unlockValue: 'controller',
    altUnlockTrigger: UNLOCK_TRIGGERS.VOICE_FACED,
    altUnlockValue: 'controller',

    content: {
      origin: {
        title: 'The Origin',
        body: `Before the Matrix taught you that uncertainty was dangerous and worth was earned, you embraced the unknown freely.

Maybe it was a childhood where things fell apart without warning. A home where love seemed proportional to achievement. A culture that celebrated "hustle" and shamed rest. Or perhaps it was subtler—an environment where the only safety was in what you could predict, control, and perform.

The Controller emerged to protect you. If you can see all the variables, nothing surprises you. If you're always achieving, you're always worthy. If you manage every outcome and control how people see you, you're never caught off guard and never "not enough."

And it worked. You became prepared, driven, accomplished. Someone who "thinks things through" and "gets things done."

But protection became prison—and exhaustion.`,
      },

      lie: {
        title: 'The Lie It Tells',
        quote: "Leaving it to chance isn't an option.",
        body: `The Controller speaks in logical and motivational tones:

- *"You need more information before you can decide."*
- *"You're falling behind. Everyone else is doing more."*
- *"There are too many unknowns. It's not responsible to proceed."*
- *"Rest is for people who've earned it. You haven't yet."*
- *"I can't let them see me struggle."*

The cruelest part? It uses your intelligence and drive against you. It knows you're capable of seeing risks and achieving goals, and it weaponizes both into relentless control and performance.`,
      },

      protection: {
        title: 'How It Protected You',
        body: `The Controller kept you safe by keeping you prepared and productive. In environments where chaos meant pain and worth was conditional, control and achievement were survival.

**It served you when:**
- Unexpected events led to suffering
- Your value felt tied to what you produced
- Chaos in your environment felt dangerous
- Achievement was the only reliable source of approval
- Rest was criticized or shamed

*Thank the Controller for its service. It gave you stability and worth when both felt fragile.*`,
      },

      blocking: {
        title: "Why It's Blocking Your Flow Now",
        body: `Your unique gift requires surrendering to uncertainty and knowing you're already enough.

Flow, by definition, can't be controlled. The sustainable service you're building? It requires energy you're currently burning on managing every outcome and proving yourself.

**The Controller's cost:**
- You over-plan and under-act
- Burnout cycles from never stopping
- Inability to enjoy any win—there's always the next risk to manage
- Rest feels like laziness, spontaneity feels reckless
- Life feels like a series of risk assessments and performance reviews

The tragedy: seeking certainty and enoughness, you get stagnation and exhaustion. You were already enough before you achieved anything.`,
      },

      kryptonite: {
        title: 'The Kryptonite',
        body: `**Letting go. Resting without guilt. Trusting others to handle it.**

Not recklessly—but trustingly. The Controller dissolves when you prove that good things can happen without being engineered, and that you're worthy without performing.

**Playground challenges that weaken The Controller:**
- Start something without knowing all the steps
- Take a full day off and tell someone about it
- Let someone else lead while you follow
- Celebrate a small win instead of optimizing
- Do something spontaneous with no backup plan

Every time you surrender control and things work out—every moment you exist without producing and find you're still worthy—the lie weakens.`,
      },

      rewiring: {
        title: 'The Rewiring',
        quote: 'I can handle whatever comes. My worth is not my work. Uncertainty is where possibility lives.',
        body: `The wound of chaos and conditional worth becomes the gift of adaptability and presence. You know what it costs to over-control and over-perform—which makes you passionate about helping others trust the process and know they're enough.

**Affirmation:**
*"Thank you for protecting me from chaos and rejection. I can handle uncertainty now. I am enough even when still. Flow requires surrender, and surrender is safe."*`,
      },

      heroes: {
        title: 'Heroes Who Faced The Controller',
        body: `*"I had a 47-page business plan. Every contingency mapped. Three years later, I still hadn't started. The day I launched with a one-page 'let's see what happens' approach, my actual business began."* — James, The Cosmic Connector

*"I hit every goal I set—and felt nothing. The day I took a week off with no 'productive' purpose was the hardest thing I'd ever done. Halfway through, I realized I'd been running from stillness my whole life."* — Chris, The Rhythm Architect`,
      },
    },
  },

  // ============================================
  // THE AUTO-PILOT
  // ============================================
  {
    id: 'voice_auto_pilot',
    category: 'voiceArchives',
    title: 'The Auto-Pilot',
    icon: '🛋️',
    order: 4,
    unlockTrigger: UNLOCK_TRIGGERS.VOICE_IDENTIFIED,
    unlockValue: 'auto-pilot',
    altUnlockTrigger: UNLOCK_TRIGGERS.VOICE_FACED,
    altUnlockValue: 'auto-pilot',

    content: {
      origin: {
        title: 'The Origin',
        body: `Before the Matrix wore you down, you wanted things.

Maybe it was years of sustained stress with no resolution. A career that looked successful but felt hollow. A relationship where you stopped asking for what you needed because it never came. Or perhaps it was subtler—a slow accumulation of small surrenders until "I'm fine" became your autopilot response to everything.

The Auto-Pilot emerged to protect you. If you stop feeling, you stop hurting. If you go through the motions, you don't have to face the gap between what you have and what you want. If you check out, the weight of it all becomes bearable.

And it worked. You survived. You kept going. You held it together.

But protection became numbness.`,
      },

      lie: {
        title: 'The Lie It Tells',
        quote: "I'm fine, just tired.",
        body: `The Auto-Pilot barely speaks. That's the point:

- *"It's not that bad. Other people have it worse."*
- *"I don't really want anything. I'm content."*
- *"I'm just tired. I'll feel different after some rest."*
- *"There's no point thinking about it. This is just how it is."*

The cruelest part? It feels like peace. It disguises collapse as contentment, numbness as acceptance, and checking out as "being chill." You don't even know you're in it until someone asks what you actually want and you draw a blank.`,
      },

      protection: {
        title: 'How It Protected You',
        body: `The Auto-Pilot kept you safe by keeping you numb. In environments where feeling things fully was too dangerous or exhausting, checking out was survival.

**It served you when:**
- Sustained overwhelm had no resolution
- Wanting things led to disappointment
- You were burning out but couldn't stop
- Feeling the full weight of your situation would have broken you

*Thank the Auto-Pilot for its service. It kept you going when going was all you could do.*`,
      },

      blocking: {
        title: "Why It's Blocking Your Flow Now",
        body: `Your unique gift requires presence. Flow is the opposite of autopilot.

The creative breakthroughs, the genuine connections, the moments of alignment—they all require you to be HERE. Checked in. Feeling things. The service you're meant to provide? It needs the part of you that cares, not the part that's going through the motions.

**The Auto-Pilot's cost:**
- Days blur together with no memorable moments
- You scroll instead of create, numb instead of feel
- Opportunities pass unnoticed because you're not really looking
- Relationships stay surface-level because depth requires presence
- You say "I'm fine" so often you believe it

The tragedy: seeking relief from pain, you lose access to joy. You can't selectively numb. When you check out from the hard stuff, you check out from the good stuff too.`,
      },

      kryptonite: {
        title: 'The Kryptonite',
        body: `**Asking yourself "What do I actually want?" and sitting with the answer.**

Not doing anything about it yet. Just letting yourself want something. The Auto-Pilot dissolves when you prove that desire doesn't have to lead to disappointment.

**Playground challenges that weaken The Auto-Pilot:**
- Put your phone down for an hour and notice what you feel
- Write down three things you want (not need—want)
- Do something that requires your full attention
- Tell someone how you actually feel when they ask
- Try something new that has no practical purpose

Every moment of genuine presence is evidence that feeling things is safe.`,
      },

      rewiring: {
        title: 'The Rewiring',
        quote: 'I am allowed to want things. Feeling is not dangerous. Presence is the antidote.',
        body: `The wound of overwhelm becomes the gift of compassion. You know what it's like to be so exhausted you check out—which makes you passionate about creating environments where people can come back to themselves gently.

**Affirmation:**
*"Thank you for protecting me from overwhelm. I can feel things now. My desires are valid. I don't have to go through the motions anymore. I choose to be here—present, imperfect, alive."*`,
      },

      heroes: {
        title: 'Heroes Who Faced The Auto-Pilot',
        body: `*"Someone asked me what I wanted for dinner and I couldn't answer. Not because I didn't care—because I'd stopped letting myself want anything. That tiny moment cracked something open. I started with dinner. Then bigger things."* — Kai, The Grounded Guardian

*"I spent five years 'fine.' Great job, nice apartment, solid routine. One morning I realized I couldn't remember the last time I felt excited about anything. The Auto-Pilot had kept me safe—and completely disconnected from my own life."* — Elena, The Mystic Messenger`,
      },
    },
  },

  // ============================================
  // THE GHOST
  // ============================================
  {
    id: 'voice_ghost',
    category: 'voiceArchives',
    title: 'The Ghost',
    icon: '👻',
    order: 5,
    unlockTrigger: UNLOCK_TRIGGERS.VOICE_IDENTIFIED,
    unlockValue: 'ghost',
    altUnlockTrigger: UNLOCK_TRIGGERS.VOICE_FACED,
    altUnlockValue: 'ghost',

    content: {
      origin: {
        title: 'The Origin',
        body: `Before the Matrix taught you to hide, you were seen.

Maybe it was a classroom where your answer was mocked. A family dinner where your excitement was dismissed. A moment on stage where silence felt like rejection. Or perhaps it was subtler—a pattern of being overlooked until you learned that invisibility was safer than visibility.

The Ghost emerged to protect you. If they can't see you, they can't hurt you. If you stay in the shadows, you're safe from criticism. If you never claim the spotlight, you never have to fear its glare.

And it worked. You survived. You learned to contribute from the sidelines, to let others take credit, to keep your gifts private where they couldn't be judged.

But protection became prison.`,
      },

      lie: {
        title: 'The Lie It Tells',
        quote: "Visibility is dangerous. Stay small. Don't attract attention.",
        body: `The Ghost speaks in whispers:

- *"Don't post that—who do you think you are?"*
- *"Let someone else go first."*
- *"You're not ready to be seen yet."*
- *"What if they think you're showing off?"*

The cruelest part? It uses your humility against you. It knows you don't want to seem arrogant, and it weaponizes that awareness into silence.`,
      },

      protection: {
        title: 'How It Protected You',
        body: `The Ghost kept you safe by keeping you hidden. In environments where standing out meant standing alone, invisibility was survival.

**It served you when:**
- Being seen led to criticism or ridicule
- Your authentic expression wasn't welcomed
- Blending in was necessary for belonging
- Visibility felt genuinely unsafe

*Thank the Ghost for its service. It got you here.*`,
      },

      blocking: {
        title: "Why It's Blocking Your Flow Now",
        body: `Your unique gift requires being seen to create impact.

The people who need what only you can offer? They can't find you if you're hiding. The service you're meant to provide? It requires stepping into visibility.

**The Ghost's cost:**
- Your work stays hidden while lesser work gets attention
- You wait for "permission" that never comes
- You undercharge (or don't charge) because pricing requires claiming value
- You help others shine while dimming your own light

The tragedy: seeking safety in invisibility, you achieve irrelevance. The hidden gift helps no one.`,
      },

      kryptonite: {
        title: 'The Kryptonite',
        body: `**Being seen anyway.**

Not perfectly. Not when you're "ready." Now. Imperfectly. Visibly.

Every time you post, publish, present, or claim space—and survive—the Ghost learns that visibility isn't death.

**Playground challenges that weaken The Ghost:**
- Share something you made (Screen)
- Speak up in a meeting (Live)
- Put a price on your work (Money)
- Share a struggle publicly (Vulnerable)
- Claim expertise in your area (Authority)

Every visibility action is evidence that being seen is safe.`,
      },

      rewiring: {
        title: 'The Rewiring',
        quote: "I am safe to be seen. My visibility serves others. The world needs what I'm hiding.",
        body: `The wound of invisibility becomes the gift of visibility. You know what it's like to be overlooked—which makes you passionate about helping others be seen.

**Affirmation:**
*"Thank you for protecting me from danger. I can handle being seen now. My visibility isn't arrogance—it's service. The people who need me can only find me if I'm findable."*`,
      },

      heroes: {
        title: 'Heroes Who Faced The Ghost',
        body: `*"I spent 15 years letting my coworkers present my ideas. When I finally started posting my own thoughts, I expected attacks. Instead, I found my people."* — Sarah, The Translator

*"The Ghost told me authority meant arrogance. Turns out, claiming my expertise was the most generous thing I could do for my clients. They needed someone confident in what they knew."* — Marcus, The Wise Sage`,
      },
    },
  },
]

export default VOICE_ARCHIVES
