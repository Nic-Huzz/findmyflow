# Session Handoff: Category Strategy v4 — Optimise for Gain → Design for Experience (2026-09-14)

## What was done

### Category Strategy v4 — full rewrite
File: `docs/frameworks/vibe-rise-category-strategy.md`
Commit: `16f180d5` on `main` (cherry-picked from `feat/zone-cal-event-radar`)

All 20 sections reviewed and updated for the Gain → Experience pivot:
- **Sections 1-4:** Full rewrite (category, one-sentence strategy, DAM, 3-Part POV)
- **Sections 5-20:** Language pass — swapped "comfort zone" for "experience" in strategic spots, kept comfort zone in tactical/CTA spots, added A/B test markers where both work

### Key new copy

**One-Sentence Strategy:**
> "The life you want isn't behind the next gain. It's inside the experiences you're not having. Vibe Rise shows you why and gives you a game to change it."

**Belief line:**
> "You don't tell your grandkids about your gains. You tell them about your experiences."

**DAM Statement:**
> "You think you need to gain more — more savings, more qualifications, more stability, more clarity. As if the life you want is on the other side of enough. Our entire culture runs on one equation: Struggle + Stress + Sacrifice = Success = Happy Experiences. Suffering experiences now to earn happy experiences later. The entire culture runs on an equation that says you have to be unhappy to be happy. And nobody stops to notice it's insane..."

**3-Part POV:**
- Q1: Western path (science of achievement) vs Eastern path (art of fulfillment) — both playing the gain game. Neill equation punchline.
- Q2: They're not incompatible, they're both incomplete. The guard blocks the future. "That changes everything."
- Q3: Find Your Flow. Radars, events, the game.

### Recall skill
Created: `~/.claude/skills/recall/SKILL.md`
Searches past conversation JSONL files in `~/.claude/projects/`. Future agents should never say they can't access conversation history.

### Notion session registry prompt
File: `worldtour/docs/prompts/prompt-notion-session-registry.md`
Spec for a future agent to build: auto-register every Claude Code session to a Notion database with session ID, project, topic, status. Solves the 20+ terminal problem.

### Obsidian notes created
- `Insights/2026-09-14 Experiences Lens - Events App Marriage.md` — the core insight that marries events + app
- `Concepts/The Inside-Out Revolution - Neill.md` — happiness equation (Struggle + Stress + Sacrifice = Unhappiness = Happiness)
- `Frameworks/Gain-ComfortZone-Experience Hierarchy.md` — Gain game (cultural) → Comfort zone (personal constraint) → Experience (what you're after)
- `Frameworks/Vibe Rise - Find My Flow Hierarchy.md` — Vibe Rise (state) → Experiences (vehicle) → Find My Flow (journey)

## Decisions made

1. **Old category renamed:** "Optimise for Comfort" → "Optimise for Gain." Why: Gain is what nobody else is naming. It implies scarcity + future-living. Both achievement and wellness tracks are playing the gain game.

2. **"Clarity" is a type of gain.** The clarity trap feeds the learning addiction. Another course = gain clarity. It's still the gain game. This replaced the earlier "clarity vs comfort" framing.

3. **"Aliveness" is a byproduct, not the category word.** The key words are gains + experience. Aliveness is what happens when you're having experiences you love. Don't name it — let people feel it.

4. **Category name: Find Your Flow.** "Find" = discover (not gain). "Flow" = flow state (peak experience) + finding your path + opposite of grind. Passes the "say it with pride" test.

5. **Guard language for "protective voice."** Strategy doc uses "guard" (12-year-old readable). App uses "protective voice." Same concept, different depth.

6. **Events + App marriage:** Events = taste the experience (proof). App = redesign your life around experiences (tool). This is the connective tissue.

7. **Western path vs Eastern path framing for Q1.** Science of achievement + art of fulfillment = both incomplete. Neither asks what you experience. Original insight.

8. **Neill equation adopted:** Struggle + Stress + Sacrifice = Success = Happy Experiences → Suffering Experiences = Happy Experiences. From "The Inside-Out Revolution" by Michael Neill.

9. **Bonnie Ware deathbed regret #1** added under belief line as supporting evidence.

10. **Three-selves visualization** (kid self, present, 80-year-old) documented as biographical proof of the grandkids belief line.

11. **A/B tests marked** throughout Sections 10-18 where comfort zone and experience language both work for tactical content/CTAs. Test which converts.

12. **"Where do we want to go" reframed:** Not "the career guy" — people all over the world creating crazy experiences. Career is the compound effect. Growth Game Scav Hunt cited as proof.

## In progress / next steps

- **Notion session registry** — prompt written at `worldtour/docs/prompts/prompt-notion-session-registry.md`, needs an agent to build it
- **Category name in Section 1 header** — still says "Aliveness: Gamified" as the category definition (line 14). Needs updating to reflect Find Your Flow as category name. Left unchanged because the full category structure (line 20-23) needs a rethink if category name changes from Aliveness: Gamified to Find Your Flow.
- **Events CP doc** (`worldtour/docs/content-strategy-category-pirates.md`) — has NOT been updated for the gain/experience pivot. Still uses Rebel Rave language. The rebrand prompt exists at `worldtour/docs/prompts/prompt-events-cp-rebrand-and-index.md`.
- **Huzz personal brand CP doc** — prompt exists at `worldtour/docs/prompts/prompt-huzz-brand-cp-framework.md`, not yet written. Should now use the gain/experience framing.
- **Content from the frameworks** — Neill equation, Gain hierarchy, Western/Eastern paths are all carousel/reel-ready. None created yet.

## Gotchas discovered

- **Crashed session recovery works.** Session JSONL files at `~/.claude/projects/` are searchable. The `/recall` skill documents how. Session `07c1070e` was the crashed session from the previous conversation.
- **"Comfort zone" isn't wrong — it's the mechanism.** The hierarchy is: Gain game (cultural) → Comfort zone (personal constraint) → Experience (what you're after). Don't eliminate comfort zone language — it's what people understand. Use it for tactical CTAs, use experience for strategic/vision.
- **The doc still has "Aliveness: Gamified" as the category definition** even though we decided on Find Your Flow. This needs a deliberate rewrite of the category structure, not just a find-replace.

## Recommendations

1. **Build the Notion session registry** — the 20+ terminal problem is real and the prompt is ready. High-impact quality-of-life improvement.
2. **Create content from today's frameworks** — the Neill equation carousel, the Western/Eastern paths reel, the grandkids belief line — these are ready to produce. Use the content-council skill.
3. **Update Section 1 category definition** — deliberate session to restructure the category from "Aliveness: Gamified" to "Find Your Flow" with the Vibe Rise → Experiences → Find My Flow hierarchy.
4. **Update events CP doc** — the gain/experience pivot should flow through to the events strategy. Use the existing rebrand prompt as starting point.
