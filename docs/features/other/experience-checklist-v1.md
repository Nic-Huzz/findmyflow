# Experience Checklist v1 — Business Tab Rebuild

**Date:** 2026-04-07
**Status:** Scoped, ready to build
**Context:** Pivot to experience creators. Business tab becomes a pre/post-event checklist system with compounding 3% reflection, plus the seed of a native CRM via attendee capture.

---

## Goal

Give experience creators (workshop / retreat / cohort runners) a dead-simple "set up for success" checklist for every event they run. Pre-event covers marketing + organisation. Post-event covers follow-up + reflection. Each experience's 3% reflection surfaces on the next one so improvements compound.

**Secondary goal:** when the user uploads attendee names + emails as part of the post-event follow-up, persist them to `crm_contacts` so FindMyFlow has the foundation of a native CRM for experience creators.

## V1 scope

**In:**
- Experiences catalog (`/business`) — list of upcoming + past experiences, `+` to add
- Create / edit single experience (name, date)
- Per-experience pre-event checklist (Marketing + Organisation sections)
- Per-experience post-event checklist (Follow-up + Reflection sections)
- Three reflection fields: wahoo note, scary note, 3% better note
- Previous experience's 3% note surfaced at top of new experience creation + on catalog cards
- Checklist items editable per experience: seeded items can be hidden/skipped (not deleted), custom items can be added + reordered
- Attendee upload (CSV paste or manual rows) during post-event follow-up step → writes to `crm_contacts` + links via `experience_attendees` join table

**Out (deferred to v1.5+):**
- Sending the follow-up emails (checklist is "do this", user uses their own tools)
- Per-experience-type templates (one template for all in v1)
- Editable master template UI (seeded items are hardcoded in v1)
- Funnels / landing pages / payment processing
- Per-item due dates / timing
- Alumni re-engagement, testimonial bank, attendee lifecycle states beyond registered/attended

## Data model

### New tables

```sql
-- Spine of the system
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  experience_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming | completed | archived
  previous_experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,

  -- Reflection (filled out post-event)
  wahoo_note TEXT,              -- what worked
  scary_note TEXT,              -- what drained energy / friction
  three_percent_note TEXT,      -- the one improvement for next time

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-experience checklist items (copied from template on creation, then editable)
CREATE TABLE experience_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,          -- pre | post
  section TEXT NOT NULL,        -- marketing | organisation | followup | reflection
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_custom BOOLEAN DEFAULT FALSE,  -- true = user-added, false = from template
  is_hidden BOOLEAN DEFAULT FALSE,  -- user skipped this seeded item
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join: which crm_contacts attended which experience
CREATE TABLE experience_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT TRUE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experience_id, contact_id)
);

-- RLS: user_id ownership on all three
```

### Reuse of `crm_contacts`

No schema change to `crm_contacts` in v1. When attendees are uploaded:
1. For each row (name + email), check if `crm_contacts` row exists for that `user_id` + email.
2. If not, insert a new contact with `source = 'experience_attendee'` and the name.
3. Insert a row in `experience_attendees` linking contact → experience.

Result: the user's CRM starts populating automatically from real attendees, zero extra work.

### Seeded template (hardcoded in `src/lib/experienceChecklistTemplate.js`)

```js
export const EXPERIENCE_CHECKLIST_TEMPLATE = [
  // PRE-EVENT → Marketing
  { phase: 'pre', section: 'marketing', sort_order: 1, label: 'Write the one-line promise (what transformation do attendees get?)' },
  { phase: 'pre', section: 'marketing', sort_order: 2, label: 'Create the booking / sales page link' },
  { phase: 'pre', section: 'marketing', sort_order: 3, label: 'Announce to your email list' },
  { phase: 'pre', section: 'marketing', sort_order: 4, label: 'Post 3 teaser pieces on social' },
  { phase: 'pre', section: 'marketing', sort_order: 5, label: 'DM 10 warm leads personally with a direct invite' },
  { phase: 'pre', section: 'marketing', sort_order: 6, label: 'Share 1 testimonial from a past experience' },
  { phase: 'pre', section: 'marketing', sort_order: 7, label: 'Set up confirmation email for registrants' },
  { phase: 'pre', section: 'marketing', sort_order: 8, label: 'Post behind-the-scenes content in the final week' },
  { phase: 'pre', section: 'marketing', sort_order: 9, label: 'Send "last chance" reminder 48h before close' },

  // PRE-EVENT → Organisation
  { phase: 'pre', section: 'organisation', sort_order: 1, label: 'Confirm venue / platform / tech setup' },
  { phase: 'pre', section: 'organisation', sort_order: 2, label: 'Write the run-sheet (minute-by-minute agenda)' },
  { phase: 'pre', section: 'organisation', sort_order: 3, label: 'Prepare materials (slides, handouts, physical items)' },
  { phase: 'pre', section: 'organisation', sort_order: 4, label: 'Test tech end-to-end (audio, video, recording)' },
  { phase: 'pre', section: 'organisation', sort_order: 5, label: 'Brief any co-hosts or support staff' },
  { phase: 'pre', section: 'organisation', sort_order: 6, label: 'Prepare the opening ritual / energy set' },
  { phase: 'pre', section: 'organisation', sort_order: 7, label: 'Confirm payment processing is working' },
  { phase: 'pre', section: 'organisation', sort_order: 8, label: 'Prepare attendee list + name tags / welcome messages' },
  { phase: 'pre', section: 'organisation', sort_order: 9, label: 'Plan how you\'ll capture feedback + photos on the day' },

  // POST-EVENT → Follow-up
  { phase: 'post', section: 'followup', sort_order: 1, label: 'Upload attendee contact data', key: 'upload_attendees' }, // special: triggers upload UI
  { phase: 'post', section: 'followup', sort_order: 2, label: 'Send thank-you email within 24 hours' },
  { phase: 'post', section: 'followup', sort_order: 3, label: 'Send feedback / review request within 48 hours' },
  { phase: 'post', section: 'followup', sort_order: 4, label: 'Send upsell or next-experience invite within 7 days' },
  { phase: 'post', section: 'followup', sort_order: 5, label: 'Collect written testimonials from 3+ attendees' },
  { phase: 'post', section: 'followup', sort_order: 6, label: 'Upload photos / highlights reel' },

  // POST-EVENT → Reflection
  { phase: 'post', section: 'reflection', sort_order: 1, label: 'What worked? (wahoo moments)', key: 'wahoo_note' },
  { phase: 'post', section: 'reflection', sort_order: 2, label: 'What drained energy? (scary / friction moments)', key: 'scary_note' },
  { phase: 'post', section: 'reflection', sort_order: 3, label: 'What one 3% improvement will you make next time?', key: 'three_percent_note' },
  { phase: 'post', section: 'reflection', sort_order: 4, label: 'Archive this experience' },
]
```

Items with a `key` field render a special input UI instead of a plain checkbox:
- `upload_attendees` → opens attendee upload modal (CSV paste + manual rows)
- `wahoo_note` / `scary_note` / `three_percent_note` → textarea that writes to the `experiences` table column

## Routes + pages

| Route | Component | Purpose |
|---|---|---|
| `/business` | `ExperienceCatalog.jsx` | List of experiences (upcoming + past), `+` button, most recent 3% note surfaced at top |
| `/business/experience/new` | `ExperienceCreate.jsx` | Name + date form. On submit: insert experience, seed checklist from template, redirect to detail. If a previous completed experience exists, show its 3% note above the form |
| `/business/experience/:id` | `ExperienceDetail.jsx` | Tabs: [Pre-Event] [Post-Event]. Each tab shows its sections with progress rings. Editable checklist. Mark experience complete when post is done. |

`/business/app` (legacy BusinessPage) stays as-is for internal preview.
`BusinessLanding.jsx` is deleted (it was a stopgap).

## Component tree

```
ExperienceCatalog
├── PreviousReflectionCard        ← shows last completed experience's 3% note
├── ExperienceCard (upcoming)     ← one per upcoming experience
├── ExperienceCard (past)         ← one per completed experience
└── NewExperienceButton (+)

ExperienceCreate
├── PreviousReflectionBanner      ← top banner if prior experience exists
└── ExperienceForm (name, date)

ExperienceDetail
├── ExperienceHeader              ← name, date, status, progress summary
├── Tabs: Pre / Post
├── ChecklistSection              ← marketing / organisation / followup / reflection
│   ├── ProgressRing
│   ├── ChecklistItem             ← checkbox + label + edit/hide/notes
│   ├── SpecialItem (upload_attendees) → AttendeeUploadModal
│   └── SpecialItem (reflection textareas) → writes to experiences table
├── AddCustomItemButton
└── MarkCompleteButton            ← only enabled when post checklist done

AttendeeUploadModal
├── CSV paste textarea ("Paste name,email per line")
├── Manual row entry
├── Preview table
└── Save button → bulk insert into crm_contacts + experience_attendees
```

## Build sequence

1. **Migration** — create `experiences`, `experience_checklist_items`, `experience_attendees` with RLS.
2. **Template + seed helper** — `src/lib/experienceChecklistTemplate.js` with the hardcoded list, plus `seedChecklistForExperience(experienceId)` helper.
3. **Data hook** — `src/hooks/useExperienceData.js` handles fetch/create/update/toggle/addCustom/hide for experiences + checklist items.
4. **`ExperienceCatalog`** — list page at `/business`, read experiences, show previous 3% note card, render upcoming + past cards, `+` button.
5. **`ExperienceCreate`** — form at `/business/experience/new`, seeds checklist on submit.
6. **`ExperienceDetail`** — tabs, sections, checklist items, reflection textareas wired to `experiences` table columns, mark-complete button.
7. **`AttendeeUploadModal`** — CSV paste + bulk insert into `crm_contacts` (dedupe by email per user) + `experience_attendees`.
8. **Delete `BusinessLanding.jsx`** and revert `/business` route to point at `ExperienceCatalog`. Keep `/business/app` pointing at legacy `BusinessPage`.
9. **Styles** — match FindMyFlow design system (purple gradient hero, white section cards with gradient accent bars, gold CTAs, glass morphism). See `docs/page-component-design-guide.md`.

## Resolved decisions

| # | Question | Decision |
|---|---|---|
| 1 | Checklist items editable per experience? | Yes — seeded items hidable/skippable (not deletable), custom items addable + reorderable |
| 2 | One reflection field or three? | Three — `wahoo_note`, `scary_note`, `three_percent_note`, matching Groan Matrix vocabulary |
| 3 | How is the next experience nudged? | `/business` catalog is the hub: list of experiences, click past to view, `+` to add new. Previous 3% note shown on catalog + on create form |
| 4 | Per-experience-type templates? | No — one unified template in v1 |
| 5 | Content of seeded checklists? | Approved as drafted |
| 6 | **Bonus: save uploaded names + emails as CRM foundation?** | **Yes** — attendee upload writes to existing `crm_contacts` with `source = 'experience_attendee'`, linked via `experience_attendees` join table |

## Writing style reminders

- Never use em dashes in user-facing copy.
- Lean on existing FindMyFlow vocabulary: wahoo, scary, 3% better, compass.
- Purple→gold gradient, gold CTAs, glass morphism cards.

## What this unlocks for v1.5+

- Attendee lifecycle management (registered → attended → alumni)
- Native email sending tied to follow-up checklist items
- Experience-type templates (retreat / workshop / online cohort)
- Testimonial capture linked to attendees
- Repeat-attendee detection and alumni re-engagement flows
- P&L per experience (revenue from registrations minus expenses)
- Integration with existing CRM towers (Attract / Nurture / Tools)

The v1 foundation is small enough to ship fast but rich enough that every v1.5 addition is a pure extension, not a refactor.
