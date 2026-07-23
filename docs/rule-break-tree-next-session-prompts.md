# Rule Break Tree — Next Session Prompts

These are ready-to-paste prompts for the next agent session. Use them in order (1 is blocking, rest are independent).

---

## Prompt 1: Merge 12-Branch Data into Source of Truth

> Read `docs/session-handoff-2026-07-20-rule-break-tree-12-branches.md` first. This is a merge task, not a creative task.
> 
> The Rule Break Tree was expanded from 10 to 12 branches (Play + Sleep added as primals, Exchange + Intimacy as Bonds sub-branches). All new node data was researched, fact-checked, and corrected last session. The data exists in two pre-computed files — USE THEM, do not reinvent or invent your own nodes.
> 
> **Source of truth:** `src/lib/ruleBreakTreeData.js` (2,503 lines, 390 existing nodes, 70+ sub-branches)
> **Production component:** `src/pages/RuleBreakTree.jsx` (route: `/rule-break-tree`, has timelapse/play button)
> **New nodes to merge in:** `docs/rule-break-tree-new-nodes-extract.js` (312 lines of exact JS objects)
> **Dedup map:** `docs/rule-break-tree-dedup-map.txt` (77 nodes to ADD, 123 overlap, 342 keep untouched)
> 
> **Steps:**
> 1. Read `ruleBreakTreeData.js` in full — understand the structure (PRIMALS, PRIMAL_INDUSTRIES, INDUSTRIES with sub-branches, bridges, industryNodes, branchLinks, mergeLinks)
> 2. Apply structural changes from the handoff doc's "Merge Cheat Sheet" section (S constant, PRIMALS array, PRIMAL_INDUSTRIES, INDUSTRIES + baseAngle shifts for fire/healing/threat sub-branches)
> 3. Read `docs/rule-break-tree-new-nodes-extract.js` and paste the 77 new nodes into industryNodes, deduplicating against the 123 that already exist (check the dedup map)
> 4. Add branch links for the 4 new chains (play, sleep, exchange, intimacy) + update existing chains where gap-fill nodes were inserted
> 5. Add new merge links from the HTML prototype
> 6. Update `RuleBreakTree.jsx`: change `MIN_YEAR` from 1400 to 1100
> 7. Verify with `node -e` syntax checks — balanced braces, all branch link IDs exist, no duplicate IDs, no invalid mergeWith values
> 
> **CRITICAL:** Do NOT invent nodes. Do NOT rewrite descriptions. The exact JS objects are in the extract file. Copy them. The previous session's agent went rogue twice by inventing its own data — that's why the extract file exists.
> 
> After the merge, run `npm run dev` and open `localhost:5173/rule-break-tree` to verify the timelapse works with 12 branches.

---

## Prompt 2: Design Play + Sleep Sub-Branches

> Read `src/lib/ruleBreakTreeData.js` and study the sub-branch pattern. Every existing primal has 6-7 sub-branches (e.g., Movement has: Endurance, Strength, Flexibility, Temperature, Outdoor, Dance. Healing has: Traditional, Psychedelic, Somatic, Mind-Body, Mental Health, Energy). Each sub-branch has 3-6 nodes tracing its own rule-break history.
> 
> Design sub-branches for the two NEW primals: Play and Sleep. Follow the exact same pattern.
> 
> **Play sub-branches** (candidates to evaluate):
> - Board/Tabletop Games (Senet → Chess → Monopoly → D&D → modern board game renaissance)
> - Sport / Athletic Competition (Olympics → organised sport → extreme sport → adaptive sport)
> - Digital Games (Pong → consoles → MMOs → mobile → VR → AI)
> - Gambling / Chance (dice → casinos → online gambling → prediction markets → loot boxes)
> - Music-Making / Performance (instruments → recording → karaoke → DAWs → AI composition)
> - Creative Making / Craft (pottery → woodworking → maker movement → 3D printing → digital creation)
> 
> **Sleep sub-branches** (candidates to evaluate):
> - Dream Science (dream temples → Freud → REM discovery → lucid dreaming → dream incubation)
> - Sleep Medicine (sleeping pills → CPAP → sleep clinics → CBT-I → precision sleep medicine)
> - Circadian / Chronobiology (sundials → electric light disruption → melatonin → circadian Nobel → chronotype optimization)
> - Sleep Technology (mattresses → sleep tracking → smart beds → Eight Sleep → AI coaching)
> - Rest Culture (biphasic sleep → siesta → hustle culture → sleep movement → sleep tourism)
> - Consciousness States (meditation → anaesthesia → sensory deprivation → polyphasic → hypnagogia tech)
> 
> For each sub-branch, produce:
> 1. Industry entry for INDUSTRIES object (with primal, color, label, baseAngle, subBranch: true)
> 2. 4-6 nodes following the standard format: `{ id, label, year, branch, assumption, ruleBreak, who }`
> 3. Bridge node if needed
> 4. Branch links (chronological chain)
> 5. Any merge links to other branches
> 
> Reference the existing sub-branch nodes in the file for tone, length, and format. The assumption/ruleBreak text should be concise (1-2 sentences max each). Historically accurate dates and attributions.
> 
> The key design constraint: sub-branches should represent genuinely DIFFERENT innovation trajectories within the primal, not just chronological slices. Each sub-branch answers "what KIND of [Play/Sleep] innovation is this?" not "what ERA of [Play/Sleep] is this?"

---

## Prompt 3: Finalize the Rule Break Probability Formula

> Read the Obsidian note at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md` — specifically the "Experience Compression" and "Outsider Proximity Refined" sections.
> 
> The current formula is a TWO-FORMULA model:
> ```
> Phase 2 Break = Assumption Age x Experience Compression x Outsider Proximity x Adjacent Branch Unlock
> Phase 3 Break = Phase 2 Score x Reversion Pressure x Baseline Drift
> ```
> 
> With a sub-formula:
> ```
> Reversion Pressure = Baseline Drift x Measurement Accessibility x Cultural Stage Readiness
> ```
> 
> **Open questions the user wants resolved:**
> 
> 1. **Reversion Pressure and Baseline Drift appear in BOTH the Phase 3 formula AND the sub-formula.** This creates a circular reference or double-counting. If Phase 3 = Phase 2 x Reversion Pressure x Baseline Drift, and Reversion Pressure already includes Baseline Drift, then Drift is counted twice. Resolve this — either Drift lives in the sub-formula only, or the Phase 3 formula needs restructuring.
> 
> 2. **Is Outsider Proximity a variable of the BREAK or the PERSON?** The user noted: "for the user it's what patterns am I seeing in a different field that I can apply." The rope is tight regardless of whether an outsider is nearby. The outsider determines WHO cuts it, not WHETHER it gets cut. Should this be removed from the probability formula (which predicts WHETHER a break happens) and moved to a separate "WHO breaks it" model?
> 
> 3. **Cultural Stage Readiness and Measurement Accessibility** — the user said these are interconnected with SD stages. A Blue-stage culture literally cannot perceive Green-stage compressions. And measurement tools (like sleep trackers revealing sleep quality) create the consciousness of drift that generates pressure. How do these interact? Are they multiplicative (both must be present) or additive (either can trigger)?
> 
> 4. **Can we retrodict?** Test the formula against 5 historical rule breaks from the tree: (a) Tesla/EVs (Movement), (b) iPhone (Tools), (c) Organic food movement (Nourishment Phase 3), (d) Uber (Movement × Tools), (e) Bitcoin (Exchange × Fire). Score each variable 1-10 and see if the formula predicts the ones that were explosive vs incremental.
> 
> Produce: a final clean formula with clear variable definitions, the retrodiction test results, and save updated version to the Obsidian note (append, never overwrite existing content).

---

## Prompt 4: Design SD Overlay for the Tree

> Read these files for context:
> - Obsidian: `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md`
> - `public/rule-break-matrix.html` (Phase 3 x Spiral Dynamics matrix — existing companion viz)
> - `src/lib/ruleBreakTreeData.js` (the tree data)
> 
> **Task:** Design how Spiral Dynamics stages overlay onto the Rule Break Tree visualization.
> 
> The insight from the MasterMind Council session: each SD transition IS itself a meta-rule-break that cascades across every branch simultaneously. Purple→Red broke "identity must be tribal." Blue→Orange broke "truth comes from authority." Each transition expands the range of experience available on every branch.
> 
> **Key insight from the user:** "SD stage determines whether people can PERCEIVE the compression." Blue can't see Green's compressions. Orange can't see Yellow's. The rope is invisible until you're at the right stage to see it.
> 
> **Design options to evaluate:**
> 1. **Concentric rings** on the radial tree — each ring represents an SD transition era. Nodes inside a ring were innovations driven by that SD stage's values. Visual: colored rings behind the tree.
> 2. **Node color-coding** — each node gets a secondary SD color badge. The existing `SD_TAGS` in `ruleBreakTreeData.js` already has this data for some nodes.
> 3. **Filter mode** — toggle SD stages on/off to see which innovations were driven by which consciousness level. "Show me only Orange innovations" → most of 1700-2000 lights up.
> 4. **Animation** — the timelapse scrubber could show SD stage transitions as the background color shifts. Beige→Purple→Red→Blue→Orange→Green→Yellow as years advance.
> 
> Produce: a design spec with mockup HTML (standalone, like the layout mockups), showing the chosen approach. Include specific SD stage assignments for at least 20 representative nodes across different branches. Reference the existing `SD_TAGS` data in `ruleBreakTreeData.js` if present.

---

## Prompt 5: Design Experience Compression Calculator (Product Feature)

> Read these files for context:
> - Obsidian: `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md` — specifically "Experience Compression" and formula sections
> - `src/lib/ruleBreakTreeData.js` — the tree data (branches, nodes, merges)
> - `src/components/CreatorHome/CreatorHomeV2.jsx` — the Creator Portal home page
> - `CLAUDE.md` — project overview, especially the Creator Playbook Pipeline section
> 
> **Context:** Vibe Rise's Creator Portal helps experience creators (workshop hosts, retreat leaders, facilitator) identify and build their personal monopoly. The Rule Break Tree's formula predicts where the next rule break in any branch is likely to happen.
> 
> **Task:** Design an interactive "Experience Compression Calculator" for the Creator Portal that:
> 
> 1. Asks the creator which branch their work lives on (from the 12 primals + sub-branches)
> 2. Walks them through scoring each formula variable for their specific domain:
>    - Assumption Age: "What assumption in your field has gone unchallenged the longest?"
>    - Experience Compression: "How much better could the experience be? Can people feel the gap?"
>    - Outsider Proximity: "What patterns from other fields could apply here?"
>    - Adjacent Branch Unlock: "What new capability from another branch just became available?"
>    - Baseline Drift: "How far has your field drifted from what humans are designed for?"
> 3. Outputs a "Rule Break Opportunity Score" with specific predictions about where the break will happen
> 4. Connects to their existing Scale Diagnostic and Remarkable Results data
> 
> Write in plain language a 12-year-old would understand (per CLAUDE.md writing style). No jargon. No em dashes.
> 
> Produce: a feature spec (save to `docs/features/experience-compression-calculator.md`), a flow design (screens + transitions), and initial React component structure.

---

## Prompt 6: Draft "Money Was Always Energy" Content

> Read the Obsidian note at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md` — specifically the "Money Was Always Energy" section.
> 
> Also read the user's voice profile:
> ```sql
> SELECT * FROM voice_profiles WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4';
> ```
> On Supabase project: qlwfcfypnoptsocdpxuv
> 
> And read `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/People/Nic.md` for voice/style reference.
> 
> **Task:** Draft a long-form content piece (essay/thread/newsletter) arguing:
> 
> 1. Money was never its own thing. It was always a proxy for human energy expenditure.
> 2. The chain: barter → coins → paper → fiat → Bitcoin (reconnects to energy) → AI (makes the proxy unnecessary)
> 3. Bitcoin's real innovation wasn't decentralisation — it was making the money-energy link explicit (proof of work = money IS electricity)
> 4. AI completes the picture: energy in → value out, no human labour needed. Money was the abstraction layer between human energy and value. When AI replaces human energy, the abstraction has nothing to abstract.
> 5. This is a Phase 3 Reversion: money drifted so far from energy that the abstraction became what people worship. AI cuts through it.
> 
> Sources to cite: Musk ("Energy is the true currency," Kamath podcast Dec 2025), Fuller ("kilowatt-hours as currency," 1967), Soddy (real wealth = energy transforming materials, 1926).
> 
> **Format:** Write 3 versions:
> - Instagram carousel script (10 slides, punchy, visual)
> - Long-form essay (1500-2000 words, for newsletter/blog)
> - Reddit post for r/findapath or r/economics (conversational, no AI slop — see memory `feedback_reddit_voice.md` for anti-patterns)
> 
> **Voice rules:** No em dashes. Write so a 12-year-old understands. Short sentences. One insight per paragraph. Messy, real, not polished. See Huzz's voice profile for catchphrases and anti-patterns.

---

## Prompt 7: Draft "AI = Tools x Fire" Content

> Read the Obsidian note at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md` — specifically the "AI = Tools x Fire Merge" section.
> 
> Also read the user's voice profile (same as Prompt 6 instructions).
> 
> **Task:** Draft a content piece arguing:
> 
> 1. There are two types of technology: Tools (you direct them, they obey) and Fire/Energy (you harness them, they have their own nature)
> 2. Every previous tool was deterministic — hammer, computer, phone. Every Fire innovation was probabilistic — fire, steam, electricity, nuclear.
> 3. AI is the first TOOL that behaves like FIRE. It has emergent behavior. You negotiate with it, not direct it.
> 4. This explains why AI anxiety follows the exact same pattern as every Fire innovation: "it could burn the village" → "the boiler could explode" → "it could electrocute you" → "it could destroy civilisation" → "it could replace us"
> 5. What makes AI the deepest merge: previous Fire innovations had their own nature in the PHYSICAL domain. AI has its own nature in the COGNITIVE domain. It's Fire on Tools' home turf.
> 6. The pattern: civilisation panics, then adapts, then can't imagine life without it. We're in the panic phase.
> 
> **Format:** Write 3 versions:
> - Instagram carousel script (10 slides)
> - Long-form essay (1500-2000 words)
> - Twitter/X thread (15-20 tweets, punchy, each tweet standalone)
> 
> **Voice rules:** Same as Prompt 6. No em dashes. 12-year-old language. Short. Real. Not polished.

---

## Prompt 8: Feed Phase 3 Reversion Data to Agent

> Read the Obsidian note at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md` and the Rule Break Tree data at `src/lib/ruleBreakTreeData.js`.
> 
> **Context:** Phase 3 Reversions are rule breaks where an industry has drifted so far from what the human vessel was designed for that the next break uses modern capability to recover what was natural. These are the highest-probability opportunities for experience creators.
> 
> **Task:** Identify and score the top 20 Phase 3 reversion opportunities across all 12 branches. For each:
> 
> 1. **Branch + sub-branch** it sits on
> 2. **What drifted** — the baseline human experience that got compressed
> 3. **How far** — Baseline Drift score (1-10)
> 4. **Measurement tools available?** — can people see the drift? (1-10)
> 5. **Cultural readiness** — is the dominant culture at an SD stage that can perceive this as a problem? (1-10)
> 6. **Adjacent Branch Unlock** — what new capability from another branch makes the reversion possible now?
> 7. **Who's already building it** — any existing companies/creators working on this reversion?
> 8. **Vibe Rise relevance** — does this connect to what Huzz is building? (experience creators, workshops, retreats, healing, play)
> 
> Focus especially on reversions relevant to experience creators: Sleep (sleep retreats, dream workshops), Play (play reintegration, gamified healing), Healing (plant medicine, somatic therapy), Bonds (community revival, co-living), Nourishment (food as medicine, ancestral diet workshops), Movement (natural movement, dance, cold exposure).
> 
> Output as a ranked table + save to Obsidian at `Frameworks/Phase 3 Reversion Opportunities.md`.
