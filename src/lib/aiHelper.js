/**
 * AI Helper for Nervous System Safety Flow
 * Uses Supabase edge function to generate personalized reflections
 */

import { supabase } from './supabaseClient';

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
    nervous_system_impact_limit,
    income_goal,
    nervous_system_income_limit,
    positive_change,
    struggle_area,
    triage_safe_pursuing,
    triage_self_sabotage,
    triage_feels_unsafe,
    belief_test_results
  } = context;

  try {
    console.log('🤖 Calling nervous-system-mirror edge function...');

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('nervous-system-mirror', {
      body: {
        impact_goal,
        nervous_system_impact_limit,
        income_goal,
        nervous_system_income_limit,
        positive_change,
        struggle_area,
        triage_safe_pursuing,
        triage_self_sabotage,
        triage_feels_unsafe,
        belief_test_results
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw error;
    }

    if (!data?.success || !data?.reflection) {
      console.error('❌ Invalid edge function response:', data);
      throw new Error('Invalid edge function response');
    }

    console.log('✅ AI reflection generated successfully');

    // Format the reflection nicely for display
    const reflection = data.reflection;

    // Use the full_reflection field which has everything formatted
    return reflection.full_reflection || formatReflectionFromParts(reflection, user_name);

  } catch (error) {
    console.error('❌ Error generating AI reflection:', error);
    // Return fallback message instead of throwing
    return generateFallbackReflection(context);
  }
}

/**
 * Format reflection from component parts if full_reflection isn't available
 */
function formatReflectionFromParts(reflection, user_name) {
  const {
    archetype_name,
    archetype_description,
    safety_edges_summary,
    core_fear,
    fear_interpretation,
    rewiring_needed
  } = reflection;

  let formatted = `Here's what I'm noticing, ${user_name}:\n\n`;
  formatted += `**Your Protective Pattern:**\n\n`;
  formatted += `You're what I call ${archetype_name} — ${archetype_description}\n\n`;
  formatted += `**Safety Edges:**\n\n${safety_edges_summary}\n\n`;
  formatted += `**The Deeper Fear:**\n\n"${core_fear}"\n\n`;
  formatted += `${fear_interpretation}\n\n`;
  formatted += `**What Needs Rewiring:**\n\n${rewiring_needed}\n\n`;

  return formatted;
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
