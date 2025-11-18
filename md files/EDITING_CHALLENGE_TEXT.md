# How to Edit Challenge Text (Healing Compass)

## Where to Edit the Healing Compass Challenge

The Healing Compass challenge has text in **two places**:

### 1. Quest Card (In the 7-Day Challenge Portal)

**File:** `public/challengeQuests.json`

**What to edit:**
- Quest name, description, points, learn more text

**Example (lines 68-79):**
```json
{
  "id": "recognise_healing_compass",
  "category": "Recognise",
  "type": "weekly",
  "name": "Healing Compass",  ← Edit quest name here
  "description": "Identify the wound/s causing your Protective Archetype to protect you",  ← Edit description here
  "points": 20,
  "inputType": "flow",
  "flow_id": "healing_compass",
  "flow_route": "/healing-compass",
  "learnMore": "The Healing Compass is a reflective process..."  ← Edit "Learn More" text here
}
```

**How to edit locally:**
1. Open `public/challengeQuests.json` in your code editor (VS Code, etc.)
2. Find the `"recognise_healing_compass"` quest
3. Edit the text you want to change
4. Save the file
5. Refresh your browser - changes appear immediately (no rebuild needed)

---

### 2. Healing Compass Flow (The Actual Challenge Experience)

**File:** `src/flows/HealingCompass.jsx`

**What to edit:**
- All the questions, steps, instructions, and content inside the challenge flow

**Example (line 1 onwards):**
```jsx
<div className="flow-container">
  <h1>Healing Compass</h1>  ← Edit title here
  <p>Welcome to the Healing Compass...</p>  ← Edit intro text here

  {/* Step 1 */}
  <div className="step">
    <h2>Step 1: Identify Your Pattern</h2>  ← Edit step titles here
    <p>What protective behavior keeps showing up?</p>  ← Edit questions here
  </div>
</div>
```

**How to edit locally:**
1. Open `src/flows/HealingCompass.jsx` in your code editor
2. Find the text you want to change (it's all JSX/HTML)
3. Edit the text
4. Save the file
5. Your dev server (npm run dev) will auto-reload the page with changes

---

## Quick Reference: What's Where?

| What You Want to Edit | File to Edit |
|-----------------------|--------------|
| Quest name/description in challenge list | `public/challengeQuests.json` |
| "Learn More" dropdown text | `public/challengeQuests.json` |
| Point value | `public/challengeQuests.json` |
| The actual challenge steps/questions | `src/flows/HealingCompass.jsx` |
| Button text inside the flow | `src/flows/HealingCompass.jsx` |
| Validation messages | `src/flows/HealingCompass.jsx` |

---

## Tips for Editing

### Editing JSON (challengeQuests.json)
- **Be careful with commas!** JSON is strict about syntax
- Always keep quotes around text: `"name": "Healing Compass"`
- Use `\n` for new lines in text: `"This is line 1\n\nThis is line 3"`
- Don't add comments (JSON doesn't support them)

### Editing JSX (HealingCompass.jsx)
- Text goes inside HTML tags: `<h1>Your Title</h1>`
- You can use normal line breaks
- Comments look like this: `{/* Your comment */}`
- Save and the page auto-reloads

---

## Testing Your Changes

### After editing `challengeQuests.json`:
1. Go to http://localhost:5173/7-day-challenge
2. Click on Recognise tab
3. Scroll to "Healing Compass" quest
4. Verify your changes appear

### After editing `HealingCompass.jsx`:
1. Go to http://localhost:5173/7-day-challenge
2. Click "Start Healing Compass →" button
3. Go through the flow and verify your changes

---

## Deploying Your Changes

Once you're happy with your edits:

```bash
# Stage your changes
git add public/challengeQuests.json
git add src/flows/HealingCompass.jsx

# Commit with a clear message
git commit -m "Update Healing Compass challenge text"

# Push to deploy
git push origin main
```

Vercel will automatically deploy your changes in ~2 minutes.

---

## Common Edits You Might Want to Make

### Change the quest description:
**File:** `public/challengeQuests.json` (line 73)
```json
"description": "Your new description here"
```

### Change the quest title:
**File:** `public/challengeQuests.json` (line 72)
```json
"name": "Your New Title"
```

### Change the first question in the flow:
**File:** `src/flows/HealingCompass.jsx`
Find the question text and edit it directly.

### Change point value:
**File:** `public/challengeQuests.json` (line 74)
```json
"points": 25  // Changed from 20 to 25
```

---

## Need to Find the HealingCompass.jsx File?

**Full path:** `/Users/nichurrell/Findmyflow/src/flows/HealingCompass.jsx`

If the file doesn't exist yet, you may need to create it. Let me know and I can help set it up!

---

## Summary

- **Quest card text** (name, description, learn more) → `public/challengeQuests.json`
- **Challenge flow content** (questions, steps, instructions) → `src/flows/HealingCompass.jsx`
- Both can be edited directly on your local machine
- Changes appear immediately (JSON) or after auto-reload (JSX)
- Push to main branch to deploy

**You're all set to edit the Healing Compass challenge!** 🎉
