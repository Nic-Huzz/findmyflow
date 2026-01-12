/**
 * Story Bank Service
 * Manages the library of reusable content (stories, takes, wins, etc.)
 * for AI content generation
 */
import { supabase } from './supabaseClient'

// Category definitions with prompts and examples
export const STORY_CATEGORIES = {
  transformation_story: {
    label: 'Transformation Story',
    icon: '🦋',
    description: 'Your journey or a client\'s journey from struggle to success',
    prompt: 'Tell a transformation story - either your own journey or a client\'s. Include: the "before" state, what changed, and the "after" results.',
    example: 'Sarah came to me burnt out, working 60-hour weeks and barely making $3k/month. She thought she needed to hustle harder. Within 90 days of working together, she cut her hours in half and tripled her income by...',
    contentTypes: ['transformation_story', 'social_proof']
  },
  client_win: {
    label: 'Client Win',
    icon: '🏆',
    description: 'Specific success stories with concrete details',
    prompt: 'Share a specific client win. Include their name (or pseudonym), their challenge, what you did together, and the specific results they achieved.',
    example: 'Just got this message from Marcus: "I finally hit $20k this month!" When we started, he was stuck at $2k wondering what he was doing wrong. The shift? We completely restructured his offer...',
    contentTypes: ['social_proof', 'transformation_story']
  },
  failure_lesson: {
    label: 'Failure & Lesson',
    icon: '📉',
    description: 'Mistakes you\'ve made and what you learned',
    prompt: 'Share a mistake or failure you experienced. What happened, why it went wrong, what it cost you, and the lesson you learned.',
    example: 'I once spent $15k on a course that promised to "10x my business." Instead, I got overwhelmed, implemented nothing, and felt like a failure. The real lesson wasn\'t in the course - it was realizing that...',
    contentTypes: ['failure_lesson', 'educational']
  },
  contrarian_take: {
    label: 'Contrarian Take',
    icon: '🔥',
    description: 'Unpopular opinions you hold strongly',
    prompt: 'What\'s something you believe that most people in your industry would disagree with? Why do you believe it?',
    example: 'Unpopular opinion: Consistency is overrated. I\'d rather see you post once a week with genuine insight than daily with recycled motivation quotes. Quality compounds. Noise doesn\'t.',
    contentTypes: ['contrarian_take', 'myth_buster', 'educational']
  },
  behind_scenes: {
    label: 'Behind the Scenes',
    icon: '🎬',
    description: 'Your daily routine, process, or how you work',
    prompt: 'Share something about how you work - your daily routine, your process, tools you use, or a peek into your typical day.',
    example: 'My morning routine that keeps me productive: 5:30am wake up, no phone for first hour, 20 min walk, then 2 hours of deep work before I check any messages. Sounds boring but it\'s been a game changer.',
    contentTypes: ['behind_scenes', 'educational']
  },
  framework: {
    label: 'Framework / Method',
    icon: '🧩',
    description: 'Systems or methods you\'ve developed',
    prompt: 'Describe a framework, system, or method you\'ve created. What is it called? What problem does it solve? How does it work?',
    example: 'I use what I call the "3-2-1 Content Method": 3 pieces of value content, 2 engagement posts, 1 offer mention per week. It keeps my feed balanced without feeling salesy.',
    contentTypes: ['framework_share', 'educational']
  },
  origin_story: {
    label: 'Origin Story',
    icon: '📖',
    description: 'How you got started doing what you do',
    prompt: 'How did you end up doing what you do? What\'s the journey that led you here?',
    example: 'I never planned to be a coach. I was a burnt-out accountant who started sharing what I was learning about work-life balance on LinkedIn. People started asking for help. One thing led to another...',
    contentTypes: ['transformation_story', 'behind_scenes']
  },
  analogy: {
    label: 'Analogy / Metaphor',
    icon: '💡',
    description: 'Useful comparisons that explain complex ideas',
    prompt: 'Share an analogy or metaphor you use to explain something complex in your work.',
    example: 'Building a business is like growing a garden. You can\'t force plants to grow faster by pulling on them. You prepare the soil, plant seeds, water consistently, and trust the process.',
    contentTypes: ['educational', 'value_bomb']
  },
  data_point: {
    label: 'Data / Proof Point',
    icon: '📊',
    description: 'Statistics, research, or proof points you reference',
    prompt: 'Share a statistic, research finding, or proof point you often reference in your work.',
    example: '80% of coaches quit within the first year. Not because they\'re bad at coaching, but because they\'re trying to be everything to everyone. Niche down or burn out.',
    contentTypes: ['educational', 'social_proof']
  },
  quote: {
    label: 'Favorite Quote',
    icon: '💬',
    description: 'Quotes you love to use or reference',
    prompt: 'Share a quote that resonates with you and why it matters to your work.',
    example: '"You don\'t rise to the level of your goals, you fall to the level of your systems." - James Clear. This is why I focus on building sustainable systems with my clients, not just setting bigger goals.',
    contentTypes: ['educational', 'value_bomb']
  }
}

/**
 * Fetch all stories for a user
 */
export async function fetchStoryBank(userId, category = null) {
  let query = supabase
    .from('story_bank')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  return { data: data || [], error }
}

/**
 * Fetch stories relevant to a specific content type
 */
export async function fetchStoriesForContentType(userId, contentType) {
  // Find categories that map to this content type
  const relevantCategories = Object.entries(STORY_CATEGORIES)
    .filter(([_, config]) => config.contentTypes.includes(contentType))
    .map(([key]) => key)

  if (relevantCategories.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('story_bank')
    .select('*')
    .eq('user_id', userId)
    .in('category', relevantCategories)
    .order('use_count', { ascending: true }) // Prioritize less-used stories
    .limit(5)

  return { data: data || [], error }
}

/**
 * Save a new story to the bank
 */
export async function saveStory(userId, category, content, title = null, tags = []) {
  const { data, error } = await supabase
    .from('story_bank')
    .insert({
      user_id: userId,
      category,
      content,
      title,
      tags
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update an existing story
 */
export async function updateStory(storyId, updates) {
  const { data, error } = await supabase
    .from('story_bank')
    .update(updates)
    .eq('id', storyId)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete a story
 */
export async function deleteStory(storyId) {
  const { error } = await supabase
    .from('story_bank')
    .delete()
    .eq('id', storyId)

  return { error }
}

/**
 * Increment use count when AI uses a story
 */
export async function incrementStoryUseCount(storyId) {
  const { error } = await supabase.rpc('increment_story_use_count', { story_id: storyId })

  // Fallback if RPC doesn't exist
  if (error) {
    await supabase
      .from('story_bank')
      .update({ use_count: supabase.sql`use_count + 1` })
      .eq('id', storyId)
  }
}

/**
 * Get story bank stats for a user
 */
export async function getStoryBankStats(userId) {
  const { data, error } = await supabase
    .from('story_bank')
    .select('category')
    .eq('user_id', userId)

  if (error || !data) {
    return { total: 0, byCategory: {} }
  }

  const byCategory = {}
  data.forEach(story => {
    byCategory[story.category] = (byCategory[story.category] || 0) + 1
  })

  return {
    total: data.length,
    byCategory
  }
}

/**
 * Build context string from Story Bank for AI
 */
export function buildStoryBankContext(stories) {
  if (!stories || stories.length === 0) return ''

  const grouped = {}
  stories.forEach(story => {
    if (!grouped[story.category]) {
      grouped[story.category] = []
    }
    grouped[story.category].push(story.content)
  })

  let context = '\nSTORY BANK (use these real stories/examples in content):\n'

  Object.entries(grouped).forEach(([category, contents]) => {
    const label = STORY_CATEGORIES[category]?.label || category
    context += `\n${label}:\n`
    contents.forEach((content, i) => {
      context += `- ${content.slice(0, 500)}${content.length > 500 ? '...' : ''}\n`
    })
  })

  return context
}

// ============================================
// AI INTERVIEW MODE - Guided story extraction
// ============================================

export const INTERVIEW_QUESTIONS = {
  transformation_story: [
    { id: 'before', question: "Think about yourself or a client before the transformation. What was life like? What were the struggles?", followUp: "Paint a picture of the frustration, the failed attempts, the 'before' state." },
    { id: 'trigger', question: "What was the turning point? What happened that made things change?", followUp: "This could be a realization, a decision, meeting someone, or hitting rock bottom." },
    { id: 'journey', question: "What did the transformation look like? What steps were taken?", followUp: "Don't skip the messy middle - that's where the relatability lives." },
    { id: 'after', question: "What's life like now? What specific results or changes happened?", followUp: "Get specific: numbers, feelings, concrete improvements." },
    { id: 'lesson', question: "What's the one thing you (or they) wish you knew at the start?", followUp: "This becomes your takeaway for the audience." }
  ],
  client_win: [
    { id: 'who', question: "Tell me about this client. What's their name (or pseudonym) and what do they do?", followUp: "Help people see themselves in this person." },
    { id: 'struggle', question: "What were they struggling with when they came to you?", followUp: "Use their exact words if you remember them." },
    { id: 'what', question: "What did you do together? What was your approach?", followUp: "Be specific about your method or framework." },
    { id: 'result', question: "What results did they achieve? Get specific - numbers, timeframes, feelings.", followUp: "Concrete results are gold: '$X in Y days', 'went from A to B'" },
    { id: 'quote', question: "Did they say anything memorable? A quote or message they sent you?", followUp: "Direct quotes are more powerful than your summary." }
  ],
  failure_lesson: [
    { id: 'what', question: "What was the mistake or failure? What happened?", followUp: "Be honest - vulnerability builds trust." },
    { id: 'why', question: "Why did it go wrong? What did you miss or misunderstand?", followUp: "This shows self-awareness." },
    { id: 'cost', question: "What did it cost you? Time, money, reputation, opportunity?", followUp: "Real costs make the lesson tangible." },
    { id: 'lesson', question: "What did you learn? What do you do differently now?", followUp: "This is the value for your audience." },
    { id: 'advice', question: "What would you tell someone about to make the same mistake?", followUp: "This becomes actionable advice." }
  ],
  contrarian_take: [
    { id: 'belief', question: "What's something you believe that most people in your industry would disagree with?", followUp: "The spicier, the better - but you need to back it up." },
    { id: 'conventional', question: "What does conventional wisdom say? Why do most people believe the opposite?", followUp: "Show you understand the other side." },
    { id: 'evidence', question: "Why do you believe your take is right? What evidence or experience supports it?", followUp: "Personal experience is powerful evidence." },
    { id: 'result', question: "What happens when people follow your approach instead?", followUp: "Show the payoff of thinking differently." }
  ],
  behind_scenes: [
    { id: 'what', question: "What part of your routine or process do you want to share?", followUp: "People love seeing how the sausage is made." },
    { id: 'why', question: "Why do you do it this way? What makes it effective?", followUp: "Connect the tactic to the result." },
    { id: 'details', question: "Walk me through the details. Time, tools, specific steps?", followUp: "Specificity makes it valuable and believable." },
    { id: 'tip', question: "What's one thing someone could steal and use today?", followUp: "Give them a quick win." }
  ],
  framework: [
    { id: 'name', question: "What's your framework called? (Or what would you name it?)", followUp: "Named frameworks are memorable and shareable." },
    { id: 'problem', question: "What problem does this framework solve?", followUp: "Start with the pain it addresses." },
    { id: 'steps', question: "What are the steps? Walk me through it.", followUp: "3-5 steps is ideal. Each should be actionable." },
    { id: 'example', question: "Can you give me an example of it in action?", followUp: "Show don't tell - a real example brings it to life." }
  ],
  origin_story: [
    { id: 'before', question: "What were you doing before you started this work?", followUp: "Paint the picture of your past life." },
    { id: 'moment', question: "What moment or event led you to make a change?", followUp: "There's usually a specific trigger - find it." },
    { id: 'journey', question: "What was the journey from there to here?", followUp: "Include the struggles and doubts." },
    { id: 'why', question: "Why do you do this work now? What drives you?", followUp: "Connect to purpose and passion." }
  ],
  analogy: [
    { id: 'concept', question: "What complex concept do you want to explain?", followUp: "What do people usually struggle to understand?" },
    { id: 'comparison', question: "What everyday thing is it like? What's your comparison?", followUp: "The best analogies use things everyone knows." },
    { id: 'mapping', question: "How does the comparison work? What maps to what?", followUp: "Walk through the parallel." },
    { id: 'insight', question: "What 'aha moment' does this create?", followUp: "What should people suddenly understand?" }
  ],
  data_point: [
    { id: 'stat', question: "What's the statistic, number, or fact?", followUp: "Be precise - exact numbers are more credible." },
    { id: 'source', question: "Where does this data come from?", followUp: "Source credibility matters." },
    { id: 'relevance', question: "Why does this matter to your audience?", followUp: "Connect the data to their life." },
    { id: 'action', question: "What should someone do with this information?", followUp: "Data without action is just trivia." }
  ],
  quote: [
    { id: 'quote', question: "What's the quote? Who said it?", followUp: "Get it exact if you can." },
    { id: 'context', question: "When/why did they say this? What's the context?", followUp: "Context adds depth." },
    { id: 'meaning', question: "What does this quote mean to you?", followUp: "Personal interpretation makes it yours." },
    { id: 'application', question: "How do you apply this in your work or life?", followUp: "Show how it's actionable." }
  ]
}

/**
 * Get interview questions for a category
 */
export function getInterviewQuestions(category) {
  return INTERVIEW_QUESTIONS[category] || INTERVIEW_QUESTIONS.transformation_story
}

/**
 * Build story content from interview answers
 */
export function buildStoryFromInterview(category, answers) {
  const questions = INTERVIEW_QUESTIONS[category]
  if (!questions) return ''

  // Combine answers into a flowing narrative
  const parts = questions
    .map(q => answers[q.id])
    .filter(Boolean)

  return parts.join('\n\n')
}

// ============================================
// STORY PERFORMANCE TRACKING
// ============================================

/**
 * Log that stories were used in content generation
 */
export async function logStoriesUsed(contentHistoryId, storyIds) {
  if (!contentHistoryId || !storyIds?.length) return

  // Update content_history with stories used
  await supabase
    .from('content_history')
    .update({ stories_used: storyIds })
    .eq('id', contentHistoryId)

  // Increment use count for each story
  for (const storyId of storyIds) {
    await supabase.rpc('increment_story_use', { story_id: storyId })
  }
}

/**
 * Update story performance after content is posted
 */
export async function updateStoryPerformance(contentHistoryId, engagement) {
  const { data: content } = await supabase
    .from('content_history')
    .select('stories_used, story_performance_logged')
    .eq('id', contentHistoryId)
    .single()

  if (!content?.stories_used?.length || content.story_performance_logged) return

  const totalEngagement = (engagement.likes || 0) + (engagement.comments || 0) * 2 + (engagement.shares || 0) * 3

  // Update each story's performance metrics
  for (const storyId of content.stories_used) {
    const { data: story } = await supabase
      .from('story_bank')
      .select('use_count, total_engagement, avg_engagement')
      .eq('id', storyId)
      .single()

    if (story) {
      const newTotal = (story.total_engagement || 0) + totalEngagement
      const newAvg = newTotal / story.use_count
      const performanceScore = calculatePerformanceScore(newAvg, story.use_count)

      await supabase
        .from('story_bank')
        .update({
          total_engagement: newTotal,
          avg_engagement: newAvg,
          performance_score: performanceScore,
          last_used_at: new Date().toISOString()
        })
        .eq('id', storyId)
    }
  }

  // Mark as logged
  await supabase
    .from('content_history')
    .update({ story_performance_logged: true })
    .eq('id', contentHistoryId)
}

/**
 * Calculate performance score (higher = better performing story)
 */
function calculatePerformanceScore(avgEngagement, useCount) {
  // More uses with consistent engagement = higher score
  // Score = avg_engagement * log(use_count + 1)
  return avgEngagement * Math.log10(useCount + 1)
}

/**
 * Get top performing stories
 */
export async function getTopPerformingStories(userId, limit = 5) {
  const { data, error } = await supabase
    .from('story_bank')
    .select('*')
    .eq('user_id', userId)
    .gt('use_count', 0)
    .order('performance_score', { ascending: false })
    .limit(limit)

  return { data: data || [], error }
}

/**
 * Get story gap analysis - which categories are missing or underrepresented
 */
export async function getStoryGapAnalysis(userId) {
  const { data: stories } = await supabase
    .from('story_bank')
    .select('category')
    .eq('user_id', userId)

  const counts = {}
  Object.keys(STORY_CATEGORIES).forEach(cat => {
    counts[cat] = 0
  })

  (stories || []).forEach(s => {
    counts[s.category] = (counts[s.category] || 0) + 1
  })

  // Find gaps (0 stories) and weak areas (<2 stories)
  const gaps = []
  const weak = []

  Object.entries(counts).forEach(([category, count]) => {
    const config = STORY_CATEGORIES[category]
    if (count === 0) {
      gaps.push({ category, label: config.label, icon: config.icon, count: 0, priority: 'high' })
    } else if (count < 2) {
      weak.push({ category, label: config.label, icon: config.icon, count, priority: 'medium' })
    }
  })

  return { gaps, weak, counts }
}

// ============================================
// STORY MEMORY - Auto-select stories for content
// ============================================

/**
 * Smart story selection for content generation
 * Returns stories that are:
 * 1. Relevant to the content type
 * 2. Haven't been used recently
 * 3. Have good performance (if data available)
 */
export async function selectStoriesForContent(userId, contentType, limit = 3) {
  // Get relevant categories for this content type
  const relevantCategories = Object.entries(STORY_CATEGORIES)
    .filter(([_, config]) => config.contentTypes.includes(contentType))
    .map(([key]) => key)

  if (relevantCategories.length === 0) {
    // Default to transformation_story and client_win
    relevantCategories.push('transformation_story', 'client_win')
  }

  // Fetch stories, prioritizing:
  // 1. High performance score
  // 2. Low recent usage (not used in last 7 days)
  // 3. Matching categories
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: stories, error } = await supabase
    .from('story_bank')
    .select('*')
    .eq('user_id', userId)
    .in('category', relevantCategories)
    .or(`last_used_at.is.null,last_used_at.lt.${sevenDaysAgo.toISOString()}`)
    .order('performance_score', { ascending: false })
    .order('use_count', { ascending: true })
    .limit(limit)

  if (error || !stories?.length) {
    // Fallback: just get any stories in relevant categories
    const { data: fallbackStories } = await supabase
      .from('story_bank')
      .select('*')
      .eq('user_id', userId)
      .in('category', relevantCategories)
      .order('use_count', { ascending: true })
      .limit(limit)

    return { data: fallbackStories || [], error: null }
  }

  return { data: stories, error: null }
}

/**
 * Build Story Memory context - AI uses stories naturally
 */
export function buildStoryMemoryContext(stories) {
  if (!stories || stories.length === 0) return ''

  let context = `
YOUR PERSONAL STORY LIBRARY (weave these naturally into your content):

`
  stories.forEach((story, i) => {
    const config = STORY_CATEGORIES[story.category]
    context += `[${config?.label || story.category}]
${story.content}

`
  })

  context += `IMPORTANT: Don't just reference these stories - embody them. Use the specific details, emotions, and language naturally as if they're your own memories. Pull in relevant parts where they fit the narrative.`

  return context
}
