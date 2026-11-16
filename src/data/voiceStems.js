/**
 * voiceStems.js — All 35 sentence completion stems for the Essence Journey.
 * 4 stages, with Stage 2 split into Layer 2 (7 stems) and Layer 3 (6 stems).
 */

export const STAGES = [
  {
    id: 'essence',
    label: 'Living from Essence',
    description: 'Remember who you were as a kid.',
    stems: [
      { id: 's1_1', text: 'As a kid, I felt most alive when...' },
      { id: 's1_2', text: 'The thing I could do for hours without getting bored was...' },
      { id: 's1_3', text: 'The person I most wanted to be like was...' },
      { id: 's1_4', text: 'The thing that made me different from other kids was...' },
      { id: 's1_5', text: 'When nobody was watching, I would...' },
      { id: 's1_6', text: 'The feeling I miss most from childhood is...' },
    ],
  },
  {
    id: 'suppressed',
    label: 'Essence Suppressed',
    description: 'What happened to the kid.',
    layers: [
      {
        id: 'prediction',
        label: 'Layer 2: Prediction',
        stems: [
          { id: 's2a_1', text: 'As a kid I struggled with...' },
          { id: 's2a_2', text: 'When I think about doing {selectedExpression}, the first thing I feel is...', dynamic: true },
          { id: 's2a_3', text: 'If I did that in front of people, I expect...' },
          { id: 's2a_4', text: 'The last time I almost did something like that...' },
          { id: 's2a_5', text: 'The voice in my head when I consider it says...' },
          { id: 's2a_6', text: 'The worst thing that could happen if I did it is...' },
          { id: 's2a_7', text: 'I learned that would happen when...' },
        ],
      },
      {
        id: 'source',
        label: 'Layer 3: Source',
        stems: [
          { id: 's2b_1', text: 'The first time I felt {confirmedPrediction} was...', dynamic: true },
          { id: 's2b_2', text: 'The person who was there when it happened was...' },
          { id: 's2b_3', text: 'What they said or did was...' },
          { id: 's2b_4', text: 'What I decided about myself after that was...' },
          { id: 's2b_5', text: 'To stay safe, I started...' },
          { id: 's2b_6', text: 'The rule I made for myself was...' },
        ],
      },
    ],
  },
  {
    id: 'consequences',
    label: 'Consequences',
    description: 'Look at yourself now.',
    stems: [
      { id: 's3_1', text: 'The choices I make every day feel...', dimension: 'choice' },
      { id: 's3_2', text: 'When I do the things I care about, the people around me make me feel...', dimension: 'choice' },
      { id: 's3_3', text: 'The people closest to me make me feel...', dimension: 'connection' },
      { id: 's3_4', text: 'The last time someone truly saw me was...', dimension: 'connection' },
      { id: 's3_5', text: 'The work I do most days makes me feel...', dimension: 'growth' },
      { id: 's3_6', text: 'The thing I\'m growing in right now is...', dimension: 'growth' },
      { id: 's3_7', text: 'When I describe my life to someone, I feel...', dimension: 'meaning' },
      { id: 's3_8', text: 'When I think about whether what I do matters, I feel...', dimension: 'meaning' },
      { id: 's3_9', text: 'When people see the real me, I feel...', dimension: 'safety' },
      { id: 's3_10', text: 'The parts of myself I hide are...', dimension: 'safety' },
    ],
  },
  {
    id: 'archetype',
    label: 'The Search',
    description: 'Who are you underneath all of this.',
    stems: [
      { id: 's4_1', text: "The version of me I'd be if nobody was judging is..." },
      { id: 's4_2', text: 'The energy I bring when I stop performing is...' },
      { id: 's4_3', text: "The thing people don't realise about me is..." },
      { id: 's4_4', text: "The way I act when I'm at my most free is..." },
      { id: 's4_5', text: 'The word that describes who I really am is...' },
      { id: 's4_6', text: "When I'm alone and being honest, I am..." },
    ],
  },
]

/**
 * EXPERIENCE_ACTIVITIES — full experience list for voice game (Stage 5).
 * Matches ExperienceGameFlow tap game: exp- nodes + sub- nodes + root nodes.
 * ~100 experiences across all 11 primals.
 */
export const EXPERIENCE_ACTIVITIES = [
  // ── Movement (17) ──────────────────────────────────────────────
  { id: 'exp-surfing', label: 'Surfing', branch: 'movement' },
  { id: 'exp-climbing', label: 'Rock climbing / bouldering', branch: 'movement' },
  { id: 'exp-swimming', label: 'Swimming / ocean', branch: 'movement' },
  { id: 'exp-cycling', label: 'Cycling', branch: 'movement' },
  { id: 'exp-skiing', label: 'Skiing / snowboarding', branch: 'movement' },
  { id: 'exp-fishing', label: 'Fishing', branch: 'movement' },
  { id: 'exp-horse-riding', label: 'Horse riding', branch: 'movement' },
  { id: 'exp-club-dancing', label: 'Going out dancing / clubbing', branch: 'movement' },
  { id: 'sub-endurance-1962', label: 'Running / jogging / marathons', branch: 'movement' },
  { id: 'sub-strength-2000', label: 'CrossFit / HIIT / bootcamp', branch: 'movement' },
  { id: 'sub-strength-2010', label: 'Day hikes / nature walks', branch: 'movement' },
  { id: 'sub-flexibility-1893', label: 'Yoga / stretching', branch: 'movement' },
  { id: 'sub-flexibility-1920', label: 'Pilates / barre / spin class', branch: 'movement' },
  { id: 'sub-temperature-2018', label: 'Ice baths / cold plunges', branch: 'movement' },
  { id: 'sub-outdoor-1907', label: 'Camping / hiking / bushcraft', branch: 'movement' },
  { id: 'sub-dance-1975', label: 'Free-form dancing', branch: 'movement' },
  { id: 'sub-martial-1900', label: 'Martial arts / combat sports', branch: 'movement' },
  { id: 'sub-safety-1993', label: 'BJJ / MMA / grappling', branch: 'movement' },
  { id: 'sub-safety-1400b', label: 'Karate / taekwondo / kung fu', branch: 'movement' },
  { id: 'car-1886', label: 'Road trips / scenic drives', branch: 'movement' },

  // ── Nourishment (6) ────────────────────────────────────────────
  { id: 'exp-gardening', label: 'Gardening / growing food', branch: 'nourishment' },
  { id: 'exp-farmers-market', label: 'Visiting a farmers market', branch: 'nourishment' },
  { id: 'exp-new-cuisine', label: 'Trying a cuisine you\'ve never had', branch: 'nourishment' },
  { id: 'exp-baking', label: 'Baking', branch: 'nourishment' },
  { id: 'sub-regen-1971', label: 'Farm-to-table / slow food', branch: 'nourishment' },
  { id: 'sub-regen-1994', label: 'Cooking for friends / dinner parties', branch: 'nourishment' },

  // ── Status (6) ─────────────────────────────────────────────────
  { id: 'exp-choosing-style', label: 'Dressing as the version of you that feels most alive', branch: 'status' },
  { id: 'exp-tattoo', label: 'Marking your body with something meaningful', branch: 'status' },
  { id: 'exp-fashion-design', label: 'Creating something others wear or use', branch: 'status' },
  { id: 'exp-style-turning-heads', label: 'Dressing in a way that turns heads', branch: 'status' },
  { id: 'exp-style-scary', label: 'Wearing something that scares you a little', branch: 'status' },
  { id: 'exp-style-becoming', label: 'Changing your look to match who you\'re becoming', branch: 'status' },

  // ── Bonds (8) ──────────────────────────────────────────────────
  { id: 'exp-volunteering', label: 'Volunteering / giving back', branch: 'bonds' },
  { id: 'exp-pets', label: 'Pet ownership / caring for animals', branch: 'bonds' },
  { id: 'exp-drinks-friends', label: 'Drinks with friends / hanging out', branch: 'bonds' },
  { id: 'exp-vulnerable-convo', label: 'Vulnerable conversation', branch: 'bonds' },
  { id: 'exp-caring-kids', label: 'Caring for kids', branch: 'bonds' },
  { id: 'intimacy-2012', label: 'Dating / getting to know someone', branch: 'bonds' },
  { id: 'sub-digital-2015', label: 'Online communities / group chats', branch: 'bonds' },
  { id: 'sub-coaching-1937', label: 'Peer groups / mastermind sessions', branch: 'bonds' },
  { id: 'sub-ordeal-2015', label: 'Survival experiences / outdoor challenges', branch: 'bonds' },

  // ── Shelter (6) ────────────────────────────────────────────────
  { id: 'exp-making', label: 'Making something with your hands', branch: 'shelter' },
  { id: 'exp-hosting-home', label: 'Hosting people in your home', branch: 'shelter' },
  { id: 'exp-interior-design', label: 'Interior / spatial design', branch: 'shelter' },
  { id: 'sub-alt-2011', label: 'Van life / nomad culture', branch: 'shelter' },
  { id: 'sub-proptech-2020', label: 'DIY construction / renovating', branch: 'shelter' },
  { id: 'sub-communal-2017', label: 'Expat life / living abroad', branch: 'shelter' },

  // ── Story (21) ─────────────────────────────────────────────────
  { id: 'exp-public-speaking', label: 'Public speaking / presenting', branch: 'story' },
  { id: 'exp-selling', label: 'Selling / pitching', branch: 'story' },
  { id: 'exp-coaching', label: 'Coaching / mentoring someone', branch: 'story' },
  { id: 'exp-cinema', label: 'Going to the cinema / a great film', branch: 'story' },
  { id: 'exp-research', label: 'Researching / going down rabbit holes', branch: 'story' },
  { id: 'exp-singing', label: 'Singing', branch: 'story' },
  { id: 'exp-rapping', label: 'Rapping / freestyle', branch: 'story' },
  { id: 'exp-teaching', label: 'Teaching / facilitating a workshop', branch: 'story' },
  { id: 'exp-dance-expression', label: 'Dancing (creative / performance)', branch: 'story' },
  { id: 'exp-acting', label: 'Acting / improv / theatre', branch: 'story' },
  { id: 'exp-creative-writing', label: 'Creative writing', branch: 'story' },
  { id: 'media-1826', label: 'Photography / visual storytelling', branch: 'story' },
  { id: 'media-1954', label: 'Playing an instrument / making music', branch: 'story' },
  { id: 'media-2018', label: 'Making Reels / TikToks / short videos', branch: 'story' },
  { id: 'sub-craft-1880', label: 'Painting / pottery / art workshops', branch: 'story' },
  { id: 'sub-oral-1860', label: 'Stand-up comedy / open mic', branch: 'story' },
  { id: 'sub-oral-2015', label: 'Live music / concerts / festivals', branch: 'story' },
  { id: 'sub-written-1719', label: 'Reading novels', branch: 'story' },
  { id: 'sub-written-1999', label: 'Journaling / personal writing', branch: 'story' },
  { id: 'sub-audio-2005', label: 'Podcasts / audiobooks', branch: 'story' },
  { id: 'sub-video-2005', label: 'Filming / editing / publishing videos', branch: 'story' },

  // ── Play (10) ──────────────────────────────────────────────────
  { id: 'exp-thrill', label: 'Adrenaline / thrill ride', branch: 'play' },
  { id: 'exp-djing-live', label: 'DJing / playing a set for a crowd', branch: 'play' },
  { id: 'exp-travel', label: 'Travel / exploring a new place', branch: 'play' },
  { id: 'exp-puzzles', label: 'Puzzles / escape rooms', branch: 'play' },
  { id: 'play-1972', label: 'Video games / PC gaming', branch: 'play' },
  { id: 'sub-board-1995', label: 'Board games / game nights', branch: 'play' },
  { id: 'sub-sport-1871', label: 'Team sports / pickup games', branch: 'play' },
  { id: 'sub-sport-1936', label: 'Watching live sport', branch: 'play' },
  { id: 'sub-chance-2003', label: 'Poker / card games', branch: 'play' },
  { id: 'sub-toy-1932', label: 'LEGO / model kits / building', branch: 'play' },
  { id: 'car-1952', label: 'Backpacking / gap years / exploring', branch: 'play' },

  // ── Fire (3) ───────────────────────────────────────────────────
  { id: 'sub-combustion-1400', label: 'Campfire stories', branch: 'fire' },
  { id: 'sub-combustion-2019', label: 'Fire dancing / fire spinning', branch: 'fire' },
  { id: 'sub-ritual-fire-2015b', label: 'Fire circles / fire walking', branch: 'fire' },
  { id: 'sub-light-2020', label: 'Candlelit evenings / hygge', branch: 'fire' },

  // ── Healing (12) ───────────────────────────────────────────────
  { id: 'exp-spiritual', label: 'Spiritual practice', branch: 'healing' },
  { id: 'sub-breathwork-2015', label: 'Breathwork / pranayama', branch: 'healing' },
  { id: 'sub-psychedelic-2018', label: 'Plant medicine ceremonies', branch: 'healing' },
  { id: 'sub-psychedelic-2016', label: 'Guided psychedelic experiences', branch: 'healing' },
  { id: 'sub-somatic-2010', label: 'Somatic experiencing / body-based healing', branch: 'healing' },
  { id: 'sub-meditation-1950', label: 'Meditation retreats', branch: 'healing' },
  { id: 'sub-bodywork-1960', label: 'Massage / acupuncture / bodywork', branch: 'healing' },
  { id: 'sub-mental-1964', label: 'Talk therapy / counselling', branch: 'healing' },
  { id: 'sub-traditional-2023', label: 'Cacao ceremony / ritual', branch: 'healing' },
  { id: 'sub-energy-2015', label: 'Sound healing / gong baths', branch: 'healing' },
  { id: 'sub-temperature-2019', label: 'Sauna / steam rooms / hot springs', branch: 'healing' },
  { id: 'sub-mindbody-1979', label: 'Seated meditation / mindfulness apps', branch: 'healing' },

  // ── Sleep (5) ──────────────────────────────────────────────────
  { id: 'exp-nature-stillness', label: 'Being in nature without an activity', branch: 'sleep' },
  { id: 'sub-sleep-2017', label: 'Sleep optimization', branch: 'sleep' },
  { id: 'sub-nap-2019', label: 'Power naps / rest as practice', branch: 'sleep' },
  { id: 'sub-dream-1975', label: 'Lucid dreaming / dream journaling', branch: 'sleep' },
  { id: 'sub-rest-1999', label: 'Deliberate rest / siesta culture', branch: 'sleep' },
  { id: 'sub-states-1954', label: 'Float tanks / sensory deprivation', branch: 'sleep' },

  // ── Tools (4) ──────────────────────────────────────────────────
  { id: 'exp-coding', label: 'Coding / building software', branch: 'tools' },
  { id: 'exp-graphic-design', label: 'Graphic design', branch: 'tools' },
  { id: 'exp-investing', label: 'Investing / trading', branch: 'tools' },
  { id: 'exp-spreadsheets', label: 'Spreadsheets / data', branch: 'tools' },
]

/**
 * Get stems for a stage, resolving dynamic text.
 * @param {number} stageIndex - 0, 1, 2, or 3
 * @param {number|null} layerIndex - for stage 1 (suppressed): 0 = prediction, 1 = source. null for other stages.
 * @param {object} context - { selectedExpression, confirmedPrediction }
 * @returns {Array<{ id, text, dimension? }>}
 */
export function getStemsForStage(stageIndex, layerIndex = null, context = {}) {
  const stage = STAGES[stageIndex]
  if (!stage) return []

  let stems
  if (stage.layers && layerIndex !== null) {
    stems = stage.layers[layerIndex]?.stems || []
  } else {
    stems = stage.stems || []
  }

  return stems.map(stem => ({
    ...stem,
    text: stem.dynamic
      ? stem.text
          .replace('{selectedExpression}', context.selectedExpression || '______')
          .replace('{confirmedPrediction}', context.confirmedPrediction || 'that feeling')
      : stem.text,
  }))
}
