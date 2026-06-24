# Guide: Adding New Challenges to the 7-Day Challenge

**Last Updated:** December 4, 2025
**For:** Developers & Product Team

---

## 📋 Overview

This guide walks you through adding new challenges to the 7-day challenge system. Challenges can be:
- **Daily/Weekly/Bonus/Tracker** - Available to all users
- **Flow Finder** - Persona and stage-specific

---

## 🎯 Challenge Types

### 1. Flow Challenges
**Purpose:** Launch user into a flow/assessment
**When to Use:** Creating a new flow that should count toward graduation

**Example:** $100M Offer Builder, Lead Magnet Designer

### 2. Milestone Challenges
**Purpose:** User marks completion of a milestone (with optional text/description)
**When to Use:** Tracking completion of non-flow work (creating offer, testing, etc.)

**Example:** "Create Acquisition Offer", "Test with 3 users"

### 3. Conversation Log Challenges
**Purpose:** Track customer conversations with special UI
**When to Use:** Validating ideas or getting feedback from real people

**Example:** Validation Conversations, Feedback Conversations

### 4. Daily Repeatable Challenges
**Purpose:** Daily habit tracking with streak bubbles
**When to Use:** Launch stage implementation tracking

**Example:** Daily Implementation (maxPerDay: 1)

---

## 📝 Step-by-Step: Adding a New Challenge

### Step 1: Add to challengeQuestsUpdate.json

**Location:** `/public/challengeQuestsUpdate.json`

**Template:**
```json
{
  "id": "unique_challenge_id",
  "category": "Flow Finder",
  "type": "Vibe Riser",
  "stage_required": "creation",
  "name": "Challenge Display Name",
  "description": "Clear description of what user needs to do",
  "points": 35,
  "inputType": "flow",
  "flow_id": "flow_id_for_quest_completion",
  "flow_route": "/route-to-flow",
  "persona_specific": ["vibe_riser"],
  "counts_toward_graduation": true,
  "learnMore": "Detailed explanation of why this matters and what to expect."
}
```

**Field Reference:**

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `id` | ✅ Yes | String | Unique identifier (use snake_case) |
| `category` | ✅ Yes | "Daily", "Weekly", "Flow Finder", "Tracker", "Bonus" | Which tab it appears in |
| `type` | ✅ Yes | "Recognise", "Release", "Rewire", "Reconnect" (Daily/Weekly) OR persona names (Flow Finder) | Categorization |
| `stage_required` | For Flow Finder | "clarity", "validation", "creation", "testing", "launch", "ideation" | Which stage user must be in |
| `name` | ✅ Yes | String | Display name (short) |
| `description` | ✅ Yes | String | What user needs to do (supports markdown links) |
| `points` | ✅ Yes | Number | Points awarded on completion |
| `inputType` | ✅ Yes | "flow", "text", "checkbox", "milestone", "conversation_log" | How user completes it |
| `flow_id` | For flows | String | Used in quest completion tracking |
| `flow_route` | For flows | String | Path to flow (e.g., "/100m-offer") |
| `milestone_type` | For milestones | String | Must match graduation requirements |
| `placeholder` | For text input | String | Placeholder text |
| `persona_specific` | For Flow Finder | Array | ["vibe_seeker", "vibe_riser", "movement_maker"] |
| `counts_toward_graduation` | For milestones/flows | Boolean | Does it count toward stage graduation? |
| `maxPerDay` | For daily repeatable | Number | Max completions per day (enables streak bubbles) |
| `maxCompletions` | Optional | Number | Total completions allowed (lifetime) |
| `learnMore` | Optional | String | Detailed explanation (collapsible section) |
| `status` | Optional | "coming_soon" | Grays out and disables challenge |

---

### Step 2: Add Flow Integration (Flow Challenges Only)

If `inputType: "flow"`, you need to auto-complete the quest when user finishes the flow.

**Location:** Your flow component (e.g., `/src/MyNewFlow.jsx`)

**Add Import:**
```javascript
import { completeFlowQuest } from './lib/questCompletion'
```

**Add Completion Call:**
Find where you save assessment results (usually after `supabase.from('assessments').insert()`), and add:

```javascript
// Complete challenge quest
try {
  await completeFlowQuest({
    userId: user.id,
    flowId: 'your_flow_id_from_json',  // Must match challenge.flow_id
    pointsEarned: 35  // Must match challenge.points
  })
} catch (questError) {
  console.warn('Quest completion failed:', questError)
}
```

**Example:**
```javascript
// After saving assessment
await supabase.from('my_flow_assessments').insert([{ ...data }])

// Track flow completion
await supabase.from('flow_sessions').insert({
  user_id: user.id,
  flow_type: 'my_flow',  // See Step 3
  status: 'completed'
})

// Complete challenge quest ⭐ NEW
try {
  await completeFlowQuest({
    userId: user.id,
    flowId: 'flow_my_new_flow',
    pointsEarned: 35
  })
} catch (questError) {
  console.warn('Quest completion failed:', questError)
}

setStage(STAGES.SUCCESS)
```

---

### Step 3: Add to Graduation Requirements (If Required for Progression)

If this challenge is required for users to graduate to the next stage, add it to graduation requirements.

**Location:** `/src/lib/personaStages.js`

**For Flow Challenges:**
Add to `flows_required` array:
```javascript
creation: {
  flows_required: ['100m_offer', 'lead_magnet_offer', 'my_new_flow'],  // ⭐ Add here
  milestones: ['product_created'],
  description: 'Create your offer and lead magnet'
}
```

**Important:** The value in `flows_required` must match the `flow_type` you save in `flow_sessions` table!

**For Milestone Challenges:**
Add to `milestones` array:
```javascript
testing: {
  flows_required: [],
  milestones: ['testing_complete', 'feedback_responses_3', 'my_new_milestone'],  // ⭐ Add here
  description: 'Test your product'
}
```

**Important:** The value in `milestones` must match the `milestone_type` in your challenge JSON!

---

### Step 4: Update Server-Side Graduation Requirements

**Location:** `/supabase/functions/graduation-check/index.ts`

Find the `PERSONA_STAGES` constant and add the same requirement you added in Step 3.

**Must match client-side exactly!**

```typescript
const PERSONA_STAGES = {
  vibe_riser: {
    creation: {
      flows_required: ['100m_offer', 'lead_magnet_offer', 'my_new_flow'],  // ⭐ Add here
      milestones: ['product_created']
    }
  }
}
```

---

### Step 5: Test Your Challenge

#### Manual Testing Checklist

**Display Test:**
- [ ] Challenge appears in correct tab (category)
- [ ] Challenge only shows for correct persona
- [ ] Challenge only shows when in correct stage
- [ ] "Learn More" section displays correctly
- [ ] Points display correctly

**Completion Test:**
- [ ] Flow challenge: Complete flow → verify quest auto-marks complete
- [ ] Milestone challenge: Enter description → click complete → verify marked complete
- [ ] Checkbox challenge: Check box → click complete → verify marked complete
- [ ] Points awarded to user correctly

**Graduation Test:**
- [ ] If required for graduation: Complete all stage requirements including new challenge
- [ ] Verify graduation checker recognizes completion
- [ ] Verify user can graduate to next stage

**Database Verification:**
- [ ] Check `quest_completions` table for new entry
- [ ] Verify `challenge_instance_id` links to active challenge
- [ ] If flow: Check `flow_sessions` table for completion record

---

## 🎨 Challenge Design Best Practices

### Naming Conventions

**IDs (in JSON):**
- Flow challenges: `flow_[descriptive_name]`
- Milestones: `milestone_[descriptive_name]`
- Daily: `[category]_[name]` (e.g., `recognise_essence_observe`)

**Display Names:**
- Short and action-oriented: "Create Lead Magnet", "Test with 3 Users"
- Use title case
- Avoid jargon

**Descriptions:**
- Clear action: "Complete the $100M Offer flow to design your irresistible offer"
- Can include markdown links: `[View guide](/link)`
- Keep under 200 characters for readability

### Point Allocation Guidelines

| Challenge Type | Points | Reasoning |
|----------------|--------|-----------|
| Flow (30+ min) | 30-40 | Major time investment |
| Milestone (creation) | 25-30 | Significant work required |
| Milestone (decision) | 15-20 | Strategic thinking needed |
| Milestone (confirmation) | 10-15 | Quick checkbox/verification |
| Daily habit | 5-10 | Frequent, quick actions |
| Conversation log | 10 | Per conversation (repeatable) |

### When to Make It Flow Finder vs Daily/Weekly

**Flow Finder (Persona-Specific):**
- Part of stage progression
- Required for graduation
- One-time completion per persona
- Strategic/planning work

**Daily/Weekly (Available to All):**
- Habit building
- Self-improvement
- Repeatable activities
- Not required for graduation

---

## 🐛 Common Mistakes to Avoid

### ❌ Mistake #1: Mismatched IDs
```json
// challengeQuestsUpdate.json
{
  "flow_id": "my_flow",
  "milestone_type": "my_milestone"
}

// Flow component
completeFlowQuest({ flowId: 'my_different_flow' })  // ❌ Doesn't match!

// personaStages.js
flows_required: ['yet_another_name']  // ❌ Doesn't match!
```

**Fix:** Use exact same ID everywhere.

### ❌ Mistake #2: Wrong Stage Name
```json
{
  "stage_required": "Creation"  // ❌ Capitalized
}
```

**Fix:** Always lowercase: `"creation"`, `"validation"`, `"testing"`, `"launch"`, `"ideation"`, `"clarity"`

### ❌ Mistake #3: Missing Persona Filter
```json
{
  "category": "Flow Finder",
  // ❌ Missing: "persona_specific": ["vibe_riser"]
}
```

**Fix:** Always include `persona_specific` for Flow Finder challenges.

### ❌ Mistake #4: Wrong inputType for Intent
- Want user to go to a flow? Use `"inputType": "flow"` (not "milestone")
- Want user to write description? Use `"inputType": "text"` (not "milestone")
- Want user to just check done? Use `"inputType": "checkbox"`
- Want to track completion formally? Use `"inputType": "milestone"` with `milestone_type`

### ❌ Mistake #5: Forgetting Server-Side Updates
Updated client-side `personaStages.js` but forgot to update server-side graduation checker in edge function.

**Result:** Graduation check fails or gives inconsistent results.

**Fix:** Always update both files.

---

## 📊 Examples by Type

### Example 1: Flow Challenge (Vibe Riser, Creation Stage)

```json
{
  "id": "flow_pricing_strategy",
  "category": "Flow Finder",
  "type": "Vibe Riser",
  "stage_required": "creation",
  "name": "Pricing Strategy Builder",
  "description": "Determine the optimal pricing for your offer using value-based pricing principles",
  "points": 35,
  "inputType": "flow",
  "flow_id": "flow_pricing_strategy",
  "flow_route": "/pricing-strategy",
  "persona_specific": ["vibe_riser"],
  "counts_toward_graduation": true,
  "learnMore": "This flow helps you set prices that reflect true value, not just costs. You'll identify your ideal customer's willingness to pay and structure pricing tiers."
}
```

**Graduation Requirements:**
```javascript
// personaStages.js
creation: {
  flows_required: ['100m_offer', 'lead_magnet_offer', 'pricing_strategy'],
  // ...
}
```

**Flow Integration:**
```javascript
// PricingStrategyFlow.jsx
import { completeFlowQuest } from './lib/questCompletion'

// After saving results
try {
  await completeFlowQuest({
    userId: user.id,
    flowId: 'flow_pricing_strategy',
    pointsEarned: 35
  })
} catch (questError) {
  console.warn('Quest completion failed:', questError)
}
```

---

### Example 2: Milestone Challenge (Movement Maker, Creation Stage)

```json
{
  "id": "milestone_pricing_set",
  "category": "Flow Finder",
  "type": "Movement Maker",
  "stage_required": "creation",
  "name": "Set Final Pricing",
  "description": "Document your final pricing for all 4 offers in your money model",
  "points": 25,
  "inputType": "text",
  "milestone_type": "pricing_set",
  "placeholder": "List your pricing for acquisition, upsell, downsell, and continuity offers",
  "persona_specific": ["movement_maker"],
  "counts_toward_graduation": true,
  "learnMore": "Clear pricing removes friction from your sales process. Document all pricing tiers so you can consistently communicate value."
}
```

**Graduation Requirements:**
```javascript
// personaStages.js
creation: {
  flows_required: ['acquisition_flow', 'upsell_flow', 'downsell_flow', 'continuity_flow'],
  milestones: ['create_acquisition_offer', 'create_upsell_offer', 'create_downsell_offer', 'create_continuity_offer', 'pricing_set'],
  // ...
}
```

**No flow integration needed** - user manually completes in challenge portal.

---

### Example 3: Daily Repeatable Challenge (Launch Stage)

```json
{
  "id": "daily_content_creation",
  "category": "Flow Finder",
  "type": "Vibe Riser, Movement Maker",
  "stage_required": "launch",
  "name": "Daily Content Creation",
  "description": "Create one piece of content (post, video, article) to attract your ideal customers",
  "points": 10,
  "inputType": "text",
  "maxPerDay": 1,
  "placeholder": "What content did you create today? Share link or description",
  "persona_specific": ["vibe_riser", "movement_maker"],
  "learnMore": "Consistent content creation builds trust and attracts your ideal customers. Track your daily creation streak!"
}
```

**Features:**
- `maxPerDay: 1` enables streak tracking
- Shows Mon-Sun bubble display
- Resets daily
- Not required for graduation (optional habit)

---

## 🧪 Testing Template

Use this checklist when testing new challenges:

```markdown
## Challenge: [Your Challenge Name]

### Display Tests
- [ ] Appears in correct category tab
- [ ] Shows for correct persona only
- [ ] Shows in correct stage only
- [ ] Name displays correctly
- [ ] Description clear and readable
- [ ] Points show correctly
- [ ] Learn More section works

### Functionality Tests
- [ ] Input type renders correctly (flow button/textarea/checkbox)
- [ ] Placeholder text shows (if applicable)
- [ ] "Complete Quest" button works
- [ ] Quest marks as completed
- [ ] Points awarded correctly
- [ ] Completion saved to database

### Flow Integration Tests (Flow Challenges Only)
- [ ] Flow route navigates correctly
- [ ] Flow completion triggers quest completion
- [ ] Quest auto-marks complete on flow finish
- [ ] No errors in console

### Graduation Tests (If Required)
- [ ] Appears in graduation requirements
- [ ] Graduation checker recognizes completion
- [ ] Can graduate after completing all requirements
- [ ] Works for correct persona only

### Edge Cases
- [ ] Works if completed before challenge started
- [ ] Works if user has no active challenge
- [ ] Handles errors gracefully
- [ ] Doesn't break if flow fails
```

---

## 🚀 Deployment Checklist

Before deploying challenges to production:

- [ ] Challenge added to `challengeQuestsUpdate.json`
- [ ] If flow: Flow integration code added
- [ ] If flow: `flow_type` saved to `flow_sessions` table
- [ ] If required: Added to `personaStages.js` (client)
- [ ] If required: Added to graduation edge function (server)
- [ ] JSON validated (no syntax errors)
- [ ] Build passes: `npm run build`
- [ ] Tested in staging/dev environment
- [ ] All checklist items pass
- [ ] Documentation updated (if needed)

---

## 📚 Related Documentation

- **7-Day Challenge Updates:** `/md files/7-DAY-CHALLENGE-UPDATES.md`
- **Persona Stages:** `/src/lib/personaStages.js`
- **Graduation Checker:** `/src/lib/graduationChecker.js`
- **Quest Completion Utility:** `/src/lib/questCompletion.js`

---

## 🆘 Need Help?

**Common Questions:**

**Q: How do I know what stage names to use?**
A: Check `/src/lib/personaStages.js` - stages are defined per persona.

**Q: My flow challenge isn't auto-completing?**
A: Check console for errors. Verify `flowId` in completeFlowQuest matches `flow_id` in JSON.

**Q: Challenge showing for wrong persona?**
A: Check `persona_specific` array includes only intended personas.

**Q: Graduation not recognizing my challenge?**
A: Verify `milestone_type` or flow name matches exactly in graduation requirements.

**Q: How do I test without affecting real users?**
A: Use test user accounts with different personas and stages.

---

**Last Updated:** December 4, 2025
**Version:** 1.0
**Maintained By:** Development Team
