# Migration Finalization - Action Plan

## ✅ Step 1: Formatting Issue - COMPLETE
- [x] Fixed container placement (moved options-container and input-bar outside chat-container)
- [x] Matches App-test.jsx structure

---

## 🎯 Step 2: Code Cleanup Decisions

### Decision A: Backward Compatibility Code
**Current code (App.jsx line 186):**
```javascript
const shouldSaveToDb = Boolean(currentStep.save_to_db) || 
                       currentStep.step === 'lead_q7_email_capture' || 
                       currentStep.step === 'lead_q8_email_capture'
```

**Options:**
1. ✅ **Keep both** (RECOMMENDED) - Safe, handles edge cases and any old flow references
2. ❌ Remove `lead_q7_email_capture` - Only if 100% sure no old flow users

**Recommendation:** Keep both for safety. The `save_to_db` flag should handle new flow, and backward compatibility is harmless.

---

### Decision B: Flow File Management

**Current files:**
- `lead-magnet.json` - Old flow (7-8 steps, different structure)
- `lead-magnet-test.json` - Intermediate test version
- `lead-magnet-test-nic.json` - Current active flow (9 steps, hybrid_swipe)

**Options:**

**Option 1: Rename current flow to main** ⭐ RECOMMENDED
```bash
# Rename old to backup
mv public/lead-magnet.json public/lead-magnet-v1.json.backup

# Rename current to main
mv public/lead-magnet-test-nic.json public/lead-magnet.json

# Update App.jsx reference
# Then archive or delete test files
```

**Option 2: Keep test name, just archive old**
- Keep `lead-magnet-test-nic.json` as-is
- Archive `lead-magnet.json` to `lead-magnet-v1.json.backup`
- Update App.jsx to use new name permanently

**Option 3: Keep everything** (Safe, but messy)
- Keep all files
- Just update documentation

**Recommendation:** Option 1 - Clean naming, easy to understand.

---

## 📝 Step 3: Documentation Updates

**Files to update:**
1. `public/castle-architecture.html`:
   - Line 107: `lead-magnet.json` → `lead-magnet.json` (if we rename)
   - Line 232: Update flow reference

**Files to check:**
- `src/data/README.md` - Check if mentions flow file
- Any other README files

---

## 🧪 Step 4: Quick Verification Test

Before finalizing, verify:
- [ ] Both `/` and `/test` routes work on iPhone Safari
- [ ] Full flow completes end-to-end
- [ ] Database saves correctly
- [ ] Magic links send
- [ ] Profile page accessible

---

## 📦 Step 5: Git Finalization

Once everything tested:
1. Commit final changes
2. Merge branch to main
3. Create new checkpoint/tag

