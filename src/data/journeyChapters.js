/**
 * Journey Chapters — 3-chapter system based on the 6-Stage Circle revision.
 * Source of truth for chapter names, steps, beliefs, movie refs, CTAs.
 * See: docs/superpowers/specs/2026-11-06-journey-chapter-reskin-design.md
 * See: Obsidian 8-Stage Circle - Master Spine.md (6-Stage Revision section)
 */

export const JOURNEY_CHAPTERS = [
  {
    id: 'search',
    name: 'Search',
    circleStage: 4,
    belief: "I tried everything to find what was missing. 42 courses. Nothing worked.",
    tagline: "You're figuring out who you are and what you want.",
    steps: [
      { heroStage: 2, name: 'Check in with your body', desc: 'You feel something needs to change.', refs: ['Ariel seeing the surface world for the first time.', 'Neo seeing the Matrix for the first time.'], nextAction: 'Do your first check-in', nextRoute: '/7-day-challenge' },
      { heroStage: 3, name: 'Explore what lights you up', desc: "You're looking at what lights you up.", refs: ['Peter Parker getting bitten by the spider.', 'Neo taking the red pill.'], nextAction: 'Play the Experience Game', nextRoute: '/experience-game' },
      { heroStage: 4, name: 'Discover who you are', desc: "You're learning who you really are.", refs: ['Simba running away to the jungle.', 'Miles Morales saying "I can\'t do this."'], nextAction: 'Discover your essence', nextRoute: '/essence-mirror' },
      { heroStage: 5, name: 'Choose your direction', desc: "You can see the path, but haven't stepped on it.", refs: ['Aladdin meeting the Genie.', 'Luke meeting Yoda on Dagobah.'], nextAction: 'Choose your paths', nextRoute: '/choose-quests' },
    ],
  },
  {
    id: 'challenge',
    name: 'Challenge',
    circleStage: 5,
    belief: "You don't need to find yourself. You need to express yourself.",
    tagline: "You're doing the scary things and facing what's underneath.",
    steps: [
      { heroStage: 6, name: 'Start doing scary things', desc: 'You start building what matters to you.', refs: ["Spider-Man's first swing through New York.", 'Neo dodging bullets for the first time.'], nextAction: 'Complete 5 courage challenges', nextRoute: '/7-day-challenge' },
      { heroStage: 7, name: 'Face what\'s holding you back', desc: 'The voices that held you back show up.', refs: ['Mulan training with the army.', 'Rocky running up the stairs.'], nextAction: 'Explore a protective voice', nextRoute: '/7-day-challenge' },
      { heroStage: 8, name: 'Go deep', desc: "You're working through what's underneath.", refs: ['Simba returning to the Pride Lands.', 'Luke entering the cave on Dagobah.'], nextAction: 'Complete 3 healing flows and 20 challenges', nextRoute: '/7-day-challenge' },
    ],
  },
  {
    id: 'breakthrough',
    name: 'Breakthrough',
    circleStage: 6,
    belief: "Growing up is having the freedom to express without needing anyone's permission.",
    tagline: "Something clicks. You start living from it.",
    steps: [
      { heroStage: null, name: 'Find your direction', desc: "Everything connects. You know what you're here for.", refs: ['Po discovering the Dragon Scroll is blank.', 'Remy cooking for the food critic.'], nextAction: 'Find your direction', nextRoute: '/direction', checkFn: 'directionComplete' },
      { heroStage: 9, name: 'First Reward', desc: "You're earning from what you love.", refs: ['Simba taking his place on Pride Rock.', 'Thor finally becoming worthy.'], nextAction: 'Report your first income', nextRoute: '/7-day-challenge' },
      { heroStage: 10, name: 'Building Momentum', desc: "It's working and you keep going.", refs: ['Woody choosing to leave Andy.', 'Bilbo writing his book.'], nextAction: 'Earn income 3 months in a row', nextRoute: '/7-day-challenge' },
      { heroStage: 11, name: 'Proving It\'s Real', desc: "This isn't luck. It's you.", refs: ['"I am Iron Man."', 'Simba defeating Scar.'], nextAction: 'Cover your monthly expenses', nextRoute: '/7-day-challenge' },
      { heroStage: 12, name: 'Full Circle', desc: 'Your life is yours.', refs: ['Simba standing on Pride Rock as king.', 'Frodo sailing to the Undying Lands.'], nextAction: null, nextRoute: null },
    ],
  },
]

/**
 * Get chapter + progress for a given hero stage.
 * Pre-Search users (stage 0-1) get Search chapter with 0 steps complete.
 * @param {number} heroStage - current hero stage (0-12)
 * @param {boolean} directionComplete - all 4 direction_reveals done
 * @returns {{ chapter: object, stepIndex: number, stepsComplete: number, stepsTotal: number }}
 */
export function getChapterForStage(heroStage, directionComplete = false) {
  // Walk chapters in reverse to find the highest one the user has entered
  for (let i = JOURNEY_CHAPTERS.length - 1; i >= 0; i--) {
    const chapter = JOURNEY_CHAPTERS[i]
    const firstHeroStage = chapter.steps.find(s => s.heroStage !== null)?.heroStage
    // Breakthrough entry = heroStage >= 8 (last step of Challenge)
    if (chapter.id === 'breakthrough' && heroStage >= 8) {
      const stepsComplete = getCompletedStepCount(chapter, heroStage, directionComplete)
      const currentIdx = Math.min(stepsComplete, chapter.steps.length - 1)
      return { chapter, stepIndex: currentIdx, stepsComplete, stepsTotal: chapter.steps.length }
    }
    if (firstHeroStage && heroStage >= firstHeroStage) {
      const stepsComplete = getCompletedStepCount(chapter, heroStage, directionComplete)
      const currentIdx = Math.min(stepsComplete, chapter.steps.length - 1)
      return { chapter, stepIndex: currentIdx, stepsComplete, stepsTotal: chapter.steps.length }
    }
  }
  // Pre-Search (stage 0-1): show Search with 0 complete
  const chapter = JOURNEY_CHAPTERS[0]
  return { chapter, stepIndex: 0, stepsComplete: 0, stepsTotal: chapter.steps.length }
}

function isStepComplete(step, heroStage, directionComplete) {
  if (step.checkFn === 'directionComplete') return directionComplete
  if (step.heroStage !== null) return heroStage >= step.heroStage
  return false
}

function getCompletedStepCount(chapter, heroStage, directionComplete) {
  // Each step checked independently — no sequential break.
  // A user can have income (step 2+) without completing direction cards (step 1).
  return chapter.steps.filter(step => isStepComplete(step, heroStage, directionComplete)).length
}

/**
 * Get all steps with completion/current status for rendering tick boxes.
 * Steps are checked independently — out-of-order completion is supported.
 * "Current" = first incomplete step.
 */
export function getStepsWithStatus(heroStage, directionComplete = false) {
  const { chapter } = getChapterForStage(heroStage, directionComplete)
  const withComplete = chapter.steps.map(step => ({
    ...step,
    complete: isStepComplete(step, heroStage, directionComplete),
  }))
  const firstIncompleteIdx = withComplete.findIndex(s => !s.complete)
  return withComplete.map((step, i) => ({
    ...step,
    current: i === firstIncompleteIdx,
  }))
}

/**
 * Check if a hero stage graduation crosses a chapter boundary.
 * Only 2 boundaries: Search→Challenge (5→6) and Challenge→Breakthrough (7→8 or any ≤7 → 8).
 */
export function isChapterTransition(fromStage, toStage) {
  if (fromStage <= 5 && toStage >= 6) return 'challenge'  // entered Challenge
  if (fromStage <= 7 && toStage >= 8) return 'breakthrough' // entered Breakthrough
  return null
}

/**
 * Get chapter belief quote by chapter id.
 */
export function getChapterBelief(chapterId) {
  return JOURNEY_CHAPTERS.find(c => c.id === chapterId)?.belief || ''
}
