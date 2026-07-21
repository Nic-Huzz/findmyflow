# Phase 3 × Spiral Dynamics — Utility Specs

*Companion tools for the matrix at `public/rule-break-matrix.html`. Each utility plugs into existing product.*

---

## 1. SD Marketing Level Diagnostic

**What it does:** Identifies whether a creator is marketing at the wrong SD level for their product.

**The problem it solves:** A Yellow product described in Green language attracts Green customers who can't use it. A Green product described in Orange language attracts Orange customers who won't value it. Most creators never discover this mismatch.

**How it works:**

Step 1 — **Product Level Assessment** (5 questions):
- "Does your product include measurable outcomes?" (Orange)
- "Does your product build community or shared identity?" (Green)
- "Does your product include ritual, ceremony, or embodied practice?" (Purple)
- "Does your product include competition, rankings, or achievement markers?" (Red/Orange)
- "Does your product adapt its approach based on the person's state?" (Yellow)

Each yes = that SD level is activated. Count unique levels = product's SD range.

Step 2 — **Marketing Language Assessment** (analyse their actual copy):
- Look for efficiency/ROI language → Orange marketing
- Look for authenticity/community/inclusive language → Green marketing
- Look for systems/integration/contextual language → Yellow marketing
- Look for ritual/ancestral/tribal language → Purple marketing

Step 3 — **Mismatch Detection:**
- Product SD range vs. Marketing SD language
- If product is Yellow but marketing is Green: "You're underselling. Your marketing speaks to people who want belonging, but your product does something more sophisticated. The Green audience will feel confused when it's 'too much.' The Yellow audience will never find you."
- If product is Green but marketing is Orange: "You're attracting optimisers who will churn when they don't see metrics. Your actual value is in community and felt experience, but your funnel promises data."

**Where it plugs in:** After Remarkable Reach (narrative builder). The creator has identified their vehicle. This diagnostic checks whether their vehicle's LANGUAGE matches their product's SD level.

**Data needed:** Creator's marketing copy (scrape their website/social) + product feature inventory. Could use Zarlo AI analysis.

**Build complexity:** Medium. 5-question flow + language analysis. Could be a new section in the Creator Portal pipeline after Narrative Builder.

---

## 2. Two Worlds Matrix Extension

**What it does:** Replaces the vibes-based "describe old world / new world" step in Remarkable Flow with a data-driven framework selection.

**The problem it solves:** Creators currently invent their Two Worlds from scratch. Most describe surface-level differences ("the old way is hard, the new way is easy"). The matrix makes the Two Worlds STRUCTURAL: Old World = the SD level your industry is stuck at. New World = the next SD level up.

**How it works:**

Step 1 — **Branch Selection** (already happens via Scope Map diagnostic):
Creator is already positioned in a branch by the time they reach Remarkable Flow.

Step 2 — **Matrix Reveal:**
Show the creator their branch's SD timeline from the matrix. Highlight which cells are broken, active, and frontier.

"Your industry (Healing) is dominated by Orange thinking: drugs, data, measurable outcomes. The frontier is Green (whole-person healing). But Green has a problem: 'holistic' became a marketing word with no accountability. The NEXT break comes from Yellow: contextual routing. Right modality for the right wound."

Step 3 — **Two Worlds Autofill:**
- **Old World** = the assumption text from the dominant SD cell
- **New World** = the prediction text from the frontier/emerging SD cell
- Creator edits/personalises but starts from a structural foundation, not a blank page

Step 4 — **Historical Proof:**
Show 2-3 historical examples from the same branch where this SAME transition happened. "When Healing moved from Blue (institutional authority) to Orange (data-driven medicine), these people broke the assumption: Lister, Fleming, Salk. You're making the equivalent move from Orange to Yellow."

**Where it plugs in:** Replaces or enhances Step 4 (Two Worlds) in `RemarkableFlow.jsx`. The matrix data is already in the HTML page; it would need to be extracted into a JSON data file that both the tree page and the React app can import.

**Data needed:** The 60-cell matrix data (already exists in `rule-break-matrix.html`, needs extraction to `public/data/spiralDynamicsMatrix.json`).

**Build complexity:** Medium-High. Requires:
1. Extract matrix cell data to shared JSON
2. New "Matrix Reveal" component in Remarkable Flow
3. Auto-fill logic for Two Worlds based on branch + SD level
4. Historical proof lookup from tree node data

---

## 3. SD Integration Scorecard

**What it does:** Counts how many SD levels a creator's product activates. Sits alongside the Scale Score as a blow-up predictor.

**The problem it solves:** The Scale Score measures RETURN (ancestral alignment), BREAK (rule break strength), and TRIBAL (identity formation). But it misses WHY some products with high scores still don't blow up: they only speak to one SD audience. CrossFit (15/15 Scale Score) also scores 6/6 on SD Integration. BetterHelp (3/15 Scale Score) would score 1/6. The Integration Score explains the gap.

**How it works:**

**6 SD Activation Questions** (one per level):

| Level | Question | What a "yes" means |
|-------|----------|-------------------|
| Beige/Purple | "Does your product involve embodied/ritual practice?" | Ancestral activation: breathwork, fire, movement, ceremony |
| Red | "Does your product include competition, challenge, or individual achievement?" | Power drive: leaderboards, courage challenges, personal bests |
| Blue | "Does your product have structured programming, clear rules, or progression?" | Order: curriculum, levels, certifications, scheduled sessions |
| Orange | "Does your product track measurable outcomes?" | Achievement: metrics, scores, before/after data, streaks |
| Green | "Does your product build community and shared identity?" | Belonging: group experiences, shared language, support networks |
| Yellow | "Does your product adapt its approach based on context/state?" | Integration: different paths for different people, contextual routing |

**Scoring:**
- 1-2 levels: Limited reach. Your product speaks to one audience segment.
- 3-4 levels: Strong potential. You reach multiple audiences but have gaps.
- 5-6 levels: Blow-up architecture. Your product speaks to almost everyone.

**Calibration examples:**
- CrossFit: 6/6 (all levels active)
- Wim Hof Method: 5/6 (missing Blue — no structured progression/certification until recently)
- Peloton: 3/6 (Orange metrics, Red competition, Green community — missing Purple ritual, Blue progression, Yellow adaptation)
- BetterHelp: 1/6 (Orange only — clinical outcomes)
- Headspace: 3/6 (Purple meditation ritual, Orange streaks/metrics, Green — missing Red, Blue, Yellow)
- Vibe Rise: 6/6 (Beige/Purple nervous system + ritual, Red league + courage, Blue quest structure, Orange RP + capacity score, Green newsfeed + community, Yellow wound-depth routing)

**Where it plugs in:** New section in Scale Score diagnostic (`FacilitatorScore.jsx`). Could be a 4th pillar or a bonus multiplier applied to the total. Would also appear in the Creator Portal Playbook summary.

**Build complexity:** Low. 6-question flow with simple scoring. Data: just the 6 questions + scoring logic. Could ship as a standalone tool at `/try/sd-score` as a lead magnet.

---

## 4. Pricing Problem Visualisation

**What it does:** Maps Phase 3 products by branch, showing price accessibility vs. Phase 3 quality. Identifies the "class ceiling" per cell.

**The problem:** Phase 3 products consistently serve affluent early adopters. Grass-fed beef, retreats, cold plunges, breathwork workshops. The bottom 60% of the population is still deepening in Phase 2. Whoever cracks Phase 3 at mass-market prices wins the biggest market in the world.

**Visual concept:**

A scatter plot per branch:
- X axis: Price accessibility (free → $10K+)
- Y axis: Phase 3 quality (SD Integration Score or Scale Score)
- Each dot = a product
- The "class ceiling" is the horizontal line where products cluster: high quality, high price
- The opportunity zone is bottom-right: high quality, low price (empty)

**The per-branch class ceiling:**

| Branch | Premium Phase 3 Example | Price | Mass-Market Gap |
|--------|------------------------|-------|----------------|
| Movement | CrossFit membership | $150-250/mo | Ruck clubs (free), park workouts |
| Food | Regenerative farm box | $200-400/mo | No scaled affordable option |
| Healing | Breathwork retreat | $2-5K | YouTube breathwork (free but no community) |
| Bonds | Men's circle / retreat | $500-3K | Discord communities (free but shallow) |
| Status | Personal branding course | $1-5K | No affordable identity work |
| Shelter | Co-housing community | $500K+ buy-in | Almost nothing |
| Story | Live storytelling event | $30-100 | Podcasts (free, Phase 3 loop-back) |
| Fire | Off-grid setup | $20-50K | Candles ($12B market, unintentional Phase 3) |

**The pattern:** Podcasts and candles are accidental Phase 3 at mass-market prices. They succeeded BECAUSE they're cheap, not despite it. The next CrossFit-scale blow-up might not be a $200/mo gym. It might be a free app with a physical community anchor (this IS Vibe Rise's model).

**Build complexity:** Conceptual for now. Would need product/pricing research per branch. Could be a research exercise rather than an interactive tool. Best output: a single compelling visual for content/presentations.

---

## 5. Civilisation Dashboard (Timeline Mode)

**Concept:** A mode toggle on the Rule Break Tree that switches from the radial view to a linear timeline, with nodes colored by SD level instead of branch.

**What it reveals:** The civilisation-wide developmental transition from Orange to Green/Yellow. When you see all 10 branches on a timeline with SD coloring, the pattern jumps out: early nodes are Blue, the bulk is Orange, and the rightmost edge is turning Green/Yellow simultaneously across all branches.

**Technical approach:**

Option A — **D3 mode toggle on existing tree** (complex):
- Add a "Timeline" button to the tree's zoom controls
- On click, transition all nodes from radial (angle, radius) to linear (x = year, y = branch row)
- Re-color node circles from branch color to SD color (using SD_TAGS)
- Add frontier markers at the right edge of each branch row
- Animate the transition

Pros: dramatic visual transition, single page
Cons: significant D3 rework, must handle both layouts in same SVG

Option B — **Separate timeline section** on the radar page (simpler):
- Static or lightly interactive timeline
- Same data, different rendering
- No need to modify existing tree code

Pros: lower risk, can be built faster
Cons: no dramatic mode-switch moment

**Recommendation:** Start with Option B on the radar page. If it resonates, port to Option A on the tree as a v2.

**Key visual element:** A vertical line at "NOW" on the right edge, with frontier cells glowing. The visual story: "We are HERE in the civilisation transition. Almost every branch is crossing from Orange to Green/Yellow at the same moment in history."

---

## 6. Additional Prediction Methods

Beyond the matrix itself, these methods could help creators find rule breaks and personal monopolies:

### 6a. Assumption Age Index

**Principle:** Older assumptions are more ripe for breaking. The Rule Break Probability formula already includes "Assumption Age." Quantify it per frontier cell.

| Branch | Dominant Assumption Since | Age (years) | Pressure Rating |
|--------|--------------------------|-------------|-----------------|
| Threat-Blue | Standing armies (1617) | 409 | Extreme |
| Healing-Orange | Evidence-based medicine (1867) | 159 | Very high |
| Food-Orange | Industrial agriculture (1948) | 78 | High |
| Status-Orange | Achievement metrics (~1960s) | ~65 | High |
| Energy-Orange | Fossil fuel economics (~1960s) | ~65 | High |
| Story-Orange | Attention economy (2004) | 22 | Moderate |
| Tools-Orange | VC/SaaS metrics (2006) | 20 | Moderate |
| Bonds-Orange | Professional networking (2003) | 23 | Moderate |

**Use:** Sort frontier cells by Assumption Age. The oldest = most pressure = most imminent break. Threat-Blue at 409 years is staggeringly overdue.

### 6b. Counter-Break Detector

**Principle:** Every successful break creates its own backlash. The backlash IS the next opportunity.

| Original Break | Backlash (Counter-Break) | Status |
|---------------|------------------------|--------|
| Social media (Story-Green) | Digital detox, screen time limits | Growing |
| Fast fashion (Status-Orange) | De-influencing, slow fashion | Growing |
| Uber/gig economy (Movement-Orange) | Worker rights, co-ops | Active |
| Industrial food (Food-Orange) | Organic, ancestral diet | Mature |
| Pharma dominance (Healing-Orange) | Alternative medicine, breathwork | Mature |
| AI content (Story-Yellow) | "Made by humans" branding | Emerging |

**Use:** Track which recent breaks are generating visible counter-reactions. The counter-reaction is predictable AND the creator who names it first wins.

### 6c. Adjacent Possible Scanner

**Principle:** (Kauffman, already in the tree) Innovation is constrained to what's JUST become possible. New capabilities unlock frontier cells.

**Recent capability unlocks (2023-2026):**

| New Capability | Frontier Cells Unlocked |
|---------------|------------------------|
| LLM consumer AI (2022-23) | Tools-Yellow, Story-Yellow, Healing-Yellow |
| Psychedelic legalisation (2020-25) | Healing-Purple (returning), Healing-Yellow |
| Remote work normalisation (2020-23) | Shelter-Green, Bonds-Green, Movement-Green |
| Autonomous vehicle permits (2020-24) | Movement-Yellow |
| Climate legislation (IRA 2022) | Fire-Green, Shelter-Green |
| Creator economy infrastructure (2020-25) | Status-Green, Story-Green |

**Use:** When a new capability appears, immediately check which frontier cells it unlocks. First mover advantage in a freshly-unlocked cell = personal monopoly.

### 6d. Personal Monopoly Finder

**Principle:** A personal monopoly exists where YOUR unique combination of skills × problems × life experience meets an empty or frontier cell.

**How it works:**
1. From Flow Finder: identify creator's play-skills and problem categories
2. From matrix: identify which branch their skills map to
3. From Scale Score: identify which SD level they're operating at
4. Cross-reference: is there an empty/frontier cell at their branch × SD level?
5. If yes: "You're positioned at [Branch × SD Level]. Nobody else is here with your specific combination of [skills]. This is your personal monopoly."

**The power move:** Show the creator that their unique life experience (often the thing they think is a liability) is actually what positions them in an empty cell. A therapist who also does CrossFit is at Healing × Yellow + Movement × Green. A software engineer who does breathwork is at Tools × Yellow + Healing × Yellow. The INTERSECTION is the monopoly.

**Where it plugs in:** Career Clarity flow, or a new diagnostic in the Creator Portal. Uses existing Flow Finder data + matrix positioning.

### 6e. Geographic Arbitrage Map

**Principle:** Different countries are at different SD levels per branch. A creator can be early in one geography by importing an innovation from another geography's more advanced SD position.

Examples:
- CrossFit (US → global): Movement at Yellow, exported to countries still at Orange
- Wim Hof (Netherlands → global): Healing at Yellow, exported globally
- Meditation apps (US/UK → global): Healing-Green, exported to countries at Healing-Blue

**Use:** If a Phase 3 product works in one geography, look for geographies where that branch is at an earlier SD level. First mover advantage = import the break before a local version emerges.

### 6f. Remarkability Half-Life Map

**Principle:** (From Rule Break Ingredients) Vehicle breaks have shorter half-lives than results breaks. Map which frontier cells have recent vehicle breaks (window closing) vs. results breaks (window durable).

| Frontier Cell | Type of Break Available | Half-Life |
|---------------|------------------------|-----------|
| Healing-Green | Vehicle (breathwork on Instagram) | ~5 years, closing |
| Healing-Yellow | Results (polyvagal-informed routing) | ~30+ years, wide open |
| Story-Yellow | Vehicle (AI-generated content) | ~3 years, closing fast |
| Food-Green | Results (regenerative agriculture yields) | ~20+ years, wide open |
| Status-Green | Vehicle (de-influencing as content format) | ~2 years, nearly closed |

**Use:** Steer creators toward results breaks in frontier cells, not vehicle breaks. The vehicle window closes fast; the results window stays open for decades.

---

## 7. Implementation Priority

| Utility | Impact | Build Effort | Ship As | Priority |
|---------|--------|-------------|---------|----------|
| SD Integration Scorecard (#3) | High | Low | `/try/sd-score` lead magnet | **Sprint 1** |
| Two Worlds Matrix Extension (#2) | High | Medium-High | Remarkable Flow enhancement | **Sprint 2** |
| SD Marketing Diagnostic (#1) | Medium-High | Medium | Creator Portal pipeline step | **Sprint 2** |
| Civilisation Dashboard (#5) | High (content) | Medium | Radar page section, then tree mode | **Sprint 2** |
| Personal Monopoly Finder (#6d) | Very High | Medium | Career Clarity enhancement | **Sprint 3** |
| Pricing Problem (#4) | Medium | Low (research) | Content / presentation visual | **Sprint 3** |
| Counter-Break Detector (#6b) | Medium | Low | Content engine | **Sprint 3** |
| Assumption Age Index (#6a) | Medium | Low | Matrix page enhancement | **Sprint 3** |
| Adjacent Possible Scanner (#6c) | Medium | Medium | Radar page section | **Sprint 4** |
| Geographic Arbitrage (#6e) | Low-Medium | High (research) | Content / consulting tool | **Backlog** |
| Remarkability Half-Life (#6f) | Medium | Medium | Scale Score enhancement | **Backlog** |
