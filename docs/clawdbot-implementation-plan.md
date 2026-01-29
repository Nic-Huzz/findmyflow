# ClawdBot Integration - Implementation Plan

## Executive Summary

This document provides a step-by-step implementation plan for integrating ClawdBot with FindMyFlow. The integration enables automated quest reminders, message capture from WhatsApp/Instagram, market research automation, and CRM enrichment.

**Estimated Timeline:** 8-12 weeks (depending on ClawdBot learning curve)
**Prerequisites:** ClawdBot installed locally, Supabase access, API keys for research sources

---

## Implementation Support Breakdown

### What Claude Can Fully Implement (FindMyFlow Side)

| Component | Description | Status |
|-----------|-------------|--------|
| **Database Migrations** | All new tables: `clawdbot_user_settings`, `clawdbot_action_logs`, `message_captures`, `market_research_sources`, `market_research_findings` | Ready to write |
| **Supabase Edge Functions** | `clawdbot-reminder-webhook`, `clawdbot-message-capture`, `clawdbot-research-sync` | Ready to write |
| **React UI Components** | ClawdBot settings page, message review queue, research sources config, findings review queue | Ready to write |
| **Integration Services** | `src/lib/clawdbot/` with API helpers, webhook handlers, CRM integration | Ready to write |
| **CSS Styling** | Styles for all new components following existing patterns | Ready to write |
| **Documentation** | User setup guide, troubleshooting, privacy documentation | Ready to write |

### What Claude Can Write But You Deploy/Configure

| Component | What Claude Provides | What You Handle |
|-----------|---------------------|-----------------|
| **ClawdBot Plugin Code** | Full source code for `findmyflow-clawdbot-plugin` with all modules | Install in ClawdBot, configure credentials, test locally |
| **Reddit Scanner** | Working code using `snoowrap` library | Get Reddit API credentials (free) |
| **Twitter Scanner** | Working code using Twitter API v2 | Get Twitter API credentials (paid tiers) |
| **Workflow Definitions** | All workflow JSON/JS with triggers and actions | Test on your ClawdBot instance |
| **Message Templates** | All reminder and notification templates | Customize tone/branding as needed |

### What You Need To Handle

| Task | Reason |
|------|--------|
| **ClawdBot Installation & Setup** | Runs on your local machine, requires your system access |
| **WhatsApp Business API Account** | Requires business verification through Meta |
| **Instagram Graph API Setup** | Requires Facebook Developer account and app approval |
| **Reddit API Credentials** | Account-specific OAuth credentials (free to obtain) |
| **Twitter API Credentials** | Account-specific, paid tiers for higher limits |
| **Testing Full Integration** | Requires your ClawdBot instance + messaging apps connected |
| **User Consent Flows** | Legal/privacy decisions about data handling |

### Recommended Build Order

**Phase 1: Backend Foundation (Claude implements)**
1. Database migrations for all new tables
2. Supabase edge functions (webhook endpoints)
3. This gives you a working API that ClawdBot can call

**Phase 2: Frontend UI (Claude implements)**
1. ClawdBot settings component
2. Message review queue
3. Research sources configuration
4. Findings review queue
5. Integration with existing CRM pages

**Phase 3: ClawdBot Plugin (Claude writes, you deploy)**
1. Plugin skeleton with ClawdHub structure
2. Reminder module
3. Message capture module
4. Research scanner module
5. Workflow engine
6. You install and test on your machine

**Phase 4: Testing & Iteration**
1. You test the full flow end-to-end
2. Claude helps debug/fix issues as they arise
3. Iterate based on real usage

---

## Phase 0: Research & Setup (Week 1)

### 0.1 ClawdBot Deep Dive
- [ ] Install ClawdBot locally and complete setup
- [ ] Review ClawdBot documentation and plugin architecture
- [ ] Understand ClawdHub plugin development patterns
- [ ] Test basic messaging integrations (WhatsApp, Instagram)
- [ ] Identify ClawdBot's API/webhook capabilities

**Deliverable:** Technical feasibility notes, ClawdBot capabilities matrix

### 0.2 Platform API Research
| Platform | API/Method | Rate Limits | Auth Required |
|----------|-----------|-------------|---------------|
| WhatsApp | WhatsApp Business API / ClawdBot native | TBD | Yes |
| Instagram | Instagram Graph API / ClawdBot native | TBD | Yes |
| Reddit | Reddit API (PRAW) | 60 req/min | OAuth |
| Twitter/X | Twitter API v2 | Varies by tier | OAuth |
| Quora | Web scraping (no official API) | Respect robots.txt | No |

- [ ] Document API access requirements for each platform
- [ ] Estimate costs (Reddit API is free, Twitter has paid tiers)
- [ ] Identify ClawdBot's built-in platform support vs. custom needed

### 0.3 Development Environment
- [ ] Set up ClawdBot development environment
- [ ] Create `findmyflow-clawdbot-plugin` repository
- [ ] Configure environment variables for Supabase connection
- [ ] Set up local testing workflow

---

## Phase 1: Quest Reminders MVP (Weeks 2-3)

### 1.1 Database Schema Updates

```sql
-- Migration: 20260201000000_clawdbot_integration.sql

-- Store user's ClawdBot connection preferences
CREATE TABLE clawdbot_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  preferred_platform TEXT DEFAULT 'whatsapp', -- whatsapp, telegram, instagram
  platform_identifier TEXT, -- phone number or handle
  reminder_time TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'UTC',
  features_enabled JSONB DEFAULT '{"quest_reminders": true, "message_capture": false, "market_research": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Log all ClawdBot actions for debugging/audit
CREATE TABLE clawdbot_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'reminder_sent', 'message_captured', 'research_completed'
  action_data JSONB,
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user logs
CREATE INDEX idx_clawdbot_logs_user ON clawdbot_action_logs(user_id, created_at DESC);
```

### 1.2 Supabase Edge Function: Reminder Webhook

```
supabase/functions/clawdbot-reminder-webhook/
├── index.ts
└── types.ts
```

**Endpoint:** `POST /functions/v1/clawdbot-reminder-webhook`

```typescript
// supabase/functions/clawdbot-reminder-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Verify ClawdBot webhook signature
  const signature = req.headers.get('x-clawdbot-signature')
  if (!verifySignature(signature, await req.text())) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { action, userId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  switch (action) {
    case 'get_pending_quests':
      return await getPendingQuests(supabase, userId)
    case 'get_weekly_plan':
      return await getWeeklyPlan(supabase, userId)
    case 'get_streak_status':
      return await getStreakStatus(supabase, userId)
    default:
      return new Response('Unknown action', { status: 400 })
  }
})
```

### 1.3 ClawdBot Plugin: Quest Reminders

```javascript
// findmyflow-plugin/src/reminders.js

const REMINDER_MESSAGES = {
  morning: (plan) => {
    const phase = plan?.week_type || 'flow'
    return `Good morning! It's a ${phase.toUpperCase()} week.

Your focus today:
${plan?.morning_routine?.map(r => `• ${r}`).join('\n') || '• Check your weekly plan'}

Ready to make progress?`
  },

  streak_warning: (streak, quests) => {
    return `Hey! You're on a ${streak}-day streak.

${quests.length} quest${quests.length > 1 ? 's' : ''} left today:
${quests.map(q => `• ${q.name}`).join('\n')}

Don't break the chain!`
  },

  groan_day: (challenge) => {
    return `Today is your Groan Challenge day!

Your challenge: ${challenge?.title || 'Face something uncomfortable'}

Remember: Growth happens at the edge of your comfort zone.

Ready to accept the challenge?`
  }
}

async function sendMorningReminder(userId, platform) {
  const weeklyPlan = await fetchFromFindMyFlow('get_weekly_plan', userId)
  const message = REMINDER_MESSAGES.morning(weeklyPlan)

  await sendMessage(platform, userId, message)
  await logAction(userId, 'reminder_sent', { type: 'morning' })
}

async function checkStreakStatus(userId, platform) {
  const { streak, pendingQuests } = await fetchFromFindMyFlow('get_streak_status', userId)

  if (pendingQuests.length > 0 && isEvening()) {
    const message = REMINDER_MESSAGES.streak_warning(streak, pendingQuests)
    await sendMessage(platform, userId, message)
    await logAction(userId, 'reminder_sent', { type: 'streak_warning' })
  }
}

module.exports = { sendMorningReminder, checkStreakStatus }
```

### 1.4 FindMyFlow UI: Settings Page

Add ClawdBot settings to Profile or a new Settings page:

```jsx
// src/components/ClawdbotSettings.jsx
function ClawdbotSettings() {
  const [settings, setSettings] = useState(null)

  return (
    <div className="clawdbot-settings">
      <h2>ClawdBot Integration</h2>

      <div className="setting-group">
        <label>
          <input type="checkbox" checked={settings?.enabled} />
          Enable ClawdBot Integration
        </label>
      </div>

      <div className="setting-group">
        <label>Preferred Platform</label>
        <select value={settings?.preferred_platform}>
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="instagram">Instagram</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Phone/Handle</label>
        <input type="text" value={settings?.platform_identifier} />
      </div>

      <div className="setting-group">
        <label>Daily Reminder Time</label>
        <input type="time" value={settings?.reminder_time} />
      </div>

      <div className="features-checklist">
        <h3>Features</h3>
        <label><input type="checkbox" /> Quest Reminders</label>
        <label><input type="checkbox" /> Message Capture</label>
        <label><input type="checkbox" /> Market Research</label>
      </div>
    </div>
  )
}
```

### 1.5 Testing Checklist
- [ ] Morning reminder sends at configured time
- [ ] Reminder includes correct weekly plan phase
- [ ] Streak warning triggers in evening if quests incomplete
- [ ] Groan day reminder triggers on correct day
- [ ] Settings save and load correctly
- [ ] Reminders respect user's timezone

---

## Phase 2: Message Capture (Weeks 4-5)

### 2.1 Database Schema: Message Captures

```sql
-- Migration: 20260208000000_message_captures.sql

CREATE TABLE message_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'whatsapp', 'instagram', 'email'
  contact_identifier TEXT, -- phone number, handle, email
  contact_name TEXT,
  direction TEXT NOT NULL, -- 'sent', 'received'
  message_content TEXT,
  message_timestamp TIMESTAMPTZ,
  attachments JSONB, -- [{type: 'image', url: '...'}, ...]
  metadata JSONB, -- platform-specific data
  processed BOOLEAN DEFAULT false,
  crm_contact_id UUID REFERENCES crm_contacts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding unprocessed messages
CREATE INDEX idx_message_captures_unprocessed
  ON message_captures(user_id, processed)
  WHERE processed = false;

-- Link to CRM contacts
CREATE INDEX idx_message_captures_contact
  ON message_captures(crm_contact_id);
```

### 2.2 Message Processing Pipeline

```
User sends message via WhatsApp/Instagram
              │
              ▼
┌─────────────────────────────┐
│  ClawdBot captures message  │
│  (local processing)         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Extract structured data:   │
│  - Contact info             │
│  - Message content          │
│  - Sentiment                │
│  - Key topics               │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  POST to Supabase Edge Fn   │
│  /clawdbot-message-capture  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Match or create CRM        │
│  contact, store message     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Queue for user review      │
│  in CRM dashboard           │
└─────────────────────────────┘
```

### 2.3 ClawdBot Plugin: Message Capture

```javascript
// findmyflow-plugin/src/messageCapture.js

async function onMessageSent(messageData, platform) {
  const {
    recipientId,
    recipientName,
    content,
    timestamp,
    attachments
  } = messageData

  // Extract insights locally before sending to server
  const analysis = await analyzeMessage(content)

  // Send to FindMyFlow
  await fetch(`${SUPABASE_URL}/functions/v1/clawdbot-message-capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clawdbot-signature': generateSignature(messageData)
    },
    body: JSON.stringify({
      platform,
      contact_identifier: recipientId,
      contact_name: recipientName,
      direction: 'sent',
      message_content: content,
      message_timestamp: timestamp,
      attachments,
      analysis: {
        sentiment: analysis.sentiment,
        topics: analysis.topics,
        is_outreach: analysis.isOutreach,
        is_follow_up: analysis.isFollowUp,
        objections_mentioned: analysis.objections,
        interest_signals: analysis.interestSignals
      }
    })
  })
}

async function analyzeMessage(content) {
  // Use Claude locally via ClawdBot to analyze
  const prompt = `Analyze this outreach message and extract:
1. Sentiment (positive/neutral/negative)
2. Key topics discussed
3. Is this initial outreach or follow-up?
4. Any objections mentioned?
5. Any interest signals?

Message: "${content}"

Return JSON format.`

  return await clawdbot.analyze(prompt)
}

module.exports = { onMessageSent }
```

### 2.4 Supabase Edge Function: Message Capture

```typescript
// supabase/functions/clawdbot-message-capture/index.ts

serve(async (req) => {
  const data = await req.json()

  const supabase = createClient(/*...*/)

  // Find or create CRM contact
  let contactId = null
  const { data: existingContact } = await supabase
    .from('crm_contacts')
    .select('id')
    .eq('user_id', data.user_id)
    .or(`phone.eq.${data.contact_identifier},email.eq.${data.contact_identifier},instagram_handle.eq.${data.contact_identifier}`)
    .single()

  if (existingContact) {
    contactId = existingContact.id
  } else {
    // Create new contact
    const { data: newContact } = await supabase
      .from('crm_contacts')
      .insert({
        user_id: data.user_id,
        name: data.contact_name,
        [getPlatformField(data.platform)]: data.contact_identifier,
        source: `clawdbot_${data.platform}`,
        status: 'new'
      })
      .select()
      .single()

    contactId = newContact.id
  }

  // Store message
  await supabase.from('message_captures').insert({
    user_id: data.user_id,
    platform: data.platform,
    contact_identifier: data.contact_identifier,
    contact_name: data.contact_name,
    direction: data.direction,
    message_content: data.message_content,
    message_timestamp: data.message_timestamp,
    attachments: data.attachments,
    metadata: data.analysis,
    crm_contact_id: contactId
  })

  // Update contact's last interaction
  await supabase.from('crm_contacts').update({
    last_interaction: data.message_timestamp,
    interaction_count: supabase.sql`interaction_count + 1`
  }).eq('id', contactId)

  return new Response(JSON.stringify({ success: true, contactId }))
})
```

### 2.5 CRM Review Queue UI

```jsx
// src/components/crm/MessageReviewQueue.jsx

function MessageReviewQueue() {
  const [messages, setMessages] = useState([])

  return (
    <div className="message-review-queue">
      <h2>Captured Messages</h2>
      <p className="queue-description">
        Review messages captured by ClawdBot. Approve to add to contact history.
      </p>

      {messages.map(msg => (
        <div key={msg.id} className="message-card">
          <div className="message-header">
            <span className="platform-badge">{msg.platform}</span>
            <span className="contact-name">{msg.contact_name}</span>
            <span className="timestamp">{formatTime(msg.message_timestamp)}</span>
          </div>

          <div className="message-content">
            {msg.message_content}
          </div>

          <div className="message-analysis">
            <span className={`sentiment ${msg.metadata?.sentiment}`}>
              {msg.metadata?.sentiment}
            </span>
            {msg.metadata?.topics?.map(topic => (
              <span key={topic} className="topic-tag">{topic}</span>
            ))}
          </div>

          <div className="message-actions">
            <button onClick={() => approveMessage(msg.id)}>
              Approve & Add to CRM
            </button>
            <button onClick={() => dismissMessage(msg.id)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2.6 Testing Checklist
- [ ] WhatsApp messages captured after sending
- [ ] Instagram DMs captured after sending
- [ ] New contacts auto-created in CRM
- [ ] Existing contacts matched correctly
- [ ] Message analysis extracts useful metadata
- [ ] Review queue displays captured messages
- [ ] Approve/dismiss actions work correctly

---

## Phase 3: Market Research Automation (Weeks 6-8)

### 3.1 Database Schema: Research Findings

```sql
-- Migration: 20260215000000_market_research.sql

CREATE TABLE market_research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'subreddit', 'twitter_search', 'quora_topic'
  source_identifier TEXT NOT NULL, -- 'r/burnout', '#solopreneur', etc.
  persona_id UUID, -- link to nikigai_clusters if relevant
  is_active BOOLEAN DEFAULT true,
  last_scan_at TIMESTAMPTZ,
  scan_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE market_research_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES market_research_sources(id) ON DELETE CASCADE,
  source_url TEXT,
  title TEXT,
  content TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  engagement_metrics JSONB, -- {upvotes: 100, comments: 50, shares: 10}
  extracted_pain_points TEXT[],
  extracted_desires TEXT[],
  emotional_language TEXT[],
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'saved', 'dismissed'
  added_to_voc BOOLEAN DEFAULT false, -- added to Voice of Customer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding new findings
CREATE INDEX idx_research_findings_new
  ON market_research_findings(user_id, status, created_at DESC)
  WHERE status = 'new';
```

### 3.2 Research Source Configuration UI

```jsx
// src/components/crm/ResearchSourcesConfig.jsx

function ResearchSourcesConfig() {
  const [sources, setSources] = useState([])
  const [newSource, setNewSource] = useState({ type: 'subreddit', identifier: '' })

  const sourceTypes = [
    { value: 'subreddit', label: 'Reddit Subreddit', placeholder: 'r/entrepreneur' },
    { value: 'twitter_search', label: 'Twitter/X Search', placeholder: '#burnout OR "burnt out"' },
    { value: 'quora_topic', label: 'Quora Topic', placeholder: 'Career Change' },
    { value: 'youtube_channel', label: 'YouTube Comments', placeholder: 'Channel URL' }
  ]

  return (
    <div className="research-sources-config">
      <h2>Market Research Sources</h2>
      <p>Configure sources for ClawdBot to monitor for voice-of-customer insights.</p>

      <div className="add-source">
        <select
          value={newSource.type}
          onChange={e => setNewSource({...newSource, type: e.target.value})}
        >
          {sourceTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder={sourceTypes.find(t => t.value === newSource.type)?.placeholder}
          value={newSource.identifier}
          onChange={e => setNewSource({...newSource, identifier: e.target.value})}
        />
        <button onClick={addSource}>Add Source</button>
      </div>

      <div className="sources-list">
        {sources.map(source => (
          <div key={source.id} className="source-item">
            <span className="source-type">{source.source_type}</span>
            <span className="source-id">{source.source_identifier}</span>
            <span className="last-scan">Last scan: {formatTime(source.last_scan_at)}</span>
            <button onClick={() => toggleSource(source.id)}>
              {source.is_active ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => deleteSource(source.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3.3 ClawdBot Plugin: Reddit Scanner

```javascript
// findmyflow-plugin/src/research/reddit.js

const snoowrap = require('snoowrap')

class RedditScanner {
  constructor(credentials) {
    this.reddit = new snoowrap(credentials)
  }

  async scanSubreddit(subreddit, options = {}) {
    const { limit = 50, timeframe = 'week' } = options

    const posts = await this.reddit
      .getSubreddit(subreddit)
      .getTop({ time: timeframe, limit })

    const findings = []

    for (const post of posts) {
      // Get top comments for richer data
      const comments = await post.expandReplies({ limit: 10, depth: 1 })

      // Analyze with Claude
      const analysis = await this.analyzePost(post, comments)

      if (analysis.relevanceScore > 0.6) {
        findings.push({
          source_url: `https://reddit.com${post.permalink}`,
          title: post.title,
          content: post.selftext,
          author: post.author.name,
          published_at: new Date(post.created_utc * 1000),
          engagement_metrics: {
            upvotes: post.ups,
            comments: post.num_comments,
            upvote_ratio: post.upvote_ratio
          },
          ...analysis
        })
      }
    }

    return findings
  }

  async analyzePost(post, comments) {
    const prompt = `Analyze this Reddit post for market research insights.

Title: ${post.title}
Content: ${post.selftext}
Top Comments: ${comments.slice(0, 5).map(c => c.body).join('\n---\n')}

Extract:
1. Pain points mentioned (array of strings)
2. Desires/goals mentioned (array of strings)
3. Emotional language used (array of words/phrases)
4. Relevance score for someone building a personal development product (0.0 to 1.0)

Return JSON format.`

    return await clawdbot.analyze(prompt)
  }
}

module.exports = { RedditScanner }
```

### 3.4 Research Findings Review UI

```jsx
// src/components/crm/ResearchFindingsReview.jsx

function ResearchFindingsReview() {
  const [findings, setFindings] = useState([])
  const [filter, setFilter] = useState('new')

  return (
    <div className="research-findings">
      <h2>Market Research Findings</h2>

      <div className="findings-filters">
        <button className={filter === 'new' ? 'active' : ''} onClick={() => setFilter('new')}>
          New ({findings.filter(f => f.status === 'new').length})
        </button>
        <button className={filter === 'saved' ? 'active' : ''} onClick={() => setFilter('saved')}>
          Saved
        </button>
      </div>

      <div className="findings-list">
        {findings.filter(f => f.status === filter).map(finding => (
          <div key={finding.id} className="finding-card">
            <div className="finding-header">
              <a href={finding.source_url} target="_blank" rel="noopener">
                {finding.title}
              </a>
              <span className="relevance-score">
                {Math.round(finding.relevance_score * 100)}% relevant
              </span>
            </div>

            <div className="finding-content">
              {finding.content?.slice(0, 300)}...
            </div>

            <div className="finding-insights">
              <div className="pain-points">
                <h4>Pain Points</h4>
                {finding.extracted_pain_points?.map((pp, i) => (
                  <span key={i} className="tag pain">{pp}</span>
                ))}
              </div>
              <div className="emotional-language">
                <h4>Emotional Language</h4>
                {finding.emotional_language?.map((el, i) => (
                  <span key={i} className="tag emotion">{el}</span>
                ))}
              </div>
            </div>

            <div className="finding-engagement">
              <span>↑ {finding.engagement_metrics?.upvotes}</span>
              <span>💬 {finding.engagement_metrics?.comments}</span>
            </div>

            <div className="finding-actions">
              <button onClick={() => addToVoC(finding)}>
                Add to Voice of Customer
              </button>
              <button onClick={() => saveFinding(finding.id)}>
                Save for Later
              </button>
              <button onClick={() => dismissFinding(finding.id)}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3.5 Integration with Validation Flows

```javascript
// src/lib/crm/researchIntegration.js

// Auto-suggest validation questions based on research findings
export async function generateValidationQuestions(userId, personaId) {
  const { data: findings } = await supabase
    .from('market_research_findings')
    .select('extracted_pain_points, extracted_desires, emotional_language')
    .eq('user_id', userId)
    .eq('status', 'saved')
    .order('relevance_score', { ascending: false })
    .limit(20)

  // Aggregate pain points
  const allPainPoints = findings.flatMap(f => f.extracted_pain_points || [])
  const painPointFrequency = countFrequency(allPainPoints)
  const topPainPoints = Object.entries(painPointFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pp]) => pp)

  // Generate questions
  const questions = topPainPoints.map(pp => ({
    question: `Tell me about your experience with "${pp}"`,
    pain_point: pp,
    source: 'market_research'
  }))

  return questions
}

// Add finding to Voice of Customer library
export async function addFindingToVoC(findingId) {
  const { data: finding } = await supabase
    .from('market_research_findings')
    .select('*')
    .eq('id', findingId)
    .single()

  // Create VoC entry
  await supabase.from('voice_of_customer_entries').insert({
    user_id: finding.user_id,
    source_type: 'market_research',
    source_url: finding.source_url,
    quote: finding.content?.slice(0, 500),
    pain_points: finding.extracted_pain_points,
    emotional_language: finding.emotional_language,
    platform: finding.source_id ? 'reddit' : 'unknown'
  })

  // Mark finding as added
  await supabase.from('market_research_findings')
    .update({ added_to_voc: true, status: 'saved' })
    .eq('id', findingId)
}
```

### 3.6 Testing Checklist
- [ ] Reddit subreddit scanning works
- [ ] Posts analyzed and pain points extracted
- [ ] Relevance scoring filters low-quality results
- [ ] Findings appear in review queue
- [ ] Save/dismiss actions work
- [ ] Add to VoC creates entry correctly
- [ ] Validation flow integration suggests questions
- [ ] Rate limiting respected

---

## Phase 4: Automated Workflows (Weeks 9-10)

### 4.1 Workflow Engine

```javascript
// findmyflow-plugin/src/workflows/engine.js

const workflows = {
  morningRoutine: {
    trigger: { type: 'schedule', cron: '0 8 * * *' },
    steps: [
      { action: 'fetchWeeklyPlan', output: 'plan' },
      { action: 'fetchPendingQuests', output: 'quests' },
      { action: 'checkGroanDay', input: 'plan', output: 'isGroanDay' },
      {
        action: 'sendMessage',
        template: 'morning_reminder',
        inputs: ['plan', 'quests', 'isGroanDay']
      },
      { action: 'logAction', type: 'morning_reminder' }
    ]
  },

  postOutreach: {
    trigger: { type: 'event', event: 'message_sent' },
    conditions: [
      { field: 'platform', in: ['whatsapp', 'instagram'] }
    ],
    steps: [
      { action: 'analyzeMessage', input: 'message', output: 'analysis' },
      { action: 'findOrCreateContact', inputs: ['message', 'analysis'], output: 'contact' },
      { action: 'storeMessage', inputs: ['message', 'contact', 'analysis'] },
      { action: 'updateLeadScore', input: 'contact' },
      { action: 'scheduleFollowUp', inputs: ['contact', 'analysis'] }
    ]
  },

  eveningCheck: {
    trigger: { type: 'schedule', cron: '0 21 * * *' },
    steps: [
      { action: 'fetchPendingQuests', output: 'quests' },
      { action: 'fetchStreak', output: 'streak' },
      {
        action: 'conditionalSend',
        condition: { field: 'quests.length', gt: 0 },
        template: 'streak_warning',
        inputs: ['quests', 'streak']
      }
    ]
  },

  weeklyResearch: {
    trigger: { type: 'schedule', cron: '0 3 * * 0' }, // Sunday 3am
    steps: [
      { action: 'fetchActiveSources', output: 'sources' },
      { action: 'runResearchScan', input: 'sources', output: 'findings' },
      { action: 'storeFindings', input: 'findings' },
      { action: 'sendResearchSummary', input: 'findings' }
    ]
  }
}

class WorkflowEngine {
  async execute(workflowName, triggerData = {}) {
    const workflow = workflows[workflowName]
    if (!workflow) throw new Error(`Unknown workflow: ${workflowName}`)

    const context = { ...triggerData }

    for (const step of workflow.steps) {
      // Check conditions
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        continue
      }

      // Execute action
      const result = await this.executeAction(step.action, step, context)

      // Store output
      if (step.output) {
        context[step.output] = result
      }
    }

    return context
  }

  async executeAction(actionName, step, context) {
    const actions = require('./actions')
    const action = actions[actionName]

    if (!action) throw new Error(`Unknown action: ${actionName}`)

    // Resolve inputs from context
    const inputs = {}
    if (step.input) inputs[step.input] = context[step.input]
    if (step.inputs) {
      for (const key of step.inputs) {
        inputs[key] = context[key]
      }
    }

    return await action(inputs, context)
  }
}

module.exports = { WorkflowEngine, workflows }
```

### 4.2 Workflow Actions Library

```javascript
// findmyflow-plugin/src/workflows/actions.js

module.exports = {
  async fetchWeeklyPlan({ userId }) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/clawdbot-reminder-webhook`, {
      method: 'POST',
      body: JSON.stringify({ action: 'get_weekly_plan', userId })
    })
    return response.json()
  },

  async fetchPendingQuests({ userId }) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/clawdbot-reminder-webhook`, {
      method: 'POST',
      body: JSON.stringify({ action: 'get_pending_quests', userId })
    })
    return response.json()
  },

  async analyzeMessage({ message }) {
    return await clawdbot.analyze(`
      Analyze this outreach message:
      "${message.content}"

      Return JSON with: sentiment, topics, isOutreach, isFollowUp, objections, interestSignals
    `)
  },

  async findOrCreateContact({ message, analysis }) {
    // Implementation from Phase 2
  },

  async sendMessage({ platform, userId, template, data }) {
    const message = renderTemplate(template, data)
    await clawdbot.sendMessage(platform, userId, message)
  },

  async scheduleFollowUp({ contact, analysis }) {
    if (analysis.needsFollowUp) {
      const followUpDate = calculateFollowUpDate(analysis)
      await supabase.from('scheduled_actions').insert({
        action_type: 'follow_up_reminder',
        contact_id: contact.id,
        scheduled_for: followUpDate,
        message_template: 'follow_up_nudge'
      })
    }
  },

  async runResearchScan({ sources }) {
    const allFindings = []
    for (const source of sources) {
      const scanner = getScannerForSource(source.source_type)
      const findings = await scanner.scan(source.source_identifier)
      allFindings.push(...findings.map(f => ({ ...f, source_id: source.id })))
    }
    return allFindings
  }
}
```

### 4.3 Testing Checklist
- [ ] Morning workflow triggers at scheduled time
- [ ] Post-outreach workflow captures and processes messages
- [ ] Evening check sends streak warnings appropriately
- [ ] Weekly research runs and stores findings
- [ ] Workflows handle errors gracefully
- [ ] Logs capture all workflow executions

---

## Phase 5: Testing & Polish (Weeks 11-12)

### 5.1 Integration Testing
- [ ] End-to-end test: Quest reminder flow
- [ ] End-to-end test: Message capture to CRM
- [ ] End-to-end test: Research to Voice of Customer
- [ ] Load testing: Multiple users, concurrent workflows
- [ ] Error handling: Network failures, API limits

### 5.2 User Acceptance Testing
- [ ] Recruit 3-5 beta testers
- [ ] Provide setup documentation
- [ ] Collect feedback on each feature
- [ ] Iterate based on feedback

### 5.3 Documentation
- [ ] User guide: Setting up ClawdBot integration
- [ ] User guide: Configuring research sources
- [ ] User guide: Using message capture
- [ ] Troubleshooting guide
- [ ] Privacy & data handling documentation

### 5.4 Security Review
- [ ] Audit webhook signature verification
- [ ] Review data handling practices
- [ ] Ensure PII is handled appropriately
- [ ] Document data retention policies

---

## Appendix A: Environment Variables

```bash
# ClawdBot Plugin
FINDMYFLOW_SUPABASE_URL=https://qlwfcfypnoptsocdpxuv.supabase.co
FINDMYFLOW_SUPABASE_SERVICE_KEY=your-service-key
FINDMYFLOW_WEBHOOK_SECRET=shared-secret-for-signatures

# Research APIs
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USER_AGENT=FindMyFlow/1.0

# Optional
TWITTER_BEARER_TOKEN=your-twitter-token
```

## Appendix B: File Structure

```
findmyflow-clawdbot-plugin/
├── package.json
├── README.md
├── src/
│   ├── index.js              # Plugin entry point
│   ├── config.js             # Configuration handling
│   ├── reminders/
│   │   ├── index.js
│   │   └── templates.js
│   ├── messageCapture/
│   │   ├── index.js
│   │   ├── whatsapp.js
│   │   └── instagram.js
│   ├── research/
│   │   ├── index.js
│   │   ├── reddit.js
│   │   ├── twitter.js
│   │   └── analyzer.js
│   ├── workflows/
│   │   ├── engine.js
│   │   ├── actions.js
│   │   └── definitions.js
│   └── utils/
│       ├── api.js
│       ├── crypto.js
│       └── logging.js
└── tests/
    ├── reminders.test.js
    ├── messageCapture.test.js
    └── research.test.js
```

## Appendix C: Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Reddit API rate limits | Medium | High | Implement backoff, cache results |
| WhatsApp blocks automation | High | Medium | Use official Business API, follow ToS |
| ClawdBot plugin system changes | Medium | Low | Pin versions, monitor updates |
| User data privacy concerns | High | Medium | Clear consent flows, local processing |
| Message capture consent issues | High | Medium | Explicit opt-in, easy opt-out |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-01-29 | 0.2 | Added Implementation Support Breakdown section |
| 2026-01-29 | 0.1 | Initial implementation plan |
