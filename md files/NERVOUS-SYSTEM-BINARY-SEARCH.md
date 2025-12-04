# Nervous System Binary Search - Income Limit Discovery

## What Was Built

A dynamic binary search algorithm integrated into the Nervous System Safety Flow (step 9.0) that discovers a user's true income safety limit through iterative sway testing.

---

## How It Works

### Initial Test (Step 9.0)
User tests their aspirational income goal (e.g., $500,000):
- **If YES** → Start doubling path (steps 9.1-9.7)
- **If NO** → Start halving path (steps 9.11-9.17)

### Doubling Path (Initial YES)
When the user's nervous system feels safe at the initial amount, we test progressively higher amounts:

```
Step 9.0:  $500,000 → YES
Step 9.1:  $1,000,000 (2x) → YES
Step 9.2:  $2,000,000 (4x) → YES
Step 9.3:  $4,000,000 (8x) → NO ✓
LIMIT FOUND: $2,000,000 (previous YES)
```

**Multipliers by iteration:**
- Iteration 1: 2x
- Iteration 2: 4x
- Iteration 3: 8x
- Iteration 4: 16x
- Iteration 5: 32x
- Iteration 6: 64x
- Iteration 7: 128x (max)

### Halving Path (Initial NO)
When the user's nervous system contracts at the initial amount, we test progressively lower amounts:

```
Step 9.0:   $500,000 → NO
Step 9.11:  $250,000 (÷2) → NO
Step 9.12:  $125,000 (÷4) → YES ✓
LIMIT FOUND: $125,000 (current amount)
```

**Divisors by iteration:**
- Iteration 1: ÷2
- Iteration 2: ÷4
- Iteration 3: ÷8
- Iteration 4: ÷16
- Iteration 5: ÷32
- Iteration 6: ÷64
- Iteration 7: ÷128 (max)

**Minimum Floor:** $10,000 (prevents going below this amount)

---

## Step Structure

### Step 9.0 - Initial Test
```json
{
  "step": "stage4_triage_2_initial",
  "step_order_index": 9.0,
  "prompt": "I feel safe earning over {{income_goal}}/year",
  "metadata": {
    "binary_search": true,
    "initial_test": true,
    "min_floor": 10000,
    "max_iterations": 7,
    "result_variable": "nervous_system_income_limit"
  }
}
```

### Doubling Steps (9.1-9.7)
Each doubling step includes:
- `conditional`: Only runs if previous test was YES
- `multiplier`: 2, 4, 8, 16, 32, 64, 128
- `previous_yes_amount`: Tracks the limit in case they say NO

### Halving Steps (9.11-9.17)
Each halving step includes:
- `conditional`: Only runs if previous test was NO
- `divisor`: 2, 4, 8, 16, 32, 64, 128
- `min_floor`: $10,000 minimum

### Step 9.99 - Completion
```json
{
  "step": "stage4_triage_2_complete",
  "step_order_index": 9.99,
  "prompt": "Perfect. Your nervous system's current income safety limit is {{nervous_system_income_limit}}.",
  "metadata": {
    "binary_search_complete": true,
    "stores_limit": "nervous_system_income_limit"
  }
}
```

---

## Variables Stored

### 1. `income_goal`
- **Source:** Step 4.0 (user's aspirational income selection)
- **Values:** "$1,000,000+", "$500,000+", "$100,000+"
- **Used in:** Initial test, AI reflection

### 2. `nervous_system_income_limit`
- **Source:** Discovered through binary search
- **Values:** Actual dollar amount (e.g., $125,000)
- **Used in:** Completion message, AI reflection

### 3. `triage_safe_earning_initial`
- **Source:** Step 9.0 response
- **Values:** "yes" or "no"
- **Determines:** Which path to take (doubling vs halving)

---

## AI Reflection Integration

The final AI reflection (step 15.0) now receives BOTH values:

```
Aspirational Goal: $500,000+
Nervous System Limit: $125,000
Gap: $375,000
```

The AI is instructed to compassionately highlight this gap:

> "You aspire to $500,000 but your nervous system currently feels safe at $125,000. This gap shows where expansion work is needed. It's not about your capability—it's about your nervous system's current safety boundaries."

---

## Component Implementation Requirements

The `NervousSystemFlow.jsx` component needs to handle:

### 1. Conditional Step Execution
```javascript
if (step.conditional) {
  const condition = evaluateCondition(step.conditional, responses)
  if (!condition) {
    skipStep() // Don't show this step
  }
}
```

### 2. Dynamic Amount Calculation
```javascript
// For doubling steps
const doubled_amount_1 = incomeGoal * step.metadata.multiplier
// Format: $2,000,000

// For halving steps
const halved_amount_1 = Math.max(
  incomeGoal / step.metadata.divisor,
  step.metadata.min_floor
)
// Format: $125,000 (minimum $10,000)
```

### 3. Limit Determination Logic

**Doubling Path:**
```javascript
if (response === 'no') {
  // User hit their limit
  const limit = step.metadata.previous_yes_amount
  storeLimit(limit)
  skipToCompletionStep()
}
```

**Halving Path:**
```javascript
if (response === 'yes') {
  // User found their safety zone
  const limit = currentTestAmount
  storeLimit(limit)
  skipToCompletionStep()
}
```

### 4. Variable Replacement
Replace template variables in prompts:
- `{{income_goal}}` → "$500,000+"
- `{{doubled_amount_1}}` → "$1,000,000"
- `{{halved_amount_1}}` → "$250,000"
- `{{nervous_system_income_limit}}` → "$125,000"

---

## Example User Journey

### Journey 1: High Capacity Expander
```
Aspiration: $1,000,000+

Step 9.0:  $1,000,000 → YES
Step 9.1:  $2,000,000 → YES
Step 9.2:  $4,000,000 → YES
Step 9.3:  $8,000,000 → YES
Step 9.4:  $16,000,000 → NO

RESULT: Limit = $8,000,000
MESSAGE: "Your nervous system is really expansive! Current limit: $8M"
```

### Journey 2: Moderate Contractor
```
Aspiration: $500,000+

Step 9.0:   $500,000 → NO
Step 9.11:  $250,000 → NO
Step 9.12:  $125,000 → YES

RESULT: Limit = $125,000
MESSAGE: "You aspire to $500K+ but your nervous system currently feels safe at $125K. This gap is your expansion edge."
```

### Journey 3: Extreme Contractor
```
Aspiration: $100,000+

Step 9.0:   $100,000 → NO
Step 9.11:  $50,000 → NO
Step 9.12:  $25,000 → NO
Step 9.13:  $12,500 → NO
Step 9.14:  $10,000 → YES (floor reached)

RESULT: Limit = $10,000
MESSAGE: "Your nervous system is holding tight at $10K. There's deep protection here that needs gentle unwinding."
```

---

## Edge Cases Handled

### 1. Floor Reached
If halving goes below $10,000, stop at $10,000:
```javascript
const amount = Math.max(incomeGoal / divisor, 10000)
```

### 2. Max Iterations Reached (7 rounds)
If they say YES all 7 times when doubling:
```javascript
if (step.metadata.final_iteration && response === 'yes') {
  limit = currentAmount // Use the 128x amount
}
```

### 3. Early Exit
When limit is found, skip remaining iteration steps and jump directly to completion step (9.99).

---

## Testing Checklist

- [ ] Doubling path works (initial YES)
- [ ] Halving path works (initial NO)
- [ ] Conditional steps execute correctly
- [ ] Amount calculations are accurate
- [ ] Previous YES amount is tracked correctly
- [ ] Minimum floor ($10K) is enforced
- [ ] Max iterations (7) stops properly
- [ ] Completion message shows correct limit
- [ ] Limit is stored as `nervous_system_income_limit`
- [ ] AI reflection receives both variables
- [ ] Gap is highlighted compassionately in reflection

---

## Benefits

1. **Precision**: Finds exact nervous system capacity, not just a guess
2. **Insight**: Shows gap between aspiration and current safety
3. **Personalization**: Every user gets their unique limit discovered
4. **Somatic**: Uses body wisdom via sway test, not just mental estimates
5. **Motivation**: Clear target for expansion work

---

## Next Steps for Implementation

1. Update `NervousSystemFlow.jsx` to handle:
   - Conditional step execution
   - Dynamic variable calculation
   - Limit determination logic
   - Skip-to-completion functionality

2. Test all user journeys:
   - Doubling path (YES initial)
   - Halving path (NO initial)
   - Edge cases (floor, max iterations)

3. Verify AI reflection receives and uses both values

---

**System is ready for implementation!**
