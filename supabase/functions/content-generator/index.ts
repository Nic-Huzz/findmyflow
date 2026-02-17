// Supabase Edge Function: AI Content Generator
// Generates personalized marketing content using context from user's data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Content type templates with platform-specific guidance
const CONTENT_TEMPLATES: Record<string, any> = {
  // Core content types
  transformation_story: {
    name: 'Transformation Story',
    description: 'Before/after narrative showing client journey',
    structure: `
Structure:
1. Hook (relatable "before" state)
2. The turning point
3. The transformation (specific results)
4. The lesson/takeaway
5. Call to action
    `,
    platforms: {
      instagram: 'Keep to 2200 chars max. Use line breaks. End with engagement question.',
      linkedin: 'Professional tone. Can be longer (3000 chars). Include industry context.',
      twitter: 'Thread format. Start with hook. Each tweet self-contained.',
      email: 'Personal tone. Story-driven. Clear CTA button suggestion.',
      facebook: 'Conversational. Can include more context. Encourage comments.'
    }
  },
  educational: {
    name: 'Educational/Value Post',
    description: 'Teach something valuable to establish authority',
    structure: `
Structure:
1. Bold claim or counterintuitive insight
2. Quick explanation of why it matters
3. 3-5 actionable points or steps
4. Real example or proof
5. Invitation to go deeper
    `,
    platforms: {
      instagram: 'Carousel format friendly. Number your points. Save button worthy.',
      linkedin: 'Data-driven. Professional examples. Industry insights.',
      twitter: 'Numbered list format. Punchy points. Make it shareable.',
      email: 'Deep dive allowed. Include resources. Personal experience.',
      facebook: 'Mix of personal and educational. Encourage shares.'
    }
  },
  pain_agitation: {
    name: 'Pain Agitation',
    description: 'Surface the problem to create urgency',
    structure: `
Structure:
1. Describe the pain vividly (using their language)
2. Agitate - show the cost of inaction
3. Hint at the solution without selling
4. Create curiosity
5. Soft CTA (comment, DM, link)
    `,
    platforms: {
      instagram: 'Emotional. Use their exact words. Question-based CTA.',
      linkedin: 'Professional pain points. Business impact focus.',
      twitter: 'Short, punchy pain statements. Create discussion.',
      email: 'Subject line = pain. Build empathy. Solution teaser.',
      facebook: 'Community pain. Us vs them. Validation seeking.'
    }
  },
  social_proof: {
    name: 'Social Proof/Results',
    description: 'Showcase wins and testimonials',
    structure: `
Structure:
1. Attention-grabbing result
2. Client context (relatable situation)
3. What they did (your method)
4. Specific outcomes achieved
5. How others can get similar results
    `,
    platforms: {
      instagram: 'Screenshot friendly. Tag client if possible. Celebrate them.',
      linkedin: 'Case study format. Professional metrics. Industry relevance.',
      twitter: 'Quote tweet style. Specific numbers. Thread for details.',
      email: 'Full story. Before/after. Clear path to apply.',
      facebook: 'Celebration post. Tag client. Community recognition.'
    }
  },
  offer_teaser: {
    name: 'Offer Teaser',
    description: 'Create curiosity about your offer without hard selling',
    structure: `
Structure:
1. Identify who this is for
2. The dream outcome they want
3. The obstacle that stops them
4. Hint at your unique approach
5. Soft invitation to learn more
    `,
    platforms: {
      instagram: 'Story-format friendly. Swipe up or link in bio reference.',
      linkedin: 'Value-first. Professional benefit. DM invitation.',
      twitter: 'Thread building curiosity. End with reply CTA.',
      email: 'Warm leads only. Full context. Clear next step.',
      facebook: 'Community question. Start conversation. Link in comments.'
    }
  },
  // Batch Generator content types (Hormozi-style)
  value_bomb: {
    name: 'Value Bomb',
    description: 'High-value tactical tip that provides immediate value',
    structure: `
Structure:
1. Attention-grabbing hook
2. Specific, actionable tip
3. Why it works (brief)
4. Quick implementation steps
5. Engagement question
    `,
    platforms: {
      instagram: 'Punchy, scannable. Use line breaks. Make it saveable.',
      linkedin: 'Professional tip. Add context. Industry-specific.',
      twitter: 'Thread format. Start with bold claim.',
      email: 'Quick win format. Easy to implement.',
      facebook: 'Shareable. Relatable. Action-oriented.'
    }
  },
  problem_solution: {
    name: 'Problem → Solution',
    description: 'Address a specific pain point and offer a fix',
    structure: `
Structure:
1. Name the specific problem
2. Agitate (show why it matters)
3. Present your solution
4. Proof it works
5. Call to action
    `,
    platforms: {
      instagram: 'Relatable problem. Simple solution. Question CTA.',
      linkedin: 'Business problem focus. ROI-driven.',
      twitter: 'Problem tweet, then solution thread.',
      email: 'Problem in subject line. Solution in body.',
      facebook: 'Community problem. Spark discussion.'
    }
  },
  myth_buster: {
    name: 'Myth Buster',
    description: 'Challenge common beliefs with contrarian truth',
    structure: `
Structure:
1. State the common belief/myth
2. Why people believe it
3. The truth (with evidence)
4. What to do instead
5. Engagement prompt
    `,
    platforms: {
      instagram: 'Bold opening. Evidence-based. Spark debate.',
      linkedin: 'Industry myth. Data to back it up.',
      twitter: 'Hot take opener. Thread the evidence.',
      email: 'Subject = myth. Body = truth reveal.',
      facebook: 'Controversial but respectful. Encourage comments.'
    }
  },
  failure_lesson: {
    name: 'Failure → Lesson',
    description: 'Share a mistake and what you learned from it',
    structure: `
Structure:
1. The failure (be specific)
2. What went wrong
3. The cost (real numbers help)
4. The lesson learned
5. What you do now instead
    `,
    platforms: {
      instagram: 'Vulnerable. Specific. Relatable takeaway.',
      linkedin: 'Professional failure. Business lesson.',
      twitter: 'Thread the story. End with lesson.',
      email: 'Personal story. Intimate tone.',
      facebook: 'Authentic. Encourage others to share theirs.'
    }
  },
  behind_scenes: {
    name: 'Behind the Scenes',
    description: 'Show your process, workspace, or routine',
    structure: `
Structure:
1. Set the scene
2. Walk through the process/routine
3. Key insight or tip
4. What makes it work
5. Question for audience
    `,
    platforms: {
      instagram: 'Visual-friendly. Story format works well.',
      linkedin: 'Professional routine. Productivity angle.',
      twitter: 'Day-in-the-life thread.',
      email: 'Personal peek. Build connection.',
      facebook: 'Casual, authentic. Conversation starter.'
    }
  },
  contrarian_take: {
    name: 'Contrarian Take',
    description: 'Share an unpopular opinion with reasoning',
    structure: `
Structure:
1. Hot take statement
2. Why people disagree
3. Your reasoning/evidence
4. The nuance
5. Discussion prompt
    `,
    platforms: {
      instagram: 'Bold statement. Back it up. Handle objections.',
      linkedin: 'Industry hot take. Professional debate.',
      twitter: 'Spicy opener. Thread the reasoning.',
      email: 'Controversial subject. Respectful body.',
      facebook: 'Spark healthy debate. Moderate tone.'
    }
  },
  listicle: {
    name: 'Listicle',
    description: 'Numbered list of tips, lessons, or insights',
    structure: `
Structure:
1. Hook (what they'll learn)
2. Numbered list (5-10 items)
3. Brief explanation for each
4. Summary or key takeaway
5. Save/share CTA
    `,
    platforms: {
      instagram: 'Carousel format. One point per slide.',
      linkedin: 'Numbered list. Easy to scan.',
      twitter: 'Thread with numbers. Start with promise.',
      email: 'Digest format. Quick wins.',
      facebook: 'Shareable list. Saveable content.'
    }
  },
  framework_share: {
    name: 'Framework Share',
    description: 'Teach a repeatable system or framework',
    structure: `
Structure:
1. Name your framework
2. The problem it solves
3. Step-by-step breakdown
4. Example of it in action
5. Invitation to try it
    `,
    platforms: {
      instagram: 'Visual framework. Carousel works great.',
      linkedin: 'Professional framework. Authority builder.',
      twitter: 'Thread each step. Make it actionable.',
      email: 'Deep dive allowed. Include worksheets.',
      facebook: 'Teachable moment. Encourage questions.'
    }
  },
  prediction: {
    name: 'Industry Prediction',
    description: 'Make a bold prediction about your industry future',
    structure: `
Structure:
1. Bold prediction statement
2. Why this is happening (trends/evidence)
3. What it means for your audience
4. How to prepare/adapt
5. Engagement question
    `,
    platforms: {
      instagram: 'Bold opener. Evidence in body. Prepare CTA.',
      linkedin: 'Industry trends. Data if available. Thought leadership.',
      twitter: 'Hot take format. Thread the reasoning.',
      email: 'Deep analysis. Actionable steps.',
      facebook: 'Start debate. Ask for opinions.'
    }
  },
  question_post: {
    name: 'Question/Poll',
    description: 'Ask a thought-provoking question to spark engagement',
    structure: `
Structure:
1. Context setting (optional)
2. The question (clear, specific)
3. Your answer first (model vulnerability)
4. Invitation to share their answer
5. Simple CTA
    `,
    platforms: {
      instagram: 'Use poll sticker if Stories. Caption question clear.',
      linkedin: 'Professional question. Tag relevant people.',
      twitter: 'Use poll feature or ask in tweet. Keep simple.',
      email: 'Reply-to friendly. Personal touch.',
      facebook: 'Community question. Encourage shares of answers.'
    }
  }
}

// ============================================
// GIVE/ASK CONTENT FRAMEWORK (Hormozi-style)
// ============================================

// Content types classified by intent
const GIVE_CONTENT_TYPES = [
  'educational', 'transformation_story', 'value_bomb', 'myth_buster',
  'failure_lesson', 'behind_scenes', 'framework_share', 'listicle',
  'question_post', 'prediction', 'contrarian_take'
]

const ASK_CONTENT_TYPES = [
  'offer_teaser', 'pain_agitation', 'social_proof', 'problem_solution'
]

// Recommended Give/Ask patterns
const GIVE_ASK_PATTERNS = {
  '3_1': {
    name: '3:1 Pattern',
    description: '3 value posts, then 1 ask - most common',
    pattern: ['give', 'give', 'give', 'ask'],
    ratio: 0.75
  },
  '4_1': {
    name: '4:1 Pattern',
    description: '4 value posts, then 1 ask - conservative',
    pattern: ['give', 'give', 'give', 'give', 'ask'],
    ratio: 0.80
  },
  '5_day_mixed': {
    name: '5-Day Mixed',
    description: 'Mon-Fri with strategic ask placement',
    pattern: ['give', 'give', 'ask', 'give', 'give'],
    ratio: 0.80,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  '7_day_optimal': {
    name: '7-Day Optimal',
    description: 'Full week with 2 asks strategically placed',
    pattern: ['give', 'give', 'ask', 'give', 'give', 'ask', 'give'],
    ratio: 0.71,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
}

// CTA Templates for Ask posts
const CTA_TEMPLATES = {
  dm: {
    name: 'DM Me',
    icon: '💬',
    examples: [
      'DM me "READY" and I\'ll send you the details',
      'Drop a 🔥 in my DMs if you want in',
      'DM me "START" to get your personalized plan',
      'Send me a message saying "INFO" for the full breakdown'
    ],
    bestFor: ['instagram', 'facebook', 'linkedin']
  },
  link: {
    name: 'Link Click',
    icon: '🔗',
    examples: [
      'Link in bio to grab your spot',
      'Tap the link in my bio to get started',
      'Click the link below to claim yours',
      'Get instant access → link in bio'
    ],
    bestFor: ['instagram', 'tiktok']
  },
  comment: {
    name: 'Comment Keyword',
    icon: '💬',
    examples: [
      'Comment "YES" and I\'ll DM you the link',
      'Drop "GUIDE" below and I\'ll send it to you',
      'Type "ME" in the comments for access',
      'Comment your favorite tip and I\'ll DM you a bonus'
    ],
    bestFor: ['instagram', 'facebook', 'linkedin', 'tiktok']
  },
  signup: {
    name: 'Direct Signup',
    icon: '📝',
    examples: [
      'Join 5,000+ others → [link]',
      'Get on the waitlist before spots fill up',
      'Grab your free copy at [link]',
      'Sign up for the masterclass → [link]'
    ],
    bestFor: ['email', 'linkedin', 'twitter']
  },
  call: {
    name: 'Book Call',
    icon: '📞',
    examples: [
      'Book a free strategy call → [link]',
      'Grab a spot on my calendar',
      'Let\'s chat - book a quick call',
      'Schedule your free 15-min consult'
    ],
    bestFor: ['linkedin', 'email', 'instagram']
  }
}

// Build the full prompt with context
function buildPrompt(contentType: string, platform: string, context: any, additionalInstructions: string = '') {
  const template = CONTENT_TEMPLATES[contentType as keyof typeof CONTENT_TEMPLATES]
  if (!template) throw new Error(`Unknown content type: ${contentType}`)

  const platformGuidance = template.platforms[platform as keyof typeof template.platforms] || 'General social media best practices.'

  let contextSection = ''

  // Build context from user's data
  if (context.persona) {
    contextSection += `
ABOUT THE CREATOR (from FlowFinder):
- Ideal Customer: ${context.persona.ideal_customer || 'Solopreneurs and coaches'}
- Core Problem They Solve: ${context.persona.core_problem || 'Not specified'}
- Unique Approach: ${context.persona.unique_approach || 'Not specified'}
- Key Skills: ${JSON.stringify(context.persona.skills || [])}
- Core Values: ${JSON.stringify(context.persona.values || [])}
`
  }

  // Voice Instructions - pre-built from voiceProfile.js (preferred)
  if (context.voiceInstructions) {
    contextSection += `
${context.voiceInstructions}
`
  }

  // Voice DNA - rich extracted patterns (if available)
  if (context.voice?.voice_essence) {
    contextSection += `
VOICE DNA (match this exactly):
${context.voice.voice_essence}

${context.voice.tone_descriptors?.length > 0 ? `Tone: ${context.voice.tone_descriptors.join(', ')}` : ''}
${context.voice.formality_level ? `Formality: ${context.voice.formality_level}/10 (${context.voice.formality_level < 4 ? 'casual' : context.voice.formality_level < 7 ? 'balanced' : 'professional'})` : ''}
${context.voice.energy_level ? `Energy: ${context.voice.energy_level}/10 (${context.voice.energy_level < 4 ? 'calm' : context.voice.energy_level < 7 ? 'moderate' : 'high-energy'})` : ''}

${context.voice.hook_styles?.length > 0 ? `How they START content: ${context.voice.hook_styles.join(', ')}` : ''}
${context.voice.closing_styles?.length > 0 ? `How they END content: ${context.voice.closing_styles.join(', ')}` : ''}

${context.voice.voice_dos?.length > 0 ? `DO: ${context.voice.voice_dos.join(' | ')}` : ''}
${context.voice.voice_donts?.length > 0 ? `DON'T: ${context.voice.voice_donts.join(' | ')}` : ''}

${context.voice.signature_phrases?.length > 0 ? `Signature phrases to weave in: ${context.voice.signature_phrases.join(', ')}` : ''}
${context.voice.sample_content?.length > 0 ? `Example of their writing:\n"${context.voice.sample_content[0]?.slice(0, 300)}..."` : ''}
`
  }
  // Fallback: Legacy voice context (basic fields)
  else if (context.voice) {
    contextSection += `
VOICE & STORY CONTEXT (use these to make content authentic):
${context.voice.origin_story ? `- Origin Story: ${context.voice.origin_story}` : ''}
${context.voice.client_wins ? `- Client Success Story to reference: ${context.voice.client_wins}` : ''}
${context.voice.contrarian_takes ? `- Unique Perspective/Contrarian Views: ${context.voice.contrarian_takes}` : ''}
${context.voice.audience_description ? `- How they describe their audience: ${context.voice.audience_description}` : ''}
${context.voice.signature_phrases?.length > 0 ? `- Signature Phrases to incorporate: ${context.voice.signature_phrases.join(', ')}` : ''}
${context.voice.voice_summary ? `- Voice Summary: ${context.voice.voice_summary}` : ''}
`
  }

  // Story context from Story Bank (if available)
  if (context.storyContext) {
    contextSection += `
${context.storyContext}
`
  }

  if (context.validation) {
    contextSection += `
AUDIENCE INSIGHTS (from real validation surveys):
- Their Pain Points: ${JSON.stringify(context.validation.pain_points || [])}
- What They Want: ${JSON.stringify(context.validation.desired_outcomes || [])}
- Common Objections: ${JSON.stringify(context.validation.objections || [])}
- Their Exact Words: ${JSON.stringify(context.validation.direct_quotes || [])}
- Language They Use: ${JSON.stringify(context.validation.language_used || [])}
`
  }

  if (context.offer) {
    let offerSection = `
THE OFFER:
- Dream Outcome: ${context.offer.dream_outcome || 'Not specified'}
- Price: ${context.offer.core_offer_price ? `$${context.offer.core_offer_price}` : 'Not specified'}
- Key Benefits: ${JSON.stringify(context.offer.key_benefits || [])}
- Proof Points: ${JSON.stringify(context.offer.proof_points || [])}`

    // V1 offer data - niche and problem context
    if (context.offer.niche_definition) {
      offerSection += `
- Niche Definition: ${context.offer.niche_definition}`
    }
    if (context.offer.problem_area) {
      offerSection += `
- Problem Area: ${context.offer.problem_area} (Pain Level: ${context.offer.pain_level || 'N/A'}/10)`
    }
    if (context.offer.mvp_description) {
      offerSection += `
- MVP/Core Solution: ${context.offer.mvp_description}`
    }
    if (context.offer.core_solutions?.length > 0) {
      offerSection += `
- Core Solutions: ${JSON.stringify(context.offer.core_solutions)}`
    }
    if (context.offer.lead_magnet_ideas?.length > 0) {
      offerSection += `
- Lead Magnet Ideas: ${JSON.stringify(context.offer.lead_magnet_ideas)}`
    }
    // V2 bonuses
    if (context.offer.bonuses?.length > 0) {
      offerSection += `
- Offer Bonuses: ${JSON.stringify(context.offer.bonuses)}`
    }
    if (context.offer.grand_slam_score) {
      offerSection += `
- Grand Slam Score: ${context.offer.grand_slam_score}/40`
    }

    contextSection += offerSection + '\n'
  }

  if (context.marketing) {
    contextSection += `
WHAT'S WORKING:
- Best Content Types: ${JSON.stringify(context.marketing.best_content_types || [])}
- Best Platforms: ${JSON.stringify(context.marketing.best_platforms || [])}
`
  }

  if (context.deals) {
    contextSection += `
RECENT WINS:
- Recent Client Wins: ${context.deals.recent_wins?.map((w: any) => `${w.name} ($${w.value})`).join(', ') || 'None yet'}
- Total Revenue: $${context.deals.total_won_value || 0}
- Common Objections Encountered: ${JSON.stringify(context.deals.common_objections || [])}
`
  }

  const prompt = `You are an expert marketing copywriter who creates content that converts. Your style is conversational, authentic, and focused on transformation over features.

${contextSection}

TASK: Create a ${template.name} post for ${platform.toUpperCase()}

Content Type: ${template.name}
Description: ${template.description}

${template.structure}

PLATFORM REQUIREMENTS (${platform}):
${platformGuidance}

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}\n` : ''}

CRITICAL RULES:
1. Use the audience's EXACT language where possible (from validation data)
2. Focus on transformation, not features
3. Be specific - vague content doesn't convert
4. Sound like a real person, not a marketer
5. Match the platform's native content style
6. Include a clear but non-pushy call to action

Return ONLY the content. No explanations, no meta-commentary. Just the ready-to-post content.

If it's a thread or carousel, format each part clearly with separators like:

---SLIDE 1---
[content]

---SLIDE 2---
[content]

For tweets, use:

---TWEET 1---
[content]

---TWEET 2---
[content]
`

  return prompt
}

// Model selection for cost optimization
const MODELS = {
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-5-20251001'
}

// Generate content using Claude
async function generateContent(contentType: string, platform: string, context: any, additionalInstructions: string = '', useHaiku: boolean = false) {
  const prompt = buildPrompt(contentType, platform, context, additionalInstructions)
  const model = useHaiku ? MODELS.haiku : MODELS.sonnet

  console.log(`🤖 Using model: ${model} (useHaiku: ${useHaiku})`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: useHaiku ? 1000 : 2000, // Smaller output for Haiku tasks
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const content = data.content?.[0]?.text || ''

  return {
    content,
    contentType,
    platform,
    contextUsed: {
      hasPersona: !!context.persona,
      hasVoice: !!context.voice,
      hasValidation: !!context.validation,
      hasOffer: !!context.offer,
      hasOfferV1: !!context.offer?.hasV1,
      hasOfferV2: !!context.offer?.hasV2,
      hasMarketing: !!context.marketing,
      hasDeals: !!context.deals
    },
    generatedAt: new Date().toISOString()
  }
}

// Generate variations of content
async function generateVariations(contentType: string, platform: string, context: any, count: number = 3) {
  const variations = []

  const anglePrompts = [
    'Focus on the emotional journey and transformation',
    'Lead with a bold, counterintuitive statement',
    'Start with a question that creates curiosity'
  ]

  for (let i = 0; i < Math.min(count, 3); i++) {
    const result = await generateContent(contentType, platform, context, anglePrompts[i])
    variations.push({
      ...result,
      variationNumber: i + 1,
      angle: anglePrompts[i]
    })
  }

  return { variations }
}

// Get available content types with descriptions
function getContentTypes() {
  return Object.entries(CONTENT_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: template.name,
    description: template.description,
    platforms: Object.keys(template.platforms)
  }))
}

// Generate weekly content plan
async function generateWeeklyPlan(context: any, platforms: string[] = ['instagram', 'linkedin']) {
  const prompt = `Create a 5-day content plan based on this creator's context.

${context.persona ? `
CREATOR (from FlowFinder):
- Ideal Customer: ${context.persona.ideal_customer}
- Core Problem: ${context.persona.core_problem}
- Unique Approach: ${context.persona.unique_approach}
- Key Skills: ${JSON.stringify(context.persona.skills || [])}
` : ''}

${context.voice ? `
VOICE & STORIES (use these for authentic content):
${context.voice.origin_story ? `- Origin Story: ${context.voice.origin_story}` : ''}
${context.voice.client_wins ? `- Client Success: ${context.voice.client_wins}` : ''}
${context.voice.contrarian_takes ? `- Contrarian Views: ${context.voice.contrarian_takes}` : ''}
${context.voice.signature_phrases?.length > 0 ? `- Signature Phrases: ${context.voice.signature_phrases.join(', ')}` : ''}
` : ''}

${context.validation ? `
AUDIENCE INSIGHTS (from validation surveys):
- Pain Points: ${JSON.stringify(context.validation.pain_points || [])}
- Desired Outcomes: ${JSON.stringify(context.validation.desired_outcomes || [])}
- Their Language: ${JSON.stringify(context.validation.language_used || [])}
` : ''}

${context.offer ? `
OFFER:
- Dream Outcome: ${context.offer.dream_outcome || 'Not specified'}
${context.offer.niche_definition ? `- Niche: ${context.offer.niche_definition}` : ''}
${context.offer.problem_area ? `- Problem Area: ${context.offer.problem_area}` : ''}
${context.offer.lead_magnet_ideas?.length > 0 ? `- Lead Magnet Ideas: ${JSON.stringify(context.offer.lead_magnet_ideas)}` : ''}
` : ''}

${context.marketing ? `
WHAT WORKS:
- Best Content: ${JSON.stringify(context.marketing.best_content_types)}
- Best Platforms: ${JSON.stringify(context.marketing.best_platforms)}
` : ''}

Platforms to plan for: ${platforms.join(', ')}

Create a strategic 5-day plan that:
1. Builds authority (educational content)
2. Creates connection (stories, behind-the-scenes)
3. Generates engagement (questions, discussions)
4. Drives action (soft selling, CTAs)
5. Showcases proof (results, testimonials)

Return ONLY valid JSON:
{
  "plan": [
    {
      "day": 1,
      "dayName": "Monday",
      "theme": "Authority Building",
      "posts": [
        {
          "platform": "instagram",
          "contentType": "educational",
          "hook": "Opening line suggestion",
          "angle": "What to focus on",
          "cta": "Call to action suggestion"
        }
      ]
    }
  ],
  "strategy": "1-2 sentence overall strategy explanation"
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
    return { plan: [], strategy: 'Could not generate plan. Please try again.' }
  }
}

// ============================================
// ASK CONTENT GENERATION (Headline + CTA)
// ============================================

/**
 * Generate Ask content with structured Headline + Body + CTA
 * Returns a complete Ask post with customized CTA suggestions
 */
async function generateAskContent(
  contentType: string,
  platform: string,
  context: any,
  ctaType: string = 'dm',
  additionalInstructions: string = ''
) {
  const template = CONTENT_TEMPLATES[contentType as keyof typeof CONTENT_TEMPLATES]
  if (!template) throw new Error(`Unknown content type: ${contentType}`)

  const ctaTemplate = CTA_TEMPLATES[ctaType as keyof typeof CTA_TEMPLATES] || CTA_TEMPLATES.dm
  const platformGuidance = template.platforms[platform as keyof typeof template.platforms] || ''

  // Build context section (reuse logic from buildPrompt)
  let contextSection = ''
  if (context.persona) {
    contextSection += `
CREATOR: ${context.persona.ideal_customer || 'Solopreneurs'} | Problem: ${context.persona.core_problem || 'Not specified'}
`
  }
  if (context.voiceInstructions) {
    contextSection += context.voiceInstructions + '\n'
  }
  if (context.offer) {
    contextSection += `
OFFER: ${context.offer.dream_outcome || 'Not specified'} | Price: $${context.offer.core_offer_price || 'N/A'}
`
  }

  const prompt = `You are an expert direct response copywriter. Create an ASK post that converts.

${contextSection}

TASK: Create a ${template.name} ASK post for ${platform.toUpperCase()}

This is a SALES/ASK post. The goal is to drive action.

CTA TYPE: ${ctaTemplate.name} (${ctaTemplate.icon})
CTA EXAMPLES: ${ctaTemplate.examples.join(' | ')}

PLATFORM: ${platform}
${platformGuidance}

${additionalInstructions ? `ADDITIONAL: ${additionalInstructions}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "headline": "Attention-grabbing first line (hook) - max 15 words",
  "body": "The main content of the post - can be multiple paragraphs",
  "cta": {
    "type": "${ctaType}",
    "text": "The actual CTA text to use",
    "keyword": "If comment CTA, the keyword to use (e.g., 'READY')"
  },
  "variations": [
    {
      "headline": "Alternative headline option 1",
      "cta_text": "Alternative CTA option 1"
    },
    {
      "headline": "Alternative headline option 2",
      "cta_text": "Alternative CTA option 2"
    }
  ]
}

Make it:
- Urgent but not pushy
- Specific to their offer/pain point
- Platform-native in style
- Action-oriented`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODELS.sonnet,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return {
      ...parsed,
      contentType,
      platform,
      intent: 'ask',
      ctaType,
      generatedAt: new Date().toISOString()
    }
  } catch {
    return {
      headline: '',
      body: text,
      cta: { type: ctaType, text: '' },
      error: 'Could not parse structured response',
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Generate a weekly content plan with Give/Ask pattern
 */
async function generateWeeklyPlanWithGiveAsk(
  context: any,
  platforms: string[] = ['instagram'],
  pattern: string = '5_day_mixed',
  daysCount: number = 5
) {
  const selectedPattern = GIVE_ASK_PATTERNS[pattern as keyof typeof GIVE_ASK_PATTERNS] || GIVE_ASK_PATTERNS['5_day_mixed']

  const prompt = `Create a ${daysCount}-day content plan following a Give/Ask pattern.

PATTERN: ${selectedPattern.name}
${selectedPattern.description}
Sequence: ${selectedPattern.pattern.slice(0, daysCount).join(' → ')}

${context.persona ? `
CREATOR:
- Ideal Customer: ${context.persona.ideal_customer}
- Core Problem: ${context.persona.core_problem}
` : ''}

${context.offer ? `
OFFER:
- Dream Outcome: ${context.offer.dream_outcome || 'Not specified'}
- Price: $${context.offer.core_offer_price || 'N/A'}
` : ''}

${context.voice?.signature_phrases?.length > 0 ? `
VOICE: Use phrases like: ${context.voice.signature_phrases.join(', ')}
` : ''}

Platforms: ${platforms.join(', ')}

GIVE content types to use: ${GIVE_CONTENT_TYPES.slice(0, 6).join(', ')}
ASK content types to use: ${ASK_CONTENT_TYPES.join(', ')}

Return ONLY valid JSON:
{
  "pattern": "${pattern}",
  "ratio": "${selectedPattern.ratio * 100}% Give / ${(1 - selectedPattern.ratio) * 100}% Ask",
  "plan": [
    {
      "day": 1,
      "dayName": "Monday",
      "intent": "give",
      "platform": "instagram",
      "contentType": "educational",
      "theme": "Value-first teaching",
      "hook": "Suggested opening line",
      "angle": "What to focus on",
      "cta": null
    },
    {
      "day": 3,
      "dayName": "Wednesday",
      "intent": "ask",
      "platform": "instagram",
      "contentType": "offer_teaser",
      "theme": "Direct response",
      "hook": "Suggested opening line",
      "angle": "What to focus on",
      "cta": {
        "type": "dm",
        "text": "DM me 'READY' to get started"
      }
    }
  ]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODELS.sonnet,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { plan: [], pattern, error: 'Could not generate plan' }
  }
}

/**
 * Get Give/Ask patterns and recommendations
 */
function getGiveAskPatterns() {
  return {
    patterns: GIVE_ASK_PATTERNS,
    giveContentTypes: GIVE_CONTENT_TYPES.map(id => ({
      id,
      name: CONTENT_TEMPLATES[id as keyof typeof CONTENT_TEMPLATES]?.name || id,
      intent: 'give'
    })),
    askContentTypes: ASK_CONTENT_TYPES.map(id => ({
      id,
      name: CONTENT_TEMPLATES[id as keyof typeof CONTENT_TEMPLATES]?.name || id,
      intent: 'ask'
    })),
    ctaTypes: Object.entries(CTA_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      icon: template.icon,
      examples: template.examples,
      bestFor: template.bestFor
    })),
    recommendation: {
      pattern: '5_day_mixed',
      reason: 'Best balance of value-building and conversion. Place asks mid-week when engagement is highest.'
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, contentType, platform, context, count, platforms, additionalInstructions, useHaiku } = body

    console.log(`content-generator action: ${action}, useHaiku: ${useHaiku}`)

    let result

    switch (action) {
      case 'generate':
        result = await generateContent(contentType, platform, context, additionalInstructions, useHaiku || false)
        break

      case 'variations':
        result = await generateVariations(contentType, platform, context, count || 3)
        break

      case 'content_types':
        result = { contentTypes: getContentTypes() }
        break

      case 'weekly_plan':
        result = await generateWeeklyPlan(context, platforms)
        break

      // New Give/Ask actions
      case 'generate_ask':
        // Generate Ask content with Headline + CTA structure
        result = await generateAskContent(
          contentType,
          platform,
          context,
          body.ctaType || 'dm',
          additionalInstructions
        )
        break

      case 'weekly_plan_give_ask':
        // Generate weekly plan with Give/Ask pattern
        result = await generateWeeklyPlanWithGiveAsk(
          context,
          platforms,
          body.pattern || '5_day_mixed',
          body.daysCount || 5
        )
        break

      case 'give_ask_patterns':
        // Get available patterns and CTA types
        result = getGiveAskPatterns()
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in content-generator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
