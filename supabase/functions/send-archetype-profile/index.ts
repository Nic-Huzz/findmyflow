/**
 * Send Archetype Profile Edge Function
 *
 * Sends beautifully formatted essence or protective archetype profile emails.
 * Called from the LinkTree flow after each archetype discovery.
 * Uses Resend for email delivery.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_EMAIL = 'huzz@nichuzz.com'
const CTA_URL = 'https://findmyflow.nichuzz.com/get-started'

// ── Essence Profiles (8 used in LinkTree) ──────────────────────────────────

const ESSENCE_PROFILES: Record<string, any> = {
  "Radiant Rebel": {
    poetic_line: "You are fire with a heartbeat, designed to disrupt what's false and awaken what's real.",
    superpower: "You ignite courage in the quiet. You say what others won't and move like fire through what feels stuck.",
    north_star: "Use rebellion to liberate, not just provoke. Let your why guide your wow.",
    inner_child_desire: "I wanted to lead the make-believe revolution, rally your crew, and challenge the rules just because you could.",
    essence_wound: "People said 'You're too intense. Calm down.' You internalised this to mean your passion made you dangerous — so you learned to dim it to fit in.",
    characters: ["Deadpool", "Billie Eilish", "Katniss Everdeen (Hunger Games)"],
    energetic_transmission: "You electrify the space. Your energy activates boldness — like truth wants to break free through your presence.",
    recognition_pattern: "People seek you when they're ready to break rules, burn masks, and step into unapologetic self-expression.",
    vision_in_action: "You turn chaos into clarity, sparking revolutions with nothing but your voice."
  },
  "Playful Creator": {
    poetic_line: "You are joy in motion, color that moves, laughter that builds, a spark dressed in creativity.",
    superpower: "You alchemize boredom into magic. You make joy contagious, creativity safe, and weirdness welcome.",
    north_star: "Channel your joy into containers that scale. Play can be the portal to mastery.",
    inner_child_desire: "I wanted to turn everything into a game or invention — joy was my way of connecting.",
    essence_wound: "People said 'Stop being silly. Grow up.' You internalised this to mean your lightness was seen as immaturity — so you learned to be serious to fit in.",
    characters: ["Spider-Man", "Robin Williams", "Willy Wonka"],
    energetic_transmission: "When you're free, joy crackles through the air. You awaken play, laughter, and lightness just by being.",
    recognition_pattern: "People come to you when things feel too serious — because your presence gives permission to let go and have fun.",
    vision_in_action: "You turn pressure into play and make innovation feel like recess for the soul."
  },
  "Sacred Jester": {
    poetic_line: "You are the joke that reveals the truth. The giggle that breaks the pattern. The dance that interrupts the shame.",
    superpower: "You disarm defenses with humor. You reveal truth in the ridiculous and help others feel safe being real.",
    north_star: "Play with power, don't perform it. Let irreverence be reverent.",
    inner_child_desire: "I loved saying the outrageous thing or making people laugh — I couldn't help but stir the pot.",
    essence_wound: "People said 'Why can't you just be normal?' You internalised this to mean your wildness made others uncomfortable, so you made yourself the joke as a way to express and to fit in.",
    characters: ["Jim Carrey", "Star-Lord (Guardians of the Galaxy)", "Jack Sparrow"],
    energetic_transmission: "Around you, people exhale. Pretenses drop. They remember it's safe to be weird and real.",
    recognition_pattern: "You're the one who sees truth through chaos, laughter through pain — and somehow says what no one else can.",
    vision_in_action: "You drop unexpected one-liners that dismantle shame and unzip joy."
  },
  "Wild Alchemist": {
    poetic_line: "You are permission, uncaged, untamed, undeniable. Your truth liberates others from their own.",
    superpower: "You transmute chaos into meaning. You give pain purpose and help people rebirth themselves.",
    north_star: "Let your full expression lead. Alchemy needs fire.",
    inner_child_desire: "I felt everything — and I wanted to turn it into art, expression, or healing for others.",
    essence_wound: "People said 'You're too emotional. Stop making everything a big deal.' You internalised this to mean you were shamed for your care instead of celebrated for your sensitivity — so you learned to suppress your emotions to fit in.",
    characters: ["Tony Stark (Iron Man)", "David Bowie", "Elizabeth Gilbert"],
    energetic_transmission: "You pulse with emotional depth. Chaos feels sacred around you — like it's allowed to become something beautiful.",
    recognition_pattern: "You're the one others come to for transformation. You don't fix — you help them burn and rise.",
    vision_in_action: "Where others flinch from fire, you dance in it — turning pain into art and rupture into truth."
  },
  "Heart Holder": {
    poetic_line: "You are the quiet gravity — the heartbeat that steadies the storm.",
    superpower: "You co-regulate rooms. With you, breath slows, shoulders drop, and real work can land.",
    north_star: "Hold with warmth and boundaries. Care that preserves dignity, not dependency.",
    inner_child_desire: "I wanted to be the safe place — the friend who made everyone feel okay to be themselves.",
    essence_wound: "People said 'You're too sensitive. Stop babying people.' You internalised this to mean your care wasn't wanted, so you learned to keep to yourself to fit in.",
    characters: ["Ted Lasso", "Uncle Iroh (Avatar: The Last Airbender)", "Samwise Gamgee (The Lord of the Rings)"],
    energetic_transmission: "A settling wave. Voices soften, hearts unclench, belonging rises — people can be real again.",
    recognition_pattern: "People seek you when the team is brittle, burnt out, or spinning from conflict.",
    vision_in_action: "In tense moments you become the calm center; the room syncs, hard conversations land, and people leave more regulated than they arrived."
  },
  "Cosmic Connector": {
    poetic_line: "You are the thread between worlds — weaving the mystical into the practical, the unseen into form.",
    superpower: "You weave worlds. You connect the mystical and the practical, helping others make sense of the big and strange.",
    north_star: "Don't dilute your range to fit in. Your synthesis is the spell.",
    inner_child_desire: "I'd create blueprints, mix magic potions, and explain made-up universes to anyone who'd listen.",
    essence_wound: "People said 'That's not true. How can you prove it?' You internalised this to mean your magic wasn't real, so you learned to keep quiet to fit in.",
    characters: ["Doctor Strange", "Rick Rubin", "Gandalf"],
    energetic_transmission: "You align chaos into coherence. Ideas land. Emotions make sense. The unseen becomes useful.",
    recognition_pattern: "People turn to you to translate the mystical into something practical — you're the in-between.",
    vision_in_action: "You take quantum truths and translate them into tools, blueprints, and rituals that land."
  },
  "Compassionate Leader": {
    poetic_line: "You are a walking hearth, steady, warm, and fiercely kind. When you speak, people remember who they are.",
    superpower: "You hold the center when things shake. You make people feel seen, safe, and ready to rise.",
    north_star: "Lead from wholeness, not over-responsibility. Trust others can rise too.",
    inner_child_desire: "You would've organized the talent show, made sure everyone got a turn, and stepped back to clap the loudest.",
    essence_wound: "People said 'You're too controlling. Worry about yourself.' You internalised this to mean you weren't helpful — so you learned to withdraw to fit in.",
    characters: ["Mufasa (Lion King)", "Captain America", "Brené Brown"],
    energetic_transmission: "People rise around you — they feel seen, supported, and called into their power. You don't shout to lead. You hold firm, and others remember their strength.",
    recognition_pattern: "You're the one people turn to when they're overwhelmed but ready to rise. They trust you to meet their chaos with calm — and to remind them what they're capable of.",
    vision_in_action: "Your grounded presence becomes a gravitational field where others remember their power."
  },
  "Truth-Teller": {
    poetic_line: "You are the sentence that slices through the noise. The call-out and the call-home. Clarity made human.",
    superpower: "You crack illusions with precision. You speak the sharp truth wrapped in unexpected tenderness.",
    north_star: "Say the thing others won't. Truth is love wearing its boldest clothes.",
    inner_child_desire: "I'd write secret stories, ask raw questions, and share the truths that others tiptoed around.",
    essence_wound: "People said 'Stop being so direct.' You internalised this to mean your honesty was seen as negative, so you learned to sugarcoat your truth and keep to yourself to fit in.",
    characters: ["Yoda", "Ricky Gervais", "Lady Gaga"],
    energetic_transmission: "Around you, everything sharpens. Emotional fog lifts. Your presence calls forth honesty — even the kind that trembles.",
    recognition_pattern: "People find you when something needs to be named. You hold the words they've been afraid to say.",
    vision_in_action: "You speak what no one else will and somehow it lands like liberation, not attack."
  }
}

// ── Protective Profiles (5) ────────────────────────────────────────────────

const PROTECTIVE_PROFILES: Record<string, any> = {
  "Perfectionist": {
    summary: "This archetype developed to protect you from criticism and failure.",
    coreNarrative: "If I get it perfect, I can avoid shame.",
    emotionalWound: { fear: 'Shame around "not good enough."', learned: "Mistakes = humiliation." },
    behavioralStrategy: "Overdetail, overcontrol, procrastination (fear of imperfect action).",
    avoidancePattern: "Avoid starting, avoid failing, avoid being seen in progress.",
    nervousSystemPattern: "Freeze + sympathetic blend — high-focus freeze.",
    somaticExpression: "Stillness, tension in forehead, precise movements, shallow breath.",
    rewiringOpportunity: { affirmations: ["Progress is safe.", "Being seen imperfectly builds trust."] },
    detailed: {
      howItShowsUp: "It whispers: 'If I can just get it perfect, then I'll be safe from judgment.' But perfectionism often becomes procrastination in disguise — keeping you stuck in endless prep mode. Exhausting, isn't it?",
      breakingFree: "Remember: done is better than perfect. Progress over perfection. Your essence is waiting to emerge."
    }
  },
  "People Pleaser": {
    summary: "This archetype developed to protect you from rejection and conflict.",
    coreNarrative: "If I make others happy, I'll be safe and wanted.",
    emotionalWound: { fear: 'Fear of rejection, abandonment, or being "too much."', learned: "Love is kept by not being a burden." },
    behavioralStrategy: "Avoid conflict, over-accommodate, always soften edges.",
    avoidancePattern: "Avoid stating needs, avoid boundaries, avoid emotional truth.",
    nervousSystemPattern: "Fawn — ventral/parasympathetic blend with hyper-compliance. Appeasement as safety.",
    somaticExpression: "Tight chest, forced smile, soft or high-pitched voice, shallow breath.",
    rewiringOpportunity: { affirmations: ["Connection grows when I show my truth.", "My needs are safe and worthy."] },
    detailed: {
      howItShowsUp: "It says: 'If I can just make everyone happy, then I'll be safe from abandonment.' But people-pleasing often becomes self-abandonment in disguise.",
      breakingFree: "Your worth isn't determined by others' approval. Set boundaries with love."
    }
  },
  "Controller": {
    summary: "This archetype developed to protect you from chaos and unpredictability.",
    coreNarrative: "Safety comes from controlling outcomes.",
    emotionalWound: { fear: "Chaos, unpredictability, or emotional volatility.", learned: "If I don't manage everything, I will get hurt." },
    behavioralStrategy: "Micro-managing, overplanning, dominating decisions.",
    avoidancePattern: "Avoid letting others lead, avoid trusting, avoid surrender.",
    nervousSystemPattern: "Sympathetic fight — control as safety.",
    somaticExpression: "Clenched jaw, stiff posture, narrow eyes, rigid shoulders.",
    rewiringOpportunity: { affirmations: ["I am safe when I loosen my grip.", "Life supports me when I soften."] },
    detailed: {
      howItShowsUp: "It insists: 'If I can just control everything, then I'll be safe from disappointment.' But control often becomes chaos in disguise.",
      breakingFree: "Release the need to control. Trust the process and your own resilience."
    }
  },
  "Performer": {
    summary: "This archetype developed to protect you from being unliked or rejected.",
    coreNarrative: "If I do more, I'll be enough.",
    emotionalWound: { fear: "Wound around worth = achievement.", learned: "I must earn approval to deserve love." },
    behavioralStrategy: "Overworking, impressing, achieving, striving.",
    avoidancePattern: "Avoid rest, avoid stillness, avoid vulnerability without performance.",
    nervousSystemPattern: "Sympathetic flight/fight — hustle, drive, overexertion.",
    somaticExpression: "Fast talking, chest forward, jaw tension, eye intensity.",
    rewiringOpportunity: { affirmations: ["My worth exists without performance.", "I am enough even when still."] },
    detailed: {
      howItShowsUp: "It performs: 'If I can just be what others want, then I'll be safe from rejection.' But performing often becomes self-abandonment in disguise.",
      breakingFree: "Your authentic self is enough. You don't need to perform for love."
    }
  },
  "Ghost": {
    summary: "This archetype developed to protect you from being hurt or disappointed.",
    coreNarrative: "Being seen is dangerous. Being hidden is safer.",
    emotionalWound: { fear: "Overwhelm, emotional intensity, unsafe closeness.", learned: "Disappearing keeps me safe." },
    behavioralStrategy: "Avoid relationships, disappear, numbness, isolation.",
    avoidancePattern: "Avoid connection, avoid emotion, avoid vulnerability, avoid standing-out.",
    nervousSystemPattern: "Dorsal vagal freeze — collapse / withdrawal.",
    somaticExpression: "Low energy, slumped posture, slow speaking or none.",
    rewiringOpportunity: { affirmations: ["Connection feels grounding.", "I can stay and still feel safe."] },
    detailed: {
      howItShowsUp: "It whispers: 'If I can just stay invisible, then I'll be safe from pain.' But hiding often becomes isolation in disguise.",
      breakingFree: "Showing up is brave. Your presence matters, even when it feels risky."
    }
  }
}

// ── Brand tokens ─────────────────────────────────────────────────────────
// Style A — Light & Clean. Matches FindMyFlow :root vars from src/index.css

const B = {
  purple: '#5e17eb',
  purpleLight: '#7c3aed',
  purpleTint: '#f8f5ff',   // very light purple for quote blocks
  gold: '#E9A23B',
  white: '#ffffff',
  warmGray: '#f8f9fa',     // card backgrounds
  softGray: '#e9ecef',     // borders + outer body bg
  textGray: '#495057',     // body text on white (12:1 contrast)
  mutedGray: '#adb5bd',    // footer secondary text (4.6:1 on white)
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif",
}

// ── Shared email helpers ──────────────────────────────────────────────────

function e(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

// Decorative gold divider
const divider = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td align="center">
      <span style="color:${B.gold};font-size:18px;letter-spacing:12px;">&#10022; &#10022; &#10022;</span>
    </td></tr>
  </table>`

// Section card — light gray card with gold label, gray body text
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

// Gold CTA button
const goldCta = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 24px;">
    <tr><td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${CTA_URL}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" fillcolor="${B.gold}">
        <center style="color:${B.white};font-family:${B.font};font-size:16px;font-weight:bold;">Explore The Full Experience &rarr;</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${CTA_URL}" style="display:inline-block;padding:16px 44px;background:${B.gold};color:${B.white};font-size:16px;font-weight:700;text-decoration:none;border-radius:32px;font-family:${B.font};letter-spacing:0.3px;">
        Explore The Full Experience &rarr;
      </a>
      <!--<![endif]-->
    </td></tr>
  </table>`

// Footer
const footer = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:16px 0 8px;">
      <span style="color:${B.gold};font-size:18px;letter-spacing:12px;">&#10022;</span>
    </td></tr>
    <tr><td align="center" style="padding:0 0 6px;color:${B.mutedGray};font-size:12px;font-family:${B.font};">
      FindMyFlow &mdash; On a mission to make healing fun
    </td></tr>
    <tr><td align="center" style="padding:0 0 24px;">
      <a href="${CTA_URL}" style="color:${B.purple};text-decoration:none;font-size:12px;font-family:${B.font};">findmyflow.nichuzz.com</a>
    </td></tr>
  </table>`

// Wraps full email in the outer shell (light background, white 600px table)
function emailShell(content: string): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>FindMyFlow</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:${B.softGray};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.softGray};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${B.white};border-radius:16px;overflow:hidden;">
        ${content}
      </table>
    </td></tr>
  </table>
  </body></html>`
}

// ── Essence email template ─────────────────────────────────────────────────

function buildEssenceEmail(name: string, archetype: string, profile: any): string {
  const chars = (profile.characters || []).map((c: string) => e(c)).join(' &nbsp;&bull;&nbsp; ')
  const greeting = name?.trim() ? `<tr><td align="center" style="padding:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;font-family:${B.font};">Prepared for ${e(name.trim())}</td></tr>` : ''

  return emailShell(`
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,${B.purple} 0%,${B.purpleLight} 100%);padding:44px 30px 36px;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding-bottom:12px;">
          <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;font-family:${B.font};">&#10022;&ensp; Your Essence Voice &ensp;&#10022;</span>
        </td></tr>
        <tr><td align="center">
          <h1 style="margin:0;color:${B.gold};font-size:32px;font-weight:700;font-family:${B.font};">${e(archetype)}</h1>
        </td></tr>
        ${greeting}
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:32px 32px 0;">

      <!-- Poetic Line -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="border-left:3px solid ${B.gold};padding:16px 24px;background:${B.purpleTint};border-radius:0 8px 8px 0;">
          <p style="margin:0;color:${B.purple};font-size:17px;font-style:italic;line-height:1.7;font-family:${B.font};">&ldquo;${e(profile.poetic_line)}&rdquo;</p>
        </td></tr>
      </table>

      ${card('Your Superpower', e(profile.superpower), '&#9889;')}
      ${card('Your North Star', e(profile.north_star), '&#11088;')}

      <!-- Two-column: Inner Child / Essence Wound -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td width="49%" valign="top" style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:18px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:6px;">
                <span style="color:${B.gold};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;font-family:${B.font};">&#128118;&ensp;Inner Child</span>
              </td></tr>
              <tr><td style="color:${B.textGray};font-size:14px;line-height:1.6;font-family:${B.font};">
                ${e(profile.inner_child_desire)}
              </td></tr>
            </table>
          </td>
          <td width="2%"></td>
          <td width="49%" valign="top" style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:18px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding-bottom:6px;">
                <span style="color:${B.gold};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;font-family:${B.font};">&#128148;&ensp;Essence Wound</span>
              </td></tr>
              <tr><td style="color:${B.textGray};font-size:14px;line-height:1.6;font-family:${B.font};">
                ${e(profile.essence_wound)}
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

      ${card('Heroes Like You', chars, '&#127775;')}
      ${card('Energetic Transmission', e(profile.energetic_transmission), '&#10024;')}
      ${card('How People Recognize You', e(profile.recognition_pattern), '&#128065;')}
      ${card('Your Vision in Action', e(profile.vision_in_action), '&#128640;')}

      ${divider}

      <!-- CTA context -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:0 20px 8px;color:${B.textGray};font-size:15px;line-height:1.6;font-family:${B.font};">
          This is who you are beneath the noise.<br>Ready to build a life that honours it?
        </td></tr>
      </table>

      ${goldCta}
      ${footer}
    </td></tr>
  `)
}

// ── Protective email template ──────────────────────────────────────────────

function buildProtectiveEmail(name: string, archetype: string, profile: any): string {
  const affirmationRows = (profile.rewiringOpportunity?.affirmations || [])
    .map((a: string) => `
      <tr><td style="padding:6px 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="top" style="color:${B.gold};font-size:16px;padding-right:10px;font-family:${B.font};">&ldquo;</td>
          <td style="color:${B.textGray};font-size:15px;font-style:italic;line-height:1.6;font-family:${B.font};">${e(a)}</td>
        </tr></table>
      </td></tr>`)
    .join('')

  const greeting = name?.trim() ? `<tr><td align="center" style="padding:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;font-family:${B.font};">Prepared for ${e(name.trim())}</td></tr>` : ''

  return emailShell(`
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,${B.purple} 0%,${B.purpleLight} 100%);padding:44px 30px 36px;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding-bottom:12px;">
          <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;font-family:${B.font};">&#10022;&ensp; Your Protective Pattern &ensp;&#10022;</span>
        </td></tr>
        <tr><td align="center">
          <h1 style="margin:0;color:${B.gold};font-size:32px;font-weight:700;font-family:${B.font};">The ${e(archetype)}</h1>
        </td></tr>
        ${greeting}
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:32px 32px 0;">

      <!-- Summary -->
      <p style="margin:0 0 20px;color:${B.textGray};font-size:15px;line-height:1.7;font-family:${B.font};">${e(profile.summary)}</p>

      <!-- Core Belief -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="border-left:3px solid ${B.gold};padding:16px 24px;background:${B.purpleTint};border-radius:0 8px 8px 0;">
          <p style="margin:0 0 6px;color:${B.purpleLight};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Core Belief</p>
          <p style="margin:0;color:${B.purple};font-size:17px;font-style:italic;line-height:1.7;font-family:${B.font};">&ldquo;${e(profile.coreNarrative)}&rdquo;</p>
        </td></tr>
      </table>

      <!-- Emotional Wound (custom card with two fields) -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:20px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding-bottom:10px;">
              <span style="color:${B.gold};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:${B.font};">&#128148;&ensp;Emotional Wound</span>
            </td></tr>
            <tr><td style="color:${B.textGray};font-size:15px;line-height:1.7;font-family:${B.font};">
              <strong style="color:${B.purple};">The fear:</strong> ${e(profile.emotionalWound.fear)}
            </td></tr>
            <tr><td style="color:${B.textGray};font-size:15px;line-height:1.7;font-family:${B.font};padding-top:6px;">
              <strong style="color:${B.purple};">What you learned:</strong> ${e(profile.emotionalWound.learned)}
            </td></tr>
          </table>
        </td></tr>
      </table>

      ${card('How It Shows Up', e(profile.detailed.howItShowsUp), '&#128065;')}
      ${card('Behavioral Strategy', e(profile.behavioralStrategy), '&#128737;')}
      ${card('Nervous System Pattern', e(profile.nervousSystemPattern), '&#9889;')}
      ${card('How It Lives in Your Body', e(profile.somaticExpression), '&#128172;')}

      ${divider}

      <!-- Breaking Free -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr><td style="background:${B.purpleTint};border:1px solid ${B.softGray};border-radius:12px;padding:24px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="padding-bottom:14px;">
              <span style="color:${B.gold};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">&#10024;&ensp; Breaking Free &ensp;&#10024;</span>
            </td></tr>
            <tr><td style="color:${B.textGray};font-size:15px;line-height:1.7;font-family:${B.font};padding-bottom:18px;">
              ${e(profile.detailed.breakingFree)}
            </td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${B.white};border-radius:8px;padding:14px 18px;border:1px solid ${B.softGray};">
                <tr><td style="padding:4px 0 8px;">
                  <span style="color:${B.purpleLight};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:${B.font};">Affirmations to Carry</span>
                </td></tr>
                ${affirmationRows}
              </table>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <!-- CTA context -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:0 20px 8px;color:${B.textGray};font-size:15px;line-height:1.6;font-family:${B.font};">
          This pattern kept you safe. Now it's time<br>to let your true voice lead.
        </td></tr>
      </table>

      ${goldCta}
      ${footer}
    </td></tr>
  `)
}

// ── Notification email ─────────────────────────────────────────────────────

function buildNotificationEmail(email: string, name: string, archetype: string, type: string): string {
  const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#5e17eb,#7c3aed);padding:24px 30px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:22px;">LinkTree Archetype Lead</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">${type === 'essence' ? 'Essence Profile Sent' : 'Protective Profile Sent'}</p>
    </div>
    <div style="background:#f9fafb;padding:24px 30px;border-radius:0 0 16px 16px;">
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-bottom:12px;">
        <p style="margin:6px 0;color:#374151;font-size:16px;"><strong>${name || 'Anonymous'}</strong></p>
        <p style="margin:6px 0;color:#5e17eb;font-size:16px;">${email}</p>
        <p style="margin:6px 0;color:#374151;font-size:14px;">Archetype: <strong>${archetype}</strong></p>
        <p style="margin:6px 0;color:#374151;font-size:14px;">Type: <strong>${type}</strong></p>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:right;">${timestamp} AEST</p>
    </div>
  </div>`
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, archetype_name, type } = await req.json()

    if (!email || !archetype_name || !type) {
      return new Response(
        JSON.stringify({ error: 'email, archetype_name, and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type !== 'essence' && type !== 'protective') {
      return new Response(
        JSON.stringify({ error: 'type must be "essence" or "protective"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    // Look up profile
    let profileHtml: string
    let subject: string

    if (type === 'essence') {
      const profile = ESSENCE_PROFILES[archetype_name]
      if (!profile) {
        return new Response(
          JSON.stringify({ error: `Unknown essence archetype: ${archetype_name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      profileHtml = buildEssenceEmail(name || '', archetype_name, profile)
      subject = `Your Essence Voice: ${archetype_name}`
    } else {
      const profile = PROTECTIVE_PROFILES[archetype_name]
      if (!profile) {
        return new Response(
          JSON.stringify({ error: `Unknown protective archetype: ${archetype_name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      profileHtml = buildProtectiveEmail(name || '', archetype_name, profile)
      subject = `Your Protective Pattern: The ${archetype_name}`
    }

    if (resendApiKey) {
      // Send profile email to user
      const profileRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FindMyFlow <notifications@findmyflow.nichuzz.com>',
          to: email,
          subject,
          html: profileHtml,
        }),
      })

      if (!profileRes.ok) {
        const err = await profileRes.text()
        console.error('Resend error (profile):', err)
        return new Response(
          JSON.stringify({ error: 'Failed to send profile email', details: err }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Profile email sent: ${email} — ${type} — ${archetype_name}`)

      // Fire-and-forget notification to admin
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FindMyFlow <notifications@findmyflow.nichuzz.com>',
          to: NOTIFY_EMAIL,
          subject: `LinkTree lead: ${name || email} — ${archetype_name} (${type})`,
          html: buildNotificationEmail(email, name || '', archetype_name, type),
        }),
      }).catch(err => console.error('Notification send error:', err))
    } else {
      console.log('RESEND_API_KEY not set — would send:', { email, name, archetype_name, type })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in send-archetype-profile:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})