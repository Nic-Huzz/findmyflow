/**
 * Send Workshop Profile Edge Function
 *
 * Sends Healing Compass workshop results email via Resend.
 * Stores submission in workshop_submissions table.
 * Sends notification to admin.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_EMAIL = 'huzz@nichuzz.com'
const CTA_URL = 'https://findmyflow.nichuzz.com'

// ── Workshop content (canonical source: src/data/workshopContent.js) ────────

const EMOTIONAL_NEEDS: Record<string, { name: string; description: string }> = {
  'life-design': { name: 'Life Design', description: "I need to feel like I have choices and control over my own path." },
  'connection': { name: 'Connection', description: "I need to feel seen, loved, and like I belong." },
  'mastery': { name: 'Mastery', description: "I need to feel like I'm growing, learning, and getting better." },
  'meaning': { name: 'Meaning', description: "I need to feel like my life matters and I'm contributing to something bigger." },
}

const PROTECTIVE_PATTERNS: Record<string, { name: string; description: string }> = {
  'controller': { name: 'The Controller', description: "Manages everything. Controls outcomes and image. Leaving it to chance isn't an option." },
  'ghost': { name: 'The Ghost', description: "Withdraws. Disappears. Doesn't feel comfortable sharing." },
  'perfectionist': { name: 'The Perfectionist', description: "Gas and brake at the same time. Not ready yet. Delays and overthinks." },
  'auto-pilot': { name: 'The Auto-Pilot', description: "Goes through the motions. Checked out. Fine, just tired." },
  'people-pleaser': { name: 'The People Pleaser', description: "Says yes to everything. As long as everyone's happy, they're safe." },
  // Legacy alias
  'performer': { name: 'The Controller', description: "Manages everything. Controls outcomes and image. Leaving it to chance isn't an option." },
}

const FOUR_RS = [
  { name: 'Recognise', description: "Notice the pattern. Name the protective voice. See when it activates." },
  { name: 'Release', description: "Let the body process. Breathwork, shaking, somatic release." },
  { name: 'Rewire', description: "Create the new story. Reframe the belief. Build the new neural pathway." },
  { name: 'Reconnect', description: "Return to the younger self. Give them what they needed. Integration." },
]

// Essence archetype profiles (8 workshop archetypes)
const ESSENCE_PROFILES: Record<string, any> = {
  "Radiant Rebel": {
    group: "Activator",
    poetic_line: "You are fire with a heartbeat, designed to disrupt what's false and awaken what's real.",
    superpower: "You ignite courage in the quiet. You say what others won't and move like fire through what feels stuck.",
    north_star: "Use rebellion to liberate, not just provoke. Let your why guide your wow.",
    energetic_transmission: "You electrify the space. Your energy activates boldness — like truth wants to break free through your presence.",
    recognition_pattern: "People seek you when they're ready to break rules, burn masks, and step into unapologetic self-expression.",
    inner_child_desire: "I wanted to lead the make-believe revolution, rally your crew, and challenge the rules just because you could.",
    essence_wound: "People said 'You're too intense. Calm down.' You internalised this to mean your passion made you dangerous — so you learned to dim it to fit in.",
    characters: ["Deadpool", "Billie Eilish", "Katniss Everdeen"],
    vision_in_action: "You turn chaos into clarity, sparking revolutions with nothing but your voice."
  },
  "Playful Creator": {
    group: "Activator",
    poetic_line: "You are joy in motion, color that moves, laughter that builds, a spark dressed in creativity.",
    superpower: "You alchemize boredom into magic. You make joy contagious, creativity safe, and weirdness welcome.",
    north_star: "Channel your joy into containers that scale. Play can be the portal to mastery.",
    energetic_transmission: "When you're free, joy crackles through the air. You awaken play, laughter, and lightness just by being.",
    recognition_pattern: "People come to you when things feel too serious — because your presence gives permission to let go and have fun.",
    inner_child_desire: "I wanted to turn everything into a game or invention — joy was my way of connecting.",
    essence_wound: "People said 'Stop being silly. Grow up.' You internalised this to mean your lightness was seen as immaturity — so you learned to be serious to fit in.",
    characters: ["Spider-Man", "Robin Williams", "Willy Wonka"],
    vision_in_action: "You turn pressure into play and make innovation feel like recess for the soul."
  },
  "Sacred Jester": {
    group: "Activator",
    poetic_line: "You are the joke that reveals the truth. The giggle that breaks the pattern. The dance that interrupts the shame.",
    superpower: "You disarm defenses with humor. You reveal truth in the ridiculous and help others feel safe being real.",
    north_star: "Play with power, don't perform it. Let irreverence be reverent.",
    energetic_transmission: "Around you, people exhale. Pretenses drop. They remember it's safe to be weird and real.",
    recognition_pattern: "You're the one who sees truth through chaos, laughter through pain — and somehow says what no one else can.",
    inner_child_desire: "I loved saying the outrageous thing or making people laugh — I couldn't help but stir the pot.",
    essence_wound: "People said 'Why can't you just be normal?' You internalised this to mean your wildness made others uncomfortable, so you made yourself the joke as a way to express and to fit in.",
    characters: ["Jim Carrey", "Star-Lord", "Jack Sparrow"],
    vision_in_action: "You drop unexpected one-liners that dismantle shame and unzip joy."
  },
  "Wild Alchemist": {
    group: "Transmuter",
    poetic_line: "You are permission, uncaged, untamed, undeniable. Your truth liberates others from their own.",
    superpower: "You transmute chaos into meaning. You give pain purpose and help people rebirth themselves.",
    north_star: "Let your full expression lead. Alchemy needs fire.",
    energetic_transmission: "You pulse with emotional depth. Chaos feels sacred around you — like it's allowed to become something beautiful.",
    recognition_pattern: "You're the one others come to for transformation. You don't fix — you help them burn and rise.",
    inner_child_desire: "I felt everything — and I wanted to turn it into art, expression, or healing for others.",
    essence_wound: "People said 'You're too emotional. Stop making everything a big deal.' You internalised this to mean you were shamed for your care instead of celebrated for your sensitivity — so you learned to suppress your emotions to fit in.",
    characters: ["Tony Stark (Iron Man)", "David Bowie", "Elizabeth Gilbert"],
    vision_in_action: "Where others flinch from fire, you dance in it — turning pain into art and rupture into truth."
  },
  "Heart Holder": {
    group: "Stabiliser",
    poetic_line: "You are the quiet gravity — the heartbeat that steadies the storm.",
    superpower: "You co-regulate rooms. With you, breath slows, shoulders drop, and real work can land.",
    north_star: "Hold with warmth and boundaries. Care that preserves dignity, not dependency.",
    energetic_transmission: "A settling wave. Voices soften, hearts unclench, belonging rises — people can be real again.",
    recognition_pattern: "People seek you when the team is brittle, burnt out, or spinning from conflict.",
    inner_child_desire: "I wanted to be the safe place — the friend who made everyone feel okay to be themselves.",
    essence_wound: "People said 'You're too sensitive. Stop babying people.' You internalised this to mean your care wasn't wanted, so you learned to keep to yourself to fit in.",
    characters: ["Ted Lasso", "Uncle Iroh", "Samwise Gamgee"],
    vision_in_action: "In tense moments you become the calm center; the room syncs, hard conversations land, and people leave more regulated than they arrived."
  },
  "Cosmic Connector": {
    group: "Bridger",
    poetic_line: "You are the thread between worlds — weaving the mystical into the practical, the unseen into form.",
    superpower: "You weave worlds. You connect the mystical and the practical, helping others make sense of the big and strange.",
    north_star: "Don't dilute your range to fit in. Your synthesis is the spell.",
    energetic_transmission: "You align chaos into coherence. Ideas land. Emotions make sense. The unseen becomes useful.",
    recognition_pattern: "People turn to you to translate the mystical into something practical — you're the in-between.",
    inner_child_desire: "I'd create blueprints, mix magic potions, and explain made-up universes to anyone who'd listen.",
    essence_wound: "People said 'That's not true. How can you prove it?' You internalised this to mean your magic wasn't real, so you learned to keep quiet to fit in.",
    characters: ["Doctor Strange", "Rick Rubin", "Gandalf"],
    vision_in_action: "You take quantum truths and translate them into tools, blueprints, and rituals that land."
  },
  "Compassionate Leader": {
    group: "Bridger",
    poetic_line: "You are a walking hearth, steady, warm, and fiercely kind. When you speak, people remember who they are.",
    superpower: "You hold the center when things shake. You make people feel seen, safe, and ready to rise.",
    north_star: "Lead from wholeness, not over-responsibility. Trust others can rise too.",
    energetic_transmission: "People rise around you — they feel seen, supported, and called into their power. You don't shout to lead. You hold firm, and others remember their strength.",
    recognition_pattern: "You're the one people turn to when they're overwhelmed but ready to rise. They trust you to meet their chaos with calm — and to remind them what they're capable of.",
    inner_child_desire: "You would've organized the talent show, made sure everyone got a turn, and stepped back to clap the loudest.",
    essence_wound: "People said 'You're too controlling. Worry about yourself.' You internalised this to mean you weren't helpful — so you learned to withdraw to fit in.",
    characters: ["Mufasa (Lion King)", "Captain America", "Brené Brown"],
    vision_in_action: "Your grounded presence becomes a gravitational field where others remember their power."
  },
  "Truth-Teller": {
    group: "Transmuter",
    poetic_line: "You are the sentence that slices through the noise. The call-out and the call-home. Clarity made human.",
    superpower: "You crack illusions with precision. You speak the sharp truth wrapped in unexpected tenderness.",
    north_star: "Say the thing others won't. Truth is love wearing its boldest clothes.",
    energetic_transmission: "Around you, everything sharpens. Emotional fog lifts. Your presence calls forth honesty — even the kind that trembles.",
    recognition_pattern: "People find you when something needs to be named. You hold the words they've been afraid to say.",
    inner_child_desire: "I'd write secret stories, ask raw questions, and share the truths that others tiptoed around.",
    essence_wound: "People said 'Stop being so direct.' You internalised this to mean your honesty was seen as negative, so you learned to sugarcoat your truth and keep to yourself to fit in.",
    characters: ["Yoda", "Ricky Gervais", "Lady Gaga"],
    vision_in_action: "You speak what no one else will and somehow it lands like liberation, not attack."
  }
}

// ── Brand tokens ────────────────────────────────────────────────────────────

const B = {
  purple: '#5e17eb',
  purpleLight: '#7c3aed',
  purpleTint: '#f8f5ff',
  gold: '#E9A23B',
  white: '#ffffff',
  warmGray: '#f8f9fa',
  softGray: '#e9ecef',
  textGray: '#495057',
  mutedGray: '#adb5bd',
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif",
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

const divider = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td align="center">
      <span style="color:${B.gold};font-size:18px;letter-spacing:12px;">&#10022; &#10022; &#10022;</span>
    </td></tr>
  </table>`

const card = (title: string, body: string, icon?: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
    <tr><td style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:20px 22px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:8px;">
          <span style="color:${B.gold};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:${B.font};">${icon ? icon + '&ensp;' : ''}${title}</span>
        </td></tr>
        <tr><td style="color:${B.textGray};font-size:15px;line-height:1.7;font-family:${B.font};">
          ${body}
        </td></tr>
      </table>
    </td></tr>
  </table>`

function emailShell(content: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your Healing Compass Results</title>
  </head>
  <body style="margin:0;padding:0;background-color:${B.softGray};-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.softGray};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${B.white};border-radius:16px;overflow:hidden;">
        ${content}
      </table>
    </td></tr>
  </table>
  </body></html>`
}

// ── Email builder ───────────────────────────────────────────────────────────

function buildWorkshopEmail(
  userName: string,
  needKey: string,
  action: string,
  patternKey: string,
  archetypeName: string,
  newBelief: string,
  letterPhotoUrl: string | null
): string {
  const need = EMOTIONAL_NEEDS[needKey]
  const pattern = PROTECTIVE_PATTERNS[patternKey]
  const archetype = ESSENCE_PROFILES[archetypeName] || null

  if (!need || !pattern) {
    throw new Error('Invalid selection keys')
  }

  // Archetype section — just name + CTA to learn more
  const archetypeSection = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td align="center" style="padding-bottom:12px;">
          <h2 style="margin:0;color:${B.purple};font-size:24px;font-weight:700;font-family:${B.font};">${esc(archetypeName)}</h2>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td align="center">
          <p style="margin:0 0 16px;color:${B.textGray};font-size:15px;line-height:1.6;font-family:${B.font};">
            Keen to learn more about your essence archetype?
          </p>
          <a href="${CTA_URL}/archetypes/essence" style="display:inline-block;padding:12px 32px;background:${B.gold};color:${B.white};font-size:14px;font-weight:700;text-decoration:none;border-radius:32px;font-family:${B.font};">
            Explore Your Archetype &rarr;
          </a>
        </td></tr>
      </table>`

  return emailShell(`
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,${B.purple} 0%,${B.purpleLight} 100%);padding:44px 30px 36px;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding-bottom:12px;">
          <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;font-family:${B.font};">&#10022;&ensp; Healing Compass Workshop &ensp;&#10022;</span>
        </td></tr>
        <tr><td align="center">
          <h1 style="margin:0;color:${B.gold};font-size:28px;font-weight:700;font-family:${B.font};">Your Workshop Results</h1>
        </td></tr>
        <tr><td align="center" style="padding:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;font-family:${B.font};">
          Prepared for ${esc(userName)}
        </td></tr>
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:32px 32px 0;">

      <!-- Your Answers -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="color:${B.purple};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Your Answers</span>
        </td></tr>
      </table>

      ${card('Your Core Need: ' + esc(need.name), esc(need.description), '&#128156;')}
      ${card('Your Protective Pattern: ' + esc(pattern.name), esc(pattern.description), '&#128737;')}
      ${action.trim() ? card('Your Commitment', esc(action.trim()), '&#10024;') : ''}

      ${divider}

      <!-- Essence Archetype -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="color:${B.purple};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Your Essence Archetype</span>
        </td></tr>
      </table>

      ${archetypeSection}

      ${divider}

      <!-- The 4R's -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="color:${B.purple};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">The 4R Framework</span>
        </td></tr>
      </table>

      ${FOUR_RS.map((r, i) => card(`${i + 1}. ${r.name}`, esc(r.description))).join('')}

      ${divider}

      <!-- Future Self Letter -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="color:${B.purple};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Your Future Self Letter</span>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="border-left:3px solid ${B.gold};padding:20px 24px;background:${B.purpleTint};border-radius:0 8px 8px 0;">
          <p style="margin:0 0 16px;color:${B.textGray};font-size:15px;line-height:1.8;font-family:${B.font};">
            Dear ${esc(userName)},
          </p>
          <p style="margin:0 0 16px;color:${B.textGray};font-size:15px;line-height:1.8;font-family:${B.font};">
            Today I discovered that my core emotional need is <strong style="color:${B.purple};">${esc(need.name)}</strong> &mdash; and that when it's not met, I've been using <strong style="color:${B.purple};">${esc(pattern.name)}</strong> to protect myself.
          </p>
          <p style="margin:0 0 16px;color:${B.textGray};font-size:15px;line-height:1.8;font-family:${B.font};">
            The truth is, ${esc(pattern.name)} kept me safe when I was younger. But I don't need that armour anymore.
          </p>
          ${action.trim() ? `<p style="margin:0 0 16px;color:${B.textGray};font-size:15px;line-height:1.8;font-family:${B.font};">
            When the ${esc(pattern.name)} shows up, I will remember to <strong style="color:${B.purple};">${esc(action.trim())}</strong>.
          </p>` : ''}
          <p style="margin:0 0 16px;color:${B.textGray};font-size:15px;line-height:1.8;font-family:${B.font};">
            You are a <strong style="color:${B.purple};">${esc(archetypeName)}</strong>${archetype ? ` &mdash; <em>${esc(archetype.poetic_line)}</em>` : ''}
          </p>
          <p style="margin:0;color:${B.textGray};font-size:15px;font-style:italic;font-family:${B.font};">
            With love,<br>${esc(userName)}
          </p>
        </td></tr>
      </table>

      ${newBelief.trim() ? `
      ${divider}

      <!-- New Belief -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="color:${B.purple};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Your New Truth</span>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="border-left:3px solid ${B.gold};padding:16px 24px;background:${B.purpleTint};border-radius:0 8px 8px 0;">
          <p style="margin:0;color:${B.purple};font-size:17px;font-style:italic;line-height:1.7;font-family:${B.font};">&ldquo;${esc(newBelief.trim())}&rdquo;</p>
        </td></tr>
      </table>
      ` : ''}

      ${letterPhotoUrl ? `
      ${divider}

      <!-- Letter Photo -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr><td align="center" style="padding-bottom:16px;">
          <span style="color:${B.purple};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Your Handwritten Letter</span>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td align="center">
          <img src="${letterPhotoUrl}" alt="Your handwritten letter" style="max-width:100%;border-radius:12px;border:1px solid ${B.softGray};" />
        </td></tr>
      </table>
      ` : ''}

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:0 20px 8px;color:${B.textGray};font-size:15px;line-height:1.6;font-family:${B.font};">
          Ready to go deeper? FindMyFlow has tools<br>to help you live from your essence every day.
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 24px;">
        <tr><td align="center">
          <a href="${CTA_URL}" style="display:inline-block;padding:16px 44px;background:${B.gold};color:${B.white};font-size:16px;font-weight:700;text-decoration:none;border-radius:32px;font-family:${B.font};letter-spacing:0.3px;">
            Explore FindMyFlow &rarr;
          </a>
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:16px 0 8px;">
          <span style="color:${B.gold};font-size:18px;letter-spacing:12px;">&#10022;</span>
        </td></tr>
        <tr><td align="center" style="padding:0 0 6px;color:${B.mutedGray};font-size:12px;font-family:${B.font};">
          FindMyFlow &mdash; Healing Compass Workshop
        </td></tr>
        <tr><td align="center" style="padding:0 0 24px;">
          <a href="${CTA_URL}" style="color:${B.purple};text-decoration:none;font-size:12px;font-family:${B.font};">findmyflow.nichuzz.com</a>
        </td></tr>
      </table>

    </td></tr>
  `)
}

// ── Notification email ──────────────────────────────────────────────────────

function buildNotificationEmail(email: string, name: string, need: string, pattern: string, archetype: string): string {
  const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#5e17eb,#7c3aed);padding:24px 30px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;">Workshop Submission</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Healing Compass Landing Page</p>
    </div>
    <div style="background:#f9fafb;padding:24px 30px;border-radius:0 0 16px 16px;">
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-bottom:12px;">
        <p style="margin:6px 0;color:#374151;font-size:16px;"><strong>${name}</strong></p>
        <p style="margin:6px 0;color:#5e17eb;font-size:16px;">${email}</p>
        <p style="margin:6px 0;color:#374151;font-size:14px;">Need: <strong>${need}</strong></p>
        <p style="margin:6px 0;color:#374151;font-size:14px;">Pattern: <strong>${pattern}</strong></p>
        <p style="margin:6px 0;color:#374151;font-size:14px;">Archetype: <strong>${archetype}</strong></p>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:right;">${timestamp} AEST</p>
    </div>
  </div>`
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, emotionalNeed, action, protectivePattern, essenceArchetype, newBelief, letterPhotoUrl } = await req.json()

    if (!name || !email || !emotionalNeed || !protectivePattern || !essenceArchetype) {
      return new Response(
        JSON.stringify({ error: 'name, email, emotionalNeed, protectivePattern, and essenceArchetype are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate photo URL is from our storage bucket if provided
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (letterPhotoUrl && supabaseUrl && !letterPhotoUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/workshop-photos/`)) {
      return new Response(
        JSON.stringify({ error: 'Invalid photo URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Build email
    const profileHtml = buildWorkshopEmail(name, emotionalNeed, action || '', protectivePattern, essenceArchetype, newBelief || '', letterPhotoUrl || null)
    const subject = `Your Healing Compass Results — ${essenceArchetype}`

    // Store submission
    if (supabaseUrl && supabaseServiceKey) {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/workshop_submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          name,
          email,
          emotional_need: emotionalNeed,
          action_commitment: action || null,
          protective_pattern: protectivePattern,
          essence_archetype: essenceArchetype,
          letter_photo_url: letterPhotoUrl || null,
          new_belief: newBelief || null,
          email_sent: !!resendApiKey,
        }),
      })

      if (!insertRes.ok) {
        console.error('DB insert error:', await insertRes.text())
      }
    }

    // Send emails
    if (resendApiKey) {
      // Fetch photo and attach as downloadable file
      const attachments: any[] = []
      if (letterPhotoUrl) {
        try {
          const photoRes = await fetch(letterPhotoUrl)
          if (photoRes.ok) {
            const photoBuffer = new Uint8Array(await photoRes.arrayBuffer())
            // Chunk the base64 encoding to avoid stack overflow on large images
            let binary = ''
            const chunkSize = 8192
            for (let i = 0; i < photoBuffer.length; i += chunkSize) {
              binary += String.fromCharCode(...photoBuffer.subarray(i, i + chunkSize))
            }
            const photoBase64 = btoa(binary)
            const contentType = photoRes.headers.get('content-type') || 'image/jpeg'
            const ext = contentType.includes('png') ? 'png' : contentType.includes('heic') ? 'heic' : 'jpg'
            attachments.push({
              filename: `my-letter.${ext}`,
              content: photoBase64,
            })
          }
        } catch (err) {
          console.error('Photo fetch error:', err)
          // Non-blocking — email sends without photo
        }
      }

      const emailPayload: any = {
        from: 'FindMyFlow <notifications@findmyflow.nichuzz.com>',
        to: email,
        subject,
        html: profileHtml,
      }
      if (attachments.length > 0) {
        emailPayload.attachments = attachments
      }

      const profileRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      if (!profileRes.ok) {
        const err = await profileRes.text()
        console.error('Resend error (profile):', err)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: err }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Workshop email sent: ${email} — ${essenceArchetype}`)

      // Fire-and-forget notification
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FindMyFlow <notifications@findmyflow.nichuzz.com>',
          to: NOTIFY_EMAIL,
          subject: `Workshop: ${name} — ${essenceArchetype}`,
          html: buildNotificationEmail(email, name, emotionalNeed, protectivePattern, essenceArchetype),
        }),
      }).catch(err => console.error('Notification send error:', err))
    } else {
      console.log('RESEND_API_KEY not set — would send:', { email, name, emotionalNeed, protectivePattern, essenceArchetype })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in send-workshop-profile:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
