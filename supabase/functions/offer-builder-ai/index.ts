// Supabase Edge Function: $100M Offer Builder AI
// Handles bucket suggestion, dream outcome validation, and version generation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Suggest bucket based on user context
async function suggestBucket(context: any) {
  const prompt = `Analyze this user data and determine which transformation bucket (wealth, health, or relationships) their offer should fall into.

User's skills from FindMyFlow: ${JSON.stringify(context.skills || [])}
Problems they solve: ${JSON.stringify(context.problems || [])}
Target persona: ${JSON.stringify(context.persona || {})}
Validation survey responses: ${JSON.stringify(context.validationData || {})}

Rules:
- WEALTH: Financial outcomes (income, freedom, passive income, business growth)
- HEALTH: Physical/mental outcomes (energy, appearance, wellness, performance)
- RELATIONSHIPS: Connection outcomes (romance, family, friendships, networking)

Return ONLY valid JSON with this exact structure:
{
  "bucket": "wealth" | "health" | "relationships",
  "confidence": 0.0 to 1.0,
  "reasoning": "1-2 sentence explanation of why"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { bucket: null, confidence: 0, reasoning: 'Could not determine bucket' }
  }
}

// Generate dream outcome example based on validation data
async function generateDreamExample(context: any) {
  const prompt = `Based on this validation data, generate ONE example dream outcome for the ${context.bucket} bucket.

Validation data:
- Main pain: "${context.validationData?.mainPainPoint || ''}"
- Desired outcome: "${context.validationData?.desiredOutcome || ''}"
- Common words: ${JSON.stringify(context.validationData?.languageUsed || [])}
- Bucket: ${context.bucket}

Requirements:
1. Use their exact language/words where possible
2. Make it emotional and specific (not vague like "make more money")
3. Make it aspirational (something they'd brag about achieving)
4. Keep it to 1-2 sentences max

Return ONLY the example text, nothing else.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  return { example: data.content?.[0]?.text?.trim() || '' }
}

// Validate dream outcome with 5-criteria scoring
async function validateDreamOutcome(context: any) {
  const prompt = `You are validating a Dream Outcome for a ${context.bucket} transformation.

Available context:
- Bucket: ${context.bucket}
- Persona: ${JSON.stringify(context.persona || {})}
- Validation survey responses:
  * Main pain: ${context.validationData?.mainPainPoint || 'N/A'}
  * Language used: ${JSON.stringify(context.validationData?.languageUsed || [])}
  * Desired outcome: ${context.validationData?.desiredOutcome || 'N/A'}

User's Dream Outcome: "${context.dreamOutcome}"

Rate this outcome on 5 criteria (1-10 each):

1. EMOTIONAL (not logical/tactical)
   - Does it describe a feeling, not a feature?
   - Is it about transformation, not transaction?

2. SPECIFIC (clear picture, not vague)
   - Can you visualize it?
   - Is there a concrete outcome?

3. ASPIRATIONAL (bigger than current state)
   - Is it a BIG dream, not small improvement?
   - Would they brag about achieving this?

4. ALIGNED WITH BUCKET (truly about ${context.bucket})
   - Is it genuinely about ${context.bucket}?
   - Or is it actually about a different bucket?

5. USES CUSTOMER LANGUAGE (matches validation data if available)
   - Does it use words/phrases from validation?
   - Does it resonate with how THEY talk?

Return ONLY valid JSON:
{
  "emotional_score": 1-10,
  "specific_score": 1-10,
  "aspirational_score": 1-10,
  "bucket_alignment_score": 1-10,
  "language_match_score": 1-10,
  "total_score": sum (out of 50),
  "feedback": "specific improvements if score < 40, or empty string if good",
  "approved": true/false (if total >= 40)
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return {
      emotional_score: 5,
      specific_score: 5,
      aspirational_score: 5,
      bucket_alignment_score: 5,
      language_match_score: 5,
      total_score: 25,
      feedback: 'Could not validate. Please try again.',
      approved: false
    }
  }
}

// Generate 3 offer versions (Service/Productized/Product - aligned with wealth ladder)
async function generateVersions(context: any) {
  const prompt = `Create 3 detailed versions of this offer for comparison.

CONTEXT:
Dream Outcome: ${context.dreamOutcome}
Bucket: ${context.bucket}
User's skills from FindMyFlow: ${JSON.stringify(context.skills || [])}
Target persona: ${JSON.stringify(context.persona || {})}
Validation data:
- Price sensitivity/budget: ${context.validationData?.budget || 'Not specified'}
- Urgency level: ${context.validationData?.urgency || 'Not specified'}
- Preferred solution type: ${context.validationData?.solution_category || 'Not specified'}
- Preferred formats: ${JSON.stringify(context.validationData?.solution_types_service || context.validationData?.solution_types_productized || context.validationData?.solution_types_product || [])}

Create these 3 versions (aligned with the wealth ladder):

1. SERVICE VERSION (someone does it for me)
   - Coaching, consulting, done-for-you
   - Higher price, lower volume
   - More personalized, hands-on

2. PRODUCTIZED VERSION (a guided process)
   - Group coaching, cohorts, membership, courses
   - Medium price, medium volume
   - Balance of scalability and personalization

3. PRODUCT VERSION (tools I use myself)
   - Templates, software, digital downloads
   - Lower price, higher volume
   - Minimal ongoing time from creator

For EACH version, generate:
- name: Catchy name for this delivery format (2-5 words)
- deliverables: Array of 5-7 specific things they get
- investment: Object with:
  * timeToCreate: hours to setup (number)
  * moneyUpfront: $ needed upfront (number)
  * setupTimeline: timeline string (e.g., "2-3 weeks")
  * ongoingTime: hours per week/customer/cohort (number)
- canStartNow: boolean
- canStartNowReason: 1 sentence why/why not
- maxCustomersPerMonth: realistic number
- pros: Array of 3 specific advantages
- cons: Array of 3 honest drawbacks
- suggestedPrice: number (in dollars)
- revenue: Object with:
  * month1: realistic first month revenue (number)
  * month3: with some traction (number)
  * month12: if going well (number)

Be realistic and honest. Consider their actual skills when making suggestions.

Return ONLY valid JSON:
{
  "versions": {
    "service": { ... all fields ... },
    "productized": { ... all fields ... },
    "product": { ... all fields ... }
  }
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch (e) {
    console.error('Parse error:', e, 'Text:', text.substring(0, 500))
    return {
      versions: {
        service: null,
        productized: null,
        product: null
      }
    }
  }
}

// Analyze proof stack for all 3 versions
async function analyzeProofStack(context: any) {
  const prompt = `Analyze this proof stack and determine the best way to position credibility.

CONTEXT:
Dream outcome: ${context.dreamOutcome}
Bucket: ${context.bucket}
Target persona: ${JSON.stringify(context.persona || {})}
Validation data - biggest concern: ${context.validationData?.biggestConcern || 'Not specified'}

Proof elements submitted:
${JSON.stringify(context.proofData, null, 2)}

For EACH of the 3 versions (service, productized, product):
1. Rank which proof elements are most relevant
2. Identify which to "lead with" (most compelling for that delivery type)
3. Suggest how to present the proof
4. Identify what's MISSING (gaps in credibility)

Consider:
- SERVICE version → Lead with personal transformation (relatability)
- PRODUCTIZED version → Lead with proprietary methodology (unique system)
- PRODUCT version → Lead with scale proof (helped X people)

Return ONLY valid JSON:
{
  "service": {
    "lead_with": { "type": "string", "text": "the proof text", "why": "explanation" },
    "support_with": [{ "type": "string", "text": "proof text", "why": "explanation" }],
    "proof_score": 1-10
  },
  "productized": { ... same structure ... },
  "product": { ... same structure ... },
  "overall_missing": ["video testimonials", "published case studies", etc]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { service: null, productized: null, product: null, overall_missing: [] }
  }
}

// Analyze speed advantage for all 3 versions
async function analyzeSpeed(context: any) {
  const prompt = `Parse these time strings and calculate speed advantages.

Traditional: "${context.traditionalTime}"
Your method: "${context.yourTime}"
Bucket: ${context.bucket}
Dream outcome: ${context.dreamOutcome}

Calculate for EACH version (service, productized, product):

1. speedMultiplier: (e.g., "50x")
2. adjustedTime: Your method time adjusted for this version
3. quickWin: First small result they'll see
4. fullOutcome: Complete transformation timeline
5. marketingAngle: Compelling one-liner
6. realityCheck: Honest assessment of timing
7. timeDelayScore: 1-10, where 10 = near-instant results

Consider:
- SERVICE: Done-for-you, so usually fastest
- PRODUCTIZED: Group accountability speeds things up
- PRODUCT: Self-paced, so might be slower than promised

Return ONLY valid JSON:
{
  "service": {
    "speedMultiplier": "50x",
    "adjustedTime": "5-7 hours",
    "quickWin": "First feature deployed in Day 1",
    "fullOutcome": "Location independence in 60-90 days",
    "marketingAngle": "Deploy in 3 hours, not 3 months",
    "realityCheck": "Done-for-you means fastest results...",
    "timeDelayScore": 9
  },
  "productized": { ... same structure ... },
  "product": { ... same structure ... }
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { service: null, productized: null, product: null }
  }
}

// Analyze ease factors for all 3 versions
async function analyzeEase(context: any) {
  const prompt = `Analyze which "don't needs" are most relevant for each version type.

Selected eliminations:
${JSON.stringify(context.eliminatedRequirements)}

Bucket: ${context.bucket}
Dream outcome: ${context.dreamOutcome}

For EACH version (service, productized, product), determine:
1. topEaseFactors: Top 3-5 "don't needs" most relevant with why
2. marketingCopy: Marketing copy emphasizing ease (3-4 short lines)
3. realityCheck: What they still need to do (be honest)
4. stillNeeded: Array of things they actually still need
5. effortScore: 1-10, where 10 = nearly effortless

Consider:
- SERVICE: Emphasize "we do the work"
- PRODUCTIZED: Emphasize "no going it alone"
- PRODUCT: Emphasize "no hand-holding needed"

Return ONLY valid JSON:
{
  "service": {
    "topEaseFactors": [{ "factor": "No coding required", "why": "We handle it" }],
    "marketingCopy": "No coding. No hiring. No DIY. We do the work.",
    "realityCheck": "While we do the work, they still need to...",
    "stillNeeded": ["Provide input", "Make decisions", "Review deliverables"],
    "effortScore": 9
  },
  "productized": { ... same structure ... },
  "product": { ... same structure ... }
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { service: null, productized: null, product: null }
  }
}

// Generate bonuses from obstacles for all 3 versions
async function generateBonuses(context: any) {
  const prompt = `Create bonuses that remove obstacles to buying.

CONTEXT:
Dream outcome: ${context.dreamOutcome}
Bucket: ${context.bucket}
Obstacles identified:
${context.obstacles.map((o: string, i: number) => `${i+1}. ${o}`).join('\n')}

For EACH version (service, productized, product):
Create 3 bonuses that each remove one obstacle.

For each bonus, generate:
- name: Catchy, benefit-focused name
- description: 1-2 sentence description
- obstacleIndex: Which obstacle number it addresses (1-based)
- reasoning: Why this removes the obstacle (emotional reasoning)
- perceivedValue: Dollar value (number)

Match bonus type to delivery format:
- SERVICE bonuses: Extended support, follow-ups, extras
- PRODUCTIZED bonuses: Community access, extra sessions, recordings
- PRODUCT bonuses: Templates, checklists, extra modules

Return ONLY valid JSON:
{
  "service": [
    {
      "name": "30-Minute Strategy Follow-Up Call",
      "description": "30 days after delivery, hop on a call to optimize your results.",
      "obstacleIndex": 1,
      "reasoning": "They know they'll have ongoing support after the work is done.",
      "perceivedValue": 297
    },
    { ... bonus 2 ... },
    { ... bonus 3 ... }
  ],
  "productized": [ ... 3 bonuses ... ],
  "product": [ ... 3 bonuses ... ]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { service: [], productized: [], product: [] }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, context } = body

    console.log(`📥 offer-builder-ai action: ${action}`)

    let result

    switch (action) {
      case 'suggest_bucket':
        result = await suggestBucket(context)
        break

      case 'generate_dream_example':
        result = await generateDreamExample(context)
        break

      case 'validate_dream_outcome':
        result = await validateDreamOutcome(context)
        break

      case 'generate_versions':
        result = await generateVersions(context)
        break

      case 'analyze_proof_stack':
        result = await analyzeProofStack(context)
        break

      case 'analyze_speed':
        result = await analyzeSpeed(context)
        break

      case 'analyze_ease':
        result = await analyzeEase(context)
        break

      case 'generate_bonuses':
        result = await generateBonuses(context)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in offer-builder-ai:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
