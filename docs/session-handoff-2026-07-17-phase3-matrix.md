# Session Handoff: Phase 3 × Spiral Dynamics Matrix

*Session: July 15-18 2026. Status: All 10 branches researched, JSON updated with verified data, blog drafts written, components built (not deployed).*

---

## What Was Accomplished

### 1. Framework (Original IP)
Started from a podcast quote ("good answers are different ways of seeing the present") and built a framework crossing the Rule Break Tree's 10 primal branches with Spiral Dynamics developmental levels. Produced the Phase 3 × Spiral Dynamics Matrix.

### 2. Visualizations (standalone HTML, not deployed)
- `public/rule-break-matrix.html` — Interactive 10x6 matrix with 60 clickable cells, creator diagnostic, pattern insights
- `public/rule-break-radar.html` — 5-tab companion: Merge Radar, Empty Cell Map, Civilisation Timeline, Pricing Problem, Prediction Engine
- `public/rule-break-tree.html` — SD tags added to all 92 nodes (tooltip shows SD level on hover)

### 3. React Components (wired into Journey tab, not deployed)
- `src/hooks/useBranchScoring.js` — Weighted branch scoring algorithm. Pulls curiosity clusters, active quests, nikigai clusters, life paths. Outputs primary/secondary branches, gap insight (vehicle vs territory), rarity (vs 299 profiles).
- `src/components/BranchInsightCard.jsx` + `.css` — Branch chart, gap insight, expandable frontier card, rarity. Mounted on JourneyTab after Figurine section.
- `public/data/spiralDynamicsMatrix.json` — 60 matrix cells extracted for React import

### 4. Market Research (all 10 branches completed)

**Priority branches (76% of creator dataset):**
- `docs/research/frontier-healing.md` — Gap: NS-state-informed modality SEQUENCING at consumer price. 10 adjacent players, 0 exact match. NEUROFIT is primary gap-closing risk.
- `docs/research/frontier-movement.md` — Gap: structured community movement with progression + identity transformation + NS awareness. CrossFit proved the model; its decline was leadership failure.
- `docs/research/frontier-bonds.md` — Gap: facilitated peer-group model (proven by Vistage/YPO at $2.5-22K/year) democratized at consumer price with belonging measurement.
- `docs/research/frontier-story.md` — Original prediction (AI co-creation) WRONG (10+ players). Updated gap: story as NS regulation, narrative containers that transform the teller.

**Secondary branches:**
- `docs/research/frontier-tools.md` — Gap: technology that grows WITH the human (agency, not dependency). AI coding tools crowded ($2B+ ARR for Cursor alone). Maker/analog revival strong.
- `docs/research/frontier-status.md` — Gap: status-game diagnostic + wound connection + exit protocol. Nobody operationalizes "see all games as games" into a tool.
- `docs/research/frontier-nourishment.md` — Original prediction had 8+ players (LOW). Updated gap: full chain from soil health to individual gut response. Zero players connect it.
- `docs/research/frontier-shelter.md` — Two camps don't overlap: adaptive/responsive (premium) vs affordable modular (dumb). Gap = integration at median price.
- `docs/research/frontier-fire.md` — Distributed intelligent energy has 15+ players. Real gap: consumer-facing orchestration (make home energy feel like Spotify).
- `docs/research/frontier-threat.md` — EMPTIEST branch on entire matrix. 0-2 players in gap. Zero consumer products for anti-fragile community resilience. The emptiness IS the finding.

### 5. Spec Docs
- `docs/features/personal-monopoly-finder.md` — Full implementation doc with algorithm, pipeline, build plan, test run results, SD appendix
- `docs/features/phase3-spiral-dynamics-utilities.md` — 11 utility specs with priorities
- `docs/research/frontier-market-research-spec.md` — Research template (validated across 4 branches)

### 6. Obsidian
- `Frameworks/Phase 3 × Spiral Dynamics Matrix.md` — Full IP framework note

---

## Key Decisions

1. **SD level removed from user-facing output.** Depth levels measure skill progression, not value systems. Utility is Phase 3 trends + rule breaks + blow-up opportunities. Appendix preserved.
2. **Rarity = skills × problems × personas (1,440 positions vs 299 profiles).** Branches = strategic orientation (market landscape), not individual detection. Uses existing `findCareerMatches()`.
3. **Frontier card deferred until market research.** Now validated for Healing, Movement, Bonds, Story. Ready to integrate.
4. **BranchInsightCard on Journey tab.** After Figurine, before Orphaned Wahoos. Returns null if no data.
5. **To reach 1,000 profiles:** taxonomy-map 91 existing creators → 390. Then batch-classify from directories.

---

## What's Ready to Ship

- BranchInsightCard component + useBranchScoring hook (built, reviewed, bugs fixed, needs re-mounting on JourneyTab)
- All standalone HTML visualizations (matrix, radar, tree with SD tags)
- spiralDynamicsMatrix.json updated with verified data from all 10 research docs
- 10 blog drafts at `docs/content/frontier-insights-draft.md`

## Key Data Outputs

### Class Ceiling (mass-market gap per branch)

| Branch | Cheapest Phase 3 | Premium Phase 3 | Mass-Market Gap |
|--------|-----------------|-----------------|-----------------|
| Healing | NEUROFIT ~$15/mo | Retreat $3-15K | Nothing under $50/mo routes you to right modality |
| Movement | parkrun $0 | HYROX $1.5-3K/yr | Nothing under $50/mo has community + progression + NS |
| Bonds | Run clubs $0 | YPO/Vistage $2.5-22K/yr | 99.999% priced out of facilitated belonging |
| Story | Substack $0 | Kajabi $500/mo | Ceiling is distribution, not price |
| Tools | Open source $0 | Agency fees vary | Comprehension gap, not price gap |
| Status | Social media $0 | Identity coaching $150+/session | Nothing under $50/mo does real identity work |
| Nourishment | Organic 2-3x | Personalised nutrition $200+/mo | No affordable soil-to-gut pipeline |
| Shelter | Conventional | Co-housing same or more | Counter-movement costs MORE. 65% priced out. |
| Fire | Candles $5 | Full electrification $50-80K | 85% priced out. Renters excluded. |
| Threat | Nothing | Nothing | Category doesn't exist at any price |

### Gap Findings (verified, all 10 branches)

| Branch | Adjacent Players | Exact Matches | Verified Gap |
|--------|-----------------|---------------|-------------|
| Healing | 10 | 0 | NS-state modality SEQUENCING at consumer price |
| Movement | 12 | 0 | Structured community movement + identity + NS awareness |
| Bonds | 8 | 0 | Vistage/YPO facilitation democratized at consumer price |
| Story | 10+ (original wrong) | 0 (updated) | Story as NS regulation (transform teller, not audience) |
| Tools | 8 | 0 | Technology building human agency, not dependency |
| Status | 8 | 0 | Status-game diagnostic + wound connection + exit protocol |
| Nourishment | 8+ (original wrong) | 0 (updated) | Soil-to-gut closed loop |
| Shelter | 12+ | 0 | Adaptive + affordable + community-owned |
| Fire | 15+ | 0 | Consumer energy OS (home energy like Spotify) |
| Threat | 0-2 | 0 | Anti-fragile community resilience (total emptiness) |

### Cross-Branch Pattern

The same meta-pattern appeared independently in 4 priority branches: "the proven premium model, democratized at consumer price with NS awareness." Healing (Vistage-style routing at $50/mo), Movement (CrossFit-style community at $50/mo), Bonds (YPO-style facilitation at $50/mo), Story (transformational narrative containers at $50/mo). Vibe Rise sits at the intersection of all four.

### Competitive Analysis Use

The research functions as ready-made competitive analysis: named players, market sizes, gap validation. "10 adjacent players, 0 exact match" with real companies per branch. Useful for investor conversations, partner pitches, or positioning decks for Scale, Creator Portal, or Vibe Rise Sessions.

## What's Next (Not Started)

1. **Re-mount BranchInsightCard on JourneyTab** — Component exists, was removed by another session. One import + one line.
2. **Quest taxonomy tagging migration** — `skill_tags[]`, `problem_tags[]`, `persona_tags[]` on quests table. Enables courage challenges to feed branch scoring.
3. **Remarkable Flow Two Worlds pre-fill** — Frontier card primes rule break discovery.
4. **Full monopoly output with AI statement** — Combines branch scoring + rarity + frontier + AI-generated monopoly statement via Zarlo
5. **91-creator competitive map** — Tag creator DNA profiles with branches
6. **Scale to 1,000 profiles** — AI classification pipeline from Heallist, ICF directory, etc.
7. **Update rule-break-matrix.html and rule-break-radar.html** — Replace hypothesis text in HTML files with verified research (JSON is done, HTML pages still have original text)

## SD Level Decision

SD level was explored and REMOVED from user-facing output. Depth levels measure skill progression, not value systems. The utility is Phase 3 trends + rule breaks + blow-up opportunities, not labeling users with SD levels. Appendix preserved in personal-monopoly-finder.md. The standalone HTML visualizations (matrix, radar, tree) still use SD as an internal framework but users never see "you're at Yellow."

---

## QA Status

- Build passes (verified multiple times throughout session)
- 2 code review agents ran on React code (7 bugs found + fixed)
- Healing research reviewed by code-reviewer agent (8 data errors found + fixed)
- Movement, Bonds, Story reviewed manually (clean)
- Tools, Status, Nourishment, Shelter, Fire, Threat reviewed manually (Nourishment summary table fixed)
- spiralDynamicsMatrix.json verified: 60 cells intact, all frontier/emerging cells updated, JSON valid

---

## Files Changed This Session

**New files:**
- `public/rule-break-matrix.html`
- `public/rule-break-radar.html`
- `public/data/spiralDynamicsMatrix.json` (updated with verified research data)
- `src/hooks/useBranchScoring.js`
- `src/components/BranchInsightCard.jsx`
- `src/components/BranchInsightCard.css`
- `docs/features/personal-monopoly-finder.md`
- `docs/features/phase3-spiral-dynamics-utilities.md`
- `docs/research/frontier-market-research-spec.md`
- `docs/research/frontier-healing.md`
- `docs/research/frontier-movement.md`
- `docs/research/frontier-bonds.md`
- `docs/research/frontier-story.md`
- `docs/research/frontier-tools.md`
- `docs/research/frontier-status.md`
- `docs/research/frontier-nourishment.md`
- `docs/research/frontier-shelter.md`
- `docs/research/frontier-fire.md`
- `docs/research/frontier-threat.md`
- `docs/content/frontier-insights-draft.md`
- `docs/session-handoff-2026-07-17-phase3-matrix.md`
- `Obsidian/Frameworks/Phase 3 × Spiral Dynamics Matrix.md`

**Modified files:**
- `public/rule-break-tree.html` (SD_TAGS + tooltip SD badge)
- `src/components/JourneyTab.jsx` (BranchInsightCard was mounted, later removed by another session)
