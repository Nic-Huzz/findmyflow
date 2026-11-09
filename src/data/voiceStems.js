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
          { id: 's2b_1', text: 'The first time I felt that feeling was...' },
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
      ? stem.text.replace('{selectedExpression}', context.selectedExpression || '______')
      : stem.text,
  }))
}
