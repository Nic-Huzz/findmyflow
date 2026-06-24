# /create Portal Automation Analysis

**Source:** Traffic Light Capability Map (`ai-team-hub/public/tree.html`)
**Date:** 2026-06-08
**Purpose:** Map the "Make More Money" and "Save More Time" decision trees against what the /create portal already has, and identify what could be automated on the platform.

---

## Make More Money vs /create Portal

### Get More Customers (4 phases)

| Tree Item | /create Status | Notes |
|-----------|---------------|-------|
| **Phase 1: Package Your Offer** | | |
| Value Stack Builder | **BUILT** | Offer flows (Attraction, Grand Slam, MoneyModelFlowBase) |
| Pricing & Guarantee | **BUILT** | PTUF Calculator + offer assessment |
| **Phase 2: Choose Your Hook** | | |
| 6 hook types (Decoy, Giveaway, etc.) | **PARTIAL** | Sales Playbook has Hormozi frameworks, but no hook scorer/picker flow |
| **Phase 3: Pick Your Channels** | | |
| Instagram Posts | **BUILT** | Content Generator + Content Queue |
| LinkedIn Posts | **BUILT** | Content Generator + Content Queue |
| Blog / SEO | **BUILT** | Content Generator supports it |
| Email (Warm Outreach) | **BUILT** | Warm Outreach page + Email Sequences |
| Cold Email | **NOT BUILT** | No outbound cold email system |
| LinkedIn DMs | **NOT BUILT** | No DM automation |
| Newsletter | **NOT BUILT** | No email sending integration |
| Meta Ads / Google Ads | **NOT BUILT** | No ad management |
| **Phase 4: Create & Send** | | |
| Campaign Plan | **BUILT** | Content Planning Flow + Marketing Quest Board |
| Draft & Review | **BUILT** | Content Create + Approval Queue |
| Send & Track | **PARTIAL** | Content Queue exists, but no actual sending (no Postiz/Buffer integration) |

### Earn More Revenue

| Tree Item | /create Status | Notes |
|-----------|---------------|-------|
| Upsell (4 types) | **BUILT** | UpsellFlow + Implementation Tracker + templates |
| Downsell (3 types) | **BUILT** | DownsellFlow + Implementation Tracker |
| Continuity (6 types) | **BUILT** | ContinuityFlow + Implementation Tracker |

**Make More Money score: ~22 of 30 items built or partially built**

---

## Save More Time vs /create Portal

| Tree Item | /create Status | What it would take |
|-----------|---------------|-------------------|
| **Drowning in Admin** | | |
| Xero / QuickBooks | **NOT BUILT** | OAuth integration, expense sync |
| Calendly | **NOT BUILT** | OAuth, booking sync to experiences |
| Custom Tools | **PARTIAL** | Expenses page exists, but basic |
| **Losing Track of Leads** | | |
| HubSpot | **NOT NEEDED** | CRM already built natively! |
| Gmail Follow-ups | **NOT BUILT** | Gmail MCP exists but not wired to CRM |
| Email Sequences | **BUILT** | Full sequence builder exists |
| **Don't Know What's Working** | | |
| Stripe Analytics | **NOT BUILT** | Subscription data exists but no analytics |
| Google Analytics | **NOT BUILT** | No integration |
| Dashboard | **BUILT** | CRM Dashboard + Reports + Analytics + Smart Alerts |
| **Quoting / Invoicing** | | |
| Square | **NOT BUILT** | No integration |
| Invoice Ninja | **NOT BUILT** | No integration |
| Custom Quoting | **NOT BUILT** | No quoting tool |

**Save More Time score: ~3 of 12 items built**

---

## Functions That Could Be Automated on the Platform

### High-value (already have the data, just need wiring)

1. **Hook Scorer Flow** - Hormozi offer frameworks already exist in Sales Playbook. A 5-min flow that scores which of the 6 hooks fits their offer best, then auto-generates the hook copy.

2. **Gmail Follow-up Automation** - Gmail MCP access exists. Wire CRM contacts with "needs follow-up" status to draft follow-up emails automatically.

3. **Stripe Revenue Dashboard** - Users already have Stripe subscriptions. Pull Stripe data into the existing Analytics/Reports page for real revenue tracking.

4. **Calendly/Cal.com Booking Sync** - When someone creates an experience, auto-create a booking link and sync RSVPs back as contacts. Closes the loop between Experiences tab and Contacts.

5. **Post-Experience Email Sequence** - Auto-trigger a nurture sequence when an experience is marked "completed". The email sequence builder exists, just needs the trigger.

### Medium-value (new but buildable)

6. **Invoice Generator** - Experience creators need to invoice for private events/corporate. Simple invoice builder using their offer data (pricing already captured in PTUF).

7. **Content Auto-Schedule** - Content Queue exists but doesn't actually post. Adding Postiz/Buffer API would make the Content Generator end-to-end.

8. **Expense Sync** - Connect Xero/QuickBooks to auto-populate the Expenses page and P&L view.

9. **Smart Campaign Builder** - Combine Phase 3 (channel picker) + Phase 4 (create & send) into one guided flow: "I have an experience in 3 weeks, fill the room" -> auto-generates a multi-channel campaign plan.

---

## Summary

| Category | Tree Items | Already Built | Could Automate | Total Addressable |
|----------|-----------|--------------|---------------|-------------------|
| Make More Money | 30 | 18 | 6 | 24/30 (80%) |
| Save More Time | 12 | 3 | 7 | 10/12 (83%) |
| **Total** | **42** | **21** | **13** | **34/42 (81%)** |

21 already built, 13 more automatable = 34 of 42 capabilities (81%) could live in /create. The biggest gaps are external integrations (Xero, Calendly, Stripe analytics, Gmail sending, social posting). The "Make More Money" side is mostly done. The "Save More Time" side is where the platform has the most room to grow.
