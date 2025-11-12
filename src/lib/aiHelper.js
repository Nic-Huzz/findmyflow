/**
 * AI Helper for Pattern Recognition
 * Uses OpenAI API for deep personalization
 */

/**
 * Mirror user's pattern using AI
 * Requires VITE_OPENAI_API_KEY environment variable
 */
export async function generateAIPatternMirror(context) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_OPENAI_API_KEY not configured. Using fallback logic.');
    return null; // Will trigger fallback
  }

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

  const systemPrompt = `You are an expert somatic therapist, kinesiologist, and coach specializing in nervous system work and subconscious pattern recognition.

Your role is to analyze a user's sway test results and provide a deeply compassionate, insightful reflection of their subconscious safety patterns.

Use the following structure:
1. **Where their system feels safe vs. where it contracts** (be specific)
2. **The protective pattern underneath** (what the nervous system learned)
3. **The deeper fear** (what they're being protected from)
4. **Archetype name** (optional - e.g., "The Invisible Achiever", "The Selfless Healer")
5. **What needs to be rewired** (specific beliefs/associations)

Tone: Warm, compassionate, insightful, non-judgmental. Make them feel deeply seen.`;

  const userPrompt = `Analyze this user's nervous system safety boundaries:

**User:** ${user_name}
**Ambition:** Impact ${impact_goal} people, earn $${income_goal}/year
**Purpose:** ${positive_change}
**Current Struggle:** ${struggle_area}

**Triage Results (Sway Tests):**
- "I feel safe being seen by ${impact_goal} people" → ${triage_safe_being_seen === 'yes' ? 'YES (feels safe)' : 'NO (contraction)'}
- "I feel safe earning over $${income_goal}/year" → ${triage_safe_earning === 'yes' ? 'YES (feels safe)' : 'NO (contraction)'}
- "I believe I am safe to pursue this ambition" → ${triage_safe_pursuing === 'yes' ? 'YES' : 'NO'}
- "I am subconsciously self-sabotaging" → ${triage_self_sabotage === 'yes' ? 'YES (active pattern)' : 'NO'}
- "Part of me feels unsafe with this vision" → ${triage_feels_unsafe === 'yes' ? 'YES (unsafe)' : 'NO'}

**Safety Contract Tests (Fears Tested):**
${belief_test_results ? formatContractResults(belief_test_results) : 'Not yet completed'}

Provide a deeply personalized reflection in the format described. Start with "Here's what I'm noticing, ${user_name}:"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('AI pattern mirror failed:', error);
    return null; // Will trigger fallback
  }
}

/**
 * Format contract test results for AI prompt
 */
function formatContractResults(results) {
  if (typeof results === 'string') {
    return results;
  }

  if (typeof results === 'object') {
    return Object.entries(results)
      .map(([contract, response]) => `- "${contract}" → ${response.toUpperCase()}`)
      .join('\n');
  }

  return 'Results not formatted';
}
