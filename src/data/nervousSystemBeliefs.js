/**
 * Safety Contract Library - Nervous System Fear Tests
 *
 * These are "safety contracts" - subconscious beliefs the nervous system
 * is holding to keep you safe. Testing these directly reveals the actual
 * protective mechanism more accurately than testing empowering beliefs.
 *
 * Organized by wound types for conditional selection based on:
 * - User's vision (impact/income levels)
 * - Struggle area
 * - Triage test results
 *
 * All statements are NLP-aligned (positive framing that subconscious can process)
 */

export const safetyContracts = {

  // ==========================================
  // VISIBILITY WOUND
  // Core fear: Being seen = danger
  // ==========================================
  visibility: [
    "If I'm fully visible, I'll be judged.",
    "If I show up authentically, I'll be rejected.",
    "If I share my truth, I'll be criticized.",
    "If people really see me, they'll find me inadequate.",
    "If I'm visible at scale, I'll be attacked.",
    "If I put myself out there, I'll be humiliated.",
    "If I shine brightly, others will resent me.",
    "If I'm seen in my power, I'll be misunderstood.",
    "If I become visible, I'll lose my privacy forever.",
    "If I show my real self, people will leave."
  ],

  // ==========================================
  // BELONGING WOUND
  // Core fear: Success = losing connection
  // ==========================================
  belonging: [
    "If I succeed, I'll lose connection with people I love.",
    "If I outgrow my current life, I'll be alone.",
    "If I evolve, I'll abandon the people who need me.",
    "If I become successful, my relationships will suffer.",
    "If I change, the people I love will reject me.",
    "If I rise, I'll leave important people behind.",
    "If I prioritize my ambition, I'll damage my relationships.",
    "If I'm different, I'll stop belonging.",
    "If I grow beyond my community, I'll be isolated.",
    "If I follow my path, I'll hurt the people I care about."
  ],

  // ==========================================
  // STABILITY/CONTROL WOUND
  // Core fear: Expansion = chaos/loss of control
  // ==========================================
  stability: [
    "If I expand, I'll lose control.",
    "If I scale, things will fall apart.",
    "If I grow too fast, I'll lose myself.",
    "If I succeed at this level, I'll be overwhelmed.",
    "If I take this leap, everything will become chaotic.",
    "If I let go of control, things will collapse.",
    "If I trust the process, I'll end up in a worse situation.",
    "If things get too big, I'll be unable to manage them.",
    "If I step into uncertainty, I'll spiral.",
    "If I expand beyond what I know, I'll fail spectacularly."
  ],

  // ==========================================
  // WORTHINESS WOUND
  // Core fear: Receiving = owing/being exposed as undeserving
  // ==========================================
  worthiness: [
    "If I receive abundance, I'll owe something I can't repay.",
    "If I charge what I'm worth, people will reject me.",
    "If I succeed, I'll be exposed as a fraud.",
    "If I receive recognition, people will realize I'm not that special.",
    "If I'm paid well, I'll prove I'm greedy.",
    "If I have more, I'll become someone I don't respect.",
    "If I accept abundance, I'll feel guilty.",
    "If I'm celebrated, I'll disappoint people eventually.",
    "If I claim my worth, I'll be seen as arrogant.",
    "If I receive freely, I'll be taking from others."
  ],

  // ==========================================
  // SAFETY WOUND
  // Core fear: Power/success = vulnerability/danger
  // ==========================================
  safety: [
    "If I pursue this ambition, I'll sacrifice my peace.",
    "If I'm successful, I'll become a target.",
    "If I step into my power, I'll be unsafe.",
    "If I have abundance, I'll attract danger.",
    "If I'm visible and successful, bad things will happen.",
    "If I fully commit, I'll be trapped.",
    "If I achieve this level, I'll lose my freedom.",
    "If I rise to this occasion, I'll be responsible for too much.",
    "If I claim my power, I'll attract envy and harm.",
    "If I follow my ambition, I'll betray my values."
  ],

  // ==========================================
  // IMPACT/RESPONSIBILITY WOUND
  // Core fear: Scale = burden I can't carry
  // ==========================================
  impact: [
    "If I impact many people, I'll be responsible for their outcomes.",
    "If I lead at scale, I'll let people down.",
    "If my work reaches more people, I'll cause harm.",
    "If I grow my influence, the pressure will crush me.",
    "If I serve at this level, I'll burn out.",
    "If people depend on me, I'll fail them.",
    "If my message spreads widely, I'll be held to impossible standards.",
    "If I scale my impact, I'll lose the quality that made it special.",
    "If I become influential, I'll misuse my power.",
    "If I lead others, I'll lead them in the wrong direction."
  ],

  // ==========================================
  // ABUNDANCE/MONEY WOUND
  // Core fear: Money = corruption/loss of self
  // ==========================================
  abundance: [
    "If I have money, I'll lose who I am.",
    "If I'm wealthy, I'll become disconnected from what matters.",
    "If I earn at this level, I'll be corrupted by money.",
    "If I prioritize income, I'll compromise my values.",
    "If I receive financial abundance, I'll change for the worse.",
    "If I have wealth, people will only see me as money.",
    "If I'm financially successful, I'll become shallow.",
    "If I focus on earning, I'll lose my purpose.",
    "If I have more money, I'll be surrounded by the wrong people.",
    "If I'm abundant, I'll forget where I came from."
  ],

  // ==========================================
  // PERFECTION/FAILURE WOUND
  // Core fear: Being less than perfect = being nothing
  // ==========================================
  perfection: [
    "If I'm not perfect, I'll be exposed as inadequate.",
    "If I make a mistake, I'll lose everything.",
    "If I fail, I'll prove I was never good enough.",
    "If I try and fail, I'll never recover.",
    "If people see my flaws, they'll reject me completely.",
    "If I'm anything less than excellent, I'm worthless.",
    "If I show weakness, people will lose respect for me.",
    "If I make the wrong move, I'll ruin everything.",
    "If I'm not at the top, I'm at the bottom.",
    "If I can't do it perfectly, I shouldn't do it at all."
  ]
};

/**
 * Safety Contract Selection Logic
 * Returns 5-7 most relevant fear contracts based on user context
 *
 * These test the actual subconscious fears, which produces more accurate
 * sway test results than testing empowering beliefs.
 */
export function selectSafetyContracts(userContext) {
  const selectedContracts = [];

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
  // RULE 1: Visibility contraction
  // ==========================================
  if (noToSafeBeingSeen) {
    selectedContracts.push(safetyContracts.visibility[0]); // "If I'm fully visible, I'll be judged"
    selectedContracts.push(safetyContracts.visibility[1]); // "If I show up authentically, I'll be rejected"
  }

  // ==========================================
  // RULE 2: Money/abundance contraction
  // ==========================================
  if (noToSafeEarning) {
    selectedContracts.push(safetyContracts.abundance[0]); // "If I have money, I'll lose who I am"

    // Add worthiness wound if high income goal
    if (incomeGoal === "1000000+" || incomeGoal === "500000+") {
      selectedContracts.push(safetyContracts.worthiness[0]); // "If I receive abundance, I'll owe something I can't repay"
    } else {
      selectedContracts.push(safetyContracts.abundance[1]); // "If I'm wealthy, I'll become disconnected"
    }
  }

  // ==========================================
  // RULE 3: General safety around pursuing ambition
  // ==========================================
  if (noToSafePursuing || yesToFeelsUnsafe) {
    selectedContracts.push(safetyContracts.safety[0]); // "If I pursue this ambition, I'll sacrifice my peace"
  }

  // ==========================================
  // RULE 4: Self-sabotage pattern (stability wound)
  // ==========================================
  if (yesToSelfSabotage) {
    selectedContracts.push(safetyContracts.stability[0]); // "If I expand, I'll lose control"
  }

  // ==========================================
  // RULE 5: High impact = responsibility wound
  // ==========================================
  if (impactGoal === "100000+") {
    selectedContracts.push(safetyContracts.impact[0]); // "If I impact many people, I'll be responsible for their outcomes"
  }

  // ==========================================
  // RULE 6: Struggle area keywords (NLP)
  // ==========================================
  const struggleLower = (struggleArea || "").toLowerCase();

  // Visibility keywords
  if (struggleLower.includes("visible") || struggleLower.includes("seen") ||
      struggleLower.includes("show up") || struggleLower.includes("market") ||
      struggleLower.includes("post") || struggleLower.includes("social media")) {
    if (!selectedContracts.some(c => c.includes("visible"))) {
      selectedContracts.push(safetyContracts.visibility[3]); // "If people really see me, they'll find me inadequate"
    }
  }

  // Money keywords
  if (struggleLower.includes("money") || struggleLower.includes("pricing") ||
      struggleLower.includes("charge") || struggleLower.includes("income") ||
      struggleLower.includes("earn")) {
    if (!selectedContracts.some(c => c.includes("money") || c.includes("wealth") || c.includes("abundant"))) {
      selectedContracts.push(safetyContracts.abundance[4]); // "If I receive financial abundance, I'll change for the worse"
    }
  }

  // Pressure/burnout keywords
  if (struggleLower.includes("pressure") || struggleLower.includes("burnout") ||
      struggleLower.includes("exhaust") || struggleLower.includes("overwhelm") ||
      struggleLower.includes("stress")) {
    selectedContracts.push(safetyContracts.stability[3]); // "If I succeed at this level, I'll be overwhelmed"
  }

  // Belonging/relationship keywords
  if (struggleLower.includes("belong") || struggleLower.includes("relation") ||
      struggleLower.includes("connection") || struggleLower.includes("isolat") ||
      struggleLower.includes("alone") || struggleLower.includes("people")) {
    selectedContracts.push(safetyContracts.belonging[0]); // "If I succeed, I'll lose connection with people I love"
  }

  // Control/trust keywords
  if (struggleLower.includes("control") || struggleLower.includes("trust") ||
      struggleLower.includes("uncertain") || struggleLower.includes("chaos")) {
    if (!selectedContracts.some(c => c.includes("control"))) {
      selectedContracts.push(safetyContracts.stability[1]); // "If I scale, things will fall apart"
    }
  }

  // Perfection/failure keywords
  if (struggleLower.includes("perfect") || struggleLower.includes("fail") ||
      struggleLower.includes("mistake") || struggleLower.includes("good enough") ||
      struggleLower.includes("inadequate")) {
    selectedContracts.push(safetyContracts.perfection[0]); // "If I'm not perfect, I'll be exposed as inadequate"
  }

  // Responsibility/leading keywords
  if (struggleLower.includes("lead") || struggleLower.includes("responsib") ||
      struggleLower.includes("depend") || struggleLower.includes("let people down")) {
    if (!selectedContracts.some(c => c.includes("responsible") || c.includes("lead"))) {
      selectedContracts.push(safetyContracts.impact[1]); // "If I lead at scale, I'll let people down"
    }
  }

  // ==========================================
  // RULE 7: Fill to minimum 5 contracts
  // ==========================================
  // Add universal contracts if we don't have enough yet
  const universalContracts = [
    safetyContracts.worthiness[2],  // "If I succeed, I'll be exposed as a fraud"
    safetyContracts.belonging[1],   // "If I outgrow my current life, I'll be alone"
    safetyContracts.safety[2],      // "If I step into my power, I'll be unsafe"
    safetyContracts.stability[2],   // "If I grow too fast, I'll lose myself"
    safetyContracts.perfection[2]   // "If I fail, I'll prove I was never good enough"
  ];

  for (const contract of universalContracts) {
    if (selectedContracts.length >= 7) break;
    if (!selectedContracts.includes(contract)) {
      selectedContracts.push(contract);
    }
  }

  // ==========================================
  // RULE 8: Cap at 7 contracts max
  // ==========================================
  return [...new Set(selectedContracts)].slice(0, 7);
}

/**
 * Get contracts organized by wound type for testing/reference
 */
export function getAllContractsByWound() {
  return safetyContracts;
}

/**
 * Get total count of safety contracts
 */
export function getTotalContractCount() {
  return Object.values(safetyContracts).reduce((sum, arr) => sum + arr.length, 0);
}
