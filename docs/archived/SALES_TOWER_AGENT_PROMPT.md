# Sales Tower Agent Prompt

**Use this prompt to brief an AI agent focused on continuing the Sales Tower buildout.**

---

## Agent Briefing

You are working on the **Sales Tower** for FindMyFlow, a personal development web app that helps burnt-out professionals discover their ideal career path and build a business around their natural strengths.

The Sales Tower is part of the CRM system, focused on transforming basic deal tracking into a full Hormozi-style revenue optimization system.

---

## Project Context

### Tech Stack
- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI:** Anthropic Claude API
- **Deployment:** Vercel

### Key Directories
```
src/
├── pages/crm/          # CRM pages (CRMDashboard, CRMSales, CRMMarketing)
├── components/crm/     # CRM components
├── lib/crm/            # CRM utilities (dealService.js, taskService.js)
├── flows/              # Money Model flows (MoneyModelFlowBase.jsx)
├── components/MoneyModelShared/  # Shared components (ChecklistDisplay.jsx)
public/
└── Money Model/        # Offer data and implementation checklists (JSON)
supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations
docs/
├── SALES_TOWER_V2_PLAN.md      # Master plan document
└── 2026-01-08-sales-tower-implementation-tiers.md  # Tier details
```

### Current State (as of Jan 8, 2026)
- **Tier 1 COMPLETE:** Implementation checklists display after Money Model flow completion
- **Tier 2 READY:** Interactive progress tracking (next priority)
- **CRM has:** Kanban pipeline, lead scoring (PTUF), sales scripts, screenshot analysis
- **CRM missing:** Progress tracking, velocity metrics, lost/won deal insights, ascension triggers

---

## Your Mission: Build Tier 2

### Goal
Transform static checklists into **tracked implementations** with persistence and progress visibility.

### What Tier 2 Delivers
1. **Progress Tracking:** Users can check off tasks, progress persists in database
2. **Implementation Dashboard:** New route `/crm/implementations` showing all active implementations
3. **CRM Integration:** Progress card visible on main CRM Dashboard
4. **Milestone Celebrations:** Confetti/celebration when completing phases

### Database Schema to Create

```sql
-- Migration: 20260109000000_offer_implementations.sql

CREATE TABLE offer_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL,           -- e.g., 'classic_upsell', 'menu_upsell'
  category TEXT NOT NULL,             -- 'attraction', 'upsell', 'downsell', 'continuity'
  flow_assessment_id UUID,            -- Link to the flow result that recommended this
  status TEXT DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
  completed_tasks JSONB DEFAULT '[]', -- Array of { phase: number, taskIndex: number }
  current_phase TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_implementations_user ON offer_implementations(user_id);

-- RLS policies
ALTER TABLE offer_implementations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own implementations"
  ON offer_implementations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own implementations"
  ON offer_implementations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own implementations"
  ON offer_implementations FOR UPDATE
  USING (auth.uid() = user_id);
```

### Files to Create

#### 1. `src/pages/crm/ImplementationTracker.jsx`
Main dashboard showing all user's implementations:
- List of active implementations with progress bars
- Filter by category (Attraction, Upsell, Downsell, Continuity)
- Click to expand and work on implementation
- "Start New Implementation" button linking to Money Model flows

#### 2. `src/pages/crm/ImplementationTracker.css`
Styles matching existing CRM aesthetic (dark theme, purple accents).

#### 3. `src/lib/crm/implementationService.js`
Database service functions:
```javascript
// Functions to implement:
export async function getUserImplementations(userId)
export async function createImplementation(userId, offerType, category, assessmentId)
export async function updateTaskCompletion(implementationId, phase, taskIndex, completed)
export async function updateImplementationStatus(implementationId, status)
export async function getImplementationProgress(implementationId)
```

#### 4. Update `src/components/MoneyModelShared/ChecklistDisplay.jsx`
- Add "Start Tracking This" button after viewing checklist
- When clicked, creates implementation record and navigates to tracker
- If implementation already exists, show progress and "Continue" button

#### 5. Add route in `src/AppRouter.jsx`
```jsx
<Route path="/crm/implementations" element={<AuthGate><ImplementationTracker /></AuthGate>} />
```

#### 6. Add navigation in `src/pages/crm/CRMDashboard.jsx`
- Add "Implementations" card/section showing active implementation count
- Quick link to `/crm/implementations`

### UI Patterns to Follow

**CRM uses dark theme with purple accents:**
- Background: `#1a1a2e`
- Card background: `rgba(255, 255, 255, 0.03)`
- Borders: `rgba(255, 255, 255, 0.1)`
- Primary accent: `#6366f1`
- Success: `#22c55e`
- Warning: `#fbbf24`

**Existing component patterns:**
- See `ChecklistDisplay.jsx` for expandable phase UI
- See `CRMDashboard.jsx` for card layout
- See `CRMSales.jsx` for Kanban-style interaction

### Integration Points

1. **After Money Model Flow Completion:**
   - User sees ChecklistDisplay with recommended offer
   - "Start Tracking" creates implementation record
   - Redirects to `/crm/implementations` with that implementation expanded

2. **CRM Dashboard:**
   - Show "Active Implementations" card
   - Display count and progress percentage
   - Link to full tracker

3. **Marketing Integration (future):**
   - When "Email Sequence" phase completes → trigger content generation prompts
   - When "Payment Infrastructure" completes → enable payment plans in deals

---

## Key Reference Files

Read these files to understand existing patterns:

1. **`src/lib/implementationChecklists.js`** - Checklist loader (already built)
2. **`src/components/MoneyModelShared/ChecklistDisplay.jsx`** - Current UI (already built)
3. **`public/Money Model/Upsell/implementation_checklists.json`** - Checklist data structure
4. **`src/flows/MoneyModelFlowBase.jsx`** - How checklists integrate with flows
5. **`src/pages/crm/CRMDashboard.jsx`** - CRM main dashboard pattern
6. **`src/lib/crm/dealService.js`** - Database service pattern

---

## Success Criteria

Tier 2 is complete when:

1. ✅ Users can click "Start Tracking" on any checklist
2. ✅ Implementation record created in database
3. ✅ Users can check off tasks, changes persist
4. ✅ Progress percentage calculated and displayed
5. ✅ `/crm/implementations` route shows all user's implementations
6. ✅ CRM Dashboard shows implementation summary
7. ✅ Phase completion triggers celebration (confetti)

---

## Future Tiers (Context Only)

### Tier 3: AI Implementation Coach
- Zarlo becomes implementation coach
- AI generates actual deliverables (headlines, emails, scripts)
- Smart sequencing of implementation order

### Tier 4: Autonomous Sales System
- Multi-agent orchestration with Claude Agent SDK
- Self-implementing offers
- Continuous A/B testing and optimization

---

## Commands to Run

```bash
# Start dev server
npm run dev

# Apply migrations
npm run db:push

# Deploy edge functions
./scripts/deploy-functions.sh
```

---

## Questions to Ask the User

Before starting implementation, clarify:

1. Should implementations be tied to projects, or user-level?
2. Priority: Start with just progress tracking, or include CRM dashboard integration?
3. Should multiple implementations of the same offer type be allowed?
4. Celebration preference: Confetti? Sound? Badge?

---

*This prompt was generated on January 8, 2026 to hand off Sales Tower development.*
