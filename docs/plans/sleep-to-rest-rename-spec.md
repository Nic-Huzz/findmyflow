# Sleep → Rest Rename Spec + Awareness Trunk

## Decision

The 12th branch of the Rule Break Tree is renamed from **Sleep** to **Rest**.

**Rest** = the vessel in receptive mode. Sleep, stillness, recovery, dreams, non-doing.

**Awareness** becomes the conceptual CENTER of the tree (the trunk), not a 12th branch. All branches radiate from Awareness. The vessel's capacity to experience is the prerequisite for all domains.

### Why Rest over Sleep
- Anglo-Saxon, one syllable, a child knows it
- Broader than Sleep: includes meditation, stillness, recovery, the "soft eyes by the fire" state
- Passes the "point at it" test: someone resting on a couch, eyes closed in meditation, lying in savasana
- The Phase 3 compression thesis still holds: rest has been systematically devalued ("I'll sleep when I'm dead")

### Why Awareness as trunk, not branch
- Awareness is the CONTAINER for experience, not a domain of experience (Wilber's insight)
- Every branch requires awareness to function. You can't move, eat, play, or heal without being aware.
- Activities like meditation, psychedelics, flow, and NLP FEED the trunk from multiple branches. They're merge points, not sub-domains.
- MasterMind Council was unanimous: Awareness fails as a branch name (too abstract, too Latinate, breaks the phonetic pattern)

### Merge-to-trunk activities
These are activities that strengthen the vessel's core awareness capacity. They live on their home branch but have conceptual merge lines to the center:

| Activity | Home Branch | Trunk Connection |
|----------|-----------|-----------------|
| Passive meditation (NSDR, Yoga Nidra) | Rest | Directly trains receptive awareness |
| Active meditation (Vipassana, Zen, TM) | Healing (mind-body) | Trains sustained attention |
| Psychedelics | Healing (psychedelic) | Temporarily expands awareness range |
| Flow states | Cross-branch quality | Peak awareness during activity |
| Lucid dreaming | Rest (dreams) | Active awareness within sleep |
| NLP / reframing | Story x Healing merge | Shifts the awareness lens |
| Breathwork (non-therapeutic) | Rest (or Healing somatic) | Regulates awareness state |
| Sensory deprivation / float tanks | Rest | Strips input to reveal baseline awareness |

---

## Phase 1: Rename (Mechanical)

### Labels to change in `src/lib/ruleBreakTreeData.js`

| Current | New |
|---------|-----|
| PRIMALS: `id: 'sleep'`, `label: 'Sleep'` | `id: 'rest'`, `label: 'Rest'` |
| PRIMALS desc | `'Sleep, stillness, recovery, surrender. The vessel in receptive mode.'` |
| Bridge: `id: 'b-sleep'`, `label: 'Dream\nTemples'` | `id: 'b-rest'`, `label: 'Dream\nTemples'` (keep label, it still works), `primal: 'rest'`, `branch: 'rest'` |
| PRIMAL_INDUSTRIES: `sleep: [...]` | `rest: [...]` |

### INDUSTRIES keys to rename

| Current Key | New Key |
|------------|---------|
| `sleep` | `rest` |
| `sleep-dream` | `rest-dream` |
| `sleep-medicine` | `rest-sleep` (the sleep-specific medicine sub-branch) |
| `sleep-circadian` | `rest-circadian` |
| `sleep-tech` | `rest-tech` |
| `sleep-rest` | `rest-culture` (was "Rest Culture", avoid `rest-rest`) |
| `sleep-states` | `rest-states` |

### Node IDs to rename (~42 nodes)

All trunk nodes: `sleep-1100` → `rest-1100`, `sleep-1652` → `rest-1652`, etc. (12 trunk nodes)

All sub-branch nodes: `sub-dream-*`, `sub-sleepmedicine-*`, `sub-circadian-*`, `sub-sleeptech-*`, `sub-rest-*`, `sub-states-*` (30 sub-branch nodes)

Note: sub-branch node IDs use `sub-` prefix so they won't conflict. Only the `branch` field and any cross-references need updating.

### Other references to update

- All `branchLinks` containing sleep node IDs
- All `mergeLinks` with `from`/`to` pointing to sleep nodes
- All `mergeWith: 'sleep'` or `mergeWith: 'sleep-*'` values on nodes
- PILL_CONFIG entries
- Bridge `primal` and `branch` fields

### In `src/pages/RuleBreakTree.jsx`

- No changes expected (component reads from data, doesn't hardcode branch names)

### Origin node

- If the visualization has a center label, update it to "Awareness" or "The Vessel" or "Human Experience" (design decision)

---

## Phase 2: Sub-Branch Restructure

### Current sub-branches (evaluate fit under Rest)

| Current Name | Current ID | Fits Rest? | Proposed Name Under Rest |
|-------------|-----------|-----------|------------------------|
| Dream Science | `sleep-dream` | Yes, perfectly | Dream Science (`rest-dream`) |
| Sleep Medicine | `sleep-medicine` | Yes, specifically about sleep disorders | Sleep Science (`rest-sleep`) |
| Circadian Science | `sleep-circadian` | Yes, biological rhythms | Circadian Rhythm (`rest-circadian`) |
| Sleep Technology | `sleep-tech` | Yes, expanding to rest tech | Rest Technology (`rest-tech`) |
| Rest Culture | `sleep-rest` | Yes, core of the branch | Rest Culture (`rest-culture`) |
| Consciousness States | `sleep-states` | Partially. Hypnosis, float tanks, yoga nidra = rest. But some active states may not fit. | Stillness & States (`rest-states`) |

### Assessment: No new sub-branches needed for Phase 2

The existing 6 sub-branches cover Rest well when reframed:
- Dream Science = the vessel's dream navigation
- Sleep Science = clinical sleep
- Circadian Rhythm = biological time
- Rest Technology = hardware/software for rest
- Rest Culture = cultural attitudes toward non-doing
- Stillness & States = the vessel in non-ordinary receptive states

Meditation-as-rest nodes (Yoga Nidra, NSDR) already exist under `sleep-states`. Active meditation (Vipassana, TM) stays under Healing mind-body where it currently lives.

---

## Phase 3: Research Needed

| Research Task | Priority | Notes |
|--------------|----------|-------|
| Frontier market research for Rest (`docs/research/frontier-rest.md`) | High | Replaces missing frontier-sleep.md. Who's building in the rest/recovery space? |
| Frontier market research for Play (`docs/research/frontier-play.md`) | High | Still missing from original 10-branch set |
| Phase 3 x SD Matrix: add Play + Rest rows | Medium | `Phase 3 × Spiral Dynamics Matrix.md` still has 10 branches |
| Capacity Spectrum: add Play + Rest baselines | Medium | What's the ancestral baseline vs modern compression? |
| Phase 3 Key Indicators: add Play + Rest | Medium | Gate factors per branch |
| Audit trunk-merge candidates | Low | Which existing nodes across all branches should have merge lines to center? |

---

## Phase 4: Obsidian Updates

| Note | Change |
|------|--------|
| `Rule Break Tree - 12 Branches.md` | Sleep → Rest throughout. Add section on Awareness as trunk concept. |
| `Phase 3 × Spiral Dynamics Matrix.md` | Add Play + Rest rows. Update from 10 to 12 branches. |
| `Phase 3 Reversion Opportunities.md` | Rename Sleep entries to Rest. |
| `Phase 3 Key Indicators Per Branch` | Add Play + Rest entries. |
| `Capacity Spectrum Per Branch` | Add Play + Rest baselines. |
| NEW: `Decisions/Sleep to Rest Rename.md` | Decision record with MasterMind Council reasoning. |

---

## Phase 5: Visualization Decisions (Deferred)

These require design input, not code:

1. Does the origin node at the center get relabeled? Options: "Awareness", "The Vessel", "Human Experience", or keep unlabeled
2. Should merge-to-trunk lines be visualized? (meditation → center, psychedelics → center, flow → center)
3. Does the SD overlay (Prompt 4) interact with the trunk concept?

---

## Estimated Scope

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 1 (Rename) | ~30 min mechanical find-replace + verification | None |
| Phase 2 (Sub-branch restructure) | ~15 min label updates | Phase 1 |
| Phase 3 (Research) | ~2 hrs agent work | Phase 1 |
| Phase 4 (Obsidian) | ~30 min | Phase 1 |
| Phase 5 (Visualization) | Design decision needed | Phase 1 |

Total code change: ~200 find-replace operations in one file. No new components, no new routes, no DB changes.

---

## Open Questions for Huzz

1. **Origin node label**: "Awareness", "The Vessel", or "Human Experience"?
2. **Bridge description**: Keep "Dream Temples" for Rest bridge, or update to something broader like "Fireside Rest" or "Cave Shelter"?
3. **`rest-states` scope**: Does this sub-branch keep hypnosis and float tanks, or should those move elsewhere?
4. **Merge-to-trunk visualization**: Show lines from meditation/psychedelic/flow nodes to center, or keep this conceptual only?
