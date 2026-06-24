# Flow Finder V2 - Progress & Plan

**Date:** February 1, 2026
**Status:** Testing (Flow Finder stage temporarily locked)

---

## Overview

We're building new quick-discovery flows to replace the lengthy 45+ minute Flow Finder questionnaires. These flows use AI clustering to identify skills and personas from simple, intuitive questions.

---

## What's Been Built

### 1. Play-List Finder (`/play-list-finder`)

**Purpose:** Discover skills through what feels like "play"

**Questions (4 total):**
1. **Role Models** - Who inspires you? What do they do that appeals to you? (up to 5)
2. **No Fear Fantasy** - What would you do with zero fear? (up to 3)
3. **Secret Wishes** - What do you wish you could get paid to do? (up to 3)
4. **Groan Zone** - What sounds fun but makes you nervous? (up to 3)

**Flow:**
1. User answers 4 questions
2. AI clusters answers into skill themes (using `nikigai-conversation` edge function)
3. User rates proficiency for each skill: Learning / Practicing / Mastering
4. Results saved to `nikigai_clusters` and `nikigai_responses`

**Technical:**
- Uses `shouldCluster: true` with `clusterType: 'skills'` (same pattern as FlowFinderPersona)
- Proficiency ratings: `learning`, `practicing`, `mastering`
- 10 XP reward

---

### 2. Persona Identifier (`/persona-identifier`)

**Purpose:** Discover who you're meant to serve through your life journey

**Questions (2 total):**
1. **Life Chapters** - What are the major phases of your story? (2-7 chapters)
2. **Chapter Struggles** - What struggle defined each chapter?

**Flow:**
1. User names their life chapters
2. User describes the struggle for each chapter
3. AI clusters into persona themes (using `nikigai-conversation` edge function)
4. User rates journey stage for each persona: Awakening / Struggling / Ready
5. Results saved to `nikigai_clusters` and `nikigai_responses`

**Technical:**
- Uses `shouldCluster: true` with `clusterType: 'persona'` (same pattern as FlowFinderPersona)
- Journey stages: `awakening`, `struggling`, `ready`
- 10 XP reward

---

### 3. Mind Space Extraction (`/mind-space`)

**Purpose:** Extract skills/problems/personas from existing AI conversation history

**Status:** Already live, 10 XP reward

---

## UI/UX Updates

### Styling
- Both flows match Money Model styling (purple gradient → gold buttons)
- Consistent with brand colors: `#5e17eb` purple to `#E9A23B` gold

### Button Positioning
- "Let's Go" buttons positioned at bottom of screen for easy mobile access
- Consistent sizing across all flows

### Terminology
- Changed "points" / "pts" → "XP" across the app

---

## Current Status

### Locked for Testing
- **Flow Finder stage** (`temporarilyLocked: true` in stageConfig.js)
- **Play stage** (already locked)

### Accessible for Testing
Direct URL access still works:
- `/play-list-finder`
- `/persona-identifier`
- `/mind-space`

### Quest Configuration
All three quests are configured in `challengeQuestsUpdate.json`:
- `mind_space_extraction` - 10 XP
- `play_list_finder` - 10 XP
- `persona_identifier` - 10 XP

### Archived Quests
- `flow_finder_skills` - Archived (replaced by Play-List Finder)

---

## Testing Checklist

### Play-List Finder
- [ ] Complete flow end-to-end
- [ ] Verify AI clustering returns valid skills
- [ ] Verify proficiency rating saves correctly
- [ ] Check data saves to `nikigai_clusters`
- [ ] Check data saves to `nikigai_responses`
- [ ] Verify XP awarded on completion
- [ ] Test on mobile

### Persona Identifier
- [ ] Complete flow end-to-end
- [ ] Verify AI clustering returns valid personas
- [ ] Verify journey stage rating saves correctly
- [ ] Check data saves to `nikigai_clusters`
- [ ] Check data saves to `nikigai_responses`
- [ ] Verify XP awarded on completion
- [ ] Test on mobile

### Integration
- [ ] Verify clusters appear in existing Flow Finder results
- [ ] Check integration with Groan Matrix (if applicable)
- [ ] Test challenge completion syncing

---

## Release Plan

### Phase 1: Testing (Current)
- Flow Finder stage locked
- Test via direct URLs
- Fix any bugs found

### Phase 2: Soft Launch
1. Remove `temporarilyLocked: true` from Flow Finder stage in `stageConfig.js`
2. Monitor for errors in console/logs
3. Gather user feedback

### Phase 3: Full Launch
1. Announce new flows to users
2. Consider archiving old lengthy Flow Finder flows
3. Update onboarding to use new quick flows

---

## Files Modified

### New/Updated Components
- `src/flows/PlayListFinderFlow.jsx` - Complete rewrite with clustering approach
- `src/flows/PlayListFinderFlow.css` - Styling + rating screen
- `src/flows/PersonaIdentifierFlow.jsx` - Complete rewrite with clustering approach
- `src/flows/PersonaIdentifierFlow.css` - Styling + rating screen

### Configuration
- `src/lib/stageConfig.js` - Added `temporarilyLocked: true` to Flow Finder stage
- `public/challengeQuestsUpdate.json` - Quest definitions for all three flows

### Routes
- `src/AppRouter.jsx` - Routes for both flows, excluded from bottom toolbar

---

## Architecture Notes

### AI Clustering Pattern
Both flows use the same proven pattern from `FlowFinderPersona.jsx`:

```javascript
const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
  body: {
    currentStep: { id: 'skills_final', assistant_prompt: '...' },
    userResponse: 'Ready to discover...',
    shouldCluster: true,
    clusterType: 'skills', // or 'persona'
    clusterSources: ['skills_analysis'],
    allResponses: allResponses,
    conversationHistory: []
  }
})
```

### Data Storage
Clusters saved to `nikigai_clusters` table:
- `cluster_type`: 'skills' or 'persona'
- `cluster_stage`: 'final'
- `cluster_label`: AI-generated label
- `insight`: AI-generated insight
- `proficiency`: User rating (learning/practicing/mastering or awakening/struggling/ready)
- `items`: Evidence from user answers

---

## Next Steps

1. **Tonight:** Test both flows thoroughly
2. **If working:** Remove `temporarilyLocked` flag and release
3. **Future:** Consider adding these flows to onboarding for faster user activation
