---
title: "Newsletter Platform Options — Comparison"
project: "findmyflow"
audience: "external"
---

# Newsletter Platform Options — Comparison

## Option 1: Beehiiv (Original recommendation)
**Best for:** Pure newsletter creators who want built-in growth tools
- Free up to 2,500 subs
- Built-in referral program, recommendation network
- Nice editor, landing pages, analytics
- API exists for automation
- **Con:** Another platform to manage, another login, another thing
- **Sol integration:** Would need custom skill (~30 min to build)

## Option 2: Resend + Supabase (DIY — most control)
**Best for:** Builders who want total control and already use Supabase
- Free tier: 3,000 emails/month, 100 emails/day
- Simple REST API — Sol can send emails directly via `curl`
- Subscriber list lives in YOUR Supabase (you already need creds for FindMyFlow)
- Email templates in React Email or plain HTML
- ClawHub skill exists: `resend v0.1.0`
- **Con:** No built-in landing page, referral program, or analytics dashboard — you build those
- **Pro:** Earthquake Quiz already captures emails → same Supabase DB → Resend sends to them. One system.
- **Sol integration:** Install ClawHub `resend` skill, Sol drafts + sends via API

## Option 3: MailerLite
**Best for:** Small businesses wanting email marketing + automation + landing pages
- Free up to 1,000 subs, 12,000 emails/month
- Drag-and-drop editor, automations, landing pages
- Sell digital products built in
- ClawHub skill exists: `mailerlite v1.0.2`
- **Con:** Free tier caps at 1,000 subs (you'd hit it with 350 imports). Paid = $10/mo for 500+
- **Sol integration:** ClawHub skill ready to install

## Option 4: ConvertKit (now Kit)
**Best for:** Creators selling digital products + courses
- Free up to 10,000 subs (but limited features)
- Strong automation/sequences, tagging, commerce
- Used by most creator economy people
- No ClawHub skill — would need custom build
- **Con:** More complex than needed for a weekly letter
- **Pro:** You already have a Kit account (huzz.kit.com — the "Make Healing Fun Playbook" link on your Substack)

## Option 5: Gmail + OpenClaw Native (Zero new platforms)
**Best for:** Someone who wants NO new tools
- OpenClaw has native Gmail Pub/Sub support (docs at `/root/moltbot/docs/automation/gmail-pubsub.md`)
- Sol can send emails via Gmail directly using `gog` CLI
- Subscriber list in a simple file or Supabase table
- Sol drafts → sends via Gmail → tracks opens via pixel or link tracking
- **Con:** No unsubscribe management, no analytics dashboard, deliverability depends on Gmail limits (500/day for regular, 2000/day for Workspace)
- **Pro:** Zero new accounts. Zero new platforms. Sol handles everything.
- **Sol integration:** Already partially available — Gmail skill on ClawHub, OpenClaw Gmail Pub/Sub docs exist

## Option 6: Buttondown
**Best for:** Minimalists who want simple + Markdown-native
- Free up to 100 subs (paid $9/mo after that)
- Markdown-native (matches how Sol writes)
- API is clean and simple
- **Con:** Small free tier, less growth tools than Beehiiv
- No ClawHub skill

---

## Sol's Recommendation Matrix

| Factor | Beehiiv | Resend+Supa | MailerLite | Kit | Gmail Native | Buttondown |
|--------|---------|-------------|------------|-----|-------------|------------|
| Free at 350 subs | ✅ | ✅ | ❌ ($10/mo) | ✅ | ✅ | ❌ ($9/mo) |
| Sol can send via API | ✅ | ✅ | ✅ | ✅ | ⚠️ limits | ✅ |
| Built-in growth tools | ✅✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| No new platform needed | ❌ | ⚠️ (Supabase) | ❌ | ⚠️ (already have) | ✅ | ❌ |
| ClawHub skill exists | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Deliverability | ✅✅ | ✅✅ | ✅✅ | ✅✅ | ⚠️ | ✅ |
| Analytics/tracking | ✅✅ | DIY | ✅ | ✅ | DIY | ✅ |

*Created: 2026-02-13*
