# Creator Portal Testing Checklist

## Branch: `main` (merged from `experience-creator-matching`)
## Date: April 2026

---

## Pre-requisites

- User must be logged in (auth required for `/create` and `/experience-creators`)
- Test user: nichurrell@me.com
- Dev server: `npm run dev` → localhost:5173
- Live: findmyflow.nichuzz.com

---

## Flow 1: Experience Creator Matching (Onboarding Gate)

### /experience-creators (authenticated)

1. [ ] Navigate to `/experience-creators` while logged in
2. [ ] AuthGate shows if not logged in, redirects to login
3. [ ] Once logged in, see the browse screen with 6 archetype categories
4. [ ] Each category shows creator cards with Pixar portraits, names, one-liners
5. [ ] Tap a card to select (gold border + checkmark appears)
6. [ ] Selection bar slides up from bottom showing avatar stack + count
7. [ ] Tap "See My Model" → result screen loads (no hooks error)
8. [ ] Result screen shows: archetype name, selected people chips, 3 offer layers (attraction, core, continuity)
9. [ ] Each layer has "Hell Yes" and "Other options" buttons
10. [ ] Tapping "Other options" expands alternatives from other archetypes
11. [ ] Scale layer shows for relevant archetypes (workshop, cohort)
12. [ ] First Step card shows at bottom
13. [ ] Button says "Save My Model" (NOT "Sign Up to Save My Model")
14. [ ] Tap "Save My Model" → saves to `experience_creator_selections` table
15. [ ] Redirects to `/create`

### /try/experience-creators (public, anonymous)

16. [ ] Navigate to `/try/experience-creators` in incognito/logged-out browser
17. [ ] No AuthGate, flow loads directly
18. [ ] Browse and select creators as above
19. [ ] Result screen shows email input field instead of "Save My Model" button
20. [ ] Enter email → tap "Send Me My Model"
21. [ ] Saves to `experience_creator_leads` table
22. [ ] Shows confirmation: "Your model has been sent to [email]"
23. [ ] CTA button: "Click Here For Support Bringing It To Life" → navigates to `/get-started`

---

## Flow 2: Creator Portal Home (/create)

### Gate Check

24. [ ] Navigate to `/create` WITHOUT completing Experience Creator Matching first
25. [ ] Should redirect to `/experience-creators` (matching is the gate)
26. [ ] Complete matching → save → should land on `/create`
27. [ ] Subsequent visits to `/create` go straight to CreatorHome (no re-matching)

### Header

28. [ ] Shows "Create" title
29. [ ] Shows Scope Map badge (The Stream/Lake/Waterfall/River) if scope_map_results exists
30. [ ] Shows stats row: experiences count, attendees, repeat rate, 3% ratio
31. [ ] Stats show "—" for attendees/repeat if no data yet

### Tabs

32. [ ] Three tabs visible: My Business, Experiences, Dashboard
33. [ ] Default tab is "Experiences"
34. [ ] Tapping tabs switches content
35. [ ] Active tab has purple underline
36. [ ] Tabs are underline style (not pill/button style)

---

## Flow 3: My Business Tab

### Product Suite Card

37. [ ] Shows "Product Suite" title
38. [ ] Shows archetype badge from matching (e.g. "Workshops & Training")
39. [ ] Shows 4 layers: Attraction, Core, Scale, Continuity
40. [ ] Each layer has colored dot, name, value, status badge
41. [ ] Without assessment: all show "—" and "Missing"
42. [ ] "Set Up Assessment" button visible

### Assessment Edit Mode

43. [ ] Tap "Set Up Assessment" → card switches to edit mode
44. [ ] Each layer shows 3 radio options: Have it / Inconsistent / Missing
45. [ ] Selecting "Have it" or "Inconsistent" reveals text input field
46. [ ] Placeholder text: "What do you have for [layer]?"
47. [ ] "Save Assessment" button at bottom
48. [ ] "Cancel" button returns to display mode without saving
49. [ ] Save → inserts row to `creator_assessments` table
50. [ ] Card returns to display mode with saved values showing
51. [ ] Status badges update: green "Have it", gold "Inconsistent", red "Missing"
52. [ ] "Update Assessment" button appears (not "Set Up")
53. [ ] Subsequent saves create NEW rows (history tracking, not upsert)

### Scope Map Position Card

54. [ ] Shows "Your Position" title
55. [ ] If scope_map_results exists: shows stage name + icon + description
56. [ ] If no scope_map_results: shows "Complete the Scope Map diagnostic to see where you are"

### Play Profile Card

57. [ ] Shows "Work Style" title
58. [ ] If founder_dna_results exists: shows archetype badge + matched founder + DNA icon
59. [ ] If no DNA results: shows "Discover your work style to get personalized challenges"
60. [ ] "Discover Your Work Style" button links to `/play-profile`

---

## Flow 4: Experiences Tab

### Active Experience Card

61. [ ] If upcoming experience exists: shows card with gold left border
62. [ ] Card shows: name, date badge, venue, countdown ("12 days away"), type
63. [ ] Checklist progress bar (if applicable)
64. [ ] "View Checklist" button → navigates to `/create/experience/:id`

### Active Challenges

65. [ ] If challenges exist (from checklist [lightning bolt] or intentions): shows challenge list
66. [ ] Each challenge shows: green/red dot, title, deadline countdown
67. [ ] Completed challenges show strikethrough text + "done"
68. [ ] Urgent deadlines (< 3 days) show in red
69. [ ] Header shows "This Fortnight's Challenges" with X/Y count

### No Active Experience

70. [ ] If no upcoming experience: shows "No upcoming experience. Create one to get started."

### Past Experiences

71. [ ] Shows completed/archived experiences
72. [ ] Each shows: checkmark, name, date
73. [ ] If 3% improvement note exists: shows in gold italic
74. [ ] Tapping a past experience navigates to `/create/experience/:id`
75. [ ] Sorted newest first

### New Experience

76. [ ] "+ New Experience" button at bottom
77. [ ] Navigates to `/create/experience/new`
78. [ ] Create experience form: name + date
79. [ ] On save: creates experience + seeds checklist + navigates to detail

---

## Flow 5: Experience Detail (/create/experience/:id)

### Pre-Event Tab

80. [ ] Shows "Pre-Event" and "Post-Event" phase tabs
81. [ ] Pre-Event tab shows two sections: Marketing ("Fill the Room") + Organisation ("Ready to Deliver")

### Marketing Section (with lightning bolt)

82. [ ] Shows 9 marketing checklist items
83. [ ] Each item has: checkbox, label, actions
84. [ ] Non-completed items in marketing section show [lightning bolt] button
85. [ ] Organisation items do NOT show [lightning bolt] (plain checkboxes only)
86. [ ] Tapping checkbox toggles completion
87. [ ] Tapping [lightning bolt] → shows deadline picker inline
88. [ ] Deadline picker: date input + "Create Challenge" button + cancel
89. [ ] If no Play Profile: shows hint "Want personalized challenges? Complete your Play Profile"
90. [ ] Tap "Create Challenge" → creates groan_challenges row with:
    - challenge_source = 'checklist'
    - checklist_item_id linked
    - experience_id linked
    - deadline set
    - scary/wahoo scores auto-assigned based on item type
    - DNA personalization if Play Profile completed
91. [ ] Lightning bolt icon changes to 🎯 (target) after conversion
92. [ ] Converted items can't be re-converted (🎯 replaces ⚡)
93. [ ] Custom items can be added via "+ Add custom task"
94. [ ] Items can be hidden (skip) via ⊘ button
95. [ ] Hidden items can be restored via ↺ button
96. [ ] Progress ring shows completion percentage

### Post-Event Tab

97. [ ] Shows four sections: Attendees, Follow-up, Costs, Reflection

### Attendee Upload

98. [ ] Shows "Attendees" section with icon + count
99. [ ] "Upload Screenshot" button with camera icon
100. [ ] Tap → opens camera/gallery file picker
101. [ ] After selecting image: shows "Extracting..." state
102. [ ] Calls `extract-attendees` edge function (Claude Vision)
103. [ ] On success: shows "Found X attendees" with editable list
104. [ ] Each attendee row shows: name, email (if extracted), remove button
105. [ ] "Add All X Attendees" gold button at bottom
106. [ ] Tap → inserts contacts to `crm_contacts` + `experience_attendees`
107. [ ] Existing contacts matched by name (ilike), not duplicated
108. [ ] Shows "Attendees added" confirmation with "Upload more" option
109. [ ] Attendee count updates after save

### Follow-up Section (with lightning bolt)

110. [ ] Shows 6 follow-up checklist items
111. [ ] Same [lightning bolt] behavior as marketing section
112. [ ] Items: thank-you email, feedback request, testimonials, upsell invite, photos, attendee data

### Cost Logger

113. [ ] Shows "Costs" section with total
114. [ ] Category dropdown: Venue, Marketing, Materials, Staff, Other
115. [ ] Description text input + amount number input + "+" add button
116. [ ] Adding a cost: inserts to `experience_costs` table
117. [ ] Shows line items with icon, description, amount, delete button
118. [ ] Total updates on add/delete
119. [ ] Delete removes from DB + UI

### Reflection Section

120. [ ] Shows 4 reflection items (wahoo moments, scary moments, 3% improvement, archive)
121. [ ] Plain checkboxes (no lightning bolt)
122. [ ] These are standard checklist items, not challenge-convertible

---

## Flow 6: Dashboard Tab

### Key Metrics

123. [ ] Shows 4 KPI cards in 2x2 grid
124. [ ] Total Attendees: count from `experience_attendees` (distinct contacts)
125. [ ] Repeat Rate: % of contacts in 2+ experiences
126. [ ] Experiences Run: count of completed experiences
127. [ ] 3% Implemented: count of experiences with 3% note / total completed
128. [ ] All show 0 or "—" when no data

### 4-Layer Progress

129. [ ] Shows 4 progress bars: Attraction, Core, Scale, Continuity
130. [ ] Colors: purple, gold, green, blue
131. [ ] Percentages driven by assessment: Have it = 100%, Inconsistent = 50%, Missing = 0%
132. [ ] If no assessment: all show 0% with "Complete your 4-layer assessment" prompt

### 3% Improvement Chain

133. [ ] Shows numbered list of 3% notes from past experiences
134. [ ] Gold left border accent
135. [ ] Newest at top
136. [ ] Only shows if at least one experience has a three_percent_note

### Quick Access Links

137. [ ] Shows 4 CRM links: Attendees, Follow-up Sequences, Marketing Assets, Facilitator Nudges
138. [ ] Each navigates to the correct CRM route:
    - Attendees → `/crm/contacts`
    - Follow-up Sequences → `/crm/email-sequences`
    - Marketing Assets → `/crm/content/create`
    - Facilitator Nudges → `/crm/alerts`
139. [ ] Links show arrow chevron

---

## Flow 7: Navigation & Routing

### Bottom Toolbar

140. [ ] Bottom toolbar shows: Home, Challenge, Create, Profile
141. [ ] Create icon is ✨
142. [ ] Create is highlighted (gold) when on any `/create/*` route
143. [ ] Tapping Create navigates to `/create`

### Route Backward Compat

144. [ ] `/business` redirects to `/create`
145. [ ] `/business/experience/new` redirects to `/create/experience/new`
146. [ ] `/business/experience/:id` redirects to `/create/experience/:id` (with actual ID, not literal `:id`)

### Challenge Page

147. [ ] `/7-day-challenge` shows tabs: Level, Play-list, Healing, Bonus
148. [ ] NO "Create" tab in the challenge page (it's now standalone)
149. [ ] `?tab=create` or `?tab=business` in URL defaults to Level tab (backward compat)

---

## Database Tables to Verify

| Table | Exists | Test |
|---|---|---|
| `experience_creator_selections` | Yes | Check after matching save |
| `experience_creator_leads` | Yes | Check after /try email capture |
| `experience_blueprints` | Yes | Not in core flow (upsell) |
| `creator_assessments` | Yes | Check after assessment save |
| `experience_attendees` | Yes | Check after attendee upload |
| `experience_costs` | Yes | Check after cost logging |
| `experiences` | Yes | Check after new experience creation |
| `experience_checklist_items` | Yes | Check seeded after experience creation |
| `groan_challenges` | Yes | Check after [lightning bolt] conversion |
| `scope_map_results` | Yes | Populated by ScopeMapFlow |

---

## Edge Functions to Verify

| Function | Deployed | Test |
|---|---|---|
| `extract-attendees` | Yes | Upload a screenshot in post-event tab |
| `experience-blueprint-ai` | Yes | Not in core flow (upsell, Shift Architecture) |

---

## Known Gaps (Not Bugs, Just Not Built Yet)

- Group call intention flow (fortnightly commitments)
- CRM alias layer (display labels still say "Contacts" not "Attendees")
- Mid-cycle push notification (day 7 nudge)
- Experience-specific content triggers
- Pre-built email sequence templates for experience creators
- "Send Me My Model" doesn't actually email yet (saves to DB only)
