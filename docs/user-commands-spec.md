# User Commands Specification

This document defines the slash commands available to users during the Nikigai flow.

---

## Overview

User commands provide quick access to common actions without breaking the conversational flow. They're typed with a forward slash (`/`) prefix.

---

## Command List

### `/summary`
**Purpose:** Display all answers provided so far

**Behavior:**
- Shows responses from all completed steps
- Organized by section (Hobbies, High Moments, Life Chapters, etc.)
- Includes current progress indicator

**Example output:**
```
📋 Your Journey So Far (Step 15 of 39)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 Things You Love Doing

Childhood:
• Building Lego cities
• Drawing maps
• Playing teacher

High School:
• Creative writing
• Student government
• Theater

18 to Now:
• UX design
• Facilitating workshops
• Mentoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💫 Proud/Alive Moments

[Similar format for other sections...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type 'continue' to resume where you left off
```

---

### `/tags`
**Purpose:** Show extracted tags (skills, values, problems) from responses

**Behavior:**
- Displays tags extracted via auto-tagging
- Shows tag frequency and weights
- Organized by tag type

**Example output:**
```
🏷️ Extracted Patterns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Skill Verbs:
• designing (appears 6x, weight: 0.85)
• facilitating (appears 4x, weight: 0.72)
• storytelling (appears 5x, weight: 0.68)
• building (appears 3x, weight: 0.61)

Values:
• creativity (appears 8x, weight: 0.90)
• connection (appears 5x, weight: 0.75)
• growth (appears 4x, weight: 0.68)

Domain Topics:
• design (appears 5x)
• education (appears 4x)
• community (appears 3x)

Problem Themes:
• lack of purpose (appears 3x)
• disconnection (appears 2x)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These patterns inform your skill clusters and problem themes.

Type 'continue' to resume
```

---

### `/back`
**Purpose:** Return to previous step

**Behavior:**
- Navigates to the immediately previous step
- Preserves previous response
- Allows user to review or change answer
- Maximum 3 steps back (prevents endless looping)

**Example output:**
```
⏮️ Going back one step...

[Shows previous question]

Your previous answer: "Building Lego cities, Drawing maps..."

You can:
• Keep this answer (type 'continue')
• Change your answer (type new response)
```

**Limitations:**
- Cannot go back past certain checkpoints (e.g., after email capture)
- Cannot go back more than 3 steps
- Warning if trying to go back past a cluster generation step

---

### `/skip`
**Purpose:** Skip current question and move to next step

**Behavior:**
- Stores null/empty value for current step
- Moves to next step in flow
- Warns if skipping a critical question
- Maximum 3 consecutive skips (prevents empty data)

**Example output:**
```
⏭️ Skipping this question.

Note: Some insights may be less accurate without this data.

Moving to next step...
```

**Limitations:**
- Cannot skip required fields (e.g., email capture, consent)
- Warning after 2nd consecutive skip
- Block after 3rd consecutive skip with encouragement to continue

---

### `/reflect`
**Purpose:** Write a freeform journal note not tied to any specific question

**Behavior:**
- Opens a freeform text area
- Saved to user's session with timestamp
- Not processed for tags/clusters (unless user requests)
- Can be reviewed in `/summary`

**Example output:**
```
📝 Reflection Space

Write any thoughts, realizations, or notes that came up during this process.

This is just for you — it won't affect your clusters or results unless you
want it to.

[Text area appears]

When done, type 'save' to continue.
```

**Use cases:**
- User has a sudden insight
- User wants to capture a thought before forgetting
- User needs to process emotions before continuing

---

### `/export`
**Purpose:** Generate and download summary document

**Behavior:**
- Creates PDF or Markdown file
- Includes all responses and generated clusters
- Available only after Life Map completion
- Offers customization options

**Example output:**
```
📄 Export Your Life Map

Choose format:
• PDF (pretty formatting, shareable)
• Markdown (editable, plain text)

Include:
☑ All your responses
☑ Generated clusters
☑ Reflection notes
☐ Tags and weights (advanced)

[Generate Export Button]
```

**File naming:**
`Nikigai_LifeMap_[UserName]_[Date].pdf`

---

### `/pause`
**Purpose:** Save progress and exit session

**Behavior:**
- Saves all data to database
- Generates resume link or code
- Sends email with resume link (if email captured)
- Allows resuming from exact same step

**Example output:**
```
💾 Saving your progress...

Your journey has been saved at Step 15/39.

Resume anytime using:
• This link: [unique URL]
• Or this code: NK-ABC123

We've also emailed this to you at: user@email.com

See you soon! ✨
```

---

### `/help`
**Purpose:** Show available commands and guidance

**Example output:**
```
❓ Available Commands

Navigation:
• /back — Return to previous question
• /skip — Skip current question
• /pause — Save progress and exit

Information:
• /summary — See all your answers so far
• /tags — View extracted patterns
• /reflect — Write a freeform note

Export:
• /export — Download your Life Map (available after completion)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stuck? Just type your question and I'll help!

Type 'continue' to resume
```

---

### `/restart`
**Purpose:** Start over from the beginning

**Behavior:**
- Warns user about losing progress
- Requires confirmation
- Clears all data (with option to save first)

**Example output:**
```
⚠️ Restart Journey

This will clear all your progress and start from the beginning.

Current progress: 15/39 steps complete

Would you like to:
• Save current progress first (recommended)
• Restart without saving
• Cancel and continue

[Buttons for each option]
```

---

## Implementation

### Command Detection

```javascript
function detectCommand(userInput) {
  const trimmed = userInput.trim()

  if (!trimmed.startsWith('/')) {
    return null // Not a command
  }

  const command = trimmed.substring(1).toLowerCase()
  return command
}
```

### Command Routing

```javascript
async function handleCommand(command, sessionData) {
  switch(command) {
    case 'summary':
      return await showSummary(sessionData)

    case 'tags':
      return await showTags(sessionData)

    case 'back':
      return await goBack(sessionData)

    case 'skip':
      return await skipQuestion(sessionData)

    case 'reflect':
      return await openReflectionSpace()

    case 'export':
      return await generateExport(sessionData)

    case 'pause':
      return await saveAndPause(sessionData)

    case 'help':
      return showHelpMessage()

    case 'restart':
      return await confirmRestart(sessionData)

    default:
      return {
        error: true,
        message: `Unknown command: /${command}\n\nType /help to see available commands.`
      }
  }
}
```

### State Management

Commands should:
1. Not lose current flow position
2. Save state before executing
3. Return user to exact same step after completion
4. Preserve all context and data

**Example:**
```javascript
// Before executing command
const savedState = {
  currentStepId: session.currentStepId,
  currentStepIndex: session.currentStepIndex,
  tempResponses: session.tempResponses
}

// Execute command
await executeCommand(command)

// Restore state
session.currentStepId = savedState.currentStepId
session.currentStepIndex = savedState.currentStepIndex
// ... restore other state
```

---

## UI Considerations

### Command Input

**Visual indicator:**
- When user types `/`, show autocomplete dropdown with available commands
- Highlight command syntax with different color
- Show brief description next to each command

**Example:**
```
User types: /su

Autocomplete shows:
┌─────────────────────────────────────┐
│ /summary — See all your answers     │
└─────────────────────────────────────┘
```

### Command Feedback

**Immediate acknowledgment:**
```
User: /summary

[Loading indicator]

Alfred: 📋 Here's your journey so far...
```

**Clear return to flow:**
```
[After showing summary]

Alfred: Ready to continue where you left off?

[Continue button]
```

---

## Error Handling

### Invalid Command

```
User: /analyze

Alfred: Hmm, I don't recognize that command.

Did you mean /tags (to see extracted patterns)?

Type /help to see all available commands.
```

### Command Not Available Yet

```
User: /export

Alfred: The export feature is available after you complete the Life Map
(currently at step 15/39).

Keep going — you're making great progress! ✨
```

### Command Blocked by State

```
User: /back

Alfred: I can't go back from this step — we've just generated your final
clusters and saved them.

But you can still review everything with /summary or edit clusters
individually if needed.
```

---

## Analytics & Tracking

Track command usage to understand user behavior:

```javascript
{
  event: 'command_used',
  command: 'summary',
  step_id: '7.2',
  session_id: 'session_123',
  timestamp: '2025-11-07T10:30:00Z'
}
```

**Insights to gather:**
- Most commonly used commands
- When users tend to use `/back` or `/skip`
- Correlation between `/tags` usage and completion rate
- Drop-off patterns around `/pause`

---

## Future Commands (Nice to Have)

### `/compare` (Advanced)
Compare your responses with aggregate patterns

### `/why` (Advanced)
Explain why a specific cluster was created

### `/edit [section]` (Advanced)
Jump directly to edit a specific section

### `/suggest` (Advanced)
AI suggests what to explore based on gaps in responses

---

## Next Steps

See also:
- `/docs/alfred-system-prompt.md` - AI personality and behavior
- `/docs/nikigai-auto-tagging-schema.md` - Tag extraction system
- `Nikigai Question Flow v2.2.json` - Complete flow definition

---

*Last updated: 2025-11-07*
