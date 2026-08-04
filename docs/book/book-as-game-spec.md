# Find Your Flow — Book as Game Spec

**The book is the tutorial. The app is the game. Your life is the playthrough.**

Status: committed direction (2026-07-28)

---

## Core Principles

1. **The voice stays 1am Huzz.** Game structure is scaffolding, not language. Nic never says "level up" or "you've unlocked." The game is felt, not narrated.
2. **Explicit game elements at chapter ends.** Power-ups and app milestones are visible sections at the end of each chapter. Can be made implicit in editing if they feel heavy.
3. **The book stands alone.** A reader who never downloads the app gets the full story, all the vocabulary, and a complete emotional arc. The app is the expansion pack, not a paywall.
4. **Challenges are app milestones, not homework.** The book doesn't invent standalone prompts. Each chapter's "next step" IS the matching app milestone. The reader's life becomes the game.

---

## Structure: 3 Worlds x 12 Hero Stages

| World | Hero Stages | Name | Game Phase | Reader Moves From → To |
|---|---|---|---|---|
| **World 1** | 1-6 | **The Crack** | Tutorial | (0,0) Unfulfilment → (3,0) Self-knowledge growing, no action |
| **World 2** | 7-9 | **The Flood** | Training | (3,0) → (7,1) Head Full of Dreams. High knowledge, paralysed. |
| **World 3** | 10-12 | **The Diagonal** | The Game | (7,1) → (8,7) Approaching the diagonal. Moving. |

The reader's position on the Sprouter Sweet Spot graph (Action x Self-Knowledge) shifts across the book. Part 1 moves them RIGHT (gaining self-knowledge). Part 2 stalls them in the top-left (knowing but stuck). Part 3 moves them UP (adding action). By the end they're on the diagonal.

---

## Per-Chapter Game Elements

Each chapter has its existing 4-beat skeleton (Scene, Tension, Turn, Land) PLUS these elements at the end:

### 1. Objective
One sentence: what this chapter DOES to the reader (not what happens in the story).
Source: "Job" column from chapter-map-hero-journey.md.

### 2. Screenshot Line
The one line worth screenshotting. The brick. Already exists for most chapters.

### 3. Power-Up
A word, framework, or vocabulary the reader didn't have before. After this chapter, they can NAME something they previously couldn't.

Rules:
- Not every chapter introduces a new power-up. Some chapters APPLY a previous one to a new context. Mark as "Uses: [power-up from Ch X]."
- Power-ups accumulate. When writing Ch 38, the reader already has Essence, The 3-Box Model, The Four Protectors. Reference freely.
- The full inventory is the reader's toolkit by Ch 80.

### 4. App Milestone
The matching action in Vibe Rise. Explicit link: "In Vibe Rise, this is where you [do X]." Can be softened to implicit in editing.

Rules:
- Not every chapter has an app milestone. Only key threshold chapters.
- Milestones match the hero stage graduation triggers in the app.
- Non-milestone chapters say "No milestone — keep reading."

### 5. Boss Check
Which protective archetype shows up at this stage. What it says. Why now.
- Some chapters are "Safe zone — no boss active." The absence is meaningful.
- Boss encounters escalate: Part 1 introduces them, Part 2 they hijack the healing, Part 3 you face them directly.

### 6. Map Position
Where the reader sits on the Sprouter Sweet Spot graph after this chapter.
- Described directionally (e.g. "deep in Head Full of Dreams", "approaching the diagonal"), not as numeric coordinates.
- Shown visually with images in the book — show, not tell.
- Tracks visible progress across the book.

---

## Chapter-to-App Milestone Mapping

### Hero Stage Graduations (from heroStageChecker.js)

| Book Chapters | Story Moment | App Milestone | Hero Stage Graduation | What the Reader Does |
|---|---|---|---|---|
| **Ch 0-4** | The earthquake, the questions | First nervous system check-in | → Stage 2: Call to Adventure | Check in with how your body actually feels right now |
| **Ch 5-13** | The kid, the installation, the wound | Life Paths exercise | → Stage 3: Refusal of the Call | Map out the careers/life paths you're drawn to and rate how each one feels in your body |
| **Ch 14-22b** | The protectors, Errol, the reframe | Essence Mirror + Hero Avatar | → Stage 4: Meeting the Mentor | Discover your essence archetype and generate your hero avatar |
| **Ch 38-50** | Two voices, the 4Rs, the river | 5+ protective voice identifications | → Stage 7: Approach to the Inmost Cave | Start naming which protector shows up in each area of your life |
| **Ch 51-58** | The gap, one scary thing a week | First courage challenge classified "Vibe Rise" | → Stage 5: Crossing the Threshold | Do one thing that terrifies you AND excites you. Log it. |
| **Ch 59-72** | The proof, the identity flip | Active life path at Vibe Rise + L3/L4 depth | → Stage 6: Tests, Allies, Enemies | Keep going. The compound curve is working. |

Note: Stage 5 (Crossing the Threshold) fires AFTER Stage 7 (Inmost Cave) in the book's chronology because in Nic's story, he understood the protectors before he took action. The app milestone triggers match the READER's likely order: they'll do check-ins and Essence Mirror before courage challenges. But the book's narrative order has self-knowledge (Part 2) before action (Part 3).

### Non-Graduation Milestones (chapter-level)

These aren't hero stage graduations but are meaningful app moments that match chapter content:

| Chapter | Power-Up | App Mirror |
|---|---|---|
| Ch 6: Essence | Essence defined | Essence Mirror flow available |
| Ch 20: The One Sentence | "I am [essence]. [Event] installed [protection]." | Identity Statement in Courage tab |
| Ch 37: The Intersection | Skills x Problems x People | Life Map cluster view on Mirror page |
| Ch 44-47: The 4Rs | Recognise → Reconnect → Release → Rewire | Healing Flow (7-step) on courage tasks |
| Ch 53: One Scary Thing | The Groan Challenge | WahooCreator + courage challenges |
| Ch 54: The Essence Test | Scared x Excited grid | Quest creation predicted_state picker |
| Ch 65: Five Layers | Screen → Live → Money → Vulnerable → Authority | Wahoo Map visibility layers |
| Ch 71: 3% Better | Compound courage | Quest progress + trend emoji row |
| Ch 72: The Proof | Evidence wall | Mirror page: skill tree + behavioral evidence |
| Ch 74: The Diagonal | Action proportional to self-knowledge | Zone Matrix on Quests tab (Action Score x Clarity) |
| NEW: Ease & Resistance | Follow ease, redirect at resistance | (Chapter to be written — its own chapter) |

---

## Power-Up Inventory (Complete Draft)

The vocabulary toolkit the reader accumulates across the book.

| Ch | Power-Up | What It Gives the Reader | Type |
|---|---|---|---|
| 0/2 | **The Crack** | A word for the moment the constructed life stopped working | Framework |
| 5 | **You as a Kid** | Permission to remember who they were as a kid | Permission |
| 6 | **Essence** | Who you were before the world edited you | Vocabulary |
| 7 | **Direction** | Where essence naturally goes (skills x problems x people) | Framework |
| 8 | **Emotional Splinters** | Small moments that installed fear of being yourself | Vocabulary |
| 9 | **Seen and Safe** | The two needs. Which one was missing? | Diagnostic |
| 13 | **The 3-Box Model** | Essence buried, direction hijacked, protection installed | Framework |
| 14 | **The Four Protectors** | Controller, Ghost, Perfectionist, Auto-Pilot (+ People Pleaser mask) | Cast of characters |
| 15 | **The Bodyguard** | The protector isn't the enemy. It's a bodyguard who doesn't know the war is over. | Reframe |
| 19 | **Software, Not Identity** | It's code, not you. Code can be rewritten. | Reframe |
| 20 | **The One Sentence** | "I am [essence]. [What happened] installed [protection]." | Tool |
| 21 | **Buried, Not Broken** | The essence is still there. Buried things can be excavated. | Permission |
| 25 | **Head Full of Dreams** | High self-knowledge, zero action. The paralysis zone. | Vocabulary |
| 26 | **The Belief Graph** | Belief x Capability. Three zones: hubris, diagonal, limiting belief. | Framework |
| 30 | **Never Been Tested** | 20 years of assumption. Zero tests. That's software, not conviction. | Reframe |
| 38 | **The Two Voices** | Essence vs protection. Learning to tell the difference is the entire game. | Framework |
| 39 | **The Essence Signal** | "This scares me AND excites me." Both high = essence. | Diagnostic |
| 44 | **Recognise** | See the pattern. Journal after a trigger. | 4R Ability 1 |
| 45 | **Reconnect** | Open the file in edit mode. Feel it, don't think it. | 4R Ability 2 |
| 46 | **Release** | The body completes what the mind couldn't. 90 seconds. | 4R Ability 3 |
| 47 | **Rewire** | Do the thing while the file is open. Mismatch. Rewrite. | 4R Ability 4 |
| 48 | **Healing Analogy** | Spring, riverbed, current, ocean. Find the first blockage. | Diagnostic |
| 53 | **The Groan Challenge** | One scary thing a week. The body learns safety through surviving. | Mechanism |
| 54 | **The Essence Test** | Scared (1-10) x Excited (1-10). Both high = move. | Tool |
| 61 | **The Identity Flip** | NOT doing the scary thing now feels worse than doing it. | Milestone |
| 62 | **The Dome** | You fall to the level of what feels safe. The ceiling is your dome, not your dreams. | Framework |
| 65 | **The Five Layers** | Screen → Live → Money → Vulnerable → Authority. Find your layer. | Framework |
| 71 | **3% Better** | Compound courage. Each one slightly scarier than the last. | Mechanism |
| 72 | **The Proof** | Evidence wall. Screenshots, sentences, moments. Your NS needs proof. | Tool |
| 74 | **The Diagonal** | Action proportional to self-knowledge. Not a location. An operating system. | Framework |
| 75 | **Volume, Not Silence** | You can't silence the protector. Make essence louder. That's the whole game. | Reframe |
| NEW | **Ease & Resistance** | Follow ease, redirect at resistance. The universe's language. | Framework |
| NEW | **Surface Area for Magic** | Expand the possibility space for life to surprise you. | Framework |

**Total: ~30 power-ups across 80 chapters.** Average: one new power-up every 2-3 chapters. Some chapters apply existing power-ups to new contexts.

---

## Boss Encounter Design

Each protector has a 3-act arc across the book. But which protector shows up WHERE is personal — different readers have different bosses at different layers. The book tells Nic's version. The reader maps their own.

**The 3-act arc** (applies to ALL protectors):
1. **Part 1: Introduction** — the reader meets the protector and learns its name (Ch 14-18b)
2. **Part 2: Hijack** — the protector disguises itself as healing/growth (Ch 41-43)
3. **Part 3: Direct encounter** — the reader faces their protector through action (Ch 53+)

**Nic's bosses** (his personal mapping, told through the story):

| Protector | His Part 1 scene | His Part 2 hijack | His Part 3 encounter |
|---|---|---|---|
| **Controller** | Ch 16: 5 years at Investible, stopping felt like dying | Ch 41: healing spreadsheet, performing healing now | Ch 62-63: dome expansion requires releasing control |
| **Ghost** | Ch 17: left engagement parties early, 6 weeks without friends | Ch 42: 14 books read, none shared | Ch 53-58: one scary thing a week = anti-Ghost medicine |
| **Perfectionist** | Ch 18: gas and brake at the same time | Ch 43: "not healing, hiding" | Ch 59-60: magic show with 3 YouTube tricks, stand-up from phone notes |
| **Auto-Pilot** | Ch 18b: lockdown, nobody home | Ch 25: Head Full of Dreams, going through motions | Ch 61: identity flip breaks the auto-pilot loop |
| **People Pleaser** | Ch 14-15: the mask layered on all four | Ch 38: choosing the aux cord song for others | Ch 69: being loved for the real you |

**The reader's bosses**: Different. The five visibility layers (Ch 65-70) are five escalating arenas. Which protector shows up at each layer depends on the reader's own installation, not a fixed mapping. The book shows Nic's. The app helps you find yours.

---

## The Bridge to the App

### In-Chapter (Explicit, Start)
Each milestone chapter ends with a short section:

> **In Vibe Rise**: This is where you [do the Essence Mirror / log your first courage challenge / etc.]. The story you just read is the tutorial. The game is real.

### End of Book (Ch 80 or Epilogue)
One page. Not a sales pitch. A reveal:

> Every framework in this book exists in a game called Vibe Rise. The power-ups you collected while reading — the Essence, the Protectors, the Dome, the Five Layers — they're all in there. The milestones you read about are milestones you can actually hit.
>
> The book was the tutorial.
> The app is the game.
> Your life is the playthrough.
>
> [QR code / link]

### What the App Shows a Book Reader
When a user who came from the book opens the app, they should recognise everything:
- The hero stages match the book's arc
- The Essence Mirror is the exercise from Ch 6
- The courage challenges are the Groan Challenge from Ch 53
- The zone matrix IS the Sprouter Sweet Spot from the book
- The healing flow IS the 4Rs from Ch 44-47

The book-to-app bridge should feel like "oh, this is the same thing" not "oh, they're selling me something."

---

## Chapter Format

### How Game Elements Appear in the Book

Game elements are **dissolved into the prose**, not bolted on as labelled sections. The chapter reads as a story. The power-up, boss, and map movement are INSIDE the narrative. The reader absorbs them without seeing labels.

**What's visible to the reader:**
- The story (prose, 1am Huzz voice, 4-beat skeleton woven in naturally)
- The screenshot line (last line of the chapter, set apart)
- The app bridge (one italic sentence after a page break, milestone chapters only)

**What's invisible (writing tools for us):**
- Power-up name and definition (guides what vocabulary the chapter must deliver)
- Boss check (guides which protective voice appears in the prose)
- Map position (guides the emotional register and what the reader should feel)
- Objective / job (guides the chapter's purpose)

### Format Template

```
[Chapter title]

[Prose — story in Huzz's voice. 4-beat skeleton (Scene, Tension, Turn, Land) woven 
naturally, not labelled. Power-up vocabulary introduced within the narrative. Boss voice 
appears as Nic's inner dialogue. No sections, no bullet points. Reads like a book.]

[Screenshot line — standalone, set apart by whitespace or a period on its own line]

.

*In Vibe Rise, this is where you [one sentence app milestone].*
```

### Example: Chapter 53 (Draft)

Three of us. A group chat. One rule: one thing per week that terrifies you.

I didn't know what the challenges would look like going in. I just knew I'd been stuck for three years. I'd read every book. Done every course. Spent thirty thousand dollars on fifty-two different programs. I could describe my essence in detail. Name my wound. Articulate my mission. And my body wouldn't move.

The bottleneck was never knowledge. It was never discipline. It was safety.

Week one, I filmed a video of my face talking to camera and posted it on my Instagram story. That terrified me. Week two, I uploaded a video of my morning dance. Week three, I walked into a restaurant and did magic tricks for strangers eating dinner. Week four, I took the headsets down to Bondi Beach after our Saturday breathwork group and just started dancing.

And then it escalated.

Week five, I booked a flight to Bali. Week eight, I was living there. Week twelve, I'd quit my job. Week seventeen, I was funding my life hosting silent discos on beaches and accepting donations.

I didn't plan any of it. Each week I just asked: what's the thing that makes me want to throw up AND laugh at the same time? And then I did that thing.

The voice in my head was screaming. Not yet. Not ready. Maybe next week. Let me do a bit more research first. Every sentence was some version of don't move. I'd been listening to that voice for three years. It sounded like wisdom. It sounded like caution. It wasn't. It was the Ghost. And the Ghost's only job is to keep you invisible.

What I learned is the body doesn't build safety from understanding. It builds safety from surviving. Each scary thing is a piece of evidence your nervous system files away: that was survivable. Do enough of them and something shifts. The ceiling lifts. The dome expands. Things that terrified you in January bore you by June.

I started calling it the groan challenge. That sound you make when someone suggests the thing you know you need to do. Ughhh. That groan is the signal. Not the stop sign. The signal.

By week five I was living in Bali. By month three I had quit my job.

.

*In Vibe Rise, this is where you create your first courage challenge.*

### Writing Notes for This Example
- **Power-up delivered**: "The Groan Challenge" — introduced through the story, not a sidebar
- **Boss encountered**: The Ghost — appears as Nic's inner dialogue ("Not yet. Not ready.")
- **Map movement**: Reader moves from (7,1) to (7,3) — action begins
- **App milestone**: First courage challenge → Stage 5: Crossing the Threshold
- **Voice**: 23-year-old Nic for the scene/timeline, 29-year-old Nic for the "what I learned" turn. Not perfect yet — needs more raw voice note material to replace the "what I learned" section with lived experience.

### What's Not Perfect Yet
- The "what I learned" paragraph (body builds safety from surviving) is 29yo narrator explaining. Could be stronger as a SCENE: the moment he realised this, not the explanation. Needs a voice note recording of him re-living the specific moment the dome expanded.
- The Ghost dialogue could be more specific to HIS Ghost, not generic. What did his Ghost actually say? Need voice material.
- The prose is a draft. It passes the 1am test about 70%. Needs recording + editing pass.

---

## Open Decisions

1. ~~**4Rs chapter order**~~: RESOLVED. Canonical order is Recognise → Reconnect → Release → Rewire. Book deck is already correct.
2. **Ease & Resistance**: Confirmed as its own chapter. Central theme, introduced early in the book (Part 1, likely Stage 1 or 2). Needs drafting.
3. **New Orleans beanbag**: Mapped to Ch 21 (The Essence Is Still There). Scene needs writing.
4. **Stage 5 before Stage 7 in app**: The app fires "Crossing the Threshold" (first courage challenge) as Stage 5, but in the book this happens in Part 3 (after the reader has done Stage 7 work in Part 2). The book's narrative order is fine — it matches Nic's actual story. The app milestone order will differ from reading order for book readers.
5. **Power-up format**: Currently planned as explicit sections at chapter ends. Review in editing whether to integrate into prose or keep as sidebars.
