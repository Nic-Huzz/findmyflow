# AI Possibility Diagnostic

**What this is:** A step-by-step diagnostic that tells you exactly what AI can and can't do for YOUR business, which tools to use, and how much stays manual. No hype, no overwhelm, just honest answers.

**The problem:** AI is everywhere and everyone says it can do everything. But when you sit down to actually use it, you don't know what's real, what's relevant to you, or where to start. This diagnostic fixes that.

**How it works:**
1. Tell us your business model
2. Tell us your biggest pain
3. Get a personalised report showing what's possible, what's automated, and what you still do yourself

**Future:** This becomes an interactive flow at `/try/ai-diagnostic` (lead magnet) and later integrates into the Creator Portal pipeline.

---

## Step 1: Business Model

*"What do you do?"*

| Model | Examples | Unlocks |
|-------|---------|---------|
| **Services** | Coaching, consulting, freelance, done-for-you | Sections: Outreach, Proposals, Client Management, Follow-up |
| **Experiences** | Workshops, retreats, classes, events, ceremonies | Sections: Fill the Room, Booking, Post-Event, Community |
| **Digital Products** | Courses, templates, memberships, communities | Sections: Content, Funnels, Email Sequences, Upsells |
| **Physical Products** | E-commerce, handmade, dropship, retail | Sections: Product Listings, Ads, Inventory, Customer Service |
| **Content / Media** | Newsletter, YouTube, podcast, social media | Sections: Content Creation, Distribution, Monetization, Growth |
| **Software / SaaS** | Apps, tools, platforms, marketplaces | Sections: Product-Led Growth, Onboarding, Retention, Support |

*Most people are a mix. Pick your primary, we'll note the others.*

---

## Step 2: Biggest Pain

*"What's the one thing that, if solved, would change everything?"*

| Pain | What They Say | Diagnostic Branch |
|------|-------------|-------------------|
| **Can't find customers** | "I don't know where my next client is coming from" | → Finding & Attracting |
| **Leads don't convert** | "People see my stuff but don't buy" | → Converting & Closing |
| **No time for content** | "I know I should post but I never do" | → Content Creation |
| **Drowning in admin** | "I spend more time on email than my actual work" | → Operations & Admin |
| **Don't know what's working** | "I'm guessing, not measuring" | → Analytics & Tracking |
| **Can't scale** | "I'm maxed out, it's just me" | → Automation & Scale |

---

## Step 3: Drill Down (per pain branch)

### Branch A: Finding & Attracting

*"How do you want people to find you?"*

| Sub-question | If Yes → Show These Capabilities |
|-------------|----------------------------------|
| "I want people to find me through search" | SEO Content, Blog, Directory Listings |
| "I want to reach out to specific people" | Cold Email, DM Outreach, LinkedIn, Reddit Monitoring |
| "I want my audience to grow on social" | Content Automation, AI Persona, Social Scheduling |
| "I want to run ads" | Meta Ads, Ad Creative, Audience Targeting |
| "I want my existing customers to bring me new ones" | Referral Programs, Testimonial Collection, UGC |
| "I want to partner with others in my space" | Interview Flywheel, Co-marketing, Guest Content |

### Branch B: Converting & Closing

*"Where are people dropping off?"*

| Sub-question | If Yes → Show These Capabilities |
|-------------|----------------------------------|
| "They visit my page but don't sign up" | Landing Page Optimization, CTA Design, Social Proof |
| "They sign up but don't pay" | Email Sequences, Offer Design, Pricing, Hook Selection |
| "They pay once but don't come back" | Post-Event Follow-up, Community, Upsell/Next Step, Repeat Booking |
| "I don't have a booking/payment system" | Booking Setup, Payment Processing, Waitlist |
| "My offer isn't compelling enough" | Value Stack Analysis, Offer Scoring, Guarantee Design |

### Branch C: Content Creation

*"What kind of content do you need?"*

| Sub-question | If Yes → Show These Capabilities |
|-------------|----------------------------------|
| "Social media posts (Instagram, LinkedIn, X)" | Social Post Drafting, Visual Content, AI Persona, Auto-posting |
| "Video content (Reels, TikTok, YouTube)" | Video Creation, Hook Templates, Virality Scoring, Thumbnail Design |
| "Long-form (blog, SEO articles)" | Blog/SEO Drafting, Keyword Research, Content Strategy |
| "Email/newsletter" | Newsletter Drafting, Email Sequences, List Management |
| "I need a consistent look without being on camera" | AI Persona (Orior, Higgsfield Soul ID, HeyGen) |
| "I need a content calendar, not just individual posts" | Content Calendar, Campaign Planning, Batch Creation |

### Branch D: Operations & Admin

*"What takes the most time?"*

| Sub-question | If Yes → Show These Capabilities |
|-------------|----------------------------------|
| "Email and follow-ups" | Email Automation, AI-drafted Replies, Gmail Integration |
| "Invoicing and getting paid" | Invoice Generation, Payment Processing, Accounting |
| "Scheduling and calendar" | Booking System, Calendar Management, Availability |
| "Tracking contacts and leads" | CRM, Contact Management, Lead Scoring |
| "Contracts and legal" | E-signatures, Waiver Templates, Contract Generation |
| "Bookkeeping and expenses" | Accounting Software, Receipt Tracking, P&L |

### Branch E: Analytics & Tracking

*"What do you wish you knew?"*

| Sub-question | If Yes → Show These Capabilities |
|-------------|----------------------------------|
| "How many people visit my website" | Website Analytics |
| "Which content performs best" | Social Analytics, Post Performance Tracking |
| "Where my revenue comes from" | Revenue Tracking, Payment Analytics |
| "Whether my ads are profitable" | Ad Performance, ROAS Tracking |
| "What my competitors are doing" | Competitor Monitoring, Price Tracking, Content Gap Analysis |

### Branch F: Automation & Scale

*"What do you wish ran without you?"*

| Sub-question | If Yes → Show These Capabilities |
|-------------|----------------------------------|
| "Content creation and posting" | Content Automation, AI Persona, Auto-posting |
| "Finding and qualifying leads" | Lead Monitoring, Reddit/Social Listening, Enrichment |
| "Email follow-ups and sequences" | Email Automation, Trigger-based Sequences |
| "Responding to enquiries" | AI Chat, IG DM Flows, Auto-replies |
| "Reporting and dashboards" | Automated Reports, Weekly Digests, Dashboard Alerts |
| "I just need another pair of hands" | VA/Delegation, Task Management |

---

## Step 4: Preferences (filters for recommendations)

*These shape which tools we recommend AND which TAAFT deep link we generate.*

### 4a: Budget

*"What's your budget for tools?"*

| Answer | Effect on recommendations | TAAFT sort |
|--------|-------------------------|------------|
| **Free only** | Only show free tools. Flag paid-only capabilities as "needs budget." | `/price/` (cheapest first) |
| **Under $50/mo** | Show free + affordable tools. Flag expensive ones. | `/price/` |
| **Under $200/mo** | Show Tier 1-2 tools. Full range. | `/most-saved/` (best value) |
| **Whatever it takes** | Show best-in-class regardless of cost. | `/top-rated/` |

### 4b: Platform

*"Where do you work?"*

| Answer | Effect on recommendations | TAAFT prefix |
|--------|-------------------------|-------------|
| **Desktop / laptop** | Default recommendations | (none) |
| **iPhone / iPad** | Prioritize tools with iOS apps | `/ios/` |
| **Android** | Prioritize tools with Android apps | `/android/` |
| **I use ChatGPT a lot** | Show GPT alternatives where available | `/gpts/` |
| **I use Chrome extensions** | Show Chrome extension options | `/chrome/` |

### 4c: Automation preference

*"How much do you want AI to handle?"*

| Answer | Effect on recommendations |
|--------|-------------------------|
| **Do it all for me** | Prioritize Level 5 (runs itself) tools. Show MCP-connected options first. |
| **Draft it, I'll review** | Prioritize Level 4 (one-click approve) tools. |
| **Just help me think** | Prioritize Level 2-3 tools. Show Claude/ChatGPT as primary, skip automation tools. |
| **Show me everything** | No filter. Show all levels. |

### Dynamic TAAFT Link Generation

Every "Browse more" link in the report adapts based on answers:

```javascript
function buildBrowseLink(capability, budget, platform) {
  // Map our capability to TAAFT task slug
  const taskSlug = CAPABILITY_TO_TAAFT[capability]
  
  // Budget → sort
  const sort = {
    'free': 'price',
    'under50': 'price', 
    'under200': 'most-saved',
    'unlimited': 'top-rated'
  }[budget]
  
  // Platform → URL prefix
  const prefix = {
    'desktop': '',
    'ios': 'ios/',
    'android': 'android/',
    'chatgpt': 'gpts/',
    'chrome': 'chrome/'
  }[platform]
  
  return `https://theresanaiforthat.com/${prefix}task/${taskSlug}/${sort}/`
}

// Example outputs:
// Free + iPhone + marketing → theresanaiforthat.com/ios/task/marketing/price/
// Under $200 + desktop + email → theresanaiforthat.com/task/email/most-saved/
// Unlimited + ChatGPT + videos → theresanaiforthat.com/gpts/task/videos/top-rated/
```

### Capability → TAAFT Task Slug Mapping

| Our Capability | TAAFT Task Slug | TAAFT Tool Count |
|---------------|----------------|-----------------|
| Social post drafting | `social-media-posts` | 500+ |
| Instagram posting | `social-media-posts` | 500+ |
| LinkedIn posting | `linkedin` | 200+ |
| SEO blog posts | `seo-content` | 300+ |
| Video content | `videos` | 1,041 |
| Ad creative | `video-ads` | 200+ |
| Email writing | `email-writing` | 145+ |
| Email sequences | `email` | 145+ |
| Lead generation | `lead-generation` | 400+ |
| Cold email | `cold-emails` | 100+ |
| CRM / contacts | `crm` | 200+ |
| Landing pages | `websites` | 500+ |
| Images | `images` | 3,341 |
| AI persona / avatars | `avatars` | 100+ |
| Scheduling | `scheduling` | 50+ |
| Finance / invoicing | `finance` | 404 |
| Task management | `task-management` | 85+ |
| Customer support | `customer-support` | 300+ |
| Analytics / data | `data` | 931 |
| Marketing (general) | `marketing` | 2,443 |
| Sales | `sales` | 747 |
| Ads | `ads` | 200+ |
| Competitor analysis | `competitive-analysis` | 100+ |
| Content (general) | `content` | 600+ |
| Productivity | `productivity` | 1,352 |
| Social media mgmt | `social-media-management` | 200+ |
| Video editing | `video-editing` | 300+ |
| Legal | `legal` | 265 |
| Business strategy | `business-strategy` | 208 |
| Customer engagement | `customer-engagement` | 200+ |
| Messaging | `messaging` | 100+ |
| Task automation | `task-automation` | 101 |

---

## Step 5: The Possibility Report

For each capability the user selected, show this:

### Report Format

```
┌─────────────────────────────────────────────────┐
│  YOUR AI POSSIBILITY REPORT                     │
│  Business: [their model]                        │
│  Focus: [their pain]                            │
│  Budget: [their budget]                         │
│  Platform: [their platform]                     │
│  Generated: [date]                              │
└─────────────────────────────────────────────────┘
```

Each capability gets a card:

```
┌─────────────────────────────────────────────────┐
│  📝 Write Instagram posts in my voice           │
│                                                  │
│  Can AI do this?     YES, FULLY                 │
│  Automation level:   🟢 Auto-post (MCP)         │
│  Best tool:          Orior AI (€15/mo)          │
│  Alt tools:          Higgsfield, Canva + Buffer  │
│  What you still do:  Review before publish       │
│  Setup time:         15 minutes                  │
│  Monthly cost:       €15                         │
│                                                  │
│  → Browse 500+ social media AI tools (filtered)  │
│    [theresanaiforthat.com/ios/task/social-media-  │
│     posts/price/]                                │
└─────────────────────────────────────────────────┘
```

### The 6 Automation Levels (shown on every card)

| Level | Icon | Label | What It Means |
|-------|------|-------|--------------|
| 5 | 🟢 | **Runs itself** | AI does it end-to-end on a schedule. You review occasionally. (MCP tools, scheduled triggers) |
| 4 | 🟢 | **One-click** | AI does it when you ask. You click "approve." (API tools, connected) |
| 3 | 🟡 | **Draft + paste** | AI creates the output. You paste it into the tool. (Web-only tools) |
| 2 | 🟡 | **AI assists** | AI helps you think/plan, but you execute manually. (Strategy, creative direction) |
| 1 | ⚙️ | **Setup once** | One-time configuration. Not an AI task, just needs doing once. (Connect account, set availability) |
| 0 | 🔴 | **Human only** | Requires human judgment, physical presence, or relationship. No AI path. |

### The "Can AI Do This?" Answers

Every capability gets one of four honest answers:

| Answer | What It Means | Example |
|--------|--------------|---------|
| **Yes, fully** | AI handles end-to-end. You review. | Write social posts, monitor Reddit, send email sequences |
| **Yes, with setup** | AI handles it once you connect a tool or provide context | Run Meta Ads (need to connect account), generate video (need brand assets) |
| **Partially** | AI does the creative/thinking part, you do the execution | Design a workshop curriculum (AI drafts, you refine), pricing strategy (AI analyzes, you decide) |
| **Setup once** | Not an AI task. One-time configuration that just needs doing. | Connect Stripe, set up Cal.com availability, build a waitlist page |
| **No, human only** | This requires human judgment, physical presence, or relationship | Run the actual workshop, build personal relationships, handle sensitive conversations |

---

## Step 6: "What Should I Do First?"

After the report, rank their selected capabilities by:

1. **Impact** (how much it moves the needle on their stated pain)
2. **Effort** (setup time + monthly cost)
3. **Automation level** (higher = less ongoing work)

Show a prioritized action list:

```
YOUR NEXT 3 MOVES:

1. 🟢 Set up Reddit monitoring for [their niche] keywords
   Impact: HIGH (finds leads while you sleep)
   Setup: 15 min | Cost: ~$20/mo (Claude Code)
   
2. 🟢 Connect Instagram for auto-publishing
   Impact: HIGH (consistent posting without daily effort)  
   Setup: 5 min | Cost: Free (Composio)

3. 🟡 Create an AI persona for product content
   Impact: MEDIUM (never need to be on camera)
   Setup: 30 min | Cost: €15/mo (Orior AI)
```

---

## Capability → Tool Lookup Table

This is the backend data the diagnostic uses. Each row maps a capability to its automation level, tool options, and a "Browse more" link to [There's an AI for That](https://theresanaiforthat.com) (50K+ tools, 11K+ tasks) so users can explore alternatives.

**Note:** The Browse More links below use default sort (`most-saved`). In the interactive version, these are dynamically generated using the user's budget + platform answers (see Step 4 above). E.g. a user who selected "Free only" + "iPhone" would see `/ios/task/marketing/price/` instead of `/task/marketing/most-saved`.

### Finding & Attracting

| Capability | Can AI? | Level | Best Tool(s) | Alt Tool(s) | What You Still Do | Setup | Cost | Browse More |
|-----------|---------|-------|-------------|-------------|-------------------|-------|------|------------|
| Monitor Reddit for buyer intent | Yes, fully | 5 🟢 | Claude Code (scheduled trigger) | n8n + Reddit API | Review leads, reply to good ones | 15 min | ~$20/mo | [Social media monitoring](https://theresanaiforthat.com/task/social-media-analysis/) |
| Monitor social for brand mentions | Yes, fully | 5 🟢 | Mention, Brand24 | SparkToro (WEB) | Decide which to engage with | 10 min | $29-99/mo | [Social media analysis](https://theresanaiforthat.com/task/social-media-analysis/) |
| Write SEO blog posts | Yes, fully | 4 🟢 | Claude + Surfer SEO | ChatGPT, Firecrawl | Review, add personal stories | 30 min | Free to $89/mo | [SEO content](https://theresanaiforthat.com/task/seo-content/) |
| Post to Instagram automatically | Yes, fully | 5 🟢 | Orior AI (auto-post) | Buffer, Later, Composio IG | Review content calendar | 15 min | €15/mo or free | [Social media posts](https://theresanaiforthat.com/task/social-media-posts/) |
| Post to LinkedIn | Yes, with setup | 4 🟢 | Composio LinkedIn | Buffer | Review post, approve | 5 min | Free | [LinkedIn](https://theresanaiforthat.com/task/linkedin/) |
| Send cold outreach emails | Yes, with setup | 4 🟢 | Apollo.io + Resend | Instantly, Smartlead | Define ICP, review replies | 1-2 hrs | $0-49/mo | [Cold emails](https://theresanaiforthat.com/task/cold-emails/) |
| Find email addresses from usernames | Yes, with setup | 4 🟢 | FullEnrich | Clay, Apollo | Verify, decide who to contact | 15 min | Pay-per-lead | [Lead generation](https://theresanaiforthat.com/task/lead-generation/) |
| Send personalised DMs | Partially | 2 🟡 | Claude (draft) + manual send | Agent-drafted messages | Send each DM yourself (safest) | 0 min | Free | [Sales](https://theresanaiforthat.com/task/sales/) |
| Run Meta/Instagram ads | Yes, with setup | 4 🟢 | Meta Ads (MCP) + Higgsfield | Manual Ads Manager | Set budget, review performance | 30 min | Ad spend | [Ads](https://theresanaiforthat.com/task/ads/) |
| Run Google Ads | Yes, with setup | 3 🟡 | Google Ads (manual) | Claude for copy | Manage campaigns yourself | 1 hr | Ad spend | [Ads](https://theresanaiforthat.com/task/ads/) |
| Create ad creative (images/video) | Yes, fully | 5 🟢 | Higgsfield Marketing Studio | Orior, Canva | Choose which creative to use | 15 min | Varies | [Video ads](https://theresanaiforthat.com/task/video-ads/) |
| Get listed on directories | Partially | 2 🟡 | Claude (research + draft descriptions) | Firecrawl (find directories) | Submit each listing yourself | 2-4 hrs | Free | [Marketing](https://theresanaiforthat.com/task/marketing/) |
| Set up referral program | Partially | 2 🟡 | Viral Loops, ReferralCandy | Manual "bring a friend" | Design incentives, promote it | 1-2 hrs | $0-49/mo | [Customer engagement](https://theresanaiforthat.com/task/customer-engagement/) |
| Interview other creators for content | Partially | 2 🟡 | Claude (draft questions) | Riverside, Descript | Conduct the interview yourself | 30 min | Free-$24/mo | [Content](https://theresanaiforthat.com/task/content/) |
| WhatsApp broadcasts | Yes, with setup | 4 🟢 | WhatsApp Business API (Composio) | WhatsApp Business (free, manual) | Write messages, manage groups | 15 min | Free-$50/mo | [Messaging](https://theresanaiforthat.com/task/messaging/) |

### Converting & Closing

| Capability | Can AI? | Level | Best Tool(s) | Alt Tool(s) | What You Still Do | Setup | Cost | Browse More |
|-----------|---------|-------|-------------|-------------|-------------------|-------|------|------------|
| Build a landing page | Partially | 3 🟡 | Claude (draft copy) + Carrd/Webflow | WordPress, Squarespace | Design decisions, publish | 1-2 hrs | $0-19/yr | [Websites](https://theresanaiforthat.com/task/websites/) |
| Set up online booking | Setup once | 1 ⚙️ | Cal.com | Calendly, Acuity, Mindbody | Configure availability, embed | 15 min | Free | [Scheduling](https://theresanaiforthat.com/task/scheduling/) |
| Accept payments | Setup once | 1 ⚙️ | Stripe | Square, PayPal | Connect bank, set prices | 15 min | Transaction fees | [Finance](https://theresanaiforthat.com/task/finance/) |
| Write email nurture sequence | Yes, fully | 4 🟢 | Claude + Kit/Resend | Mailchimp, ActiveCampaign | Review, personalise key emails | 1-2 hrs | Free-$29/mo | [Email writing](https://theresanaiforthat.com/task/email-writing/) |
| Create a lead magnet | Yes, fully | 4 🟢 | Claude (draft) + Canva (design) | ChatGPT, Midjourney | Choose topic, review output | 1-2 hrs | Free | [Lead generation](https://theresanaiforthat.com/task/lead-generation/) |
| Score and prioritize leads | Yes, with setup | 4 🟢 | Claude + CRM data | Apollo lead scoring | Define what "qualified" means | 30 min | Free | [B2B sales](https://theresanaiforthat.com/task/b2b-sales/) |
| Design/improve my offer | Partially | 2 🟡 | Claude with Value Equation | /offers skill, LLM Council | Make the strategic decisions | 30 min | Free | [Business strategy](https://theresanaiforthat.com/task/business-strategy/) |
| Build a waitlist | Setup once | 1 ⚙️ | Carrd + email form | beehiiv landing page, Google Form | Set up page, share link | 30 min | Free | [Websites](https://theresanaiforthat.com/task/websites/) |

### Content Creation

| Capability | Can AI? | Level | Best Tool(s) | Alt Tool(s) | What You Still Do | Setup | Cost | Browse More |
|-----------|---------|-------|-------------|-------------|-------------------|-------|------|------------|
| Write social posts in my voice | Yes, fully | 4 🟢 | Claude + voice profile | ChatGPT, Jasper, Copy.ai | Review, add personal touch | 30 min | Free-$49/mo | [Social media posts](https://theresanaiforthat.com/task/social-media-posts/) |
| Generate images for posts | Yes, fully | 4 🟢 | Higgsfield, Canva | DALL-E, Midjourney (WEB) | Choose which to use | 5 min | Free-$15/mo | [Images](https://theresanaiforthat.com/task/images/) |
| Create short-form video | Yes, fully | 5 🟢 | Higgsfield Marketing Studio | Orior (lip-sync), InVideo AI (WEB) | Review, pick best takes | 15 min | Varies | [Videos](https://theresanaiforthat.com/task/videos/) |
| Create AI persona (not on camera) | Yes, with setup | 4 🟢 | Orior AI | Higgsfield Soul ID, HeyGen | Define character, provide references, review outputs | 30 min | €15/mo | [Avatars](https://theresanaiforthat.com/task/avatars/) |
| Write blog/SEO articles | Yes, fully | 4 🟢 | Claude + Surfer SEO | ChatGPT, Firecrawl | Add expertise, review | 30 min | Free-$89/mo | [SEO content](https://theresanaiforthat.com/task/seo-content/) |
| Write newsletters | Yes, fully | 4 🟢 | Claude + Resend/beehiiv | Kit, Mailchimp, Substack (WEB) | Personal stories, review | 15 min | Free-$29/mo | [Email writing](https://theresanaiforthat.com/task/email-writing/) |
| Plan a month of content | Yes, fully | 4 🟢 | Claude + Notion | ChatGPT, Trello | Approve the calendar | 30 min | Free | [Content](https://theresanaiforthat.com/task/content/) |
| Repurpose long-form into clips | Yes, fully | 5 🟢 | Higgsfield Viral Clip Generator | Opus Clip, manual | Pick which clips to post | 10 min | Varies | [Video editing](https://theresanaiforthat.com/task/video-editing/) |
| Score video hooks before posting | Yes, fully | 5 🟢 | Higgsfield Virality Prediction | LLM Council (for text) | Decide whether to trust the score. Higgsfield = VIDEO only | 2 min | Varies | [Videos](https://theresanaiforthat.com/task/videos/) |
| Schedule posts across platforms | Yes, fully | 5 🟢 | Orior (6 platforms) | Buffer, Later | Set schedule once | 15 min | Free-€15/mo | [Social media management](https://theresanaiforthat.com/task/social-media-management/) |

### Operations & Admin

| Capability | Can AI? | Level | Best Tool(s) | Alt Tool(s) | What You Still Do | Setup | Cost | Browse More |
|-----------|---------|-------|-------------|-------------|-------------------|-------|------|------------|
| Draft follow-up emails | Yes, fully | 4 🟢 | Claude + Gmail (Composio) | ChatGPT + manual send | Review, approve send | 5 min | Free | [Email writing](https://theresanaiforthat.com/task/email-writing/) |
| Generate invoices | Yes, fully | 4 🟢 | Claude /invoice skill | Stripe invoicing, Wave | Add line items, send | 2 min | Free | [Finance](https://theresanaiforthat.com/task/finance/) |
| Track contacts/leads | Yes, with setup | 4 🟢 | Notion, HubSpot (free) | Airtable, Google Sheets | Enter data (or auto-import) | 30 min | Free | [CRM](https://theresanaiforthat.com/task/crm/) |
| Manage calendar | Yes, with setup | 4 🟢 | Google Calendar (MCP) | Cal.com, Apple Calendar | Define your routines, AI can create/move events | 10 min | Free | [Scheduling](https://theresanaiforthat.com/task/scheduling/) |
| Track expenses | Yes, with setup | 3 🟡 | Xero (Composio) | QuickBooks, Wave (WEB) | Categorize, approve | 15 min | Free-$16/mo | [Finance](https://theresanaiforthat.com/task/finance/) |
| Create contracts/waivers | Partially | 3 🟡 | Claude (draft) + Dropbox Sign | DocuSign, PandaDoc | Review legal language, send | 30 min | $10-15/mo | [Legal](https://theresanaiforthat.com/task/legal/) |
| Manage tasks | Yes, with setup | 4 🟢 | Todoist (community MCP), Notion (MCP) | Trello, pen + paper | Decide priorities, AI can create/update/track | 10 min | Free | [Task management](https://theresanaiforthat.com/task/task-management/) |

### Analytics & Tracking

| Capability | Can AI? | Level | Best Tool(s) | Alt Tool(s) | What You Still Do | Setup | Cost | Browse More |
|-----------|---------|-------|-------------|-------------|-------------------|-------|------|------------|
| Website traffic analytics | Yes, with setup | 4 🟢 | Fathom (Composio) | Plausible, Google Analytics | Interpret the data | 10 min | $14/mo or free | [Data](https://theresanaiforthat.com/task/data/) |
| Social media analytics | Yes, with setup | 4 🟢 | Composio Instagram | Native IG/LinkedIn insights | Decide what to change | 5 min | Free | [Social media analysis](https://theresanaiforthat.com/task/social-media-analysis/) |
| Revenue tracking | Yes, with setup | 4 🟢 | Stripe (MCP) | Wave, Xero, spreadsheet | Review, plan ahead | 5 min | Free | [Finance](https://theresanaiforthat.com/task/finance/) |
| Ad performance tracking | Yes, with setup | 4 🟢 | Meta Ads (MCP) | Google Ads dashboard | Adjust budget/targeting | 5 min | Free | [Ads](https://theresanaiforthat.com/task/ads/) |
| Competitor monitoring | Yes, fully | 5 🟢 | Firecrawl + Claude | SimilarWeb, manual | Decide how to respond | 30 min | Free | [Competitive analysis](https://theresanaiforthat.com/task/competitive-analysis/) |
| Weekly business summary | Yes, fully | 5 🟢 | Claude Code (scheduled) | ChatGPT + manual review | Read it, act on insights | 15 min | ~$20/mo | [Productivity](https://theresanaiforthat.com/task/productivity/) |

### Automation & Scale

| Capability | Can AI? | Level | Best Tool(s) | Alt Tool(s) | What You Still Do | Setup | Cost | Browse More |
|-----------|---------|-------|-------------|-------------|-------------------|-------|------|------------|
| Auto-post content daily | Yes, fully | 5 🟢 | Orior AI (6 platforms) | Buffer + Claude | Review weekly, adjust | 30 min | €15/mo | [Social media management](https://theresanaiforthat.com/task/social-media-management/) |
| Monitor leads 24/7 | Yes, fully | 5 🟢 | Claude Code triggers | n8n + Reddit/social APIs | Review alerts, respond | 15 min | ~$20/mo | [Lead generation](https://theresanaiforthat.com/task/lead-generation/) |
| Send triggered emails | Yes, with setup | 4 🟢 | Kit/ActiveCampaign | Resend + edge functions | Write the sequences once | 1-2 hrs | Free-$29/mo | [Email](https://theresanaiforthat.com/task/email/) |
| Auto-respond to IG comments | Yes, with setup | 4 🟢 | ManyChat | manual | Set up keyword triggers | 30 min | Free | [Customer engagement](https://theresanaiforthat.com/task/customer-engagement/) |
| Generate weekly reports | Yes, fully | 5 🟢 | Claude Code (scheduled) | n8n + data sources | Read and act on them | 15 min | ~$20/mo | [Data](https://theresanaiforthat.com/task/data/) |
| Auto-respond to website enquiries | Yes, with setup | 4 🟢 | Intercom, Tidio, Crisp | ChatGPT custom GPT (embed), Chatbase | Define FAQs, review escalations | 1-2 hrs | Free-$29/mo | [Customer support](https://theresanaiforthat.com/task/customer-support/) |
| Delegate to a VA | No, human only | 0 🔴 | Belay, Fiverr, local hire | Intern, assistant | Manage, train, review work | 2-4 hrs | $500+/mo | — |
| Build workflow automations | Yes, with setup | 4 🟢 | n8n (visual builder) | Claude Code /loop | Design the workflow logic | 1-4 hrs | Free (self-hosted) | [Task automation](https://theresanaiforthat.com/task/task-automation/) |

---

## Summary Stats

When the report generates, show these totals:

```
YOUR AI POSSIBILITY SCORE

Of the [X] capabilities you selected:

🟢  [Y] can be fully automated      (AI runs it, you review)
🟡  [Z] AI assists, you execute     (AI drafts, you paste/send)
⚙️  [V] one-time setup              (configure once, then done)
🔴  [W] human only                  (no AI shortcut)

Total setup time: [sum of setup column] hours
Estimated monthly cost: $[sum of cost column]
```

*Note: "time saved" depends on how many hours you currently spend on each task. The report shows setup time and cost, which are calculable from the data. Time savings require your input on current workload.*

---

## Implementation Notes

### As a /try/ lead magnet (v1)
- Static HTML page at `/try/ai-diagnostic`
- 3 steps of radio buttons / checkboxes
- Generate a shareable results card (like the Play Profile or Weekly Review card)
- Email gate: "Get your full report with tool links" → captures email
- Report is a styled HTML page or PDF with the capability cards

### As Creator Portal feature (v2)
- Integrated into the Experience Pipeline onboarding
- Connected to Composio: "Connect this now" buttons with OAuth
- Status dashboard: which tools are GREEN/YELLOW/RED for THIS user
- Progressive: re-run quarterly as business grows

### Data model
- `ai_diagnostic_results` table: user_id, business_model, pain_points[], selected_capabilities[], report_json, created_at
- Results feed into the Creator Brain for personalised agent actions

---

## Reference

- Backend tool data: `docs/capability-map/creator-capability-map.md` (62 tools, MCP/API/WEB classification)
- Personal status overlay: `docs/capability-map/personal-status-overlay.md` (Huzz's connected tools)
- Growth loops research: `docs/growth-loops-research.md`
