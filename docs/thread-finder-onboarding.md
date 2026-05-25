# Thread Finder — Onboarding & Dot Collection

*How to get someone's vault filled enough to run the Thread Finder analysis.*

---

## The Problem

Most people don't have 139 linked notes. Their dots are scattered across apps, conversations, saved posts, and memories. They need a fast way to collect enough dots for Thread Finder to work.

## Two Paths

### Path 1: FindMyFlow IS the dot-tracker (no Obsidian needed)

The app already collects dots through normal usage:
- **Life Map** → 15 sticky notes across 5 life periods (skills, problems, personas)
- **Play Profile** → games, sliders, archetype, stuck point
- **7-day challenge quests** → daily reflections, scary/wahoo scores, voice check-ins
- **Flow Compass** → energy states over time
- **Essence Mirror** → wound, superpower, protective pattern

After ~2 weeks of usage, there's enough data to run Thread Finder on Supabase rows alone. Build a "Connect My Dots" feature that unlocks after threshold (Life Map + Play Profile + 7 quest completions).

### Path 2: Fast-fill for people who want a vault

For experience creators in the OS who DO want deeper tracking:

| Input | Time | What it captures | How |
|-------|------|-----------------|-----|
| **Dot Dump** (guided voice/text) | 20 min | Life story, interests, frustrations, heroes | AI asks 10 questions, structures answers into notes |
| **Import conversations** | 5 min | What they've been thinking about | Pull from ChatGPT/Claude history, extract themes |
| **Book highlights** | 5 min | What ideas resonate | Readwise/Kindle export, AI clusters into concepts |
| **Social saves** | 5 min | What they're unconsciously drawn to | Instagram saved posts, Twitter bookmarks, YouTube watch later |
| **Browser bookmarks** | 2 min | Repeated curiosities | Export + AI categorize |
| **Photo library themes** | 10 min | What they document | AI tag last 100 photos for recurring subjects |

Fastest path: **Dot Dump + Life Map + Play Profile = enough for Thread Finder in under an hour.**

---

## The Dot Dump — 10 Questions

A guided conversation (in-app or standalone) that extracts dots and auto-generates structured notes:

1. What were you obsessed with as a kid? (3 things)
2. What makes you angry about how the world works? (3 things)
3. What do people come to you for without you advertising it?
4. What have you spent money learning that wasn't for work?
5. Who do you follow that has nothing to do with your job?
6. What's a problem you've solved for yourself that others still struggle with?
7. What do you do that feels like play but others call work?
8. Who do you want to help but can't explain why?
9. What's a topic you can talk about for an hour without getting bored?
10. What's something you believe that most people in your field would disagree with?

These 10 answers, structured into skill/problem/persona notes with wikilinks, give Thread Finder enough to work with. Then ongoing capture (quests, flow compass, journal) adds depth over time.

---

## Claude Code Prompt (for people with existing vaults)

Give this to anyone with an Obsidian vault. They paste it into Claude Code and update the vault path.

```
I want you to be my Thread Finder. Analyse my Obsidian vault and surface the hidden patterns I can't see myself.

My vault is at: [PASTE YOUR VAULT PATH HERE]

Steve Jobs said you can't connect the dots looking forward, only looking back. I want you to connect my dots. Read everything in my vault — every folder, every note — and tell me what threads keep appearing that I haven't named yet.

**Step 1: Read the vault**
- Start with any MOC, index, or _context files
- List every file in every folder
- Read as many notes as you can, especially ones with interesting or unexpected titles
- Look at wikilinks to understand what connects to what

**Step 2: Find my recurring dots**
Look for topics, ideas, people, problems, or skills that keep showing up across multiple unrelated notes. A "dot" is something that appears in 3+ different contexts. List each dot with which files it appears in.

**Step 3: Cluster the dots into three categories**
- **Problems I keep circling back to** — What frustrates me? What do I keep noticing is broken? What wounds keep appearing?
- **People I'm drawn to** — What types of people keep appearing as my audience, inspiration, or tribe? Who do I want to help?
- **Skills I keep exercising** — What capabilities do I keep using even when nobody asks? What comes naturally?

**Step 4: Find the hidden threads**
This is the most important step. A thread is a non-obvious connection between seemingly unrelated dots.

Example: Someone has notes on breathwork, dance, limiting beliefs, and self-knowledge. Separately, these look like scattered interests. But the thread is that each one maps to a stage in the healing journey (Recognise, Release, Rewire, Reconnect), and the connection is "Healing" — which, combined with their love of fun, becomes "Healing But Fun."

Look for:
- Interests that seem unrelated but share a deeper connection I haven't named
- A pattern in the TYPES of problems I notice (what do they have in common?)
- A pattern in the TYPES of people I'm drawn to (what wound or aspiration do they share?)
- A meta-skill that appears inside multiple different skills (e.g., "translation" appearing inside teaching, storytelling, designing, and coaching)
- Contradictions or tensions where I seem pulled in two directions (these often reveal the most interesting threads)

**Step 5: Tell me my Movement, Product, and Niche**

Based on the threads, tell me:

- **Movement**: What paradigm am I challenging? What do I believe that most people in my space don't? (One sentence, stated as a bold claim)
- **Product**: What am I actually building, underneath all the surface-level projects? (One sentence, framed as what it does for people)
- **Niche**: Who specifically am I for? Describe them by their wound, their aspiration, and the gap between where they are and where they want to be. (One sentence)

**Step 6: Show me the tensions**
Where am I pulled in two directions? These aren't problems to solve — they're creative edges where my most interesting work lives. Name 3-5 tensions with evidence from the vault.

**Format your response as:**
1. A summary of what the vault contains (size, structure, themes)
2. The recurring dots (with file references)
3. Problem clusters, People clusters, Skill clusters
4. Hidden threads (the non-obvious connections — spend the most time here)
5. Movement / Product / Niche (one sentence each)
6. Tensions
7. One synthesizing paragraph that connects everything

Be specific. Quote my own words back to me. Reference actual file names. Don't give me generic coaching language — give me the pattern I'm living but haven't articulated.
```

---

## Bonus: Cross-reference with app data

Add this if they have FindMyFlow or another app with data:

```
**Bonus: Cross-reference with my app data**

I also have data in [APP/DATABASE]. Please pull:
- Any self-assessments or quiz results
- Journal entries or reflections
- Goals, challenges, or tasks I've completed
- Energy/mood tracking data

Cross-reference the app data with the vault. The vault shows what I THINK about. The app data shows what I DO. Where do they align? Where do they diverge? The gap between thinking and doing often reveals the most important thread.
```

## Bonus: Email Thread Finder

```
**Bonus: Email Thread Finder**

Search my email for the last 6 months. Look for:
- Topics I email about most frequently
- Types of people I correspond with
- Recurring asks (what do people come to me for?)
- Patterns in what I forward, save, or reply to quickly vs. ignore

The inbox is an involuntary dot-tracker. It shows what the world thinks you're for, which may differ from what you think you're for.
```

---

## Key Insight

Three data sources reveal different things:

| Source | What it reveals |
|--------|----------------|
| **Vault / notes** | What you THINK about |
| **App data / actions** | What you DO |
| **Email / DMs** | What the WORLD thinks you're for |

The gaps between those three are where the real threads hide.

---

## Product Integration Ideas

1. **"Connect My Dots"** — unlocks in app after threshold data is collected. Runs Thread Finder on Supabase data. Output: movement/product/niche + hidden threads.
2. **Scope Map enhancement** — Thread Finder output informs Scope Map placement + first workshop topic recommendation.
3. **Onboarding Dot Dump** — 10-question flow as part of Experience Creator OS onboarding. Generates their initial vault or app profile.
4. **Weekly dot capture** — low-friction habit inside Tune tab or weekly reflection. "What surprised you this week?" builds the dataset over time.
5. **Thread Finder as a service** — premium offering in the OS. Run quarterly. "Here's what's changed in your patterns since last time."
