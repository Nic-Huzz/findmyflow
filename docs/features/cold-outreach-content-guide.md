---
type: feature-brief
status: planned
created: 2026-07-08
---

# Cold Outreach + Content Generation Guide

## 1. Cold Email Templates

### Structure
- Founder in email signature
- Under 100 words
- No links or open tracking
- Format: Reason → Value prop → Ask

### Email 1 (Cold)
```
Subject: [their business] + silent disco headphones

Hi [Name],

I saw [reason — something specific about their business].

[Value prop — 1 sentence on what you offer and why it fits].

Can I send you the pricing sheet to open for when the time is right?

Best,
Nic
Founder, Vibe Rise
```

### Email 2 (Pricing follow-up)
Triggered when they reply or open. Attach pricing sheet + ask:
"Are you considering buying sometime in the next 6 months?"

### Email 3 (Soft follow-up)
If no reply to Email 1 after 5 days. Different angle, same structure.

## 2. Content Generation Guide (Story Framework)

Uses the story stages from Content Intel analysis:
1. Normal — the old, stuck, or "before" version
2. Desire + Challenge — what they wanted, what blocked it
3. Enter the Unfamiliar — the decision to do the scary thing
4. Adapt Through Adversity — the messy hard middle
5. Attaining Desire — getting it, but it cost something real
6. Return Changed — same place, now different
7. New Normal — who they are now
8. Turn to Viewer — reminder, question, or invitation

## 3. Where to build

### Cold email: `/crm/email-sequences` (existing)
- Email sequence builder already exists with steps
- Add "Cold Outreach" template preset with the 2-3 email structure
- Enforce the rules (word count, no links, founder sig) as defaults

### Content guide: `/crm/content-create` (existing)
- Content Generator already exists
- Add story framework as a selectable structure template
- Pre-fill the 8 stages as section prompts
