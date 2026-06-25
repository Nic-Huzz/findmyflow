# Vibe Rise — Welcome Email Sequence

## Overview

**Trigger:** User signs up for the Vibe Rise app (creates account via `/get-started`)
**Sequence type:** `welcome`
**Emails:** 7 over 14 days
**From:** `Huzz <huzz@viberise.nichuzz.com>`
**Reply-to:** `huzz@nichuzz.com`

## Schedule

| # | Key | Delay | Send Time | Subject |
|---|-----|-------|-----------|---------|
| 0 | day_0 | +30 min | Immediate | Welcome to Vibe Rise |
| 1 | day_1 | Day 1 | 10am UTC | I quit my job at 26 because of a feeling |
| 2 | day_3 | Day 3 | 10am UTC | The thing $30K of courses couldn't teach me |
| 3 | day_5 | Day 5 | 10am UTC | Your Vibe Rise score (and what it actually measures) |
| 4 | day_7 | Day 7 | 10am UTC | One week in |
| 5 | day_10 | Day 10 | 10am UTC | The pattern I see in everyone who stays stuck |
| 6 | day_14 | Day 14 | 10am UTC | Head Full of Dreams |

## Personalization Tokens

| Token | Source | Fallback |
|-------|--------|----------|
| `{{name}}` | Auth profile or email prefix | "there" |

---

## Email 0 — Welcome to Vibe Rise

**Send:** 30 minutes after signup

```
Wahoooo!!! Welcome {{name}}!

To get started, check out the Essence Mirror flow. In three years of running
workshops in Bali, this exercise is one of participants' favourites. It
identifies your Essence Voice, the most loving, playful, energised version of
you. The voice you embodied so effortlessly as a kid but can become dimmed as
we grow up.

It will also create a Pixar-animated version of you. Basically your very own
real life cartoon. See this as your game character.

Much Love,
Huzz
```

CTA link: [Essence Mirror](https://viberise.nichuzz.com/essence-mirror) (inline hyperlink on "Essence Mirror" in first paragraph)

---

## Email 1 — I quit my job at 26 because of a feeling

**Send:** Day 1, 10am UTC

```
Hey {{name}},

Quick backstory on why I built this.

I worked at a VC firm in Sydney for five years. Knew for the last three it
wasn't my thing. Spent $30K on 52 courses trying to figure out what was next.
None of them worked.

Not because they were bad. Because they were giving me information, and
information wasn't what I was missing.

I was missing the ability to act on what I already knew.

So I started doing one thing a week that scared me. Started posting online,
hosted a pop-up disco in public, started wearing things that felt like me.
Within four weeks I was working from Bali. Within three months I quit. Within
six months I was funding my own life doing work I actually cared about.

The information didn't change. What felt safe changed.

That's what Vibe Rise is built around. Not more information. More capacity to
act on what you already know.

Much Love,
Huzz
```

---

## Email 2 — The thing $30K of courses couldn't teach me

**Send:** Day 3, 10am UTC

```
Hey {{name}},

Here's what 52 courses and $30K taught me: knowing what to do and being able
to do it are completely different problems.

We all live inside what I think of as a safety dome. Everything inside it feels
comfortable. Everything outside it triggers something that makes us pull back.

The dome isn't set by your intelligence or your ambition. It's set by what your
body believes is safe.

In the app, the things that expand your dome are called Wahoos. They're courage
challenges tied to the stuff that actually matters to you. Not generic "cold
shower" content. Things connected to your skills, your curiosities, the life
you're trying to build.

The name comes from the sound people make after they've done the thing they
were scared of. Half relief, half disbelief. You'll know it when you feel it.

[Try your first Wahoo →](https://viberise.nichuzz.com/7-day-challenge)

Much Love,
Huzz
```

---

## Email 3 — Your Vibe Rise score

**Send:** Day 5, 10am UTC

```
Hey {{name}},

You might have noticed the Vibe Rise score in the app. Here's what it actually
tracks.

Vibe Rise = Safety × Expression

Safety is how regulated and grounded you feel. The healing work in the app
builds this. Recognising old patterns, releasing what's stuck, rewiring what
was installed that wasn't yours.

Expression is how much of the real you is showing up in the world. Wahoos build
this. Every courage challenge expands what you're willing to be seen doing.

Stalls shrink your safety. Those moments where you wanted to act but froze,
avoided, or people-pleased instead.

Drains siphon your expression. The job that hollows you out, the habits you
fall into when you're running on empty.

Then there's daily practices. Sleep, movement, connection, creative time. These
maintain your baseline capacity. When maintenance drops, no matter what other
work you're doing, everything feels harder.

The score isn't about being perfect. It's about seeing the ratio. The Tune tab
tracks all of this in about 30 seconds a day.

[Check in today →](https://viberise.nichuzz.com/7-day-challenge)

Much Love,
Huzz
```

---

## Email 4 — One week in

**Send:** Day 7, 10am UTC

```
Hey {{name}},

It's been a week. Whether you've been in the app every day or haven't opened
it since, I want to share something.

Most apps guilt you into streaks. Miss a day and the whole thing resets. That's
not how growth works.

What matters more than daily perfection is the weekly pattern. Are you
depositing more than you're draining? Are you doing things that scare you, even
occasionally? Are you noticing what lights you up?

Every Sunday or Monday, the app prompts a weekly review. Seven quick questions
about your environment, your network, your bets, your identity, your learning,
your compounding, and your attention.

Takes two minutes. Worth more than the other six days combined. Because the
weekly review isn't about what you DID. It's about what you're BECOMING.

[Do your first weekly review →](https://viberise.nichuzz.com/7-day-challenge)

Much Love,
Huzz
```

---

## Email 5 — The pattern I see in everyone who stays stuck

**Send:** Day 10, 10am UTC

```
Hey {{name}},

There's a pattern I see in almost everyone who gets excited about something
new and then quietly stops.

It's not laziness. It's not a lack of motivation.

Somewhere around day 5 to 10, a voice kicks in. It sounds like your own
thinking but it's not. It's a pattern you picked up years ago to keep yourself
safe.

For some people it sounds like "this isn't working fast enough." For others
it's "I don't want anyone to see me doing this." Or "I should focus on what
other people need from me." Or "I need to stay in control of the outcome."

These aren't flaws. They're defence strategies you built when you needed them.
But they become the ceiling on everything. Your career, your relationships,
your creativity, your willingness to take a risk.

The app has a tool called Zone Diagnosis that helps you figure out which
pattern is running the show. Takes about 5 minutes and it's uncomfortably
accurate.

[Find your pattern →](https://viberise.nichuzz.com/7-day-challenge)

Much Love,
Huzz

P.S. If you've already stopped using the app, that's probably one of these
voices at work. Not a judgement. Just worth noticing.
```

---

## Email 6 — Head Full of Dreams

**Send:** Day 14, 10am UTC

```
Hey {{name}},

Last email in this series. I want to leave you with a framework that changed
how I think about everything.

Most people who find Vibe Rise are in a place I call Head Full of Dreams. They
can see what they want. They've done the reading, the courses, the journalling.
They know themselves better than most people ever will.

But they can't move.

Self-knowledge went up. Action didn't follow. And the gap between what they
know and what they do becomes its own kind of pain.

The goal isn't more self-knowledge. It's the diagonal. Self-knowledge AND
action moving together, in proportion.

The Essence Mirror and healing work build self-knowledge. The Wahoos and daily
practices build action. The score tracks whether they're moving together.

Two weeks ago you signed up. Whatever you've done since then counts. Even
reading these emails counts. Awareness is the first deposit.

The app is here whenever you're ready to make the next one.

[Continue your journey →](https://viberise.nichuzz.com/7-day-challenge)

Much Love,
Huzz
```

---

## Implementation Notes

### Infrastructure changes needed

1. **Add `welcome` to sequence types** in `enroll-email-sequence` and `process-scheduled-emails`
2. **Extend EMAIL_SCHEDULE** to include `day_10` and `day_14`
3. **Add welcome templates** with full HTML bodies to `process-scheduled-emails`
4. **Trigger enrollment on signup** from `AuthProvider.jsx` (on first sign-in)
5. **Bridge auth users to public_leads** so the existing enrollment system works
6. **HTML email template** — styled HTML with brand purple links, Inter font

### Unsubscribe

Every email footer:
```
You're getting this because you signed up for Vibe Rise.
Unsubscribe: https://viberise.nichuzz.com/unsubscribe?email={{email}}
```
