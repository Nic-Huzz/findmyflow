/**
 * Event Radar — 6 dimensions for before/after event measurement.
 * Different from the Vibe Rise Life Path Radar — shares 4 dimensions
 * but swaps Freedom/Joy for Intensity/Rarity.
 * Used with GenericRadar component (scores = after, scores2 = before).
 */

export const EVENT_DIMENSIONS = [
  {
    id: 'permission',
    name: 'Permission',
    emoji: '\u{1F6AA}',
    beforeQuestion: 'Before the event, how free did you feel to express yourself?',
    afterQuestion: 'After the event, how free do you feel to express yourself?',
    maxLevel: 5,
    anchors: ['Completely held back', 'Mostly constrained', 'Neutral', 'Mostly free', 'Fully free to express'],
  },
  {
    id: 'safety',
    name: 'Safety',
    emoji: '\u{1F6E1}\uFE0F',
    beforeQuestion: 'Before the event, how safe did you feel to let go?',
    afterQuestion: 'After the event, how safe do you feel to let go?',
    maxLevel: 5,
    anchors: ['Completely guarded', 'On edge', 'Neutral', 'Mostly safe', 'Fully safe'],
  },
  {
    id: 'intensity',
    name: 'Intensity',
    emoji: '\u{1F525}',
    beforeQuestion: 'Before the event, how fully were you expressing yourself?',
    afterQuestion: 'After the event, how fully are you expressing yourself?',
    maxLevel: 5,
    anchors: ['Not at all', 'Holding back', 'Starting to let go', 'Fully expressing', 'Peak aliveness. Nothing held back.'],
  },
  {
    id: 'rarity',
    name: 'Rarity',
    emoji: '\u2726',
    beforeQuestion: 'Before the event, how novel or unique did this feel?',
    afterQuestion: 'After the event, how novel or unique did this feel?',
    maxLevel: 5,
    anchors: ['Completely familiar', 'Slightly new', 'Noticeably different', 'Very rare', 'Nothing like this before'],
  },
  {
    id: 'connection',
    name: 'Connection',
    emoji: '\u{1F91D}',
    beforeQuestion: 'Before the event, how connected did you feel to the people around you?',
    afterQuestion: 'After the event, how connected do you feel to the people around you?',
    maxLevel: 5,
    anchors: ['Completely alone', 'Mostly alone', 'Some connection', 'Mostly connected', 'Deeply connected'],
  },
  {
    id: 'presence',
    name: 'Presence',
    emoji: '\u{1F441}\uFE0F',
    beforeQuestion: 'Before the event, how fully present were you?',
    afterQuestion: 'After the event, how fully present are you?',
    maxLevel: 5,
    anchors: ['Completely in my head', 'Mostly distracted', 'Half here', 'Mostly present', 'Fully here'],
  },
]
