---
title: "The 12 Things I Learned Building Apps With AI (That Nobody Told Me)"
project: "findmyflow"
audience: "external"
---

# The 12 Things I Learned Building Apps With AI (That Nobody Told Me)

*A weekly letter from someone building in the trenches — not theorising from the sidelines.*

---

I've built 6 apps in 6 weeks using AI. Not toy apps — real products with auth, databases, CRM systems, gamification engines, and actual users. Along the way I broke everything, fixed everything, and started writing it all down.

Here's what actually works. No fluff, no "10x your productivity" garbage. Just hard-won tricks from someone who's been doing this every single day.

---

## 1. Your AI Needs a Map, Not a Pep Talk

I wrote a 350-line file called `CLAUDE.md` that lives in my project root. Not a vibe document — a *map*. Folder structure with annotations. Every route listed. Key features explained. Database schema. What's built vs what's planned.

The result? Claude never asks "wait, where does this live?" It just... knows. First session, zero ramp-up. Like handing a new hire the most detailed onboarding doc in existence.

**The move:** Write a CLAUDE.md for your project today. 30 minutes of documentation saves 20 minutes of explaining *per session*. The math is embarrassingly obvious once you do it.

---

## 2. Give Your AI a Personality (Seriously)

I have a file called `SOUL.md`. It defines how my AI thinks, what it watches for, what kind of energy it brings. Direct but warm. Calls out avoidance. Accountability-partner energy.

Sounds ridiculous until your AI starts writing copy that actually sounds like your brand instead of a LinkedIn post from 2019.

I also have `TASTE.md` — design preferences, color philosophy, typography rules, off-limits words. And `USER.md` — who I am, what I care about, my blind spots.

Three files. AI goes from "helpful assistant" to "someone who gets it."

---

## 3. The Table of Shame Changed Everything

In my repo there's a `NEW_PROJECT_GUIDE.md` that opens with this:

| Issue | What Happened | Lines Wasted |
|-------|---------------|--------------|
| Duplicate Cards | Same pattern copy-pasted 6+ times | ~180 |
| Duplicate Buttons | 40+ buttons with inline styles | ~200 |
| Giant Components | Dashboard.jsx hit 358 lines | Hours |

**400+ lines of wasted code.** Because I didn't create shared components first.

Now my AI reads this file before every project. It builds `Button.jsx`, `Card.jsx`, `Modal.jsx` on Day 1 — *before* touching a single screen. My past pain became permanent guardrails.

---

## 4. The 150-Line Rule

If a component exceeds 150 lines: stop. Split it. No exceptions.

I learned this after letting Dashboard.jsx balloon to 358 lines. Unreadable. Undebugable. AI couldn't hold it all in context and started contradicting itself.

Now it's in the instructions. Components stay focused. Debugging stays sane. This one rule improved my code quality more than any prompt engineering trick.

---

## 5. The 40-Question Spec Kills Guessing Dead

My biggest early mistake: "Build me an app based on Naval's Almanack."

What AI built: dark theme (wrong), 8 arbitrary practices (made up), "Three Pillars" (doesn't exist in the book). 100% guesswork, 100% wrong.

Now I use a 40-question spec. Not boring project-manager questions — provocative ones:
- *"What should someone FEEL the first time they open it?"* (3 adjectives)
- *"If your app were a person at a party, how would they talk?"*
- *"What words are OFF-LIMITS?"*

My AI research agent fills 28 of 40 from the source material. I answer 12 in five minutes. Result? The v2 build was *dramatically* better. Same AI, same model, same everything — better spec.

---

## 6. I Went From 8 Agents to 4 (And It Got Better)

Original plan: 8 specialised AI agents running a full dev pipeline. Sounded like a sci-fi movie.

Reality: the planning agent spent 26 seconds generating task lists I already had. The formatter added no value. Half the agents were overhead disguised as sophistication.

Killed them. Kept four: orchestrator, researcher, builder, reviewer. Output improved immediately.

**The uncomfortable truth:** Adding agents feels productive. Removing agents *is* productive.

---

## 7. AI Reviewing AI Is Underrated

The game-changer was adding a review step. After every build, before I see anything:
- Screenshot every page at mobile viewport
- Critique UX, visual hierarchy, copy, empty states
- Check against the design spec
- Return a prioritised top-5 fix list

AI catches the same things humans catch — "this feels empty," "where do I click?" — but instantly. I implement the fixes before I ever look at the app. The quality jump is massive.

---

## 8. Don't Pick Colors. Derive Them.

For an Inside-Out Revolution app: gold = sun behind clouds (innate well-being). Cream = spacious empty mind. Sky blue = consciousness.

For Naval: deep navy = ocean depth. Warm amber = warmth of wisdom.

I tell the AI: "derive the palette from metaphors in the source material." Every color has a *reason*. Nothing is arbitrary. Users feel it even if they can't explain it.

---

## 9. Co-Author Your Commits

Every AI-assisted commit in my projects:
```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Not for anyone else. For me. It creates a searchable history — when something breaks, I can audit exactly which AI-generated code to look at. Transparency with yourself beats performance for others.

---

## 10. Security Is Not a Vibe

One of my actual commit messages: *"Fix crash bugs, XSS vulnerability, auth race condition, and data loss risk."*

AI built fast, shipped features, and left security holes everywhere. Now my guide file has explicit rules:
- Zod validation at every database boundary
- DOMPurify on all markdown output
- Auth via `onAuthStateChange` with `INITIAL_SESSION` (not `getSession()` — race condition)
- `beforeunload` listeners for reliable saves

**Don't assume AI thinks about security.** It doesn't. Write a Security Rules section. Be specific.

---

## 11. 17.8MB → 3.6MB in One Command

I had my AI batch-convert all images to WebP format. Same quality, 80% smaller. Fifteen seconds of work. Five-second page loads became instant.

Obvious? Sure. But I didn't do it for three months because it felt like a "later" task. It's never a "later" task. Do it now.

---

## 12. The Memory System That Actually Compounds

AI forgets everything between sessions. My fix:

- **Daily logs** (`memory/2026-02-12.md`) — raw notes, what happened
- **Long-term memory** (`MEMORY.md`) — curated wisdom, distilled insights
- **Lessons learned** (`lessons-learned.md`) — every bug, every fix, forever

Every few days I review daily files and promote the good stuff. Like a human reviewing their journal.

The tenth app is dramatically better than the first. Not because I got smarter — because the *system* got smarter.

---

## The Meta-Lesson

Every trick above boils down to one thing: **context beats cleverness**.

A 350-line CLAUDE.md isn't bureaucracy. It's leverage. A personality file isn't cosplay. It's consistency. A lessons-learned file isn't busywork. It's compound interest.

The best AI coders aren't prompt wizards. They're the people who figured out that boring documentation is the highest-ROI activity in AI-assisted development.

Write it down. Load it up. Let it compound.

---

*What tricks have you learned? Hit reply — best ones go in the next issue.*

*— Huzz, building from Bali 🌴*
