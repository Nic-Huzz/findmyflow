# Backward Navigation Approaches - Summary for Discussion

## Context
We have two reflection steps that allow users to go back to a swipe flow:
1. **Protective Reflection** (`lead_q4_protective_reflection`) - currently working with option value `"change"`
2. **Essence Reflection** (`lead_q7_essence_reflection`) - needs implementation, option value `"no"`

**Flow Structure:**
- `lead_q4_protective_reflection` has `required_inputs: ["lead_q3_protective_archetype_complete"]`
- `lead_q7_essence_reflection` has `required_inputs: ["lead_q6_essence_archetype_complete"]`
- `lead_q3_protective_swipe` has `store_as: "lead_q3_protective_archetype_complete"` and `archetype_type: "protective"`
- `lead_q6_essence_swipe` has `store_as: "lead_q6_essence_archetype_complete"` and `archetype_type: "essence"`

---

## Approach 1: Hardcoded (Current Protective Pattern)
**Implementation:**
- Check if `optionValue === 'change'` → handle protective
- Check if `optionValue === 'no'` → handle essence
- Hardcode step names: `'lead_q3_protective_swipe'` and `'lead_q6_essence_swipe'`
- Hardcode archetype types: `'protective'` and `'essence'`
- Hardcode context variables to delete for each case

**Code Pattern:**
```javascript
if (optionValue === 'change') {
  const targetStepIndex = flow?.steps.findIndex(step => step.step === 'lead_q3_protective_swipe')
  // Clear protective context variables
  setHybridFlowType('protective')
  // etc.
} else if (optionValue === 'no') {
  const targetStepIndex = flow?.steps.findIndex(step => step.step === 'lead_q6_essence_swipe')
  // Clear essence context variables
  setHybridFlowType('essence')
  // etc.
}
```

**Pros:**
- ✅ Simple, explicit, easy to understand
- ✅ Matches current working implementation pattern
- ✅ Easy to debug (everything is explicit)

**Cons:**
- ❌ Code duplication (separate logic blocks for each)
- ❌ Hardcoded values that break if step names change
- ❌ Hardcoded archetype types
- ❌ Not scalable (requires new code for each reflection step)
- ❌ More places for bugs to hide

---

## Approach 2: Dynamic (Uses Flow Structure)
**Implementation:**
- Single check: `if (optionValue === 'change' || optionValue === 'no')`
- Get `required_inputs[0]` from current step (e.g., `"lead_q3_protective_archetype_complete"`)
- Find step where `step.store_as === required_inputs[0]`
- That step contains `step_type: "hybrid_swipe"` and `archetype_type` already
- Use that step's properties dynamically

**Code Pattern:**
```javascript
if (optionValue === 'change' || optionValue === 'no') {
  // Get the required input (store_as from previous swipe step)
  const requiredStoreAs = currentStep?.required_inputs?.[0]
  if (!requiredStoreAs) return
  
  // Find the swipe step that has this as its store_as
  const swipeStep = flow?.steps.find(step => step.store_as === requiredStoreAs)
  
  if (swipeStep && swipeStep.step_type === 'hybrid_swipe') {
    // Use swipeStep.step to find index
    // Use swipeStep.archetype_type (already defined!)
    // Clear context based on swipeStep.tag_as
    // Works for both protective and essence automatically
  }
}
```

**Pros:**
- ✅ Single code path for both cases (DRY principle)
- ✅ Uses flow structure as source of truth
- ✅ No hardcoded step names
- ✅ No hardcoded archetype types
- ✅ Automatically works for future reflection steps
- ✅ Less code, more maintainable
- ✅ Self-documenting (relationship defined in JSON)

**Cons:**
- ❌ Slightly more complex logic
- ❌ Requires validation (check that found step is hybrid_swipe)
- ❌ Depends on flow structure being correct

---

## Approach 3: Hybrid (Update Current to Match Pattern)
**Implementation:**
- Keep protective as-is (hardcoded)
- Add essence with same hardcoded pattern
- Maintains consistency with existing code

**Pros:**
- ✅ Consistent with current implementation
- ✅ Quick to implement
- ✅ No changes to working code

**Cons:**
- ❌ Perpetuates hardcoded approach
- ❌ Still has all cons of Approach 1
- ❌ Misses opportunity to improve architecture

---

## Questions for Discussion:

1. **Maintainability:** Which approach is easier to maintain long-term when flow structure might change?

2. **Error-Prone:** Which approach is less likely to have bugs if step names or structure changes?

3. **Scalability:** What if we add a third reflection step in the future? Which approach handles that better?

4. **Consistency:** Should we keep the current pattern or improve the architecture?

5. **Code Quality:** Does the dynamic approach's slight complexity justify the benefits, or is simplicity more important?

---

## Recommendation:
**Approach 2 (Dynamic)** - More robust, maintainable, and follows DRY principles while using the existing flow metadata as the source of truth.

