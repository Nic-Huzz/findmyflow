# Self-Knowledge Skills — Spec (V2)

**Created:** 2026-07-13
**Status:** V2 backlog — aligned on structure, not building yet
**Display:** Journey tab + Figurine intelligence phases

---

## The 5 Skills

Skills level up based on SUBMISSIONS (showing up IS the levelling). Each level changes what the AI does for you. L1 Zarlo is a stranger. L5 Zarlo knows you deeply.

| Skill | What It Measures | Data Source | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|---|---|
| **Presence** | Daily check-ins completed | `nervous_system_checkins WHERE checkin_type = 'daily'` | 10 | 25 | 50 | 100 | 200 |
| **Courage** | Wahoos completed | `quest_completions WHERE quest_category = 'Groans'` | 5 | 15 | 30 | 60 | 100 |
| **Depth** | Healing flows completed | `healing_intentions` COUNT | 3 | 8 | 15 | 30 | 50 |
| **Recovery** | Bounce-back from drains — days where Safe/Vibe Rise check-in follows within 3 days of a drain event (Activated/Shutdown check-in with drain category logged) | `nervous_system_checkins` (drain + recovery pairs) | 2 | 5 | 10 | 20 | 35 |
| **Curiosity** | Life paths being actively explored with wahoos | Quests with at least 1 completed wahoo | 1 | 2 | 3 | 4 | 5 |

### Naming Exploration (TBD — pick trendier names)

Current names are functional. May want something with more brand energy. Candidates:

| Functional Name | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| Presence | Awareness | Attunement | Compass |
| Courage | Courage | Edge | Spark |
| Depth | Depth | Roots | Layers |
| Recovery | Recovery | Rebound | Bounce |
| Curiosity | Curiosity | Explore | Range |

**Decision needed:** Final naming. Could also use metaphors that match Vibe Rise brand (fire/flame themed? nature? nervous system?).

---

## What Each Level Unlocks

| Skill | L1 | L3 | L5 |
|---|---|---|---|
| **Presence** | Zarlo asks "how are you?" | Zarlo detects day-of-week patterns | Zarlo predicts your state: "It's Wednesday. You're probably Activated." |
| **Courage** | App suggests Screen wahoos | App surfaces Live + Money challenges | App recommends Vulnerable/Authority because you've proven capacity |
| **Depth** | Zarlo names the voice after you | Zarlo spots the voice before you | Zarlo predicts which voice will fight a wahoo BEFORE you attempt it |
| **Recovery** | "You bounced back" | "Recovery getting faster" | "Your recovery time has halved since month 1" |
| **Curiosity** | "First path explored" | Zarlo notices connections between paths | Zarlo actively suggests: "Your coaching insight applies to breathwork" |

### V2 Zarlo Capabilities (unlocked by skill levels)

| Capability | Unlocked By | What It Does |
|---|---|---|
| **Life path commentary** | Presence L3+ | Zarlo customises messages based on active life paths |
| **Ranking updates** | Courage L2+ | "Your wahoo count puts you in the top 20% of active users" |
| **Journey narration** | Depth L3+ | "Month 1: you wouldn't go Live. Month 3: you ran a workshop." |
| **Predictive nudges** | Presence L5 | "Tomorrow's Thursday. You usually skip the app. Want to set an intention?" |
| **Path recommendations** | Curiosity L3+ | "People with your combo often explore facilitation. Curious?" |

---

## Recovery Skill: Drain-Based Measurement

**Why drains, not just NS state:**

Simple NS state bounce-back (Activated → Safe) doesn't tell you much. A user who checks in Activated because of excitement is different from one who checks in Activated because of work stress. The DRAIN data adds context.

**How to compute:**

```sql
-- Find drain events (check-ins with drain category)
-- Then find the next Safe/Vibe Rise check-in within 3 days
-- Each pair = 1 recovery event

WITH drain_events AS (
  SELECT user_id, created_at as drain_at, source_quest_id as drain_category
  FROM nervous_system_checkins
  WHERE checkin_type = 'drain'
  AND after_state IN ('sympathetic', 'dorsal')
),
recovery_events AS (
  SELECT d.user_id, d.drain_at,
    MIN(r.created_at) as recovery_at
  FROM drain_events d
  JOIN nervous_system_checkins r 
    ON r.user_id = d.user_id 
    AND r.created_at > d.drain_at
    AND r.created_at <= d.drain_at + interval '3 days'
    AND r.before_state IN ('ventral', 'vibe_rise')
    AND r.checkin_type = 'daily'
  GROUP BY d.user_id, d.drain_at
)
SELECT user_id, COUNT(*) as recovery_count
FROM recovery_events
GROUP BY user_id;
```

**What it rewards:** Not avoiding drains (impossible). Coming BACK after them. Showing up the next day after a bad day. That's resilience.

---

## Curiosity Skill: Quest Exploration

**How to compute:**

```sql
SELECT user_id, COUNT(DISTINCT q.id) as explored_quests
FROM quests q
JOIN quest_completions qc ON qc.user_id = q.user_id
JOIN quest_tasks qt ON qt.quest_id = q.id AND qt.groan_challenge_id IS NOT NULL
WHERE q.status = 'active'
AND qc.quest_category = 'Groans'
GROUP BY q.user_id;
```

**What it rewards:** Breadth. Not going deep on one path (that's Depth/Courage). Exploring MULTIPLE paths. Having 3+ active quests with wahoos means you're genuinely curious, not tunnelling.

**L5 = 5 explored paths** is ambitious but achievable for someone who's been using the app 3+ months.

---

## Connection to Figurine Intelligence Phases

| Figurine Phase | Required Skills | What Changes |
|---|---|---|
| Phase 0 | Essence Mirror complete (no skills) | Figurine speaks tentatively, mirror mode |
| Phase 1 | Presence L3 + Courage L2 | Figurine knows patterns, can name voices |
| Phase 2 | Depth L3 + Curiosity L2 | Figurine sees convergence, teases Flow Statement |
| Phase 3 | All skills L3+ | Figurine challenges directly, full mentor mode |

---

## Display: Journey Tab

On the Journey tab, below the hero stage card:

```
YOUR SKILLS

Presence    ●●●○○  L3
Courage     ●●○○○  L2
Depth       ●○○○○  L1
Recovery    ○○○○○  —
Curiosity   ●○○○○  L1
```

Tapping a skill row shows:
- Current count / next threshold
- What unlocks at next level (one sentence)
- "12 more check-ins to Presence L4"

---

## Implementation Notes

### No new schema needed (4 of 5 skills)
- Presence, Courage, Depth, Curiosity: computed from existing COUNT queries
- Recovery: computed from existing `nervous_system_checkins` (drain + daily pairs)

### Storage
- Compute in Zarlo Brief (add `skills` object to Brief JSON)
- No separate `user_skills` table needed
- Brief already runs daily, skills update daily

### Build Estimate
- Skill computation in Brief Edge Function: 1 day
- Journey tab skill display: 1 day
- Wire to Figurine intelligence phases: 1 day
- **Total: ~3 days**

---

*Status: V2 backlog. Build when user base is active enough for skills to feel meaningful.*
*Naming: TBD — needs trendier names that match Vibe Rise brand.*
*Next priority: Social V1 (before Skills).*
