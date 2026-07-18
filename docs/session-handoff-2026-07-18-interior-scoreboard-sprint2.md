# Session Handoff: Interior Scoreboard Sprints 2-6 (July 18, 2026)

## What was done this session

### Merged to main
- `ed3205f` — Sprint 1 feature branch merged (timeframe tags + identity statement library)

### On branch `feature/interior-scoreboard-sprint2` (10 commits)
- `7a0678d` — Sprints 2-6: Clarity score, Mirror page, skill tree (main commit)
- `d6cbbca` — Courage counter on Courage tab + Mirror link on Journey
- `73570db` — 4-point forced-choice rating scale + rating index + hide toolbar
- `dedf1f8` — Rating index reordered below courage counter
- `f54f0ab` — Clarity moved to bottom, custom cluster input added
- `0fbd787` — Brand-aligned Mirror page redesign
- `913e2da` — Gradient bar removed from toolbar
- `5218506` — Auto-save on every dot tap (no save button)
- `b6791ee` — Auto-remove clusters rated 1 or 2
- `c9b6dc0` — Mirror page links hidden (route kept, nav removed)

### DB changes applied (live)
- `nikigai_clusters`: added `resonance_rating`, `resonance_updated_at`, `behavioral_evidence`, `is_removed`, `skill_tags`, `problem_tags`, `persona_tags`
- `quests`: added `skill_tags`
- `quest_tasks`: added `task_signal`
- `user_skill_progress`: new table (user_id, skill_id, xp, level)
- `curiosity_clusters`: added `skills`, `problems`
- RPCs: `increment_skill_xp`, `increment_behavioral_evidence`

### Edge functions deployed
- `classify-quest-skills` — NEW, maps quest label to skill taxonomy IDs (Haiku)
- `classify-curiosities` — UPDATED, now outputs `skills[]` + `problems[]` per cluster, max_tokens raised to 3500

### What's live for users
- Clarity % on Journey tab (shows after rating clusters)
- Courage counter + identity statements on Courage tab
- Quest card progress bar, courage trend emoji row, zone of excellence warning
- "Lit me up / Was okay / Bored" signal after completing non-courage tasks
- Clarity < 60% guidance nudge on Journey tab
- Skill XP silently collecting in background on every courage completion
- Starting level picker appears after creating a quest
- Auto-tagging skills on all 4 quest creation paths

### What's hidden
- `/mirror` page: route exists, code works, but no visible links. User not sold on the page design yet. Accessible directly at `/mirror` for testing.

---

## Decisions made this session

1. **4-point forced-choice rating (no middle option).** Research supports even scales for self-assessment. Removes the "Partly" parking spot. Scale: 4 = This IS me, 3 = Yeah that's right, 2 = Not quite (auto-removes), 1 = That's not me (auto-removes).

2. **Auto-save, no save button.** Every dot tap, remove, and restore saves immediately to DB. Users expect auto-save on mobile.

3. **Low ratings auto-remove.** Rating 1 or 2 = the cluster doesn't describe you = auto-remove (restorable). Only 3s and 4s are kept. Clarity = average of kept ratings x 25.

4. **Aspiration engine parked.** Users generate their own identity statements from real courage challenges. AI-generated statements from the 299 dataset would feel disconnected from lived experience. Play Profile already handles role model matching.

5. **NS states should replace 1-4 dots (NOT YET BUILT).** Instead of abstract dots, clusters should be tagged with the same 4 states used everywhere. Cluster-specific labels:
   - **Vibe Rise**: "I would absolutely love this"
   - **Fun**: "Yeah, sounds fun"
   - **Stressed**: "I could do it but feels stressful" (keep but flag)
   - **Bored**: "I could but it doesn't excite me" (auto-remove)
   Creates one consistent language across life paths, courage challenges, and clusters. Clarity = % of clusters in Vibe Rise + Fun states. Build next session.

6. **Action Score = NS-weighted outcomes.** `(Vibe Rise + Fun outcomes) - (Stressed + Bored outcomes)` across courage challenges, task signals, and daily check-ins. This gives the Y-axis (Action) for Zone Calibration without new data collection. All data already exists.

7. **Weekly review redesign: 7 questions to 3.**
   - "Old me would have ___. Instead I ___." (identity shift, feeds Identity Statement Library)
   - "Did procrastination stop you from doing something this week?" (yes/no + what, inaction signal)
   - "What's the one brave thing you're most proud of?" (peak moment reinforcement)

8. **Progressive unlocks are mostly self-gating.** Features only show when data exists. Courage trend appears after 3+ completions on a quest. Zone warning after 3+ pressure outcomes. No explicit stage gates needed for current features.

9. **Mirror page design TBD.** User likes the concept (Clarity home, cluster re-rating, identity collection) but not sold on current execution. Skill tree UI should go on this page when built. NS state swap (decision 5) will change the page significantly.

---

## What to build next session

### Priority 1: NS state swap (changes rating system)
Replace 1-4 dots with Vibe Rise / Fun / Stressed / Bored buttons on:
- Mirror page cluster cards
- Life Map rate_mirror screen
- Rating index legend
- Clarity formula: % of clusters in Vibe Rise + Fun states

This is the biggest change. Do it first so everything downstream uses the right system.

### Priority 2: Cluster re-generation edge function
When `behavioral_evidence >= 5` on a cluster:
- New edge function `regenerate-cluster`: takes original cluster label + challenge outcomes + identity statements from quests sharing skill_tags
- Returns evolved cluster name/description
- In-app: user sees old vs new, re-rates the evolved version
- Resets behavioral_evidence to 0 after re-gen

The banner already shows on Mirror page. Needs the edge function + re-rate UI.

### Priority 3: Zarlo/Figurine guidance integration
Feed Clarity score + courage patterns into existing prompt systems:
- Low Clarity: "Try exploring a new curiosity"
- Identity repeats 5+ times: "You keep saying you're someone who [X]. That's becoming part of who you are."
- Cluster re-gen: "Your mirror just got sharper"
- Zone of excellence: echo the quest card warning in Zarlo's voice

### Priority 4: Weekly review redesign
Replace 7 questions with 3. Keep the RP reward. Update `WeeklyReview.jsx` and `WeeklyReviewCard.jsx`. Narrative revision feeds Identity Statement Library.

### Priority 5: Action Score
Aggregate existing data into rolling 30-day score:
- Courage challenges with Vibe Rise/Fun = positive
- Tasks with "lit me up" = positive
- Courage challenges with Stressed/Bored = negative
- Daily check-ins with vibe_rise/ventral = positive
- Display on Journey tab alongside Clarity %

### Priority 6: Cross-pollination to Clarity
Wire convergence signal as Clarity multiplier:
- `unique_cross_pollination_pairs / total_active_quests`
- Boosts Clarity, doesn't replace cluster ratings

### Priority 7: Skill tree UI
Build visual skill display on /mirror page:
- 10 skills from taxonomy
- L0-L4 progress bars per skill (data already collecting via `user_skill_progress`)
- Only show skills with XP > 0

### Priority 8: Push notification for re-gen
"Your mirror has new evidence" notification when behavioral_evidence hits 5. Links to /mirror re-rate flow.

---

## Key files for next session

| File | What's there |
|------|-------------|
| `src/pages/MirrorPage.jsx` | Full page, auto-save, add cluster, brand-aligned CSS. Links hidden. |
| `src/pages/MirrorPage.css` | Brand-aligned design (gradient hero, purple shadows, gold accents) |
| `src/flows/LifeMapFlow.jsx` | rate_mirror screen at line ~1166, auto-skip useEffect at line ~171 |
| `src/components/GroanCompletionModal.jsx` | Behavioral evidence + skill XP at lines ~296-325 |
| `src/components/QuestBoardCard.jsx` | Progress bar, courage trend, zone warning, lit-me-up signal |
| `src/components/JourneyTab.jsx` | Clarity % query + display, guidance nudge |
| `src/components/PlayListTab.jsx` | Courage counter + identity statements |
| `src/components/level/LevelTab.jsx` | Skill level picker (SkillLevelPicker component at bottom) |
| `src/lib/skillProgress.js` | awardSkillXP (RPC), setSkillStartingLevel |
| `src/lib/questSkillTagger.js` | tagQuestSkills (calls classify-quest-skills edge function) |
| `src/components/WeeklyReview.jsx` | Current 7-question review (needs redesign) |

## Pre-existing bugs noted (not from our changes)

1. `gcm-wahoo-alive` CSS class missing selected state (GroanCompletionModal.css)
2. Courage task with no `groan_challenge_id` gets silently done (QuestBoardCard.jsx:103)
3. Mystery box count check may read null (QuestBoardCard.jsx:199-205)

## Test results from this session

User tested on localhost:5180:
- Courage counter on Courage tab: working
- Mirror page at /mirror: working (toolbar hidden, rating index, clusters, add-your-own)
- Clarity % on Journey tab: showing 90% after rating clusters
- Auto-save ratings: confirmed working (persist across refresh)
- Auto-remove on 1-2 rating: confirmed working
- Life Map rate_mirror flow: not tested this session (user didn't re-run Life Map)
- Skill level picker after quest creation: not tested this session
