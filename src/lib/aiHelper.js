/**
 * AI Helper for Nervous System Safety Flow
 * Uses secure anthropicClient to generate personalized reflections
 */

import { sendMessage } from './anthropicClient';

/**
 * Generate personalized pattern reflection using AI
 *
 * @param {Object} context - User's complete context from the flow
 * @returns {Promise<string>} AI-generated personalized reflection
 */
export async function generatePersonalizedReflection(context) {
  const {
    user_name,
    impact_goal,
    income_goal,
    positive_change,
    struggle_area,
    triage_safe_being_seen,
    triage_safe_earning,
    triage_safe_pursuing,
    triage_self_sabotage,
    triage_feels_unsafe,
    belief_test_results
  } = context;

  // Build the system prompt with instructions for Claude
  const systemPrompt = `You are a compassionate nervous system coach and somatic therapist specializing in subconscious safety patterns and fear work.

Your task is to create a personalized reflection based on their sway test results (safety contracts). These are FEAR TESTS - statements in "If X, then Y" format that reveal what their nervous system believes will happen if they pursue their ambitions.

The reflection should:

1. Map their safety zones vs contraction zones (be specific to their numbers/goals)
2. Name the protective pattern underneath (what the nervous system learned)
3. Identify the deeper fear protecting them (what they're really afraid of)
4. Suggest what needs to be rewired (specific beliefs/associations)
5. Optional: Name an archetype if relevant (e.g., "The Invisible Achiever", "The Selfless Healer")

Use warm, insightful, deeply personalized language that makes them feel seen. Be specific to their data. Use "you/your" language.`;

  // Build the user message with all their data
  const userMessage = `Create a personalized nervous system reflection for ${user_name}.

**Their Vision:**
- Impact goal: ${impact_goal} people
- Income goal: $${income_goal}/year
- Positive change they create: ${positive_change}
- Current struggle: ${struggle_area}

**Sway Test Results (Triage):**
- "I feel safe being seen by ${impact_goal} people" → ${triage_safe_being_seen?.toUpperCase() || 'N/A'}
- "I feel safe earning over $${income_goal}/year" → ${triage_safe_earning?.toUpperCase() || 'N/A'}
- "I believe I am safe to pursue my identified ambition" → ${triage_safe_pursuing?.toUpperCase() || 'N/A'}
- "What I'm struggling with, I am also subconsciously self-sabotaging" → ${triage_self_sabotage?.toUpperCase() || 'N/A'}
- "Part of me feels unsafe with the vision of my ambitions" → ${triage_feels_unsafe?.toUpperCase() || 'N/A'}

**Safety Contract Test Results (Fear Tests):**
${formatContractResults(belief_test_results)}

Create a compassionate, insightful reflection that:
1. Names where their system feels safe vs. where it contracts (reference their specific numbers)
2. Identifies the protective pattern (what their nervous system learned)
3. Reveals the deeper fear (what they're truly afraid of)
4. Optional: Names an archetype if one emerges from the data
5. Explains what needs to be rewired (specific beliefs/associations)

Make it personal, warm, and deeply insightful. Start with "Here's what I'm noticing, ${user_name}:" and format with clear sections using markdown (**, ###, etc.).`;

  try {
    // Call Anthropic API via secure serverless function
    const messages = [
      { role: 'user', content: userMessage }
    ];

    const response = await sendMessage(messages, {
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: systemPrompt
    });

    // Extract the text content
    if (response?.content?.[0]?.text) {
      return response.content[0].text;
    } else {
      console.error('❌ Unexpected AI response format:', response);
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('❌ Error generating AI reflection:', error);
    // Return fallback message instead of throwing
    return generateFallbackReflection(context);
  }
}

/**
 * Format safety contract test results for the AI prompt
 * Contracts are fear statements tested via sway test
 */
function formatContractResults(contractResults) {
  if (!contractResults || typeof contractResults !== 'object') {
    return '(Safety contracts have not been tested yet)';
  }

  // Handle if it's a string
  if (typeof contractResults === 'string') {
    return contractResults;
  }

  let output = '';
  Object.entries(contractResults).forEach(([contract, response]) => {
    const emoji = response === 'yes' ? '⚠️ YES' : '✅ NO';
    output += `${emoji} - "${contract}" → This fear ${response === 'yes' ? 'IS active' : 'is NOT active'}\n`;
  });

  return output || '(Safety contracts have not been tested yet)';
}

/**
 * Fallback reflection if AI call fails
 * Uses simple template logic as backup
 */
function generateFallbackReflection(context) {
  const {
    user_name,
    impact_goal,
    income_goal,
    triage_safe_being_seen,
    triage_safe_earning,
    triage_safe_pursuing
  } = context;

  let reflection = `Here's what I'm noticing, ${user_name}:\n\n`;

  reflection += `**Where your system is showing contraction:**\n`;

  if (triage_safe_being_seen === 'no') {
    reflection += `• Visibility at the scale of ${impact_goal} people\n`;
  }
  if (triage_safe_earning === 'no') {
    reflection += `• Receiving $${income_goal}/year\n`;
  }
  if (triage_safe_pursuing === 'no') {
    reflection += `• Pursuing this ambition at all\n`;
  }

  reflection += `\nYour system is trying to keep you safe. This contraction is protective, not a flaw.\n\n`;
  reflection += `**What needs to be rewired:**\n`;
  reflection += `The nervous system's association between your ambition and danger.\n`;

  return reflection;
}

/**
 * Test if AI connection is working
 * @returns {Promise<boolean>}
 */
export async function testAIConnection() {
  try {
    const messages = [
      { role: 'user', content: 'Hello, this is a connection test. Please respond with "Connection successful".' }
    ];

    const response = await sendMessage(messages, {
      model: 'claude-3-haiku-20240307',
      max_tokens: 50
    });

    return response?.content?.[0]?.text?.includes('Connection successful') || false;
  } catch (error) {
    console.error('❌ AI connection test failed:', error);
    return false;
  }
}
