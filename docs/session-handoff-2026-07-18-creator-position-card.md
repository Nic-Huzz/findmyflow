# Session Handoff: Creator Position Card + Frontier Research

*Session: July 15-18 2026. Continues from session-handoff-2026-07-17-phase3-matrix.md*

---

## What Was Accomplished This Session

### 1. CreatorPositionCard (Sprint 1 — DONE)

New component replacing PositioningSummary on CreatorHomeV2. Unified card showing:
- **Monopoly hero** (X of 299, gradient text, personalized skill + problem + persona matching)
- **Intersection** (Bonds × Healing, where your branches merge)
- **Vehicle/territory insight** (curiosity says X, quests say Y)
- **Primary + secondary frontier cards** (expandable, Phase 2/3 adaptive framing)
- **Positioning statement** (absorbed from PositioningSummary — life quake, transformation, AI generate)

**Phase-adaptive framing:**
- Phase 3 branches (Healing, Movement, Story, Nourishment, Fire): What's already working / What's still missing / Your opportunity
- Phase 2 branches (Bonds, Tools, Status, Shelter, Threat): What everyone does / Why it no longer works / What would actually work / Your opportunity

"Your opportunity" is personalized: "You [skill] people who experience [problem]. At this intersection: [merge/gap text]"

### 2. Market Research (all 10 branches)

All 10 frontier research docs completed, reviewed, errors fixed:
- `docs/research/frontier-{healing,movement,bonds,story,tools,status,nourishment,shelter,fire,threat}.md`
- Research spec: `docs/research/frontier-market-research-spec.md`
- spiralDynamicsMatrix.json updated with verified data + simplified 12yo-language text

### 3. Persona Classification

299 careerModels profiles classified with `primaryPersona` via Haiku batch job. Distribution: teachers (71), creators (53), visionaries (40), builders (30), seekers (22), healers (21), connectors (18), etc. Monopoly rarity now matches on skills × problems × personas (1,440 positions).

### 4. Blog Drafts

10 frontier insight pieces at `docs/content/frontier-insights-draft.md`. One per branch, 200-400 words each. Need voice editing before publishing.

---

## Key Decisions Made

1. **Creator Portal only.** All features target `/create` (CreatorHomeV2), not the consumer Journey tab.
2. **SD level removed from user-facing output.** Appendix preserved in personal-monopoly-finder.md.
3. **Phase 2 vs Phase 3 adaptive framing.** Branches tagged with `phase` field in JSON. Component shows different labels and content per phase.
4. **"Your opportunity" replaces Prediction.** Personalized using user's skill/problem data. Both framings end with this.
5. **Monopoly = skills × problems × personas.** Exact matching, favourited clusters weighted 3x, keyword hits weighted for personas. 299 profiles now have primaryPersona.
6. **Frontier text at 85%+ confidence.** "Phase 3 version" language removed. Plain English, 12yo readable. Phase 3 branches use merge language. Phase 2 branches use "what would actually work."
7. **Remarkable Flow pre-fill → "hint" approach.** NOT pre-filling the textarea. Instead: collapsible "Read this if you're stuck" hint box + "Recommended" tag on branch. Confidence: 90%. Deferred to Sprint 2.
8. **Branch profile merges with PositioningSummary.** One component. PositioningSummary.jsx still exists as file but is no longer imported.

---

## What The User Sees (current state)

```
┌─────────────────────────────────────────────┐
│  Your Position              Bonds × Healing │
│                                     92%     │
│  ┌─────────── MONOPOLY ──────────────────┐  │
│  │          1 of 299                     │  │
│  │    share your combination             │  │
│  │  coaching + voice taken + seekers     │  │
│  │  Similar: Andre Agassi               │  │
│  │  ───────────────────────────────────  │  │
│  │  Where Bonds meets Healing.           │  │
│  │  That intersection is yours.          │  │
│  │                                       │  │
│  │  Curiosity says tools. Quests say     │  │
│  │  bonds. Tools is vehicle, bonds       │  │
│  │  territory.                           │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ BONDS FRONTIER (Phase 2) ────────────┐  │
│  │  What would actually work: ...         │  │
│  │  Your opportunity: You coach people    │  │
│  │  who experience voice taken. Here...   │  │
│  │  Tap to see full landscape             │  │
│  └────────────────────────────────────────┘  │
│                                             │
│  ┌─ HEALING LANDSCAPE (Phase 3) ─────────┐  │
│  │  What's already working: ...           │  │
│  │  Your opportunity: You coach people    │  │
│  │  who experience voice taken. At this   │  │
│  │  intersection: ...                     │  │
│  │  Tap to expand                         │  │
│  └────────────────────────────────────────┘  │
│                                             │
│  [Your branches ▾] (collapsible chart)      │
│                                             │
│  ── Post-Remarkable only ──                 │
│  [Your rule break]                          │
│  [Positioning: life quake + transformation  │
│   + AI generate button]                     │
│                                             │
│  ── Pre-Remarkable only ──                  │
│  Is this the assumption you're breaking?    │
└─────────────────────────────────────────────┘
```

**Phase-adaptive labels:**
- Phase 2 (Bonds, Tools, Status, Shelter, Threat): What everyone does / Why it no longer works / What would actually work / Your opportunity
- Phase 3 (Healing, Movement, Story, Nourishment, Fire): What's already working / What's still missing / Your opportunity

## Known Issues

1. **Branch detection might not match self-perception.** User sees "Bonds × Healing" but might think of themselves as "Healing × Bonds." No way to override. Could add a "Change branch" link.
2. **Monopoly number varies by which skill/problem the algorithm picks.** Adding a new cluster could change the top pick. Could feel unstable.
3. **8 of 10 branches not word-by-word content reviewed.** Framing is consistent but specific text hasn't been approved for Story, Tools, Status, Nourishment, Shelter, Fire, Threat, and Bonds (only framing approved).
4. **HTML pages (matrix, radar) still have old hypothesis text.** Only the JSON was updated with verified research. The standalone HTML visualizations are stale.

## Sprint Status

| Sprint | Status | Notes |
|--------|--------|-------|
| 1. CreatorPositionCard | **Done** | Built, iterated, reviewed, content approved for Healing + Movement. Framing consistent across all 10. |
| 2. RemarkableFlow hint box | **Next** | Collapsible "stuck?" hint + recommended branch tag. Scoped but not built. |
| 3. AI monopoly statement | Waiting | Via agent-chat, personalized narrative |
| 4. Quest taxonomy tagging | Waiting | Migration + AI classification |
| 5. 91-creator competitive map | Waiting | Branch tagging + scale to 1,000 |

---

## Files Changed

**New this session:**
- `src/components/CreatorPositionCard.jsx` — main component
- `src/components/CreatorPositionCard.css` — light theme, portal CSS vars
- `docs/content/frontier-insights-draft.md` — 10 blog drafts
- `docs/session-handoff-2026-07-18-creator-position-card.md`
- `docs/research/frontier-{tools,status,nourishment,shelter,fire,threat}.md` — 6 remaining branches
- `scripts/classify-personas.py` — persona batch classification script

**Modified this session:**
- `src/components/CreatorHome/CreatorHomeV2.jsx` — replaced PositioningSummary with CreatorPositionCard, added Curiosity Map to onboarding, removed hasPositioningStatement dead state
- `src/hooks/useBranchScoring.js` — removed SD level, added persona extraction + keyword matching, fixed rarity to exact combination matching (skills × problems × personas), weighted favourites 3x, keyword hits for persona scoring
- `public/data/spiralDynamicsMatrix.json` — all 19 frontier/emerging cells have `simple` objects with 12yo text + `phase` field (phase2/phase3), verified research data
- `public/data/careerModels.json` — all 299 profiles now have `primaryPersona` field
- `docs/features/personal-monopoly-finder.md` — updated build plan, decisions, appendix

---

## QA Status

- Build passes throughout
- 3 code review agents ran (CreatorPositionCard, useBranchScoring, CreatorHomeV2 changes)
- 12+ bugs found and fixed across the session
- Healing research reviewed by agent (8 data errors fixed)
- All 10 research docs reviewed
- Rarity tested against real user data (0-11 of 299 depending on combination)

---

## Branch Content Review Status

| Branch | Phase | Reviewed | Approved |
|--------|-------|----------|----------|
| Healing | Phase 3 | Yes | Yes (rewritten with two-camps framing + community emphasis) |
| Movement | Phase 3 | Yes | Yes |
| Bonds | Phase 2 | Shown | Framing approved, content not word-by-word reviewed |
| Story | Phase 3 | Not reviewed | Framing applied |
| Tools | Phase 2 | Not reviewed | Framing applied |
| Status | Phase 2 | Not reviewed | Framing applied |
| Nourishment | Phase 3 | Not reviewed | Framing applied |
| Shelter | Phase 2 | Not reviewed | Framing applied |
| Fire | Phase 3 | Not reviewed | Framing applied |
| Threat | Phase 2 | Not reviewed | Framing applied |

**Next session:** Continue branch-by-branch content review for the remaining 8, then Sprint 2.
