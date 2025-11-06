/**
 * Nervous System Safety Beliefs Library
 *
 * Organized by themes for conditional selection based on:
 * - User's vision (impact/income levels)
 * - Struggle area
 * - Triage test results
 */

export const beliefLibrary = {

  // ==========================================
  // VISIBILITY & BEING SEEN
  // ==========================================
  visibility: [
    "It's safe for me to be seen in my full power.",
    "Being visible doesn't mean I'll be rejected.",
    "I can be seen and still belong.",
    "The right people will find me when I'm visible.",
    "Being visible attracts the support I need.",
    "I'm safe to shine without dimming others.",
    "Visibility is a gift I give to those who need me.",
    "I can be visible and still be authentic."
  ],

  // ==========================================
  // MONEY & ABUNDANCE
  // ==========================================
  abundance: [
    "Having money makes me more of who I am, not less.",
    "I can be wealthy and still be deeply connected.",
    "Abundance flows naturally when I'm aligned.",
    "Money amplifies my ability to create positive change.",
    "I'm safe to receive abundance for my gifts.",
    "Earning more doesn't change who I am at my core.",
    "Wealth supports my mission, not diminishes it.",
    "I can hold money and maintain my values."
  ],

  // ==========================================
  // WORTHINESS & ENOUGH-NESS
  // ==========================================
  worthiness: [
    "What I bring is already enough.",
    "I don't need to prove my worth to deserve success.",
    "My value isn't measured by my productivity.",
    "I am worthy of success simply by being me.",
    "I'm enough exactly as I am right now.",
    "My worth isn't conditional on achievement.",
    "I deserve to receive for who I am, not just what I do.",
    "Being myself is my greatest contribution."
  ],

  // ==========================================
  // PRESSURE & PERFORMANCE
  // ==========================================
  pressure: [
    "Pressure doesn't define my worth.",
    "I can succeed without constant pressure.",
    "Rest supports my ambition.",
    "Ease and success can coexist.",
    "I'm safe to move at my own pace.",
    "Success doesn't require suffering.",
    "I can achieve without burning out.",
    "My best work comes from flow, not force."
  ],

  // ==========================================
  // SAFETY IN SUCCESS
  // ==========================================
  safetyInSuccess: [
    "It's safe to move forward without resistance.",
    "I trust myself to handle success.",
    "Expansion doesn't require sacrifice.",
    "Success doesn't mean losing what matters.",
    "I can grow and still stay grounded.",
    "It's safe to have what I want.",
    "I can succeed and maintain my relationships.",
    "Success enhances my life, not complicates it."
  ],

  // ==========================================
  // BELONGING & CONNECTION
  // ==========================================
  belonging: [
    "I can succeed and still belong.",
    "My success doesn't threaten my relationships.",
    "I'm safe to outgrow old versions of myself.",
    "The people who matter will celebrate my growth.",
    "I can change and still be loved.",
    "My evolution doesn't mean abandoning others.",
    "I belong even as I grow beyond old limits.",
    "True connection deepens as I expand."
  ],

  // ==========================================
  // IMPACT & SCALE
  // ==========================================
  impact: [
    "I'm safe to impact many people.",
    "My influence creates positive ripples.",
    "I can lead without losing myself.",
    "Scaling my impact feels natural and safe.",
    "I'm capable of holding the visibility my mission requires.",
    "More people seeing my work is a gift, not a burden.",
    "My impact grows as I stay aligned.",
    "I trust myself to serve at scale."
  ],

  // ==========================================
  // TRUST & SELF-BELIEF
  // ==========================================
  trust: [
    "I trust my body's wisdom.",
    "I trust myself to make aligned decisions.",
    "My intuition guides me toward what's right.",
    "I'm safe to trust my inner knowing.",
    "I believe in my ability to navigate uncertainty.",
    "I trust that I'm on the right path.",
    "My system knows what it needs.",
    "I trust the timing of my expansion."
  ],

  // ==========================================
  // SAFETY IN ACTION
  // ==========================================
  action: [
    "It's safe to take action toward my vision.",
    "I can move forward even when I feel uncertain.",
    "Action creates clarity and safety.",
    "Each step I take builds my confidence.",
    "I'm safe to try and learn as I go.",
    "Imperfect action is better than perfect planning.",
    "I trust myself to course-correct as needed.",
    "Taking action feels good in my body."
  ],

  // ==========================================
  // LEADERSHIP & AUTHORITY
  // ==========================================
  leadership: [
    "I can lead in a way that feels good.",
    "It's okay to lead differently than I was taught.",
    "My leadership style is valid and valuable.",
    "I don't need to be like other leaders to be effective.",
    "I can be powerful and still be kind.",
    "Leadership doesn't require me to be someone I'm not.",
    "I'm safe to lead from my authentic essence.",
    "My unique approach to leadership is needed."
  ]
};

/**
 * Belief Selection Logic
 * Returns 5-7 most relevant beliefs based on user context
 */
export function selectBeliefs(userContext) {
  const selectedBeliefs = [];

  const {
    impactGoal,           // "100000+", "10000+", "1000+"
    incomeGoal,           // "1000000+", "500000+", "100000+"
    struggleArea,         // free text from Stage 3 Q4
    noToSafeBeingSeen,    // boolean from triage
    noToSafeEarning,      // boolean from triage
    noToSafePursuing,     // boolean from triage
    yesToSelfSabotage,    // boolean from triage
    yesToFeelsUnsafe      // boolean from triage
  } = userContext;

  // ==========================================
  // RULE 1: Visibility struggles
  // ==========================================
  if (noToSafeBeingSeen) {
    selectedBeliefs.push(...beliefLibrary.visibility.slice(0, 2));
    selectedBeliefs.push(beliefLibrary.impact[0]); // "I'm safe to impact many people"
  }

  // ==========================================
  // RULE 2: Money blocks
  // ==========================================
  if (noToSafeEarning) {
    selectedBeliefs.push(...beliefLibrary.abundance.slice(0, 2));

    // Add worthiness if high income goal
    if (incomeGoal === "1000000+" || incomeGoal === "500000+") {
      selectedBeliefs.push(beliefLibrary.worthiness[0]); // "What I bring is already enough"
    }
  }

  // ==========================================
  // RULE 3: Self-sabotage pattern
  // ==========================================
  if (yesToSelfSabotage) {
    selectedBeliefs.push(beliefLibrary.action[0]); // "It's safe to take action toward my vision"
    selectedBeliefs.push(beliefLibrary.trust[1]); // "I trust myself to make aligned decisions"
  }

  // ==========================================
  // RULE 4: General safety around ambition
  // ==========================================
  if (noToSafePursuing || yesToFeelsUnsafe) {
    selectedBeliefs.push(beliefLibrary.safetyInSuccess[0]); // "It's safe to move forward without resistance"
    selectedBeliefs.push(beliefLibrary.safetyInSuccess[2]); // "Expansion doesn't require sacrifice"
  }

  // ==========================================
  // RULE 5: Struggle area keywords (NLP)
  // ==========================================
  const struggleLower = (struggleArea || "").toLowerCase();

  if (struggleLower.includes("visible") || struggleLower.includes("seen") ||
      struggleLower.includes("show up") || struggleLower.includes("market")) {
    selectedBeliefs.push(beliefLibrary.visibility[2]); // "I can be seen and still belong"
  }

  if (struggleLower.includes("money") || struggleLower.includes("pricing") ||
      struggleLower.includes("charge") || struggleLower.includes("income")) {
    selectedBeliefs.push(beliefLibrary.abundance[3]); // "Money amplifies my ability to create positive change"
  }

  if (struggleLower.includes("pressure") || struggleLower.includes("burnout") ||
      struggleLower.includes("exhaust") || struggleLower.includes("overwhelm")) {
    selectedBeliefs.push(beliefLibrary.pressure[2]); // "Rest supports my ambition"
    selectedBeliefs.push(beliefLibrary.pressure[3]); // "Ease and success can coexist"
  }

  if (struggleLower.includes("belong") || struggleLower.includes("relation") ||
      struggleLower.includes("connection") || struggleLower.includes("isolat")) {
    selectedBeliefs.push(beliefLibrary.belonging[0]); // "I can succeed and still belong"
  }

  if (struggleLower.includes("lead") || struggleLower.includes("authority") ||
      struggleLower.includes("power") || struggleLower.includes("voice")) {
    selectedBeliefs.push(beliefLibrary.leadership[0]); // "I can lead in a way that feels good"
  }

  if (struggleLower.includes("trust") || struggleLower.includes("decision") ||
      struggleLower.includes("doubt") || struggleLower.includes("uncertain")) {
    selectedBeliefs.push(beliefLibrary.trust[0]); // "I trust my body's wisdom"
  }

  // ==========================================
  // RULE 6: Fill to minimum 5 beliefs
  // ==========================================
  // Add universal beliefs if we don't have enough yet
  const universalBeliefs = [
    beliefLibrary.worthiness[1], // "I don't need to prove my worth to deserve success"
    beliefLibrary.trust[2],      // "My intuition guides me toward what's right"
    beliefLibrary.action[1],     // "I can move forward even when I feel uncertain"
    beliefLibrary.safetyInSuccess[1], // "I trust myself to handle success"
    beliefLibrary.pressure[0]    // "Pressure doesn't define my worth"
  ];

  for (const belief of universalBeliefs) {
    if (selectedBeliefs.length >= 7) break;
    if (!selectedBeliefs.includes(belief)) {
      selectedBeliefs.push(belief);
    }
  }

  // ==========================================
  // RULE 7: Cap at 7 beliefs max
  // ==========================================
  return [...new Set(selectedBeliefs)].slice(0, 7);
}

/**
 * Get beliefs organized by category for testing/reference
 */
export function getAllBeliefsByCategory() {
  return beliefLibrary;
}

/**
 * Get total count of beliefs
 */
export function getTotalBeliefCount() {
  return Object.values(beliefLibrary).reduce((sum, arr) => sum + arr.length, 0);
}
