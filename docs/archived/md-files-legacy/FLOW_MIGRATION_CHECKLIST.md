# Flow Migration Checklist: lead-magnet-test-nic.json → Main Flow

## 🎯 Overview
Migrate from `lead-magnet.json` to `lead-magnet-test-nic.json` as the main flow when users land on the page.

---

## 🧱 LEGO BLOCKS - What Needs to Change

### 📁 **1. FOUNDATION BLOCK: Flow File Reference**
**Location:** `src/App.jsx` (line 22)

**Current:**
```javascript
const response = await fetch('/lead-magnet.json')
```

**Change to:**
```javascript
const response = await fetch('/lead-magnet-test-nic.json')
```

**Impact:** This is the entry point - changes which flow loads on page load.

---

### 🎨 **2. HYBRID FLOW INTEGRATION BLOCK**
**Location:** `src/App.jsx`

**Current State:** 
- `App.jsx` does NOT support `hybrid_swipe` step type
- Only handles regular text inputs and option buttons

**Required Changes:**
1. **Import HybridArchetypeFlow component**
   ```javascript
   import HybridArchetypeFlow from './HybridArchetypeFlow'
   ```

2. **Add state management for hybrid flows**
   ```javascript
   const [showHybridFlow, setShowHybridFlow] = useState(false)
   const [hybridFlowType, setHybridFlowType] = useState(null) // 'protective' or 'essence'
   ```

3. **Add hybrid flow completion handler**
   - Handle when user completes swipe flow
   - Store archetype result in context
   - Continue to next step

4. **Modify step navigation logic**
   - Check if `nextStep.step_type === 'hybrid_swipe'`
   - If yes, set `showHybridFlow = true` and `hybridFlowType = nextStep.archetype_type`
   - If no, proceed with normal flow

5. **Add conditional rendering**
   - Render `HybridArchetypeFlow` when `showHybridFlow === true`
   - Render normal chat interface otherwise

**Reference Implementation:** See `src/App-test.jsx` lines 14-16, 59-76, 88-104, 191-202

---

### 🔄 **3. BACKWARD NAVIGATION BLOCK (Change Option)**
**Location:** `src/App.jsx` - `handleOptionClick` function

**Current State:**
- No support for going back to previous steps
- Only moves forward linearly

**Required Changes:**
When user selects "change" option (step `lead_q4_protective_reflection`):
- Detect `option.value === 'change'`
- Find step `lead_q3_protective_swipe` (the hybrid swipe step)
- Reset `currentIndex` to that step's index
- Clear/reset the protective archetype selection from context if needed
- Show hybrid flow again

**Implementation approach:**
```javascript
if (option.value === 'change') {
  // Find the step to go back to (lead_q3_protective_swipe)
  const targetStepIndex = flow.steps.findIndex(step => step.step === 'lead_q3_protective_swipe')
  if (targetStepIndex !== -1) {
    setCurrentIndex(targetStepIndex)
    setShowHybridFlow(true)
    setHybridFlowType('protective')
    // Optionally clear the previous selection
    const newContext = { ...context }
    delete newContext.protective_archetype_selection
    setContext(newContext)
    return // Don't proceed with normal next step logic
  }
}
```

---

### 💾 **4. DATABASE SAVE FLAG BLOCK**
**Location:** `public/lead-magnet-test-nic.json` - step `lead_q8_email_capture`

**Current State:**
- Email step (`lead_q8_email_capture`) does NOT have `save_to_db: true` flag
- `App.jsx` has backward compatibility: `currentStep.step === 'lead_q7_email_capture'`

**Required Changes:**
1. **Option A (Recommended):** Add `save_to_db: true` to email step in JSON
   ```json
   {
     "step": "lead_q8_email_capture",
     ...
     "save_to_db": true
   }
   ```

2. **Option B:** Update backward compatibility check in `App.jsx` line 117
   ```javascript
   const shouldSaveToDb = Boolean(currentStep.save_to_db) || 
                          currentStep.step === 'lead_q7_email_capture' ||
                          currentStep.step === 'lead_q8_email_capture'
   ```

**Recommendation:** Use Option A (cleaner, more maintainable)

---

### 📝 **5. STEP NAMING CONSISTENCY BLOCK**
**Location:** Multiple files

**Step Name Changes in New Flow:**
- Old: `lead_q7_email_capture` → New: `lead_q8_email_capture`
- Old: `lead_q8_persona` → New: `lead_q9_persona`

**Files to Check:**
- `src/App.jsx` line 117 (backward compatibility check)
- Any other hardcoded step name references

**Action:** 
- Update or remove backward compatibility check for `lead_q7_email_capture`
- Ensure no other code hardcodes old step names

---

### 🧩 **6. CONTEXT VARIABLE STORAGE BLOCK**
**Location:** `src/App.jsx` - Database save logic (line 133-139)

**Current Context Variables Stored:**
```javascript
protective_archetype: newContext.protective_archetype_selection,
essence_archetype: newContext.essence_archetype_selection,
```

**Status:** ✅ **No changes needed**
- Variable names match between flow and code
- `protective_archetype_selection` and `essence_archetype_selection` are already used correctly

---

### 🎯 **7. FLOW STEP DIFFERENCES BLOCK**

**New Flow Structure:**
1. `lead_q1_intro_name` ✅ (same)
2. `lead_q2_protective_intro` ✅ (new intro step)
3. `lead_q3_protective_swipe` ⚠️ (changed from options to hybrid_swipe)
4. `lead_q4_protective_reflection` ✅ (same, with change option)
5. `lead_q5_essence_intro` ✅ (new intro step)
6. `lead_q6_essence_swipe` ⚠️ (changed from options to hybrid_swipe)
7. `lead_q7_essence_reflection` ✅ (same)
8. `lead_q8_email_capture` ⚠️ (renamed from lead_q7)
9. `lead_q9_persona` ⚠️ (renamed from lead_q8)

**Removed Steps:**
- `lead_q2_explainer` (removed from new flow)

**Impact:** None - flow is self-contained, removed steps won't break anything.

---

### ✅ **8. VERIFICATION BLOCKS**

**Things that DON'T need changes (already compatible):**
- ✅ `promptResolver.js` - Already handles `PROTECTIVE_MIRROR()` and `ESSENCE_REVEAL()` macros
- ✅ `HybridArchetypeFlow.jsx` - Already supports both protective and essence types
- ✅ Database schema - Field names match (`protective_archetype`, `essence_archetype`, `persona`, `email`)
- ✅ `AuthProvider` - Magic link sending logic already in place
- ✅ `Profile.jsx` - Uses same database fields, no changes needed
- ✅ CSS/Styling - Hybrid flow components already styled

---

## 🚨 **BREAKING CHANGE RISKS**

### ⚠️ **High Risk:**
1. **Hybrid Flow Integration** - Without this, app will crash when reaching step 3 or 6
2. **Database Save Flag** - Email won't save to database without `save_to_db` flag

### ⚠️ **Medium Risk:**
3. **Change Option Handler** - Users clicking "change" will break flow without backward navigation

### ✅ **Low Risk:**
4. **Step Name References** - Only affects backward compatibility check (can be removed)

---

## 📋 **IMPLEMENTATION ORDER**

### Phase 1: Critical (Must Do First)
1. ✅ Add `save_to_db: true` to email step in JSON
2. ✅ Update flow file reference in `App.jsx`
3. ✅ Add hybrid flow integration to `App.jsx`

### Phase 2: Important (User Experience)
4. ✅ Add backward navigation for "change" option
5. ✅ Update/remove backward compatibility checks

### Phase 3: Cleanup (Optional)
6. ✅ Remove any unused code
7. ✅ Test all flow paths
8. ✅ Update documentation

---

## 🧪 **TESTING CHECKLIST**

- [ ] User can enter name (step 1)
- [ ] Protective intro step shows (step 2)
- [ ] Hybrid swipe flow opens for protective (step 3)
- [ ] Protective reflection shows with mirror template (step 4)
- [ ] "Change" option returns to swipe flow (step 4 → step 3)
- [ ] "Confirm" option proceeds correctly (step 4 → step 5)
- [ ] Essence intro step shows (step 5)
- [ ] Hybrid swipe flow opens for essence (step 6)
- [ ] Essence reflection shows with reveal template (step 7)
- [ ] Email capture saves to database (step 8)
- [ ] Magic link is sent after email (step 8)
- [ ] Persona selection updates database (step 9)
- [ ] Flow completes successfully
- [ ] Profile page shows correct archetypes

---

## 📦 **FILES TO MODIFY**

1. **`src/App.jsx`** ⭐ (Major changes)
   - Line 22: Flow file reference
   - Add imports for HybridArchetypeFlow
   - Add state for hybrid flows
   - Add hybrid flow handler
   - Modify step navigation
   - Add conditional rendering
   - Add backward navigation logic

2. **`public/lead-magnet-test-nic.json`** 
   - Add `save_to_db: true` to email step

3. **Optional: `CASTLE_ARCHITECTURE.md`**
   - Update flow file name in documentation

---

## 💡 **RECOMMENDATIONS**

1. **Backup Current Flow:**
   - Keep `lead-magnet.json` as backup
   - Consider versioning: `lead-magnet-v1.json`, `lead-magnet-v2.json`

2. **Gradual Rollout:**
   - Test with `/test` route first (App-test.jsx already uses new flow)
   - Once verified, switch main route

3. **Error Handling:**
   - Add fallback if hybrid flow fails to load
   - Handle edge cases (no archetypes selected, etc.)

4. **Future Considerations:**
   - Consider A/B testing between old and new flows
   - Monitor completion rates
   - Track user feedback on hybrid swipe experience

