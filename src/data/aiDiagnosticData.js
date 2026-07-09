/**
 * AI Possibility Diagnostic — Data
 *
 * All capability nodes, tool recommendations, TAAFT mappings,
 * and branching logic for the diagnostic flow.
 */

export const BUSINESS_MODELS = [
  { key: 'services', label: 'Services', icon: '\u{1F4BC}', desc: 'Coaching, consulting, freelance, done-for-you' },
  { key: 'experiences', label: 'Experiences', icon: '\u2728', desc: 'Workshops, retreats, classes, events, ceremonies' },
  { key: 'digital', label: 'Digital Products', icon: '\u{1F4E6}', desc: 'Courses, templates, memberships, communities' },
  { key: 'physical', label: 'Physical Products', icon: '\u{1F6D2}', desc: 'E-commerce, handmade, dropship, retail' },
  { key: 'content', label: 'Content / Media', icon: '\u{1F3AC}', desc: 'Newsletter, YouTube, podcast, social media' },
  { key: 'software', label: 'Software / SaaS', icon: '\u{1F4BB}', desc: 'Apps, tools, platforms, marketplaces' },
]

export const PAIN_POINTS = [
  { key: 'attract', label: "Can't find customers", quote: "I don't know where my next client is coming from", branch: 'Finding & Attracting' },
  { key: 'convert', label: "Leads don't convert", quote: "People see my stuff but don't buy", branch: 'Converting & Closing' },
  { key: 'content', label: 'No time for content', quote: "I know I should post but I never do", branch: 'Content Creation' },
  { key: 'admin', label: 'Drowning in admin', quote: "I spend more time on email than my actual work", branch: 'Operations & Admin' },
  { key: 'analytics', label: "Don't know what's working", quote: "I'm guessing, not measuring", branch: 'Analytics & Tracking' },
  { key: 'scale', label: "Can't scale", quote: "I'm maxed out, it's just me", branch: 'Automation & Scale' },
]

export const DRILL_DOWN = {
  attract: [
    { key: 'seo', label: 'I want people to find me through search' },
    { key: 'outreach', label: 'I want to reach out to specific people' },
    { key: 'social_grow', label: 'I want my audience to grow on social' },
    { key: 'ads', label: 'I want to run ads' },
    { key: 'referrals', label: 'I want my existing customers to bring me new ones' },
    { key: 'partnerships', label: 'I want to partner with others in my space' },
  ],
  convert: [
    { key: 'landing', label: "They visit my page but don't sign up" },
    { key: 'nurture', label: "They sign up but don't pay" },
    { key: 'retain', label: "They pay once but don't come back" },
    { key: 'setup', label: "I don't have a booking/payment system" },
    { key: 'offer', label: "My offer isn't compelling enough" },
  ],
  content: [
    { key: 'social_posts', label: 'Social media posts (Instagram, LinkedIn, X)' },
    { key: 'video', label: 'Video content (Reels, TikTok, YouTube)' },
    { key: 'longform', label: 'Long-form (blog, SEO articles)' },
    { key: 'newsletter', label: 'Email/newsletter' },
    { key: 'persona', label: 'I need a consistent look without being on camera' },
    { key: 'calendar', label: "I need a content calendar, not just individual posts" },
  ],
  admin: [
    { key: 'email_followup', label: 'Email and follow-ups' },
    { key: 'invoicing', label: 'Invoicing and getting paid' },
    { key: 'scheduling', label: 'Scheduling and calendar' },
    { key: 'contacts', label: 'Tracking contacts and leads' },
    { key: 'contracts', label: 'Contracts and legal' },
    { key: 'bookkeeping', label: 'Bookkeeping and expenses' },
  ],
  analytics: [
    { key: 'website', label: 'How many people visit my website' },
    { key: 'social_analytics', label: 'Which content performs best' },
    { key: 'revenue', label: 'Where my revenue comes from' },
    { key: 'ad_perf', label: 'Whether my ads are profitable' },
    { key: 'competitors', label: 'What my competitors are doing' },
  ],
  scale: [
    { key: 'content_auto', label: 'Content creation and posting' },
    { key: 'lead_auto', label: 'Finding and qualifying leads' },
    { key: 'email_auto', label: 'Email follow-ups and sequences' },
    { key: 'enquiry_auto', label: 'Responding to enquiries' },
    { key: 'reporting', label: 'Reporting and dashboards' },
    { key: 'delegation', label: "I just need another pair of hands" },
  ],
}

export const BUDGET_OPTIONS = [
  { key: 'free', label: 'Free only', taaftSort: 'price' },
  { key: 'under50', label: 'Under $50/mo', taaftSort: 'price' },
  { key: 'under200', label: 'Under $200/mo', taaftSort: 'most-saved' },
  { key: 'unlimited', label: 'Whatever it takes', taaftSort: 'top-rated' },
]

export const PLATFORM_OPTIONS = [
  { key: 'desktop', label: 'Desktop / laptop', taaftPrefix: '' },
  { key: 'ios', label: 'iPhone / iPad', taaftPrefix: 'ios/' },
  { key: 'android', label: 'Android', taaftPrefix: 'android/' },
  { key: 'chatgpt', label: 'I use ChatGPT a lot', taaftPrefix: 'gpts/' },
]

export const AUTOMATION_OPTIONS = [
  { key: 'full', label: 'Do it all for me', minLevel: 4, maxLevel: 5 },
  { key: 'review', label: "Draft it, I'll review", minLevel: 3, maxLevel: 5 },
  { key: 'think', label: 'Just help me think', minLevel: 0, maxLevel: 3 },
  { key: 'all', label: 'Show me everything', minLevel: 0, maxLevel: 5 },
]

// Each capability: what drill-down keys surface it, then the card data
export const CAPABILITIES = [
  // ── Finding & Attracting ──
  { id: 'reddit_monitor', triggers: ['outreach', 'lead_auto'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Monitor Reddit for buyer intent', bestTool: 'Claude Code (scheduled trigger)', altTools: 'n8n + Reddit API',
    youDo: 'Review leads, reply to good ones', setup: '15 min', cost: '~$20/mo', taaftSlug: 'social-media-analysis' },
  { id: 'seo_blog', triggers: ['seo', 'longform'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Write SEO blog posts', bestTool: 'Claude + Surfer SEO', altTools: 'ChatGPT, Firecrawl',
    youDo: 'Review, add personal stories', setup: '30 min', cost: 'Free to $89/mo', taaftSlug: 'seo-content' },
  { id: 'ig_autopost', triggers: ['social_grow', 'social_posts'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Post to Instagram automatically', bestTool: 'Orior AI (auto-post)', altTools: 'Buffer, Later',
    youDo: 'Review content calendar', setup: '15 min', cost: '\u20AC15/mo or free', taaftSlug: 'social-media-posts' },
  { id: 'linkedin_post', triggers: ['social_grow', 'social_posts'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Post to LinkedIn', bestTool: 'Composio LinkedIn', altTools: 'Buffer',
    youDo: 'Review post, approve', setup: '5 min', cost: 'Free', taaftSlug: 'linkedin' },
  { id: 'cold_email', triggers: ['outreach'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Send cold outreach emails', bestTool: 'Apollo.io + Resend', altTools: 'Instantly, Smartlead',
    youDo: 'Define ICP, review replies', setup: '1-2 hrs', cost: '$0-49/mo', taaftSlug: 'cold-emails' },
  { id: 'email_enrich', triggers: ['outreach', 'lead_auto'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Find email addresses from profiles', bestTool: 'FullEnrich', altTools: 'Clay, Apollo',
    youDo: 'Verify, decide who to contact', setup: '15 min', cost: 'Pay-per-lead', taaftSlug: 'lead-generation' },
  { id: 'send_dms', triggers: ['outreach'], canAI: 'Partially', level: 2, levelLabel: 'AI assists', levelIcon: 'yellow',
    title: 'Send personalised DMs', bestTool: 'Claude (draft) + manual send', altTools: 'Agent-drafted messages',
    youDo: 'Send each DM yourself (safest)', setup: '0 min', cost: 'Free', taaftSlug: 'sales' },
  { id: 'meta_ads', triggers: ['ads'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Run Meta/Instagram ads', bestTool: 'Meta Ads (MCP) + Higgsfield', altTools: 'Manual Ads Manager',
    youDo: 'Set budget, review performance', setup: '30 min', cost: 'Ad spend', taaftSlug: 'ads' },
  { id: 'ad_creative', triggers: ['ads', 'video'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Create ad creative (images/video)', bestTool: 'Higgsfield Marketing Studio', altTools: 'Orior, Canva',
    youDo: 'Choose which creative to use', setup: '15 min', cost: 'Varies', taaftSlug: 'video-ads' },
  { id: 'directories', triggers: ['seo', 'referrals'], canAI: 'Partially', level: 2, levelLabel: 'AI assists', levelIcon: 'yellow',
    title: 'Get listed on directories', bestTool: 'Claude (research + draft)', altTools: 'Firecrawl (find directories)',
    youDo: 'Submit each listing yourself', setup: '2-4 hrs', cost: 'Free', taaftSlug: 'marketing' },
  { id: 'referral_prog', triggers: ['referrals'], canAI: 'Partially', level: 2, levelLabel: 'AI assists', levelIcon: 'yellow',
    title: 'Set up referral program', bestTool: 'Viral Loops, ReferralCandy', altTools: 'Manual "bring a friend"',
    youDo: 'Design incentives, promote it', setup: '1-2 hrs', cost: '$0-49/mo', taaftSlug: 'customer-engagement' },
  { id: 'interviews', triggers: ['partnerships'], canAI: 'Partially', level: 2, levelLabel: 'AI assists', levelIcon: 'yellow',
    title: 'Interview creators for content', bestTool: 'Claude (draft questions)', altTools: 'Riverside, Descript',
    youDo: 'Conduct the interview yourself', setup: '30 min', cost: 'Free-$24/mo', taaftSlug: 'content' },
  { id: 'whatsapp', triggers: ['outreach', 'social_grow'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'WhatsApp broadcasts', bestTool: 'WhatsApp Business API', altTools: 'WhatsApp Business (free, manual)',
    youDo: 'Write messages, manage groups', setup: '15 min', cost: 'Free-$50/mo', taaftSlug: 'messaging' },

  // ── Converting & Closing ──
  { id: 'landing_page', triggers: ['landing'], canAI: 'Partially', level: 3, levelLabel: 'Draft + paste', levelIcon: 'yellow',
    title: 'Build a landing page', bestTool: 'Claude (draft copy) + Carrd/Webflow', altTools: 'WordPress, Squarespace',
    youDo: 'Design decisions, publish', setup: '1-2 hrs', cost: '$0-19/yr', taaftSlug: 'websites' },
  { id: 'booking', triggers: ['setup'], canAI: 'Setup once', level: 1, levelLabel: 'Setup once', levelIcon: 'setup',
    title: 'Set up online booking', bestTool: 'Cal.com', altTools: 'Calendly, Acuity, Mindbody',
    youDo: 'Configure availability, embed', setup: '15 min', cost: 'Free', taaftSlug: 'scheduling' },
  { id: 'payments', triggers: ['setup'], canAI: 'Setup once', level: 1, levelLabel: 'Setup once', levelIcon: 'setup',
    title: 'Accept payments', bestTool: 'Stripe', altTools: 'Square, PayPal',
    youDo: 'Connect bank, set prices', setup: '15 min', cost: 'Transaction fees', taaftSlug: 'finance' },
  { id: 'email_nurture', triggers: ['nurture', 'email_auto'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Write email nurture sequence', bestTool: 'Claude + Kit/Resend', altTools: 'Mailchimp, ActiveCampaign',
    youDo: 'Review, personalise key emails', setup: '1-2 hrs', cost: 'Free-$29/mo', taaftSlug: 'email-writing' },
  { id: 'lead_magnet', triggers: ['nurture', 'landing'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Create a lead magnet', bestTool: 'Claude (draft) + Canva (design)', altTools: 'ChatGPT, Midjourney',
    youDo: 'Choose topic, review output', setup: '1-2 hrs', cost: 'Free', taaftSlug: 'lead-generation' },
  { id: 'lead_score', triggers: ['outreach', 'lead_auto'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Score and prioritize leads', bestTool: 'Claude + CRM data', altTools: 'Apollo lead scoring',
    youDo: 'Define what "qualified" means', setup: '30 min', cost: 'Free', taaftSlug: 'b2b-sales' },
  { id: 'offer_design', triggers: ['offer'], canAI: 'Partially', level: 2, levelLabel: 'AI assists', levelIcon: 'yellow',
    title: 'Design/improve my offer', bestTool: 'Claude with Value Equation', altTools: 'LLM Council',
    youDo: 'Make the strategic decisions', setup: '30 min', cost: 'Free', taaftSlug: 'business-strategy' },
  { id: 'waitlist', triggers: ['setup', 'landing'], canAI: 'Setup once', level: 1, levelLabel: 'Setup once', levelIcon: 'setup',
    title: 'Build a waitlist', bestTool: 'Carrd + email form', altTools: 'beehiiv, Google Form',
    youDo: 'Set up page, share link', setup: '30 min', cost: 'Free', taaftSlug: 'websites' },

  // ── Content Creation ──
  { id: 'social_drafts', triggers: ['social_posts'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Write social posts in my voice', bestTool: 'Claude + voice profile', altTools: 'ChatGPT, Jasper, Copy.ai',
    youDo: 'Review, add personal touch', setup: '30 min', cost: 'Free-$49/mo', taaftSlug: 'social-media-posts' },
  { id: 'images', triggers: ['social_posts', 'video'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Generate images for posts', bestTool: 'Higgsfield, Canva', altTools: 'DALL-E, Midjourney',
    youDo: 'Choose which to use', setup: '5 min', cost: 'Free-$15/mo', taaftSlug: 'images' },
  { id: 'short_video', triggers: ['video'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Create short-form video', bestTool: 'Higgsfield Marketing Studio', altTools: 'Orior (lip-sync), InVideo AI',
    youDo: 'Review, pick best takes', setup: '15 min', cost: 'Varies', taaftSlug: 'videos' },
  { id: 'ai_persona', triggers: ['persona'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Create AI persona (not on camera)', bestTool: 'Orior AI', altTools: 'Higgsfield Soul ID, HeyGen',
    youDo: 'Define character, provide references', setup: '30 min', cost: '\u20AC15/mo', taaftSlug: 'avatars' },
  { id: 'newsletters', triggers: ['newsletter'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Write newsletters', bestTool: 'Claude + Resend/beehiiv', altTools: 'Kit, Mailchimp, Substack',
    youDo: 'Personal stories, review', setup: '15 min', cost: 'Free-$29/mo', taaftSlug: 'email-writing' },
  { id: 'content_cal', triggers: ['calendar'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Plan a month of content', bestTool: 'Claude + Notion', altTools: 'ChatGPT, Trello',
    youDo: 'Approve the calendar', setup: '30 min', cost: 'Free', taaftSlug: 'content' },
  { id: 'repurpose', triggers: ['video'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Repurpose long-form into clips', bestTool: 'Higgsfield Viral Clip Generator', altTools: 'Opus Clip',
    youDo: 'Pick which clips to post', setup: '10 min', cost: 'Varies', taaftSlug: 'video-editing' },
  { id: 'schedule_posts', triggers: ['social_posts', 'social_grow'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Schedule posts across platforms', bestTool: 'Orior (6 platforms)', altTools: 'Buffer, Later',
    youDo: 'Set schedule once', setup: '15 min', cost: 'Free-\u20AC15/mo', taaftSlug: 'social-media-management' },

  // ── Operations & Admin ──
  { id: 'followup_emails', triggers: ['email_followup', 'email_auto'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Draft follow-up emails', bestTool: 'Claude + Gmail', altTools: 'ChatGPT + manual send',
    youDo: 'Review, approve send', setup: '5 min', cost: 'Free', taaftSlug: 'email-writing' },
  { id: 'invoices', triggers: ['invoicing'], canAI: 'Yes, fully', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Generate invoices', bestTool: 'Claude /invoice skill', altTools: 'Stripe invoicing, Wave',
    youDo: 'Add line items, send', setup: '2 min', cost: 'Free', taaftSlug: 'finance' },
  { id: 'crm', triggers: ['contacts'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Track contacts/leads', bestTool: 'Notion, HubSpot (free)', altTools: 'Airtable, Google Sheets',
    youDo: 'Enter data (or auto-import)', setup: '30 min', cost: 'Free', taaftSlug: 'crm' },
  { id: 'calendar_mgmt', triggers: ['scheduling'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Manage calendar', bestTool: 'Google Calendar (MCP)', altTools: 'Cal.com, Apple Calendar',
    youDo: 'Define routines, AI creates events', setup: '10 min', cost: 'Free', taaftSlug: 'scheduling' },
  { id: 'expenses', triggers: ['bookkeeping'], canAI: 'Yes, with setup', level: 3, levelLabel: 'Draft + paste', levelIcon: 'yellow',
    title: 'Track expenses', bestTool: 'Xero', altTools: 'QuickBooks, Wave',
    youDo: 'Categorize, approve', setup: '15 min', cost: 'Free-$16/mo', taaftSlug: 'finance' },
  { id: 'contracts', triggers: ['contracts'], canAI: 'Partially', level: 3, levelLabel: 'Draft + paste', levelIcon: 'yellow',
    title: 'Create contracts/waivers', bestTool: 'Claude (draft) + Dropbox Sign', altTools: 'DocuSign, PandaDoc',
    youDo: 'Review legal language, send', setup: '30 min', cost: '$10-15/mo', taaftSlug: 'legal' },
  { id: 'task_mgmt', triggers: ['scheduling', 'delegation'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Manage tasks', bestTool: 'Todoist, Notion (MCP)', altTools: 'Trello, pen + paper',
    youDo: 'Decide priorities', setup: '10 min', cost: 'Free', taaftSlug: 'task-management' },

  // ── Analytics & Tracking ──
  { id: 'web_analytics', triggers: ['website'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Website traffic analytics', bestTool: 'Fathom', altTools: 'Plausible, Google Analytics',
    youDo: 'Interpret the data', setup: '10 min', cost: '$14/mo or free', taaftSlug: 'data' },
  { id: 'social_metrics', triggers: ['social_analytics'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Social media analytics', bestTool: 'Composio Instagram', altTools: 'Native IG/LinkedIn insights',
    youDo: 'Decide what to change', setup: '5 min', cost: 'Free', taaftSlug: 'social-media-analysis' },
  { id: 'revenue_track', triggers: ['revenue'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Revenue tracking', bestTool: 'Stripe (MCP)', altTools: 'Wave, Xero, spreadsheet',
    youDo: 'Review, plan ahead', setup: '5 min', cost: 'Free', taaftSlug: 'finance' },
  { id: 'ad_tracking', triggers: ['ad_perf'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Ad performance tracking', bestTool: 'Meta Ads (MCP)', altTools: 'Google Ads dashboard',
    youDo: 'Adjust budget/targeting', setup: '5 min', cost: 'Free', taaftSlug: 'ads' },
  { id: 'competitor_mon', triggers: ['competitors'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Competitor monitoring', bestTool: 'Firecrawl + Claude', altTools: 'SimilarWeb, manual',
    youDo: 'Decide how to respond', setup: '30 min', cost: 'Free', taaftSlug: 'competitive-analysis' },
  { id: 'weekly_summary', triggers: ['website', 'social_analytics', 'revenue', 'ad_perf', 'competitors'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Weekly business summary', bestTool: 'Claude Code (scheduled)', altTools: 'ChatGPT + manual review',
    youDo: 'Read it, act on insights', setup: '15 min', cost: '~$20/mo', taaftSlug: 'productivity' },

  // ── Automation & Scale ──
  { id: 'auto_post', triggers: ['content_auto'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Auto-post content daily', bestTool: 'Orior AI (6 platforms)', altTools: 'Buffer + Claude',
    youDo: 'Review weekly, adjust', setup: '30 min', cost: '\u20AC15/mo', taaftSlug: 'social-media-management' },
  { id: 'lead_monitor', triggers: ['lead_auto'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Monitor leads 24/7', bestTool: 'Claude Code triggers', altTools: 'n8n + Reddit/social APIs',
    youDo: 'Review alerts, respond', setup: '15 min', cost: '~$20/mo', taaftSlug: 'lead-generation' },
  { id: 'triggered_email', triggers: ['email_auto'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Send triggered emails', bestTool: 'Kit/ActiveCampaign', altTools: 'Resend + edge functions',
    youDo: 'Write the sequences once', setup: '1-2 hrs', cost: 'Free-$29/mo', taaftSlug: 'email' },
  { id: 'ig_autorespond', triggers: ['enquiry_auto'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Auto-respond to IG comments', bestTool: 'ManyChat', altTools: 'Manual',
    youDo: 'Set up keyword triggers', setup: '30 min', cost: 'Free', taaftSlug: 'customer-engagement' },
  { id: 'auto_reports', triggers: ['reporting'], canAI: 'Yes, fully', level: 5, levelLabel: 'Runs itself', levelIcon: 'green',
    title: 'Generate weekly reports', bestTool: 'Claude Code (scheduled)', altTools: 'n8n + data sources',
    youDo: 'Read and act on them', setup: '15 min', cost: '~$20/mo', taaftSlug: 'data' },
  { id: 'web_chat', triggers: ['enquiry_auto'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Auto-respond to website enquiries', bestTool: 'Intercom, Tidio, Crisp', altTools: 'ChatGPT embed, Chatbase',
    youDo: 'Define FAQs, review escalations', setup: '1-2 hrs', cost: 'Free-$29/mo', taaftSlug: 'customer-support' },
  { id: 'delegate_va', triggers: ['delegation'], canAI: 'No, human only', level: 0, levelLabel: 'Human only', levelIcon: 'red',
    title: 'Delegate to a VA', bestTool: 'Belay, Fiverr, local hire', altTools: 'Intern, assistant',
    youDo: 'Manage, train, review work', setup: '2-4 hrs', cost: '$500+/mo', taaftSlug: null },
  { id: 'workflows', triggers: ['content_auto', 'lead_auto', 'email_auto', 'reporting'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Build workflow automations', bestTool: 'n8n (visual builder)', altTools: 'Claude Code /loop',
    youDo: 'Design the workflow logic', setup: '1-4 hrs', cost: 'Free (self-hosted)', taaftSlug: 'task-automation' },

  // ── Retain/Grow (triggered by convert.retain) ──
  { id: 'post_event', triggers: ['retain'], canAI: 'Yes, with setup', level: 4, levelLabel: 'One-click', levelIcon: 'green',
    title: 'Post-event follow-up', bestTool: 'Kit/Resend sequences', altTools: 'WhatsApp group, Telegram',
    youDo: 'Write sequence once', setup: '1 hr', cost: 'Free-$29/mo', taaftSlug: 'email' },
  { id: 'testimonials', triggers: ['retain', 'referrals'], canAI: 'Partially', level: 2, levelLabel: 'AI assists', levelIcon: 'yellow',
    title: 'Collect testimonials', bestTool: 'Senja, VideoAsk', altTools: 'Typeform, Google Forms',
    youDo: 'Ask in-person right after event', setup: '30 min', cost: 'Free', taaftSlug: 'customer-engagement' },
  { id: 'community', triggers: ['retain'], canAI: 'Setup once', level: 1, levelLabel: 'Setup once', levelIcon: 'setup',
    title: 'Build a community', bestTool: 'WhatsApp group, Discord', altTools: 'Circle, Mighty Networks',
    youDo: 'Engage, moderate, set tone', setup: '30 min', cost: 'Free', taaftSlug: 'customer-engagement' },
]

/**
 * Build a TAAFT browse link based on user preferences
 */
export function buildBrowseLink(taaftSlug, budget = 'under200', platform = 'desktop') {
  if (!taaftSlug) return null
  const sort = { free: 'price', under50: 'price', under200: 'most-saved', unlimited: 'top-rated' }[budget] || 'most-saved'
  const prefix = { desktop: '', ios: 'ios/', android: 'android/', chatgpt: 'gpts/', chrome: 'chrome/' }[platform] || ''
  return `https://theresanaiforthat.com/${prefix}task/${taaftSlug}/${sort}/`
}

/**
 * Get capabilities matching selected drill-down keys, filtered by automation preference
 */
export function getMatchingCapabilities(selectedKeys, automationPref = 'all') {
  const pref = AUTOMATION_OPTIONS.find(o => o.key === automationPref)
  const minLevel = pref?.minLevel ?? 0
  const maxLevel = pref?.maxLevel ?? 5
  const seen = new Set()
  return CAPABILITIES.filter(cap => {
    if (seen.has(cap.id)) return false
    const matches = cap.triggers.some(t => selectedKeys.includes(t))
    if (!matches) return false
    if (cap.level < minLevel || cap.level > maxLevel) return false
    seen.add(cap.id)
    return true
  })
}
