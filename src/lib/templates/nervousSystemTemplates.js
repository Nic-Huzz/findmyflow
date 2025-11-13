/**
 * Template functions for Nervous System Safety Flow
 * Used by promptResolver to generate dynamic content
 */

import { selectSafetyContracts } from '../../data/nervousSystemBeliefs.js';
import { generatePersonalizedReflection } from '../aiHelper.js';

/**
 * GENERATE_BELIEF_TESTS Macro
 *
 * Generates 5-7 personalized safety contracts (fear tests) based on user context
 * To be presented sequentially for sway testing
 *
 * Safety contracts are "If X, then Y" statements that test actual fears
 * More accurate than empowering beliefs because they go straight to the source
 */
export function generateBeliefTests(context) {
  const userContext = {
    impactGoal: context.impact_goal,
    incomeGoal: context.income_goal,
    struggleArea: context.struggle_area,
    noToSafeBeingSeen: context.triage_safe_being_seen === 'no',
    noToSafeEarning: context.triage_safe_earning === 'no',
    noToSafePursuing: context.triage_safe_pursuing === 'no',
    yesToSelfSabotage: context.triage_self_sabotage === 'yes',
    yesToFeelsUnsafe: context.triage_feels_unsafe === 'yes'
  };

  const contracts = selectSafetyContracts(userContext);

  // Format as a sequential prompt
  let output = "Here are your personalized **safety contracts** to test.\n\n";
  output += "These are fears your nervous system may be holding to keep you safe.\n\n";
  output += "Test each one with the sway test and notice if your body says YES (this fear is active) or NO (this isn't a concern):\n\n";

  contracts.forEach((contract, index) => {
    output += `**Contract ${index + 1} of ${contracts.length}:**\n\n`;
    output += `"${contract}"\n\n`;
    output += `Did you sway YES or NO?\n\n`;
    if (index < contracts.length - 1) {
      output += "---\n\n";
    }
  });

  return output;
}

/**
 * MIRROR_PATTERN Macro
 *
 * Creates a personalized reflection based on all triage and belief test results
 * Uses AI to generate deeply personalized insights
 */
export async function mirrorPattern(context) {
  try {
    // Try AI-generated reflection first
    console.log('🤖 Generating AI-powered personalized reflection...');
    const aiReflection = await generatePersonalizedReflection(context);
    console.log('✅ AI reflection generated successfully');
    return aiReflection;
  } catch (error) {
    console.error('❌ AI reflection failed, using fallback template:', error);
    return mirrorPatternFallback(context);
  }
}

/**
 * Fallback template-based mirror pattern (if AI fails)
 */
function mirrorPatternFallback(context) {
  const {
    user_name,
    impact_goal,
    income_goal,
    struggle_area,
    triage_safe_being_seen,
    triage_safe_earning,
    triage_safe_pursuing,
    triage_self_sabotage,
    triage_feels_unsafe,
    belief_test_results
  } = context;

  let reflection = `Here's what I'm noticing, ${user_name}:\n\n`;

  // ==========================================
  // 1. MAP THE SAFETY EDGES
  // ==========================================
  const safeZones = [];
  const contractionZones = [];

  if (triage_safe_being_seen === 'yes') {
    safeZones.push(`being seen by ${impact_goal} people`);
  } else {
    contractionZones.push(`visibility at the scale of ${impact_goal} people`);
  }

  if (triage_safe_earning === 'yes') {
    safeZones.push(`earning over $${income_goal}/year`);
  } else {
    contractionZones.push(`receiving $${income_goal}/year`);
  }

  if (triage_safe_pursuing === 'no') {
    contractionZones.push("pursuing this ambition at all");
  }

  // Output safety map
  if (safeZones.length > 0) {
    reflection += `**Where your system feels safe:**\n`;
    reflection += safeZones.map(z => `• ${z}`).join('\n');
    reflection += '\n\n';
  }

  if (contractionZones.length > 0) {
    reflection += `**Where your system contracts:**\n`;
    reflection += contractionZones.map(z => `• ${z}`).join('\n');
    reflection += '\n\n';
  }

  // ==========================================
  // 2. NAME THE PROTECTIVE PATTERN
  // ==========================================
  let pattern = identifyPattern(context);
  reflection += `**The pattern underneath:**\n\n`;
  reflection += `${pattern}\n\n`;

  // ==========================================
  // 3. IDENTIFY THE FEAR
  // ==========================================
  let fear = identifyFear(context);
  reflection += `**The deeper fear that may be protecting you:**\n\n`;
  reflection += `${fear}\n\n`;

  // ==========================================
  // 4. NAME THE ARCHETYPE (if applicable)
  // ==========================================
  let archetype = identifyArchetype(context);
  if (archetype) {
    reflection += `**Your subconscious identity:**\n\n`;
    reflection += `You're operating from what I call "${archetype}" — a protective identity that once kept you safe, but now limits your expansion.\n\n`;
  }

  // ==========================================
  // 5. WHAT NEEDS TO SHIFT
  // ==========================================
  reflection += `**What needs to be rewired:**\n\n`;

  if (triage_safe_being_seen === 'no') {
    reflection += `• Your nervous system's association between visibility and danger\n`;
  }
  if (triage_safe_earning === 'no') {
    reflection += `• Your belief about what money means about who you are\n`;
  }
  if (triage_self_sabotage === 'yes') {
    reflection += `• The subconscious pattern that creates resistance when you move toward your goals\n`;
  }
  if (triage_feels_unsafe === 'yes') {
    reflection += `• The core safety signal around this level of ambition\n`;
  }

  reflection += `\n`;

  return reflection;
}

/**
 * Helper: Identify the protective pattern based on responses
 */
function identifyPattern(context) {
  const {
    triage_safe_being_seen,
    triage_safe_earning,
    triage_self_sabotage,
    struggle_area
  } = context;

  const struggleLower = (struggle_area || "").toLowerCase();

  // Pattern detection logic
  if (triage_safe_being_seen === 'no' && struggleLower.includes('visible')) {
    return "Your system has learned that being seen = being unsafe. This is often rooted in early experiences where visibility led to criticism, judgment, or rejection.";
  }

  if (triage_safe_earning === 'no' && struggleLower.includes('money')) {
    return "Your system has created a protective association between money and losing your authentic self, connection, or worthiness. This often comes from witnessing how money changed others or cultural conditioning around wealth.";
  }

  if (triage_self_sabotage === 'yes') {
    return "Your system is creating resistance as a form of protection. The self-sabotage isn't random — it's trying to keep you safe from something your subconscious perceives as dangerous (often success itself).";
  }

  // Default
  return "Your system has identified this level of ambition as outside your current safety zone. This contraction is protective — it's trying to keep you safe from something.";
}

/**
 * Helper: Identify the underlying fear
 */
function identifyFear(context) {
  const {
    triage_safe_being_seen,
    triage_safe_earning,
    triage_safe_pursuing,
    struggle_area
  } = context;

  const struggleLower = (struggle_area || "").toLowerCase();

  // Fear identification logic
  if (triage_safe_being_seen === 'no') {
    if (struggleLower.includes('reject') || struggleLower.includes('belong')) {
      return "Fear of being rejected or losing belonging if you become too visible.";
    }
    return "Fear that visibility will lead to judgment, criticism, or not being accepted for who you truly are.";
  }

  if (triage_safe_earning === 'no') {
    if (struggleLower.includes('change') || struggleLower.includes('different')) {
      return "Fear that having money will change who you are or separate you from the people you love.";
    }
    return "Fear that wealth will corrupt your values or make you lose sight of what really matters.";
  }

  if (triage_safe_pursuing === 'no') {
    return "Fear that pursuing this ambition will require sacrificing something essential — your peace, your relationships, or your authentic self.";
  }

  // Default
  return "Fear that success at this level will cost you something you're not willing to lose.";
}

/**
 * Helper: Identify the belief archetype
 */
function identifyArchetype(context) {
  const {
    triage_self_sabotage,
    triage_safe_earning,
    triage_safe_being_seen,
    struggle_area
  } = context;

  const struggleLower = (struggle_area || "").toLowerCase();

  // Archetype identification
  if (triage_self_sabotage === 'yes' && (struggleLower.includes('pressure') || struggleLower.includes('prove'))) {
    return "The Good Soldier";
  }

  if (triage_safe_earning === 'no' && (struggleLower.includes('help') || struggleLower.includes('heal'))) {
    return "The Selfless Healer";
  }

  if (triage_safe_being_seen === 'no' && struggleLower.includes('perfect')) {
    return "The Hidden Perfectionist";
  }

  if (triage_safe_being_seen === 'no' && (struggleLower.includes('judg') || struggleLower.includes('critic'))) {
    return "The Invisible Achiever";
  }

  if (struggleLower.includes('trust') || struggleLower.includes('control')) {
    return "The Strategic Controller";
  }

  // No specific archetype identified
  return null;
}

/**
 * Format belief test results for display/analysis
 * (For future use if belief_test_results is structured)
 */
export function formatBeliefResults(beliefResults) {
  if (!beliefResults || typeof beliefResults !== 'object') {
    return '';
  }

  let output = '\n**Your belief test results:**\n\n';

  Object.entries(beliefResults).forEach(([belief, response]) => {
    const emoji = response === 'yes' ? '✅' : '❌';
    output += `${emoji} "${belief}" → ${response.toUpperCase()}\n`;
  });

  return output;
}
