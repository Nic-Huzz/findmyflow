# Creator Portal Flow

## Final Structure

### Onboarding (One-Time)

**Experience Creator Matching** (`/experience-creators`, being built by other agent)

Browse 6 archetype categories → Select who resonates → Product suite reveal (4 layers: attraction, core, scale, continuity) with per-layer "hell yes / not quite" validation.

Output: dominant_archetype, product_suite, selected_creators
Feeling: "I see what I'm building."

After onboarding, user lands on Creator Home.

---

### Creator Home (The Menu Page)

Route: `/create` (Create tab in Challenge portal)

Three sections:

#### 1. My Business (Strategic View)

"Where I am and where I'm going."

Contains:
- **Product suite** from matching (what their model looks like at maturity)
- **4-Layer Assessment** (editable card, revisited periodically)
  - Attraction: Have it / Inconsistent / Don't have it + text field
  - Core: Have it / Inconsistent / Don't have it + text field
  - Scale: Have it / Inconsistent / Don't have it + text field
  - Continuity: Have it / Inconsistent / Don't have it + text field
- **Root & Reach position** (Fog / Root / Signal diagnosis, woven into the assessment)
  - Derived from assessment answers, not a separate step
  - "How many types of experiences do you run?" = if 3+ and vague descriptions, likely Fog
  - "Can you describe your ideal attendee in one sentence?" = specific = Root
  - Tracks movement over time

Updated on group calls or whenever user revisits. The group call prompt: "Has anything changed in your 4 layers since last time?"

#### 2. Experiences (Operational View)

"What's coming up and what do I need to do."

Contains:
- **Active experience card**:
  - Name, date, type, venue, days until
  - Checklist progress bar (X/Y complete)
  - This fortnight's challenges (green/red, deadline countdown)
  - [View Checklist] → `/create/experience/:id`
  - [+ Add Challenge] → pick from uncompleted checklist items or write custom
- **Past experiences**:
  - Name, date, completion status
  - 3% improvement note displayed inline
- **[+ New Experience]** button

If NO active experience: challenges section shows group call intentions (custom commitments not tied to a specific event).

Challenges come from:
- Checklist items converted via [lightning bolt] button (marketing/follow-up items only)
- Custom intentions set on group calls
- Both personalized by Play Profile DNA (knowledgeStyle → DO_IT/THINK_IT framing, fuelType → language tone)

#### 3. Dashboard (Proof View)

"Am I growing?"

Contains:
- **KPIs**:
  - Repeat attendees (the quality signal)
  - Attendance growth (are rooms filling easier?)
  - Upsells (attendees buying next experience or higher tier)
  - 3% implementation success (are improvements actually landing?)
- **4-Layer progress over time** (from assessment baseline, tracked at each update)
- **Root & Reach movement** (Fog → Root → Signal progression)
- **Attendee CRM** (aliased from crm_contacts, link to full CRM)
- **Follow-up sequences** (aliased from email sequences, link to full view)

This is what they look at on group calls. This is what keeps them subscribed at month 4.

---

### Experience Detail Page

Route: `/create/experience/:id`

**Pre-Event Tab:**

"Fill the Room" (marketing section):
- Checklist items with [lightning bolt] to convert to Play-List challenge
- Each converted item gets: title, deadline, scary/wahoo scores, DNA-personalized framing
- Completing the challenge auto-ticks the checklist item

"Ready to Deliver" (organisation section):
- Plain checkboxes (no challenge conversion, no personalization)

**Post-Event Tab:**

"Close the Loop" (follow-up section):
- Items with [lightning bolt]: send thank-you, feedback request, collect testimonials, next experience invite
- Upload attendee contacts to CRM

"Compound Your Gains" (reflection section):
- What worked? (wahoo moments)
- What drained energy? (scary/friction moments)
- What one 3% improvement for next time?
- Plain text fields, not challenges

---

### Group Call Flow (Fortnightly)

**Pre-call:** App shows last fortnight's challenges (green/red status)

**On call:**
1. Accountability check: each person reads green/red (2 min each)
2. Debrief: anyone who ran an experience shares 3% (5 min)
3. 4-layer check-in: "Has anything changed?" (update assessment if so)
4. Intentions: each person commits 2-3 tasks (2 min each)

**Post-call:** "Set This Fortnight's Intentions" flow
- Pick from uncompleted checklist items OR write custom
- Each becomes a Play-List challenge
- Deadline: next group call date (fixed, set by Huzz)
- Personalized by DNA (if Play Profile completed)

**Mid-cycle nudge (day 7):** Push notification showing challenge progress. "3 days until call. 1/3 complete."

---

### CRM (Background, Aliased)

Same infrastructure, different labels for experience creators:

| Route | Creator Label |
|-------|--------------|
| /crm/contacts | Attendees |
| /crm/sales | Registrations |
| /crm/email-sequences | Follow-up Sequences |
| /crm/analytics | Experience Stats |
| /crm/content/create | Marketing Assets |
| /crm/smart-alerts | Facilitator Nudges |

Accessed from Dashboard section links. The facilitator doesn't "use a CRM." They complete checklist items and the CRM populates itself.

---

### Shift Architecture (Upsell, Outside the Loop)

Not part of the core flow. Offered when:
- A Root user wants to understand WHY their experience works (methodology upgrade)
- A Signal user wants to teach/certify others in their method
- Anyone who wants to improve facilitation depth

Accessed via: separate offering, workshop, or in-app prompt when Root/Signal diagnosed.

---

### What Exists vs What Needs Building

| Component | Status |
|-----------|--------|
| Experience Creator Matching (onboarding) | Being built by other agent |
| Creator Home (menu page) | Needs building (replaces current Create tab empty state) |
| My Business section (4-layer assessment + Root & Reach) | Needs building |
| Experiences section (active card + challenges + past) | Partially built (ExperienceCatalog exists, needs challenge integration) |
| Dashboard section (KPIs + CRM links) | Needs building |
| Experience Detail (checklist + lightning bolt bridge) | Partially built (checklist exists, bridge needs building) |
| Group call intention flow | Needs building |
| CRM alias layer | Needs building (display-only changes) |
| Mid-cycle nudge | Needs building (push notification) |
| Play Profile DNA personalization | Exists (needs wiring to challenge generation) |
| Shift Architecture Blueprint | Built (positioned as upsell) |

---

### Build Priority

1. **Creator Home menu page** (the hub everything connects to)
2. **Checklist → Play-List bridge** (the keystone)
3. **4-Layer Assessment** (editable card in My Business)
4. **Group call intention flow** (post-call challenge creation)
5. **Dashboard KPIs** (proof of growth)
6. **CRM alias layer** (display changes)
7. **Mid-cycle nudge** (push notification)
8. **Root & Reach diagnosis** (woven into assessment)

---

*Reference docs:*
- `docs/experience-creator-os.md` (full OS vision)
- `docs/experience-creator-stages.md` (stage definitions)
- `docs/subconscious-shift-method.md` (Shift Architecture method)
- `docs/experience-application-template.md` (venue application template)
- `docs/root-and-reach-overview-prompt.md` (Root & Reach framework)
- `docs/feature-brief-experience-creator-matching.md` (matching flow spec)
