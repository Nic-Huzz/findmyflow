/**
 * Email Sequence Templates
 *
 * ============================================
 * ⚠️  ALL COPY IN THIS FILE NEEDS REVIEW  ⚠️
 * ============================================
 *
 * These are draft templates. Review and approve before going live.
 */

// ============================================
// MONEY MODEL EMAIL SEQUENCE
// ============================================

export const MONEY_MODEL_EMAILS = {
  day_0: {
    subject: "{{name}}, your {{offer_type}} strategy is ready",
    preheader: "Here's your personalized offer recommendation",
    body: `
Hi {{name}},

You just completed the {{offer_type}} assessment — nice work.

Based on your answers, your recommended strategy is:

**{{recommended_offer}}** ({{confidence}}% match)

This isn't random. It's based on how you answered questions about your audience, your strengths, and your current capacity.

Here's why this matters:

Most people pick an offer type based on what they've seen work for others. But what works for someone with a big audience and team looks very different from what works for someone just starting out.

Your {{recommended_offer}} strategy is matched to where YOU are right now.

**What's next?**

Over the next few days, I'll send you:
- Why most {{offer_type}}s fail (and how to avoid it)
- A case study of someone in a similar position who made it work
- The missing piece most people don't consider

For now, just let this sink in.

Talk soon,
Huzz

P.S. If you want to dive deeper right away, you can explore the full FindMyFlow platform here: https://findmyflow.nichuzz.com
    `.trim()
  },

  day_1: {
    subject: "The hidden reason {{offer_type}} feels hard (it's not what you think)",
    preheader: "It's probably not a strategy problem",
    body: `
Hi {{name}},

Yesterday I sent you your {{recommended_offer}} recommendation.

Today I want to share something most business coaches won't tell you:

**The reason building offers feels hard usually isn't a strategy problem.**

You can have the perfect {{offer_type}} strategy... and still not execute on it.

You can know exactly what to do... and find yourself procrastinating anyway.

Why?

Because your nervous system has a boundary around what feels "safe."

Safe to earn. Safe to be visible. Safe to succeed.

Anything beyond that boundary? Your system pulls you back.

Not because you lack capability. Not because you need more information.

Because expansion feels dangerous to your nervous system.

This is why I built FindMyFlow differently.

We don't just give you strategy. We help you expand your capacity to actually USE that strategy.

More on this tomorrow.

Huzz

P.S. Curious where your nervous system boundary is? Try the Nervous System Map: https://findmyflow.nichuzz.com/try/nervous-system
    `.trim()
  },

  day_3: {
    subject: "How {{offer_type}} creators are earning {{income_range}} without burnout",
    preheader: "Real examples, not theory",
    body: `
Hi {{name}},

Quick question:

Do you ever look at people successfully selling {{offer_type}}s and think "that looks exhausting"?

The constant content creation. The launches. The hustle.

Here's what I've noticed after working with hundreds of professionals:

**The ones who burn out are usually running someone else's playbook.**

They're doing what worked for an influencer with 500K followers.
Or what a course taught them without context.
Or what looks impressive on social media.

The ones who thrive? They build something that fits THEIR nervous system.

Some examples:

→ The introvert who built a $15K/month business from referrals only (no social media)
→ The parent who runs cohorts 4x/year and takes summers off
→ The ex-corporate who replaced their salary with 12 high-ticket clients

None of them are doing what the gurus say you "should" do.

All of them designed something that matches their energy.

That's what your {{recommended_offer}} strategy is about.

Not copying what works for others.

Building what works for YOU.

Huzz

P.S. Ready to design your version? The full platform walks you through it step by step: https://findmyflow.nichuzz.com
    `.trim()
  },

  day_5: {
    subject: "{{name}}, the missing piece in your {{offer_type}} strategy",
    preheader: "Most people skip this (and wonder why they're stuck)",
    body: `
Hi {{name}},

We've talked about your {{recommended_offer}} strategy.

We've talked about why strategy alone isn't enough.

Today: the missing piece.

**Most people start with "what should I sell?"**

But the better question is: "What problem am I uniquely positioned to solve?"

This isn't about passion. It's about intersection.

Where your skills meet real problems people will pay to solve.

When you nail this intersection, selling becomes easy. Because you're not convincing anyone of anything — you're just offering the obvious solution to a problem they already have.

Inside FindMyFlow, we use something called the Flow Finder to map this intersection:

1. **Skills Discovery** — What you're actually good at (not what you think you should be good at)
2. **Problems Discovery** — What problems you naturally notice and want to solve
3. **Persona Discovery** — Who specifically has these problems and can pay

When all three align, you've found your flow.

And your {{recommended_offer}} becomes the vehicle to deliver it.

This is the foundation we help people build inside the platform.

Worth exploring if you're ready to go deeper.

Huzz

https://findmyflow.nichuzz.com
    `.trim()
  },

  day_7: {
    subject: "Your personalized roadmap is waiting, {{name}}",
    preheader: "7 days to real progress",
    body: `
Hi {{name}},

It's been a week since you discovered your {{recommended_offer}} strategy.

Quick check-in: have you taken any action on it yet?

If not, that's okay. Most people don't.

Not because they don't want to. But because knowing what to do and actually doing it are very different things.

That's exactly why I built the 7-Day Challenge inside FindMyFlow.

It's a gamified system that:
- Breaks your strategy into daily micro-actions
- Tracks your progress (with points, because why not make it fun)
- Includes "groan challenges" that expand your comfort zone
- Has healing practices for when resistance shows up

The goal isn't to build everything in 7 days.

The goal is to build momentum. To prove to your nervous system that action is safe.

Once you have momentum, everything else gets easier.

Your {{recommended_offer}} strategy is waiting.

The question is: are you ready to actually build it?

If yes, come on in:

https://findmyflow.nichuzz.com

See you inside (or not — no pressure),

Huzz
    `.trim()
  }
}

// ============================================
// NERVOUS SYSTEM EMAIL SEQUENCE
// ============================================

export const NERVOUS_SYSTEM_EMAILS = {
  day_0: {
    subject: "{{name}}, your {{archetype}} pattern revealed",
    preheader: "Your nervous system map is ready",
    body: `
Hi {{name}},

You just mapped your nervous system — that takes courage.

Here's what we discovered:

**Your Pattern: {{archetype}}**

{{archetype_description}}

**Your Current Edges:**
- Visibility: You feel safe being seen by about {{edge_visibility}} people
- Earning: You feel safe earning up to {{edge_earning}}/year

These aren't limits on what you're CAPABLE of.

They're limits on what your nervous system currently believes is SAFE.

Big difference.

The good news? These edges can expand. That's literally what the nervous system does — it adapts to new levels of safety through gradual exposure.

Over the next few days, I'll share:
- Why knowing your pattern isn't enough (and what to do instead)
- Specific practices for {{archetype}}s to expand their edge
- How to choose a business strategy that matches your wiring

For now, just sit with this awareness. Notice when your pattern shows up this week.

Talk soon,
Huzz

P.S. Your full profile and expansion practices are inside FindMyFlow: https://findmyflow.nichuzz.com
    `.trim()
  },

  day_1: {
    subject: "Why knowing your pattern isn't enough (and what to do instead)",
    preheader: "Awareness is step one, not the destination",
    body: `
Hi {{name}},

Yesterday you discovered your {{archetype}} pattern.

Today's truth bomb:

**Knowing your pattern won't change it.**

I know, that sounds harsh. But hear me out.

Your nervous system doesn't respond to intellectual understanding. It responds to felt experience.

You can understand WHY you self-sabotage... and still self-sabotage.

You can know you're safe... and still FEEL unsafe.

So what actually works?

Two things:

1. **Somatic practices** — Working with the body, not just the mind. Breathwork. Movement. Regulation techniques. Things that tell your nervous system "we're safe" in a language it understands.

2. **Graduated exposure** — Small, safe expansions beyond your current edge. Not giant leaps that overwhelm your system. Tiny steps that build new neural pathways.

This is why FindMyFlow includes both strategy AND healing work.

Because you can have the perfect business plan... but if your nervous system vetoes it, you won't execute.

More on the practical side tomorrow.

Huzz
    `.trim()
  },

  day_3: {
    subject: "How {{archetype}}s break through their {{edge_type}} edge",
    preheader: "Specific practices for your pattern",
    body: `
Hi {{name}},

You're a {{archetype}}.

Your edge is around {{edge_type}} — specifically, {{edge_earning}}/year and being seen by {{edge_visibility}} people.

Here's what works for people with your pattern:

**The {{archetype}} Expansion Practice:**

1. **Daily Nervous System Check-in**
   Before any visibility or money action, pause. Ask: "What's my system feeling right now?" Don't judge it. Just notice. This builds the awareness muscle.

2. **Micro-Exposures**
   Pick ONE thing slightly beyond your edge. Not 10x bigger. Just 10% bigger. Post to a slightly larger audience. Raise your price by $50. Let yourself be seen by one more person. Small wins compound.

3. **Completion Ritual**
   After each expansion, acknowledge it. "I did that. I'm still here. I'm safe." This teaches your nervous system that expansion ≠ danger.

4. **Repair When Needed**
   Some days you'll contract. That's normal. Have a practice ready — breathing, journaling, movement — that brings you back to baseline.

Inside FindMyFlow, we've gamified this with the 7-Day Challenge.

You get points for expansions. You track your "groans" (those moments of uncomfortable growth). You see your progress over time.

Makes the work actually... kinda fun.

Huzz

P.S. Ready to start expanding? https://findmyflow.nichuzz.com
    `.trim()
  },

  day_5: {
    subject: "The business strategy that matches your nervous system",
    preheader: "Not all strategies are created equal",
    body: `
Hi {{name}},

Here's something most business coaches get wrong:

They teach ONE way to build a business. Usually the way THEY built theirs.

High visibility. Constant content. Big launches. Aggressive growth.

For some nervous systems, that's fine.

For a {{archetype}}? It might be a recipe for burnout or paralysis.

**Here's a different approach:**

Instead of forcing yourself into a strategy that fights your wiring, choose a strategy that MATCHES it.

Some examples:

→ If your visibility edge is low: Focus on referrals, partnerships, and warm audiences instead of cold content
→ If your earning edge is low: Start with lower prices and raise gradually as your system expands
→ If you're a {{archetype}}: Build in more alone time, smaller groups, deeper relationships

This doesn't mean staying small forever.

It means starting where your nervous system can SUSTAIN the action... then expanding from there.

Inside FindMyFlow, after you complete the Nervous System Map, we recommend specific offer strategies that match your pattern.

Your {{edge_earning}}/year edge doesn't mean you're capped there. It means we start there and build up.

Huzz

https://findmyflow.nichuzz.com
    `.trim()
  },

  day_7: {
    subject: "Ready to expand beyond {{edge_earning}}/year, {{name}}?",
    preheader: "Your 7-day expansion challenge awaits",
    body: `
Hi {{name}},

It's been a week since you mapped your nervous system.

You discovered you're a {{archetype}} with edges around {{edge_visibility}} people and {{edge_earning}}/year.

The question now: what do you want to do about it?

Option 1: Nothing. Awareness is valuable on its own. Maybe just knowing your pattern will help you be more compassionate with yourself when you notice it.

Option 2: Start expanding.

If you choose Option 2, here's what's waiting for you inside FindMyFlow:

**The 7-Day Challenge**
- Daily "groan" practices that expand your edge
- Points and progress tracking (gamification actually works)
- Healing practices for when resistance shows up
- A supportive structure that makes growth feel manageable

**The Flow Finder**
- Discover what you're uniquely positioned to build
- Align your skills, problems you solve, and who you serve
- Get clarity on your direction (so expansion has a purpose)

**The Offer Strategy Tools**
- Build an offer stack matched to your nervous system
- CRM to manage your customers
- Content and marketing strategy

Everything you need to go from "I know my pattern" to "I'm building something meaningful."

Your edge is currently {{edge_earning}}/year.

Where do you want it to be?

https://findmyflow.nichuzz.com

See you inside (or not — your choice),

Huzz
    `.trim()
  }
}

// ============================================
// HELPER TO GET EMAIL BY SEQUENCE AND DAY
// ============================================

export function getEmailTemplate(sequenceType, emailKey) {
  if (sequenceType === 'money_model') {
    return MONEY_MODEL_EMAILS[emailKey]
  }
  if (sequenceType === 'nervous_system') {
    return NERVOUS_SYSTEM_EMAILS[emailKey]
  }
  return null
}

/**
 * Apply personalization tokens to email template
 */
export function personalizeEmail(template, tokens) {
  if (!template) return null

  let subject = template.subject
  let preheader = template.preheader
  let body = template.body

  // Replace all tokens
  Object.entries(tokens).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    const stringValue = typeof value === 'string' ? value : String(value || '')
    subject = subject.replace(placeholder, stringValue)
    preheader = preheader.replace(placeholder, stringValue)
    body = body.replace(placeholder, stringValue)
  })

  // Clean up any unreplaced tokens
  const cleanToken = /\{\{[^}]+\}\}/g
  subject = subject.replace(cleanToken, '')
  preheader = preheader.replace(cleanToken, '')
  body = body.replace(cleanToken, '')

  return { subject, preheader, body }
}

// Email schedule (days after signup)
export const EMAIL_SCHEDULE = {
  day_0: 0,      // Immediate
  day_1: 1,      // 1 day later
  day_3: 3,      // 3 days later
  day_5: 5,      // 5 days later
  day_7: 7       // 7 days later
}
