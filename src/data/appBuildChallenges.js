/**
 * appBuildChallenges.js — Full challenge content for the Build Your App flow
 *
 * Ported from BuildWithAI (update_challenges.sql). Static curriculum data.
 * Progress tracking lives in Supabase (app_build_progress, app_build_prework).
 */

// ─── Prework: Define Your Product ──────────────────────────────────────────

export const PREWORK_STEPS = [
  {
    id: 'problem',
    title: 'Identify the Problem',
    duration: '5 minutes',
    instruction: 'Write 2-3 sentences describing the specific problem or pain point.',
    example: 'Small business owners struggle to collect customer feedback after services. They send manual follow-up emails, but response rates are low. They need an automated way to request and collect reviews that feels personal, not spammy.',
    checkpoint: 'Can you explain this problem to someone in under 30 seconds?',
    inputType: 'textarea',
    placeholder: 'What problem are you solving?'
  },
  {
    id: 'target_user',
    title: 'Define Your Target User',
    duration: '3 minutes',
    instruction: 'Be specific. Not "everyone" or "small businesses" - get granular.',
    example: 'Freelance consultants, yoga instructors, personal trainers, and service providers who see 5-20 clients per week and want to build their online reputation.',
    checkpoint: 'Could you find 10 of these people and ask them about this problem?',
    inputType: 'textarea',
    placeholder: 'Who has this problem?'
  },
  {
    id: 'product_description',
    title: 'Write Your Product Description',
    duration: '5 minutes',
    instruction: 'One clear paragraph that describes your solution.',
    example: 'ReviewFlow is a simple tool that automatically sends personalized review requests via SMS or email after each client interaction. It tracks responses, sends gentle reminders, and aggregates all reviews in one dashboard. Service providers can customize the message template and set the timing. The goal is to make collecting 5-star reviews as effortless as scheduling an appointment.',
    checkpoint: 'Does this clearly explain what it is and what it does?',
    inputType: 'textarea',
    placeholder: 'What are you building?'
  },
  {
    id: 'features',
    title: 'List Your Core Features',
    duration: '10 minutes',
    instruction: 'Focus on MVP. What\'s absolutely necessary for this to work? List 3-5 features with a name and what it does.',
    example: '1. Automated Review Requests - Send request after service is marked complete\n2. Client Database - Store client contact info, track review status\n3. Review Collection Page - Simple landing page with star rating + text feedback\n4. Dashboard - See all reviews, filter by rating/date, track response rate',
    checkpoint: 'Could you build a working version with just these features?',
    inputType: 'features',
    placeholder: 'Feature name...'
  },
  {
    id: 'user_flow',
    title: 'Define Your User Flow',
    duration: '5 minutes',
    instruction: 'Map out the main path a user takes through your app. 5-8 steps.',
    example: '1. Service provider logs in\n2. Adds a new client to database\n3. Marks service as "complete"\n4. System automatically sends review request\n5. Client clicks link in email\n6. Client sees simple review form\n7. Client submits review\n8. Service provider sees new review in dashboard',
    checkpoint: 'Is each step clear and specific?',
    inputType: 'steps',
    placeholder: 'Step...'
  },
  {
    id: 'design',
    title: 'Design Preferences',
    duration: '3 minutes',
    instruction: 'Give Claude Code some visual direction.',
    inputType: 'design',
    fields: {
      primaryColor: { label: 'Primary color', placeholder: 'e.g. warm orange, professional navy blue' },
      secondaryColor: { label: 'Secondary color', placeholder: 'e.g. light gray, mint green' },
      accentColor: { label: 'Accent color', placeholder: 'e.g. gold for highlights' },
      style: {
        label: 'Style / Vibe',
        options: ['Minimal and clean', 'Bold and modern', 'Warm and friendly', 'Professional and corporate', 'Playful and colorful', 'Dark mode / tech aesthetic']
      },
      font: {
        label: 'Font style',
        options: ['Sans-serif (clean, modern)', 'Serif (classic, formal)', 'Rounded (friendly, approachable)']
      },
      reference: { label: 'Reference app/website you like (optional)', placeholder: 'e.g. Notion, Linear, Stripe...' }
    }
  },
  {
    id: 'out_of_scope',
    title: 'What You\'re NOT Building',
    duration: '2 minutes',
    instruction: 'It\'s just as important to define what\'s OUT of scope for your MVP. This keeps you focused on shipping.',
    example: '- Mobile apps (web-only for now)\n- Payment processing\n- Multi-language support\n- Advanced analytics\n- Team accounts',
    checkpoint: 'Have you cut enough features to build this in one session?',
    inputType: 'list',
    placeholder: 'Not building...'
  }
]

// ─── Challenge 1: First Magic ──────────────────────────────────────────────

const CHALLENGE_1 = {
  number: 1,
  emoji: '✨',
  title: 'First Magic',
  duration: '20 min',
  objective: 'Experience the magic of AI-assisted building. Paste your pre-work into Claude and watch it transform your idea into a visual, clickable prototype you can interact with.',
  learning_outcomes: [
    'Experience the "magic moment" of seeing your idea come to life',
    'Use Claude to create a visual prototype artifact',
    'Choose a design style that matches your vision'
  ],
  lego_parallel: {
    title: 'Seeing the Picture on the Box',
    description: 'Before you build a LEGO set, you look at the picture on the box to see what you\'re creating. That\'s what we\'re doing here - turning your idea into a visual preview so you can see exactly what you\'re about to build.'
  },
  tools: [
    { name: 'Claude (claude.ai)', description: 'For generating your visual prototype artifact' }
  ],
  outcomes: [
    'Visual prototype of your app you can interact with',
    'Design style chosen for your product',
    'Style guide created for consistent look and feel'
  ],
  steps: [
    {
      step: 1, duration: '2 mins', title: 'Give Claude Your Pre-work Context',
      content: 'First, let\'s give Claude all the thinking you did in pre-work. This context helps Claude generate an accurate spec sheet.',
      substeps: [{
        id: '1a', title: 'Open Claude and paste your pre-work',
        items: [
          'Go to **claude.ai** and start a new conversation',
          'Go to your **Pre-work Results** page (Dashboard \u2192 Pre-work \u2192 View Results)',
          'Click **"Copy Pre-work Summary for Claude"**',
          'Paste it into Claude and press Enter'
        ],
        follow_up: 'Claude now has all the context about your product idea, target user, pain points, and user flow.'
      }]
    },
    {
      step: 2, duration: '5 mins', title: 'Review Your Prototype Walkthrough',
      content: 'Before we generate the full spec sheet, let\'s make sure Claude understood your vision correctly.',
      prompt: {
        instruction: 'Copy and paste this into Claude:',
        content: `Based on the pre-work information I just shared, create a VISUAL WEBAPP MOCKUP artifact showing what my product screens would look like.

IMPORTANT: Open the artifact panel on the right side and create an interactive React component that renders visual mockups of my app screens \u2014 NOT a text description or diagram. Show actual UI elements like buttons, forms, cards, navigation, etc.

Create a tabbed or scrollable view showing each screen:

\ud83d\udda5\ufe0f **Screen 1: [Name]**
- Visual mockup of this screen with placeholder UI
- Show the key elements the user would see

\ud83d\udda5\ufe0f **Screen 2: [Name]**
- Visual mockup
- Key elements

[Continue for each step in my user flow...]

Use my product name (or suggest one), and highlight the "Magic Moment" screen where users get the core value.

This should look like actual app screens, not a flowchart or text document.`
      },
      substeps: [
        {
          id: '2a', title: 'Review the walkthrough',
          content: 'Look at the artifact Claude created. Does it match what you have in mind?',
          items: [
            'Is the app name right? (Or do you prefer something else?)',
            'Does each screen show what you imagined?',
            'Is the user flow in the right order?',
            'Does the "magic moment" capture where users get value?'
          ]
        },
        {
          id: '2b', title: 'Make corrections if needed',
          content: 'If anything is off, tell Claude:',
          prompt: {
            instruction: 'Example corrections:',
            content: `A few corrections:
- The app name should be [your preferred name]
- Screen 2 should actually show [describe]
- The magic moment is really when [describe]

Please update the walkthrough.`
          },
          follow_up: 'Once the walkthrough looks right, you\'re ready to choose your design style.'
        }
      ]
    },
    {
      step: 3, duration: '8 mins', title: 'Choose Your Design Style',
      content: 'Now let\'s pick the look and feel of your app.',
      prompt: {
        instruction: 'Copy and paste this into Claude:',
        content: `Can you give me three different mockups of possible styles for this app? For each style, create a visual artifact showing:

**Style 1: [Name the style]**
- Color palette (primary, secondary, accent colors)
- Typography vibe (modern, playful, professional, etc.)
- Overall feel (minimal, bold, friendly, etc.)
- Example of how one screen would look

**Style 2: [Name the style]**
- Color palette
- Typography vibe
- Overall feel
- Example of how one screen would look

**Style 3: [Name the style]**
- Color palette
- Typography vibe
- Overall feel
- Example of how one screen would look

Make each style feel distinctly different so I have real options to choose from.`
      },
      substeps: [
        {
          id: '3a', title: 'Review the three styles',
          content: 'Look at each style option. Which one feels right for your product and target user?',
          items: [
            'Which style matches the mood of your product?',
            'Which would appeal most to your target user?',
            'Which one excites you to build?'
          ]
        },
        {
          id: '3b', title: 'Tell Claude your choice',
          content: 'Once you\'ve decided, tell Claude which style you prefer. You can also mix and match!',
          prompt: {
            instruction: 'Examples:',
            content: `I like Style 2. Let's go with that design direction.

OR

I like the colors from Style 1, but I prefer the typography and overall feel from Style 3. Can you combine those?`
          }
        },
        {
          id: '3c', title: 'Create your style guide',
          content: 'Now ask Claude to turn your choice into a complete style guide.',
          prompt: {
            instruction: 'Copy and paste this into Claude:',
            content: `Based on the style I chose, create a complete Style Guide as an artifact. Include:

\ud83c\udfa8 **Core Colors** \u2014 Primary, secondary, and accent colors with hex codes and when to use each

\ud83c\udf08 **Gradients** \u2014 Gradient recipes for buttons, banners, and backgrounds (if applicable)

\u270f\ufe0f **Typography** \u2014 Font family with exact sizes/weights for headings, body text, and captions

\ud83e\uddf1 **Components** \u2014 Visual examples of buttons, avatars, badges, inputs, cards, and nav bar

\ud83d\udcd0 **Spacing & Radius** \u2014 Consistent spacing scale and border-radius values

\ud83d\udcab **Shadows** \u2014 Shadow styles that make cards and elements feel lifted

\u26a1 **Tailwind Reference** \u2014 Ready-to-copy utility classes (in case we use Tailwind)

\ud83d\udcad **Design Mood** \u2014 3-4 words describing the feeling we're going for

Make this a reference I can use throughout the build.`
          },
          follow_up: 'Save this style guide \u2014 you\'ll reference it when building.'
        }
      ]
    }
  ],
  checkboxes: [
    { id: 'c1-1', label: 'Copied pre-work summary from Results page' },
    { id: 'c1-2', label: 'Pasted pre-work into Claude' },
    { id: 'c1-3', label: 'Reviewed prototype walkthrough artifact' },
    { id: 'c1-4', label: 'Made corrections (if needed)' },
    { id: 'c1-5', label: 'Reviewed three design style options' },
    { id: 'c1-6', label: 'Chose my design style' },
    { id: 'c1-7', label: 'Created style guide artifact' }
  ]
}

// ─── Challenge 2: Foundation Build ─────────────────────────────────────────

const CHALLENGE_2 = {
  number: 2,
  emoji: '\ud83c\udfd7\ufe0f',
  title: 'Foundation Build',
  duration: '75 min',
  objective: 'Finalize your spec sheet and build the foundation of your app. By the end, you\'ll have a real codebase connected to a real database, running locally in your browser.',
  learning_outcomes: [
    'Create a complete, buildable spec sheet from your prototype',
    'Learn how to give Claude Code a complete spec and let it scaffold a project',
    'Understand project structure basics (what files go where)',
    'Connect your app to Supabase (your database)'
  ],
  lego_parallel: {
    title: 'From Blueprint to Foundation',
    description: 'You\'ve seen the picture on the box. Now it\'s time to create the detailed instruction manual and lay down the baseplate. First we\'ll finalize the specs, then we\'ll place the first bricks and build the outer walls.'
  },
  tools: [
    { name: 'Claude (claude.ai)', description: 'For finalizing your spec sheet' },
    { name: 'Claude Code', description: 'The builder' },
    { name: 'Terminal', description: 'Your communication line' },
    { name: 'Supabase', description: 'Your storage chest (database)' }
  ],
  outcomes: [
    'Complete spec sheet (product + technical)',
    'Project scaffolded with correct file structure',
    'Supabase project created and connected',
    'Database tables created matching your spec',
    'App runs locally (you can see it in your browser)'
  ],
  steps: [
    {
      step: 1, duration: '10 mins', title: 'Generate Your Spec Sheet',
      content: 'Let\'s turn your prototype and style guide into a structured spec sheet that Claude Code can build from.',
      prompt: {
        instruction: 'Copy and paste this into Claude:',
        content: `Great, now generate a complete Spec Sheet using this exact format. Include the design style I chose. Create it as an artifact:

---

# [App Name] - Spec Sheet

## Layer 1: Product Spec

### Problem It Solves
[1-2 sentences]

### Users
[Who specifically]

### Success Metric
[The ONE thing users should be able to do]

### Core Prompt
[If using AI: the prompt with {{variables}}. If no AI: write "N/A"]

### UI & Flow
Step 1: [What user does first]
Step 2: [What happens next]
Step 3: [Next step]
Step 4: [Next step]
Step 5: [Final outcome]

### Design Style
[Include the style I chose: colors, typography, overall feel]

### Test Data Example
[A specific example I can use to test if it works]

---

## Layer 2: Technical Spec

### Data Model
| Table | Columns |
|-------|--------|
| [table name] | [list columns] |

### Pages/Routes
| Page | What's on it |
|------|-------------|
| / | [describe] |
| /[page] | [describe] |

### Auth Requirements
[Does it need login? Who can access what?]

### Integrations
| Service | What for | API key needed? |
|---------|----------|----------------|
| [service] | [purpose] | [yes/no] |

### Environment Variables
[List the secret keys needed]

---

Keep it concise. Only include what's essential for a working prototype.`
      }
    },
    {
      step: 2, duration: '10 mins', title: 'Run the "Claude Code Ready" Check',
      content: 'Before you feed this to Claude Code, let\'s check for gaps that cause build errors.',
      prompt: {
        instruction: 'Copy and paste this into Claude:',
        content: `Review the spec sheet you just created and check for these 5 common issues:

**Check 1: Data \u2194 UI Match**
Does every table in the Data Model get created or displayed somewhere in the UI Flow? Flag any orphaned tables or missing data.

**Check 2: Pages Are Specific**
Could a developer build each page from the description alone? Flag any vague pages like "user dashboard" that don't explain what's actually on the screen.

**Check 3: Auth Makes Sense**
If the UI Flow mentions "user" doing things, do the Auth Requirements explain how they log in? Flag any conflicts.

**Check 4: Variables Exist**
If there's a Core Prompt with {{variables}}, does each variable exist as a field the user enters in the UI? Flag any missing variables.

**Check 5: Test Data Fits**
Could someone actually enter the Test Data Example using the UI Flow described? Walk through it step by step and flag any gaps.

For each check, tell me:
- \u2705 Pass - if it's good
- \u26a0\ufe0f Issue - describe what's wrong and suggest a fix

Then give me an updated spec sheet artifact with all issues fixed.`
      }
    },
    {
      step: 3, duration: '5 mins', title: 'Review the Updated Spec',
      content: 'Claude has flagged issues and updated your spec sheet artifact. Now make sure it got things right.',
      substeps: [{
        id: '3a', title: 'Check it matches your vision',
        items: [
          'Does this match my vision? Sometimes Claude "fixes" things by changing your idea.',
          'Did anything important get removed?',
          'Does anything feel off? Trust your gut. If something reads weird, it\'ll build weird.'
        ]
      }],
      prompt: {
        instruction: 'If you spot anything wrong, tell Claude:',
        content: `A few changes:
- [What needs to change]
- [What needs to change]

Update the spec sheet with these changes.`
      }
    },
    {
      step: 4, duration: '3 mins', title: 'Save Your Spec Sheet',
      content: 'Download your spec sheet so you can give it to Claude Code.',
      substeps: [{
        id: '4a', title: 'Download the artifact',
        items: [
          'Click the **download icon** on the Claude artifact',
          'Save it somewhere you can find it (like your Desktop or Documents)',
          'Name it something like `spec-sheet.md`'
        ]
      }]
    },
    {
      step: 5, duration: '3 mins', title: 'Create Your Project Folder',
      content: 'Let\'s create a home for your project.',
      substeps: [
        {
          id: '5a', title: 'Open your Terminal',
          content: 'First, let\'s open the command line:',
          info_box: {
            title: 'What is Terminal?',
            content: 'Terminal (or Command Prompt on Windows) is where you\'ll talk to Claude Code. Think of it as a direct text-based conversation with your computer.'
          }
        },
        {
          id: '5b', title: 'Create and enter the folder',
          content: 'Type this command and press Enter:',
          prompt: { instruction: 'Run in Terminal:', content: 'mkdir my-app && cd my-app' },
          info_box: {
            title: 'What just happened?',
            content: 'You created a new folder called \'my-app\' and moved into it. Think of this as laying down the baseplate for your LEGO castle.'
          }
        },
        {
          id: '5c', title: 'Move your spec sheet here',
          content: 'Move the spec-sheet.md file you downloaded into this folder.',
          items: [
            'Find your **my-app** folder (it\'s in your home directory)',
            'Move or copy your **spec-sheet.md** file into it'
          ]
        }
      ]
    },
    {
      step: 6, duration: '5 mins', title: 'Gather Your Credentials',
      content: 'Before we build, let\'s gather all the API keys and credentials your app needs.',
      substeps: [
        {
          id: '6a', title: 'Check what API keys you need',
          items: [
            'Review your spec sheet\'s **Integrations** and **Environment Variables** sections',
            'You\'ll definitely need your **Supabase credentials** (Project URL and anon key)',
            'For any other services listed, get the API key from that service\'s dashboard'
          ],
          info_box: {
            title: 'Not sure what keys you need?',
            content: 'Ask Claude: "Based on my spec sheet, what API keys do I need to add to my .env file?" Claude will tell you exactly what\'s needed.'
          }
        },
        {
          id: '6b', title: 'Create your .env file',
          prompt: {
            instruction: 'Copy and paste this into Claude, replacing placeholders with your actual credentials:',
            content: `Create a .env file for my project with these Supabase credentials:

Project URL: [paste your Project URL here]
Anon Key: [paste your anon key here]

[Add any other API keys you identified]

Format it correctly for a Vite + React project and create it as a downloadable artifact.`
          }
        }
      ]
    },
    {
      step: 7, duration: '3 mins', title: 'Download the Architecture Template',
      content: 'Before Claude Code starts building, let\'s set up a template that guides it to build clean, maintainable code.',
      substeps: [
        {
          id: '7a', title: 'Download the starter template',
          items: [
            'Download the **Architecture Template** (19KB zip file)',
            'Find the downloaded `react-starter-template.zip` in your Downloads folder',
            'Double-click to unzip it'
          ],
          info_box: {
            title: 'What\'s in this template?',
            content: 'The template includes:\n- **CLAUDE.md** - Architecture rules Claude Code reads automatically\n- **.claude/** folder - Hooks that enforce code quality\n- **src/** folder - Pre-built structure with shared components'
          }
        },
        {
          id: '7b', title: 'Copy the template files to your project folder',
          items: [
            'Open the unzipped `react-starter-template` folder',
            'Select **all the files** inside',
            'Copy and paste into your **my-app** folder'
          ]
        }
      ]
    },
    {
      step: 8, duration: '10 mins', title: 'Feed Your Spec to Claude Code',
      content: 'Time for the magic. Let\'s give Claude Code your blueprint and watch it build.',
      substeps: [
        {
          id: '8a', title: 'Launch Claude Code',
          content: 'In Terminal (which should be in your my-app folder), type:',
          prompt: { instruction: 'Run in Terminal:', content: 'claude' }
        },
        {
          id: '8b', title: 'Give Claude Code your spec',
          prompt: {
            instruction: 'Copy, paste, and edit this prompt:',
            content: `I want to build a web application. Here's my complete spec:

[PASTE YOUR ENTIRE SPEC SHEET HERE]

Build a complete working first version of this app. I already have a CLAUDE.md file and src/ folder structure in place - please follow those architecture guidelines.

Include:
1. Use the existing src/ folder structure (components/ui, features, hooks, lib, services)
2. Build on top of the shared components already there (Button, Card, Input, Modal)
3. All pages and routes from my spec
4. Core functionality working end-to-end
5. Supabase connection (I'll give you credentials next)

IMPORTANT - Supabase setup requirements:
- DISABLE Row Level Security (RLS) for MVP - we'll add security policies later
- DO NOT create self-referential RLS policies (causes infinite recursion)
- Wrap all Supabase SDK calls with timeouts (10s) to prevent hanging
- Surface all errors to the UI - never fail silently
- Create a /debug page to verify database connectivity before building features

Give me a rough working version I can test and refine. Don't worry about making it perfect - we'll iterate.`
          }
        }
      ]
    },
    {
      step: 9, duration: '15 mins', title: 'Connect Supabase',
      content: 'Now let\'s connect your database.',
      substeps: [
        {
          id: '9a', title: 'Connect your .env file',
          prompt: {
            instruction: 'Type this in Claude Code:',
            content: `I have a .env file in my project folder with my Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).

Please:
1. Set up the Supabase client to use these environment variables
2. Generate the SQL I need to create all the database tables from my spec`
          }
        },
        {
          id: '9b', title: 'Create tables in Supabase',
          content: 'Claude Code will generate SQL for your tables. Now create them in Supabase:',
          items: [
            'Go to your Supabase dashboard',
            'Click **"SQL Editor"** in the sidebar',
            'Click **"New query"**',
            'Copy the SQL that Claude Code generated',
            'Paste it into the SQL Editor',
            'Click **"Run"**'
          ]
        },
        {
          id: '9c', title: 'Complete any follow-up tasks',
          content: 'Claude Code may have given you additional tasks. Look for any instructions it provided:',
          items: [
            'Additional SQL queries to run',
            'Configuration steps in Supabase (like enabling auth providers)',
            'Files to create or move',
            'Settings to change'
          ],
          info_box: {
            title: 'Don\'t skip this!',
            content: 'If Claude Code told you to do something, do it now. Skipping these tasks is a common reason apps don\'t work on the first try.'
          }
        }
      ]
    },
    {
      step: 10, duration: '10 mins', title: 'Run Your App',
      content: 'Let\'s see your foundation in the browser.',
      substeps: [
        {
          id: '10a', title: 'Tell Claude Code to start the app',
          prompt: {
            instruction: 'Type this in Claude Code:',
            content: 'Install the dependencies and run the app locally so I can see it in my browser'
          }
        },
        {
          id: '10b', title: 'Open in browser',
          content: 'Once Claude Code shows the localhost URL:',
          items: [
            'Copy the URL (e.g., `http://localhost:5173/`)',
            'Open your browser',
            'Paste the URL and press Enter'
          ]
        }
      ]
    },
    {
      step: 11, duration: '5 mins', title: 'Checkpoint',
      content: 'Before moving on, verify everything is connected.',
      substeps: [
        {
          id: '11a', title: 'Test the Supabase connection',
          prompt: {
            instruction: 'Type this in Claude Code:',
            content: 'Create a simple test: when the app loads, fetch all rows from one of my database tables and console.log the result. I want to verify Supabase is connected properly.'
          }
        },
        {
          id: '11b', title: 'Check the console',
          content: 'Open Developer Tools to see if it worked:',
          info_box: {
            title: 'Open the Console',
            content: 'Press Cmd + Option + J (Mac) or Ctrl + Shift + J (Windows) in Chrome.'
          }
        }
      ]
    }
  ],
  checkboxes: [
    { id: 'c2-1', label: 'Generated spec sheet using the template prompt' },
    { id: 'c2-2', label: 'Ran the "Claude Code Ready" check prompt' },
    { id: 'c2-3', label: 'Reviewed Claude\'s fixes in the artifact' },
    { id: 'c2-4', label: 'Confirmed spec matches my vision' },
    { id: 'c2-5', label: 'Spec sheet downloaded and saved' },
    { id: 'c2-6', label: 'Project folder created (my-app)' },
    { id: 'c2-7', label: 'Spec sheet moved to project folder' },
    { id: 'c2-8', label: 'Checked for API keys needed' },
    { id: 'c2-9', label: '.env file created and saved to project folder' },
    { id: 'c2-10', label: 'Architecture template downloaded and unzipped' },
    { id: 'c2-11', label: 'Template files copied to project folder' },
    { id: 'c2-12', label: 'CLAUDE.md visible in project folder' },
    { id: 'c2-13', label: 'Claude Code launched in project folder' },
    { id: 'c2-14', label: 'Spec sheet fed to Claude Code' },
    { id: 'c2-15', label: 'Project scaffolded (can see new files)' },
    { id: 'c2-16', label: 'SQL generated by Claude Code' },
    { id: 'c2-17', label: 'SQL pasted and run in Supabase SQL Editor' },
    { id: 'c2-18', label: 'Tables visible in Supabase Table Editor' },
    { id: 'c2-19', label: 'Completed all follow-up tasks from Claude Code' },
    { id: 'c2-20', label: 'App running locally' },
    { id: 'c2-21', label: 'App visible in browser' },
    { id: 'c2-22', label: 'Supabase connection verified in console' }
  ]
}

// ─── Challenge 3: Test, Debug & Refine ─────────────────────────────────────

const CHALLENGE_3 = {
  number: 3,
  emoji: '\ud83d\udee0',
  title: 'Test, Debug & Refine',
  duration: '60 min',
  objective: 'Test your rough working version, identify what\'s broken or not quite right, and work with Claude Code to fix it. By the end, your core feature will work properly end-to-end.',
  learning_outcomes: [
    'Learn a structured approach to testing your app',
    'Understand how to read error messages and use the console',
    'Practice the test \u2192 identify \u2192 fix loop with Claude Code',
    'Build confidence in debugging (it\'s not scary!)'
  ],
  lego_parallel: {
    title: 'Quality Inspection',
    description: 'You\'ve built your castle quickly. Now you walk through each room, checking if the doors open, if the drawbridge works, if the stairs connect properly. Some things won\'t be quite right. That\'s normal. You identify what needs fixing, and adjust brick by brick.'
  },
  tools: [
    { name: 'Claude Code', description: 'The builder (and fixer)' },
    { name: 'Browser Console', description: 'Your error detective' },
    { name: 'Supabase Table Editor', description: 'Check if data is saving correctly' },
    { name: 'Your spec sheet', description: 'The reference for how it should work' }
  ],
  outcomes: [
    'Core user flow working end-to-end',
    'All major bugs fixed',
    'Data saving to and loading from Supabase correctly',
    'App ready for final polish'
  ],
  steps: [
    {
      step: 1, duration: '5 mins', title: 'Set Up Your Testing Mindset',
      content: 'Before we start clicking around, let\'s get organized. Debugging isn\'t about randomly trying things.',
      substeps: [
        {
          id: '1a', title: 'Open everything you need',
          items: [
            'Your app in the browser',
            'Claude Code in Terminal',
            'Supabase dashboard (Table Editor tab)',
            'Your spec sheet for reference'
          ]
        },
        {
          id: '1b', title: 'Open the Browser Console',
          content: 'This is your error detective. Keep it open the entire time.',
          info_box: {
            title: 'What is the Console?',
            content: 'The Console shows you what\'s happening behind the scenes. When something breaks, it usually tells you why here. Red text = error. Yellow text = warning. White text = normal logs.'
          }
        },
        {
          id: '1c', title: 'The debugging mantra',
          info_box: {
            title: 'The Debugging Loop',
            content: '1. Test one thing\n2. Did it work? \u2192 Move to next thing\n3. Did it break? \u2192 Check console \u2192 Tell Claude Code \u2192 Fix \u2192 Retest'
          }
        }
      ]
    },
    {
      step: 2, duration: '15 mins', title: 'Test the User Flow',
      content: 'Walk through your app exactly like a user would. Test each step of your spec\'s UI Flow.',
      substeps: [
        {
          id: '2a', title: 'Get your UI Flow ready',
          content: 'Open your spec sheet and find the UI & Flow section. You\'ll test each step one by one.'
        },
        {
          id: '2b', title: 'Test each step',
          content: 'For each step in your user flow:',
          items: [
            'Does the page/screen look right?',
            'Can you interact with it (click buttons, type in fields)?',
            'Check the console - any red errors?'
          ],
          info_box: {
            title: 'How to report issues to Claude Code',
            content: 'Be specific! Instead of "it\'s broken", say:\n\n"When I click the Submit button, nothing happens. The console shows this error: [paste error]"\n\nor\n\n"The input field appears but I can\'t type in it."'
          }
        },
        {
          id: '2d', title: 'Check if data is saving',
          content: 'After going through the flow, check Supabase:',
          items: [
            'Go to your Supabase dashboard',
            'Click **Table Editor** in the sidebar',
            'Click on each table from your spec',
            'Is there data? Does it look correct?'
          ]
        }
      ]
    },
    {
      step: 3, duration: '25 mins', title: 'Fix What\'s Broken',
      content: 'Now let\'s fix the issues you found. We\'ll tackle them one at a time.',
      substeps: [
        {
          id: '3a', title: 'Prioritize your bugs',
          content: 'Not all bugs are equal. Fix in this order:',
          items: [
            '**1. Crashes/errors** (red console errors, page won\'t load)',
            '**2. Core flow blockers** (can\'t complete the main action)',
            '**3. Data issues** (not saving, not loading)',
            '**4. Visual issues** (looks wrong but works)'
          ]
        },
        {
          id: '3b', title: 'The Bug Report Prompt',
          content: 'For each bug, tell Claude Code using this format:',
          prompt: {
            instruction: 'Copy and customize this template:',
            content: `I found a bug:

**What I did:** [exact steps you took]

**What I expected:** [what should have happened]

**What actually happened:** [what went wrong]

**Console error (if any):** [paste the red error text]

Please fix this.`
          }
        },
        {
          id: '3c', title: 'Fix \u2192 Test \u2192 Repeat',
          content: 'After Claude Code makes a fix:',
          items: [
            'Refresh your browser',
            'Test the specific thing that was broken',
            'Did it work? \u2192 Move to next bug',
            'Still broken? \u2192 Tell Claude Code what\'s still wrong'
          ],
          info_box: {
            title: 'Stuck on the same bug?',
            content: 'If you\'ve tried 2-3 fixes and it\'s still broken, try:\n\n"This bug keeps happening. Can you explain what\'s causing it and try a completely different approach to fix it?"'
          }
        }
      ]
    },
    {
      step: 4, duration: '10 mins', title: 'Verify with Test Data',
      content: 'Your spec has a Test Data Example. Let\'s use it to verify everything works.',
      substeps: [
        {
          id: '4a', title: 'Run your test data through',
          content: 'Find the Test Data Example in your spec. Enter this exact data into your app.',
          items: [
            'Clear any previous test data from Supabase (optional)',
            'Go through your full flow using the test data',
            'Complete the entire flow from start to finish'
          ]
        },
        {
          id: '4b', title: 'Compare the result',
          items: [
            '**Expected output:** [what your spec says]',
            '**Actual output:** [what your app produced]'
          ]
        },
        {
          id: '4c', title: 'Fix any final discrepancies',
          prompt: {
            instruction: 'Customize and send this:',
            content: `I tested with this input: [YOUR TEST DATA]

I expected this output: [WHAT YOUR SPEC SAYS]

But I got this instead: [WHAT ACTUALLY HAPPENED]

Please fix this so the output matches what I expected.`
          }
        }
      ]
    },
    {
      step: 5, duration: '5 mins', title: 'Final Walkthrough',
      content: 'One last check before we move on.',
      substeps: [
        {
          id: '5a', title: 'Fresh browser test',
          items: [
            'Close your browser tab completely',
            'Open a fresh tab',
            'Go to your localhost URL',
            'Go through the entire flow one more time'
          ]
        },
        {
          id: '5b', title: 'Console check',
          content: 'With the console open, go through your flow. You should see:',
          items: [
            '**No red errors** (warnings are okay)',
            '**Data flowing** (you might see logs of data being saved/loaded)',
            '**Clean completion** of the full flow'
          ]
        }
      ]
    }
  ],
  checkboxes: [
    { id: 'c3-1', label: 'Browser console open and visible' },
    { id: 'c3-2', label: 'Supabase Table Editor open' },
    { id: 'c3-3', label: 'Tested Step 1 of UI Flow' },
    { id: 'c3-4', label: 'Tested Step 2 of UI Flow' },
    { id: 'c3-5', label: 'Tested Step 3 of UI Flow' },
    { id: 'c3-6', label: 'Tested Step 4 of UI Flow' },
    { id: 'c3-7', label: 'Tested Step 5 of UI Flow' },
    { id: 'c3-8', label: 'Verified data appears in Supabase' },
    { id: 'c3-9', label: 'Fixed all crash/error bugs' },
    { id: 'c3-10', label: 'Fixed all core flow blockers' },
    { id: 'c3-11', label: 'Fixed all data issues' },
    { id: 'c3-12', label: 'Ran test data through the app' },
    { id: 'c3-13', label: 'Output matches expected result' },
    { id: 'c3-14', label: 'Fresh browser test passed' },
    { id: 'c3-15', label: 'No red console errors' },
    { id: 'c3-16', label: 'Core feature works end-to-end' }
  ]
}

// ─── Challenge 4: Polish & Deploy ──────────────────────────────────────────

const CHALLENGE_4 = {
  number: 4,
  emoji: '\ud83d\ude80',
  title: 'Polish & Deploy',
  duration: '45 min',
  objective: 'Make your app look good on all devices, push it to GitHub, and deploy it to Vercel. By the end, you\'ll have a live URL you can share with anyone in the world.',
  learning_outcomes: [
    'Learn to test and fix mobile responsiveness',
    'Understand the GitHub \u2192 Vercel deployment flow',
    'Experience the thrill of shipping something live'
  ],
  lego_parallel: {
    title: 'The Grand Reveal',
    description: 'Your castle is built and functional. Now you\'re adding the finishing touches, smoothing rough edges, and moving it from your building table to the display shelf where everyone can admire it.'
  },
  tools: [
    { name: 'Claude Code', description: 'For polish fixes' },
    { name: 'Chrome DevTools', description: 'For mobile testing' },
    { name: 'GitHub', description: 'Your castle blueprints archive' },
    { name: 'Vercel', description: 'Your display shelf (hosting)' }
  ],
  outcomes: [
    'App looks good on mobile and desktop',
    'Code pushed to GitHub repository',
    'App deployed and live on Vercel',
    'Shareable URL in hand'
  ],
  steps: [
    {
      step: 1, duration: '10 mins', title: 'Mobile Responsiveness Check',
      content: 'Most people will view your app on their phones. Let\'s make sure it looks good there.',
      substeps: [
        {
          id: '1a', title: 'Open mobile view in Chrome',
          items: [
            'Make sure your app is open in Chrome',
            'Open DevTools: `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows)',
            'Click the **device toggle icon** (looks like a phone and tablet) in the top-left of DevTools'
          ]
        },
        {
          id: '1b', title: 'Test at different sizes',
          content: 'Test these device sizes:',
          items: [
            '**iPhone SE** (small phone)',
            '**iPhone 14 Pro** (medium phone)',
            '**iPad** (tablet)'
          ]
        },
        {
          id: '1c', title: 'Fix mobile issues',
          prompt: {
            instruction: 'Customize this for each issue:',
            content: `On mobile view, [describe the problem].

For example: "the buttons are too small to tap" or "the form fields overlap each other" or "there's horizontal scrolling on the homepage"

Please fix this so it looks good on mobile.`
          }
        }
      ]
    },
    {
      step: 2, duration: '10 mins', title: 'Quick Visual Polish',
      content: 'Let\'s clean up anything that looks rough.',
      substeps: [
        {
          id: '2a', title: 'Review with fresh eyes',
          content: 'Switch back to desktop view and ask:',
          items: [
            'Is the spacing consistent?',
            'Are the colors working well together?',
            'Is the text easy to read?',
            'Does it look professional or thrown together?'
          ]
        },
        {
          id: '2b', title: 'Request polish from Claude Code',
          content: 'Pick 2-3 things that bother you most:',
          prompt: {
            instruction: 'Customize with your specific improvements:',
            content: `Please polish the UI:
1. [First thing to improve]
2. [Second thing to improve]
3. [Third thing to improve]

Keep the same layout, just make it look more polished and professional.`
          }
        }
      ]
    },
    {
      step: 3, duration: '10 mins', title: 'Push to GitHub',
      content: 'Time to save your castle blueprints to the cloud.',
      substeps: [
        {
          id: '3a', title: 'Create a GitHub repository',
          items: [
            'Go to **github.com** and log in',
            'Click the **+** icon in the top right',
            'Select **"New repository"**',
            'Enter a repository name (match your project name)',
            'Keep it **Public** (or Private if you prefer)',
            '**Don\'t** check "Add a README file" (we already have files)',
            'Click **"Create repository"**'
          ]
        },
        {
          id: '3b', title: 'Ask Claude Code to push to GitHub',
          prompt: {
            instruction: 'Paste your repo URL into this prompt:',
            content: `I just created a GitHub repository. Here's the URL: [paste your repo URL]

Please:
1. Initialize git in this project
2. Add all files
3. Commit with the message "Initial commit - app ready for deployment"
4. Push to my GitHub repository

Walk me through any steps I need to do manually.`
          }
        },
        {
          id: '3c', title: 'Verify it worked',
          content: 'Refresh your GitHub repository page. You should see all your project files there.'
        }
      ]
    },
    {
      step: 4, duration: '10 mins', title: 'Deploy to Vercel',
      content: 'The final step. Putting your castle on display for the world.',
      substeps: [
        {
          id: '4a', title: 'Connect Vercel to GitHub',
          items: [
            'Go to **vercel.com** and log in',
            'Click **"Add New..."** \u2192 **"Project"**',
            'You\'ll see "Import Git Repository"',
            'Click **"Continue with GitHub"** if prompted',
            'Find your repository in the list and click **"Import"**'
          ]
        },
        {
          id: '4b', title: 'Configure the deployment',
          items: [
            '**Project Name:** Keep the default or rename it',
            '**Framework Preset:** Vercel usually auto-detects "Vite" - if not, select it',
            '**Root Directory:** Leave as `.` (default)'
          ]
        },
        {
          id: '4c', title: 'Add environment variables',
          content: 'Your app needs the Supabase credentials to work.',
          items: [
            'Expand **"Environment Variables"**',
            'Go to your **Supabase dashboard**',
            'Click **"Project Settings"** \u2192 **"General"** \u2192 copy **Project URL**',
            'Click **"API"** \u2192 copy **anon public key**',
            'Add each variable in Vercel'
          ],
          info_box: {
            title: 'Environment Variables to Add',
            content: 'VITE_SUPABASE_URL = [paste your Project URL]\nVITE_SUPABASE_ANON_KEY = [paste your anon key]\n\nAdd any other environment variables your app uses.'
          }
        },
        {
          id: '4e', title: 'Update Supabase Auth URLs for production',
          items: [
            'Go to your **Supabase dashboard**',
            'Click **Authentication** (left sidebar)',
            'Click **URL Configuration**',
            'In **Redirect URLs**, click **Add URL**',
            'Add your Vercel URL: `https://your-app-name.vercel.app/**`',
            'If you added a custom domain, add that URL too'
          ]
        },
        {
          id: '4f', title: 'Deploy!',
          content: 'Click **"Deploy"**. Watch Vercel build your app. This takes 1-2 minutes.'
        }
      ]
    },
    {
      step: 5, duration: '5 mins', title: 'Test Your Live App',
      content: 'Make sure everything works in production.',
      substeps: [
        { id: '5a', title: 'Test on desktop', content: 'Open your Vercel URL in a fresh browser tab. Go through your entire flow.' },
        { id: '5b', title: 'Test on your actual phone', content: 'Open the URL on your real phone. This is the true test of mobile responsiveness.' },
        { id: '5c', title: 'Share it!', content: 'Send the link to a friend or family member. Ask them to try it.' }
      ]
    }
  ],
  checkboxes: [
    { id: 'c4-1', label: 'Mobile view tested on small phone size' },
    { id: 'c4-2', label: 'Mobile view tested on medium phone size' },
    { id: 'c4-3', label: 'Mobile view tested on tablet size' },
    { id: 'c4-4', label: 'Mobile issues fixed' },
    { id: 'c4-5', label: 'Visual polish applied (2-3 improvements)' },
    { id: 'c4-6', label: 'GitHub repository created' },
    { id: 'c4-7', label: 'Code pushed to GitHub' },
    { id: 'c4-8', label: 'Vercel project created' },
    { id: 'c4-9', label: 'GitHub repo imported to Vercel' },
    { id: 'c4-10', label: 'Environment variables added in Vercel' },
    { id: 'c4-11', label: 'Supabase Auth URLs updated for Vercel' },
    { id: 'c4-12', label: 'Deployment successful' },
    { id: 'c4-13', label: 'Live URL works on desktop' },
    { id: 'c4-14', label: 'Live URL works on mobile' },
    { id: 'c4-15', label: 'Shared with at least one person' },
    { id: 'c4-16', label: 'Shipped a live product!' }
  ]
}

// ─── Challenge 5: Celebrate & Share ────────────────────────────────────────

const CHALLENGE_5 = {
  number: 5,
  emoji: '\ud83c\udf89',
  title: 'Celebrate & Share',
  duration: '10 min',
  objective: 'Reflect on what you\'ve built and share your experience.',
  is_feedback: true,
  learning_outcomes: [
    'Reflect on your hackathon journey',
    'Share your project with the world',
    'Help us make this experience even better'
  ],
  lego_parallel: {
    title: 'The Victory Lap',
    description: 'Your castle is complete and on display for the world to see. Now it\'s time to step back, admire what you\'ve built, and tell others about your creation.'
  },
  intro: {
    title: 'Congratulations, Builder!',
    content: 'You\'ve just gone from idea to live product in a single session. That\'s no small feat. Before you go, we\'d love to hear about your experience.'
  },
  feedback_questions: [
    { id: 'loved', type: 'textarea', label: 'What\'s one thing you loved and wouldn\'t change?', placeholder: 'Tell us what made this experience great...', required: true },
    { id: 'improve', type: 'textarea', label: 'What\'s one thing you\'d recommend to help us improve it next time?', placeholder: 'We\'re always looking to get better...', required: true },
    { id: 'testimonial', type: 'textarea', label: 'Testimonial', placeholder: 'Share a quote we can use to tell others about this experience...', required: false },
    { id: 'recommend', type: 'textarea', label: 'If you were to recommend this to a friend, what would you say?', placeholder: 'How would you describe this experience?', required: false },
    { id: 'project_url', type: 'url', label: 'What\'s your project URL?', placeholder: 'https://your-app.vercel.app', required: true },
    { id: 'feeling', type: 'textarea', label: 'How are you feeling after learning this and seeing what\'s possible?', placeholder: 'Share your thoughts and emotions...', required: true }
  ],
  checkboxes: [
    { id: 'c5-1', label: 'Shared what I loved about the experience' },
    { id: 'c5-2', label: 'Provided improvement suggestions' },
    { id: 'c5-3', label: 'Submitted my project URL' },
    { id: 'c5-4', label: 'Shared how I\'m feeling' },
    { id: 'c5-5', label: 'Completed the hackathon!' }
  ]
}

// ─── Exports ───────────────────────────────────────────────────────────────

export const APP_BUILD_CHALLENGES = [
  CHALLENGE_1,
  CHALLENGE_2,
  CHALLENGE_3,
  CHALLENGE_4,
  CHALLENGE_5
]

export function getChallenge(number) {
  return APP_BUILD_CHALLENGES.find(c => c.number === number) || null
}
