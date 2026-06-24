# Codex & Journey Map Implementation Plan

**Created:** 2026-02-05
**Status:** Ready for Implementation

---

## Overview

This plan covers implementation of:
1. **Journey Map** - Visual timeline under Hero Identity Card
2. **The Codex** - Tab navigation with unlockable lore library

---

## Phase 1: Journey Map (MVP)

### Scope
- Timeline visualization only (no clickable pop-ups yet)
- Four acts: Matrix → Awakening → Training → Becoming
- Auto-populated milestones from existing data
- No user-logged moments yet (future feature)

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/HeroProfile/JourneyMap.jsx` | Timeline component |
| `src/components/HeroProfile/JourneyMap.css` | Styles |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/HeroProfile/HeroCommandCenter.jsx` | Add JourneyMap below HeroIdentityCard |
| `src/hooks/useHeroProfile.js` | Add milestone data fetching |

### Data Sources (Existing)
- `flow_sessions` - Flow Finder completion date
- `lead_flow_profiles` - Essence/Voice assignment date
- `user_projects` - Project creation, stage progression
- `quest_completions` - First quest completion
- `groan_challenges` - First Playground challenge

### Milestones to Display
| Milestone | Source | Act |
|-----------|--------|-----|
| Joined FindMyFlow | `auth.users.created_at` | Matrix → Awakening |
| Discovered your Flow | `flow_sessions` where type = 'integration' | Awakening |
| Met your Shadow | `lead_flow_profiles.protective_archetype` set | Awakening |
| First project created | `user_projects` first entry | Training |
| First Groan faced | `groan_challenges` first completion | Training |
| Stage X reached | `user_projects.current_stage` | Training |

---

## Phase 2: Codex Tab Structure

### Scope
- Tab navigation: [Identity] [Codex]
- Codex category list with unlock progress
- Entry detail view
- Unlock tracking

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/HeroProfile/HeroProfileTabs.jsx` | Tab navigation wrapper |
| `src/components/HeroProfile/CodexTab.jsx` | Codex category list |
| `src/components/HeroProfile/CodexEntry.jsx` | Single entry view |
| `src/components/HeroProfile/CodexCategory.jsx` | Category accordion |
| `src/hooks/useCodex.js` | Codex data & unlock logic |
| `src/data/codex/index.js` | Codex config & unlock rules |
| `src/data/codex/voiceArchives.js` | 5 Voice Archive entries |
| `src/data/codex/flowScrolls.js` | 8 Flow Scroll entries |
| `src/data/codex/founderJourney.js` | 6 Founder story entries |
| `src/data/codex/ancientWisdom.js` | 4 Ancient Wisdom entries |

### Database Migration
```sql
CREATE TABLE codex_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  codex_entry_id TEXT NOT NULL,
  codex_category TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_trigger TEXT,
  UNIQUE(user_id, codex_entry_id)
);

CREATE INDEX idx_codex_user ON codex_unlocks(user_id);
```

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/HeroProfile/HeroCommandCenter.jsx` | Wrap in tab structure |
| `src/components/HeroProfile/HeroProfile.css` | Tab styles, Codex styles |

---

## Phase 3: Codex Content

### Content Summary
| Category | Entries | Words (approx) |
|----------|---------|----------------|
| Voice Archives | 5 | ~3,500 (700 each) |
| Flow Scrolls | 8 | ~3,200 (400 each) |
| Founder's Journey | 6 | ~3,000 (500 each) |
| Ancient Wisdom | 4 | ~1,200 (300 each) |
| **Total** | **23** | **~10,900** |

### Voice Archives (5 entries)
| Entry | Unlock Trigger |
|-------|----------------|
| The Perfectionist | Identified as voice OR 3 Playground challenges targeting it |
| The People Pleaser | Identified as voice OR 3 Playground challenges targeting it |
| The Controller | Identified as voice OR 3 Playground challenges targeting it |
| The Performer | Identified as voice OR 3 Playground challenges targeting it |
| The Ghost | Identified as voice OR 3 Playground challenges targeting it |

### Flow Scrolls (8 entries)
| Entry | Unlock Trigger |
|-------|----------------|
| The Four Directions | First Flow Compass check-in |
| The Flow Equation | Flow Finder complete |
| The Groan Decoded | 5 Playground challenges complete |
| The Visibility Ladder | First "Live" layer challenge complete |
| Energy Alchemy | Reach Stage 3 |
| Play as Portal | 10 Playground challenges complete |
| The Service Threshold | Reach Stage 6 |
| The Protective Bargain | Voice identified |

### Founder's Journey (6 entries)
| Entry | Unlock Trigger | Source from doc |
|-------|----------------|-----------------|
| The Earthquake | Onboarding complete | Part 1: Q1 |
| The Knowledge Trap | Flow Finder complete | Part 1: Q2 |
| The Fear Challenge | First Groan complete | Part 1: Q2, Part 5 |
| The Identity Flip | 10 Groans complete | Part 5 |
| The Money Shift | First "Money" layer challenge | Part 7 |
| The Purgatory | 2 weeks active | Part 4 |

### Ancient Wisdom (4 entries)
| Entry | Unlock Trigger |
|-------|----------------|
| Ikigai: Reason for Being | Flow Finder complete |
| Svadharma: Your Sacred Duty | Reach Stage 4 |
| Te: Your Inherent Power | 15 Playground challenges |
| The Hero's Journey | Reach Stage 6 |

---

## Implementation Order

### Week 1: Foundation
- [ ] Create database migration for `codex_unlocks`
- [ ] Create `src/data/codex/` folder structure
- [ ] Write `codex/index.js` with unlock rules config
- [ ] Create `useCodex.js` hook

### Week 2: Journey Map
- [ ] Create `JourneyMap.jsx` component
- [ ] Add milestone data fetching to `useHeroProfile.js`
- [ ] Integrate into `HeroCommandCenter.jsx`
- [ ] Style with purple→gold gradient

### Week 3: Codex UI
- [ ] Create `HeroProfileTabs.jsx` tab wrapper
- [ ] Create `CodexTab.jsx` category list
- [ ] Create `CodexCategory.jsx` accordion
- [ ] Create `CodexEntry.jsx` detail view
- [ ] Integrate tabs into `HeroCommandCenter.jsx`

### Week 4: Codex Content
- [ ] Write all 5 Voice Archive entries
- [ ] Write all 8 Flow Scroll entries
- [ ] Write all 6 Founder's Journey entries
- [ ] Write all 4 Ancient Wisdom entries

### Week 5: Polish & Unlock Logic
- [ ] Implement unlock trigger checks
- [ ] Add unlock notifications/celebrations
- [ ] Test all unlock paths
- [ ] Mobile responsiveness

---

## Content Writing Guidelines

### Voice Archives Template
```markdown
# [Voice Name]

## The Origin
[Narrative about how this voice developed - 150 words]

## The Lie It Tells
> "[The core lie in quotes]"
[Expansion on how the lie manifests - 100 words]

## How It Protected You
[Acknowledgment of the voice's original purpose - 100 words]

## Why It's Blocking Your Flow Now
[How it prevents progress - 100 words]

## The Kryptonite
[What weakens this voice - 100 words]

## The Rewiring
[Affirmation and new belief - 50 words]

## Heroes Who Faced This Voice
[1-2 brief examples - 100 words]
```

### Flow Scrolls Template
```markdown
# [Scroll Title]

## The Teaching
[Core concept explained - 200 words]

## Why This Matters
[Application to the journey - 100 words]

## The Practice
[How to apply this - 100 words]
```

### Founder's Journey Template
```markdown
# [Story Title]

## The Moment
[What happened - narrative - 200 words]

## The Lesson
[What I learned - 150 words]

## For Your Journey
[How this applies to you - 100 words]
```

### Ancient Wisdom Template
```markdown
# [Tradition]: [Concept Name]

## The Ancient Teaching
[Historical/cultural context - 100 words]

## The FindMyFlow Translation
[How this maps to our language - 100 words]

## The Invitation
[How to embody this - 100 words]
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Journey Map renders correctly | 100% of users |
| Tab navigation works | 100% |
| Codex entries unlock appropriately | All triggers working |
| User engagement with Codex | >30% of users open Codex |
| Content completion | 23 entries written |

---

## Future Enhancements (Not in Scope)

- [ ] Clickable Journey Map milestones with pop-up details
- [ ] User-logged moments ("Add a moment")
- [ ] `hero_moments` table
- [ ] Codex search
- [ ] Codex sharing
- [ ] Audio versions of entries
