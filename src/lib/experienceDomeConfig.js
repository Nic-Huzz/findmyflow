/**
 * Experience Dome Configuration
 *
 * Defines which Rule Break Tree nodes are "experiential" (things a person can DO
 * and rate with an NS state) vs "infrastructure" (industry/tech innovations).
 *
 * Heuristic: sub-branch nodes are ~90% experiential. Main branch nodes are mixed.
 * This file explicitly lists PRUNED node IDs — everything else is experiential.
 *
 * See docs/features/experience-dome-node-mapping.md for the full mapping.
 */

// ── Pruned node IDs (not personal experiences) ──
// These are infrastructure, policy, industry, or research nodes that don't
// translate to something a person can rate with an NS state.
const PRUNED_IDS = new Set([
  // Cars main (industry/manufacturing)
  'car-1913', 'car-1919', 'car-1924', 'car-1959', 'car-1966', 'car-1973',
  'car-1990', 'car-1997',

  // Tech main (infrastructure/research)
  'tech-1943', 'tech-1971', 'tech-1984', 'tech-1995', 'tech-2006', 'tech-2008a',

  // AI main (research milestones)
  'ai-1997', 'ai-2012', 'ai-2016', 'ai-2017', 'ai-2020',

  // Energy main (infrastructure)
  'energy-1776', 'energy-1882', 'energy-1893', 'energy-1901', 'energy-1956',
  'energy-1991', 'energy-2008', 'energy-2017',

  // Fire sub-branches (industrial/infrastructure)
  'sub-combustion-1760', 'sub-combustion-1870', 'sub-combustion-2005',
  'sub-grid-1935', 'sub-grid-2010',
  'sub-renewable-1980', 'sub-renewable-2022',
  'sub-personal-fire-1950',

  // Food main (agriculture/industry)
  'food-1730', 'food-1810', 'food-1834', 'food-1876', 'food-1913',
  'food-1968', 'food-1994',

  // Nourishment sub-branches (science/policy)
  'sub-ferment-1864', 'sub-ferment-2007',
  'sub-fasting-1850',
  'sub-industrial-1967', 'sub-industrial-1980', 'sub-industrial-1960', 'sub-industrial-1970',
  'sub-regen-1984', 'sub-regen-2015',

  // Fashion main (industry)
  'fashion-1858', 'fashion-1926',

  // Status sub-branches (history)
  'sub-fashion-1400', // body decoration too ancient to rate
  'sub-luxury-1987', // LVMH corporate

  // Comms main (technology)
  'comms-1844', 'comms-1901',

  // Exchange main (monetary/policy)
  'exchange-1100', 'exchange-1397', 'exchange-1694', 'exchange-1841',
  'exchange-1855', 'exchange-1967', 'exchange-2025',

  // Intimacy main (research/policy)
  'intimacy-1100', 'intimacy-1855', 'intimacy-1948', 'intimacy-1977',
  'intimacy-2017b', 'intimacy-2020',

  // Medicine main (scientific discoveries)
  'med-1867', 'med-1882',

  // Healing sub-branches (research/policy)
  'sub-traditional-1550',
  'sub-psychedelic-1970', 'sub-psychedelic-1986',

  // Property main (construction)
  'property-1885', 'property-1908', 'property-2021',

  // Shelter sub-branches (infrastructure)
  'sub-indoor-1950', 'sub-indoor-1984',
  'sub-proptech-1944',

  // Defense main (military/warfare)
  'defense-1617', 'defense-1916', 'defense-1945', 'defense-1968',
  'defense-1988', 'defense-2001', 'defense-2017',

  // Threat sub-branches (military/policy/tech)
  'sub-weapons-1400', 'sub-weapons-2016', 'sub-weapons-1968',
  'sub-insurance-1762',
  'sub-surveillance-1400',
  'sub-cyber-1987', 'sub-cyber-2020', 'sub-cyber-2023',

  // Rest (scientific discoveries)
  'sleep-1879', 'sleep-1953', 'sleep-2017b',
  'sub-dream-2010', // lab-only targeted memory reactivation
  'sub-sleepmedicine-1400', 'sub-sleepmedicine-1929',
  'sub-circadian-1729',
  'sub-rest-1784',

  // Media main (printing/tech)
  'media-1440',

  // Play (mechanics, not experience)
  'play-2017', // loot boxes

  // Free play (policy)
  'sub-free-1989', // UN right to play
])

// ── Experience labels (overrides for nodes where the innovation label ≠ the experience) ──
const EXPERIENCE_LABELS = {
  // Cars
  'car-1886': 'Driving / Road trips',
  'car-1903': 'Flying / Air travel',
  'car-1952': 'International travel / backpacking',
  'car-1956': 'Long-distance road trip',
  'car-2008': 'Driving an electric vehicle',
  'car-2010': 'Ride-sharing (Uber/Lyft)',
  'car-2020': 'Riding in a self-driving car',

  // Tech
  'tech-1975': 'Using a personal computer',
  'tech-1991': 'Browsing the web',
  'tech-1998': 'Searching online (Google)',
  'tech-2007': 'Using a smartphone',
  'tech-2004': 'Using social media',
  'ai-2022': 'Using AI tools (ChatGPT, Claude)',

  // Energy
  'energy-1954': 'Solar panels (owning/using)',

  // Media
  'media-1605': 'Reading a newspaper',
  'media-1826': 'Photography / videography',
  'media-1877': 'Listening to recorded music',
  'media-1895': 'Watching a film in cinema',
  'media-1920': 'Listening to radio',
  'media-1948': 'Watching television',
  'media-1954': 'Playing a musical instrument',
  'media-1991': 'Publishing online (blog/website)',
  'media-2004': 'Posting on social media',
  'media-2007': 'Streaming (Netflix, etc.)',
  'media-2008': 'Music streaming (Spotify)',
  'media-2012': 'Online course / e-learning',
  'media-2018': 'Creating short-form video (Reels, TikTok)',
  'media-2022': 'AI-generated content creation',

  // Food
  'food-1948': 'Eating fast food',
  'food-2002': 'Eating organic / Farmers market',
  'food-2013': 'Food delivery apps',

  // Fashion
  'fashion-1852': 'Department store shopping',
  'fashion-1916': 'Wearing cosmetics / makeup',
  'fashion-1975': 'Fast fashion shopping',
  'fashion-2013': 'Following influencers',
  'fashion-2021': 'Building a personal brand',

  // Comms
  'comms-1775': 'Writing/receiving letters',
  'comms-1876': 'Making a phone call',
  'comms-1971': 'Sending email',
  'comms-1983': 'Using a mobile phone',
  'comms-1992': 'Text messaging',
  'comms-2009': 'Messaging apps (WhatsApp)',
  // comms-2020 removed from core (too generic)

  // Exchange
  'exchange-1602': 'Investing in stocks',
  'exchange-1950': 'Using a credit card',
  'exchange-1999': 'Digital payments (PayPal, Venmo)',
  'exchange-2007': 'Mobile banking',
  'exchange-2009': 'Buying/using cryptocurrency',

  // Intimacy
  'intimacy-1170': 'Romantic love / falling in love',
  'intimacy-1960': 'Hormonal contraception',
  'intimacy-1978': 'IVF / fertility treatment',
  'intimacy-2012': 'Going on a date',
  'intimacy-2017a': 'AI companion / emotional AI',

  // Medicine
  'med-1846': 'Having surgery / anaesthesia',
  'med-1895': 'Getting a medical scan (X-ray, MRI)',
  'med-1928': 'Taking antibiotics',
  'med-1955': 'Getting vaccinated',
  'med-1952': 'Taking psychiatric medication',
  'med-2003': 'Genetic testing',
  'med-2015': 'Telemedicine / virtual doctor',
  'med-2020': 'mRNA vaccine',

  // Property
  'property-1947': 'Living in suburbia',
  'property-2008': 'Unique stays / boutique accommodation',
  'property-2011': 'Smart home living',

  // Defense
  'defense-1688': 'Buying insurance',

  // Rest main
  'sleep-1100': 'Healing sleep ritual',
  'sleep-1652': 'Coffee / caffeine ritual',
  'sleep-1869': 'Sleeping pills',
  'sleep-1899': 'Dream journaling',
  'sleep-1958': 'Melatonin supplement',
  'sleep-1981': 'CPAP / sleep apnea treatment',
  'sleep-2009': 'Sleep tracking (wearable)',
  'sleep-2017a': 'Prioritizing sleep hygiene',
  'sleep-2020': 'Dream incubation / lucid dreaming',

  // Play main
  'play-1100a': 'Playing board games',
  'play-1100b': 'Dice / gambling for fun',
  'play-1100c': 'Olympic sports (watching/competing)',
  'play-1100d': 'Playing chess / strategy games',
  'play-1377': 'Card games',
  'play-1638': 'Visiting a casino',
  'play-1863': 'Playing organised sport',
  'play-1885': 'Playing on a playground',
  'play-1935': 'Board games (Monopoly, etc.)',
  'play-1971': 'Karaoke',
  'play-1972': 'Playing video games',
  'play-1974': 'Tabletop RPG (D&D)',
  'play-1996': 'Online gambling',
  'play-2004': 'MMO gaming (WoW, etc.)',
  'play-2006': 'User-made games (Roblox)',
  'play-2009a': 'Mobile gaming',
  'play-2009b': 'Sandbox gaming (Minecraft)',
  'play-2011': 'Esports (watching/competing)',
  'play-2012': 'Therapeutic / gamified healing',
  'play-2019': 'AI game master / AI RPG',

  // Sub-branch experience labels (where the innovation label is unclear)
  'sub-endurance-1400': 'Long-distance running / persistence',
  'sub-endurance-1896': 'Running a marathon',
  'sub-endurance-1962': 'Jogging / recreational running',
  'sub-endurance-2004': 'Social running (parkrun, Strava)',
  'sub-endurance-1984': "Women's marathon / breaking barriers",
  'sub-endurance-2010': 'Ultra-endurance (100mi, 24hr)',

  'sub-strength-1400': 'Carrying heavy loads',
  'sub-strength-0776': 'Athletic training / gym',
  'sub-strength-1890': 'Bodybuilding / physique training',
  'sub-strength-2000': 'CrossFit / high-intensity training',
  'sub-strength-2012': 'Home workout (Peloton, Mirror)',
  'sub-strength-2010': 'Hiking / nature walk',

  'sub-flexibility-1400': 'Deep squatting / ground living',
  'sub-flexibility-1893': 'Yoga',
  'sub-flexibility-1920': 'Studio fitness class',
  'sub-flexibility-1975': 'Stretching routine',
  'sub-flexibility-2010': 'Mobility work / foam rolling',

  'sub-temperature-1400': 'Natural temperature exposure',
  'sub-temperature-0300': 'Bathhouse / sauna / onsen',
  'sub-temperature-1849': 'Hydrotherapy / cold water',
  'sub-temperature-2011': 'Wim Hof method',
  'sub-temperature-2018': 'Cold plunge / ice bath',
  'sub-temperature-2019': 'Sauna / deliberate heat',

  'sub-outdoor-1400': 'Foraging in nature',
  'sub-outdoor-1907': 'Scouting / camping',
  'sub-outdoor-1941': 'Wilderness challenge (Outward Bound)',
  'sub-outdoor-2009': 'Barefoot running / minimal shoes',
  'sub-outdoor-2008': 'Natural movement (MovNat, parkour)',
  'sub-outdoor-2010': 'GoRuck / outdoor team challenge',

  'sub-dance-1400': 'Tribal / ceremonial dance',
  'sub-dance-1800': 'Social dance (swing, salsa)',
  'sub-dance-1987': 'Rave / electronic music event',
  'sub-dance-1972': 'Contact improvisation',
  'sub-dance-1975': 'Ecstatic dance',
  'sub-dance-1986': 'Burning Man / art festival',
  'sub-dance-2005': 'Silent disco',
  'sub-dance-2013': 'Morning sober dance event',

  'sub-somatic-1400': 'Pranayama / breathwork',
  'sub-somatic-1935': 'Body-based therapy',
  'sub-somatic-1976': 'Holotropic breathwork',
  'sub-somatic-1997': 'Somatic experiencing',
  'sub-somatic-2012': 'Wim Hof Method (breathwork)',
  'sub-somatic-2020': 'Breathwork app',

  'sub-mindbody-1893': 'Yoga (mind-body practice)',
  'sub-mindbody-1979': 'Mindfulness meditation (MBSR)',
  'sub-mindbody-2007': 'Biohacking',
  'sub-mindbody-2009': 'Wearable health tracker',
  'sub-mindbody-2018': 'Longevity protocols',
  'sub-mindbody-2021': 'Huberman Lab protocols',

  'sub-mental-1900': 'Talk therapy',
  'sub-mental-1964': 'Therapy / counselling',
  'sub-mental-2012': 'Online therapy (BetterHelp)',
  'sub-mental-2017': 'AI therapy / chatbot',
  'sub-mental-2019': 'IFS / parts work',

  'sub-psychedelic-1400': 'Sacred mushroom ceremony',
  'sub-psychedelic-1943': 'LSD experience',
  'sub-psychedelic-2016': 'Psilocybin therapy',
  'sub-psychedelic-2019': 'Ketamine clinic',

  'sub-traditional-1796': 'Homeopathy',
  'sub-traditional-1994': 'Supplements',
  'sub-traditional-2010': 'Functional medicine',
  'sub-traditional-2023': 'Cacao ceremony',

  'sub-energy-1922': 'Reiki',
  'sub-energy-1934': 'Frequency therapy',
  'sub-energy-1980': 'Sound bath',
  'sub-energy-2015': 'Sound bath (attending)',

  'sub-ritual-1400': 'Tribal initiation / rite of passage',
  'sub-ritual-1400b': 'Religious congregation',
  'sub-ritual-1935': '12-step / support group',
  'sub-ritual-1985': "Men's / women's circle",
  'sub-ritual-2018': 'Cacao + breathwork ceremony',

  'sub-communal-1400': 'Band-level communal living',
  'sub-communal-1910': 'Kibbutz / intentional community',
  'sub-communal-1965': 'Commune / shared living',
  'sub-communal-2015': 'Co-living space',
  'sub-communal-2017': 'Living abroad',

  'sub-ordeal-1400': 'Shared survival challenge',
  'sub-ordeal-1775': 'Military bonding / service',
  'sub-ordeal-1863': 'Team sports',
  'sub-ordeal-2000': 'CrossFit / group fitness ordeal',
  'sub-ordeal-2015': 'Retreat',

  'sub-digital-1979': 'BBS / online forum',
  'sub-digital-2005': 'Reddit / forums',
  'sub-digital-2010': 'Facebook groups',
  'sub-digital-2015': 'Being part of an online community',
  'sub-digital-2017': 'Paid community (Circle, MN)',

  'sub-coaching-1400': 'Advisory board / council',
  'sub-coaching-1937': 'Mastermind group',
  'sub-coaching-1995': 'Executive coaching',
  'sub-coaching-2010': 'Online coaching',
  'sub-coaching-2024': 'AI coaching',

  'sub-couples-1400': 'Arranged / traditional marriage',
  'sub-couples-1800': 'Romantic love partnership',
  'sub-couples-1996': 'Couples therapy (Gottman)',
  'sub-couples-1997': 'Conscious relating / polarity work',
  'sub-couples-1995': 'Online dating',

  'sub-states-1400': 'Yoga nidra',
  'sub-states-1843': 'Clinical hypnosis',
  'sub-states-1954': 'Float tank / sensory deprivation',
  'sub-states-1972': 'Transcendental meditation',
  'sub-states-2022': 'NSDR (non-sleep deep rest)',

  'sub-dream-1400': 'Dream interpretation',
  'sub-dream-1913': 'Jungian dream work',
  'sub-dream-1975': 'Lucid dreaming',
  'sub-dream-2021': 'Dream engineering',

  'sub-sleepmedicine-1970': 'Sleep clinic visit',
  'sub-sleepmedicine-1999': 'CBT-I for insomnia',
  'sub-sleepmedicine-2020': 'Precision sleep medicine',

  'sub-circadian-1400': 'Living by solar rhythm',
  'sub-circadian-1918': 'Shift work',
  'sub-circadian-1984': 'Light therapy / SAD lamp',
  'sub-circadian-2012': 'Chronotype awareness',

  'sub-sleeptech-1400': 'Quality mattress',
  'sub-sleeptech-1962': 'White noise machine',
  'sub-sleeptech-2014': 'Smart mattress (Eight Sleep)',
  'sub-sleeptech-2017': 'Sleep coaching app',
  'sub-sleeptech-2022': 'Oura / WHOOP ring',

  'sub-rest-1400': 'Biphasic sleep / segmented rest',
  'sub-rest-1999': 'Intentional napping',
  'sub-rest-2016': 'Rest as resistance / Nap Ministry',
  'sub-rest-2020': 'Pandemic sleep reset',

  'sub-safety-1400': 'Combat training',
  'sub-safety-1400b': 'Martial arts',
  'sub-safety-1993': 'BJJ / MMA',
  'sub-safety-1970': "Women's self-defence",
  'sub-safety-2014': 'Somatic safety / polyvagal work',

  'sub-resilience-1400': 'Community self-defence',
  'sub-resilience-1950': 'Civil defence training',
  'sub-resilience-1993': 'Emergency response (CERT)',
  'sub-resilience-2020': 'Prepper / mutual aid',

  'sub-weapons-1791': 'Recreational shooting / firearms',

  'sub-insurance-1400': 'Mutual aid / risk pooling',
  'sub-insurance-1897': 'Modern insurance',
  'sub-insurance-2010': 'Micro-insurance / insurtech',

  'sub-surveillance-2013': 'Digital privacy awareness',
  'sub-surveillance-2018': 'Privacy tools (Signal, VPN)',
  'sub-surveillance-2020': 'Social scoring awareness',

  'sub-cyber-2003': 'Identity theft awareness',
  'sub-cyber-2010': 'Personal cybersecurity (2FA, password mgr)',

  // Shelter sub-branches
  'sub-arch-1144': 'Visiting a cathedral / sacred architecture',
  'sub-arch-1923': 'Living in modernist space',
  'sub-arch-1966': 'Brutalist / postmodern architecture',
  'sub-arch-2006': 'Biophilic design space',

  'sub-urban-1898': 'Planned community living',
  'sub-urban-1947': 'Car-centric suburbia',
  'sub-urban-1993': 'Walkable neighborhood',
  'sub-urban-2016': '15-minute city living',

  'sub-alt-1960': 'Commune / intentional community',
  'sub-alt-1972': 'Off-grid living',
  'sub-alt-2008': 'Tiny home living',
  'sub-alt-2011': 'Van life',

  'sub-indoor-2014': 'WELL-certified building',
  'sub-indoor-2015': 'Circadian lighting',

  'sub-proptech-2008': 'Airbnb hosting',
  'sub-proptech-2015': 'Co-living',
  'sub-proptech-2020': 'Decorating / designing your space',

  'sub-sacred-1400': 'Cave / natural sacred space',
  'sub-sacred-1400b': 'Temple / church visit',
  'sub-sacred-1900': 'Spa / bathhouse ritual',
  // sub-sacred-2010 removed from core (redundant with yoga/pilates/group fitness)
  'sub-sacred-2020': 'Sound room / silent disco',

  // Nourishment sub-branches
  'sub-ancestral-1400': 'Diverse whole-food eating',
  'sub-ancestral-1939': 'Traditional diet awareness',
  'sub-ancestral-2002': 'Paleo / primal eating',
  'sub-ancestral-2019': 'Carnivore / elimination diet',

  'sub-ferment-1400': 'Fermenting food (sauerkraut, kimchi)',
  'sub-ferment-2010': 'Kombucha / cultured foods',
  'sub-ferment-2015': 'Gut health focus / probiotics',

  'sub-fasting-1400': 'Natural feast-famine rhythm',
  'sub-fasting-2012': 'Intermittent fasting',
  'sub-fasting-2016': 'Fasting app / tracking windows',
  'sub-fasting-2021': 'GLP-1 medication (Ozempic)',

  'sub-industrial-1971': 'Ultra-processed food awareness',

  'sub-personal-1996': 'Eating for your body type',
  'sub-personal-2003': 'Nutrigenomic / DNA diet testing',
  'sub-personal-2020': 'Wearing a CGM (glucose monitor)',
  'sub-personal-2019': 'Microbiome testing (ZOE)',

  'sub-regen-1971': 'Farm-to-table dining',
  'sub-regen-1994': 'Cooking for others / hosting dinner',
  'sub-regen-2018': 'Eating regeneratively sourced food',

  // Status sub-branches
  'sub-fashion-1400b': 'Silk Road trade goods',
  'sub-fashion-2007': 'Slow fashion / thrifting',
  'sub-fashion-2019': 'Rental / secondhand fashion',

  'sub-beauty-1400': 'Ancient beauty practices',
  'sub-beauty-1916': 'Wearing makeup (modern cosmetics)',
  'sub-beauty-2014': 'Clean beauty (Glossier)',
  'sub-beauty-2017': 'Body positivity / inclusive beauty',

  'sub-luxury-1899': 'Luxury goods / conspicuous consumption',
  'sub-luxury-2017': 'Streetwear culture',
  'sub-luxury-2023': 'Quiet luxury / stealth wealth',

  'sub-digital-1482': 'Writing a CV / resume',
  'sub-digital-2003': 'LinkedIn',
  'sub-digital-2010b': 'Instagram identity curation',
  'sub-digital-2018b': 'TikTok identity creation',
  'sub-digital-2023': 'AI personal brand',

  'sub-counter-1960': 'Counterculture lifestyle',
  'sub-counter-1976': 'Punk / anti-fashion',
  'sub-counter-2011': 'Minimalism / decluttering',
  'sub-counter-2023': 'De-influencing',
  'sub-counter-2018': 'Visible mending / repair culture',

  'sub-craft-1400': 'Guild / apprenticeship',
  'sub-craft-1880': 'Art class / painting / pottery',
  'sub-craft-2005': 'Selling on Etsy / maker economy',
  'sub-craft-2020': 'Pandemic crafting (sourdough, knitting)',
  'sub-craft-2014': 'Portfolio / show your work',

  // Fire sub-branches
  'sub-combustion-1400': 'Campfire / fire pit gathering',
  'sub-renewable-2010': 'Community solar',
  'sub-personal-fire-1400': 'Gathering fuel / energy labor',
  'sub-personal-fire-2015': 'Rooftop solar / Powerwall',
  'sub-personal-fire-2016': 'Off-grid power system',

  'sub-light-1400': 'Firelight / candlelight ambiance',
  'sub-light-1807': 'Gas-lit evening activities',
  'sub-light-1879': 'Electric light',
  'sub-light-1990': 'LED / fluorescent lighting',
  'sub-light-2014': 'Circadian lighting',
  'sub-light-2020': 'Candle ritual / hygge',

  'sub-ritual-fire-1400': 'Campfire as social gathering',
  'sub-ritual-fire-1800': 'Hearth as home center',
  'sub-ritual-fire-1885': 'Central heating',
  'sub-ritual-fire-2000': 'Fire pit gathering',
  'sub-ritual-fire-2016': 'Hygge / candle culture',
  'sub-ritual-fire-2015b': 'Fire ceremony',

  // Story sub-branches
  'sub-oral-1400': 'Campfire storytelling',
  'sub-oral-1400b': 'Watching live theatre',
  'sub-oral-1400c': 'Attending a live performance',
  'sub-oral-1860': 'Stand-up comedy',
  'sub-oral-2006': 'TED talk (giving or watching)',
  'sub-oral-2015': 'Live music / concerts / festivals',

  'sub-written-1400': 'Reading manuscripts / sacred texts',
  'sub-written-1620': 'Reading newspapers',
  'sub-written-1719': 'Reading a novel',
  'sub-written-1999': 'Journaling / writing',
  'sub-written-2017': 'Paid newsletter (Substack)',

  'sub-audio-1938': 'Radio drama / audio fiction',
  'sub-audio-1994': 'Audiobooks',
  'sub-audio-2005': 'Listening to podcasts',
  'sub-audio-2015': 'Audio courses / guided meditations',

  'sub-video-1920': 'Hollywood cinema',
  'sub-video-1951': 'Watching serialized TV',
  'sub-video-1981': 'Music videos',
  'sub-video-2005': 'Creating / editing video',
  'sub-video-2013': 'Netflix binge-watching',
  'sub-video-2018': 'TikTok short-form video',
  'sub-video-2024': 'AI video creation',

  'sub-immersive-2011': 'Immersive theatre (Sleep No More)',
  'sub-immersive-2015': 'Experience design event',
  'sub-immersive-2016': 'VR storytelling',
  'sub-immersive-2018': 'Interactive fiction (Bandersnatch)',
  'sub-immersive-2023': 'AI interactive narrative',

  'sub-creator-1965': 'Fan fiction',
  'sub-creator-2007': 'YouTube Partner / monetized creator',
  'sub-creator-2013': 'Patreon supporter / creator',
  'sub-creator-2022': 'Solo media company',
  'sub-creator-2024': 'Experience creator economy',

  // Play sub-branches
  'sub-board-1400': 'Go / Mancala / ancient strategy',
  'sub-board-1995': 'Board games / Games night',
  'sub-board-2008': 'Cooperative board games (Pandemic)',
  'sub-board-2012': 'Kickstarter board games',
  'sub-board-2016': 'Board game cafe',

  'sub-sport-1400': 'Ancient athletics / competition',
  'sub-sport-1871': 'Playing team sport',
  'sub-sport-1936': 'Watching live sport',
  'sub-sport-1972': "Women's sport",
  'sub-sport-1995': 'Extreme sport (skateboarding, BMX)',
  'sub-sport-2020': 'Boutique competition (Hyrox)',

  'sub-digital-game-1977': 'Home console gaming',
  'sub-digital-game-1993': 'Online multiplayer gaming',
  'sub-digital-game-2005': 'Indie games',
  'sub-digital-game-2016': 'Battle royale (Fortnite)',
  'sub-digital-game-2016b': 'VR gaming',
  'sub-digital-game-2020': 'Cloud gaming',

  'sub-chance-1400': 'Dice / knucklebones',
  'sub-chance-1539': 'Lottery',
  'sub-chance-1790': 'Horse racing / betting',
  'sub-chance-2003': 'Poker',
  'sub-chance-2018': 'Sports betting apps',

  'sub-toy-1400': 'Dolls / figurines',
  'sub-toy-1932': 'LEGO / construction toys',
  'sub-toy-1964': 'Action figures',
  'sub-toy-1993': 'Trading card games (MTG, Pokemon)',
  'sub-toy-2017': 'Fidget / sensory toys',

  'sub-free-1400': 'Free play / unstructured play',
  'sub-free-1943': 'Adventure playground',
  'sub-free-2011': 'Free play advocacy / awareness',
  'sub-free-2017': 'Nature play / forest school',
}

// ── Duplicate nodes (same experience, different branches) ──
// When one is rated, auto-light the other. Key = node ID, value = linked node ID.
export const EXPERIENCE_DUPLICATES = {
  'sub-strength-2000': 'sub-ordeal-2000',    // CrossFit
  'sub-ordeal-2000': 'sub-strength-2000',
  'property-2008': 'sub-proptech-2008',       // Airbnb
  'sub-proptech-2008': 'property-2008',
  'sub-communal-2015': 'sub-proptech-2015',   // Co-living
  'sub-proptech-2015': 'sub-communal-2015',
  'sub-temperature-0300': 'sub-sacred-1900',  // Spa/Bathhouse
  'sub-sacred-1900': 'sub-temperature-0300',
  'sub-dance-2005': 'sub-sacred-2020',        // Silent Disco
  'sub-sacred-2020': 'sub-dance-2005',
  'sub-temperature-2011': 'sub-somatic-2012', // Wim Hof
  'sub-somatic-2012': 'sub-temperature-2011',
  'sub-communal-1965': 'sub-alt-1960',        // Commune
  'sub-alt-1960': 'sub-communal-1965',
}

// ── Core nodes: one representative per sub-branch (~58 total) ──
// The most recognizable, "have you done this?" experience from each branch.
// Used for onboarding and the default dome view. Must pass the test:
// "Would a 25-year-old instantly know what this is and have an opinion on it?"
const CORE_NODE_IDS = new Set([
  // Movement (15)
  'car-1886',                // Driving / road trips
  'car-1952',                // International travel / backpacking
  'sub-endurance-1962',      // Jogging / running
  'sub-strength-2000',       // CrossFit / functional fitness
  'sub-strength-2010',       // Hiking / nature walk
  'sub-flexibility-1893',    // Yoga
  'sub-flexibility-1920',    // Pilates / group fitness
  'sub-temperature-2018',    // Cold plunge / ice bath
  // sub-temperature-2019 moved to Healing (passive recovery, not movement)
  'sub-outdoor-1907',        // Camping / scouting
  'sub-dance-1975',          // Ecstatic dance
  'sub-safety-1400b',        // Martial arts
  'sub-safety-1993',         // BJJ / MMA
  'exp-surfing',             // Surfing
  'exp-climbing',            // Rock climbing / bouldering
  'exp-swimming',            // Swimming / ocean
  'exp-club-dancing',        // Going out dancing / clubbing

  // Nourishment (5)
  'sub-regen-1971',          // Farm-to-table dining
  'sub-regen-1994',          // Cooking for others / hosting dinner
  'exp-gardening',           // Gardening / growing food
  'exp-farmers-market',      // Visiting a farmers market
  'exp-new-cuisine',         // Trying a cuisine you've never had

  // Style (3) — how you present yourself to the world
  'exp-choosing-style',      // Choosing your style
  'exp-tattoo',              // Tattoo / body art / piercings
  'sub-fashion-2007',        // Slow fashion / thrifting

  // Tools (1) — extending capability
  'exp-coding',              // Coding / building software

  // Bonds (8) — Living abroad moved to Shelter, Unique stays dropped
  'intimacy-2012',           // Going on a date
  'sub-ordeal-2015',         // Retreat
  'sub-digital-2015',        // Being part of an online community
  'sub-coaching-1937',       // Mastermind group
  'exp-volunteering',        // Volunteering / giving back
  'exp-pets',                // Pet ownership / caring for animals
  'exp-drinks-friends',      // Drinks with friends / hanging out
  'exp-vulnerable-convo',    // Vulnerable conversation / clearing the air

  // Shelter (5) — how you shape your environment
  'sub-alt-2011',            // Van life
  'sub-proptech-2020',       // Decorating / designing your space
  'sub-communal-2017',       // Living abroad
  'exp-making',              // Making something with your hands (woodwork, DIY, renovating)
  'exp-hosting-home',        // Hosting people in your home

  // Story (15) — creative expression, narrative, performance.
  'media-1826',              // Photography / videography
  'media-1954',              // Playing a musical instrument
  'media-2018',              // Short-form video (TikTok)
  'sub-oral-1860',           // Stand-up comedy
  'sub-oral-2015',           // Live music / concerts / festivals
  'sub-written-1719',        // Reading a novel
  'sub-written-1999',        // Journaling / writing
  'sub-audio-2005',          // Listening to podcasts
  'sub-video-2005',          // Creating YouTube videos
  'sub-craft-1880',          // Art class / painting / pottery
  'exp-public-speaking',     // Public speaking / presenting
  'exp-selling',             // Selling / pitching
  'exp-coaching',            // Coaching / mentoring someone
  'exp-cinema',              // Going to the cinema / watching a great film
  'exp-research',            // Researching / going down rabbit holes

  // Play (7)
  'play-1972',               // Playing video games
  'sub-board-1995',          // Eurogames (Catan)
  'sub-sport-1871',          // Playing team sport
  'sub-sport-1936',          // Watching live sport
  'sub-chance-2003',         // Poker
  'sub-toy-1932',            // LEGO / construction toys
  'exp-thrill',              // Adrenaline / thrill ride (skydiving, bungee, roller coaster)

  // Fire (3)
  'sub-combustion-1400',     // Campfire / fire pit gathering
  'sub-light-2020',          // Candle ritual / hygge
  'sub-ritual-fire-2015b',   // Fire ceremony / cacao circle

  // Healing (6)
  'sub-traditional-2023',    // Cacao ceremony
  'sub-psychedelic-2016',    // Psilocybin therapy
  'sub-somatic-1400',        // Pranayama / breathwork
  'sub-mindbody-1979',       // Mindfulness meditation
  'sub-mental-1964',         // Therapy / counselling
  'sub-energy-2015',         // Sound bath
  'sub-temperature-2019',    // Sauna / deliberate heat
  'exp-spiritual',           // Spiritual practice / prayer / connection to something larger

  // Sleep (4) — added passive nature
  'sub-dream-1975',          // Lucid dreaming
  'sub-rest-1999',           // Intentional napping
  'sub-states-1954',         // Float tank / sensory deprivation
  'exp-nature-stillness',    // Being in nature without an activity (sunset, river, stargazing)
])

// ── Virtual experience nodes (human experiences not in the innovation tree) ──
// These are genuine experiences that don't map to an innovation node.
// They have exp-* IDs and need branch assignment for the dome layout.
export const VIRTUAL_EXPERIENCE_NODES = [
  { id: 'exp-surfing', label: 'Surfing', branch: 'move-outdoor', primal: 'movement' },
  { id: 'exp-climbing', label: 'Rock climbing / bouldering', branch: 'move-strength', primal: 'movement' },
  { id: 'exp-gardening', label: 'Gardening / growing food', branch: 'food-regen', primal: 'nourishment' },
  { id: 'exp-volunteering', label: 'Volunteering / giving back', branch: 'bonds-communal', primal: 'bonds' },
  { id: 'exp-pets', label: 'Pet ownership / caring for animals', branch: 'bonds-communal', primal: 'bonds' },
  { id: 'exp-public-speaking', label: 'Public speaking / presenting', branch: 'story-oral', primal: 'story' },
  { id: 'exp-selling', label: 'Selling / pitching', branch: 'story-oral', primal: 'story' },
  { id: 'exp-coaching', label: 'Coaching / mentoring someone', branch: 'story-oral', primal: 'story' },
  { id: 'exp-choosing-style', label: 'Choosing your style', branch: 'status-fashion', primal: 'status' },
  { id: 'exp-tattoo', label: 'Tattoo / body art / piercings', branch: 'status-fashion', primal: 'status' },
  { id: 'exp-swimming', label: 'Swimming / ocean', branch: 'move-outdoor', primal: 'movement' },
  { id: 'exp-club-dancing', label: 'Going out dancing / clubbing', branch: 'move-dance', primal: 'movement' },
  { id: 'exp-drinks-friends', label: 'Drinks with friends / hanging out', branch: 'bonds-ritual', primal: 'bonds' },
  { id: 'exp-vulnerable-convo', label: 'Vulnerable conversation', branch: 'bonds-ritual', primal: 'bonds' },
  { id: 'exp-cinema', label: 'Going to the cinema / watching a great film', branch: 'story-video', primal: 'story' },
  { id: 'exp-research', label: 'Researching / going down rabbit holes', branch: 'story-written', primal: 'story' },
  { id: 'exp-making', label: 'Making something with your hands', branch: 'shelter-sacred', primal: 'shelter' },
  { id: 'exp-thrill', label: 'Adrenaline / thrill ride', branch: 'play-sport', primal: 'play' },
  { id: 'exp-spiritual', label: 'Spiritual practice', branch: 'med-mindbody', primal: 'healing' },
  { id: 'exp-nature-stillness', label: 'Being in nature without an activity', branch: 'sleep-rest', primal: 'sleep' },
  { id: 'exp-hosting-home', label: 'Hosting people in your home', branch: 'shelter-sacred', primal: 'shelter' },
  { id: 'exp-farmers-market', label: 'Visiting a farmers market', branch: 'food-regen', primal: 'nourishment' },
  { id: 'exp-new-cuisine', label: 'Trying a cuisine you\'ve never had', branch: 'food-regen', primal: 'nourishment' },
  { id: 'exp-coding', label: 'Coding / building software', branch: 'tech', primal: 'tools' },
]

// ── NS State colors ──
export const NS_COLORS = {
  vibe_rise: { glow: 1.0, pulse: false, color: null },   // full brightness, branch color
  fun:       { glow: 0.6, pulse: false, color: null },   // warm glow, softer
  growth_edge: { glow: 0.4, pulse: true,  color: null },  // want to try, courage challenge territory
  pressure:  { glow: 0.8, pulse: true,  color: null },   // tried it, felt stressful
  bored:     { glow: 0.0, pulse: false, color: null },   // auto-remove (treated as dark/not-for-me)
  // uninterested = hidden (same as pruned)
}

/**
 * Check if a node is experiential (should show on Experience Layer)
 */
export function isExperiential(nodeId) {
  return !PRUNED_IDS.has(nodeId) && !nodeId.startsWith('pred-')
}

/**
 * Check if a node is a core representative (shown in the default dome view)
 */
export function isCoreNode(nodeId) {
  return CORE_NODE_IDS.has(nodeId)
}

/**
 * Get the experience label for a node, falling back to its original label
 */
export function getExperienceLabel(nodeId, originalLabel) {
  return EXPERIENCE_LABELS[nodeId] || (originalLabel || '').replace(/\n/g, ' ')
}

/**
 * Generate demo NS states for the experience dome preview
 * Deterministic based on node ID hash so it's stable across renders
 */
export function generateDemoStates(nodeIds) {
  const states = {}
  const nsOptions = ['vibe_rise', 'fun', 'pressure', null, null, null] // 50% no data
  nodeIds.forEach(id => {
    // Simple deterministic hash from node ID
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
      hash |= 0
    }
    const idx = Math.abs(hash) % nsOptions.length
    states[id] = nsOptions[idx]
  })
  return states
}
