# Essence Archetype & Protective Archetype References

This document lists all occurrences of "Essence Archetype" and "Protective Archetype" in the codebase, organized by file type.

## 📱 PUBLIC-FACING FILES

### Frontend Components (src/)

#### **Profile.jsx**
- Line 418: `{essenceData?.poetic_line || 'Your essence archetype'}`
- Line 441: `{protectiveData?.summary || 'Your protective archetype'}`
- Lines 208-209: `essence_archetype` data access
- Lines 212, 282-283, 291, 410-411, 416: Essence archetype display
- Lines 300-301, 309, 433-434, 439: Protective archetype display

#### **PersonaAssessment.jsx**
- Line 135: `// Handle essence archetype completion`
- Line 141: `// Handle protective archetype completion`
- Line 235: `// Get essence archetype display data`
- Line 241: `// Get protective archetype display data`
- Line 378: `I call it your <strong>Essence Archetype</strong>.`
- Line 387: `There are 8 Essence Archetypes. One will feel like coming home.`
- Lines 47, 136-137, 194: Essence archetype state management
- Lines 48, 142-143, 195: Protective archetype state management
- Lines 237-238, 422-423, 429, 431: Essence archetype display
- Lines 243-244, 494-495, 501, 503: Protective archetype display
- Line 459: `They were so effective they've now become the thing blocking you from sharing your {essenceArchetype?.name} gifts with the world.`

#### **ArchetypeSelection.jsx**
- Line 93: `{/* Essence Archetype */}`
- Line 111: `<p className="card-subtitle">Your Essence Archetype</p>`
- Line 119: `{/* Protective Archetype */}`
- Line 137: `<p className="card-subtitle">Your Protective Archetype</p>`

#### **ProtectiveProfile.jsx**
- Line 275: `Explore Your Essence Archetype` (button text)
- Lines 56-57: Protective archetype data access

#### **Feedback.jsx**
- Line 223: `{/* Section 2: Essence Archetype */}`
- Line 225: `<h2>2. Essence Archetype Feedback</h2>`
- Line 228: `<label>When you were given your essence archetype, how did you feel?</label>`
- Line 246: `<label>When you went through your essence archetype profile, did you feel:</label>`
- Line 264: `{/* Section 3: Protective Archetype */}`
- Line 266: `<h2>3. Protective Archetype Feedback</h2>`
- Line 269: `<label>How much do you feel the identified protective archetype is negatively impacting your ambitions?</label>`

#### **HybridArchetypeFlow.jsx**
- Line 55: File name logic for `essence-archetypes.json` and `protective-archetypes.json`
- Lines 484, 522: Protective archetype display logic

#### **App.jsx**
- Line 88: Field name logic for `essence_archetype_selection` and `protective_archetype_selection`
- Lines 264-265, 475-476: Essence archetype data handling
- Lines 262-263, 473-474: Protective archetype data handling

#### **Challenge.jsx**
- Line 1199: Essence archetype conditional rendering

#### **NervousSystemFlow.jsx**
- Line 69: Database query includes `essence_archetype` and `protective_archetype`
- Lines 60, 78, 89, 96, 112: Protective archetype default values

#### **HealingCompass.jsx**
- Line 72: Database query includes `essence_archetype` and `protective_archetype`
- Lines 62, 81, 92, 99, 130: Protective archetype default values

#### **Data Files**
- `src/data/essenceProfiles.js`: Essence archetype definitions
- `src/data/protectiveProfiles.js`: `// Protective Archetype Profiles` (header comment)
- `src/lib/templates/essenceRevealTemplate.js`: Essence archetype template function
- `src/lib/templates/protectiveMirrorTemplate.js`: Protective archetype template function

### Public JSON Files (public/)

#### **challengeQuests.json**
- Line 7: `"name": "Essence Archetype"`
- Line 8: `"description": "Where did you show up as your essence archetype in your work today"`
- Line 18: `"name": "Protective Archetype"`
- Line 19: `"description": "Where did your protective archetype emerge in your work today?"`
- Line 23: `"learnMore": "Your protective archetype is a coping mechanism..."`
- Line 63: `"description": "Which essence and protective archetypes did you most identify with?"`
- Line 66: `"placeholder": "Share what essence and protective archetype you identified"`
- Line 85: `"description": "Identify the wound/s causing your Protective Archetype to protect you"`
- Line 90: `"learnMore": "...Your protective archetype developed as a survival mechanism..."`
- Line 164: `"description": "What's a moment where you were on auto-pilot and consciously chose to show-up as your essence archetype instead?"`
- Line 208: `"description": "What's a moment where you were showing up as your protective archetype but shifted and showed up in your essence?"`
- Line 389: `"description": "Establish connection with your essence archetype and drop into a meditation"`
- Line 407: `"description": "Complete breathwork and breath life into your essence archetype"`
- Line 447: `"description": "Choose a clothing item your essence archetype would love to wear but sparks your fear of judgement"`
- Line 451: `"learnMore": "Your protective archetype keeps you small..."`
- Line 457: `"name": "Essence Archetype Groan"`
- Line 458: `"description": "Do something your Essence Archetype would love to do but sparks a fear of judgement, failure or not being good enough"`
- Line 462: `"learnMore": "Your essence wants to express itself fully, but your protective archetype has been blocking it..."`
- Line 521: `"description": "Invest in a physical reminder of your essence archetype. Wear your truth..."`

#### **challengeQuestsUpdate.json**
- Line 7: `"name": "Essence Archetype"`
- Line 8: `"description": "Where did you show up as your essence archetype in your work today"`
- Line 18: `"name": "Protective Archetype"`
- Line 19: `"description": "Where did your protective archetype emerge in your work today?"`
- Line 23: `"learnMore": "Your protective archetype is a coping mechanism..."`
- Line 86: `"description": "Identify the wound/s causing your Protective Archetype to protect you"`
- Line 91: `"learnMore": "...Your protective archetype developed as a survival mechanism..."`
- Line 155: `"description": "What's a moment where you were on auto-pilot and consciously chose to show-up as your essence archetype instead?"`
- Line 200: `"description": "What's a moment where you were showing up as your protective archetype but shifted and showed up in your essence?"`
- Line 336: `"description": "Establish connection with your essence archetype and drop into a meditation"`
- Line 354: `"description": "Complete breathwork and breath life into your essence archetype"`
- Line 393: `"name": "Essence Archetype Groan"`
- Line 394: `"description": "Do something your Essence Archetype would love to do but sparks a fear of judgement, failure or not being good enough"`
- Line 398: `"learnMore": "Your essence wants to express itself fully, but your protective archetype has been blocking it..."`
- Line 446: `"description": "Invest in a physical reminder of your essence archetype. Wear your truth..."`

#### **dailyReleaseChallenges.json** (unsaved file)
- Line 38: `"The cushion to your left is for your protective archetype - the you, created to protect you from being hurt again"`
- Line 41: `"5. Go sit on the cushion for 'Protective Archetype You' and repeat the process. Take a moment to embody the energy of the protective archetype..."`
- Line 42: `"6. Once done, return to the mediator cushion and thank 'Protective Archetype You'"`
- Line 48: `"description": "Honor and release the wounded version of you and the protective archetype through a ceremonial practice."`
- Line 50: `"Create a ceremony for the wounded version of you from '{{past_event_details}}' & the protective archetype who developed to protect you..."`
- Line 52: `"...to honour the protective archetype. The key is ensuring wounded version of you is able to express whatever comes up and for the protective archetype to know you appreciate them..."`

#### **lead-magnet-slide-flow.json**
- Line 6: `"description": "A short introduction flow to help users identify their Essence and Protective Archetypes and unlock their profile."`
- Line 21: `"prompt": "...**There are 8 Essence Archetypes. Each one flows in a unique way to create its impact.**..."`
- Line 34: `"prompt": "We'll start by discovering your Essence Archetype — who you naturally are when fear isn't driving..."`
- Line 35: `"tag_as": "essence_archetype_selection"`
- Line 36: `"store_as": "lead_q3_essence_archetype_complete"`
- Line 41: `"required_inputs": ["lead_q3_essence_archetype_complete"]`
- Line 42: `"prompt": "{{ESSENCE_REVEAL(essence_archetype_selection)}}\n\nDoes this feel like you?"`
- Line 54: `"prompt": "...They were so effective they've now become the thing blocking you from sharing your {{essence_archetype}} gifts with the world..."`
- Line 88: `"prompt": "Perfect, {{user_name}}.\n\nYou've now identified your {{essence_archetype}} current and the {{protective_archetype}} pattern that's slowing it down..."`

#### **essence-archetypes.json**
- Contains all 8 essence archetype definitions (Radiant Rebel, Playful Creator, etc.)

#### **protective-archetypes.json**
- Contains all protective archetype definitions

#### **opus4/challenge-categorisation.json**
- Line 4: `"Essence Archetype"`
- Line 5: `"Protective Archetype"`

### Archive Files (public/archive/)

#### **challengeQuests copy.json**
- Multiple references similar to challengeQuests.json (lines 7-8, 18-19, 23, 52, 55, 62, 67, 164, 196, 250, 268, 297, 307-308, 312, 359)

#### **lead-magnet-text-questions-flow-backup.json**
- Line 5: `"description": "A short introduction flow to help users identify their Protective and Essence Archetypes and unlock their profile."`

### Mockup Files (mockups/)

#### **archetype-selection-page.html**
- Line 229: `<!-- Essence Archetype -->`
- Line 237: `<p class="card-subtitle">Your Essence Archetype</p>`
- Line 245: `<!-- Protective Archetype -->`
- Line 253: `<p class="card-subtitle">Your Protective Archetype</p>`

#### **protective-archetype-profile.html**
- Line 6: `<title>Protective Archetype Profile - Perfectionist</title>`
- Line 324: `"This protective archetype emerged when you needed safety..."`
- Line 370: `<button class="cta-button">Explore Your Essence Archetype</button>`

#### **mockup-1-hero-profile.html**
- Line 280: `<!-- Essence Archetype -->`

#### **mockup-2-timeline-journey.html**
- Line 386: `<!-- Essence Archetype -->`

#### **mockup-4-minimal-elegant.html**
- Line 395: `<!-- Essence Archetype -->`

#### **journey-style-3-cards.html** (in public/mockups/)
- Line 304: `"Identified your essence and protective archetypes"`

### Archive Components (src/archive/)

#### **HybridEssenceFlow.jsx**
- Line 240: `"Now we're going to discover your Essence Archetype..."`
- Line 302: `"🎉 Amazing! Your Essence Archetype is:"`

#### **HybridCombinedFlow.jsx**
- Line 78: `"Hi! I'm here to help you discover both your Protective and Essence Archetypes..."`
- Line 217: `"Please select at least one essence archetype that resonates with you! Let's try again."`
- Line 350: `<h2>Your Essence Archetype</h2>`
- Line 395: `<div className="text">✨ Beautiful! Your Essence Archetype is:</div>`
- Line 464: `<div className="text">Now let&apos;s discover your Essence Archetype - who you are at your core..."`
- Line 478: `"Continue to Essence Archetypes"`

#### **EssenceTest.jsx**
- Line 179: `<h1>🎉 Your Essence Archetype!</h1>`

---

## 🔌 BACKEND CONNECTIVE FILES

### Database Migrations (supabase/migrations/)

#### **create_lead_flow_profiles_table.sql**
- Line 2: `-- Description: Stores user data from the lead magnet flow (essence & protective archetypes)`
- Line 15: `-- Essence archetype (now collected FIRST in reordered flow)`
- Line 16: `essence_archetype TEXT,           -- The selected essence archetype`
- Line 17: `essence_confirm TEXT,              -- "yes" or "no" - confirmation response`
- Line 19: `-- Protective archetype (now collected SECOND in reordered flow)`
- Line 20: `protective_archetype TEXT,         -- The selected protective archetype`
- Line 21: `protective_confirm TEXT,           -- "yes" or "no" - confirmation response`
- Line 90: `COMMENT ON TABLE public.lead_flow_profiles IS 'Stores user data from the lead magnet flow including essence archetype, protective archetype, and persona selection';`

#### **create_feedback_table.sql**
- Line 13: `-- Essence Archetype Feedback`
- Line 17: `-- Protective Archetype Feedback`

### Database Schema Files (opus4/)

#### **Supabase-Table.json**
- Line 123: `protective_archetype text,`
- Line 125: `essence_archetype text,`
- Line 325: `protective_archetype text,`
- Line 329: `essence_archetype text,`
- Line 345: `essence_archetype_selection text,`

### API Files

#### **api/chat.js**
- No direct references to archetype terms (generic Anthropic API proxy)

### Supabase Functions (supabase/functions/)
- **No matches found** - None of the Edge Functions directly reference archetype terms

---

## 📝 DOCUMENTATION FILES (md files/)

### User-Facing Documentation
- `PRE_LAUNCH_CHECKLIST.md`: Meta tags and tooltips mentioning essence/protective archetypes
- `FEEDBACK_FEATURE_SETUP.md`: Feedback form structure for archetypes
- `IMAGE_OPTIMIZATION_GUIDE.md`: Image optimization notes for archetypes
- `README.md`: Project description mentioning archetypes

### Internal Documentation
- `ARCHITECTURE_RISK_ASSESSMENT.md`: Data flow analysis mentioning archetype selection
- `MAGIC_LINK_FLOW.md`: Flow documentation mentioning archetypes
- `PRODUCT_ROADMAP.md`: Product notes mentioning archetype patterns
- `REDUNDANCY_REVIEW.md`: Code review notes about essence archetypes

---

## Summary Statistics

- **Total "Essence Archetype" references**: ~93 matches
- **Total "Protective Archetype" references**: ~86 matches
- **Public-facing files**: ~150+ occurrences
- **Backend connective files**: ~10 occurrences (mostly database schema)
- **Documentation files**: ~15 occurrences

---

## Key Files to Update (if renaming)

### High Priority (User-Facing)
1. `public/challengeQuests.json` - Multiple quest descriptions
2. `public/challengeQuestsUpdate.json` - Multiple quest descriptions
3. `public/lead-magnet-slide-flow.json` - Flow prompts
4. `src/Profile.jsx` - User profile display
5. `src/PersonaAssessment.jsx` - Assessment flow
6. `src/ArchetypeSelection.jsx` - Selection UI
7. `src/Feedback.jsx` - Feedback forms

### Medium Priority (Backend)
1. `supabase/migrations/Sql commands/create_lead_flow_profiles_table.sql` - Database schema
2. `opus4/Supabase-Table.json` - Schema definitions

### Low Priority (Archive/Mockups)
1. `public/archive/` files
2. `src/archive/` files
3. `mockups/` HTML files

