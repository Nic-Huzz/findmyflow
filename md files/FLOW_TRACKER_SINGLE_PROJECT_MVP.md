# Flow Tracker: Single-Project MVP

**Date:** December 4, 2025
**Status:** ✅ Implemented

## Executive Summary

Simplified the Flow Tracker to support **one project per user** for the MVP, reducing complexity and improving UX for focused flow tracking.

---

## Problem Statement

The original Flow Tracker supported multiple projects with manual creation:
- **+ New Project** button in header
- **Project selector dropdown** in Quick Log
- **Empty state card** for creating additional projects

This created unnecessary complexity for MVP:
- Decision fatigue: "Which project should I log to?"
- Mental overhead managing multiple projects
- Slower logging workflow
- Risk of scattered data across projects

---

## Solution: Single-Project MVP

### Core Principles

1. **One project, one focus** - Users track a single journey
2. **Zero friction** - No project selection needed
3. **Smart defaults** - Auto-select the user's project
4. **Graceful onboarding** - Required modal for first-time users

### User Flows

#### Flow 1: Vibe Seekers (Complete Nikigai)
```
1. User completes Nikigai Integration flow
2. Project auto-created with name from Nikigai (e.g., "Coaching for Entrepreneurs")
3. User visits /flow-tracker
4. Project auto-selected
5. User starts logging immediately
```

#### Flow 2: Vibe Risers/Movement Makers (Skip Nikigai)
```
1. User visits /flow-tracker (no existing project)
2. Modal appears: "Create Your Project"
   - Single field: "What project are you tracking?"
   - Placeholder: "e.g., My Business Launch, Personal Growth Journey..."
3. User enters name, presses Enter or clicks "Create Project"
4. Project created with auto-description: "Tracking my flow journey"
5. Modal closes, project auto-selected
6. User starts logging immediately
```

#### Flow 3: Manual → Nikigai (Duplicate Prevention)
```
1. User manually creates project "My Business" on /flow-tracker
2. Later completes Nikigai Integration
3. System checks: User already has active project
4. Skips auto-creation (prevents duplicate)
5. Logs: "✅ Skipped project creation - user already has an active project"
6. User continues with existing project
```

---

## Implementation Details

### Changes Made

#### 1. Removed Multi-Project UI
**File:** `src/pages/FlowTracker.jsx`

**Removed:**
- `+ New Project` button from page header (line ~309)
- Project selector dropdown from Quick Log section (lines ~319-333)
- "Start a New Project" empty state card (lines ~482-487)

#### 2. Auto-Project Selection
**File:** `src/pages/FlowTracker.jsx`

**Added:**
```javascript
const loadProjects = async () => {
  // ... fetch projects ...

  if (data && data.length > 0) {
    setSelectedProjectId(data[0].id)  // Auto-select first project
    await loadProjectStats(data.map(p => p.id))
  } else {
    setShowCreateModal(true)  // Show modal if no projects
  }
}
```

**Quick Log behavior:**
- Keeps project selected after logging (previously reset to empty)
- Only resets energy/flow state

#### 3. First-Time Project Creation Modal
**File:** `src/pages/FlowTracker.jsx`

**Added state:**
```javascript
const [showCreateModal, setShowCreateModal] = useState(false)
const [newProjectName, setNewProjectName] = useState('')
const [creatingProject, setCreatingProject] = useState(false)
```

**Modal features:**
- Required (can't dismiss until project created)
- Single field: project name
- Auto-description: "Tracking my flow journey"
- Enter key support
- Loading state during creation
- Reuses existing modal styles

#### 4. Duplicate Prevention Logic
**File:** `src/lib/projectCreation.js`

**Added check at start of `createProjectFromSession()`:**
```javascript
// Step 0: Check if user already has an active project (Single-Project MVP)
const { data: existingProjects, error: checkError } = await supabase
  .from('user_projects')
  .select('id, name')
  .eq('user_id', userId)
  .eq('status', 'active')

if (existingProjects && existingProjects.length > 0) {
  console.log('✅ User already has an active project, skipping auto-creation')
  return {
    success: true,
    projectId: existingProjects[0].id,
    skipped: true,
    reason: 'User already has an active project'
  }
}
```

**File:** `src/NikigaiTest.jsx`

**Updated success handling:**
```javascript
if (projectResult.success) {
  if (!projectResult.alreadyExists && !projectResult.skipped) {
    // Show "project created" message
  } else if (projectResult.skipped) {
    console.log('✅ Skipped project creation - user already has an active project')
  }
}
```

---

## Technical Decisions

### Decision 1: Skip vs Update vs Choice

**Options Considered:**
1. **Skip auto-creation if project exists** ✅ (Chosen)
2. Update existing project with Nikigai data
3. Prompt user to choose between existing/new

**Rationale:**
- **Option 1 (Skip)** is cleanest for MVP
- Preserves user's manual choice and existing data
- No destructive operations
- Simple, predictable behavior

### Decision 2: Required Modal vs Optional

**Chosen:** Required (can't dismiss)

**Rationale:**
- Flow Tracker requires a project to function
- Better to block and collect data upfront
- Prevents "empty state" confusion
- Users understand they must create project first

### Decision 3: Project Name Only vs Full Form

**Chosen:** Single field (name only)

**Rationale:**
- Minimal friction
- Auto-description is good enough: "Tracking my flow journey"
- Users can always update later if needed
- MVP simplicity over customization

---

## Edge Cases Handled

### Case 1: User Creates Project Then Completes Nikigai
**Behavior:** Nikigai skips auto-creation, keeps existing project
**Status:** ✅ Handled

### Case 2: User Completes Nikigai Then Visits Flow Tracker
**Behavior:** Project already created, auto-selected
**Status:** ✅ Handled

### Case 3: New User (No Nikigai, No Project)
**Behavior:** Modal appears, required to create project
**Status:** ✅ Handled

### Case 4: Multiple Nikigai Completions
**Behavior:** First completion creates project, subsequent skip
**Status:** ✅ Handled (via duplicate check)

---

## Testing Checklist

- [ ] New user visits /flow-tracker → Modal appears
- [ ] Enter project name → Modal closes, project created
- [ ] Quick log works without project selector
- [ ] Project stays selected after logging
- [ ] Complete Nikigai → Project created
- [ ] Visit flow tracker after Nikigai → Auto-selected
- [ ] Manual create → Complete Nikigai → No duplicate
- [ ] Projects grid shows single project card
- [ ] Timeline modal works for single project
- [ ] Mobile responsive (modal + quick log)

---

## Database Schema

No schema changes required. Existing `user_projects` table supports single-project MVP.

**Relevant fields:**
```sql
user_projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  source_flow TEXT,  -- 'nikigai', '100m_offer', etc.
  source_session_id UUID,
  created_at TIMESTAMP
)
```

---

## Future Considerations

### Multi-Project Support (Post-MVP)
If we later add multiple projects:
1. Restore project selector dropdown
2. Add "+ New Project" button
3. Add project switching UI
4. Consider project archiving/status

### Project Renaming
Users may want to rename their single project:
1. Add "Edit Project" button to project card
2. Allow inline name/description editing
3. Update FlowMap to reflect changes

### Project Templates
For different user types:
- Vibe Seekers: "My Nikigai Journey"
- Vibe Risers: "My Offer Creation"
- Movement Makers: "My Business Growth"

---

## Files Modified

```
src/pages/FlowTracker.jsx          - Main UI changes, modal, auto-selection
src/lib/projectCreation.js          - Duplicate prevention logic
src/NikigaiTest.jsx                 - Handle skipped project creation
FLOW_TRACKER_SINGLE_PROJECT_MVP.md  - This documentation
```

---

## Success Metrics

**UX Improvements:**
- ✅ Removed 3 UI elements (button, dropdown, empty card)
- ✅ Reduced Quick Log fields from 4 to 2
- ✅ Zero-click project selection (auto-selected)
- ✅ One-time setup modal for new users

**Code Simplification:**
- ✅ 50+ lines of UI code removed
- ✅ Duplicate prevention in 15 lines
- ✅ Reused existing modal styles
- ✅ No database migrations needed

---

## Notes

- Modal uses existing `timeline-modal` CSS classes for consistency
- Enter key support for faster project creation
- Console logs for debugging project creation flow
- Error handling for project creation failures
- Loading states prevent double-submissions

---

## Questions & Answers

**Q: What if user wants multiple projects later?**
A: Post-MVP feature. For now, they can archive/delete and create new one.

**Q: Can user rename their project?**
A: Not in current UI, but data supports it. Can add edit button later.

**Q: What happens to old multi-project data?**
A: System still supports multiple projects in DB. UI just doesn't show them.

**Q: Should Nikigai update existing project instead of skip?**
A: No - that's destructive. User's manual choice takes precedence.

---

## Approval & Sign-Off

**Decision:** Single-project MVP approach approved
**Implementation:** Complete
**Status:** ✅ Ready for testing

**Dev Server:** http://localhost:5173/flow-tracker
