# Vibe Rise Fest — Post-Event Email Sequence

## Context

85 attendees from Vibe Rise Festival (May 17, 2026) + Sydney Zuckerman (test) = 86 recipients.
All tagged `Vibe Rise Fest May 2026` in `crm_contacts` (user_id: `ebe69854-2ebd-4236-a437-3a362f5e1af4`).

**Sending method:** Resend API, individually addressed (no BCC). From: `Huzz <huzz@nichuzz.com>`, reply-to: `huzz@nichuzz.com`.

**SPF fix applied June 14:** Added `include:send.resend.com` to SPF record. All emails before this date likely went to spam.

**Open/click tracking:** Enable in Resend dashboard settings (was off previously).

---

## Sequence

### Email 1 — SENT (June 14)
**Subject:** Vibe Rise Festival Videos Are Here

Videos + photos + spam apology. Already sent to all 86.

---

### Email 2 — Day 3: Vibe Rise App
**Subject:** The app behind Vibe Rise

```
Hey Vibe Riser!

For anyone who loved that "Vibe Rise" feeling, I believe it's a state we can train. One we can design our experiences and life around.

**I've been building an app that gamifies the journey.**

It helps you identify what lights you up, what drains you, and how to build more of the good stuff into your daily life.

The first thing you do is discover your **Essence Voice**, the version of you that existed before the world told you who to be. Think of it like a personality test, but for the part of you that comes alive when you feel safe.

From there the app tracks your **Vibe Rise score**, a daily measure of how much safety and expression you're building into your life.

It's free. It's early. And I'd love your feedback.

**[Discover your Essence Voice](https://viberise.nichuzz.com/try/essence-mirror)**

P.S. In case you missed it, here are the **[videos](https://drive.google.com/drive/folders/18_OP6DGxR4_4e5hVanaevGS4gsEqs0FA)** and **[photos](https://drive.google.com/drive/folders/1WyKj0urYTVvle4QXmOwxgxvsnnfaRfS4)** from the festival.

Best,
Huzz 🌞
```

---

### Email 3 — Day 6: Headsets Promo
**Subject:** 5 free headsets this week only

```
Hey Vibe Riser!

You may have noticed increasingly all the best transformational wellness experiences are using headsets: 9D Breathwork, Sanctum, DayBreaker, Vibe Rise ;)

I'm a big believer this is because:

**1. Safety = transformation.** Headsets create a private cocoon. When someone is in breathwork or deep release, outside noise pulls them out. The isolation keeps them in. And when people feel safe, that's when the real shifts happen.

**2. Deeper immersion.** Every whisper, every beat, every guided cue lands directly. No dead spots, no one at the back who can't hear. Everyone in the room gets a high quality experience, not just the front row.

**3. You can run events anywhere.** Beach, rooftop, park, villa. No speakers, no noise complaints, no venue restrictions. Your event becomes location-independent.

**This week only, I'm including 5 free headsets with anyone who places an order.**

If you're keen to learn more, check them out here:

**[buysilentdiscoheadphones.com](https://buysilentdiscoheadphones.com)**

Or just reply to this email and I'll answer any questions.

P.S. Here are the **[videos](https://drive.google.com/drive/folders/18_OP6DGxR4_4e5hVanaevGS4gsEqs0FA)** and **[photos](https://drive.google.com/drive/folders/1WyKj0urYTVvle4QXmOwxgxvsnnfaRfS4)** from the festival.

Best,
Huzz 🌞
```

---

### Email 4 — Day 9: Shift Architecture
**Subject:** The method behind what you felt at Vibe Rise

```
Hey Vibe Riser!

You know that feeling during the festival... the moment where you felt free, empowered, alive.

**That wasn't an accident. There's a method behind it.**

I've spent the last two years developing a framework called **Shift Architecture.**

It's based on the only scientifically proven process for **permanently rewiring emotional patterns.** Not coping with them. Rewriting them to create lasting shifts.

If you loved the experiences at the festival and want to create your own:

**I'm training the next cohort of facilitators** who want to learn to design experiences like the ones you just had.

Not following a script. **Learning the science of WHY it works** so you can build your own experiences for your own people.

Unlike other trainings where you get trained in one modality, you will learn how to deliver **conscious connected breathwork, dance and NLP guided visualisations.**

The power of learning the Shift Architecture method is **it can be applied to any healing modality.**

So over time as your curiosities and expertise evolve, your experiences can too.

If you felt something at the festival and your first thought was **"I want to learn how to do that for other people,"** this is for you.

Reply to this email if you want to chat about it.

P.S. Here are the **[videos](https://drive.google.com/drive/folders/18_OP6DGxR4_4e5hVanaevGS4gsEqs0FA)** and **[photos](https://drive.google.com/drive/folders/1WyKj0urYTVvle4QXmOwxgxvsnnfaRfS4)** from the festival.

Best,
Huzz 🌞
```

---

## How to Send

Use the Resend API key (`re_Bqb6jZmm_4ZWHGcekb5rqXUbSJvT3TG6P`) to send individually to each recipient. Python script pattern:

```python
import json, subprocess, time

# Fetch emails from CRM:
# SELECT lower(email) FROM crm_contacts
# WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
# AND 'Vibe Rise Fest May 2026' = ANY(tags) AND email IS NOT NULL

for email in emails:
    payload = json.dumps({
        "from": "Huzz <huzz@nichuzz.com>",
        "to": email,
        "reply_to": "huzz@nichuzz.com",
        "subject": "SUBJECT HERE",
        "html": "HTML BODY HERE"
    })
    subprocess.run([
        "curl", "-s", "-X", "POST", "https://api.resend.com/emails",
        "-H", "Authorization: Bearer re_Bqb6jZmm_4ZWHGcekb5rqXUbSJvT3TG6P",
        "-H", "Content-Type: application/json",
        "-d", payload
    ])
    time.sleep(0.1)  # Rate limit buffer
```

## Key Links

- Videos: https://drive.google.com/drive/folders/18_OP6DGxR4_4e5hVanaevGS4gsEqs0FA
- Photos: https://drive.google.com/drive/folders/1WyKj0urYTVvle4QXmOwxgxvsnnfaRfS4
- Essence Mirror (public): https://viberise.nichuzz.com/try/essence-mirror
- Headsets: https://buysilentdiscoheadphones.com
- App signup: https://viberise.nichuzz.com/get-started

## Notes

- Always send test to nichurrell@me.com first
- sydneyzuckerman@gmail.com is on the list as a delivery canary
- Never use BCC batches (caused bounces previously)
- Markdown bold (`**text**`) needs converting to `<strong>` tags in HTML
- All links should use `style="color: #5e17eb; text-decoration: none;"` for brand purple

## Unfinished / Follow-ups

- **Email 2 not sent yet.** Test `/try/essence-mirror` with a real user before sending. Route is live but unverified end-to-end.
- **Leaderboard "Join Now"** — fest group (`bbbbbbbb-0000-0000-0000-000000000001`) was created in DB but the button hasn't been verified working.
- **RP bar fix** — the `increment_scores` RPC was fixed via direct SQL (May 16). Needs a proper migration file added to `supabase/migrations/` or it could be overwritten by `db push`.
- **Resend open/click tracking** — must be enabled at [resend.com/settings](https://resend.com/settings). Currently off, so we have zero visibility on email engagement.

## Recommendations

### Email Deliverability
- **Domain warmup needed.** Previous emails (before June 14 SPF fix) likely damaged sender reputation with Gmail/Outlook. Send consistently in small volumes (86 fest list) over the next few weeks before blasting the full 497 CRM list.
- **Monitor bounce/complaint rates** after enabling Resend tracking. If bounce rate exceeds 5%, pause and clean the list.
- **Consider adding a DMARC `rua` reporting service** (e.g. Postmark DMARC, dmarcian) to get visibility into who's rejecting your emails and why.

### App / Technical
- **Migrate `increment_scores` RPC to a migration file.** It was deployed directly to production DB. If migrations are re-run, the old broken version could overwrite it. Create `supabase/migrations/YYYYMMDD_fix_increment_scores.sql` with the correct function.
- **Remove any leftover `console.log` debug statements** from ChallengeHeader.jsx (RP debug logs were added during troubleshooting).
- **The CRM newsletter send flow** (`send-newsletter` edge function) sends one email per recipient properly. Future bulk emails should go through this rather than manual curl scripts for better tracking and DB logging.

### Growth
- **`/try/essence-mirror` is a lead magnet.** Use it in Instagram bio, LinkTree, and future email CTAs. Every completion captures an email + archetype data in `public_leads`.
- **Link public leads to signups.** When a user creates an account with an email that exists in `public_leads`, their essence mirror data should auto-populate. This migration logic isn't built yet.
- **Next Vibe Rise Fest.** Use Email 4 (Shift Architecture) replies to identify facilitator training prospects. These are your highest-intent leads.
