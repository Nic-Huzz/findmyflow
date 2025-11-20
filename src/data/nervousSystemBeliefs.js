/**
 * Nervous System Safety Contracts Library
 *
 * 8 Wound Types with 10 Safety Contracts Each (80 Total)
 *
 * These are FEAR TESTS - not empowering beliefs
 * Format: "If [trigger], [feared consequence]"
 *
 * Why this works:
 * - Tests the actual fear directly
 * - Produces accurate sway test results
 * - Subconscious responds honestly to fear statements
 * - NLP-aligned (no negatives like "don't", "doesn't")
 */

export const safetyContracts = {

  // ==========================================
  // 1. VISIBILITY WOUND
  // Core fear: Being seen = danger
  // ==========================================
  visibility: [
    "If I'm fully visible, I'll be judged.",
    "If I show up authentically, I'll be pushed away.",
    "If I share my truth, I'll be criticized.",
    "If people really see me, they'll question my abilities.",
    "If I'm visible at scale, I'll be attacked.",
    "If I put myself out there, I'll be embarrassed.",
    "If I show up consistently, people will see my flaws.",
    "If I'm seen in my full power, I'll be too much.",
    "If I become known, I'll lose my privacy and peace.",
    "If I'm publicly visible, I'll attract criticism."
  ],

  // ==========================================
  // 2. BELONGING WOUND
  // Core fear: Success = losing connection
  // ==========================================
  belonging: [
    "If I succeed, I'll lose connection with people I love.",
    "If I outgrow my current life, I'll be alone.",
    "If I evolve, I'll abandon the people who need me.",
    "If I become successful, my relationships will suffer.",
    "If I change, the people I love will distance themselves.",
    "If I rise above my current circumstances, I'll lose my community.",
    "If I pursue my ambitions, I'll become isolated.",
    "If I grow beyond where I am, I'll leave people behind.",
    "If I'm different from my family, I'll be cast out.",
    "If I succeed where others struggled, I'll be resented."
  ],

  // ==========================================
  // 3. STABILITY/CONTROL WOUND
  // Core fear: Expansion = chaos/loss of control
  // ==========================================
  stability: [
    "If I expand, I'll lose control.",
    "If I scale, things will fall apart.",
    "If I grow too fast, I'll lose myself.",
    "If I succeed at this level, I'll be overwhelmed.",
    "If I take this leap, everything will become chaotic.",
    "If I let go of control, everything will collapse.",
    "If I delegate, things will be done wrong.",
    "If I grow beyond what I can manage, I'll fail spectacularly.",
    "If I expand my capacity, I'll lose quality.",
    "If I move forward, I'll make a mistake I can't recover from."
  ],

  // ==========================================
  // 4. WORTHINESS WOUND
  // Core fear: Receiving = owing/being exposed as undeserving
  // ==========================================
  worthiness: [
    "If I receive abundance, I'll owe something I can't repay.",
    "If I charge what I'm worth, people will turn away.",
    "If I succeed, I'll be exposed as a fraud.",
    "If I receive recognition, people will question if I earned it.",
    "If I'm paid well, I'll prove I'm greedy.",
    "If I accept praise, I'll be revealed as undeserving.",
    "If I receive easily, people will think I'm lucky, not skilled.",
    "If I'm compensated abundantly, I'll feel guilty.",
    "If I allow myself to have what I want, I'll be taking from others.",
    "If I claim my value, I'll be seen as arrogant."
  ],

  // ==========================================
  // 5. SAFETY WOUND
  // Core fear: Power/success = vulnerability/danger
  // ==========================================
  safety: [
    "If I pursue this ambition, I'll sacrifice my peace.",
    "If I'm successful, I'll become a target.",
    "If I step into my power, I'll be unsafe.",
    "If I have abundance, I'll attract danger.",
    "If I'm visible and successful, bad things will happen.",
    "If I pursue this path, I'll put my family at risk.",
    "If I stand out, I'll be attacked.",
    "If I become powerful, I'll be vulnerable.",
    "If I achieve my goals, something bad will happen to balance it out.",
    "If I have what I want, it will be taken away."
  ],

  // ==========================================
  // 6. IMPACT/RESPONSIBILITY WOUND
  // Core fear: Scale = burden I can't carry
  // ==========================================
  impact: [
    "If I impact many people, I'll be responsible for their outcomes.",
    "If I lead at scale, I'll let people down.",
    "If my work reaches more people, I'll cause harm.",
    "If I grow my influence, the pressure will crush me.",
    "If I serve at this level, I'll burn out.",
    "If I'm responsible for others' transformation, I'll carry their pain.",
    "If I lead publicly, I'll be blamed when things go wrong.",
    "If I scale my impact, I'll lose the personal touch that makes it work.",
    "If I influence many people, I'll misguide them.",
    "If I take on this level of responsibility, I'll be trapped."
  ],

  // ==========================================
  // 7. ABUNDANCE/MONEY WOUND
  // Core fear: Money = corruption/loss of self
  // ==========================================
  abundance: [
    "If I have money, I'll lose who I am.",
    "If I'm wealthy, I'll become disconnected from what matters.",
    "If I earn at this level, I'll be corrupted by money.",
    "If I prioritize income, I'll compromise my values.",
    "If I receive financial abundance, I'll change for the worse.",
    "If I focus on money, I'll lose my purpose.",
    "If I'm financially successful, I'll become materialistic.",
    "If I have wealth, I'll forget where I came from.",
    "If I earn significantly, I'll become someone I don't recognize.",
    "If I accept financial abundance, I'll be controlled by it."
  ],

  // ==========================================
  // 8. PERFECTION/FAILURE WOUND
  // Core fear: Being less than perfect = being nothing
  // ==========================================
  perfection: [
    "If I'm less than perfect, I'll be exposed as a fraud.",
    "If I make a mistake, I'll lose everything.",
    "If I fail, I'll prove I was never capable.",
    "If I try and fail, I'll never recover.",
    "If people see my flaws, they'll walk away completely.",
    "If I'm less than perfect, I'm unworthy.",
    "If I launch before it's perfect, I'll be embarrassed.",
    "If I show my imperfect work, people will see I'm a fraud.",
    "If I fail publicly, I'll never be taken seriously again.",
    "If I make the wrong choice, I'll ruin everything."
  ]
};

/**
 * Safety Contract Selection Logic
 * Returns 5-7 most relevant contracts based on user context
 *
 * Conditional logic based on:
 * - Triage test results
 * - Impact/income goals
 * - Struggle area keywords
 */
export function selectSafetyContracts(userContext) {
  const selectedContracts = [];

  const {
    impactGoal,           // "100000+", "10000+", "1000+", "100+"
    incomeGoal,           // "1000000+", "500000+", "100000+"
    struggleArea,         // free text from Stage 3 Q4
    noToSafeBeingSeen,    // boolean from triage
    noToSafeEarning,      // boolean from triage
    noToSafePursuing,     // boolean from triage
    yesToSelfSabotage,    // boolean from triage
    yesToFeelsUnsafe      // boolean from triage
  } = userContext;

  // ==========================================
  // RULE 1: Triage-Based Selection
  // ==========================================

  // Visibility struggles
  if (noToSafeBeingSeen) {
    selectedContracts.push(safetyContracts.visibility[0]); // "If I'm fully visible, I'll be judged."
    selectedContracts.push(safetyContracts.visibility[1]); // "If I show up authentically, I'll be rejected."
    selectedContracts.push(safetyContracts.visibility[3]); // "If people really see me, they'll find me inadequate."
  }

  // Money blocks
  if (noToSafeEarning) {
    selectedContracts.push(safetyContracts.abundance[0]); // "If I have money, I'll lose who I am."
    selectedContracts.push(safetyContracts.abundance[3]); // "If I prioritize income, I'll compromise my values."

    // High income goals = worthiness wound
    if (incomeGoal === "1000000+" || incomeGoal === "500000+") {
      selectedContracts.push(safetyContracts.worthiness[0]); // "If I receive abundance, I'll owe something I can't repay."
    }
  }

  // Self-sabotage pattern
  if (yesToSelfSabotage) {
    selectedContracts.push(safetyContracts.stability[0]); // "If I expand, I'll lose control."
    selectedContracts.push(safetyContracts.stability[2]); // "If I grow too fast, I'll lose myself."
  }

  // General safety around ambition
  if (noToSafePursuing || yesToFeelsUnsafe) {
    selectedContracts.push(safetyContracts.safety[0]); // "If I pursue this ambition, I'll sacrifice my peace."
    selectedContracts.push(safetyContracts.safety[2]); // "If I step into my power, I'll be unsafe."
  }

  // High impact = responsibility wound
  if (impactGoal === "100000+") {
    selectedContracts.push(safetyContracts.impact[0]); // "If I impact many people, I'll be responsible for their outcomes."
  }

  // ==========================================
  // RULE 2: Keyword Matching in Struggle Area
  // ==========================================
  const struggleLower = (struggleArea || "").toLowerCase();

  // Visibility keywords
  if (struggleLower.includes("visible") || struggleLower.includes("seen") ||
      struggleLower.includes("show up") || struggleLower.includes("social media") ||
      struggleLower.includes("market") || struggleLower.includes("content")) {
    selectedContracts.push(safetyContracts.visibility[4]); // "If I'm visible at scale, I'll be attacked."
  }

  // Money keywords
  if (struggleLower.includes("money") || struggleLower.includes("pricing") ||
      struggleLower.includes("charge") || struggleLower.includes("income") ||
      struggleLower.includes("financial")) {
    selectedContracts.push(safetyContracts.abundance[1]); // "If I'm wealthy, I'll become disconnected from what matters."
  }

  // Pressure/burnout keywords
  if (struggleLower.includes("pressure") || struggleLower.includes("burnout") ||
      struggleLower.includes("exhaust") || struggleLower.includes("overwhelm") ||
      struggleLower.includes("stress")) {
    selectedContracts.push(safetyContracts.stability[3]); // "If I succeed at this level, I'll be overwhelmed."
    selectedContracts.push(safetyContracts.impact[4]); // "If I serve at this level, I'll burn out."
  }

  // Belonging/connection keywords
  if (struggleLower.includes("belong") || struggleLower.includes("relation") ||
      struggleLower.includes("connection") || struggleLower.includes("isolat") ||
      struggleLower.includes("alone") || struggleLower.includes("family")) {
    selectedContracts.push(safetyContracts.belonging[0]); // "If I succeed, I'll lose connection with people I love."
    selectedContracts.push(safetyContracts.belonging[1]); // "If I outgrow my current life, I'll be alone."
  }

  // Leadership/authority keywords
  if (struggleLower.includes("lead") || struggleLower.includes("authority") ||
      struggleLower.includes("power") || struggleLower.includes("voice") ||
      struggleLower.includes("influence")) {
    selectedContracts.push(safetyContracts.impact[1]); // "If I lead at scale, I'll let people down."
  }

  // Trust/decision keywords
  if (struggleLower.includes("trust") || struggleLower.includes("decision") ||
      struggleLower.includes("doubt") || struggleLower.includes("uncertain") ||
      struggleLower.includes("confidence")) {
    selectedContracts.push(safetyContracts.worthiness[2]); // "If I succeed, I'll be exposed as a fraud."
  }

  // Perfection keywords
  if (struggleLower.includes("perfect") || struggleLower.includes("mistake") ||
      struggleLower.includes("fail") || struggleLower.includes("wrong")) {
    selectedContracts.push(safetyContracts.perfection[0]); // "If I'm not perfect, I'll be exposed as inadequate."
    selectedContracts.push(safetyContracts.perfection[2]); // "If I fail, I'll prove I was never good enough."
  }

  // ==========================================
  // RULE 3: Fill to Minimum 5, Cap at 7 Maximum
  // ==========================================

  // Universal contracts if not enough selected
  const universalContracts = [
    safetyContracts.worthiness[2],  // "If I succeed, I'll be exposed as a fraud."
    safetyContracts.belonging[1],   // "If I outgrow my current life, I'll be alone."
    safetyContracts.safety[2],      // "If I step into my power, I'll be unsafe."
    safetyContracts.stability[2],   // "If I grow too fast, I'll lose myself."
    safetyContracts.perfection[2]   // "If I fail, I'll prove I was never good enough."
  ];

  for (const contract of universalContracts) {
    if (selectedContracts.length >= 7) break;
    if (!selectedContracts.includes(contract)) {
      selectedContracts.push(contract);
    }
  }

  // Remove duplicates and cap at 7
  return [...new Set(selectedContracts)].slice(0, 7);
}

/**
 * Get all contracts organized by wound type for reference
 */
export function getAllContractsByWoundType() {
  return safetyContracts;
}

/**
 * Get total count of safety contracts
 */
export function getTotalContractCount() {
  return Object.values(safetyContracts).reduce((sum, arr) => sum + arr.length, 0);
}

/**
 * Get contracts for a specific wound type
 */
export function getContractsByWound(woundType) {
  return safetyContracts[woundType] || [];
}
