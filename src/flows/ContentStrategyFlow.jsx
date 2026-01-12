/**
 * ContentStrategyFlow - AI Content Copilot Strategy Setup
 *
 * 6-question wizard to configure personalized content marketing strategy.
 * Pulls lead strategy from leads_assessments if available.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import {
  LEAD_STRATEGIES,
  PLATFORMS,
  WEEKDAYS,
  TIME_OPTIONS,
  CONTENT_TYPES,
  saveContentStrategy,
  fetchContentStrategy,
  getAvailableContentTypes,
} from '../lib/contentStrategy'
import { calculateMarketingRequirements } from '../lib/strategyCalculator'
import { LEAD_MAGNET_RATES } from '../lib/marketingBenchmarks'
import { gatherContentContext } from '../lib/contentContext'
import { fetchVoiceProfile, buildVoiceInstructions } from '../lib/voiceProfile'
import './ContentStrategyFlow.css'

// Content templates for batch generation
const BATCH_CONTENT_TEMPLATES = [
  { id: 'value_bomb', name: 'Value Bomb', icon: '💣', desc: 'High-value tactical tip' },
  { id: 'problem_solution', name: 'Problem → Solution', icon: '🔧', desc: 'Address pain, offer fix' },
  { id: 'transformation_story', name: 'Transformation Story', icon: '🦋', desc: 'Before/after narrative' },
  { id: 'myth_buster', name: 'Myth Buster', icon: '💥', desc: 'Challenge common beliefs' },
  { id: 'behind_scenes', name: 'Behind the Scenes', icon: '🎬', desc: 'Show your process' },
  { id: 'contrarian_take', name: 'Contrarian Take', icon: '🔥', desc: 'Unpopular opinion' },
  { id: 'framework_share', name: 'Framework/System', icon: '🗺️', desc: 'Share your method' },
  { id: 'listicle', name: 'Quick List', icon: '📋', desc: '5-10 quick tips' },
]

const STEPS = {
  LEAD_STRATEGY: 0,
  GOALS: 1,  // New: Revenue goals step
  PRIMARY_PLATFORM: 2,
  SECONDARY_PLATFORM: 3,
  DAYS_PER_WEEK: 4,
  TIME_PER_DAY: 5,
  CONTENT_TYPES: 6,
  SUMMARY: 7,
  VOICE_CHECK: 8,  // Check if voice profile exists before generation
  GENERATE: 9,
  GENERATING: 10,
  COMPLETE: 11,
}

// Loading tips shown during content generation
const LOADING_TIPS = [
  { icon: '🧠', text: 'Analyzing your voice profile...' },
  { icon: '🎯', text: 'Understanding your ideal customer...' },
  { icon: '✍️', text: 'Crafting an attention-grabbing hook...' },
  { icon: '💡', text: 'Adding your unique perspective...' },
  { icon: '📱', text: 'Optimizing for platform algorithm...' },
  { icon: '🔮', text: 'Adding your signature style...' },
  { icon: '✨', text: 'Polishing the final details...' },
  { icon: '🚀', text: 'Almost ready to launch...' },
]

export default function ContentStrategyFlow({ onComplete, isModal = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(STEPS.LEAD_STRATEGY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingLeadStrategy, setExistingLeadStrategy] = useState(null)
  const [existingContentStrategy, setExistingContentStrategy] = useState(null)

  // Form state
  const [leadStrategy, setLeadStrategy] = useState('post_free_content')
  const [primaryPlatform, setPrimaryPlatform] = useState('')
  const [secondaryPlatform, setSecondaryPlatform] = useState('')
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Wednesday', 'Friday'])
  const [minutesPerDay, setMinutesPerDay] = useState(60)
  const [contentTypes, setContentTypes] = useState(['text_post'])

  // Goals state (Tier 1+2)
  const [revenueGoal, setRevenueGoal] = useState(10000)
  const [coreOfferPrice, setCoreOfferPrice] = useState(500)
  const [leadMagnetType, setLeadMagnetType] = useState('guide')
  const [followerCount, setFollowerCount] = useState('')
  const [postViews, setPostViews] = useState({ post1: '', post2: '', post3: '' })
  const [showPostViewsInput, setShowPostViewsInput] = useState(false)
  const [calculatedRequirements, setCalculatedRequirements] = useState(null)

  // Calculate average views from the 3 post inputs
  const avgViewsPerPost = (() => {
    const views = [postViews.post1, postViews.post2, postViews.post3]
      .map(v => Number(v) || 0)
      .filter(v => v > 0)
    if (views.length === 0) return null
    return Math.round(views.reduce((a, b) => a + b, 0) / views.length)
  })()

  // Batch generation state
  const [dayContentTypes, setDayContentTypes] = useState({})
  const [topic, setTopic] = useState('')
  const [generatedContent, setGeneratedContent] = useState([])
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [voiceProfile, setVoiceProfile] = useState(null)
  const [context, setContext] = useState(null)
  const [loadingTipIndex, setLoadingTipIndex] = useState(0)

  // Load existing data
  useEffect(() => {
    if (user?.id) {
      loadExistingData()
    }
  }, [user?.id])

  // Calculate marketing requirements when goals change
  useEffect(() => {
    if (revenueGoal > 0 && coreOfferPrice > 0) {
      const requirements = calculateMarketingRequirements({
        revenueGoal,
        coreOfferPrice,
        platform: primaryPlatform || 'linkedin',
        leadMagnetType,
        followerCount: followerCount ? Number(followerCount) : null,
        avgViewsPerPost: avgViewsPerPost || null,
        followerLevel: 'growing', // fallback if no actual data
      })
      setCalculatedRequirements(requirements)
    }
  }, [revenueGoal, coreOfferPrice, primaryPlatform, leadMagnetType, followerCount, postViews])

  // Cycle through loading tips during generation
  useEffect(() => {
    if (currentStep !== STEPS.GENERATING) return

    const interval = setInterval(() => {
      setLoadingTipIndex(prev => (prev + 1) % LOADING_TIPS.length)
    }, 2500) // Change tip every 2.5 seconds

    return () => clearInterval(interval)
  }, [currentStep])

  async function loadExistingData() {
    setLoading(true)
    try {
      // Check for existing content strategy (for updates)
      const existingStrategy = await fetchContentStrategy(user.id)
      if (existingStrategy) {
        setExistingContentStrategy(existingStrategy)
        // Pre-fill form with existing values
        setLeadStrategy(existingStrategy.lead_strategy || 'post_free_content')
        setPrimaryPlatform(existingStrategy.primary_platform || '')
        setSecondaryPlatform(existingStrategy.secondary_platform || '')
        setSelectedDays(existingStrategy.selected_days || ['Monday', 'Wednesday', 'Friday'])
        setMinutesPerDay(existingStrategy.minutes_per_day || 60)
        setContentTypes(existingStrategy.content_types || ['text_post'])
        // Load goals if they exist
        if (existingStrategy.revenue_goal) setRevenueGoal(existingStrategy.revenue_goal)
        if (existingStrategy.core_offer_price) setCoreOfferPrice(existingStrategy.core_offer_price)
        if (existingStrategy.lead_magnet_type) setLeadMagnetType(existingStrategy.lead_magnet_type)
        // Load audience data if it exists
        if (existingStrategy.follower_count) setFollowerCount(existingStrategy.follower_count.toString())
        if (existingStrategy.avg_views_per_post) {
          // Pre-fill all 3 with the saved average (user can update)
          const avgStr = existingStrategy.avg_views_per_post.toString()
          setPostViews({ post1: avgStr, post2: avgStr, post3: avgStr })
          setShowPostViewsInput(true)
        }
      }

      // Check for leads_assessments to pull lead strategy
      const { data: leadsData } = await supabase
        .from('leads_assessments')
        .select('recommended_strategy_id, recommended_strategy_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (leadsData) {
        setExistingLeadStrategy(leadsData)
        // Only pre-fill if not already set from content strategy
        if (!existingStrategy?.lead_strategy) {
          setLeadStrategy(leadsData.recommended_strategy_id)
        }
      }

      // If no audience data saved, try to calculate from marketing_metrics
      if (!existingStrategy?.avg_views_per_post) {
        const { data: metricsData } = await supabase
          .from('marketing_metrics')
          .select('total_reach, posts_count')
          .eq('user_id', user.id)
          .order('period_start', { ascending: false })
          .limit(3)

        if (metricsData && metricsData.length > 0) {
          // Calculate average reach per post from recent metrics
          const totalReach = metricsData.reduce((sum, m) => sum + (m.total_reach || 0), 0)
          const totalPosts = metricsData.reduce((sum, m) => sum + (m.posts_count || 0), 0)
          if (totalPosts > 0) {
            const avgReach = Math.round(totalReach / totalPosts).toString()
            setPostViews({ post1: avgReach, post2: avgReach, post3: avgReach })
            setShowPostViewsInput(true)
          }
        }
      }
    } catch (err) {
      console.error('Error loading existing data:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    // Validate Goals step before proceeding
    if (currentStep === STEPS.GOALS) {
      if (!followerCount || Number(followerCount) <= 0) {
        alert('Please enter your follower count')
        return
      }
      if (!avgViewsPerPost) {
        setShowPostViewsInput(true)
        alert('Please enter views from at least one recent post')
        return
      }
    }

    if (currentStep < STEPS.SUMMARY) {
      setCurrentStep(currentStep + 1)
    }
  }

  function handleBack() {
    if (currentStep > STEPS.LEAD_STRATEGY) {
      setCurrentStep(currentStep - 1)
    } else if (!isModal) {
      navigate('/crm')
    }
  }

  function toggleDay(dayId) {
    if (selectedDays.includes(dayId)) {
      // Don't allow removing last day
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayId))
      }
    } else {
      setSelectedDays([...selectedDays, dayId])
    }
  }

  function toggleContentType(typeId) {
    if (contentTypes.includes(typeId)) {
      // Don't allow removing last content type
      if (contentTypes.length > 1) {
        setContentTypes(contentTypes.filter(t => t !== typeId))
      }
    } else {
      setContentTypes([...contentTypes, typeId])
    }
  }

  async function handleSave() {
    if (!user?.id) return

    setSaving(true)
    try {
      const result = await saveContentStrategy(user.id, {
        leadStrategy,
        primaryPlatform,
        secondaryPlatform: secondaryPlatform || null,
        selectedDays,
        minutesPerDay,
        contentTypes,
        // Goals (Tier 1+2)
        revenueGoal,
        coreOfferPrice,
        leadMagnetType,
        followerCount: followerCount ? Number(followerCount) : null,
        avgViewsPerPost: avgViewsPerPost || null,
        calculatedTargets: calculatedRequirements ? {
          customersNeeded: calculatedRequirements.funnel.customersNeeded,
          leadsNeeded: calculatedRequirements.funnel.leadsNeeded,
          reachNeeded: calculatedRequirements.funnel.reachNeeded,
          postsPerWeek: calculatedRequirements.content.postsPerWeek,
          reachSource: calculatedRequirements.reachData?.source,
          reachConfidence: calculatedRequirements.reachData?.confidence,
          calculatedAt: new Date().toISOString(),
        } : null,
      })

      if (result.error) {
        console.error('Error saving strategy:', result.error)
        alert('Failed to save strategy. Please try again.')
        return
      }

      // Initialize day content types for generation step
      const initialDayTypes = {}
      selectedDays.forEach((day, idx) => {
        const templateIdx = idx % BATCH_CONTENT_TEMPLATES.length
        initialDayTypes[day] = BATCH_CONTENT_TEMPLATES[templateIdx].id
      })
      setDayContentTypes(initialDayTypes)

      // Load voice profile and context for generation
      try {
        const [profile, ctx] = await Promise.all([
          fetchVoiceProfile(user.id),
          gatherContentContext(user.id)
        ])
        setVoiceProfile(profile)
        setContext(ctx)
      } catch (err) {
        console.warn('Could not load voice/context:', err)
      }

      // Move to voice check step (will redirect to generate if voice exists)
      setCurrentStep(STEPS.VOICE_CHECK)
    } catch (err) {
      console.error('Error saving strategy:', err)
      alert('Failed to save strategy. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Generate content for all selected days
  async function handleGenerate() {
    if (!user?.id) return

    setCurrentStep(STEPS.GENERATING)
    const total = selectedDays.length
    setGenerationProgress({ current: 0, total })

    const results = []
    const voiceInstructions = voiceProfile ? buildVoiceInstructions(voiceProfile) : ''

    for (let i = 0; i < selectedDays.length; i++) {
      const day = selectedDays[i]
      const contentType = dayContentTypes[day] || 'value_bomb'
      setGenerationProgress({ current: i + 1, total })

      try {
        // Build context for the generator
        const generatorContext = {
          persona: context?.persona ? {
            ideal_customer: context.persona.ideal_customer || context.persona.target_audience,
            core_problem: context.persona.core_problem || context.problems?.[0],
            unique_approach: context.persona.unique_approach,
            skills: context.skills?.slice(0, 5) || [],
            values: context.persona.values || [],
          } : null,
          offer: context?.offer || null,
        }

        // Add voice instructions to additional instructions
        const additionalInstructions = [
          voiceInstructions,
          topic ? `Focus on the topic: ${topic}` : '',
        ].filter(Boolean).join('\n\n')

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'generate',
            platform: primaryPlatform,
            contentType,
            context: generatorContext,
            additionalInstructions,
            useHaiku: false, // Use Sonnet for better quality
          }),
        })

        if (!response.ok) {
          throw new Error('Generation failed')
        }

        const data = await response.json()
        results.push({
          day,
          contentType,
          platform: primaryPlatform,
          content: data.content,
          hooks: data.hooks || [],
        })
      } catch (err) {
        console.error(`Error generating content for ${day}:`, err)
        results.push({
          day,
          contentType,
          platform: primaryPlatform,
          content: `[Generation failed - please try again]`,
          hooks: [],
          error: true,
        })
      }
    }

    setGeneratedContent(results)
    setCurrentStep(STEPS.COMPLETE)
  }

  // Save generated content to content_history and complete
  async function handleComplete() {
    if (!user?.id) return

    setSaving(true)
    try {
      // Save each piece of content to content_history
      const contentRecords = generatedContent
        .filter(item => !item.error)
        .map(item => ({
          user_id: user.id,
          platform: item.platform,
          content_type: item.contentType,
          content: item.content,
          status: 'draft',
          source: 'batch',
          review_status: 'pending',
          metadata: {
            day: item.day,
            hooks: item.hooks,
            generated_at: new Date().toISOString(),
          },
        }))

      if (contentRecords.length > 0) {
        const { error } = await supabase
          .from('content_history')
          .insert(contentRecords)

        if (error) {
          console.error('Error saving content:', error)
        }
      }

      if (onComplete) {
        onComplete({ strategy: existingContentStrategy, contentCount: contentRecords.length })
      } else {
        navigate('/crm/marketing')
      }
    } catch (err) {
      console.error('Error completing:', err)
    } finally {
      setSaving(false)
    }
  }

  // Skip generation and just go to marketing quests
  function handleSkipGeneration() {
    if (onComplete) {
      onComplete({ strategy: existingContentStrategy, skipped: true })
    } else {
      navigate('/crm/marketing')
    }
  }

  // Retry failed generations
  async function handleRetryFailed() {
    if (!user?.id) return

    setSaving(true)
    const failedItems = generatedContent.filter(item => item.error)
    const voiceInstructions = voiceProfile ? buildVoiceInstructions(voiceProfile) : ''

    const updatedContent = [...generatedContent]

    for (const failedItem of failedItems) {
      const idx = updatedContent.findIndex(c => c.day === failedItem.day && c.error)
      if (idx === -1) continue

      try {
        const generatorContext = {
          persona: context?.persona ? {
            ideal_customer: context.persona.ideal_customer || context.persona.target_audience,
            core_problem: context.persona.core_problem || context.problems?.[0],
            unique_approach: context.persona.unique_approach,
            skills: context.skills?.slice(0, 5) || [],
            values: context.persona.values || [],
          } : null,
          offer: context?.offer || null,
        }

        const additionalInstructions = [
          voiceInstructions,
          topic ? `Focus on the topic: ${topic}` : '',
        ].filter(Boolean).join('\n\n')

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'generate',
            platform: primaryPlatform,
            contentType: failedItem.contentType,
            context: generatorContext,
            additionalInstructions,
            useHaiku: false,
          }),
        })

        if (!response.ok) {
          throw new Error('Generation failed')
        }

        const data = await response.json()
        updatedContent[idx] = {
          day: failedItem.day,
          contentType: failedItem.contentType,
          platform: primaryPlatform,
          content: data.content,
          hooks: data.hooks || [],
          error: false,
        }
      } catch (err) {
        console.error(`Retry failed for ${failedItem.day}:`, err)
        // Keep the error state
      }
    }

    setGeneratedContent(updatedContent)
    setSaving(false)
  }

  // Get available content types based on time selection
  const availableContentTypes = getAvailableContentTypes(minutesPerDay)

  // Validation for each step
  function canProceed() {
    switch (currentStep) {
      case STEPS.LEAD_STRATEGY:
        return !!leadStrategy
      case STEPS.GOALS:
        return revenueGoal > 0 && coreOfferPrice > 0
      case STEPS.PRIMARY_PLATFORM:
        return !!primaryPlatform
      case STEPS.SECONDARY_PLATFORM:
        return true // Optional step
      case STEPS.DAYS_PER_WEEK:
        return selectedDays.length > 0
      case STEPS.TIME_PER_DAY:
        return !!minutesPerDay
      case STEPS.CONTENT_TYPES:
        return contentTypes.length > 0
      default:
        return true
    }
  }

  if (loading) {
    return (
      <div className="content-strategy-flow">
        <div className="csf-loading">
          <div className="csf-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`content-strategy-flow ${isModal ? 'modal-mode' : ''}`}>
      {/* Progress - only show for setup steps */}
      {currentStep <= STEPS.SUMMARY && (
        <div className="csf-progress">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className={`csf-progress-dot ${idx < currentStep ? 'completed' : ''} ${idx === currentStep ? 'active' : ''}`}
            />
          ))}
        </div>
      )}

      <div className="csf-container">
        {/* Step 1: Lead Strategy */}
        {currentStep === STEPS.LEAD_STRATEGY && (
          <div className="csf-step">
            <h2 className="csf-title">What's your lead generation approach?</h2>
            <p className="csf-subtitle">
              Choose your primary strategy for attracting leads
            </p>

            <div className="csf-options">
              {LEAD_STRATEGIES.map(strategy => (
                <button
                  key={strategy.id}
                  className={`csf-option-card ${leadStrategy === strategy.id ? 'selected' : ''} ${strategy.comingSoon ? 'coming-soon' : ''}`}
                  onClick={() => strategy.available && setLeadStrategy(strategy.id)}
                  disabled={!strategy.available}
                >
                  <span className="csf-option-icon">{strategy.icon}</span>
                  <div className="csf-option-content">
                    <span className="csf-option-name">{strategy.name}</span>
                    <span className="csf-option-desc">{strategy.description}</span>
                  </div>
                  {strategy.comingSoon && <span className="csf-coming-soon">Coming Soon</span>}
                  {leadStrategy === strategy.id && strategy.available && <span className="csf-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Revenue Goals (Tier 1+2) */}
        {currentStep === STEPS.GOALS && (
          <div className="csf-step goals-step">
            <h2 className="csf-title">Set Your Revenue Goal</h2>
            <p className="csf-subtitle">
              We'll calculate exactly how much content you need
            </p>

            <div className="csf-goals-form">
              <div className="csf-goal-input primary">
                <label>Monthly Revenue Goal</label>
                <div className="csf-input-with-prefix">
                  <span className="csf-prefix">$</span>
                  <input
                    type="number"
                    value={revenueGoal}
                    onChange={(e) => setRevenueGoal(Number(e.target.value))}
                    min={100}
                    step={500}
                  />
                </div>
              </div>

              <div className="csf-goal-input">
                <label>Core Offer Price</label>
                <div className="csf-input-with-prefix">
                  <span className="csf-prefix">$</span>
                  <input
                    type="number"
                    value={coreOfferPrice}
                    onChange={(e) => setCoreOfferPrice(Number(e.target.value))}
                    min={1}
                    step={50}
                  />
                </div>
              </div>

              <div className="csf-goal-input">
                <label>Lead Magnet Type</label>
                <select
                  value={leadMagnetType}
                  onChange={(e) => setLeadMagnetType(e.target.value)}
                >
                  {Object.entries(LEAD_MAGNET_RATES).map(([id, m]) => (
                    <option key={id} value={id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience Data - for accurate reach calculations */}
            <div className="csf-audience-section">
              <h3 className="csf-section-subtitle">Your Audience Data</h3>
              <p className="csf-section-desc">This helps us calculate exactly how many posts you need</p>

              <div className="csf-goals-form">
                <div className="csf-goal-input full-width">
                  <label>Followers on Primary Platform <span className="csf-required">*</span></label>
                  <input
                    type="number"
                    value={followerCount}
                    onChange={(e) => setFollowerCount(e.target.value)}
                    placeholder="e.g. 2500"
                    min={0}
                    required
                  />
                  <span className="csf-input-hint">Check your profile - we need this to calculate reach</span>
                </div>
              </div>

              {/* Post Views Dropdown */}
              <div className="csf-post-views-section">
                <button
                  type="button"
                  className={`csf-post-views-toggle ${showPostViewsInput ? 'open' : ''}`}
                  onClick={() => setShowPostViewsInput(!showPostViewsInput)}
                >
                  <span className="csf-toggle-label">
                    Views from your last 3 posts <span className="csf-required">*</span>
                  </span>
                  {avgViewsPerPost && (
                    <span className="csf-avg-badge">Avg: {avgViewsPerPost.toLocaleString()}</span>
                  )}
                  <span className="csf-toggle-arrow">{showPostViewsInput ? '▲' : '▼'}</span>
                </button>

                {showPostViewsInput && (
                  <div className="csf-post-views-inputs">
                    <div className="csf-post-view-input">
                      <label>Post 1 views</label>
                      <input
                        type="number"
                        value={postViews.post1}
                        onChange={(e) => setPostViews(prev => ({ ...prev, post1: e.target.value }))}
                        placeholder="e.g. 450"
                        min={0}
                      />
                    </div>
                    <div className="csf-post-view-input">
                      <label>Post 2 views</label>
                      <input
                        type="number"
                        value={postViews.post2}
                        onChange={(e) => setPostViews(prev => ({ ...prev, post2: e.target.value }))}
                        placeholder="e.g. 320"
                        min={0}
                      />
                    </div>
                    <div className="csf-post-view-input">
                      <label>Post 3 views</label>
                      <input
                        type="number"
                        value={postViews.post3}
                        onChange={(e) => setPostViews(prev => ({ ...prev, post3: e.target.value }))}
                        placeholder="e.g. 280"
                        min={0}
                      />
                    </div>
                    <span className="csf-input-hint">Check your insights/analytics for each post</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Requirements Preview */}
            {calculatedRequirements && (
              <>
                <div className="csf-goals-preview">
                  <div className="csf-preview-metric">
                    <span className="csf-preview-number">
                      {calculatedRequirements.funnel.customersNeeded}
                    </span>
                    <span className="csf-preview-label">customers needed</span>
                  </div>
                  <div className="csf-preview-arrow">→</div>
                  <div className="csf-preview-metric">
                    <span className="csf-preview-number">
                      {calculatedRequirements.funnel.leadsNeeded.toLocaleString()}
                    </span>
                    <span className="csf-preview-label">leads needed</span>
                  </div>
                  <div className="csf-preview-arrow">→</div>
                  <div className="csf-preview-metric highlight">
                    <span className="csf-preview-number">
                      ~{calculatedRequirements.content.postsPerWeek}
                    </span>
                    <span className="csf-preview-label">posts/week</span>
                  </div>
                </div>

                {/* Reach confidence indicator */}
                <div className={`csf-reach-confidence ${calculatedRequirements.reachData?.confidence || 'low'}`}>
                  <span className="csf-confidence-icon">
                    {calculatedRequirements.reachData?.confidence === 'high' ? '✓' :
                     calculatedRequirements.reachData?.confidence === 'medium' ? '◐' : '○'}
                  </span>
                  <span className="csf-confidence-text">
                    {calculatedRequirements.reachData?.note || 'Using industry averages'}
                  </span>
                </div>
              </>
            )}

            {leadMagnetType === 'ebook' && (
              <div className="csf-goals-warning">
                <span className="csf-warning-icon">⚠️</span>
                <p>Ebooks convert at &lt;1%. Consider switching to a quiz (40%) or cheat sheet (34%) to reduce required posts.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Primary Platform */}
        {currentStep === STEPS.PRIMARY_PLATFORM && (
          <div className="csf-step">
            <h2 className="csf-title">Where does your ideal customer spend time?</h2>
            <p className="csf-subtitle">Choose your primary platform for content</p>

            <div className="csf-options">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  className={`csf-option-card ${primaryPlatform === platform.id ? 'selected' : ''}`}
                  onClick={() => setPrimaryPlatform(platform.id)}
                >
                  <span className="csf-option-icon">{platform.icon}</span>
                  <div className="csf-option-content">
                    <span className="csf-option-name">{platform.name}</span>
                    <span className="csf-option-desc">{platform.description}</span>
                  </div>
                  {primaryPlatform === platform.id && <span className="csf-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Secondary Platform (Optional) */}
        {currentStep === STEPS.SECONDARY_PLATFORM && (
          <div className="csf-step">
            <h2 className="csf-title">Want to add a secondary platform?</h2>
            <p className="csf-subtitle">Optional: We'll create content for both (3x/week on secondary)</p>

            <div className="csf-options">
              <button
                className={`csf-option-card ${secondaryPlatform === '' ? 'selected' : ''}`}
                onClick={() => setSecondaryPlatform('')}
              >
                <span className="csf-option-icon">⏭️</span>
                <div className="csf-option-content">
                  <span className="csf-option-name">Skip</span>
                  <span className="csf-option-desc">Focus on one platform for now</span>
                </div>
                {secondaryPlatform === '' && <span className="csf-check">✓</span>}
              </button>

              {PLATFORMS.filter(p => p.id !== primaryPlatform).map(platform => (
                <button
                  key={platform.id}
                  className={`csf-option-card ${secondaryPlatform === platform.id ? 'selected' : ''}`}
                  onClick={() => setSecondaryPlatform(platform.id)}
                >
                  <span className="csf-option-icon">{platform.icon}</span>
                  <div className="csf-option-content">
                    <span className="csf-option-name">{platform.name}</span>
                    <span className="csf-option-desc">{platform.description}</span>
                  </div>
                  {secondaryPlatform === platform.id && <span className="csf-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Days Per Week */}
        {currentStep === STEPS.DAYS_PER_WEEK && (
          <div className="csf-step">
            <h2 className="csf-title">Which days will you post?</h2>
            <p className="csf-subtitle">Select the days that work for you ({selectedDays.length} selected)</p>

            <div className="csf-days-grid">
              {WEEKDAYS.map(day => (
                <button
                  key={day.id}
                  className={`csf-day-btn ${selectedDays.includes(day.id) ? 'selected' : ''}`}
                  onClick={() => toggleDay(day.id)}
                >
                  <span className="csf-day-short">{day.short}</span>
                  {selectedDays.includes(day.id) && <span className="csf-day-check">✓</span>}
                </button>
              ))}
            </div>

            <p className="csf-days-hint">
              Consistency beats frequency - choose days you can commit to
            </p>
          </div>
        )}

        {/* Step 5: Time Per Day */}
        {currentStep === STEPS.TIME_PER_DAY && (
          <div className="csf-step">
            <h2 className="csf-title">How much time daily for content marketing?</h2>
            <p className="csf-subtitle">This affects which content types we'll recommend</p>

            <div className="csf-options compact">
              {TIME_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`csf-option-card ${minutesPerDay === option.value ? 'selected' : ''}`}
                  onClick={() => setMinutesPerDay(option.value)}
                >
                  <div className="csf-option-content">
                    <span className="csf-option-name">{option.label}</span>
                    <span className="csf-option-desc">{option.description}</span>
                  </div>
                  {minutesPerDay === option.value && <span className="csf-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Content Types */}
        {currentStep === STEPS.CONTENT_TYPES && (
          <div className="csf-step">
            <h2 className="csf-title">Which content formats do you want to create?</h2>
            <p className="csf-subtitle">Select all that apply (based on your time: {TIME_OPTIONS.find(t => t.value === minutesPerDay)?.label})</p>

            <div className="csf-options multi-select">
              {CONTENT_TYPES.map(type => {
                const isAvailable = availableContentTypes.some(t => t.id === type.id)
                return (
                  <button
                    key={type.id}
                    className={`csf-option-card ${contentTypes.includes(type.id) ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                    onClick={() => isAvailable && toggleContentType(type.id)}
                    disabled={!isAvailable}
                  >
                    <span className="csf-option-icon">{type.icon}</span>
                    <div className="csf-option-content">
                      <span className="csf-option-name">{type.name}</span>
                      <span className="csf-option-desc">{type.description}</span>
                    </div>
                    {contentTypes.includes(type.id) && <span className="csf-check">✓</span>}
                    {!isAvailable && <span className="csf-locked">Needs more time</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {currentStep === STEPS.SUMMARY && (
          <div className="csf-step">
            <h2 className="csf-title">Your Content Strategy</h2>
            <p className="csf-subtitle">Review your strategy - you can update this anytime</p>

            <div className="csf-summary">
              {/* Goals Summary */}
              {calculatedRequirements && (
                <div className="csf-summary-item goals-summary">
                  <span className="csf-summary-label">Revenue Goal</span>
                  <span className="csf-summary-value">
                    💰 ${revenueGoal.toLocaleString()}/month → {calculatedRequirements.content.postsPerWeek} posts/week
                  </span>
                </div>
              )}

              <div className="csf-summary-item">
                <span className="csf-summary-label">Lead Strategy</span>
                <span className="csf-summary-value">
                  {LEAD_STRATEGIES.find(s => s.id === leadStrategy)?.icon}{' '}
                  {LEAD_STRATEGIES.find(s => s.id === leadStrategy)?.name}
                </span>
              </div>

              <div className="csf-summary-item">
                <span className="csf-summary-label">Primary Platform</span>
                <span className="csf-summary-value">
                  {PLATFORMS.find(p => p.id === primaryPlatform)?.icon}{' '}
                  {PLATFORMS.find(p => p.id === primaryPlatform)?.name}
                </span>
              </div>

              {secondaryPlatform && (
                <div className="csf-summary-item">
                  <span className="csf-summary-label">Secondary Platform</span>
                  <span className="csf-summary-value">
                    {PLATFORMS.find(p => p.id === secondaryPlatform)?.icon}{' '}
                    {PLATFORMS.find(p => p.id === secondaryPlatform)?.name}
                  </span>
                </div>
              )}

              <div className="csf-summary-item">
                <span className="csf-summary-label">Posting Days</span>
                <span className="csf-summary-value">
                  {selectedDays.length} days: {selectedDays.map(d => d.slice(0, 3)).join(', ')}
                </span>
              </div>

              <div className="csf-summary-item">
                <span className="csf-summary-label">Time Investment</span>
                <span className="csf-summary-value">
                  {TIME_OPTIONS.find(t => t.value === minutesPerDay)?.label}/day
                </span>
              </div>

              <div className="csf-summary-item">
                <span className="csf-summary-label">Content Types</span>
                <div className="csf-summary-types">
                  {contentTypes.map(typeId => {
                    const type = CONTENT_TYPES.find(t => t.id === typeId)
                    return (
                      <span key={typeId} className="csf-type-badge">
                        {type?.icon} {type?.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <p className="csf-note">
              Next: Co-create your content for the week with AI assistance.
            </p>
          </div>
        )}

        {/* Step 7: Voice Check - Ensure voice profile exists before generation */}
        {currentStep === STEPS.VOICE_CHECK && (
          <div className="csf-step">
            {voiceProfile ? (
              // Has voice profile - show confirmation
              <div className="csf-voice-ready">
                <div className="csf-voice-icon">🎙️</div>
                <h2 className="csf-title">Voice Profile Ready</h2>
                <p className="csf-subtitle">Your content will be generated in your unique voice</p>

                <div className="csf-voice-preview">
                  <div className="csf-voice-trait">
                    <span className="csf-trait-label">Voice Type:</span>
                    <span className="csf-trait-value">{voiceProfile.voice_type || 'Custom'}</span>
                  </div>
                  {voiceProfile.voice_traits?.length > 0 && (
                    <div className="csf-voice-trait">
                      <span className="csf-trait-label">Traits:</span>
                      <span className="csf-trait-value">{voiceProfile.voice_traits.slice(0, 3).join(', ')}</span>
                    </div>
                  )}
                </div>

                <button
                  className="csf-nav-next"
                  onClick={() => setCurrentStep(STEPS.GENERATE)}
                  style={{ marginTop: '24px', width: '100%' }}
                >
                  Continue to Content Creation →
                </button>
              </div>
            ) : (
              // No voice profile - prompt to create one
              <div className="csf-voice-missing">
                <div className="csf-voice-icon">🎤</div>
                <h2 className="csf-title">Train Your Voice First</h2>
                <p className="csf-subtitle">
                  For AI content that sounds like YOU, we need to learn your voice.
                  This takes about 5 minutes and makes your content 10x more authentic.
                </p>

                <div className="csf-voice-benefits">
                  <div className="csf-benefit">✓ Content matches your tone & style</div>
                  <div className="csf-benefit">✓ Uses your signature phrases</div>
                  <div className="csf-benefit">✓ Feels natural, not AI-generated</div>
                </div>

                <div className="csf-voice-actions">
                  <button
                    className="csf-nav-next"
                    onClick={() => navigate('/crm/voice-training')}
                    style={{ marginBottom: '12px' }}
                  >
                    🎙️ Start Voice Training (5 min)
                  </button>
                  <button
                    className="csf-nav-skip"
                    onClick={() => setCurrentStep(STEPS.GENERATE)}
                  >
                    Skip for now (generic voice)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 8: Generate - Choose content types per day */}
        {currentStep === STEPS.GENERATE && (
          <div className="csf-step">
            <h2 className="csf-title">Let's Co-Create Your Week</h2>
            <p className="csf-subtitle">Choose a content type for each posting day</p>

            {/* Optional topic input */}
            <div className="csf-topic-input">
              <label>Theme or topic (optional)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., productivity tips, client wins, industry trends..."
              />
            </div>

            <div className="csf-day-content-list">
              {selectedDays.map((day) => (
                <div key={day} className="csf-day-content-row">
                  <span className="csf-day-label">{day}</span>
                  <select
                    value={dayContentTypes[day] || 'value_bomb'}
                    onChange={(e) => setDayContentTypes({
                      ...dayContentTypes,
                      [day]: e.target.value
                    })}
                    className="csf-content-select"
                  >
                    {BATCH_CONTENT_TEMPLATES.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.icon} {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="csf-generate-info">
              <p>AI will generate {selectedDays.length} posts for {PLATFORMS.find(p => p.id === primaryPlatform)?.name}</p>
              {voiceProfile && (
                <p className="csf-voice-badge">Using your voice profile</p>
              )}
            </div>
          </div>
        )}

        {/* Step 9: Generating - Progress with rotating tips */}
        {currentStep === STEPS.GENERATING && (
          <div className="csf-step csf-generating">
            <div className="csf-generating-animation">
              <div className="csf-generating-icon">
                <span className="csf-pen-icon">{LOADING_TIPS[loadingTipIndex].icon}</span>
              </div>
              <h2 className="csf-title">Creating Your Content</h2>
              <p className="csf-subtitle">
                Post {generationProgress.current} of {generationProgress.total}
              </p>
              <div className="csf-generation-progress">
                <div
                  className="csf-generation-progress-bar"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
              <p className="csf-generation-tip csf-tip-animated">
                {LOADING_TIPS[loadingTipIndex].text}
              </p>
            </div>
          </div>
        )}

        {/* Step 10: Complete - Review generated content */}
        {currentStep === STEPS.COMPLETE && (
          <div className="csf-step">
            <h2 className="csf-title">Your Week is Ready!</h2>
            <p className="csf-subtitle">{generatedContent.filter(c => !c.error).length} posts generated - review and save</p>

            {/* Show retry button if there are failed items */}
            {generatedContent.some(c => c.error) && (
              <div className="csf-retry-section">
                <p className="csf-retry-message">
                  {generatedContent.filter(c => c.error).length} post(s) failed to generate
                </p>
                <button
                  className="csf-retry-btn"
                  onClick={handleRetryFailed}
                  disabled={saving}
                >
                  {saving ? 'Retrying...' : 'Retry Failed'}
                </button>
              </div>
            )}

            <div className="csf-generated-list">
              {generatedContent.map((item, idx) => (
                <div key={idx} className={`csf-generated-item ${item.error ? 'error' : ''}`}>
                  <div className="csf-generated-header">
                    <span className="csf-generated-day">{item.day}</span>
                    <span className="csf-generated-type">
                      {BATCH_CONTENT_TEMPLATES.find(t => t.id === item.contentType)?.icon}{' '}
                      {BATCH_CONTENT_TEMPLATES.find(t => t.id === item.contentType)?.name}
                    </span>
                  </div>
                  <div className="csf-generated-content">
                    {item.content.slice(0, 200)}{item.content.length > 200 ? '...' : ''}
                  </div>
                  {item.error && (
                    <span className="csf-generated-error">Failed to generate</span>
                  )}
                </div>
              ))}
            </div>

            <p className="csf-note">
              Content will be saved to your queue for review. You can edit each post before publishing.
            </p>
          </div>
        )}

        {/* Navigation */}
        {currentStep <= STEPS.SUMMARY && (
          <div className="csf-nav">
            <button className="csf-nav-back" onClick={handleBack}>
              ← Back
            </button>

            {currentStep < STEPS.SUMMARY ? (
              <button
                className="csf-nav-next"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue →
              </button>
            ) : (
              <button
                className="csf-nav-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Generate Content →'}
              </button>
            )}
          </div>
        )}

        {/* Navigation for Generate step */}
        {currentStep === STEPS.GENERATE && (
          <div className="csf-nav">
            <button className="csf-nav-skip" onClick={handleSkipGeneration}>
              Skip for now
            </button>
            <button
              className="csf-nav-generate"
              onClick={handleGenerate}
            >
              Generate {selectedDays.length} Posts
            </button>
          </div>
        )}

        {/* Navigation for Complete step */}
        {currentStep === STEPS.COMPLETE && (
          <div className="csf-nav">
            <button
              className="csf-nav-save"
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? 'Saving...' : `Save ${generatedContent.filter(c => !c.error).length} Posts & Continue`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
