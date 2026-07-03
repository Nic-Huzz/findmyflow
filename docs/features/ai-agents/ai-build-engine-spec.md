# AI Build Engine Spec — Creator Portal Desktop

## What This Is

The desktop Electron app gets "Build with AI" superpowers that surface as contextual ⚡ buttons throughout the creator portal. When a creator taps ⚡, the app assembles a rich prompt from their existing data and sends it to Claude Code running in the embedded terminal.

This is NOT a separate "Terminal" tab. It's an acceleration layer embedded into the flows creators already use.

## Architecture

```
Creator Portal UI (React)
        │
        ▼
Frontend Build Flow (simple questions)
        │
        ▼
Prompt Template Engine (assembles context from Supabase data)
        │
        ▼
Terminal Drawer (injects prompt into Claude Code)
        │
        ▼
Claude Code (builds the thing)
        │
        ▼
Output (deployed via Vercel MCP, saved to app data)
```

## What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| Electron shell | Built | `electron/main.cjs` |
| Terminal (xterm.js + node-pty) | Built | `src/components/portal/TerminalDrawer.jsx`, `server/terminal-server.cjs` |
| Prompt injection | Built | `TerminalDrawer` accepts `pendingPrompt` prop |
| Folder picker | Built | `server/terminal-server.cjs` `/api/pick-folder` |
| File scanner | Built | `server/terminal-server.cjs` `/api/folder-scan` |
| AI Portal mode switcher | Built | `src/components/portal/AIPortal.jsx` |
| Agents chat (Zarlo/Perry) | Built | `src/components/portal/AgentsMode.jsx` |
| App Build mode | Built (basic) | `src/components/portal/AppBuildMode.jsx` |
| Documents mode | Built (basic) | `src/components/portal/DocumentsMode.jsx` |

## What Needs Building

### Phase 0: Setup Wizard (one-time)

Before any ⚡ features work, the creator needs Claude Code + Vercel CLI installed. This is a guided one-time setup flow.

**Trigger:** First time creator taps any ⚡ button, or manually from Settings.

#### Setup Flow

```
┌─────────────────────────────────────┐
│  Set Up Your Build Engine  ⚡        │
│                                     │
│  Step 1 of 3                        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Claude Code                  │    │
│  │ Your AI builder              │    │
│  │                              │    │
│  │ ○ Not installed              │    │
│  │ [Install →]                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Vercel                       │    │
│  │ Deploys your pages to the web│    │
│  │                              │    │
│  │ ○ Not installed              │    │
│  │ [Install →]                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Node.js                      │    │
│  │ Runs everything              │    │
│  │                              │    │
│  │ ● Installed (v24.14.1)       │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Detection checks** (run in terminal, capture output):
```bash
# Node.js
node --version          # v24.14.1

# Claude Code
claude --version        # claude-code/2.1.91

# Vercel CLI
vercel --version        # 54.14.0
```

**Install commands** (executed in terminal on button click):
```bash
# Claude Code
npm install -g @anthropic-ai/claude-code

# Vercel CLI
npm install -g vercel
```

**Post-install:** Prompt user to authenticate:
- Claude Code: `claude` (opens auth flow in browser)
- Vercel: `vercel login` (opens auth flow in browser)

**State stored in:** `localStorage` or Electron `app.getPath('userData')` as `build-engine-setup.json`:
```json
{
  "node": true,
  "claudeCode": true,
  "vercel": true,
  "setupCompleted": "2026-06-17T...",
  "claudeCodeVersion": "2.1.91",
  "vercelVersion": "54.14.0"
}
```

### Phase 1: Lead Magnet Builder (Root ⚡ action)

**Trigger:** Root prescription shows "Build a lead magnet" → creator taps "Build with AI ⚡"

**Frontend flow** (3 simple questions, pre-filled from existing data):

```
┌─────────────────────────────────────┐
│  Build Your Lead Magnet  ⚡          │
│                                     │
│  1. What format?                    │
│     ○ PDF guide                     │
│     ○ Mini email course             │
│     ○ Quiz / assessment             │
│     ○ Checklist                     │
│                                     │
│  2. What problem does it solve?     │
│     [pre-filled from Blow Up Brand  │
│      wound_problem field]           │
│                                     │
│  3. What do they walk away with?    │
│     [text input]                    │
│                                     │
│  [Build It →]                       │
└─────────────────────────────────────┘
```

**Prompt assembly** (the app builds this, creator never sees it):
```
Create a [format] lead magnet for a [creator archetype] who runs [experience type].

Context from their profile:
- Their remarkable angle: [remarkable_angles.ai_rule_statement]
- The problem they solve: [remarkable_angles.wound_problem]
- Their one-liner: [remarkable_angles.extreme_action_plan]
- Their voice: [voice_profiles data]
- Their North Star creators: [experience_creator_selections.selected_creators]

The lead magnet should:
- Solve: [answer to Q2]
- Walk away with: [answer to Q3]
- Match their brand voice (described above)
- Be formatted as [format]

Output as a single HTML file with inline CSS, ready to deploy.
```

**Terminal execution:**
1. App creates a project folder: `~/ViberiseBuilds/lead-magnet-[date]/`
2. Injects prompt into terminal: `cd ~/ViberiseBuilds/lead-magnet-[date] && claude "[assembled prompt]"`
3. Claude Code builds the asset
4. App detects completion, offers: "Deploy to web?" → runs `vercel deploy` in terminal
5. Deployed URL saved to `products` table or pipeline

### Phase 2: Landing Page Builder (Capture ⚡ action)

**Trigger:** Pipeline Capture node → "Build landing page ⚡" or Root prescription for capture.

**Frontend flow** (pre-filled from experience data):
```
┌─────────────────────────────────────┐
│  Build Landing Page  ⚡              │
│                                     │
│  For: Breathwork Retreat Jun 28     │
│  (pulled from experience)           │
│                                     │
│  1. Style vibe?                     │
│     ○ Clean + minimal              │
│     ○ Bold + energetic             │
│     ○ Warm + earthy                │
│     ○ Match my brand (purple/gold) │
│                                     │
│  2. Sections to include:           │
│     ☑ Hero with headline           │
│     ☑ What you'll experience       │
│     ☑ About the facilitator        │
│     ☑ Testimonials                 │
│     ☑ Pricing + book now           │
│     ☐ FAQ                          │
│     ☐ Location map                 │
│                                     │
│  3. Booking link?                  │
│     [https://...]                   │
│                                     │
│  [Build It →]                       │
└─────────────────────────────────────┘
```

**Prompt assembly** pulls from:
- `experiences` table (name, date, price, description, venue, one_line_promise)
- `remarkable_angles` (positioning, one-liner)
- `voice_profiles` (tone, style)
- `contact_experiences` count (social proof: "X people have attended")
- `experiences.three_percent_note` (testimonial-like reflections)
- Creator's selected style vibe + sections

**Terminal execution:** Same pattern — create folder, inject prompt, Claude Code builds, Vercel deploys, URL saved to experience pipeline Attract node.

### Phase 3: Content Batch Creator (Reach ⚡ action)

**Trigger:** Growth tab → "Draft this week's content ⚡" or Attract node → "Generate posts ⚡"

**Frontend flow:**
```
┌─────────────────────────────────────┐
│  Generate Content  ⚡                │
│                                     │
│  Promoting: Breathwork Retreat      │
│  (or general brand content)         │
│                                     │
│  1. How many posts?                 │
│     ○ 3 posts (light week)          │
│     ○ 5 posts (normal)             │
│     ○ 7 posts (launch week)        │
│                                     │
│  2. Platforms:                      │
│     ☑ Instagram captions           │
│     ☐ LinkedIn posts               │
│     ☐ Email newsletter             │
│                                     │
│  3. Content angles:                │
│     ☑ Personal story               │
│     ☑ Behind the scenes            │
│     ☑ Educational / tips           │
│     ☐ Social proof / testimonials  │
│     ☐ Direct promotion             │
│                                     │
│  [Generate →]                       │
└─────────────────────────────────────┘
```

**Prompt assembly** pulls from:
- `remarkable_angles` (positioning, rule break)
- `voice_profiles` (tone, catchphrases, anti-patterns)
- `experiences` (details of what they're promoting)
- Selected angles + platforms + count

**Output:** Posts saved to `content_history` as drafts. Creator reviews, edits, posts manually. No deployment needed — output is text, not code.

**Alternative (no terminal needed):** This flow could work via Supabase edge function + Claude API instead of Claude Code. Simpler for mobile/PWA. Consider making this the one ⚡ feature that works everywhere, not just desktop.

## Where ⚡ Buttons Appear

| Location | Button Text | What It Builds | Desktop Only? |
|----------|------------|----------------|---------------|
| Root prescription (Lead Magnet gap) | "Build with AI ⚡" | Lead magnet (PDF/HTML/email course) | Yes |
| Root prescription (Offer gap) | "Build with AI ⚡" | Offer page / sales page | Yes |
| Pipeline Attract node | "Build landing page ⚡" | Landing page for experience | Yes |
| Pipeline Attract node | "Generate posts ⚡" | Content drafts | Maybe (could work via edge function) |
| Growth tab | "Draft this week's content ⚡" | Batch content | Maybe (could work via edge function) |

## Setup Requirements

| Tool | Required For | Install Command | Auth |
|------|-------------|-----------------|------|
| Node.js | Everything | Bundled with Electron | N/A |
| Claude Code | AI building | `npm i -g @anthropic-ai/claude-code` | `claude` (opens browser auth) |
| Vercel CLI | Deploying pages | `npm i -g vercel` | `vercel login` |

**Not required:**
- GitHub (Claude Code deploys directly via Vercel)
- Supabase CLI (app uses existing Supabase project)
- Any coding knowledge

## Prompt Template Engine

Central service that assembles prompts from creator data.

**File:** `src/lib/promptTemplateEngine.js`

```javascript
export async function assemblePrompt(templateId, userAnswers, userId) {
  // 1. Fetch creator context from Supabase
  const [remarkable, voice, experience, creators] = await Promise.all([
    supabase.from('remarkable_angles').select('*').eq('user_id', userId).single(),
    // voice_profiles query
    // experience query (if experience-specific)
    // selected creators query
  ])

  // 2. Load template
  const template = TEMPLATES[templateId]

  // 3. Merge user answers + context into prompt
  return template.build({ ...userAnswers, remarkable, voice, experience, creators })
}
```

**Templates are functions, not strings** — they adapt based on what data exists. If no voice profile, skip that section. If no testimonials, skip social proof. The prompt is always complete but never generic.

## Technical Notes

### Terminal Prompt Injection

The existing `TerminalDrawer` accepts a `pendingPrompt` prop. When set, it writes the prompt text into the terminal. For Claude Code, the injected text would be:

```bash
cd ~/ViberiseBuilds/[project-name] && claude "[assembled prompt]"
```

This starts Claude Code in the project folder with the full prompt. Claude Code handles the rest.

### Project Folder Structure

```
~/ViberiseBuilds/
├── lead-magnet-2026-06-17/
│   ├── index.html          (Claude Code output)
│   └── .vercel/            (after deploy)
├── landing-page-breathwork-retreat/
│   ├── index.html
│   ├── styles.css
│   └── .vercel/
└── content-batch-2026-06-17/
    ├── post-1.md
    ├── post-2.md
    └── post-3.md
```

### Completion Detection

After injecting the prompt, the app needs to know when Claude Code is done. Options:
1. **Watch the project folder** (fs.watch) for new files appearing
2. **Watch terminal output** for Claude Code's completion message
3. **Poll** the folder after a timeout

Option 1 is cleanest — the file watcher already exists in terminal-server.cjs.

## Phasing

### Phase 0: Setup Wizard
- Tool detection (Node, Claude Code, Vercel CLI)
- One-click install buttons
- Auth flows (claude login, vercel login)
- "Build Engine Ready" state stored locally

### Phase 1: Lead Magnet Builder
- Frontend flow (3 questions)
- Prompt template for lead magnets
- Terminal injection + project folder creation
- Vercel deploy on completion
- Root score updates when complete

### Phase 2: Landing Page Builder
- Frontend flow (style, sections, booking link)
- Prompt template pulling from experience data
- Deploy + save URL to pipeline Attract node

### Phase 3: Content Batch Creator
- Frontend flow (count, platforms, angles)
- Prompt template from voice + remarkable angle
- Output saved to content_history as drafts
- Consider: edge function version for mobile/PWA

### Phase 4: Template Library
- Browse what other creators have built
- "Use this template" → pre-fills the flow
- Community-contributed templates over time

## Reference

The claude-portal project (`/Users/nichuzz/creations/zArchive/claude-portal`) implemented a similar wizard:
- Essentials check (Node + Claude Code only)
- "What do you want to build?" intent question
- Auto-execute first prompt in terminal
- Sidebar recommendation engine (state-based progressive disclosure)
- "Claude Can See" integration status panel
- Integration cards for Gmail, Calendar, GitHub, Supabase, Vercel

Key lesson from claude-portal: **action first, setup second**. Don't front-load configuration. Let the creator tap ⚡, hit the setup wall, complete it in 3 minutes, and immediately see their thing being built. The setup is a speed bump, not a gate.

Full reference: `docs/plans/2026-03-15-claude-code-essentials-wizard.md` in the claude-portal archive.
