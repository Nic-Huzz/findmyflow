# Creator Portal Flywheel

## The Loop

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ONBOARDING (one-time)                                   │
│                                                          │
│  Experience Creator Matching (/experience-creators)      │
│  Browse → Select who resonates → Product suite reveal    │
│  Output: archetype, product suite, selected creators     │
│                                                          │
│  Optional: Play Profile DNA (/play-profile)              │
│  5-slider quiz → knowledgeStyle + fuelType               │
│  Personalizes HOW challenges are framed (DO_IT vs        │
│  THINK_IT). Works without it, generic framing used.      │
│                                                          │
│  Scope Map Diagnostic (first /create visit)              │
│  3 free-text questions → AI classifies                   │
│  Stream / Lake / Waterfall / River                       │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  CREATOR HOME (/create tab)                              │
│                                                          │
│  My Business: Product suite + 4-layer assessment +       │
│               Scope Map position                         │
│  Experiences: Active card + challenges + past + 3%       │
│  Dashboard:   KPIs + 4-layer progress + CRM links       │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       ↓
          ┌────────────────────────┐
          │                        │
          │   CREATE EXPERIENCE    │
          │   Name + date + type   │
          │   Checklist seeded     │
          │                        │
          └───────────┬────────────┘
                      ↓
          ┌────────────────────────┐
          │                        │
          │   WORK THE CHECKLIST   │◄──────────────┐
          │                        │               │
          │   Marketing items:     │               │
          │   [⚡] → Play-List     │               │
          │   challenge with       │               │
          │   deadline             │               │
          │                        │               │
          │   If Play Profile      │               │
          │   completed:           │               │
          │   DO_IT / THINK_IT /   │               │
          │   MAKE_IT framing      │               │
          │                        │               │
          │   If not: generic      │               │
          │   framing (still       │               │
          │   works)               │               │
          │                        │               │
          └───────────┬────────────┘               │
                      ↓                            │
          ┌────────────────────────┐               │
          │                        │               │
          │   GROUP CALL           │               │
          │   (Fortnightly)        │               │
          │                        │               │
          │   1. Green/red check   │               │
          │      (app shows)       │               │
          │   2. Debrief 3%        │               │
          │   3. 4-layer check-in  │               │
          │   4. Set intentions    │               │
          │      → become          │               │
          │      challenges with   │               │
          │      next call as      │               │
          │      deadline          │               │
          │                        │               │
          │   Mid-cycle nudge      │               │
          │   (day 7 push notif)   │               │
          │                        │               │
          └───────────┬────────────┘               │
                      ↓                            │
          ┌────────────────────────┐               │
          │                        │               │
          │   RUN EXPERIENCE       │               │
          │   (real life)          │               │
          │                        │               │
          └───────────┬────────────┘               │
                      ↓                            │
          ┌────────────────────────┐               │
          │                        │               │
          │   POST-EVENT           │               │
          │   (within 24h)         │               │
          │                        │               │
          │   Follow-up items:     │               │
          │   [⚡] → challenges    │               │
          │   - Thank-you email    │               │
          │   - Feedback request   │               │
          │   - Testimonials       │               │
          │   - Next event invite  │               │
          │                        │               │
          │   Reflection:          │               │
          │   - What worked?       │               │
          │   - What drained?      │               │
          │   - 3% improvement     │               │
          │                        │               │
          │   Attendees → CRM      │               │
          │                        │               │
          └───────────┬────────────┘               │
                      ↓                            │
          ┌────────────────────────┐               │
          │                        │               │
          │   DASHBOARD            │               │
          │   Shows growth:        │               │
          │   - Repeat attendees   │               │
          │   - Attendance growth  │               │
          │   - Upsells            │               │
          │   - 3% implementation  │               │
          │   - 4-layer progress   │               │
          │   - Scope Map movement │               │
          │                        │               │
          │   Feeds next group     │───────────────┘
          │   call + next          │
          │   experience           │
          │                        │
          └────────────────────────┘
```

## The Compound Effect

Each cycle:
- 3% note from last experience surfaces when creating the next
- Attendee data carries forward (who to invite back)
- Marketing improves (testimonials, social proof from last)
- Scope Map may shift (Lake → Waterfall as experiences narrow)
- Dashboard shows the trajectory
- Each cycle takes less effort and produces better results

## DNA Personalization (Optional Enhancement)

Play Profile DNA influences challenge framing but is NOT required for the flywheel to work.

| Has Play Profile? | Challenge Framing |
|---|---|
| No | Generic: "DM 10 warm leads with a direct invite" |
| Yes (knowledgeStyle high) | DO_IT: "Send all 10 today. Speed round. Screenshot when done." |
| Yes (knowledgeStyle low) | THINK_IT: "Write your perfect invite. Then send 3 per day." |
| Yes (knowledgeStyle mid) | MAKE_IT: "Create a voice note invite. Personal, not templated." |
| Yes (fuelType high) | Tone: craft, share, build |
| Yes (fuelType low) | Tone: prove, conquer, dominate |

When to complete Play Profile:
- Not part of onboarding (too much upfront)
- Prompted on first [lightning bolt] tap: "Before we personalize your challenges, let's understand how you work best." Quick 2-slider version (knowledgeStyle + fuelType only).
- Accessible anytime from My Business tab in Creator Home
- If skipped on first prompt, generic framing used. Prompt reappears on next [lightning bolt] tap.

## Shift Architecture (Upsell, Outside the Loop)

Not part of the core flywheel. Offered when:
- Waterfall user wants to understand WHY their experience works
- River user wants to teach/certify others in their method
- Anyone who wants to improve facilitation depth

## What Exists vs What Needs Building

| Component | Status |
|---|---|
| Experience Creator Matching | Built (other agent) |
| Play Profile DNA | Built (needs "2-slider quick version" for creator context) |
| Scope Map Diagnostic | Built (ScopeMapFlow.jsx) |
| Creator Home (3 tabs) | Built (Phase 1 complete) |
| Create Experience + Checklist | Built (ExperienceCreate + experienceChecklistTemplate) |
| Checklist → Play-List bridge [⚡] | **Phase 2: building next** |
| Group call intention flow | Phase 3 |
| Dashboard KPIs (real data) | Phase 4 |
| CRM alias layer | Phase 4 |
| Mid-cycle push notification | Phase 4 |
| DNA personalization of challenges | Optional enhancement |
| Shift Architecture Blueprint | Built (upsell, separate from core loop) |

---

*Reference docs:*
- `docs/creator-portal-flow.md` (full portal step-by-step)
- `docs/experience-creator-os.md` (OS vision + what's built)
- `docs/experience-creator-stages.md` (user journey stages)
- `docs/subconscious-shift-method.md` (Shift Architecture method)
- `docs/root-and-reach-framework.md` (Scope Map framework)
