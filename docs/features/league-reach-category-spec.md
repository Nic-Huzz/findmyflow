# Fantasy League — Reach Category Spec

**Created:** 2026-07-13
**Status:** Designed, needs implementation
**Purpose:** Replace the old "Healing" scoring category with "Reach" (content/social tasks). League scoring becomes: Tune + Courage + Reach (win 2 of 3).

---

## Scoring Structure

| Category | What it measures | Source |
|---|---|---|
| **Tune** | Daily practices, maintenance | Tune tab (existing, unchanged) |
| **Courage** | Wahoos + healing (merged) | Courage tab (existing, healing merged in) |
| **Reach** | Sharing, engaging, visibility | New: bottom of Courage tab, league-only |

Win 2 of 3 categories = WIN (3pts). Same matchup mechanic as current system.

**Key change:** Healing quest_categories ('Healing', 'Daily', 'Weekly') move from the old Healing scoring bucket INTO the Courage bucket alongside 'Groans'. The Reach category is entirely new content submission tasks.

---

## The 6 Reach Tasks

### In-App Tasks (auto-scored, no admin)

| Task | Points | Input | How it works |
|---|---|---|---|
| **Accountability Post** | 4 | Multi-select from active courage challenges in quests | User picks 1+ courage tasks they're committing to this week. Template auto-generates and posts to community feed. Public commitment tied to real quest tasks. |
| **Comment & Engage** | 2 | Auto-detected | Tracks: user reacted to or commented on 3 different people's posts in the community feed this week. No submission needed. |
| **Shout Out a Player** | 4 | Pick player + free text | Template: "Shout out to [player] for [text]." Posts to community feed. Tagged player sees it. |

### External Tasks (URL submission + admin approval, cross-posted to community feed)

| Task | Points | Input | How it works |
|---|---|---|---|
| **Share the Leaderboard** | 2 | Generate template image | App generates shareable image card (league standings, rank, team). User shares to Instagram/stories. Submits URL as proof. |
| **Courage Proof** | 8 | URL of social media post | After completing a courage challenge, share evidence externally (screenshot, video, post). Submits URL. Cross-posts to community feed with clickable link: "Huzz shared courage proof: [title]. [See post →]" |
| **Flow in the Wild** | 10 | URL of social media post | Proof of flow/offer in the real world. Client conversation screenshot, session photo, testimonial. Submits URL. Cross-posts to community feed with clickable link. |

### Point Progression

```
2 pts — Quick social actions (leaderboard share, engage with 3 posts)
4 pts — Weekly commitments (accountability post, shout out)
8 pts — Proof of work (courage proof shared externally)
10 pts — Proof of impact (flow in the wild)
```

---

## Where Reach Lives in the UI

**Bottom of Courage tab, only visible when user is in an active Fantasy League.**

Non-league users never see it. League users see:

```
Courage Tab (top to bottom):
  Active Wahoos (with inline healing)
  "What's blocking you?" input
  Add a Wahoo button
  Need inspiration?
  ─────────────────
  Reach (only if in league)
    6 task cards
    Pending/approved submissions
```

---

## Verification Model

| Type | Where | Verification |
|---|---|---|
| In-app actions (Accountability, Engage, Shout Out) | Community feed | **Auto-detected or auto-posted** — no admin needed |
| External sharing (Leaderboard, Courage Proof, Flow in the Wild) | Social media + cross-post to community feed | **URL submission + admin approval** |

---

## Accountability Post Detail

User sees their active courage challenges pulled from quest_tasks (is_courage_challenge = true, done = false). Multi-select. Template auto-generates:

```
This week I'm committing to:
✓ Run a paid breathwork session
✓ Post a vulnerable video about my journey
✓ Tell my boss I want to restructure my role

[Quest: Breathwork Journey]
```

Posts to community feed. Public commitment tied to REAL tasks, not vague goals.

---

## Courage Proof + Flow in the Wild — Dual Posting

1. User completes courage challenge or has flow evidence
2. Shares on Instagram / social media
3. Pastes the social media URL into the app
4. App creates community feed post: "[User] shared courage proof: [title]. [See post →]"
5. Community members can tap the link to see the external post
6. Admin approves for league Reach points

This drives BOTH external visibility (social media reach for their brand) AND internal community engagement (people tap through, react, comment in the app).

---

## What Changes from Current System

| Current | New |
|---|---|
| 3 categories: Tune, Wahoos, Healing | 3 categories: Tune, Courage, Reach |
| Healing = separate scoring bucket | Healing merged into Courage bucket |
| Content submissions = uncategorized bonus | Content submissions = Reach category (scored) |
| ContentChallenges.jsx archived | Reactivated as Reach section on Courage tab |
| 9 content tasks | 6 content tasks (3 dropped) |

### Tasks Dropped

| Task | Why |
|---|---|
| Carousel Highlights (8pts) | Too high effort. Reintroduce when content tools are built. |
| Customise Your Hero Profile (10pts) | Onboarding action, not a weekly reach task. |
| Share Your Hero Profile (4pts) | Merged into future "Share Your Journey" (share stage card/timeline). |

---

## Config Changes Needed

In `leagueConfig.js`, `FANTASY_CATEGORIES`:

```javascript
// BEFORE:
play_list: { key: 'play_list', label: 'Wahoos', dbFilter: ['Groans'], scoringType: 'raw' },
healing:   { key: 'healing', label: 'Healing', dbFilter: ['Healing', 'Daily', 'Weekly'], scoringType: 'raw' },
tune:      { key: 'tune', label: 'Tune', dbFilter: ['Tune'], scoringType: 'raw' },

// AFTER:
courage: { key: 'courage', label: 'Courage', dbFilter: ['Groans', 'Healing', 'Daily', 'Weekly'], scoringType: 'raw' },
tune:    { key: 'tune', label: 'Tune', dbFilter: ['Tune'], scoringType: 'raw' },
reach:   { key: 'reach', label: 'Reach', dbFilter: ['Reach'], scoringType: 'raw' },
```

Content submissions would need to write to `quest_completions` with `quest_category: 'Reach'` instead of their current separate table. OR the scoring engine queries `league_content_submissions` for the Reach category alongside `quest_completions` for Tune/Courage.

---

## Implementation Order

1. **Update leagueConfig.js** — new category definitions
2. **Update leagueScoring.js** — Reach scoring from content submissions
3. **Update edge function** — mirror scoring changes
4. **Update ChallengeHeader** — pills: Tune / Courage / Reach
5. **Reactivate ContentChallenges** — as Reach section on Courage tab, league-only
6. **Update ContentChallenges** — remove dropped tasks, add cross-posting for Courage Proof / Flow in the Wild, add Accountability Post multi-select from quest tasks
7. **Update community feed** — support cross-posted external links

---

## Connection to Hero's Journey

| Stage | Reach relevance |
|---|---|
| 1-4 | No reach tasks (internal discovery) |
| 5-6 | Accountability posts + courage proof (training phase, sharing the journey) |
| 7-8 | Shout outs + engage (community bonds, healing phase) |
| 9-10 | Flow in the wild (the merge is named, start sharing externally) |
| 11-12 | All reach tasks at max (structural commitment, facilitating for others) |

The Reach category naturally grows as users progress through hero stages. Early users mostly earn Tune + Courage. Later users add Reach as they become more visible.

---

## Language Note

"Wahoo" is being renamed to "Courage" in user-facing copy. Internal code can stay as `groan_challenges` / `wahoo_category` etc. but user-facing labels should say "courage challenge" not "wahoo."

---

*Related docs:*
- `docs/features/measurement-framework-exploration.md` — hero stages, depth scale, 5×5 matrix
- `docs/superpowers/plans/2026-07-13-league-overall-score.md` — implementation plan (needs updating for Reach)
- `docs/features/credibility-score-explainer.md` — Scale Portal credibility (separate from league scoring)
