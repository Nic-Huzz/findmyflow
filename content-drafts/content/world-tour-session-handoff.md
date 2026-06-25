# World Tour Content Pipeline — Session Handoff

Date: 2026-06-01 to 2026-06-15
Status: Draft complete, data verified, tooling researched. Ready to produce.

---

## What this session accomplished

1. Drafted the first World Tour newsletter post (Radha Agrawal)
2. Designed a 3-format content pipeline (blog → carousel → AI video)
3. Fact-checked all Radha data against external sources
4. Researched and recommended AI video generation tools
5. Saved the format strategy to Obsidian brain

---

## The 3-Format Pipeline

Each creator profile produces 3 formats from one research session:

```
Research session (pull DNA + offer map data)
    ↓
Blog / newsletter post (Substack) — the source of truth
    ↓
Carousel (Instagram) — compress to 8 beats
    ↓
Video short (TikTok/Reels) — carousel beats + AI scenes + voiceover
    ↓
Video essay (YouTube) — full blog + AI b-roll
    ↓
LinkedIn text post — Compounding Move section adapted
```

One session → 7-8 pieces across 5 platforms. 32 creators × 4 clips = ~128 short-form pieces.

---

## Newsletter Template (5 sections, identical every post)

| Section | Question it answers | Data source |
|---|---|---|
| **1. The Wedge** | What did they notice nobody else did? | `blowUpContext` + `experienceEvolution[0]` |
| **2. The Brand Engine** | How did they become known? | `blowUpPatterns` + `blowUpType` |
| **3. The Money Engine** | How do they actually make money? | `experienceCreatorOfferMap.json` (attraction/core/scale/continuity) |
| **4. The Compounding Move** | The one decision that turned it into an empire | `blowUpMoment` + `blowUpYear` |
| **5. If This Is You** | DNA signature + who resonates + CTA | DNA sliders + matcher at `/experience-creators` |

**Universal closer (identical every post):**
> Curious if you're a [Creator Name]? Take the 2-min match → findmyflow.com/experience-creators

**Design rule:** Every post must be useful even if you don't match the featured creator. The pattern teaches something universal; the matcher is the bonus.

---

## Carousel Template (8-10 slides)

| Slide | Beat | Why |
|---|---|---|
| 1 | Hook headline | Pattern interrupt, not "5 lessons from..." |
| 2 | The problem they noticed | Relatable pain |
| 3 | The flip / invention | The "wait, what?" moment |
| 4 | The proof (early traction) | Social proof as stat card |
| 5 | Money Engine diagram (4 layers) | The screenshot/save slide |
| 6 | The Compounding Move | One insight, big font |
| 7 | "Are you a [Creator]?" checklist | Self-identification is addictive |
| 8 | CTA to matcher | Clean, one action |

Visual brand: Pixar 3D style, purple (#5e17eb) → gold (#E9A23B) gradient.

---

## Content Calendar (Option C Hybrid — approved)

| Week | Post | Type | Engine taught |
|---|---|---|---|
| 1 | Radha Agrawal: "She killed the nightclub and invented something that couldn't be named" | Creator profile | Category Creation |
| 2 | "We analysed 32 experience creators. 75% blew up the same way." | Meta-pattern | Framework intro |
| 3 | Jay Shetty: "300 million views from a monk who couldn't get a job" | Creator profile | Content Vehicle |
| 4 | Eckhart Tolle: "Oprah didn't discover him. His book sat on a shelf for 5 years." | Creator profile | Bridge Person + Portable |
| 5 | "The 4 engines of blow-up (and how to find yours)" | Meta-pattern | Full framework reveal + diagnostic CTA |
| 6 | Priya Parker: "She brought war-zone facilitation to corporate meetings" | Creator profile | Making It Portable |
| 7 | "It takes 16 years. Except when it takes zero." | Meta-pattern | Timing stats + Category Creation recipe |
| 8 | Wim Hof: "A freak show performer who got scientists to prove he was right" | Creator profile | Portable (scientific validation) |
| 9 | Gabor Mate: "44 years of practice. 2 million views in 6 days." | Creator profile | Content Vehicle (documentary) |
| 10 | "5 of 7 creators Oprah amplified had written a book first" | Meta-pattern | Portable → Bridge sequence |
| 11 | Gabrielle Roth: "245 teachers carry her method. She's been dead for 12 years." | Creator profile | Portable (certification, legacy) |
| 12 | "What platforms reward in 2026 (and what that means for you)" | Meta-pattern | Platform timing |

---

## Radha Agrawal Draft (Post #1) — READY WITH CORRECTIONS

The full draft was written and fact-checked. Three corrections needed before publishing:

### Corrections required

| Draft claim | Correction | Source |
|---|---|---|
| "First Daybreaker in Brooklyn" | First event was Dec 10, 2013, **180 friends in the basement of Coffee Shop, Union Square** (Manhattan) | daybreaker.com/our-story |
| "200+ person waitlists" | Not externally verified. Soften to "pop-up events consistently selling out" | No external source found |
| "30+ cities worldwide" | Actually **60 cities, 800K+ members, 7 continents**, 170 countries via virtual | community.inc/article/daybreaker |

### Data verified and solid

- Book "Belong" confirmed: published Sept 2018 by Workman/Hachette, belongbook.com
- Timeline: 2008 Super Sprowtz → 2013 Daybreaker = 5 years, matches `yearsToBlowUp`
- Revenue architecture: all 4 layers populated in offer map
- BlowUp patterns (`first_event`, `institution_creation`) valid and used by other creators
- DNA sliders: workRhythm 4, fuelType 3, orientation 5, knowledgeStyle 5, scaleApproach 4

### Minor internal data issue

Meta `blowUpPatterns` count for "institution_creation" claims 8 profiles but only 4 actually have it in the data. Needs cleanup pass on `experienceCreatorDNA.json` meta section.

### The full draft

**Title:** "She killed the nightclub and invented something that couldn't be named"

**Section 1 — The Wedge:**
Radha noticed nightlife makes people feel terrible. She didn't try to make a better nightclub. She built sober morning dance parties (6am, Brooklyn, DJ, no alcohol). Co-founded Super Sprowtz first (food education for kids). The gap between "this sounds ridiculous" and "this is the most alive I've felt" is where Category Creators live.

**Section 2 — The Brand Engine:**
The experience itself was the marketing. Attendees couldn't describe it using existing words, which forced word-of-mouth. Category Creation formula: combine two existing things (morning + dance party), remove what everyone assumes is required (alcohol), keep the thing people came for (energy, community). Pop-up events selling out before she had a website.

**Section 3 — The Money Engine:**
- Attraction: Book royalties (Belong) + free community events
- Core: Daybreaker event tickets + brand partnerships (health-conscious 5am demographic)
- Scale: City licensing/expansion (60+ cities) + speaking engagements
- Continuity: Daybreaker membership community

**Section 4 — The Compounding Move:**
Licensing the format instead of scaling herself. The magic wasn't her, it was the recipe (morning + music + sobriety + community). Made it portable. Local organisers in 60+ cities run events under the brand. Went from "a woman who throws parties" to "the person who invented a global movement" in about five years.

**Section 5 — If This Is You:**
DNA signature: heavily social (5/5), intuitive (5/5), empire-minded (4/5). Builds through gathering, not content. "Are you a Radha?" checklist. Universal lesson: you don't need a better version of what exists, you can remove the broken bit and call it something new. Category Creation = fastest engine (avg 3 years). CTA to matcher.

---

## AI Video Tool Stack (researched June 2026)

### Recommended stack: ~$100-200/mo

| Layer | Tool | Cost | Job |
|---|---|---|---|
| **Short-form scenes** | Kling 3.0 API | ~$5-7 per 60s video ($0.075/sec) | Multi-shot storyboard with character/style lock. 4K 60fps. Pixar style works well. |
| **Long-form scenes** | Google Veo 3.1 Fast | ~$9-15 per 60s ($0.15/sec) | Best raw quality. Native 48kHz dialogue sync (voiceover baked in). 8-sec clips. |
| **Assembly + VO** | InVideo AI Max | $60/mo flat | Stitch scenes, voice cloning (30s sample), subtitles, music, export. MCP server + API for automation. |
| **Budget scenes** | Seedance 2.0 via fal.ai | ~$1-3 per 60s ($0.022-0.05/sec) | Best price-to-quality. Best identity-lock. |

### Per-video cost estimates

| Format | Tool | Cost |
|---|---|---|
| Short-form (60-90s TikTok/Reels) | Kling 3.0 API | $5-10 |
| Long-form (8-15min YouTube) | Veo 3.1 Fast | $40-70 |
| 32 creator short-forms (full series) | Kling | $160-320 total |

### Key tool details

**Kling 3.0** — Best for automated pipeline. Native multi-shot storyboard (chain 6 shots with character consistency). API: webhook callbacks, failed tasks don't consume credits. $0.075/sec. Consumer plans $6.99-$180/mo.

**Google Veo 3.1** — Best raw quality. Only model with native 48kHz synchronized dialogue. $0.40/sec (standard), $0.15/sec (fast), $0.05/sec (Lite). Access via Vertex AI or through Runway/Luma subscriptions.

**InVideo AI** — Best for full pipeline automation. Prompt → script → footage → voiceover → subtitles → export. Voice cloning from 30-sec sample. Has MCP server and API with SDK. $25/mo (Plus) or $60/mo (Max, unlimited). Integrates Sora 2 and Veo 3.1.

**Seedance 2.0** — Best budget option. ByteDance, launched Feb 2026. API via fal.ai from $0.022/sec. Best identity-lock for character consistency. Free tier on Dreamina (225 daily tokens).

**LTX Studio** — Best storyboard-to-video UX. Control characters, camera angles, scene composition shot-by-shot. $15-$125/mo. API available.

**Runway** — Multi-model marketplace. One sub = Runway + Veo + Kling + Seedance + FLUX. $12-76/mo. API $0.05-0.15/sec. Good for testing multiple models.

**AVOID**: Sora (OpenAI) — consumer app discontinued Apr 2026, API sunsetting Sep 2026.

### Pixar 3D style specifically

Kling 3.0, Veo 3.1, and Seedance 2.0 all handle "Pixar 3D cinematic animation" prompts well. Niche tools (Revid, Mootion, Magiclight.AI) exist but general-purpose leaders produce better quality. Character consistency across scenes is production-ready in 2026 via reference-image workflows.

---

## Data Sources

| File | What it contains | Key for |
|---|---|---|
| `public/data/experienceCreatorDNA.json` | 32 profiles with blowUpMoment, experienceEvolution (4 stages), blowUpPatterns, yearsToBlowUp, DNA sliders | Sections 1, 2, 4, 5 of each post |
| `public/data/experienceCreatorOfferMap.json` | Revenue architecture per creator (attraction/core/scale/continuity) | Section 3 (Money Engine) |
| `public/data/experienceCreatorDNA.json` meta section | Aggregate stats (blowUpStats, blowUpPatterns counts) | Meta-pattern posts |

### Data quality notes

- All 32 profiles have complete `yearsToBlowUp` data (verified)
- `blowUpPatterns` is an array (creators can have multiple engines, they overlap)
- `blowUpType` is mutually exclusive, `blowUpPatterns` is not — use patterns for scoring
- Meta section pattern counts may be stale (institution_creation claims 8, actual is 4)
- Median years to blow-up: 16 (corrected from 14)
- Category Creation avg: 3.0 years (corrected from 2.8)
- Content Vehicle count: 8/32 (not 7), renamed from "Viral Content"
- Making It Portable: 10/32 (not 11)

---

## Voice Profile (for writing posts)

Pull from Supabase: `SELECT * FROM voice_profiles WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4';` on project `qlwfcfypnoptsocdpxuv`.

Key rules:
- Casual, direct, first-person. Australian spelling.
- 1-3 sentence paragraphs. No em dashes.
- Open with cringe confession or scepticism hook
- One absurd metaphor per section
- Metaphor before definition
- End with "Much Love, Huzz"
- Section flow: Hook → Bridge → Framework drop → Personal proof → Reframe → Soft CTA → Groan sign-off
- Voice rules DON'T: paragraphs longer than 4 lines, be the guru, skip the groan, use "journey/manifest/vibration" without earned context

Full voice data: `voice_traits`, `writing_patterns`, `catchphrases`, `detected_patterns` columns.

---

## Obsidian Notes (updated this session)

- `Product/Experience Creator World Tour - Content Strategy.md` — added 3-format pipeline section
- `_context.md` — updated current focus to World Tour
- `Product/Carousel Design Pipeline Apr-22.md` — linked to World Tour pipeline

---

## Three things worth flagging

1. **The daily agent was never built.** We designed the 3-format pipeline and researched all the tools, but the scheduled agent that auto-generates a draft per day (pulling from the calendar, reading JSON data, writing in Huzz's voice, dropping it somewhere to edit) was never wired up. That's the highest-leverage next step.

2. **The Radha carousel was never generated.** We designed the 8-slide template but didn't produce it. That's the fastest way to test the blog → carousel pipeline and would give something to post immediately. Use the existing HTML+Playwright carousel system at `Product/Carousel Design Pipeline Apr-22.md`.

3. **The video tool stack is research-only, not tested.** Kling 3.0 free tier (66 daily credits) should be tested with one Pixar-style scene from the Radha storyboard before committing budget. Sign up, generate one scene, see if the quality holds.

---

## What to do next

1. **Apply the 3 corrections to the Radha draft** and finalise for publishing
2. **Generate the Radha carousel** using the 8-slide template and the existing HTML+Playwright carousel pipeline
3. **Test Kling 3.0 API** with the carousel slides as scene prompts (Pixar 3D style) to produce first video
4. **Pick where the newsletter lives** (recommendation: own site for SEO + matcher integration, syndicate to Substack/LinkedIn)
5. **Write posts 2-5** following the hybrid calendar (Jay Shetty, "meta-patterns", Eckhart Tolle, "4 engines")
6. **Clean up meta section** in `experienceCreatorDNA.json` (institution_creation count is wrong)
7. **Consider automating**: a scheduled agent that generates one draft per day following the calendar, pulling data from the JSONs and writing in Huzz's voice

---

## Related docs

- `docs/experience-creator-world-tour.md` — product/funnel architecture (the full strategy)
- `docs/blow-up-engine-nuances.md` — data corrections + engine overlap nuances
- `docs/feature-brief-experience-creator-matching.md` — matcher product spec
- Obsidian: `Product/Experience Creator World Tour - Content Strategy.md` — content strategy + calendar + distribution
- Obsidian: `Frameworks/Blow-Up Deep Dive - Bridge, Category, Viral, Portable.md` — engine analysis
- Obsidian: `Frameworks/Blow-Up Recipes - Category, Content, Portable.md` — actionable playbooks
- Obsidian: `Frameworks/Platform Timing 2026-2027.md` — distribution strategy
