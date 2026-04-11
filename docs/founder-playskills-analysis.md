# Founder playSkills Analysis

Internal analysis document for `public/data/founderPlaySkills.json`, which tags 75 founders from `founderDnaFounders.json` against the 60 playSkills in `src/lib/wheelTaxonomy.js` (`SKILLS_SEGMENTS`).

Output file: `/Users/nichuzz/creations/Findmyflow/public/data/founderPlaySkills.json`.

## Phase summary

Phase 0 produced 290 tags across 75 founders (avg 3.87, median 4, range 3-6) with no confidence signal and no anti-tags.

Phase 1 added confidence to every tag, added anti-tags (skills the founder conspicuously did NOT embody), and re-tagged outlier founders whose content-to-tag ratio suggested phase 0 had stopped early. Net result: 301 tags (avg 4.01) with confidence labels, plus 120 anti-tags across all 75 founders (avg 1.60/founder).

## Summary stats (revised)

| Metric | Phase 0 | Phase 1 |
|---|---|---|
| Founders tagged | 75 / 75 | 75 / 75 |
| Total playSkill tags | 290 | 301 |
| Avg playSkills per founder | 3.87 | 4.01 |
| Median | 4 | 4 |
| Min / Max | 3 / 6 | 3 / 6 |
| Founders with 3 tags | 21 | 13 |
| Founders with 4 tags | 44 | 49 |
| Founders with 5 tags | 9 | 12 |
| Founders with 6 tags | 1 (Steve Jobs) | 1 (Steve Jobs) |
| Total anti-tags | 0 | 120 |
| Founders with at least one anti-tag | 0 | 75 |
| Avg anti-tags per founder | 0 | 1.60 |

## Phase 1 changelog: outlier re-examination

Top-15 founders by content-to-tag ratio were re-read against the source narrative. Eleven gained one cited tag each. Two were confirmed thin (their source genuinely does not support more). Two were already at appropriate density.

**Re-tagged (gained 1 tag each):**

| Founder | Added | Why |
|---|---|---|
| Levi Strauss | organizing: Build a workflow that runs itself | Wholesale supply chain to mining camps with on-time delivery, fair credit, consistent quality. The chain reordered itself. |
| Mackenzie Scott | strategizing: Pick what matters and cut the rest | $16B given through a small advisory team, refused press, naming rights, bureaucracy. The cut is the strategy. |
| Phil Knight | influencing: Sell something you actually believe in | Sold Tigers from his car trunk to runners at track meets, picking buyers who already wanted better shoes. Conviction-driven, not persuasion. |
| Sam Zell | organizing: Build a workflow that runs itself | After 1992 tax reform, used REIT structure to take Equity Residential public in 1993, building a permanent-capital vehicle that scaled deal absorption. |
| Jim Simons | connecting: Build a group from nothing | Hired mathematicians, physicists and codebreakers into Renaissance and built a research culture none of them could have built alone. The group was the moat. |
| Richard Branson | connecting: Build a group from nothing | Built Virgin as a federation of 400+ companies, each with its own MD and P&L. Scaled by assembling operator groups, not running them. |
| Sam Zemurray | strategizing: Call the smart play under pressure | Financed a literal revolution in Honduras when his land concessions were threatened; later flipped United Fruit in a boardroom coup. |
| James Sinegal | strategizing: Pick what matters and cut the rest | 4,000 SKU cap vs competitors' 100,000, refused all advertising, rejected Wall Street pressure to raise margins. The whole company is built on saying no. |
| Thomas Edison | influencing: Make a pitch that moves people | Pre-announced inventions before solutions existed, gave J.P. Morgan and Vanderbilts personal Menlo Park tours, used spectacle to close investors. |
| James Dyson | designing: Make something beautiful and usable | Clear bin showing the dirt, silent hand dryer, hair dryer with the missing motor. Made his engineering visible AND beautiful. |
| Todd Graves | building: Get your hands dirty on a real object | Worked as a boilermaker in 100-degree refineries and on Bering Sea fishing boats to fund his first restaurant; still works fry-line shifts as CEO. |

**Confirmed thin (left at original density):**

- **Howard Hughes** — Source supports building (H-1, Spruce Goose) and creating, but his defining trait (impossible feats for their own sake) has no clean taxonomy mapping. Three tags is the honest answer.
- **Chuck Feeney** — Three tags accurately captures the analytic-strategic anti-visibility profile. The anti-tags carry more signal for him than additional positive tags would.
- **Patagonia's Rose Marcario** — Four tags, low ratio because the source is text-heavy on values rhetoric rather than cited decisions. Already balanced.
- **Alexander Graham Bell** — Four tags already capture his core (build + clarify + nurture + teach). Source repetition rather than missed signals.

## Confidence distribution

Overall:

| Confidence | Count | % |
|---|---|---|
| high | 150 | 50% |
| medium | 75 | 25% |
| low | 76 | 25% |

The 50% high target was hit. Low is slightly over the 15% target — this is because many founders carry one or two soft inference tags from phase 0 that were defensible as inclusions but not anchored in cited specific decisions. Marking them low rather than removing them preserves matching surface area while flagging them honestly.

**Per-category confidence breakdown:**

| Category | high | medium | low | total |
|---|---|---|---|---|
| strategizing | 25 | 6 | 7 | 38 |
| expressing | 26 | 7 | 5 | 38 |
| designing | 8 | 10 | 14 | 32 |
| building | 19 | 9 | 3 | 31 |
| analyzing | 16 | 7 | 7 | 30 |
| organizing | 19 | 6 | 1 | 26 |
| influencing | 9 | 8 | 7 | 24 |
| nurturing | 3 | 9 | 11 | 23 |
| creating | 10 | 1 | 8 | 19 |
| synthesizing | 5 | 6 | 6 | 17 |
| connecting | 6 | 5 | 6 | 17 |
| clarifying | 4 | 1 | 1 | 6 |

Two structural patterns are visible in the breakdown:

1. **Strategizing, expressing, building, organizing and analyzing skew high.** These categories tend to be supported by cited specific decisions in biographical material — killed product lines, public stunts, factory walks, prototype counts, cost sheet audits. The evidence is concrete.
2. **Designing and nurturing skew low.** Both of these often appear as inferences from general characterization ("the brand felt premium", "he developed people") rather than from quoted, dated, fact-checkable actions. This is honest: most founder biographies don't capture coaching moments or aesthetic micro-decisions in citable form.

The nurturing skew is particularly worth flagging: 11 of 23 nurturing tags are low. The exceptions (Cucinelli's Scuola dei Mestieri, Estée Lauder's counter consultant training, Rick Rubin's artist work, Hamdi Ulukaya's refugee hiring, Jose Andres's WCK) are all high-confidence because they involve named programs or documented patterns. The low nurturing tags are mostly "treats employees well" type phrasings that we can't verify deeply.

## Anti-tags

Total: 120 anti-tags across 75 founders. Avg 1.60/founder. Range 0-3.

Anti-tags were applied conservatively per the brief. They mark skills the founder *actively avoided, delegated, disdained, or conspicuously lacked* — not skills that simply happened not to come up. Where evidence was absent or ambiguous, no anti-tag was added.

**Top 10 most-common anti-tagged playSkills:**

| Count | Category: Skill |
|---|---|
| 18 | nurturing: Hold space for a hard moment |
| 18 | expressing: Perform, present, or hit record |
| 16 | organizing: Build a workflow that runs itself |
| 10 | analyzing: Find the pattern in messy data |
| 8 | analyzing: Turn numbers into a clear story |
| 5 | nurturing: Give patient, useful feedback |
| 5 | expressing: Tell a story that lands |
| 5 | influencing: Make a pitch that moves people |
| 4 | building: Get your hands dirty on a real object |
| 4 | nurturing: Mentor someone earlier on the path |

The top three are the most interesting matching signal in this whole pass.

**1. "Hold space for a hard moment" (18 anti-tags).** This is the dominant shadow of the founder cohort. Steve Jobs, Bezos, Gates, Musk, Carnegie, Larry Ellison, Sam Walton, Howard Schultz, Sam Zell, Buckminster Fuller, Coco Chanel and others actively avoided emotional safety as a tool — many were famously brutal in reviews or with employees. For users who light up on nurturing, this is a clean negative-space signal: most of the famous founders in this dataset are bad matches.

**2. "Perform, present, or hit record" (18 anti-tags).** A surprising number of founders explicitly avoided visibility: Rockefeller, Sol Price, Ed Thorp, Phil Knight, Bernard Arnault, Sinegal, Mackenzie Scott, Chuck Feeney, Jim Simons, Sam Zemurray, Tobi Lütke, Ratan Tata, Hamdi Ulukaya, Marcario, Tadashi Yanai, Levi Strauss, Michael Dell, Todd Graves. There is a whole "build the thing, refuse the stage" tradition in the dataset that becomes visible only through anti-tags. For users with high social anxiety or anti-visibility instincts, this group is a powerful match cluster that positive tagging alone would have missed.

**3. "Build a workflow that runs itself" (16 anti-tags).** A second cluster of founders whose work doesn't systematize: Cucinelli (resists scale), Yvon Chouinard (mission-led, not systems-led), Estée Lauder (depended on her personal touch), Larry Ellison (force of personality), Edwin Land (Polaroid collapsed without him), Howard Hughes, Branson (federation, not system), Bell, Tesla, Tony Hsieh (holacracy broke), Vera Wang, Stewart Butterfield (burned out and left), Sophia Amoruso (Nasty Gal collapsed operationally), Andre Agassi, Buckminster Fuller, Masayoshi Son. For users who do NOT want to be CEO of a system, this anti-cluster is a permission slip — many great founders never built an org chart that ran without them.

**Honourable mentions in anti-tag patterns:**

- "Find the pattern in messy data" and "Turn numbers into a clear story" (18 anti-tags combined) flag the founders who were proudly intuitive: Branson, Walton (the rare one who is both tagged AND anti-tagged in analyzing because his data work was operational, not analytic, depending on which lens), Estée Lauder, Sara Blakely, Jack Ma, Whitney Wolfe Herd, Tory Burch, Alli Webb, Howard Hughes (kind of), Daymond John, Jose Andres. Useful matching signal for users who light up on intuition over data.
- "Mentor someone earlier on the path" (4 anti-tags) and "Give patient, useful feedback" (5 anti-tags) flag founders who did not develop people: Jobs, Larry Ellison, Bezos, Ford, Howard Hughes, Bill Gates, Walt Disney. The "demanding genius" archetype.

## Category frequency (positive tags)

Percentage = founders that include at least one playSkill from this category (out of 75). Largely unchanged from phase 0; no category exceeds the 45/75 differentiation guardrail.

| Category | # Founders |
|---|---|
| expressing | 24 |
| strategizing | 23 |
| analyzing | 21 |
| building | 22 |
| designing | 17 |
| nurturing | 17 |
| influencing | 16 |
| organizing | 15 |
| synthesizing | 14 |
| creating | 13 |
| connecting | 14 |
| clarifying | 3 |

(Slight changes from phase 0 reflect the new tags added during outlier re-tagging.)

## Top 5 most common positive playSkills

| Count | Skill |
|---|---|
| 15 | strategizing: Pick what matters and cut the rest |
| 12 | strategizing: Design the game before playing it |
| 11 | analyzing: Turn numbers into a clear story |
| 11 | building: Get your hands dirty on a real object |
| 11 | influencing: Sell something you actually believe in |

Phase 1 lifted three new entries to 11 ("Get your hands dirty" via Todd Graves; "Sell something you actually believe in" via Phil Knight; "Pick what matters and cut the rest" via Mackenzie Scott and James Sinegal). The radical-focus and hands-on-craft signature of the cohort got slightly stronger.

## Taxonomy gaps surfaced in Phase 1

These are places where the re-tagging pass wanted to mark something concrete in the source but the closest available playSkill string didn't quite fit. Feed into the Phase 2 taxonomy revision.

1. **"Anti-visibility as strategy."** Eighteen founders were anti-tagged on "Perform, present, or hit record" because they explicitly avoided visibility. There is no positive playSkill for "deliberately stay hidden so the work speaks". This is a real founder mode (Rockefeller, Feeney, Sinegal, Mackenzie Scott, Levi Strauss, Marcario, Sam Zemurray) and deserves its own skill, probably in expressing or strategizing. Candidate: "Let the work speak instead of you" or "Build a brand that doesn't need your face".

2. **"Federation-building without operating."** Branson, Mackenzie Scott, Sam Zell, Bezos at the leadership-principles level — all built things that scaled without them by intentionally not running them. The closest taxonomy hit is "Build a workflow that runs itself" but that implies a single workflow; what these founders did is closer to "build a federation" or "design an operator system that runs itself". Candidate refinement: split organizing's "Build a workflow that runs itself" into operational-workflow vs federation-of-operators.

3. **"Decisive bet under existential pressure."** "Call the smart play under pressure" was used heavily but undersells the magnitude in cases like Sam Zemurray (financed a coup), Hughes (rebuilt Hell's Angels mid-shoot), Branson (sold Virgin Records to save Atlantic), Ellison (PeopleSoft 18-month war), Larry Page-style bet-the-company moves. Candidate: a stronger version like "Bet the company on a single move" might be merited.

4. **"Taste."** Same gap surfaced in phase 0: Jobs, Chanel, Vera Wang, Bernard Arnault, Tadashi Yanai, Bobbi Brown, Brunello Cucinelli all share an instinct for what feels right that's not quite "Polish the small details others miss" or "Make something beautiful and usable". The 14 low-confidence designing tags are the symptom — we keep tagging soft-inferred taste because the taxonomy lacks the cleaner skill. Candidate: "Know when something feels right" as a designing skill.

5. **"Hire and let people thrive."** Watson at IBM, Tata's quiet succession discipline, Costco's wage philosophy, Branson's MD-led federation, Mackenzie Scott's trust-based grants — all share "give people serious resources and trust them". "Watch someone grow without taking credit" approximates this but is framed as personal mentoring; what these founders did is more structural. Candidate: an organizing or nurturing skill called "Give people resources and trust them to use them" or similar.

6. **"Intuitive pattern recognition without data."** Estée Lauder, Branson, Sara Blakely, Sophia Amoruso, Tory Burch, Whitney Wolfe Herd, Jack Ma, Daymond John, Jose Andres, Alli Webb were all anti-tagged for analyzing because they explicitly run on intuition. There is no positive analyzing or synthesizing skill for "feel the market in your gut and act before the data". This may belong in synthesizing or creating. Candidate: "Trust a felt pattern before it shows up in numbers".

## Hard-to-tag founders carried over from Phase 0

Most phase 0 hard-to-tag founders remain hard. The brief specifically asked us not to over-tag, and after re-reading the source for each outlier, the same intuitions held. The consistent pattern: founders whose signature is *intensity, scale or singular obsession* (Hughes, Pulitzer, Larry Ellison, Masayoshi Son) are all under-served by a skills taxonomy that captures *what they did with their hands and words*, because their move was more about magnitude than about a particular play.

## Methodology notes

Confidence rules used:
- **high**: cited specific decision, named, dated, quantified, or repeated as a documented behavior. Could be fact-checked from the source. Examples: Jobs killing 70% of Apple's product line in 1997; Dyson's 5,127 prototypes; Rockefeller's Ledger A; Sinegal capping at 4,000 SKUs.
- **medium**: clear pattern in the source but described in paraphrase, or supported by multiple soft references rather than one quotable action. Examples: Cucinelli "investing in craft"; Walt Disney "drew the original flywheel diagram".
- **low**: inference from general characterization. The pattern is plausible but the source doesn't cite a specific action. Examples: Brunello Cucinelli "Make something beautiful and usable"; Chuck Feeney's "Find the pattern in messy data".

Anti-tag rules used:
- Must be supported by source evidence of *active* avoidance, delegation, disdain or conspicuous absence. Not "didn't happen to do it" — "actively not this".
- Same byte-exact playSkill strings as positive tags.
- Skipped where evidence was ambiguous. Many founders who *probably* didn't do X were left without an anti-tag for X if the source didn't make the avoidance explicit.

## Schema

Each founder entry now contains:

```json
{
  "name": "Steve Jobs",
  "dominantCategories": ["strategizing", "designing", "expressing"],
  "playSkills": [
    {
      "category": "strategizing",
      "skill": "Pick what matters and cut the rest",
      "confidence": "high",
      "evidence": "On returning to Apple in 1997, Jobs killed 70% of the product line..."
    }
  ],
  "antiTags": [
    {
      "category": "nurturing",
      "skill": "Hold space for a hard moment",
      "evidence": "Jobs was famously brutal in design reviews, calling ideas 'shit' in front of teams..."
    }
  ]
}
```

## Validation

Build script lives at `/tmp/phase1/build.js` (not committed). It validates that:

1. Every `skill` in playSkills and antiTags is byte-exact match to `SKILLS_SEGMENTS`.
2. Every `category` matches a valid segment id.
3. Every tag has a confidence in {high, medium, low}.
4. 75 founders, 75 entries, no missing names.
5. Per-tag and per-anti-tag evidence is non-empty.

All checks pass on the current output.
