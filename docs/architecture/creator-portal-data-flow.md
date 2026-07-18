# Creator Portal Data Flow Map

*How every component feeds and supports the ecosystem. Gaps identified and prioritised.*

---

## The Full Ecosystem

```
CONSUMER APP (Vibe Rise)                    CREATOR PORTAL (/create)
════════════════════════                    ════════════════════════

                                            ┌─────── IDENTITY TAB ───────┐
Curiosity Map                               │                            │
  └─ branch ─────────────┐                  │  CreatorPositionCard       │
                         │                  │  ┌──────────────────────┐  │
Life Map                 │                  │  │ Monopoly (X of 299)  │  │
  └─ skills/problems ────┤                  │  │ Intersection (A × B) │  │
     personas            │                  │  │ Frontier cards       │  │
                         ├──▶ useBranch ───▶│  │ Your opportunity     │  │
Life Paths               │    Scoring       │  │ AI positioning       │  │
  └─ careers ────────────┤                  │  │ Design CTA ──────────│──│──▶ Experience
                         │                  │  └──────────────────────┘  │    Creation
Quests                   │                  │           │                │
  └─ branch (AI) ────────┤                  │           ▼                │
     skill_tags          │                  │  BlowUpBrandCard           │
     depth_level         │                  │  ┌──────────────────────┐  │
                         │                  │  │ 1. Remarkable Results │  │
Courage Challenges ──────┘                  │  │ 2. Remarkable Reach   │  │
  (behavioral proof,                        │  │ 3. Remarkable Growth  │  │
   future signal)                           │  │ 4. Scale Score        │  │
                                            │  └───────┬──────────────┘  │
                                            │          │                 │
                                            └──────────│─────────────────┘
                                                       │
                                    ┌──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             RemarkableFlow   NarrativeBuilder  AccessArchitecture
             ┌────────────┐   ┌──────────────┐  ┌────────────────┐
             │ Hint box   │   │ Vehicle      │  │ 5-barrier      │
             │ Recommended│   │ Language     │  │ audit          │
             │ Monopoly   │   │ Cosign       │  │ On-ramp        │
             │ rarity on  │   └──────┬───────┘  └───────┬────────┘
             │ "Different"│          │                  │
             └─────┬──────┘          │                  │
                   │                 │                  │
                   ▼                 ▼                  ▼
            remarkable_angles  narrative_builders  access_architectures
                   │                                    │
                   └──────────────┬─────────────────────┘
                                  │
                                  ▼
                            Scale Score
                            ┌────────────────┐
                            │ RETURN · BREAK  │
                            │ · TRIBAL        │
                            │ Branch pre-fill │
                            │ from scoring    │
                            └───────┬────────┘
                                    │
                                    ▼
                             scale_diagnostics
                                    │
                    ┌───────────────┘
                    ▼
            ┌─────── EXPERIENCES TAB ──────┐
            │                              │
            │  Experience Creation         │
            │  ┌────────────────────────┐  │
            │  │ New experience         │  │
            │  │ From template          │  │
            │  │ From frontier gap CTA  │◀─│── CreatorPositionCard
            │  └───────┬────────────────┘  │
            │          │                   │
            │          ▼                   │
            │  ExperiencePipeline          │
            │  ┌────────────────────────┐  │
            │  │ Market (checklist)     │  │
            │  │ Organise (checklist)   │  │
            │  │ Fill rate / spots bar  │  │
            │  └───────┬────────────────┘  │
            │          │                   │
            │          ▼                   │
            │  PastExperienceStats         │
            │  ┌────────────────────────┐  │
            │  │ Attendance             │  │
            │  │ Repeat rate            │  │
            │  │ 3% improvement log     │──│──▶ Growth tab
            │  │ Top fans               │──│──▶ Growth tab
            │  └────────────────────────┘  │
            │                              │
            └──────────────────────────────┘
                    │
                    ▼
            ┌─────── GROWTH TAB ───────────┐
            │                              │
            │  CreatorRadarChart            │
            │  ┌────────────────────────┐  │
            │  │ Impact (attendees)     │◀─│── PastExperienceStats
            │  │ Consistency (# events) │◀─│── experiences count
            │  │ Retention (repeat %)   │◀─│── PastExperienceStats
            │  │ Brand (Scale Score)    │◀─│── scale_diagnostics
            │  │ Price (max ticket)     │◀─│── experience pricing
            │  │ Reach (IG views)       │◀─│── InstagramConnect
            │  └────────────────────────┘  │
            │                              │
            │  InstagramConnect            │
            │  └─ BrandPulseCard           │
            │  └─ ContentIntel             │
            │                              │
            │  RootReachCard               │
            │  (Roots × Reach momentum)    │
            │                              │
            │  KPIs                        │
            │  ┌────────────────────────┐  │
            │  │ Total attendees        │  │
            │  │ Repeat rate            │  │
            │  │ Experiences run        │  │
            │  │ Upcoming count         │  │
            │  └────────────────────────┘  │
            │                              │
            │  3% Chain                    │
            │  (improvement log across     │
            │   all past experiences)      │
            │                              │
            │  Days since last event       │
            │  (gentle nudge mirror)       │
            │                              │
            └──────────────────────────────┘
```

---

## Data Flow Summary

| From | To | What flows | Status |
|------|-----|-----------|--------|
| Consumer app data | useBranchScoring | Curiosity branches, quest branches, skills, problems, personas | ✅ Built |
| useBranchScoring | CreatorPositionCard | Primary/secondary branch, gap, rarity, confidence | ✅ Built |
| useBranchScoring | RemarkableFlow | Recommended branch tag, frontier hint | ✅ Built |
| useBranchScoring | Scale Score | Branch pre-fill, recommended tag | ✅ Built |
| spiralDynamicsMatrix.json | CreatorPositionCard | Frontier text (Phase 2/3 adaptive) | ✅ Built |
| spiralDynamicsMatrix.json | RemarkableFlow | Hint box content | ✅ Built |
| Monopoly rarity | RemarkableFlow "Different" | "Nobody combines X + Y + Z" | ✅ Built |
| CreatorPositionCard | Experience creation | "Design an experience for this gap" CTA | ✅ Built |
| remarkable_angles | CreatorPositionCard | Rule break display, AI positioning | ✅ Built |
| remarkable_angles | BlowUpBrandCard | Pipeline progress (1 of 4) | ✅ Built |
| remarkable_angles | NarrativeBuilder | Unlocks, context | ✅ Built |
| remarkable_angles | Scale Score | Branch, ancestral/body scores | ✅ Built |
| narrative_builders | AccessArchitecture | Unlocks | ✅ Built |
| access_architectures | Scale Score | Unlocks | ✅ Built |
| scale_diagnostics | CreatorRadarChart | Brand score | ✅ Built |
| experiences | Growth KPIs | Attendance, repeat rate, count | ✅ Built |
| Instagram | BrandPulseCard, ContentIntel | Reach, engagement | ✅ Built |
| PastExperienceStats | Growth KPIs | Attendees, repeat rate, 3% chain | ✅ Built |

---

## Feedback Loops (what flows BACK UP)

| Loop | Status | Impact |
|------|--------|--------|
| Remarkable results → CreatorPositionCard (post-Remarkable state) | ✅ Built | Card adapts: shows rule break + AI positioning |
| Scale Score → CreatorRadarChart "Brand" dimension | ✅ Built | Spider graph shows Phase 3 readiness |
| Experience attendance → Growth KPIs | ✅ Built | Total attendees, repeat rate update |
| 3% improvement log → Growth tab chain | ✅ Built | Compound improvement visible |
| Experience results → branch scoring | ❌ GAP 1 | Running healing workshops should strengthen Healing signal |
| Experience results → positioning update | ❌ GAP 5 | "Your events attract seekers" should sharpen positioning |
| Growth KPIs → market context | ❌ GAP 7 | "Your 20% growth vs market 15-28%" not shown |
| NarrativeBuilder → frontier research | ❌ GAP 6 | Vehicle half-life data not surfaced |

---

## Remaining Gaps

### GAP 1: Experiences don't feed branch scoring
**Current:** Creator runs 5 healing workshops. Branch scoring doesn't know.
**Fix:** Classify experience type/description → branch. Feed completed experience count into useBranchScoring.
**Priority:** Medium. Most creators haven't run experiences yet.

### GAP 5: Experience results don't update positioning
**Current:** Positioning statement is static after generation.
**Fix:** Post-event trigger: "Your last 3 events attracted [persona type]. Update positioning?" Re-generate with new evidence.
**Priority:** Medium. Requires event attendance + persona classification.

### GAP 6: NarrativeBuilder doesn't use frontier research
**Current:** Vehicle selection (Results/Medium/Action) has no market context.
**Fix:** Show frontier research on vehicle selection. "In Healing, vehicle breaks last ~5 years. Results breaks last decades."
**Priority:** Low. Enhances an existing flow, not a new capability.

### GAP 7: Growth tab has no market context
**Current:** KPIs are raw numbers with no benchmark.
**Fix:** Show branch market data alongside KPIs. "Healing market growing 15-28%. You: 20%."
**Priority:** Low. Would require matching experience data to branch, which depends on GAP 1.

### GAP 9 (new): 3% chain doesn't feed back to Remarkable Flow
**Current:** Each experience logs a 3% improvement. These improvements ARE evidence of the rule break working. But RemarkableFlow doesn't know about them.
**Fix:** Show 3% chain as social proof on the "Experience" step (Step 5) of RemarkableFlow. "Your last 3 improvements: [X, Y, Z]. This is your rule break in action."
**Priority:** Low. Requires multiple events with logged improvements.

### GAP 10 (new): No loop from Growth tab back to positioning pivot
**Current:** If Growth KPIs show declining attendance or low repeat rate, nothing suggests a positioning change.
**Fix:** "Your repeat rate dropped below 20%. This might mean your positioning needs updating." Link back to CreatorPositionCard.
**Priority:** Low. Edge case, but important for retention.

---

## Priority Order (all gaps)

| Priority | Gap | Status | Impact | Effort |
|----------|-----|--------|--------|--------|
| ~~1~~ | ~~Scale Score branch pre-fill~~ | ✅ Fixed | — | — |
| ~~2~~ | ~~Monopoly in Remarkable "Different"~~ | ✅ Fixed | — | — |
| ~~3~~ | ~~Frontier → experience design CTA~~ | ✅ Fixed | — | — |
| 4 | Experience type → branch scoring (GAP 1) | Open | Behavioral proof | Medium |
| 5 | 91-creator competitive map in full | Open | Concrete density | Medium |
| 6 | Experience results → positioning update (GAP 5) | Open | Living positioning | Medium |
| 7 | NarrativeBuilder frontier context (GAP 6) | Open | Informed vehicles | Low |
| 8 | Growth tab market context (GAP 7) | Open | Contextual KPIs | Medium |
| 9 | 3% chain → Remarkable proof (GAP 9) | Open | Rule break evidence | Low |
| 10 | Growth decline → positioning pivot (GAP 10) | Open | Retention safety net | Low |
