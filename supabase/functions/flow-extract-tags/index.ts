// Flow Tag Extraction Edge Function
// Extracts semantic tags from flow entry reasoning text

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { entryId, reasoning, activityDescription = '' } = await req.json()

    if (!entryId || !reasoning) {
      return new Response(
        JSON.stringify({ error: 'entryId and reasoning are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🏷️ Extracting tags for entry:', entryId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use Claude Haiku to extract tags
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const systemPrompt = `You are a semantic tag extractor for flow tracking entries.

TASK: Extract meaningful tags from the user's flow entry reasoning text.

TAG CATEGORIES:
- **activity**: What they were doing (e.g., "coding", "client call", "writing", "design")
- **emotion**: How they felt (e.g., "excited", "frustrated", "calm", "energized")
- **person**: Who they interacted with (e.g., "client", "team", "solo", "manager")
- **blocker**: What got in the way (e.g., "technical issue", "unclear requirements", "distractions")
- **win**: What went well (e.g., "breakthrough", "positive feedback", "finished task")
- **topic**: Subject matter (e.g., "marketing", "product", "operations", "strategy")

RULES:
- Extract 3-8 tags per entry
- Tags should be lowercase, concise (1-3 words)
- Focus on actionable, searchable tags
- Assign appropriate category to each tag
- Include confidence score (0-1) based on how clearly the tag is mentioned

OUTPUT: Return structured JSON with tags array.`

    const userPrompt = `Extract tags from this flow entry:

Activity: ${activityDescription || 'Not specified'}
Reasoning: ${reasoning}

Extract relevant tags with categories and confidence scores.`

    console.log('🤖 Calling Claude Haiku for tag extraction...')

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      temperature: 0.3, // Lower temp for more consistent tagging
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }],
      tools: [{
        name: 'save_tags',
        description: 'Save the extracted tags',
        input_schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              description: 'Extracted semantic tags',
              items: {
                type: 'object',
                properties: {
                  tag: { type: 'string', description: 'The tag text (lowercase, 1-3 words)' },
                  tag_category: {
                    type: 'string',
                    enum: ['activity', 'emotion', 'person', 'blocker', 'win', 'topic'],
                    description: 'Category of the tag'
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence score 0-1 based on how clearly mentioned',
                    minimum: 0,
                    maximum: 1
                  }
                },
                required: ['tag', 'tag_category', 'confidence']
              }
            }
          },
          required: ['tags']
        }
      }]
    })

    console.log('✅ Claude response received')

    // Extract tool use from response
    const toolUse = completion.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || toolUse.name !== 'save_tags') {
      console.error('No valid tool use in Claude response')
      throw new Error('AI did not return structured tags')
    }

    const { tags } = toolUse.input

    if (!tags || tags.length === 0) {
      console.log('⚠️ No tags extracted')
      return new Response(
        JSON.stringify({
          success: true,
          tags_extracted: 0,
          message: 'No tags found in reasoning text'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save tags to flow_entry_tags table
    const tagRecords = tags.map((tag: any) => ({
      flow_entry_id: entryId,
      tag: tag.tag,
      tag_category: tag.tag_category,
      confidence: tag.confidence
    }))

    const { data: savedTags, error: saveError } = await supabase
      .from('flow_entry_tags')
      .insert(tagRecords)
      .select()

    if (saveError) {
      console.error('Error saving tags:', saveError)
      throw saveError
    }

    console.log(`✅ Saved ${savedTags.length} tags`)

    return new Response(
      JSON.stringify({
        success: true,
        tags_extracted: savedTags.length,
        tags: savedTags
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in flow-extract-tags:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
