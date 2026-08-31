/**
 * Experience Dome Sub-Nodes (Layer 1: Format Variations)
 *
 * For each core dome node, lists the specific formats/variations of that experience.
 * Used in /choose-quests deep dive to narrow down which flavors of an experience
 * the user loves — feeding richer context to the AI for quest-path generation.
 *
 * Sources:
 *   - Rule Break Tree siblings (src/lib/ruleBreakTreeData.js, src/lib/experienceDomeConfig.js)
 *   - Cultural knowledge where tree coverage is thin or absent (virtual nodes)
 *
 * Nodes omitted from this file have no meaningful format variations — Layer 1 is
 * skipped for them and the user goes straight to Layer 2 (career vector).
 *
 * Multi-select checkboxes in the UI. User picks which formats light them up.
 *
 * Related files:
 *   - src/lib/experienceDomeConfig.js  (core node IDs, experience labels, pruned set)
 *   - src/lib/ruleBreakTreeData.js     (innovation tree — source of some sub-nodes)
 *   - docs/features/experience-dome-deep-dive.md (feature spec)
 */

export const DOME_SUB_NODES = {

  // ═══════════════════════════════════════════
  // MOVEMENT
  // ═══════════════════════════════════════════

  'car-1886': [
    // Road trips — different flavors of driving-as-experience
    { id: 'fmt-road-weekend', label: 'Weekend road trip' },
    { id: 'fmt-road-cross-country', label: 'Cross-country road trip' },
    { id: 'fmt-road-scenic', label: 'Scenic coastal/mountain drive' },
    { id: 'fmt-road-motorcycle', label: 'Motorcycle trip' },
    { id: 'fmt-road-campervan', label: 'Campervan / RV trip' },
    { id: 'fmt-road-rally', label: 'Rally / track day / driving experience' },
    { id: 'fmt-road-solo', label: 'Solo driving (music, thinking, freedom)' },
  ],

  'car-1952': [
    // International travel — how you travel changes everything
    { id: 'fmt-travel-backpacking', label: 'Backpacking (hostels, budget)' },
    { id: 'fmt-travel-solo', label: 'Solo travel' },
    { id: 'fmt-travel-gap-year', label: 'Gap year / long-term travel' },
    { id: 'fmt-travel-group-tour', label: 'Group tour / guided trip' },
    { id: 'fmt-travel-volunteer', label: 'Volunteering abroad' },
    { id: 'fmt-travel-luxury', label: 'Boutique / luxury travel' },
    { id: 'fmt-travel-adventure', label: 'Adventure travel (trekking, expeditions)' },
  ],

  'sub-endurance-1962': [
    // Running — from casual to extreme
    { id: 'fmt-run-casual', label: 'Casual jogging / daily run' },
    { id: 'fmt-run-social', label: 'Parkrun / social running group' },
    { id: 'fmt-run-trail', label: 'Trail running' },
    { id: 'fmt-run-half', label: 'Half marathon' },
    { id: 'fmt-run-marathon', label: 'Full marathon' },
    { id: 'fmt-run-ultra', label: 'Ultra-endurance (50K+)' },
    { id: 'fmt-run-treadmill', label: 'Treadmill / indoor running' },
    { id: 'fmt-run-barefoot', label: 'Barefoot / minimal running' },
  ],

  'sub-strength-2000': [
    // High-intensity / strength — gym culture formats
    { id: 'fmt-str-crossfit', label: 'CrossFit box' },
    { id: 'fmt-str-f45', label: 'F45 / group HIIT class' },
    { id: 'fmt-str-bootcamp', label: 'Outdoor bootcamp' },
    { id: 'fmt-str-olympic', label: 'Olympic weightlifting' },
    { id: 'fmt-str-bodybuilding', label: 'Bodybuilding / physique training' },
    { id: 'fmt-str-calisthenics', label: 'Calisthenics / bodyweight' },
    { id: 'fmt-str-home', label: 'Home workout (Peloton, YouTube)' },
    { id: 'fmt-str-gym', label: 'Solo gym session' },
  ],

  'sub-strength-2010': [
    // Hiking / nature walking — intensity and format vary
    { id: 'fmt-hike-day', label: 'Day hike' },
    { id: 'fmt-hike-multi', label: 'Multi-day trek (Camino, Inca Trail)' },
    { id: 'fmt-hike-forest', label: 'Forest walk / nature trail' },
    { id: 'fmt-hike-mountain', label: 'Mountain / summit hike' },
    { id: 'fmt-hike-scramble', label: 'Scrambling / ridge walking' },
    { id: 'fmt-hike-dog', label: 'Dog walking / walking with someone' },
    { id: 'fmt-hike-urban', label: 'Urban walking / city exploration' },
  ],

  'sub-flexibility-1893': [
    // Yoga — many lineages and formats
    { id: 'fmt-yoga-vinyasa', label: 'Vinyasa flow' },
    { id: 'fmt-yoga-yin', label: 'Yin yoga' },
    { id: 'fmt-yoga-hot', label: 'Hot yoga (Bikram)' },
    { id: 'fmt-yoga-ashtanga', label: 'Ashtanga' },
    { id: 'fmt-yoga-restorative', label: 'Restorative yoga' },
    { id: 'fmt-yoga-aerial', label: 'Aerial yoga' },
    { id: 'fmt-yoga-retreat', label: 'Yoga retreat' },
    { id: 'fmt-yoga-home', label: 'Home practice (app/YouTube)' },
  ],

  'sub-flexibility-1920': [
    // Studio fitness — instructor-led group classes
    { id: 'fmt-studio-spin', label: 'Spin / SoulCycle' },
    { id: 'fmt-studio-barre', label: 'Barre' },
    { id: 'fmt-studio-pilates-reformer', label: 'Pilates (reformer)' },
    { id: 'fmt-studio-pilates-mat', label: 'Pilates (mat)' },
    { id: 'fmt-studio-dance-fitness', label: 'Dance fitness (Zumba, 305)' },
    { id: 'fmt-studio-boxing', label: 'Boxing fitness' },
    { id: 'fmt-studio-mega', label: 'Megaformer / Lagree' },
  ],

  'sub-temperature-2018': [
    // Cold exposure — different entry points
    { id: 'fmt-cold-plunge', label: 'Cold plunge tub' },
    { id: 'fmt-cold-ocean', label: 'Cold ocean / lake swim' },
    { id: 'fmt-cold-shower', label: 'Cold shower practice' },
    { id: 'fmt-cold-cryo', label: 'Cryotherapy chamber' },
    { id: 'fmt-cold-wim-hof', label: 'Wim Hof ice bath / cold protocol' },
    { id: 'fmt-cold-event', label: 'Group ice bath event' },
    { id: 'fmt-cold-contrast', label: 'Contrast therapy (hot + cold)' },
  ],

  'sub-outdoor-1907': [
    // Camping / outdoor — from casual to extreme
    { id: 'fmt-camp-car', label: 'Car camping / drive-up' },
    { id: 'fmt-camp-backpack', label: 'Backcountry / wild camping' },
    { id: 'fmt-camp-glamping', label: 'Glamping' },
    { id: 'fmt-camp-bushcraft', label: 'Bushcraft / survival skills' },
    { id: 'fmt-camp-scouts', label: 'Scout camps / youth outdoor' },
    { id: 'fmt-camp-survival', label: 'Survival course (Outward Bound)' },
    { id: 'fmt-camp-overlanding', label: 'Overlanding / off-road' },
    { id: 'fmt-camp-foraging', label: 'Foraging in nature' },
  ],

  'sub-dance-1975': [
    // Ecstatic / conscious dance — format matters hugely
    { id: 'fmt-dance-5rhythms', label: '5Rhythms' },
    { id: 'fmt-dance-silent-disco', label: 'Silent disco' },
    { id: 'fmt-dance-morning', label: 'Morning sober dance (Daybreaker, Morning Gloryville)' },
    { id: 'fmt-dance-contact', label: 'Contact improvisation' },
    { id: 'fmt-dance-burning-man', label: 'Burning Man / art festival' },
    { id: 'fmt-dance-rave', label: 'Rave / electronic event' },
    { id: 'fmt-dance-tribal', label: 'Tribal / ceremonial dance' },
    { id: 'fmt-dance-social', label: 'Partner dance class (swing, salsa, bachata)' },
    { id: 'fmt-dance-freeform', label: 'Freeform / no instruction, just move' },
  ],

  'sub-safety-1400b': [
    // Martial arts — many traditions
    { id: 'fmt-ma-karate', label: 'Karate' },
    { id: 'fmt-ma-taekwondo', label: 'Taekwondo' },
    { id: 'fmt-ma-kung-fu', label: 'Kung fu' },
    { id: 'fmt-ma-judo', label: 'Judo' },
    { id: 'fmt-ma-aikido', label: 'Aikido' },
    { id: 'fmt-ma-capoeira', label: 'Capoeira' },
    { id: 'fmt-ma-krav-maga', label: 'Krav Maga' },
    { id: 'fmt-ma-self-defence', label: "Women's self-defence" },
  ],

  'sub-safety-1993': [
    // BJJ / MMA — combat sport formats
    { id: 'fmt-bjj-gi', label: 'BJJ (gi)' },
    { id: 'fmt-bjj-nogi', label: 'BJJ (no-gi)' },
    { id: 'fmt-bjj-mma', label: 'MMA' },
    { id: 'fmt-bjj-muay-thai', label: 'Muay Thai' },
    { id: 'fmt-bjj-kickboxing', label: 'Kickboxing' },
    { id: 'fmt-bjj-wrestling', label: 'Wrestling' },
    { id: 'fmt-bjj-submission', label: 'Submission grappling' },
  ],

  'exp-surfing': [
    // Water sports — the wave-riding family
    { id: 'fmt-surf-shortboard', label: 'Shortboard surfing' },
    { id: 'fmt-surf-longboard', label: 'Longboard surfing' },
    { id: 'fmt-surf-bodyboard', label: 'Bodyboarding' },
    { id: 'fmt-surf-sup', label: 'Stand-up paddle (SUP)' },
    { id: 'fmt-surf-kite', label: 'Kitesurfing' },
    { id: 'fmt-surf-wake', label: 'Wakeboarding / wakesurfing' },
    { id: 'fmt-surf-bodysurf', label: 'Bodysurfing' },
    { id: 'fmt-surf-foil', label: 'Foil surfing' },
  ],

  'exp-climbing': [
    // Climbing — very different disciplines
    { id: 'fmt-climb-boulder-indoor', label: 'Indoor bouldering' },
    { id: 'fmt-climb-sport-indoor', label: 'Indoor sport climbing (ropes)' },
    { id: 'fmt-climb-sport-outdoor', label: 'Outdoor sport climbing' },
    { id: 'fmt-climb-trad', label: 'Trad climbing' },
    { id: 'fmt-climb-via-ferrata', label: 'Via ferrata' },
    { id: 'fmt-climb-deep-water', label: 'Deep water solo' },
    { id: 'fmt-climb-ice', label: 'Ice climbing' },
    { id: 'fmt-climb-mountaineering', label: 'Mountaineering / alpine' },
  ],

  'exp-swimming': [
    // Swimming — pool vs open water changes everything
    { id: 'fmt-swim-ocean', label: 'Ocean swimming' },
    { id: 'fmt-swim-lake', label: 'Lake / river swimming' },
    { id: 'fmt-swim-pool', label: 'Pool laps' },
    { id: 'fmt-swim-open-event', label: 'Open water events / races' },
    { id: 'fmt-swim-diving', label: 'Diving / snorkelling' },
    { id: 'fmt-swim-waterpolo', label: 'Water polo' },
    { id: 'fmt-swim-wild', label: 'Wild swimming (cold + scenic)' },
  ],

  'exp-club-dancing': [
    // Nightlife — different vibes
    { id: 'fmt-club-house', label: 'House / techno night' },
    { id: 'fmt-club-latin', label: 'Latin night (salsa, reggaeton)' },
    { id: 'fmt-club-hiphop', label: 'Hip-hop / R&B night' },
    { id: 'fmt-club-bar', label: 'Bar dancing (spontaneous)' },
    { id: 'fmt-club-festival', label: 'Festival after-party / warehouse' },
    { id: 'fmt-club-private', label: 'House party / private party' },
    { id: 'fmt-club-rooftop', label: 'Rooftop / beach club' },
  ],

  // ═══════════════════════════════════════════
  // NOURISHMENT
  // ═══════════════════════════════════════════

  'sub-regen-1971': [
    // Farm-to-table / conscious dining
    { id: 'fmt-ftable-restaurant', label: 'Farm-to-table restaurant' },
    { id: 'fmt-ftable-tasting', label: 'Tasting menu / degustation' },
    { id: 'fmt-ftable-wine', label: 'Wine tasting / vineyard visit' },
    { id: 'fmt-ftable-market', label: 'Food market / food hall' },
    { id: 'fmt-ftable-festival', label: 'Food festival' },
    { id: 'fmt-ftable-supper', label: 'Pop-up supper club' },
    { id: 'fmt-ftable-foraging', label: 'Foraging experience' },
  ],

  'sub-regen-1994': [
    // Cooking for others — different scales and contexts
    { id: 'fmt-cook-dinner-party', label: 'Dinner party (friends over)' },
    { id: 'fmt-cook-supper-club', label: 'Supper club (strangers)' },
    { id: 'fmt-cook-potluck', label: 'Potluck / shared meal' },
    { id: 'fmt-cook-bbq', label: 'BBQ / cookout' },
    { id: 'fmt-cook-family', label: 'Family meal prep' },
    { id: 'fmt-cook-bake-off', label: 'Bake-off / cooking competition' },
    { id: 'fmt-cook-class-host', label: 'Hosting a cooking class' },
    { id: 'fmt-cook-meal-prep', label: 'Batch cooking / meal prep for others' },
  ],

  'exp-gardening': [
    // Gardening — what and where you grow
    { id: 'fmt-garden-veg', label: 'Vegetable patch' },
    { id: 'fmt-garden-herbs', label: 'Herb garden' },
    { id: 'fmt-garden-flower', label: 'Flower garden' },
    { id: 'fmt-garden-community', label: 'Community garden / allotment' },
    { id: 'fmt-garden-indoor', label: 'Indoor plants / houseplants' },
    { id: 'fmt-garden-permaculture', label: 'Permaculture / food forest' },
    { id: 'fmt-garden-balcony', label: 'Balcony / small-space gardening' },
  ],

  // exp-farmers-market: SKIPPED (format variations don't affect quest path)
  // exp-new-cuisine: SKIPPED (trying new food doesn't have meaningful formats)

  // ═══════════════════════════════════════════
  // STYLE
  // ═══════════════════════════════════════════

  'exp-choosing-style': [
    // Personal style — which aesthetic identity
    { id: 'fmt-style-capsule', label: 'Capsule wardrobe / minimalist' },
    { id: 'fmt-style-streetwear', label: 'Streetwear' },
    { id: 'fmt-style-vintage', label: 'Vintage / retro' },
    { id: 'fmt-style-high-fashion', label: 'High fashion / designer' },
    { id: 'fmt-style-athletic', label: 'Athleisure / sportswear' },
    { id: 'fmt-style-bohemian', label: 'Bohemian / free-spirited' },
    { id: 'fmt-style-workwear', label: 'Workwear / utility' },
    { id: 'fmt-style-androgynous', label: 'Androgynous / gender-fluid' },
  ],

  'exp-tattoo': [
    // Body art — very different traditions and styles
    { id: 'fmt-tattoo-fineline', label: 'Fine line / minimal' },
    { id: 'fmt-tattoo-traditional', label: 'Traditional / old school' },
    { id: 'fmt-tattoo-japanese', label: 'Japanese (irezumi)' },
    { id: 'fmt-tattoo-blackwork', label: 'Blackwork / tribal' },
    { id: 'fmt-tattoo-watercolour', label: 'Watercolour / abstract' },
    { id: 'fmt-tattoo-geometric', label: 'Geometric / sacred geometry' },
    { id: 'fmt-tattoo-realism', label: 'Realism / portrait' },
    { id: 'fmt-tattoo-stick-poke', label: 'Stick and poke / hand-poked' },
  ],

  'sub-fashion-2007': [
    // Slow fashion / thrifting — how you shop consciously
    { id: 'fmt-slow-thrift', label: 'Thrift store / charity shop' },
    { id: 'fmt-slow-vintage', label: 'Vintage store' },
    { id: 'fmt-slow-swap', label: 'Clothes swap' },
    { id: 'fmt-slow-upcycle', label: 'Upcycling / mending / visible repair' },
    { id: 'fmt-slow-ethical', label: 'Ethical / sustainable brands' },
    { id: 'fmt-slow-depop', label: 'Secondhand online (Depop, Vinted)' },
    { id: 'fmt-slow-made-to-order', label: 'Made-to-order / custom' },
  ],

  // ═══════════════════════════════════════════
  // BONDS
  // ═══════════════════════════════════════════

  'intimacy-2012': [
    // Dating — context changes the whole dynamic
    { id: 'fmt-date-coffee', label: 'Coffee date' },
    { id: 'fmt-date-dinner', label: 'Dinner date' },
    { id: 'fmt-date-activity', label: 'Activity date (bowling, climbing, cooking)' },
    { id: 'fmt-date-walk', label: 'Walk / park / nature date' },
    { id: 'fmt-date-drinks', label: 'Drinks / bar date' },
    { id: 'fmt-date-double', label: 'Double date / group' },
    { id: 'fmt-date-video', label: 'Video call date' },
    { id: 'fmt-date-adventure', label: 'Adventure date (day trip, surprise)' },
  ],

  'sub-ordeal-2015': [
    // Retreat — different intensities and formats
    { id: 'fmt-retreat-wilderness', label: 'Multi-day wilderness expedition' },
    { id: 'fmt-retreat-weekend', label: 'Weekend challenge retreat' },
    { id: 'fmt-retreat-wellness', label: 'Wellness retreat (yoga, spa, reset)' },
    { id: 'fmt-retreat-obstacle', label: 'Obstacle course (Tough Mudder, Spartan)' },
    { id: 'fmt-retreat-cold', label: 'Cold exposure / Wim Hof retreat' },
    { id: 'fmt-retreat-silence', label: 'Silence + adventure combo' },
    { id: 'fmt-retreat-international', label: 'International expedition' },
    { id: 'fmt-retreat-urban', label: 'Urban adventure challenge' },
    { id: 'fmt-retreat-hyrox', label: 'Hyrox / functional fitness competition' },
  ],

  'sub-digital-2015': [
    // Online community — platform matters
    { id: 'fmt-online-discord', label: 'Discord server' },
    { id: 'fmt-online-reddit', label: 'Reddit / forum community' },
    { id: 'fmt-online-facebook', label: 'Facebook group' },
    { id: 'fmt-online-paid', label: 'Paid community (Circle, Mighty Networks)' },
    { id: 'fmt-online-slack', label: 'Slack / workspace community' },
    { id: 'fmt-online-twitter', label: 'Twitter/X community' },
    { id: 'fmt-online-cohort', label: 'Cohort-based course community' },
  ],

  'sub-coaching-1937': [
    // Mastermind / group growth — structure varies
    { id: 'fmt-mm-peer', label: 'Peer mastermind (small, equal)' },
    { id: 'fmt-mm-paid', label: 'Paid mastermind (expert-led)' },
    { id: 'fmt-mm-accountability', label: 'Accountability partner (being held accountable)' },
    { id: 'fmt-mm-group-program', label: 'Group program (as a participant)' },
    { id: 'fmt-mm-advisory', label: 'Advisory board / personal board' },
    { id: 'fmt-mm-exec', label: 'Executive coaching (1:1)' },
    { id: 'fmt-mm-mens-womens', label: "Men's / women's circle" },
  ],

  'exp-volunteering': [
    // Volunteering — what kind of giving
    { id: 'fmt-vol-local', label: 'Local charity / community' },
    { id: 'fmt-vol-international', label: 'International volunteering' },
    { id: 'fmt-vol-skills', label: 'Skills-based volunteering (pro bono)' },
    { id: 'fmt-vol-animal', label: 'Animal shelter / wildlife' },
    { id: 'fmt-vol-environment', label: 'Environmental cleanup / conservation' },
    { id: 'fmt-vol-mentor', label: 'Mentoring / tutoring' },
    { id: 'fmt-vol-food', label: 'Food bank / soup kitchen' },
    { id: 'fmt-vol-crisis', label: 'Crisis / disaster response' },
  ],

  // exp-pets: SKIPPED (you have a pet or you don't — not format-driven)
  // exp-drinks-friends: SKIPPED (hanging out doesn't have quest-relevant formats)

  'exp-vulnerable-convo': [
    // Vulnerable conversation — the container matters
    { id: 'fmt-vuln-1on1', label: 'Deep 1:1 conversation' },
    { id: 'fmt-vuln-circle', label: "Men's / women's sharing circle" },
    { id: 'fmt-vuln-group', label: 'Group vulnerability exercise' },
    { id: 'fmt-vuln-therapy', label: 'Therapeutic conversation' },
    { id: 'fmt-vuln-family', label: 'Honest family conversation' },
    { id: 'fmt-vuln-stranger', label: 'Opening up to a stranger' },
    { id: 'fmt-vuln-online', label: 'Sharing something real online / in writing' },
  ],

  // ═══════════════════════════════════════════
  // SHELTER
  // ═══════════════════════════════════════════

  'sub-alt-2011': [
    // Alternative living — where and how you live
    { id: 'fmt-alt-van', label: 'Converted van' },
    { id: 'fmt-alt-camper', label: 'Campervan / RV' },
    { id: 'fmt-alt-sailboat', label: 'Sailboat / liveaboard' },
    { id: 'fmt-alt-tiny', label: 'Tiny house' },
    { id: 'fmt-alt-bus', label: 'Converted bus (skoolie)' },
    { id: 'fmt-alt-offgrid', label: 'Off-grid cabin / land' },
    { id: 'fmt-alt-commune', label: 'Intentional community / commune' },
  ],

  'sub-proptech-2020': [
    // Designing your space — what kind of design
    { id: 'fmt-space-room', label: 'Room makeover / redecorate' },
    { id: 'fmt-space-reno', label: 'Full renovation' },
    { id: 'fmt-space-style', label: 'Interior styling / feng shui' },
    { id: 'fmt-space-furniture', label: 'Furniture building / restoration' },
    { id: 'fmt-space-garden', label: 'Garden / outdoor space design' },
    { id: 'fmt-space-smart', label: 'Smart home setup' },
    { id: 'fmt-space-studio', label: 'Studio / workspace design' },
  ],

  'sub-communal-2017': [
    // Living abroad — how you do it
    { id: 'fmt-abroad-solo', label: 'Solo relocation (fresh start)' },
    { id: 'fmt-abroad-nomad', label: 'Digital nomad (location-independent)' },
    { id: 'fmt-abroad-expat', label: 'Expat community / established abroad' },
    { id: 'fmt-abroad-working-hol', label: 'Working holiday' },
    { id: 'fmt-abroad-study', label: 'Study abroad' },
    { id: 'fmt-abroad-seasonal', label: 'Seasonal living (summer/winter base)' },
    { id: 'fmt-abroad-coliving', label: 'Co-living space abroad' },
  ],

  'exp-making': [
    // Making / DIY — different crafts
    { id: 'fmt-make-wood', label: 'Woodworking' },
    { id: 'fmt-make-metal', label: 'Metalwork / welding' },
    { id: 'fmt-make-diy', label: 'DIY home improvement' },
    { id: 'fmt-make-electronics', label: 'Electronics / Arduino / soldering' },
    { id: 'fmt-make-3d', label: '3D printing' },
    { id: 'fmt-make-leather', label: 'Leatherwork' },
    { id: 'fmt-make-restore', label: 'Furniture / object restoration' },
  ],

  'exp-hosting-home': [
    // Hosting at home — different scales and purposes
    { id: 'fmt-host-airbnb', label: 'Airbnb / guest hosting' },
    { id: 'fmt-host-party', label: 'House party' },
    { id: 'fmt-host-guest', label: 'Having friends/family stay' },
    { id: 'fmt-host-game', label: 'Games night hosting' },
    { id: 'fmt-host-holiday', label: 'Holiday gathering' },
    { id: 'fmt-host-creating', label: 'Creating the whole hosting experience (food, music, vibe)' },
  ],

  // ═══════════════════════════════════════════
  // STORY
  // ═══════════════════════════════════════════

  'media-1826': [
    // Photography / videography — different disciplines
    { id: 'fmt-photo-portrait', label: 'Portrait photography' },
    { id: 'fmt-photo-landscape', label: 'Landscape / travel photography' },
    { id: 'fmt-photo-street', label: 'Street photography' },
    { id: 'fmt-photo-documentary', label: 'Documentary / photojournalism' },
    { id: 'fmt-photo-event', label: 'Event / wedding photography' },
    { id: 'fmt-photo-product', label: 'Product / commercial' },
    { id: 'fmt-photo-mobile', label: 'Mobile photography / Instagram' },
    { id: 'fmt-photo-film', label: 'Film / analogue photography' },
  ],

  'media-1954': [
    // Musical instrument — what you play
    { id: 'fmt-music-guitar', label: 'Guitar (acoustic / electric)' },
    { id: 'fmt-music-piano', label: 'Piano / keyboard' },
    { id: 'fmt-music-drums', label: 'Drums / percussion' },
    { id: 'fmt-music-voice', label: 'Singing / vocals' },
    { id: 'fmt-music-dj', label: 'DJ / electronic production' },
    { id: 'fmt-music-band', label: 'Band / ensemble' },
    { id: 'fmt-music-solo', label: 'Solo acoustic performance' },
    { id: 'fmt-music-production', label: 'Home studio / music production' },
  ],

  'media-2018': [
    // Short-form video — platform and style
    { id: 'fmt-short-tiktok', label: 'TikTok' },
    { id: 'fmt-short-reels', label: 'Instagram Reels' },
    { id: 'fmt-short-yt-shorts', label: 'YouTube Shorts' },
    { id: 'fmt-short-talking-head', label: 'Talking head / opinion' },
    { id: 'fmt-short-transitions', label: 'Edit-heavy / transitions' },
    { id: 'fmt-short-vlog', label: 'Vlog / day-in-my-life' },
    { id: 'fmt-short-tutorial', label: 'Tutorial / how-to' },
    { id: 'fmt-short-comedy', label: 'Comedy skits' },
  ],

  'sub-oral-1860': [
    // Stand-up / live spoken word — different formats
    { id: 'fmt-comedy-open-mic', label: 'Open mic night' },
    { id: 'fmt-comedy-club', label: 'Comedy club set' },
    { id: 'fmt-comedy-improv', label: 'Improv comedy' },
    { id: 'fmt-comedy-sketch', label: 'Sketch comedy' },
    { id: 'fmt-comedy-roast', label: 'Roast' },
    { id: 'fmt-comedy-moth', label: 'Storytelling night (The Moth)' },
    { id: 'fmt-comedy-one-person', label: 'One-person show' },
  ],

  'sub-oral-2015': [
    // Live music / festivals — very different experiences
    { id: 'fmt-live-arena', label: 'Arena / stadium concert' },
    { id: 'fmt-live-intimate', label: 'Intimate gig (pub, bar, small venue)' },
    { id: 'fmt-live-festival-multi', label: 'Multi-day music festival' },
    { id: 'fmt-live-day-festival', label: 'Day festival' },
    { id: 'fmt-live-open-air', label: 'Open air / park concert' },
    { id: 'fmt-live-dj', label: 'DJ set / electronic event' },
    { id: 'fmt-live-classical', label: 'Classical / orchestral concert' },
    { id: 'fmt-live-jazz', label: 'Jazz club / intimate jazz' },
  ],

  'sub-written-1719': [
    // Reading — what you read changes who you become
    { id: 'fmt-read-fiction-lit', label: 'Literary fiction' },
    { id: 'fmt-read-fiction-genre', label: 'Genre fiction (thriller, sci-fi, romance)' },
    { id: 'fmt-read-nonfiction', label: 'Non-fiction (ideas, science, history)' },
    { id: 'fmt-read-biography', label: 'Biography / memoir' },
    { id: 'fmt-read-self-help', label: 'Self-help / personal development' },
    { id: 'fmt-read-poetry', label: 'Poetry collections' },
    { id: 'fmt-read-short', label: 'Short stories / essays' },
    { id: 'fmt-read-book-club', label: 'Book club (reading + discussing)' },
  ],

  'sub-written-1999': [
    // Writing — very different practices
    { id: 'fmt-write-morning', label: 'Morning pages / stream of consciousness' },
    { id: 'fmt-write-journal', label: 'Reflective journaling' },
    { id: 'fmt-write-creative', label: 'Creative writing / fiction' },
    { id: 'fmt-write-poetry', label: 'Poetry' },
    { id: 'fmt-write-blog', label: 'Blog / newsletter (Substack)' },
    { id: 'fmt-write-memoir', label: 'Memoir writing' },
    { id: 'fmt-write-social', label: 'Social writing (threads, LinkedIn essays)' },
    { id: 'fmt-write-song', label: 'Songwriting' },
    { id: 'fmt-write-screen', label: 'Screenwriting / scriptwriting' },
  ],

  'sub-audio-2005': [
    // Audio listening — different content types
    { id: 'fmt-audio-interview', label: 'Interview podcasts' },
    { id: 'fmt-audio-narrative', label: 'Narrative / storytelling podcasts' },
    { id: 'fmt-audio-educational', label: 'Educational podcasts' },
    { id: 'fmt-audio-comedy', label: 'Comedy podcasts' },
    { id: 'fmt-audio-true-crime', label: 'True crime' },
    { id: 'fmt-audio-audiobook', label: 'Audiobooks' },
    { id: 'fmt-audio-guided', label: 'Guided meditations / audio courses' },
  ],

  'sub-video-2005': [
    // Video creation — different output types
    { id: 'fmt-vid-youtube', label: 'YouTube long-form' },
    { id: 'fmt-vid-documentary', label: 'Documentary' },
    { id: 'fmt-vid-music-video', label: 'Music video' },
    { id: 'fmt-vid-short-film', label: 'Short film / narrative' },
    { id: 'fmt-vid-course', label: 'Course / tutorial video' },
    { id: 'fmt-vid-vlog', label: 'Vlog' },
    { id: 'fmt-vid-livestream', label: 'Live stream' },
    { id: 'fmt-vid-animation', label: 'Animation / motion graphics' },
    { id: 'fmt-vid-ai', label: 'AI video creation' },
  ],

  'sub-craft-1880': [
    // Art / craft — different mediums
    { id: 'fmt-art-painting', label: 'Painting (oil, acrylic, watercolour)' },
    { id: 'fmt-art-drawing', label: 'Drawing / sketching' },
    { id: 'fmt-art-pottery', label: 'Pottery / ceramics' },
    { id: 'fmt-art-printmaking', label: 'Printmaking' },
    { id: 'fmt-art-sculpture', label: 'Sculpture' },
    { id: 'fmt-art-life-drawing', label: 'Life drawing class' },
    { id: 'fmt-art-mixed', label: 'Mixed media / collage' },
    { id: 'fmt-art-digital', label: 'Digital art / illustration' },
  ],

  'exp-public-speaking': [
    // Public speaking — different contexts and formats
    { id: 'fmt-speak-keynote', label: 'Keynote / conference talk' },
    { id: 'fmt-speak-workshop', label: 'Workshop facilitation' },
    { id: 'fmt-speak-panel', label: 'Panel discussion' },
    { id: 'fmt-speak-mc', label: 'MC / event hosting' },
    { id: 'fmt-speak-pitch', label: 'Pitch / demo day' },
    { id: 'fmt-speak-toast', label: 'Toast / wedding speech' },
    { id: 'fmt-speak-podcast', label: 'Podcast guesting' },
    { id: 'fmt-speak-tedx', label: 'TEDx / big-stage talk' },
  ],

  'exp-selling': [
    // Selling — different modalities
    { id: 'fmt-sell-1on1', label: '1:1 sales conversation' },
    { id: 'fmt-sell-stage', label: 'Stage selling / webinar' },
    { id: 'fmt-sell-page', label: 'Sales page / online funnel' },
    { id: 'fmt-sell-dm', label: 'DM / outreach selling' },
    { id: 'fmt-sell-market', label: 'Market stall / in-person' },
    { id: 'fmt-sell-negotiate', label: 'Negotiation / deal-making' },
    { id: 'fmt-sell-fundraise', label: 'Fundraising / pitching investors' },
  ],

  'exp-coaching': [
    // Coaching — different containers
    { id: 'fmt-coach-1on1', label: '1:1 coaching' },
    { id: 'fmt-coach-group', label: 'Group coaching program' },
    { id: 'fmt-coach-peer', label: 'Peer coaching / co-coaching' },
    { id: 'fmt-coach-mentor', label: 'Mentoring (experience-based)' },
    { id: 'fmt-coach-accountability', label: 'Accountability partner' },
    { id: 'fmt-coach-online', label: 'Online / async coaching' },
    { id: 'fmt-coach-walk', label: 'Walk-and-talk coaching' },
  ],

  // exp-cinema: SKIPPED (watching films doesn't have quest-relevant format variations)

  'exp-research': [
    // Research — different methods and contexts
    { id: 'fmt-research-web', label: 'Deep web research / rabbit holes' },
    { id: 'fmt-research-academic', label: 'Academic papers / journals' },
    { id: 'fmt-research-interview', label: 'Interviewing experts / people' },
    { id: 'fmt-research-data', label: 'Data analysis / spreadsheets' },
    { id: 'fmt-research-investigative', label: 'Investigative / journalism' },
    { id: 'fmt-research-library', label: 'Library / archive research' },
    { id: 'fmt-research-field', label: 'Field research / observation' },
  ],

  // ═══════════════════════════════════════════
  // PLAY
  // ═══════════════════════════════════════════

  'play-1972': [
    // Video games — very different experiences
    { id: 'fmt-game-story', label: 'Single player story (RPG, adventure)' },
    { id: 'fmt-game-online', label: 'Online multiplayer' },
    { id: 'fmt-game-competitive', label: 'Competitive / ranked' },
    { id: 'fmt-game-casual', label: 'Casual / mobile' },
    { id: 'fmt-game-vr', label: 'VR gaming' },
    { id: 'fmt-game-retro', label: 'Retro gaming' },
    { id: 'fmt-game-sandbox', label: 'Sandbox (Minecraft, creative)' },
    { id: 'fmt-game-rpg-tabletop', label: 'Tabletop RPG (D&D)' },
  ],

  'sub-board-1995': [
    // Board games — different styles
    { id: 'fmt-board-euro', label: 'Euro strategy (Catan, Ticket to Ride)' },
    { id: 'fmt-board-coop', label: 'Cooperative games (Pandemic)' },
    { id: 'fmt-board-party', label: 'Party games (Codenames, Wavelength)' },
    { id: 'fmt-board-war', label: 'Wargaming / miniatures' },
    { id: 'fmt-board-trivia', label: 'Trivia / quiz night' },
    { id: 'fmt-board-deck', label: 'Deck-building / card games' },
    { id: 'fmt-board-legacy', label: 'Legacy / campaign games' },
    { id: 'fmt-board-cafe', label: 'Board game cafe' },
  ],

  'sub-sport-1871': [
    // Team sport — which sport changes everything
    { id: 'fmt-sport-football', label: 'Football / soccer' },
    { id: 'fmt-sport-basketball', label: 'Basketball' },
    { id: 'fmt-sport-rugby', label: 'Rugby' },
    { id: 'fmt-sport-cricket', label: 'Cricket' },
    { id: 'fmt-sport-volleyball', label: 'Volleyball / beach volleyball' },
    { id: 'fmt-sport-hockey', label: 'Hockey (field or ice)' },
    { id: 'fmt-sport-ultimate', label: 'Ultimate frisbee' },
    { id: 'fmt-sport-touch', label: 'Touch / tag rugby / social sport' },
  ],

  'sub-sport-1936': [
    // Watching sport — how and where you watch
    { id: 'fmt-watch-stadium', label: 'Stadium / live at the ground' },
    { id: 'fmt-watch-home', label: 'TV at home' },
    { id: 'fmt-watch-pub', label: 'Pub / bar with friends' },
    { id: 'fmt-watch-fantasy', label: 'Fantasy league / stats nerd' },
    { id: 'fmt-watch-betting', label: 'Sports betting' },
    { id: 'fmt-watch-season', label: 'Following a team through the season' },
    { id: 'fmt-watch-analysis', label: 'Tactics / analysis / podcasts' },
  ],

  'sub-chance-2003': [
    // Poker / gambling — different flavors of chance
    { id: 'fmt-poker-home', label: 'Home poker game' },
    { id: 'fmt-poker-casino', label: 'Casino poker' },
    { id: 'fmt-poker-online', label: 'Online poker' },
    { id: 'fmt-poker-tournament', label: 'Tournament play' },
    { id: 'fmt-poker-cards', label: 'Card games (blackjack, bridge)' },
    { id: 'fmt-poker-strategy', label: 'Poker strategy / study' },
  ],

  'sub-toy-1932': [
    // LEGO / construction — building as play
    { id: 'fmt-lego-sets', label: 'LEGO sets (following instructions)' },
    { id: 'fmt-lego-moc', label: 'LEGO MOC (custom builds)' },
    { id: 'fmt-lego-model', label: 'Model kits (aircraft, ships)' },
    { id: 'fmt-lego-rc', label: 'RC cars / drones' },
    { id: 'fmt-lego-train', label: 'Train sets / miniature worlds' },
    { id: 'fmt-lego-miniature', label: 'Miniature painting (Warhammer)' },
    { id: 'fmt-lego-trading', label: 'Trading card games (MTG, Pokemon)' },
  ],

  'exp-thrill': [
    // Thrill / adrenaline — different rush sources
    { id: 'fmt-thrill-skydive', label: 'Skydiving' },
    { id: 'fmt-thrill-bungee', label: 'Bungee jumping' },
    { id: 'fmt-thrill-coaster', label: 'Roller coasters / theme parks' },
    { id: 'fmt-thrill-zip', label: 'Zip lining' },
    { id: 'fmt-thrill-paraglide', label: 'Paragliding / hang gliding' },
    { id: 'fmt-thrill-rafting', label: 'White water rafting' },
    { id: 'fmt-thrill-karting', label: 'Go-karting / racing' },
    { id: 'fmt-thrill-base', label: 'Base jumping / wingsuit' },
  ],

  // ═══════════════════════════════════════════
  // FIRE
  // ═══════════════════════════════════════════

  'sub-combustion-1400': [
    // Campfire — different contexts
    { id: 'fmt-fire-beach', label: 'Beach bonfire' },
    { id: 'fmt-fire-backyard', label: 'Backyard fire pit' },
    { id: 'fmt-fire-camping', label: 'Camping campfire' },
    { id: 'fmt-fire-bbq', label: 'BBQ / fire cooking' },
    { id: 'fmt-fire-party', label: 'Fire pit party / gathering' },
    { id: 'fmt-fire-hearth', label: 'Fireplace / wood-burning stove (indoor)' },
    { id: 'fmt-fire-solo', label: 'Solo fire (quiet, contemplative)' },
  ],

  'sub-light-2020': [
    // Candle / hygge — different rituals
    { id: 'fmt-candle-dinner', label: 'Candlelit dinner' },
    { id: 'fmt-candle-bath', label: 'Candlelit bath' },
    { id: 'fmt-candle-meditation', label: 'Meditation by candlelight' },
    { id: 'fmt-candle-religious', label: 'Religious / advent candles' },
    { id: 'fmt-candle-making', label: 'Candle making' },
    { id: 'fmt-candle-lantern', label: 'Lantern festival / floating lights' },
    { id: 'fmt-candle-hygge', label: 'Hygge evening (blankets, glow, warmth)' },
  ],

  'sub-ritual-fire-2015b': [
    // Fire ceremony — different traditions
    { id: 'fmt-ceremony-circle', label: 'Fire circle ceremony' },
    { id: 'fmt-ceremony-walk', label: 'Fire walking' },
    { id: 'fmt-ceremony-spin', label: 'Fire spinning / poi / flow arts' },
    { id: 'fmt-ceremony-burning', label: 'Burning ceremony (writing + releasing)' },
    { id: 'fmt-ceremony-lantern', label: 'Lantern / sky lantern release' },
    { id: 'fmt-ceremony-sweat', label: 'Sweat lodge' },
    { id: 'fmt-ceremony-moon', label: 'Full moon fire ritual' },
    { id: 'fmt-ceremony-cacao', label: 'Cacao + fire ceremony' },
  ],

  // ═══════════════════════════════════════════
  // HEALING
  // ═══════════════════════════════════════════

  'sub-traditional-2023': [
    // Cacao ceremony — different containers
    { id: 'fmt-cacao-group', label: 'Group cacao circle' },
    { id: 'fmt-cacao-1on1', label: '1:1 cacao session' },
    { id: 'fmt-cacao-breath', label: 'Cacao + breathwork' },
    { id: 'fmt-cacao-movement', label: 'Cacao + movement / dance' },
    { id: 'fmt-cacao-sound', label: 'Cacao + sound healing' },
    { id: 'fmt-cacao-home', label: 'At-home cacao ritual (solo)' },
    { id: 'fmt-cacao-retreat', label: 'Retreat cacao ceremony' },
  ],

  'sub-psychedelic-2016': [
    // Psychedelic therapy — very different modalities
    { id: 'fmt-psych-psilocybin', label: 'Guided psilocybin session' },
    { id: 'fmt-psych-ayahuasca', label: 'Ayahuasca ceremony' },
    { id: 'fmt-psych-ketamine', label: 'Ketamine therapy' },
    { id: 'fmt-psych-microdose', label: 'Microdosing protocol' },
    { id: 'fmt-psych-integration', label: 'Integration circle' },
    { id: 'fmt-psych-mdma', label: 'MDMA-assisted therapy' },
    { id: 'fmt-psych-retreat', label: 'Psychedelic retreat (multi-day)' },
    { id: 'fmt-psych-solo', label: 'Solo journey (experienced)' },
  ],

  'sub-somatic-1400': [
    // Breathwork — many lineages
    { id: 'fmt-breath-holotropic', label: 'Holotropic breathwork' },
    { id: 'fmt-breath-wimhof', label: 'Wim Hof breathing' },
    { id: 'fmt-breath-pranayama', label: 'Pranayama (yogic)' },
    { id: 'fmt-breath-connected', label: 'Connected / circular breathwork' },
    { id: 'fmt-breath-rebirthing', label: 'Rebirthing breathwork' },
    { id: 'fmt-breath-box', label: 'Box breathing / tactical' },
    { id: 'fmt-breath-app', label: 'Breathwork app (Othership)' },
    { id: 'fmt-breath-group', label: 'Group breathwork circle' },
  ],

  'sub-mindbody-1979': [
    // Meditation — many traditions and methods
    { id: 'fmt-med-vipassana', label: 'Vipassana (silent retreat)' },
    { id: 'fmt-med-tm', label: 'Transcendental meditation (TM)' },
    { id: 'fmt-med-app', label: 'Guided app (Headspace, Calm, Waking Up)' },
    { id: 'fmt-med-walking', label: 'Walking meditation' },
    { id: 'fmt-med-body-scan', label: 'Body scan' },
    { id: 'fmt-med-metta', label: 'Loving-kindness (metta)' },
    { id: 'fmt-med-zen', label: 'Zen / zazen' },
    { id: 'fmt-med-group', label: 'Group sit / sangha' },
  ],

  'sub-mental-1964': [
    // Therapy — different modalities
    { id: 'fmt-therapy-cbt', label: 'CBT (cognitive behavioural)' },
    { id: 'fmt-therapy-psychodynamic', label: 'Psychodynamic / depth therapy' },
    { id: 'fmt-therapy-ifs', label: 'IFS / parts work' },
    { id: 'fmt-therapy-emdr', label: 'EMDR' },
    { id: 'fmt-therapy-somatic', label: 'Somatic therapy' },
    { id: 'fmt-therapy-online', label: 'Online therapy (BetterHelp, etc.)' },
    { id: 'fmt-therapy-group', label: 'Group therapy' },
    { id: 'fmt-therapy-couples', label: 'Couples / relationship therapy' },
  ],

  'sub-energy-2015': [
    // Sound healing — different instruments and contexts
    { id: 'fmt-sound-crystal', label: 'Crystal bowl sound bath' },
    { id: 'fmt-sound-gong', label: 'Gong bath' },
    { id: 'fmt-sound-tibetan', label: 'Tibetan singing bowls' },
    { id: 'fmt-sound-nidra', label: 'Sound + yoga nidra' },
    { id: 'fmt-sound-binaural', label: 'Binaural beats / frequency' },
    { id: 'fmt-sound-tuning', label: 'Tuning fork therapy' },
    { id: 'fmt-sound-cacao', label: 'Sound + cacao ceremony' },
  ],

  'sub-temperature-2019': [
    // Sauna / heat — different traditions
    { id: 'fmt-heat-finnish', label: 'Finnish sauna' },
    { id: 'fmt-heat-infrared', label: 'Infrared sauna' },
    { id: 'fmt-heat-steam', label: 'Steam room / hammam' },
    { id: 'fmt-heat-hotspring', label: 'Hot springs / onsen' },
    { id: 'fmt-heat-banya', label: 'Russian banya' },
    { id: 'fmt-heat-korean', label: 'Korean jjimjilbang' },
    { id: 'fmt-heat-contrast', label: 'Contrast therapy (sauna + cold plunge)' },
  ],

  'exp-spiritual': [
    // Spiritual practice — many traditions
    { id: 'fmt-spirit-prayer', label: 'Prayer' },
    { id: 'fmt-spirit-church', label: 'Church / mosque / temple / synagogue' },
    { id: 'fmt-spirit-nature', label: 'Nature reverence / earth spirituality' },
    { id: 'fmt-spirit-meditation', label: 'Meditation as spiritual practice' },
    { id: 'fmt-spirit-pilgrimage', label: 'Pilgrimage (Camino, Kailash, etc.)' },
    { id: 'fmt-spirit-chanting', label: 'Chanting / kirtan / mantra' },
    { id: 'fmt-spirit-buddhist', label: 'Buddhist practice / sangha' },
    { id: 'fmt-spirit-mystical', label: 'Sufi / mystical / esoteric traditions' },
    { id: 'fmt-spirit-astrology', label: 'Astrology / tarot / divination' },
  ],

  // ═══════════════════════════════════════════
  // SLEEP
  // ═══════════════════════════════════════════

  'sub-dream-1975': [
    // Lucid dreaming / dream work — different approaches
    { id: 'fmt-dream-lucid', label: 'Lucid dreaming practice' },
    { id: 'fmt-dream-journal', label: 'Dream journaling' },
    { id: 'fmt-dream-jungian', label: 'Jungian dream analysis' },
    { id: 'fmt-dream-hypnagogia', label: 'Sleep onset / hypnagogia exploration' },
    { id: 'fmt-dream-incubation', label: 'Dream incubation (planting a question)' },
    { id: 'fmt-dream-sharing', label: 'Dream sharing circle' },
  ],

  // sub-rest-1999: SKIPPED (napping doesn't have quest-relevant format variations)

  'sub-states-1954': [
    // Altered states / deep rest — different methods
    { id: 'fmt-states-float', label: 'Float tank session' },
    { id: 'fmt-states-nidra', label: 'Yoga nidra' },
    { id: 'fmt-states-nsdr', label: 'NSDR protocol (Huberman)' },
    { id: 'fmt-states-hypno', label: 'Hypnotherapy' },
    { id: 'fmt-states-guided-rest', label: 'Guided deep rest protocol' },
  ],

  'exp-nature-stillness': [
    // Nature stillness — different settings
    { id: 'fmt-nature-sunset', label: 'Sunset / sunrise watching' },
    { id: 'fmt-nature-river', label: 'River / lakeside sitting' },
    { id: 'fmt-nature-forest', label: 'Forest bathing (shinrin-yoku)' },
    { id: 'fmt-nature-stars', label: 'Stargazing' },
    { id: 'fmt-nature-rain', label: 'Walking in rain' },
    { id: 'fmt-nature-mountain', label: 'Mountain contemplation' },
    { id: 'fmt-nature-garden', label: 'Garden sitting' },
    { id: 'fmt-nature-beach', label: 'Beach listening (waves)' },
  ],
}

/**
 * Career vector options (Layer 2)
 * Multi-select — user can pick multiple vectors per experience node.
 * "hobby" selections are excluded from AI quest-path generation.
 */
export const CAREER_VECTORS = [
  {
    id: 'do_it',
    label: 'Doing it',
    subtitle: 'This becomes my work',
  },
  {
    id: 'guide_it',
    label: 'Guiding others through it',
    subtitle: 'Teaching, facilitating, coaching',
  },
  {
    id: 'build_around',
    label: 'Building around it',
    subtitle: 'Platform, brand, space, content',
  },
  {
    id: 'hobby',
    label: 'Keeping this as a hobby',
    subtitle: "Love it, don't want it as work",
  },
]

/**
 * Check if a dome node has Layer 1 sub-nodes
 */
export function hasSubNodes(nodeId) {
  return nodeId in DOME_SUB_NODES
}

/**
 * Get sub-nodes for a dome node (empty array if none)
 */
export function getSubNodes(nodeId) {
  return DOME_SUB_NODES[nodeId] || []
}
