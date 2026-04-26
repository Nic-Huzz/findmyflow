import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassifyRequest {
  response_problem: string
  response_source: string
  response_audience: string
  problem_spread?: number
  existing_skills?: string[]
  existing_problems?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: ClassifyRequest = await req.json()
    const { response_problem, response_source, response_audience, problem_spread, existing_skills, existing_problems } = body

    if (!response_problem || !response_source || !response_audience) {
      throw new Error('All three responses are required')
    }

    const supplementaryLines = []
    if (problem_spread !== undefined) {
      supplementaryLines.push(`They identified with ${problem_spread} out of 12 problem categories in their earlier assessment.`)
    }
    if (existing_skills?.length) {
      supplementaryLines.push(`Skills they identified: ${existing_skills.join(', ')}`)
    }
    if (existing_problems?.length) {
      supplementaryLines.push(`Problems they identified with: ${existing_problems.join(', ')}`)
    }

    const prompt = `You classify people into one of four stages of a problem-scope journey. Each stage describes a different relationship between self-knowledge and the specificity of the problem they want to solve.

THE FOUR STAGES:

1. THE STREAM (specific + low self-knowledge)
Someone else's channel. They're solving a specific problem well, but it was assigned by the market, their career, or someone else's expectations. The specificity is real but the ownership is absent. They're competent but numb.

2. THE LAKE (broad + low self-knowledge)
Full but still. They care about big problems but can't narrow down. Everything resonates. They've done courses, healing, journaling, but haven't found their specific outlet. Self-knowledge is arriving but hasn't focused yet. Deep but directionless.

3. THE WATERFALL (specific + high self-knowledge)
The lake found its edge. They've found THEIR specific problem through self-knowledge work. The specificity comes from lived experience and personal wound, not market logic. Narrow, powerful, theirs. They can explain exactly who they serve and why.

4. THE RIVER (broad + high self-knowledge)
Earned breadth. They started specific, built evidence, and organically expanded. They can articulate their problem at niche, medium, and universal levels with equal conviction. Rare for new users.

EXAMPLE RESPONSES BY STAGE:

--- STREAM EXAMPLE ---
Q1 (Problem): "I help mid-size SaaS companies reduce customer churn through better onboarding flows."
Q2 (Source): "I've been in customer success for 8 years. I know this space inside out."
Q3 (Audience): "Companies with 50-200 employees experiencing growth pain. I know because I've consulted for dozens of them."
WHY STREAM: Highly specific, but the source is career tenure and market knowledge, not personal experience. No wound connection. The audience is defined by industry demographics, not felt understanding.

--- LAKE EXAMPLE ---
Q1 (Problem): "I want to help people feel safe to be themselves by creating subconscious shifts that actually work."
Q2 (Source): "I've been obsessed with this for 5 years. I just deeply care about human transformation."
Q3 (Audience): "Anyone who feels stuck or disconnected from who they really are. I know because I see it everywhere."
WHY LAKE: Broad population ("people", "anyone"), passion-based ownership without a specific origin moment, audience described universally. The care is real but unfocused. Method hint exists ("subconscious shifts") but no specific population.

--- WATERFALL EXAMPLE ---
Q1 (Problem): "I help coaches who freeze the moment someone asks them to charge what they're worth."
Q2 (Source): "Because I was that coach. I undercharged for two years because I didn't believe my healing work was real enough to put a price on. A client called me out on it and everything cracked open."
Q3 (Audience): "Women who just left corporate and are terrified their healing work isn't 'real' enough to charge for. I know because I was them 18 months ago, and I still remember exactly what that terror feels like."
WHY WATERFALL: Specific population, wound-connected ownership with a named moment, audience described through felt experience ("I was them"). The specificity comes from lived experience, not market research.

--- RIVER EXAMPLE ---
Q1 (Problem): "I make expert knowledge accessible, starting with therapists who can't translate clinical jargon into language their clients understand."
Q2 (Source): "I was the client who left therapy confused. Then I became the consultant who helped one therapist rewrite her intake forms. That single project showed me the pattern: every expert who cares more about being right than being understood has the same block."
Q3 (Audience): "It started with therapists. Now I work with architects, academics, and financial advisors who all have the same gap. They know their stuff cold but can't make it land. I know because every new field I enter, I find the exact same pattern."
WHY RIVER: Can articulate at niche ("therapists"), medium ("experts locked in jargon"), and universal ("anyone who cares more about being right than being understood") with equal specificity. Wound-connected origin. Evidence across multiple populations.

CLASSIFICATION DIMENSIONS:

| Dimension | Stream | Lake | Waterfall | River |
|-----------|--------|------|-----------|-------|
| Population specificity | Market-defined | Universal/vague | Felt + specific | Multi-level |
| Ownership source | Credentials/tenure | Passion without origin | Wound-connected | Evidence-based expansion |
| Audience evidence | Client demographics | Abstract/hypothetical | "I was them" | Pattern across populations |

When signals are mixed, weight Q2 (source) highest. Ownership source is the truest discriminator.

${supplementaryLines.length ? `\nSUPPLEMENTARY DATA:\n${supplementaryLines.join('\n')}\nUse this as supporting context but classify primarily from the three responses.\n` : ''}
USER RESPONSES:

Q1 (What problem do you solve?): "${response_problem}"

Q2 (What happened that made this personal?): "${response_source}"

Q3 (What's happening in their life that would make them come to you? How do you know?): "${response_audience}"

Classify this person into exactly one stage.

Rules for the reframe field:
- NEVER use em dashes (—), semicolons (;), or double hyphens (--)
- Use commas, full stops, or rephrase instead
- Warm and honest, no jargon

Return ONLY valid JSON:
{
  "stage": "stream" or "lake" or "waterfall" or "river",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentences explaining why this stage, referencing specific words or patterns from their responses",
  "reframe": "1-2 sentences speaking directly to the user about where they are"
}`

    console.log(`classify-scope-map: classifying user responses`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    let result
    try {
      result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      // Fallback if JSON parsing fails
      result = {
        stage: 'lake',
        confidence: 0.5,
        reasoning: 'Classification could not be completed. Defaulting to Lake as the most common starting stage.',
        reframe: 'We could not determine your exact stage. Most people exploring this for the first time are in The Lake, full of possibility but still finding their specific edge.',
      }
    }

    // Validate stage value
    const validStages = ['stream', 'lake', 'waterfall', 'river']
    if (!validStages.includes(result.stage)) {
      result.stage = 'lake'
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in classify-scope-map:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
