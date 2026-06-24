# Flow Academy Features Roadmap

## Current Features (Shipped)

### Voice Training
- [x] 7-step voice profile creation flow
- [x] Voice preview at Step 4
- [x] Voice templates (Coach, Expert, Storyteller, etc.)
- [x] Voice profile storage in Supabase
- [x] Integration with Content Generator

### Content Generator
- [x] AI-powered content generation
- [x] Multiple content types (Value Bomb, Transformation, etc.)
- [x] Platform-specific formatting (Instagram, LinkedIn, Twitter)
- [x] A/B voice testing (conversational vs punchy)
- [x] Character count with platform limits
- [x] Voice profile integration
- [x] Refinement options (shorter, longer, more casual, etc.)
- [x] Voice feedback ("Doesn't sound like me" with multi-select)

### Batch Content Generator
- [x] Multi-day content planning
- [x] Content type selection per day
- [x] Batch generation with progress
- [x] Hormozi-style content templates
- [x] Save to content history
- [x] Topic/theme input for focused generation
- [x] Preview mode with edit/regenerate
- [x] Smart defaults from voice profile
- [x] Draft save with localStorage persistence

### Content Generator Enhancements
- [x] Quick presets (viral hooks, storytelling, etc.)
- [x] Hook variant generator (multiple hooks per content)
- [x] CTA library integration
- [x] Cost optimization with model selection (Haiku for hooks)

### Voice DNA Extraction
- [x] Paste content samples for AI analysis
- [x] Extract tone, formality, energy level
- [x] Identify signature phrases and patterns
- [x] Generate voice profile from analysis
- [x] Edge function for voice extraction

### Content History & Analytics
- [x] Content History page (`/crm/content-history`)
- [x] Filter by status, platform, content type
- [x] Search content
- [x] Bulk actions (delete, status change)
- [x] Export to CSV
- [x] Inline editing

### Performance Dashboard
- [x] Performance metrics overview (`/crm/performance`)
- [x] Engagement averages (likes, comments, shares)
- [x] Week-over-week growth tracking
- [x] Platform breakdown with stats
- [x] Top performing content ranking
- [x] Best platform/content type insights
- [x] Time range filtering (7/30/90 days)

### Metrics Screenshot Upload
- [x] Upload post performance screenshots
- [x] AI vision analysis (Claude) for metric extraction
- [x] Image compression for cost optimization
- [x] Auto-extract: likes, comments, shares, saves, impressions
- [x] Performance tier classification
- [x] AI-generated insights

### Cost Optimizations
- [x] Model selection (Haiku vs Sonnet) for appropriate tasks
- [x] Image compression before API calls
- [x] Voice profile caching (5-minute TTL)
- [x] Reduced token usage for simple tasks

### CRM & Sales
- [x] Lead scoring system
- [x] Deal pipeline management
- [x] Screenshot uploads for deals
- [x] Hormozi sales scripts
- [x] Weekly marketing quests

---

## In Development

### AI Content Copilot - Content Marketing Strategy
*Status: Phase 1 (Content Marketing) Shipped*

- [x] Content Strategy setup flow (6 questions)
- [x] Platform selection (primary + secondary)
- [x] Multi-select posting days
- [x] Time availability → content type recommendations
- [x] Weekly template generation
- [x] Strategy editing via Marketing Quests header

**Coming Soon - Additional Strategies:**
- [ ] **Warm Outreach Strategy** - DMs to people who already know you
  - Outreach task templates
  - Follow-up sequence generation
  - Relationship tracking
- [ ] **Cold Outreach Strategy** - DMs to strangers who match ICP
  - Prospect list building tasks
  - Cold message templates
  - Response rate tracking
- [ ] **Paid Advertising Strategy** - Ads to reach new audiences at scale
  - Ad copy generation
  - Campaign task checklists
  - Budget tracking integration

---

### Unified Approval Queue
*Status: UI Built, Testing Required*

- [x] Combined queue for batch + autopilot content
- [x] Quick approve/edit/regenerate actions
- [x] Bulk approval mode
- [x] Priority sorting (by scheduled date, platform)
- [ ] Mobile-friendly swipe interface
- [x] Database: content_history table with queue columns
- [ ] Integration: Batch generator saves with source='batch', review_status='pending'
- [ ] Integration: Content generator edge function for regeneration

### AI Content Autopilot
*Status: Flow documented, awaiting implementation*

- [ ] Autopilot settings page
- [ ] Content queue with approval workflow
- [ ] Daily generation cron job
- [ ] Push/email notifications
- [ ] Smart scheduling (optimal posting times)

---

## To Build (Near-term)

### AI Content Strategist
*Analyze performance patterns and recommend content strategy*

**Concept:**
- Weekly strategy report generation
- Identifies what's working (content types, topics, posting times)
- Suggests topics based on trends and gaps
- Predicts optimal posting schedule
- Recommends content mix adjustments

**Technical Requirements:**
- Edge function for strategy analysis
- Historical data aggregation
- Pattern recognition prompts
- Integration with weekly planning

**Value:** Data-driven content decisions, not guesswork

---

### Intelligence Loop (Enhanced)
*Continuous learning from posted content performance*

- [x] Screenshot upload for metrics *(shipped)*
- [x] AI extraction of engagement data *(shipped)*
- [ ] AI learns from top-performing content patterns
- [ ] Automatic voice refinement suggestions
- [ ] Content type recommendations based on performance
- [ ] Topic suggestion based on engagement trends

---

### Voice from URLs/Links
*Import content from external sources*

**User Flow:**
1. User provides URLs to their blog posts, social profiles
2. System scrapes and extracts text content
3. AI analyzes patterns across all content
4. Generates voice profile from analysis

**Technical Requirements:**
- Web scraper edge function
- Content aggregation
- Integration with Voice DNA Extraction

**Value:** Zero-friction onboarding for established creators

---

## Future Features

### Multi-Channel Repurposing
*One piece of content adapted for multiple platforms*

**Concept:**
- User creates one core piece of content
- AI automatically adapts it for each platform:
  - Long-form for LinkedIn
  - Short hook + image caption for Instagram
  - Thread format for Twitter
  - Email newsletter snippet
  - YouTube script version

**User Flow:**
```
Create Core Content
    ↓
[Generate Variants]
    ↓
┌─────────────────────────────────────┐
│ LinkedIn (long-form)     [Edit] [✓] │
│ Instagram (caption)      [Edit] [✓] │
│ Twitter (thread)         [Edit] [✓] │
│ Email (snippet)          [Edit] [✓] │
└─────────────────────────────────────┘
    ↓
[Schedule All] or [Copy Each]
```

---

### Content Calendar View
*Visual calendar for content planning*

- [ ] Monthly/weekly calendar view
- [ ] Drag-and-drop content scheduling
- [ ] Content gaps highlighting
- [ ] Platform icons on calendar
- [ ] Quick preview on hover

---

### AI Co-Pilot Chat
*Conversational content creation*

- [ ] Chat interface for content ideas
- [ ] "What should I post about today?"
- [ ] "Make this more punchy"
- [ ] "Write a follow-up to yesterday's post"
- [ ] Context-aware (knows your voice, recent posts, performance)

---

### Engagement Assistant
*Help manage audience interactions*

- [ ] Suggested replies to comments/DMs
- [ ] Reply templates library
- [ ] Quick response drafts
- [ ] Conversation thread tracking

---

### Team/VA Mode
*Delegate content creation*

- [ ] Invite team members
- [ ] Role-based access (Creator, Approver, Viewer)
- [ ] Content approval workflow
- [ ] VA creates drafts, owner approves
- [ ] Activity log

---

### Platform Integrations

**Phase 1: Read-only**
- [ ] Instagram insights API
- [ ] LinkedIn analytics
- [ ] Twitter analytics

**Phase 2: Publishing**
- [ ] Direct post to Instagram
- [ ] Direct post to LinkedIn
- [ ] Direct post to Twitter
- [ ] Buffer/Hootsuite integration

---

### Advanced Voice Features

- [ ] Multiple voice profiles (different for each platform)
- [ ] Voice versioning (track changes over time)
- [ ] Voice A/B testing with analytics
- [ ] Voice cloning from video/audio content

---

### Analytics & Insights

- [ ] Content performance dashboard
- [ ] Best posting times analysis
- [ ] Audience growth tracking
- [ ] Engagement rate trends
- [ ] Content type performance comparison

---

## Priority Matrix

| Feature | Impact | Effort | Priority | Status |
|---------|--------|--------|----------|--------|
| Voice DNA Extraction | High | Medium | P1 | ✅ Shipped |
| Content Performance Tracking | High | Low | P1 | ✅ Shipped |
| Content History Page | High | Low | P1 | ✅ Shipped |
| Performance Dashboard | High | Medium | P1 | ✅ Shipped |
| Unified Approval Queue | High | Medium | P1 | 🚧 Next |
| AI Content Autopilot | High | Medium | P1 | 📋 Planned |
| AI Content Strategist | High | Medium | P2 | 📋 Planned |
| Multi-Channel Repurposing | High | High | P2 | 📋 Planned |
| Content Calendar View | Medium | Medium | P2 | 📋 Planned |
| AI Co-Pilot Chat | High | High | P2 | 📋 Planned |
| Platform Integrations (Read) | Medium | Medium | P3 | 📋 Planned |
| Platform Integrations (Publish) | High | High | P3 | 📋 Planned |
| Team/VA Mode | Medium | High | P3 | 📋 Planned |
| Advanced Voice Features | Medium | High | P4 | 📋 Planned |

---

## Technical Debt / Improvements

- [x] CSS namespacing audit (cg-, bcg-, msu-, vdna-, ch-, pd- prefixes)
- [ ] Error boundary implementation
- [ ] Offline support (PWA)
- [ ] Performance optimization (lazy loading)
- [ ] Accessibility audit
- [ ] Mobile app (React Native)

---

## Recent Sprint (January 6, 2026)

### Completed:
1. Voice DNA Extraction - AI-powered voice analysis from content samples
2. Content History Page - Full CRUD with filters and export
3. Performance Dashboard - Engagement analytics and insights
4. Metrics Screenshot Upload - Vision AI for engagement extraction
5. Cost Optimizations - Model selection, caching, compression
6. Content Generator Enhancements - Presets, hooks, CTA library

### Next Sprint:
1. Unified Approval Queue - Combined batch + autopilot content management
2. AI Content Strategist prototype - Weekly strategy recommendations

---

## CRM Sales Tower Enhancements (Backlog)

### Flow Tracker ↔ Deals Integration
*Connect emotional state tracking with sales outcomes*

- [ ] Prompt Flow check-in after deal status changes (Won/Lost)
- [ ] Auto-suggest direction based on outcome
- [ ] Weekly correlation insight: "Best sales weeks = North/East energy"
- [ ] Dashboard: "3 deals closed - how are you feeling?"

### Sales Pipeline Stages Review
*Align with Hormozi methodology*

| Current | Proposed Hormozi-Aligned |
|---------|--------------------------|
| Lead | Lead (Qualify fit, pain level) |
| Discovery | Discovery (SPIN questions) |
| Proposal | Value Demo → Proposal → Negotiation |
| Won/Lost | Closed Won / Closed Lost (with learnings) |

### Hormozi Follow-Up Cadence System
*Structured follow-up with scripts and reminders*

**Attraction Offer Follow-Up:**
| Day | Action | Script |
|-----|--------|--------|
| 0 | Immediate (within 5 min) | ✅ |
| 1 | Follow-up call/message | ✅ |
| 2 | Value add (send resource) | ✅ |
| 4 | Check-in | ✅ |
| 7 | Case study / last chance | ✅ |
| 14 | Re-engagement | ✅ |

**Features:**
- [ ] Follow-up reminders (push notifications)
- [ ] Scripts for each touchpoint
- [ ] Checkbox when completed
- [ ] Outcome tracking (responded/booked/ghosted)

### Upsell/Downsell/Continuity Triggers
*Systematic approach to maximizing customer value*

**Upsell:**
- [ ] Trigger X days after purchase
- [ ] Scripts by product type
- [ ] Success rate tracking

**Downsell:**
- [ ] Trigger on price objection
- [ ] Different offer (not discount)
- [ ] Path to eventual upsell

**Continuity:**
- [ ] Renewal reminders
- [ ] Churn risk indicators
- [ ] "Save" scripts for cancellation

### Task-Based Sales Workflow
*Guided checklists per stage with success tracking*

```
DEAL: Sarah Johnson - $5,000
Stage: Discovery

📋 CHECKLIST
[✓] Initial qualifying call      [Script]
[✓] Pain level identified (8/10)
[ ] Decision maker confirmed      [Script] [Mark Complete]
[ ] Budget qualified              [Script] [Mark Complete]
[ ] Timeline established          [Script] [Mark Complete]

⏰ REMINDERS
• Follow up tomorrow 2pm
• Send case study by Friday

[Move to Value Demo →]
```

**Database additions needed:**
- `sales_stage_tasks` - Template tasks per stage
- `deal_task_completions` - Track completions per deal
- `deal_reminders` - Follow-up scheduling

### Success Review Flow
*Learn from every stage completion*

After completing stage tasks:
- Rate outcome: Great / Okay / Struggled
- Capture main challenge (optional)
- Feed into analytics

### Priority Matrix (CRM Enhancements)

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Follow-up reminders | High | Low | P1 |
| Stage task checklists | High | Medium | P1 |
| Scripts per task | High | Low | P1 |
| Success review | Medium | Low | P2 |
| Flow ↔ Deals | Medium | Medium | P2 |
| Upsell/Downsell triggers | High | Medium | P2 |

---

*Last updated: January 7, 2026*
