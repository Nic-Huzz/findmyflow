/**
 * Founder's Journey - Huzz's stories from 5 years of transformation
 *
 * These are real stories from the founder's experience, showing the path
 * others will walk. They're meant to normalize the journey and prove
 * transformation is possible.
 */

import { UNLOCK_TRIGGERS } from './index'

export const FOUNDER_JOURNEY = [
  // ============================================
  // THE EARTHQUAKE
  // ============================================
  {
    id: 'founder_earthquake',
    category: 'founderJourney',
    title: 'The Earthquake',
    subtitle: 'When everything I believed stopped being true',
    icon: '🌋',
    order: 1,
    unlockTrigger: UNLOCK_TRIGGERS.ONBOARDING_COMPLETE,
    unlockValue: true,

    content: {
      moment: {
        title: 'The Moment',
        body: `I had done everything right.

Final year of university, I'd landed what I thought was my dream job—an adventure capital firm that merged my two passions: education and business. This was the goal. This was what following the path was supposed to deliver.

When they offered me the full-time role after graduation, I said yes without hesitation. This was the moment I'd been working toward my whole life.

One month in, something was wrong.

I wasn't happy. I wasn't fulfilled. The joy I'd been promised—the joy that was supposed to come from following the rules, getting good grades, landing the good job—it wasn't there.

And then it hit me. Not like a realization. Like an earthquake.

**Every building of understanding I had about how the world worked—crumbled.**

I'd trusted the process. School → university → internships → good job → happiness. I'd done each step. And now, standing in the rubble of that broken promise, I had nothing but questions:

*Who am I?*
*What's my purpose?*
*What am I doing with my life?*
*Why is everyone walking this path if it doesn't lead where they said it would?*

That earthquake was the most disorienting experience of my life. And the most important one.`,
      },

      lesson: {
        title: 'The Lesson',
        body: `The earthquake wasn't punishment. It was initiation.

Looking back, I can see what I couldn't see then: the path I was on would never have led to fulfillment. It was optimized for safety, not alignment. For approval, not expression. For fitting in, not standing out.

The earthquake destroyed my trust in the prescribed path. That destruction was necessary. You can't build a new life on the foundation of beliefs that don't serve you.

**What I learned:**

- The traditional path isn't designed to make you happy. It's designed to make you predictable.
- The feeling that "something is wrong" isn't a flaw to fix. It's wisdom to follow.
- The buildings that fell were supposed to fall. They were blocking my view.

That month of confusion—of having no idea who I was or what I wanted—was the beginning of everything. The earthquake cleared the ground for what came next.`,
      },

      forYou: {
        title: 'For Your Journey',
        body: `If you've felt the earthquake—if everything you believed has started to shake—you're not broken. You're waking up.

The disorientation is real. The questions without answers are uncomfortable. The loss of your old story is a kind of grief.

But here's what I want you to know: **the earthquake is the beginning, not the end.**

On the other side of this destruction is a new foundation. One you build yourself, based on what's actually true for you—not what you were told should be true.

You're not in crisis. You're in transformation. The difference is perspective.

*"The earthquake doesn't destroy who you are. It destroys who you were pretending to be."*`,
      },
    },
  },

  // ============================================
  // THE KNOWLEDGE TRAP
  // ============================================
  {
    id: 'founder_knowledge_trap',
    category: 'founderJourney',
    title: 'The Knowledge Trap',
    subtitle: '42 courses and $30,000 later, still stuck',
    icon: '📚',
    order: 2,
    unlockTrigger: UNLOCK_TRIGGERS.FLOW_FINDER_COMPLETE,
    unlockValue: true,

    content: {
      moment: {
        title: 'The Moment',
        body: `After the earthquake, I did what I'd always done when facing a problem: I tried to learn my way out of it.

Course after course. Program after program. Each one promising the answer I was looking for.

*"This course will help you find your purpose."*
*"This program will show you how to build a business."*
*"This framework will change your life."*

I believed every single promise. I paid for every single solution.

**The final count: 42 learning experiences. $30,000 spent. Three years invested.**

And at the end of it all, I found myself in the exact same place I started.

Still confused. Still stuck. Still waiting for the knowledge that would finally click.

I had notebooks full of frameworks. Folders full of worksheets. A brain full of concepts. And nothing—*nothing*—in my external reality had changed.

That's when I realized: **the problem wasn't a lack of knowledge. It was a lack of action.**

All those courses taught me what to do. None of them helped me actually do it. I was using learning as a hiding place—a sophisticated form of procrastination that felt productive but produced nothing.`,
      },

      lesson: {
        title: 'The Lesson',
        body: `**Transformation doesn't happen from knowledge acquisition. It happens from taking action.**

I was trapped in what I now call the Knowledge Trap: the belief that if you just learn enough, you'll finally be ready. One more course. One more framework. One more certification. Then you can start.

The trap is this: there's always more to learn. The goal post always moves. Readiness never arrives.

**What I learned:**

- Knowledge without action is entertainment, not education.
- The feeling of "learning" can masquerade as progress while nothing actually changes.
- At some point, the answer isn't in another course—it's in the thing you already know you need to do but haven't done.
- Action reveals more than theory ever could. You learn by doing, not by preparing to do.

The moment I stopped learning *about* action and started *taking* action, everything shifted. Three years of courses hadn't moved me an inch. Three months of action moved me further than I'd ever been.`,
      },

      forYou: {
        title: 'For Your Journey',
        body: `If you're addicted to learning—if you have shelves of books and folders of courses but still feel stuck—you might be in the Knowledge Trap.

Ask yourself: **Am I learning to grow, or learning to hide?**

There's nothing wrong with education. The problem is using it as a shield against the scary thing you know you need to do.

You probably already know enough to take the next step. The knowledge isn't what's missing. The courage is.

Here's what finally worked for me: I stopped asking "what do I need to learn?" and started asking "what am I avoiding by learning?"

The answer to that question led to my next action. And action—not knowledge—is where transformation lives.

*"You don't need another course. You need to do the thing the last course told you to do."*`,
      },
    },
  },

  // ============================================
  // THE FEAR CHALLENGE
  // ============================================
  {
    id: 'founder_fear_challenge',
    category: 'founderJourney',
    title: 'The Fear Challenge',
    subtitle: '52 weeks of terrifying actions that changed everything',
    icon: '🎯',
    order: 3,
    unlockTrigger: UNLOCK_TRIGGERS.PLAYGROUND_COUNT,
    unlockValue: 1,

    content: {
      moment: {
        title: 'The Moment',
        body: `After realizing that knowledge wasn't the answer, I made myself a promise:

**Do one thing per week that absolutely terrifies you. For one year. No exceptions.**

I didn't have a plan. I didn't have a framework. I just knew that whatever I'd been doing wasn't working, and fear seemed to be the common thread holding me back.

The first few weeks were small things—speaking up in meetings, sharing opinions I'd normally swallow. Then they got bigger.

**Within 4 weeks:** I was working from Bali.

**Within 3 months:** I had quit my job.

**Within 5 months:** I was funding my life traveling Thailand and Bali, hosting silent discos on beaches.

I hadn't planned any of this. I had no strategy for location freedom or entrepreneurship. I was just following the fear—doing the thing that scared me, week after week, and watching what opened up.

That year of fear challenges compressed five years of growth into twelve months. Every terrifying action expanded what my nervous system felt safe doing. And as my comfort zone grew, my life grew with it.`,
      },

      lesson: {
        title: 'The Lesson',
        body: `**We don't rise to the level of our ambitions. We fall to the level of what we feel safe doing.**

This is the insight that changed everything.

I had big ambitions. I'd always had big ambitions. But my nervous system had a smaller map of what was safe. And no matter how ambitious my plans, my actions stayed within that map.

The fear challenges rewired the map. Every scary thing I did and survived taught my nervous system: *"This is safe too."* The map grew. My actions could finally match my ambitions.

**What I learned:**

- Courage isn't the absence of fear. It's action despite fear.
- Your comfort zone isn't a reflection of your capability. It's a reflection of your conditioning.
- The things that terrify you are often precisely the things that would transform your life.
- Fear is a compass. It points toward growth.

I didn't become less afraid. I became willing to be afraid and move anyway. That willingness changed everything.`,
      },

      forYou: {
        title: 'For Your Journey',
        body: `You don't need to do 52 weeks of fear challenges (though you could).

You just need to do *one*.

What's the thing you know you should do, that terrifies you, that you've been avoiding?

That's your first challenge. Not because you need to be reckless, but because that specific fear is blocking your specific growth.

Here's the secret: the anticipated fear is almost always worse than the actual experience. You imagine catastrophe; you get discomfort. The imagination is crueler than reality.

And here's the gift: every time you move through fear and survive, your nervous system updates its map. What was terrifying becomes tolerable. What was tolerable becomes comfortable. What was comfortable becomes boring—and you need a new edge to grow against.

That's the game. That's the Playground. That's how you expand into who you're meant to become.

*"The life you want is on the other side of the fear you're avoiding."*`,
      },
    },
  },

  // ============================================
  // THE IDENTITY FLIP
  // ============================================
  {
    id: 'founder_identity_flip',
    category: 'founderJourney',
    title: 'The Identity Flip',
    subtitle: 'When not doing the scary thing became scarier than doing it',
    icon: '🔄',
    order: 4,
    unlockTrigger: UNLOCK_TRIGGERS.PLAYGROUND_COUNT,
    unlockValue: 10,

    content: {
      moment: {
        title: 'The Moment',
        body: `Somewhere around week 15 of the fear challenge, something strange happened.

I was scheduled to perform a magic show at an open mic. I'd learned a few tricks specifically for this challenge. Standing backstage, I felt the familiar terror—hands shaking, heart racing, voice in my head screaming "don't do this."

But this time, there was another voice. Louder.

*"You're someone who does scary things. That's who you are now. If you don't go up there, you break that identity."*

And suddenly, the fear flipped.

**Not doing the scary thing felt scarier than doing it.**

The pain of breaking my streak—of losing my identity as "someone who shows up despite fear"—was worse than the pain of the fear itself.

I did the magic show. It was awkward and imperfect. But I walked off stage knowing something had fundamentally shifted. I wasn't just doing scary things anymore. I had *become* someone who does scary things. The action had become identity.`,
      },

      lesson: {
        title: 'The Lesson',
        body: `**Identity is the ultimate motivator.**

Before the flip, I was motivated by external goals: quit my job, travel, build freedom. These were nice, but they were distant. They didn't get me out of bed when fear was screaming.

After the flip, I was motivated by who I had become. Every scary thing wasn't just an action—it was evidence. Proof that I was the kind of person who does hard things. And not doing them threatened that proof.

**What I learned:**

- Action creates identity. Do the thing enough times and you become someone who does that thing.
- Identity creates action. Once you ARE someone who does that thing, not doing it feels wrong.
- The goal isn't just to complete challenges—it's to become someone who challenges themselves.
- The streak matters because breaking it breaks the story you're telling yourself about who you are.

This is the magic of the Playground. It's not just about facing fears—it's about building an identity as someone who faces fears. And that identity, once formed, makes the scary path feel like the only path.`,
      },

      forYou: {
        title: 'For Your Journey',
        body: `The Identity Flip doesn't happen immediately. You can't force it. But you can create conditions for it.

**How to accelerate the flip:**

1. **Track your actions visibly**. The streak isn't vanity—it's evidence. When you can see "I've done 10 scary things," you start to believe you're someone who does scary things.

2. **Claim the identity early**. Don't wait until you feel ready. Say "I'm someone who does scary things" before it feels fully true. The claim creates pressure to match.

3. **Make it costly to quit**. Tell people about your challenge. Public commitment raises the stakes of stopping.

4. **Notice the dissonance**. When you feel the flip starting—when NOT doing the scary thing feels worse—pay attention. That's the identity forming.

The goal isn't to be fearless. The goal is to become someone for whom action despite fear is simply "what I do." That identity, once established, carries you through challenges you can't yet imagine.

*"You don't decide to change. You decide to act, and the acting changes you."*`,
      },
    },
  },

  // ============================================
  // THE MONEY SHIFT
  // ============================================
  {
    id: 'founder_money_shift',
    category: 'founderJourney',
    title: 'The Money Shift',
    subtitle: 'Learning to be paid for what I loved',
    icon: '💰',
    order: 5,
    unlockTrigger: UNLOCK_TRIGGERS.PLAYGROUND_LAYER,
    unlockValue: 'money',

    content: {
      moment: {
        title: 'The Moment',
        body: `I was hosting silent discos on beaches in Southeast Asia. People were dancing under the stars, headphones on, huge smiles on their faces. I was having the time of my life.

Afterwards, people would come up to me: *"That was amazing! How much do I owe you?"*

And every time, I'd say: *"Nothing. Don't worry about it."*

**I physically couldn't accept money.** Something in me believed that if I loved doing it, I shouldn't charge for it. That getting paid would somehow taint the joy. That I wasn't "professional" enough to warrant payment.

My friends finally confronted me: *"Nic, people are literally trying to give you money. Why are you rejecting it?"*

I didn't have a good answer. Just discomfort.

So I made it a groan challenge: **Accept payment for the next silent disco. No refusing.**

The next event, when someone offered money, I felt the familiar urge to wave it away. Instead, I said: *"Thank you."* And I took it.

Nothing bad happened. The joy didn't disappear. The magic didn't break. And suddenly I was being funded to do what I loved.`,
      },

      lesson: {
        title: 'The Lesson',
        body: `**You CAN be paid for having fun. Joy and income are not opposites.**

I'd absorbed a belief from somewhere: serious work deserves serious pay; fun work doesn't deserve anything. Real professionals don't enjoy their jobs. If it's play, it can't be valuable.

This is a lie that keeps people stuck in jobs they hate, believing that money requires misery.

**What I learned:**

- The things you would do for free are often exactly the things people will pay for.
- Your joy doesn't reduce the value you create—it often increases it.
- Rejecting payment isn't humility. It's a Protective Voice keeping you small.
- The Money layer of visibility isn't about greed. It's about claiming that your gifts have worth.

The shift wasn't about becoming money-focused. It was about releasing the false belief that separated joy from income. They can coexist. In fact, when they do, that's Flow.`,
      },

      forYou: {
        title: 'For Your Journey',
        body: `Do you have trouble charging for what you do? Do you discount your rates, give away your work, or feel uncomfortable when payment is offered?

That's The Ghost or The People Pleaser at the Money layer—telling you that visibility at that level is dangerous. That claiming your worth is arrogant. That money and meaning can't mix.

**Questions to ask yourself:**

- What would I do for free that others might pay for?
- What belief makes me uncomfortable accepting money for my gifts?
- Who told me that work should be separate from joy?

The Money shift isn't about becoming mercenary. It's about removing false limits. You deserve to be paid for the value you create, even when—*especially when*—creating that value feels like play.

The first time you accept money for something you love, it changes your entire relationship with work. Not because you become greedy, but because you realize: *this can be my life.*

*"The world pays for value, not for suffering. Your joy is a feature, not a bug."*`,
      },
    },
  },

  // ============================================
  // THE PURGATORY
  // ============================================
  {
    id: 'founder_purgatory',
    category: 'founderJourney',
    title: 'The Purgatory',
    subtitle: '18 months of being neither old-me nor new-me',
    icon: '🌫️',
    order: 6,
    unlockTrigger: UNLOCK_TRIGGERS.DAYS_ACTIVE,
    unlockValue: 14,

    content: {
      moment: {
        title: 'The Moment',
        body: `There's a part of the journey no one warns you about.

After the earthquake, I spent 18 months in what I can only call **purgatory**: a liminal space where I was no longer the old me, but hadn't yet become the new me.

Around new people—in online courses, at events—I could show up as this emerging version of myself. They didn't know the old Nic. They only saw who I was becoming.

But around old friends and family? I became a disaster.

**I was a bad version of my new self AND a bad imposter of my old self.**

With people who knew the old me, I couldn't be fully authentic—it felt too vulnerable, too different from who they expected. But I also couldn't pretend to be the old me anymore. That person was gone.

So I'd show up as this awkward hybrid: half-authentic, half-performing. Satisfying no one, especially myself.

I started avoiding situations with old connections. It was easier to isolate than to navigate the dissonance. For 18 months, I felt profoundly alone—unable to go back, unable to fully step forward.`,
      },

      lesson: {
        title: 'The Lesson',
        body: `**Transformation has a messy middle. The purgatory is part of the path.**

I thought transformation would be clean: old-me would die, new-me would be born, and I'd continue seamlessly. That's not how it works.

The middle is uncomfortable. You lose your old identity before the new one is stable. People who loved the old you don't know how to relate to this stranger. You don't know how to relate to yourself.

**What I learned:**

- The purgatory isn't failure. It's transition.
- Not everyone from your old life will make it to your new life. That's okay.
- The discomfort of being half-formed is temporary. Keep going.
- New communities help. Find people who only know the becoming-you.
- The fear challenges shortened my purgatory. Action accelerates identity formation.

If I hadn't eventually pushed through—through the fear challenges, through the awkwardness—I might have stayed in purgatory forever. Some people do. They get stuck between who they were and who they could be, unable to commit to either.`,
      },

      forYou: {
        title: 'For Your Journey',
        body: `If you're in the purgatory right now—if you feel caught between versions of yourself, unable to go back but unsure how to go forward—know this:

**It's temporary. And it's necessary.**

You can't skip this phase. You can only move through it. And the way through is action, not contemplation.

**What helps in the purgatory:**

1. **Find new people** who only know the becoming-you. This group can hold your new identity while it stabilizes.

2. **Be patient with old relationships**. Some will evolve with you. Some won't. You can't force it.

3. **Don't isolate completely**. The temptation is to hide until you've "figured it out." This extends the purgatory.

4. **Take the scary actions**. Each one makes the new identity more real, more solid, more you.

The purgatory ends when your new identity becomes stable enough to withstand the confusion of others. When you can show up as the new you regardless of who's watching.

That stability comes from evidence. From actions that prove who you're becoming. The Playground is how you build that evidence.

*"You're not lost. You're between stories. Keep writing the new one."*`,
      },
    },
  },
]

export default FOUNDER_JOURNEY
