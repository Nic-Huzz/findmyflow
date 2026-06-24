# Wheel Taxonomy Audit

**Date**: 2026-04-12
**File**: `src/lib/wheelTaxonomy.js` (1,169 lines, 25 exports)
**Status**: Post-V2 overhaul (Skills 12→10, Problems 12→12 new IDs, Personas unchanged)

---

## Section 1: Import Usage Table

### Core Segment Arrays

| Export | Active Importers | Used? |
|--------|-----------------|-------|
| SKILLS_SEGMENTS | FlowFinderSkills, FlowFinderExplainer, FlowReportCard, LibraryOfAnswers, WheelDemo, CuriosityCompassFlow, PlayListFinderFlow, LetsPlayFlow, SelfTestFlow, OfferBuilderFlow, LetsPlayInput, PlaySkillsOnboarding, QuickCapture (×2) | Yes (14 files) |
| PROBLEM_SEGMENTS | FlowFinderProblems, FlowFinderExplainer, FlowReportCard, LibraryOfAnswers, WheelDemo, LetsPlayFlow, SelfTestFlow, LetsPlayInput, PersonaSelectionFlow, QuickCapture (×2) | Yes (11 files) |
| PERSONA_SEGMENTS | FlowFinderExplainer, FlowReportCard, LibraryOfAnswers, WheelDemo, PersonaSelectionFlow, PersonaIdentifierFlow, QuickCapture (×2), wheelAlignment | Yes (9 files) |

### Legacy Compat Layer

| Export | Active Importers | Used? |
|--------|-----------------|-------|
| LEGACY_SKILL_ID_MAP | (internal to resolveSkillId) | Internal |
| resolveSkillId | PlayListFinderFlow, wheelAlignment, skillProductMapping | Yes (3) |
| findSkillSegment | CuriosityCompassFlow, PlaySkillsOnboarding, LetsPlayInput, OfferBuilderFlow, LetsPlayFlow, SelfTestFlow, wheelAlignment, PlayListTab, MobilePlaylistPicker | Yes (9) |
| LEGACY_PROBLEM_ID_MAP | (internal to resolveProblemId) | Internal |
| resolveProblemId | wheelAlignment | Yes (1) |
| findProblemSegment | wheelAlignment | Yes (1) |

### Ring/Dimension Systems

| Export | Active Importers | Used? |
|--------|-----------------|-------|
| PROFICIENCY_RINGS | FlowFinderSkills, FlowFinderExplainer, FlowReportCard, LibraryOfAnswers, PlayListFinderFlow, WheelPicker, wheelAlignment | Yes (7) |
| PROBLEMS_PROFICIENCY_RINGS | FlowFinderProblems, FlowReportCard, LibraryOfAnswers, PersonaSelectionFlow, WheelPicker, wheelAlignment | Yes (6) |
| JOURNEY_STAGES | FlowFinderPersona, FlowReportCard, LibraryOfAnswers, WheelDemo, PersonaSelectionFlow, PersonaIdentifierFlow, WheelPicker, wheelAlignment | Yes (8) |
| ROLES | WheelDemo only | Barely (1) |
| PROBLEM_TYPES | WheelDemo only | Barely (1) |
| ENERGY_SOURCES | 0 active (archive only) | **Dead** |
| ENGAGEMENT_DEPTH | 0 active (archive only) | **Dead** |
| SKILL_MATURITY | 0 active (archive only) | **Dead** |

### Feature Mapping Data

| Export | Active Importers | Used? |
|--------|-----------------|-------|
| FEATURE_ARCHETYPES | 0 | **Dead** |
| DOMAIN_FEATURE_MAP | 0 | **Dead** (also uses OLD problem IDs) |
| PROBLEM_TYPE_FEATURE_MAP | 0 | **Dead** |

### Helper Functions

| Export | Active Importers | Used? |
|--------|-----------------|-------|
| getSegmentById | useHeroProfile | Yes (1) |
| getSegmentsForWheel | 0 active | **Dead** |
| getDimensionsForWheel | 0 | **Dead** |
| getCombinedIdentity | 0 active | **Dead** |
| getClassificationPrompt | 0 | **Dead** |

---

## Section 2: Dead Code List

**8 exports, ~250 lines, zero risk to remove:**

| Export | Lines | Why Dead |
|--------|-------|----------|
| ENERGY_SOURCES | ~15 | Archive-only. Bonus dimension for Skills wheel never shipped. |
| ENGAGEMENT_DEPTH | ~20 | Archive-only. Bonus dimension for Persona wheel never shipped. |
| SKILL_MATURITY | ~20 | Archive-only. Superseded by PROFICIENCY_RINGS. |
| FEATURE_ARCHETYPES | ~12 | Planned product-recommendation feature never built. |
| DOMAIN_FEATURE_MAP | ~15 | Never imported. Also uses OLD problem IDs (physical_vitality etc.) making it doubly dead. |
| PROBLEM_TYPE_FEATURE_MAP | ~10 | Never imported. |
| getDimensionsForWheel() | ~15 | References dead exports (ROLES, ENERGY_SOURCES, ENGAGEMENT_DEPTH). Never called. |
| getClassificationPrompt() | ~20 | AI classification prompt builder. Feature never shipped. |

**3 more exports are borderline:**

| Export | Status | Notes |
|--------|--------|-------|
| getSegmentsForWheel() | Archive-only | Used internally by getSegmentById, so keep if getSegmentById stays |
| getCombinedIdentity() | Archive-only | Generates "The Storyteller Body Whisperer" statements. Could be useful but nobody calls it. |
| ROLES | WheelDemo only | 5 role archetypes. Only rendered in WheelDemo page. |
| PROBLEM_TYPES | WheelDemo only | 6 problem type dimensions. Only rendered in WheelDemo page. |

---

## Section 3: Stale References

### CRITICAL: 4 files still use PROBLEM_SEGMENTS.find() directly

These files bypass the compat layer. If a user has old problem IDs in DB, these lookups will return `undefined`:

| File | Pattern | Fix |
|------|---------|-----|
| LetsPlayInput.jsx | `PROBLEM_SEGMENTS.find(p => p.id === ...)` | Replace with `findProblemSegment(id)` |
| LetsPlayFlow.jsx | `PROBLEM_SEGMENTS.find(p => p.id === ...)` | Replace with `findProblemSegment(id)` |
| SelfTestFlow.jsx | `PROBLEM_SEGMENTS.find(p => p.id === ...)` | Replace with `findProblemSegment(id)` |
| PersonaSelectionFlow.jsx | `PROBLEM_SEGMENTS.find(s => s.id === ...)` | Replace with `findProblemSegment(id)` |

### CRITICAL: 2 files have hardcoded OLD problem IDs (not importing wheelTaxonomy)

| File | Issue |
|------|-------|
| `src/lib/mindSpaceMapper.js` | SEGMENT_DISPLAY object (lines ~27-38) maps old IDs like `physical_vitality`, `mental_wellbeing` etc. to display names. Needs full rewrite with new IDs. |
| `src/lib/zarlo/zarloEngine.js` | Problem keywords mapping (lines ~341-353) uses old IDs for AI intent matching. Needs update to new IDs. |

### STALE: DOMAIN_FEATURE_MAP uses old problem IDs

The keys in `DOMAIN_FEATURE_MAP` are all old IDs (`physical_vitality`, `mental_wellbeing`, etc.). Since the export is dead anyway, this doesn't break anything, but it should be deleted rather than updated.

### wheelAlignment.js: Properly updated

wheelAlignment.js correctly uses `findProblemSegment()` and `resolveProblemId()` throughout. SKILLS_TO_PROBLEMS, PROBLEMS_TO_PERSONAS, and SKILLS_TO_PERSONAS mappings need verification that they use new problem IDs (kids_deserved_better etc.), not old ones.

---

## Section 4: Problems + Personas Assessment

### Problems: Already got the same treatment as Skills

The V2 overhaul already delivered:
- 12 new emotionally-grounded categories (replacing clinical domain-based ones)
- Placemakes on every segment (4-5 each, 53 total)
- Legacy compat layer (LEGACY_PROBLEM_ID_MAP + resolveProblemId + findProblemSegment)
- Lost `sphere`, `exampleNiches`, `aspirationalTitle` fields (replaced by the placemakes approach)

### Personas: Not yet treated

Current state:
- 12 categories with `aspirationalTitle`, `coreDrive`, `whatTheySeeking`, `yourRole`
- No placemakes
- No legacy compat needed (IDs unchanged)

**Should Personas get placemakes?** Probably not urgently. The existing `coreDrive`/`whatTheySeeking`/`yourRole` fields serve a similar inspirational purpose. Personas describe *who you serve*, not *what you do*, so action-oriented "makings" don't map as naturally.

**Should Personas be consolidated?** No obvious overlap. All 12 are distinct archetypes. Unlike Skills (where clarifying/analyzing/synthesizing overlapped) there's no merge case.

### Field comparison across wheels

| Field | Skills | Problems | Personas |
|-------|--------|----------|----------|
| id, displayName | Yes | Yes | Yes |
| tagline | Yes | Yes | Yes |
| keywords | Yes | Yes | Yes |
| recognitionPhrases | Yes | Yes | Yes |
| color, icon | Yes | Yes | Yes |
| placemakes | Yes (5 avg) | Yes (4-5 avg) | No |
| aspirationalTitle | Yes | No (removed in V2) | Yes |
| exampleJobs | Yes | No | No |
| valueCreated | Yes | No | No |
| coreDrive | No | No | Yes |
| whatTheySeeking | No | No | Yes |
| yourRole | No | No | Yes |

---

## Section 5: Recommended Cleanup Actions

### 1. Remove 8 dead exports (~250 lines)
**Risk**: Zero
**Files**: wheelTaxonomy.js only
**Approval**: No

Remove: ENERGY_SOURCES, ENGAGEMENT_DEPTH, SKILL_MATURITY, FEATURE_ARCHETYPES, DOMAIN_FEATURE_MAP, PROBLEM_TYPE_FEATURE_MAP, getDimensionsForWheel, getClassificationPrompt.

Also remove getCombinedIdentity (archive-only consumer).

### 2. Fix 4 files using PROBLEM_SEGMENTS.find() directly
**Risk**: Low (straightforward find→findProblemSegment swap)
**Files**: LetsPlayInput.jsx, LetsPlayFlow.jsx, SelfTestFlow.jsx, PersonaSelectionFlow.jsx
**Approval**: No (mechanical fix, no behavior change for new IDs)

### 3. Update hardcoded old problem IDs in 2 files
**Risk**: Medium (need to understand how these mappings are used)
**Files**: mindSpaceMapper.js, zarloEngine.js
**Approval**: Yes (needs review of what these mappings do before rewriting)

### 4. Verify wheelAlignment.js mapping tables use new problem IDs
**Risk**: Medium (alignment calculations could silently break)
**Files**: wheelAlignment.js
**Approval**: Yes (verify before changing)

### 5. Audit ring/proficiency imports across ~8 files
**Risk**: Medium-high (user said "we no longer use the three levels" but 7-8 files still import them)
**Files**: FlowFinderSkills, FlowFinderProblems, FlowFinderExplainer, FlowReportCard, LibraryOfAnswers, WheelPicker, PlayListFinderFlow, PersonaSelectionFlow, PersonaIdentifierFlow, FlowFinderPersona, wheelAlignment
**Approval**: Yes (need to check each consumer to see if ring data is rendered in UI or just imported)

### 6. Evaluate WheelDemo.jsx for deletion
**Risk**: Medium
**Files**: WheelDemo.jsx, AppRouter.jsx, wheelTaxonomy.js
**Approval**: Yes (is WheelDemo user-facing or dev-only?)

If deleted, ROLES and PROBLEM_TYPES can also be removed from wheelTaxonomy.js.

---

## Summary

| Metric | Count |
|--------|-------|
| Total exports | 25 |
| Dead exports (safe to remove) | 8-9 (~250 lines) |
| Active consumer files | ~22 |
| Files with stale PROBLEM_SEGMENTS.find() | 4 |
| Files with hardcoded old problem IDs | 2 |
| Ring exports still imported despite "no tiers" | 3 (by 7-8 files each) |
