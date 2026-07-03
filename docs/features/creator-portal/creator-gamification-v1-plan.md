# Creator Gamification V1 — Implementation Plan

## What We're Building

Two scores on the Creator Home card:
- **Root (0-5):** 5 existence checks × 1 point each. "Have you built the machine?"
- **Reach (0-10):** 10 rolling 7-day binary checks × 1 point each. "Are you running the machine?"
- **One prescribed action** based on the lowest Root gap, in plain language.

No multiplication into a single score. No quadrant UI. No Maintenance. No conversion diagnostics. Just two numbers and one action.

Root is 0-5 in v1 because there are 5 real checks. No artificial doubling. In v2, Maintenance adds another 0-5 and Root becomes 0-10 naturally.

## Files To Create

| File | Purpose |
|------|---------|
| `src/hooks/useRootScore.js` | 5 Supabase queries → Root 0-10 + lowest gap ID |
| `src/hooks/useReachScore.js` | Rolling 7-day queries → Reach 0-10 |
| `src/components/pipeline/RootReachCard.jsx` | Card for Creator Home Growth tab |

## Files To Modify

| File | Change |
|------|--------|
| `src/components/CreatorHome/CreatorHomeV2.jsx` | Import + render RootReachCard in Growth tab |

**No new database tables. No migrations. All data sources already exist.**

---

## Step 1: `useRootScore.js`

### Data Sources (all existing tables)

```javascript
// 5 parallel queries in one Promise.all

// 1. Blow Up Brand → Attract node
//    Has remarkable angle?
supabase.from('remarkable_angles')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
// Score: count > 0 → 1 point

// 2. Leads Strategy → Attract node
//    Completed leads strategy flow?
supabase.from('flow_sessions')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('flow_type', 'leads_strategy')
// Score: count > 0 → 1 point

// 3. Lead Magnet / Attraction Offer → Capture node
//    Has attraction-tier product OR completed attraction_offer flow?
supabase.from('flow_sessions')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('flow_type', 'attraction_offer')
// Also check: products with money_model_tier = 'attraction'
supabase.from('products')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('money_model_tier', 'attraction')
// Score: either count > 0 → 1 point

// 4. Offer Built → Convert node
//    Has any product with a money_model_tier?
supabase.from('products')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .not('money_model_tier', 'is', null)
// Score: count > 0 → 1 point

// 5. Contacts System → Grow node
//    Has 10+ contacts in CRM?
supabase.from('crm_contacts')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
// Score: count >= 10 → 1 point
```

### Return Shape

```javascript
{
  root: 3,                    // 0-5 integer
  breakdown: [
    { key: 'blow_up_brand', label: 'Blow Up Brand', built: true, points: 1, node: 'attract' },
    { key: 'leads_strategy', label: 'Leads Strategy', built: true, points: 1, node: 'attract' },
    { key: 'lead_magnet', label: 'Lead Magnet', built: false, points: 0, node: 'capture' },
    { key: 'offer_built', label: 'Offer', built: true, points: 1, node: 'convert' },
    { key: 'contacts', label: 'Contacts', built: false, points: 0, node: 'grow' },
  ],
  lowestGap: {
    key: 'lead_magnet',
    node: 'capture',
    prescription: "People watch your stuff but you're not collecting their emails. Build a lead magnet so they can sign up.",
    action: { label: 'Build Lead Magnet', route: '/create/attraction-stack' }
  },
  loading: false,
}
```

### Prescriptions (static lookup, plain language)

```javascript
const PRESCRIPTIONS = {
  blow_up_brand: {
    text: "You haven't defined what makes you different yet. Complete the Blow Up Brand flow to find your remarkable angle.",
    action: { label: 'Find Your Angle', route: '/create/remarkable' },
    node: 'attract',
  },
  leads_strategy: {
    text: "You don't have a strategy for where to find your people. Define your leads strategy.",
    action: { label: 'Define Strategy', route: '/leads-strategy' },
    node: 'attract',
  },
  lead_magnet: {
    text: "People see your content but you're not collecting their emails. Build a lead magnet so they can sign up.",
    action: { label: 'Build Lead Magnet', route: '/create/attraction-stack' },
    node: 'capture',
  },
  offer_built: {
    text: "You don't have a packaged offer yet. Create a product people can buy.",
    action: { label: 'Build Your Offer', route: '/product-selection' },
    node: 'convert',
  },
  contacts: {
    text: "You need to start building your contacts list. Add the people who come to your experiences.",
    action: { label: 'Add Contacts', route: '/crm/contacts' },
    node: 'grow',
  },
}
```

**Estimated effort: 1 hour**

---

## Step 2: `useReachScore.js`

### Data Sources (rolling 7-day window, all existing tables)

```javascript
const now = new Date()
const sevenDaysAgo = new Date(now)
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
const since = sevenDaysAgo.toISOString()

// 10 parallel queries in one Promise.all

// 1. Content posted
supabase.from('content_history')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId).eq('status', 'posted')
  .gte('posted_at', since)

// 2. Checklist items completed
supabase.from('experience_checklist_items')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId).eq('completed', true)
  .gte('completed_at', since)

// 3. Outreach done
supabase.from('crm_contacts')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .in('outreach_status', ['reached_out', 'in_conversation', 'meeting_booked'])
  .gte('updated_at', since)

// 4. Wahoo completed
supabase.from('groan_challenges')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId).eq('status', 'completed')
  .gte('completed_at', since)

// 5. Experience delivered
supabase.from('experiences')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId).eq('status', 'completed')
  .gte('updated_at', since)

// 6. Tasks completed
supabase.from('execute_tasks')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId).eq('completed', true)
  .gte('completed_at', since)

// 7. Contacts added to experiences
supabase.from('contact_experiences')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', since)

// 8. 3% reflection logged
supabase.from('experiences')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .not('three_percent_note', 'is', null)
  .gte('updated_at', since)

// 9. Pipeline metric logged
supabase.from('pipeline_metrics')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', since)

// 10. Instagram post (if connected)
supabase.from('instagram_posts')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('posted_at', since)
```

Each query: count > 0 → 1 point. Sum = Reach (0-10).

### Return Shape

```javascript
{
  reach: 4,                   // 0-10 integer
  breakdown: [
    { key: 'content', label: 'Posted content', active: true },
    { key: 'checklist', label: 'Completed checklist items', active: false },
    { key: 'outreach', label: 'Reached out to someone', active: true },
    // ... etc
  ],
  loading: false,
}
```

**Estimated effort: 1 hour**

---

## Step 3: `RootReachCard.jsx`

### UI Design

```
┌─────────────────────────────────────┐
│  Your Momentum                      │
│                                     │
│  ┌─────────┐     ┌─────────┐       │
│  │  Root    │     │  Reach  │       │
│  │         │     │         │       │
│  │   3/5   │     │   4/10  │       │
│  │  ●●●○○  │     │  ●●●●○  │       │
│  │         │     │         │       │
│  └─────────┘     └─────────┘       │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  📍 Your next move:                 │
│  People see your content but you're │
│  not collecting their emails.       │
│                                     │
│  [Build Lead Magnet →]              │
│                                     │
└─────────────────────────────────────┘
```

### Component Details

- Two score circles side by side (Root purple, Reach gold — brand colors)
- Dot bar below each (filled = earned, empty = not yet)
- Below: prescription card with plain-language text + action button
- Action button navigates to the relevant flow with `returnTo=/create`
- If Root = 5 (all built), show Reach-focused message instead: "Your foundation is solid. Keep showing up this week."
- If Root = 5 and Reach ≥ 8, show celebration state: "You're in the sweet spot."

### Styling

- Dark theme (matches Creator Home)
- Uses existing `.ch2-card` container class
- Score circles: simple ring or number, not over-designed
- Prescription area: subtle gold left border (matches brand)
- Action button: `.ch2-btn-outline` (existing class)

**Estimated effort: 1.5 hours**

---

## Step 4: Wire into CreatorHomeV2

### Changes

```jsx
// Add import
import RootReachCard from '../pipeline/RootReachCard'

// Add to Growth tab, ABOVE the KPI grid
<RootReachCard />
```

That's it. One import, one render. The card handles its own data fetching via the two hooks.

**Estimated effort: 5 minutes**

---

## Build Order

```
Step 1 (useRootScore.js)     ──┐
                               ├──→ Step 3 (RootReachCard.jsx) ──→ Step 4 (wire in)
Step 2 (useReachScore.js)    ──┘
```

Steps 1 and 2 are independent — build in parallel or sequence.
Step 3 depends on both hooks.
Step 4 is one line.

## Total Estimated Effort: ~4 hours

| Step | File | Time |
|------|------|------|
| 1 | `useRootScore.js` | 1 hr |
| 2 | `useReachScore.js` | 1 hr |
| 3 | `RootReachCard.jsx` | 1.5 hrs |
| 4 | Wire into CreatorHomeV2 | 5 min |
| 5 | Test + polish | 30 min |

## Gotchas

1. **`pipeline_metrics` table may not exist yet** — the migration was never created. Make this query fail gracefully (catch error, score 0).
2. **`execute_tasks.completed_at`** — verify this column exists. If not, fall back to `updated_at`.
3. **`crm_contacts.updated_at`** — verify outreach tracking has timestamps. May need to use `created_at` as fallback.
4. **Don't cache Root aggressively** — creators will complete a flow and expect the number to move immediately. Recompute on every render; the queries are cheap (all are count-only with `head: true`).
5. **Instagram query is optional** — if `instagram_posts` table doesn't exist (migration not applied), catch the error and score 0 for that item. Same isolation pattern as `useBrandPulse.js`.

## What Success Looks Like

A creator opens the Growth tab and sees:
- Root: 2/5
- Reach: 3/10
- "People see your content but you're not collecting their emails. Build a lead magnet."
- [Build Lead Magnet →]

They tap, complete the Attraction Stack flow, return to the Growth tab, and see:
- Root: **3/5** (moved!)
- The next prescription surfaces automatically.

If that loop works, v1 is validated.
