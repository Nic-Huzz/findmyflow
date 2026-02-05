/**
 * Ancient Wisdom - Timeless traditions that validate your path
 *
 * These entries connect FindMyFlow concepts to ancient wisdom traditions,
 * showing that this isn't new-age invention but rediscovery of eternal truths.
 */

import { UNLOCK_TRIGGERS } from './index'

export const ANCIENT_WISDOM = [
  // ============================================
  // IKIGAI
  // ============================================
  {
    id: 'wisdom_ikigai',
    category: 'ancientWisdom',
    title: 'Ikigai: Reason for Being',
    subtitle: 'The Japanese art of finding purpose',
    icon: '🇯🇵',
    order: 1,
    unlockTrigger: UNLOCK_TRIGGERS.FLOW_FINDER_COMPLETE,
    unlockValue: true,

    content: {
      teaching: {
        title: 'The Ancient Teaching',
        body: `In Okinawa, Japan—home to one of the world's highest concentrations of centenarians—there is no word for retirement.

Instead, they have **Ikigai** (生き甲斐): your "reason for getting up in the morning."

Ikigai isn't a destination you reach. It's a practice you live. The Okinawans don't find their Ikigai and then coast—they wake up every day in relationship with it.

Traditional Ikigai emerged from the intersection of four questions:
- What do you love?
- What are you good at?
- What does the world need?
- What can you be paid for?

Where all four overlap, you find your Ikigai—a sustainable purpose that nourishes you while serving others.

The Okinawans didn't have a word for retirement because their work and their meaning were never separated. They didn't work to stop working. They worked because the work itself was life.`,
      },

      translation: {
        title: 'The FindMyFlow Translation',
        body: `The Flow Equation is Ikigai with different labels:

| Ikigai | FindMyFlow |
|--------|------------|
| What you love | Problems that light you up |
| What you're good at | Skills that come naturally |
| What the world needs | People you're meant to serve |
| What you can be paid for | Sustainable service |

When the ancient Okinawans spoke of Ikigai, they were describing what we call **your Flow**—that intersection where your gifts meet genuine need, where effort feels like expression.

The Flow Finder helps you articulate what the Okinawans understood intuitively: you already have a reason for being. It's not something to invent—it's something to uncover.

Your Ikigai is your Flow. Your Flow is your Ikigai. Same truth, different vocabulary.`,
      },

      invitation: {
        title: 'The Invitation',
        body: `The Okinawans live their Ikigai daily, not as a grand mission but as small, consistent actions aligned with purpose.

**Embody this wisdom by:**

- Treating your Flow as a daily practice, not a distant goal
- Finding your reason for getting up each morning—even if it's small
- Not separating "work" from "life"—seeking integration instead
- Remembering that longevity and meaning are connected

The centenarians of Okinawa didn't find their Ikigai and stop. They found it and lived it, day after day, decade after decade.

Your Flow isn't something to achieve and move on from. It's something to practice for a lifetime.

*"The purpose of life is to discover your gift. The work of life is to develop it. The meaning of life is to give it away."* — David Viscott`,
      },
    },
  },

  // ============================================
  // SVADHARMA
  // ============================================
  {
    id: 'wisdom_svadharma',
    category: 'ancientWisdom',
    title: 'Svadharma: Your Sacred Duty',
    subtitle: 'The Hindu concept of personal calling',
    icon: '🙏',
    order: 2,
    unlockTrigger: UNLOCK_TRIGGERS.STAGE_REACHED,
    unlockValue: 4,

    content: {
      teaching: {
        title: 'The Ancient Teaching',
        body: `In the Bhagavad Gita, one of humanity's oldest wisdom texts, Krishna tells Arjuna:

*"It is better to do your own dharma imperfectly than to do another's dharma perfectly."*

This is **Svadharma** (स्वधर्म)—your own sacred duty. "Sva" means self; "dharma" means path, purpose, or righteous way. Together: your unique path.

The ancient Hindus understood that each person has a particular role in the cosmic order—not assigned from outside, but emerging from within. Your Svadharma isn't what others tell you to do. It's what you were born to do.

The teaching warns against a common trap: living someone else's dharma because it looks safer, more respectable, or more successful. Even if you execute another's path perfectly, you'll feel hollow. Even if you stumble on your own path, you'll feel alive.

The worst fate, according to this tradition, isn't failure on your own path—it's success on the wrong one.`,
      },

      translation: {
        title: 'The FindMyFlow Translation',
        body: `Svadharma is what we call your **unique Flow**.

The Matrix told you to follow the prescribed path: school → job → retirement. That's someone else's dharma—a generic template that ignores your specific nature.

Your Flow—the intersection of your skills, the problems that call to you, and the people you're meant to serve—is your Svadharma. It's the path only you can walk.

**The parallel:**

| Svadharma Teaching | FindMyFlow Principle |
|-------------------|---------------------|
| Living another's dharma perfectly still fails | Success in the wrong career is still misalignment |
| Your dharma emerges from within | Your Flow is discovered, not assigned |
| Imperfect alignment beats perfect misalignment | Done on YOUR path beats perfect on someone else's |

When Krishna tells Arjuna to follow his own dharma, he's saying: trust your nature. Your gifts exist for a reason. The path that feels uniquely yours IS uniquely yours.

The Protective Voices are the forces that push you toward others' dharmas—toward the safe, the expected, the approved. Your Flow is your rebellion back toward truth.`,
      },

      invitation: {
        title: 'The Invitation',
        body: `The ancient sages knew what modern research confirms: meaning comes from alignment, not achievement.

**Embody this wisdom by:**

- Asking "is this MY path?" before "is this path successful?"
- Trusting the pull toward your unique work, even when it looks different from others'
- Releasing the need to execute someone else's dharma perfectly
- Accepting imperfection on your own path as superior to perfection on the wrong one

Your Svadharma is already within you. The Flow Finder didn't create it—it helped you see it. The Playground doesn't build your path—it clears the obstacles blocking your view.

You are not meant to live a generic life. You are meant to live YOUR life—the one encoded in your nature before anyone told you what you should be.

*"Your own path, though imperfect, leads to liberation. Another's path, though perfect, leads to fear."* — Bhagavad Gita 3:35`,
      },
    },
  },

  // ============================================
  // TE (VIRTUE/POWER)
  // ============================================
  {
    id: 'wisdom_te',
    category: 'ancientWisdom',
    title: 'Te: Your Inherent Power',
    subtitle: 'The Taoist concept of natural virtue',
    icon: '☯️',
    order: 3,
    unlockTrigger: UNLOCK_TRIGGERS.PLAYGROUND_COUNT,
    unlockValue: 15,

    content: {
      teaching: {
        title: 'The Ancient Teaching',
        body: `The Tao Te Ching, written over 2,500 years ago, speaks of **Te** (德)—often translated as virtue, power, or integrity.

Te isn't morality in the judgmental sense. It's closer to "inherent nature"—the natural power that emerges when something is fully itself.

Water has Te when it flows downhill naturally, finding the path of least resistance while still reaching the sea. A tree has Te when it grows according to its nature—not forcing itself to be a different kind of tree.

Humans have Te when we stop forcing and start flowing—when we act from our essential nature rather than imposed expectations.

The Taoists observed that most human suffering comes from fighting our Te: trying to be something we're not, forcing what should flow, controlling what should be released. The solution isn't more effort—it's less resistance.

*"The Tao does nothing, yet nothing is left undone."* This isn't passivity—it's alignment. When you act from your Te, effort becomes effortless.`,
      },

      translation: {
        title: 'The FindMyFlow Translation',
        body: `Te is what we mean when we say "in Flow."

Flow isn't about working harder. It's about aligning so completely with your nature that work stops feeling like work. That's Te in action.

**The parallel:**

| Taoist Te | FindMyFlow Concept |
|-----------|-------------------|
| Act from your inherent nature | Work from your unique Skills/Problems/People |
| Wu wei (effortless action) | The Flow state |
| Resistance creates suffering | The Groan as misdirected energy |
| Power comes from alignment, not force | Sustainable success from alignment, not hustle |

The Protective Voices are what Taoists would call "going against the Tao"—forcing, controlling, performing, hiding. They create resistance because they oppose your natural Te.

When you face your Protective Voices in the Playground, you're practicing a Taoist discipline: releasing what blocks your Te so your natural power can express itself.`,
      },

      invitation: {
        title: 'The Invitation',
        body: `The Taoists spent lifetimes cultivating what you can practice daily: alignment with your natural way.

**Embody this wisdom by:**

- Noticing where you're forcing vs. flowing
- Trusting that effort should feel like expression, not extraction
- Releasing the need to be different from what you naturally are
- Seeing resistance not as something to overcome, but as a signal of misalignment

Your Te—your inherent power—is already complete. You don't need to build it. You need to stop blocking it.

The Playground challenges aren't about becoming more powerful. They're about removing the obstacles that hide your existing power. Each Protective Voice released is more Te expressed.

The ancient Taoists called this "returning to the uncarved block"—getting back to who you were before the world told you who to be.

*"The soft overcomes the hard. The slow overcomes the fast. Let your workings remain a mystery. Just show people the results."* — Tao Te Ching`,
      },
    },
  },

  // ============================================
  // THE HERO'S JOURNEY
  // ============================================
  {
    id: 'wisdom_heros_journey',
    category: 'ancientWisdom',
    title: "The Hero's Journey",
    subtitle: 'The universal story you are living',
    icon: '⚔️',
    order: 4,
    unlockTrigger: UNLOCK_TRIGGERS.STAGE_REACHED,
    unlockValue: 6,

    content: {
      teaching: {
        title: 'The Ancient Teaching',
        body: `In 1949, mythologist Joseph Campbell published "The Hero with a Thousand Faces," revealing a pattern hidden in every culture's stories:

**The Monomyth**—a single story structure underneath all heroic narratives.

From Odysseus to Luke Skywalker, from Buddha to Bilbo Baggins, the same pattern appears:

1. **The Ordinary World** — Life before the call
2. **The Call to Adventure** — Something disrupts the ordinary
3. **Refusal of the Call** — Fear, doubt, hesitation
4. **Meeting the Mentor** — Guidance appears
5. **Crossing the Threshold** — Commitment to the journey
6. **Tests, Allies, Enemies** — The road of trials
7. **The Ordeal** — The central crisis
8. **Reward** — Seizing the treasure
9. **The Road Back** — Returning with the gift
10. **Resurrection** — Final transformation
11. **Return with the Elixir** — Sharing the gift with the world

Campbell's insight: this isn't just a storytelling formula. It's a map of psychological transformation. The hero's journey is the shape of human growth itself.`,
      },

      translation: {
        title: 'The FindMyFlow Translation',
        body: `You are living the Hero's Journey. FindMyFlow is your map.

| Hero's Journey Stage | Your FindMyFlow Experience |
|---------------------|---------------------------|
| Ordinary World | Life in the Matrix (before the earthquake) |
| Call to Adventure | The earthquake—sensing something is wrong |
| Refusal of the Call | Protective Voices activating: "Stay safe" |
| Meeting the Mentor | Finding FindMyFlow, Zarlo, community |
| Crossing the Threshold | Committing to the journey |
| Tests, Allies, Enemies | The Playground, facing fears, Movement Makers |
| The Ordeal | Your deepest Groan—the challenge that transforms |
| Reward | Your Flow discovered, your gift clarified |
| The Road Back | Building your offer, re-entering the world |
| Resurrection | First Service—proof of transformation |
| Return with the Elixir | Living your mission, serving your people |

You're not just doing personal development. You're living a mythic pattern as old as humanity itself.`,
      },

      invitation: {
        title: 'The Invitation',
        body: `The Hero's Journey isn't about becoming special. It's about becoming *yourself*—and bringing what you learn back to serve others.

**Embody this wisdom by:**

- Recognizing your earthquake as a "call to adventure," not a breakdown
- Understanding that refusal and doubt are part of the pattern—every hero resists at first
- Trusting that mentors and allies will appear (they already have)
- Knowing that the ordeal—the scariest challenge—is where transformation happens
- Remembering that the journey ends in service, not just self-improvement

Campbell's most famous line: *"The cave you fear to enter holds the treasure you seek."*

That cave is your deepest Groan. That treasure is your fullest expression. The journey through fear IS the hero's journey. You're already on it.

The elixir you'll return with isn't for you alone. It's the gift you'll give your people—the transformation you can offer because you transformed yourself.

*"We must be willing to get rid of the life we've planned, so as to have the life that is waiting for us."* — Joseph Campbell`,
      },
    },
  },
]

export default ANCIENT_WISDOM
