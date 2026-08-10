/**
 * Huzz's Experience Dome Data
 *
 * Mapped from real Supabase activity for huzz@nichuzz.com
 * Evidence sources: quests, courage challenges, life paths, clusters, checkins, curiosity
 *
 * States: vibe_rise (love it), fun (enjoy it), pressure (growth edge), null (unexplored)
 *
 * TEMPORARY FILE — for dome preview only. Will be replaced by live Supabase queries.
 */

export const HUZZ_DOME_STATES = {
  // ═══════════════════════════════════════════
  // MOVEMENT — Dance quest completed, silent discos, travel
  // ═══════════════════════════════════════════

  // Cars (driving/travel)
  'car-1886': 'fun',           // Driving — tuk tuk tournament, 5+ hrs driving noted as drain
  'car-1903': 'fun',           // Flying — travel experience host, flights booked
  'car-1952': 'fun',           // International travel — Bali-based, KPG, KL, Europe planned
  'car-1956': 'fun',           // Long-distance road trip
  'car-2010': 'fun',           // Ride-sharing

  // Endurance
  'sub-endurance-1962': 'fun', // Jogging — some movement but not core

  // Strength
  'sub-strength-0776': 'fun',  // Gym — bounce shoes ordered, physical activity

  // Flexibility
  'sub-flexibility-1893': 'fun', // Yoga — mind-body cluster, NS coaching

  // Temperature
  'sub-temperature-0300': 'fun',  // Bathhouse/sauna — Bali lifestyle
  'sub-temperature-2011': 'vibe_rise', // Wim Hof method — duplicate of sub-somatic-2012

  // Outdoor
  'sub-outdoor-1907': 'fun',   // Camping/scouting — outdoor challenges in courage list

  // Dance — THIS IS HIS CORE. Multiple silent discos, dance events, ecstatic dance
  'sub-dance-1400': 'fun',          // Tribal/ceremonial dance
  'sub-dance-1800': 'fun',          // Social dance — contact dancing courage challenge
  'sub-dance-1972': 'fun',          // Contact improvisation — "First Contact Dancing" challenge
  'sub-dance-1975': 'vibe_rise',    // Ecstatic dance / 5Rhythms — core identity
  'sub-dance-1986': 'pressure',     // Burning Man / art festival — growth edge
  'sub-dance-1987': 'fun',          // Rave / electronic music
  'sub-dance-2005': 'vibe_rise',    // Silent disco — Bondi, Opera House, KPG, KL, paid events
  'sub-dance-2013': 'vibe_rise',    // Morning sober dance — "First Celebrate the Day"

  // ═══════════════════════════════════════════
  // NOURISHMENT — Limited direct data, Bali lifestyle implies some
  // ═══════════════════════════════════════════
  'sub-ancestral-1400': 'fun',   // Whole-food eating — Bali lifestyle
  'food-2013': 'fun',            // Food delivery apps
  'food-1948': 'fun',            // Fast food

  // ═══════════════════════════════════════════
  // TOOLS — AI Coding quest COMPLETED, headset ecommerce
  // ═══════════════════════════════════════════
  'tech-1975': 'fun',           // Personal computer
  'tech-1991': 'fun',           // Browsing the web
  'tech-1998': 'fun',           // Searching online
  'tech-2004': 'pressure',     // Social media — DRAIN. Multiple checkins: "Instagram made me anxious"
  'tech-2007': 'fun',           // Smartphone
  'ai-2022': 'vibe_rise',      // AI tools — taught himself Claude Code, Cursor, CustomGPTs, built portal

  // ═══════════════════════════════════════════
  // STATUS — Personal brand is growth edge, appearance challenges done
  // ═══════════════════════════════════════════
  'fashion-2013': 'pressure',       // Following influencers — drain noted
  'fashion-2021': 'pressure',       // Personal brand — "not enough people know about my products"
  'sub-digital-1482': 'fun',        // CV/resume — corporate past
  'sub-digital-2003': 'fun',        // LinkedIn
  'sub-digital-2010b': 'pressure',  // Instagram identity — courage challenges + anxiety
  'sub-digital-2018b': 'pressure',  // TikTok identity — trial reels
  'sub-digital-2023': 'pressure',   // AI personal brand — building but growth edge
  'sub-counter-1960': 'fun',        // Counterculture — quit VC, anti-corporate
  'sub-craft-2014': 'fun',          // Portfolio/show your work

  // Appearance courage challenges (17 completed): ear piercing, nails, bandana, shirt rip
  'sub-beauty-1916': 'fun',         // Wearing makeup/cosmetics — nails as courage challenge
  'sub-fashion-2019': 'fun',        // Secondhand/rental fashion

  // ═══════════════════════════════════════════
  // BONDS — Travel host, coaching, community, ceremonies
  // ═══════════════════════════════════════════

  // Communications
  'comms-1876': 'fun',          // Phone calls
  'comms-1971': 'fun',          // Email
  'comms-1992': 'fun',          // Text messaging
  'comms-2009': 'fun',          // Messaging apps
  'comms-2020': 'fun',          // Video calling — delivered coding program live

  // Exchange
  'exchange-1950': 'fun',       // Credit card
  'exchange-1999': 'fun',       // Digital payments
  'exchange-2007': 'fun',       // Mobile banking

  // Intimacy
  'intimacy-1170': 'fun',       // Romantic love — relationship (Spiff mentioned)
  'intimacy-2012': 'fun',       // Dating apps — likely used

  // Ritual/Ceremony
  'sub-ritual-1935': 'fun',     // Support group
  'sub-ritual-1985': 'fun',     // Men's/women's circle
  'sub-ritual-2018': 'vibe_rise', // Cacao + breathwork ceremony — delivers these

  // Communal
  'sub-communal-2015': 'fun',   // Co-living — Bali co-living
  'sub-communal-2017': 'vibe_rise', // Digital nomad hub — Bali-based, travel host

  // Shared Ordeal
  'sub-ordeal-1863': 'fun',     // Team sports — World Cup, fantasy sports
  'sub-ordeal-2015': 'vibe_rise', // Adventure retreat — retreat creator (vibe life path)

  // Digital Tribe
  'sub-digital-2005': 'fun',    // Reddit/forums — u/NicHuzz_
  'sub-digital-2015': 'fun',    // Discord community
  'sub-digital-2017': 'fun',    // Paid community

  // Coaching/Mastermind
  'sub-coaching-1937': 'fun',   // Mastermind group — $30K on courses, knows the space
  'sub-coaching-1995': 'fun',   // Executive coaching
  'sub-coaching-2010': 'vibe_rise', // Online coaching — coaching skill at L5 (teaching)
  'sub-coaching-2024': 'vibe_rise', // AI coaching — built AI coaching tools (Zarlo, Figurine)

  // Couples
  'sub-couples-1800': 'fun',    // Romantic love partnership — Spiff

  // ═══════════════════════════════════════════
  // SHELTER — Bali life, travel, Airbnb
  // ═══════════════════════════════════════════
  'property-2008': 'fun',       // Airbnb — travel lifestyle
  // sub-communal-2017 already rated under Bonds
  'sub-alt-2011': 'fun',        // Van life — nomadic lifestyle
  'sub-proptech-2008': 'fun',       // Airbnb hosting — duplicate of property-2008
  'sub-proptech-2015': 'fun',       // Co-living — duplicate of sub-communal-2015
  'sub-proptech-2020': 'vibe_rise', // Working from home — self-employed, builds from laptop
  'sub-sacred-2010': 'fun',     // Wellness studio — attends/hosts at studios
  'sub-sacred-2020': 'vibe_rise', // Sound room / silent disco — duplicate of dance-2005
  'sub-sacred-1900': 'fun',     // Spa/bathhouse — Bali

  // ═══════════════════════════════════════════
  // STORY — Content creation, stand-up, YouTube, podcasts, experience design
  // ═══════════════════════════════════════════

  // Media main
  'media-1877': 'fun',          // Listening to recorded music — DJ for silent discos
  'media-1895': 'fun',          // Cinema
  'media-1948': 'fun',          // Television
  'media-1991': 'vibe_rise',    // Publishing online — published app, website
  'media-2004': 'pressure',     // Posting on social media — courage challenge + drain
  'media-2007': 'fun',          // Streaming (Netflix)
  'media-2008': 'fun',          // Music streaming
  'media-2012': 'vibe_rise',    // Online course — delivered coding program, AI masterclass
  'media-2018': 'pressure',     // Short-form video — "trial reels every day" weekly review
  'media-2022': 'vibe_rise',    // AI-generated content — uses extensively

  // Oral/Live — STRONG. Stand-up comedy, improv, magic, speaking
  'sub-oral-1400b': 'fun',      // Live theatre — improv comedy night
  'sub-oral-1400c': 'vibe_rise', // Live performance — multiple: magic, speaking, hosting
  'sub-oral-1860': 'fun',       // Stand-up comedy — "10-min Stand-Up Comedy" courage challenge
  'sub-oral-2006': 'pressure',  // TED talk — Keynote Speaker is a life path (peace state)
  'sub-oral-2015': 'fun',       // Live podcast

  // Written
  'sub-written-1719': 'fun',    // Reading a novel — books: A New Earth, Way of Peaceful Warrior, etc.
  'sub-written-1999': 'fun',    // Blogging — 14 blogs in Obsidian
  'sub-written-2017': 'fun',    // Paid newsletter — Substack awareness

  // Audio
  'sub-audio-2005': 'vibe_rise', // Podcasts — Tim Ferriss, Hormozi, Founders, Modern Wisdom, Brain Software
  'sub-audio-2015': 'fun',      // Audio courses/guided meditations

  // Video
  'sub-video-2005': 'pressure', // YouTube — "First YouTube Video" was a courage challenge
  'sub-video-2018': 'pressure', // TikTok — trial reels, growth edge
  'sub-video-2024': 'vibe_rise', // AI video creation — uses AI extensively for content

  // Immersive
  'sub-immersive-2015': 'vibe_rise', // Experience design event — THIS IS WHAT HE CREATES
  'sub-immersive-2023': 'fun',  // AI interactive narrative — builds with AI

  // Creator Economy
  'sub-creator-2007': 'pressure', // YouTube monetized creator — growth edge
  'sub-creator-2013': 'fun',    // Patreon — awareness
  'sub-creator-2022': 'vibe_rise', // Solo media company — is one
  'sub-creator-2024': 'vibe_rise', // Experience creator economy — THIS IS HIS IDENTITY

  // ═══════════════════════════════════════════
  // PLAY — Video games, board games, sports, gamified healing
  // ═══════════════════════════════════════════
  'play-1100a': 'fun',          // Board games — Lost Ruins of Arnak
  'play-1100d': 'fun',          // Chess/strategy
  'play-1377': 'fun',           // Card games
  'play-1863': 'fun',           // Organised sport — watches Aus sports
  'play-1971': 'fun',           // Karaoke — "Singing at Jamprov" courage challenge
  'play-1972': 'fun',           // Video games — RPG Video Games in DNA
  'play-1974': 'fun',           // Tabletop RPG — Lost Ruins of Arnak
  'play-2004': 'fun',           // MMO gaming
  'play-2012': 'vibe_rise',     // Therapeutic/gamified healing — THIS IS HIS PRODUCT

  // Board & Tabletop
  'sub-board-1995': 'fun',      // Eurogames (Catan) — Lost Ruins of Arnak

  // Sport
  'sub-sport-1871': 'fun',      // Professional sports — World Cup, fantasy sports
  'sub-sport-1995': 'fun',      // Extreme sport

  // Digital games
  'sub-digital-game-1977': 'fun', // Home console gaming
  'sub-digital-game-2005': 'fun', // Indie games

  // Free Play
  'sub-free-1400': 'fun',       // Free play / unstructured — philosophy of play is his thing

  // ═══════════════════════════════════════════
  // FIRE — Campfire/ritual, limited direct data
  // ═══════════════════════════════════════════
  'sub-combustion-1400': 'fun',      // Campfire
  'sub-light-1400': 'fun',          // Firelight/candlelight
  'sub-light-2020': 'fun',          // Candle ritual / hygge
  'sub-ritual-fire-1400': 'fun',    // Campfire social gathering
  'sub-ritual-fire-2000': 'fun',    // Fire pit gathering
  'sub-ritual-fire-2015b': 'fun',   // Fire ceremony / cacao circle

  // ═══════════════════════════════════════════
  // HEALING — Breathwork quest COMPLETED, healing intentions, NS coaching
  // ═══════════════════════════════════════════

  // Medicine main
  'med-1955': 'fun',            // Vaccinated
  'med-2015': 'fun',            // Telemedicine

  // Traditional/Plant
  'sub-traditional-1994': 'fun',  // Supplements
  'sub-traditional-2010': 'fun',  // Functional medicine
  'sub-traditional-2023': 'vibe_rise', // Cacao ceremony — delivers these

  // Somatic/Breathwork — CORE IDENTITY
  'sub-somatic-1400': 'vibe_rise',  // Pranayama / breathwork — completed quest, teaches
  'sub-somatic-1935': 'fun',       // Body-based therapy
  'sub-somatic-1976': 'fun',       // Holotropic breathwork — "30-min Conscious Connected Breathing"
  'sub-somatic-1997': 'fun',       // Somatic experiencing
  'sub-somatic-2012': 'vibe_rise', // Wim Hof Method — breathwork + cold
  'sub-somatic-2020': 'fun',       // Breathwork app

  // Mind-Body
  'sub-mindbody-1893': 'fun',    // Yoga — cluster mentions
  'sub-mindbody-1979': 'fun',    // Mindfulness meditation
  'sub-mindbody-2007': 'fun',    // Biohacking
  'sub-mindbody-2009': 'fun',    // Wearable health tracker
  'sub-mindbody-2021': 'fun',    // Huberman Lab protocols — curiosity inputs

  // Mental Health
  'sub-mental-1900': 'fun',     // Talk therapy
  'sub-mental-2017': 'vibe_rise', // AI therapy — built Zarlo + Figurine
  'sub-mental-2019': 'fun',     // IFS / parts work — protective voices: ghost, controller, perfectionist

  // Energy/Frequency
  'sub-energy-1980': 'fun',     // Sound bath
  'sub-energy-2015': 'vibe_rise', // Sound bath (attending) — silent disco crossover

  // ═══════════════════════════════════════════
  // REST — Some data from daily practices
  // ═══════════════════════════════════════════
  'sleep-1652': 'fun',          // Coffee / caffeine ritual
  'sleep-2009': 'fun',          // Sleep tracking
  'sleep-2017a': 'fun',         // Sleep hygiene — daily practices
  'sub-circadian-2012': 'fun',  // Chronotype awareness
  'sub-states-1972': 'fun',     // Transcendental meditation — meditation in daily practices
  'sub-states-2022': 'fun',     // NSDR — awareness via Huberman

  // ═══════════════════════════════════════════
  // THREAT — Limited, some awareness
  // ═══════════════════════════════════════════
  'defense-1688': 'fun',        // Insurance
  'sub-surveillance-2013': 'fun', // Digital privacy awareness
  'sub-surveillance-2018': 'fun', // Privacy tools
}

// Stats helper
export function getHuzzDomeStats() {
  const entries = Object.entries(HUZZ_DOME_STATES)
  const vr = entries.filter(([, s]) => s === 'vibe_rise').length
  const fun = entries.filter(([, s]) => s === 'fun').length
  const pressure = entries.filter(([, s]) => s === 'pressure').length
  const total = entries.length
  return { vibe_rise: vr, fun, pressure, total, safe: vr + fun }
}
