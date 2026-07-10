/**
 * ContentGenerator.jsx
 * AI-powered content generation component
 * Uses context from persona, validation, offer, and performance data
 * Integrates Voice Profile for authentic, personalized content
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { gatherContentContext, getContextCompleteness, buildContextString } from '../../lib/contentContext'
import { fetchVoiceProfile, buildVoiceInstructions, getVoiceProfileSummary, getVoiceFeedbackInsights, buildEnhancedVoiceInstructions } from '../../lib/voiceProfile'
import './ContentGenerator.css'

const CONTENT_TYPES = [
  { id: 'story_arc', name: 'Story Arc (Reel Script)', icon: '🎬', desc: '8-stage story framework' },
  { id: 'transformation_story', name: 'Transformation Story', icon: '🦋', desc: 'Before/after narrative' },
  { id: 'educational', name: 'Educational Post', icon: '📚', desc: 'Teach something valuable' },
  { id: 'pain_agitation', name: 'Pain Agitation', icon: '🎯', desc: 'Surface the problem' },
  { id: 'social_proof', name: 'Social Proof', icon: '⭐', desc: 'Showcase wins' },
  { id: 'offer_teaser', name: 'Offer Teaser', icon: '🎁', desc: 'Create curiosity' }
]

const STORY_ARC_TEMPLATE = `Write a reel script using this story arc structure. Fill in each stage that applies (skip stages that don't fit your story):

## Normal (the before)
[What was the old, stuck, or "before" version of you/the viewer?]

## Desire + Challenge
[What did you want deep down? What was blocking it?]

## Enter the Unfamiliar
[What scary decision did you make? Name the fear and the risk.]

## Adapt Through Adversity
[The messy, hard middle. What went wrong? How were you exposed?]

## Attaining Desire + The Price
[You got what you wanted, but it cost something real. What did you give up?]

## Return Changed
[Back in the same place/situation, but now different. How?]

## New Normal
[Who are you now? State it simply.]

## Turn to Viewer (optional)
[A reminder, question, or invitation to the audience.]`

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', limit: 2200, optimal: 150 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', limit: 3000, optimal: 1300 },
  { id: 'twitter', name: 'X/Twitter', icon: '🐦', limit: 280, optimal: 240 },
  { id: 'email', name: 'Email', icon: '📧', limit: null, optimal: 500 },
  { id: 'facebook', name: 'Facebook', icon: '👥', limit: 63206, optimal: 400 }
]

const REFINEMENTS = [
  { id: 'shorter', label: 'Make Shorter', icon: '✂️' },
  { id: 'longer', label: 'Add More Detail', icon: '📝' },
  { id: 'professional', label: 'More Professional', icon: '👔' },
  { id: 'casual', label: 'More Casual', icon: '😊' },
  { id: 'urgency', label: 'Add Urgency', icon: '⚡' },
  { id: 'storytelling', label: 'More Storytelling', icon: '📖' }
]

const TONES = [
  { id: 'authentic', label: 'Authentic & Real', desc: 'Genuine, relatable, down-to-earth', icon: '💯' },
  { id: 'bold', label: 'Bold & Confident', desc: 'Direct, assertive, unapologetic', icon: '🔥' },
  { id: 'warm', label: 'Warm & Supportive', desc: 'Encouraging, empathetic, nurturing', icon: '💛' },
  { id: 'witty', label: 'Witty & Playful', desc: 'Humorous, clever, engaging', icon: '😏' },
  { id: 'inspirational', label: 'Inspirational', desc: 'Motivating, uplifting, visionary', icon: '✨' },
  { id: 'educational', label: 'Expert & Educational', desc: 'Authoritative, informative, clear', icon: '🎓' }
]

// A/B Test voice variations
const AB_VARIATIONS = [
  { id: 'A', label: 'Version A', tweak: 'Make it slightly more conversational and personal' },
  { id: 'B', label: 'Version B', tweak: 'Make it slightly more punchy and direct' }
]

// Voice refinement feedback options
const VOICE_FEEDBACK_OPTIONS = [
  { id: 'too_formal', label: 'Too formal/stiff', icon: '👔' },
  { id: 'too_casual', label: 'Too casual', icon: '😎' },
  { id: 'wrong_tone', label: 'Wrong tone/energy', icon: '🎭' },
  { id: 'not_my_words', label: 'Not my words/phrases', icon: '💬' },
  { id: 'too_generic', label: 'Too generic/bland', icon: '📄' },
  { id: 'missing_personality', label: 'Missing my personality', icon: '✨' },
  { id: 'wrong_structure', label: 'Wrong sentence structure', icon: '📝' },
  { id: 'other', label: 'Other (explain below)', icon: '❓' }
]

// Quick presets for fast generation
const QUICK_PRESETS = [
  { id: 'best_performer', label: 'Like my best post', icon: '🏆', instruction: 'Analyze the user\'s best-performing content patterns and create something similar in style and structure' },
  { id: 'viral_hook', label: 'Viral-style hook', icon: '🔥', instruction: 'Start with an attention-grabbing, scroll-stopping hook that creates curiosity or controversy' },
  { id: 'story_driven', label: 'Story-driven', icon: '📖', instruction: 'Structure as a compelling narrative with a clear beginning, tension, and resolution' },
  { id: 'quick_value', label: 'Quick value bomb', icon: '💣', instruction: 'Deliver one powerful, immediately actionable insight in a concise format' }
]

// CTA Library - proven call-to-actions
const CTA_LIBRARY = [
  { id: 'save', text: 'Save this for later 📌', category: 'engagement' },
  { id: 'share', text: 'Share with someone who needs this', category: 'engagement' },
  { id: 'comment', text: 'Drop a 🔥 if this resonates', category: 'engagement' },
  { id: 'question', text: 'What\'s your take? 👇', category: 'engagement' },
  { id: 'agree', text: 'Agree or disagree?', category: 'engagement' },
  { id: 'dm_value', text: 'DM me "VALUE" for the full guide', category: 'lead_gen' },
  { id: 'link_bio', text: 'Link in bio for more', category: 'lead_gen' },
  { id: 'free_resource', text: 'Want the free template? Comment "YES"', category: 'lead_gen' },
  { id: 'follow', text: 'Follow for more insights like this', category: 'growth' },
  { id: 'turn_on', text: 'Turn on notifications 🔔', category: 'growth' }
]

export default function ContentGenerator({ userId, projectId, onContentGenerated, initialPlatform, initialType }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(false)
  const [context, setContext] = useState(null)
  const [completeness, setCompleteness] = useState(null)
  const [voiceProfile, setVoiceProfile] = useState(null)
  const [voiceSummary, setVoiceSummary] = useState(null)
  const [voiceFeedbackInsights, setVoiceFeedbackInsights] = useState(null)
  const [selectedType, setSelectedType] = useState(initialType || null)
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform || 'instagram')
  const [selectedTone, setSelectedTone] = useState('authentic')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [generatedContent, setGeneratedContent] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [refining, setRefining] = useState(false)

  // A/B Testing state
  const [abMode, setAbMode] = useState(false)
  const [abVersions, setAbVersions] = useState({ A: '', B: '' })
  const [abCopied, setAbCopied] = useState({ A: false, B: false })

  // Voice refinement feedback state
  const [showVoiceFeedback, setShowVoiceFeedback] = useState(false)
  const [voiceFeedbackSelections, setVoiceFeedbackSelections] = useState([])
  const [voiceFeedbackComment, setVoiceFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Content Intel patterns (for story_arc type)
  const [contentIntelTip, setContentIntelTip] = useState(null)

  // Quick presets & CTA state
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [showCtaLibrary, setShowCtaLibrary] = useState(false)
  const [hookVariants, setHookVariants] = useState([])
  const [generatingHooks, setGeneratingHooks] = useState(false)
  const [showHookPicker, setShowHookPicker] = useState(false)

  // Get current platform details
  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform)
  const charCount = abMode ? 0 : editedContent.length
  const isOverLimit = currentPlatform?.limit && charCount > currentPlatform.limit
  const isNearOptimal = currentPlatform?.optimal && charCount <= currentPlatform.optimal

  // Clear Content Intel tip when userId changes
  useEffect(() => { setContentIntelTip(null) }, [userId])

  // Pre-fill story arc template + fetch Content Intel patterns when story_arc selected
  useEffect(() => {
    if (selectedType === 'story_arc') {
      if (!additionalInstructions || additionalInstructions === '') {
        setAdditionalInstructions(STORY_ARC_TEMPLATE)
      }
      // Fetch Content Intel patterns
      if (userId && !contentIntelTip) {
        supabase
          .from('instagram_posts')
          .select('views, saves, ai_analysis')
          .eq('user_id', userId)
          .not('ai_analysis', 'is', null)
          .order('posted_at', { ascending: false })
          .limit(30)
          .then(({ data }) => {
            if (!data || data.length < 3) return
            const hookGroups = {}
            const openingGroups = {}
            for (const r of data) {
              const a = r.ai_analysis
              if (!a) continue
              const ht = a.hook_type
              if (ht) {
                if (!hookGroups[ht]) hookGroups[ht] = { views: 0, count: 0 }
                hookGroups[ht].views += r.views || 0
                hookGroups[ht].count++
              }
              const ol = a.opening_line_type
              if (ol && ol !== 'none') {
                if (!openingGroups[ol]) openingGroups[ol] = { saves: 0, count: 0 }
                openingGroups[ol].saves += r.saves || 0
                openingGroups[ol].count++
              }
            }
            let bestHook = null, bestHookAvg = 0
            for (const [type, d] of Object.entries(hookGroups)) {
              if (d.count < 2) continue
              const avg = d.views / d.count
              if (avg > bestHookAvg) { bestHook = type; bestHookAvg = avg }
            }
            let bestOpening = null, bestOpeningSaves = 0
            for (const [type, d] of Object.entries(openingGroups)) {
              if (d.count < 2) continue
              const avg = d.saves / d.count
              if (avg > bestOpeningSaves) { bestOpening = type; bestOpeningSaves = avg }
            }
            if (bestHook || bestOpening) {
              const tips = []
              if (bestHook) tips.push(`${bestHook.replace(/_/g, ' ')} hooks get the most views`)
              if (bestOpening) tips.push(`${bestOpening.replace(/_/g, ' ')} openings get the most saves`)
              setContentIntelTip(tips.join('. ') + '.')
            }
          })
          .catch(() => {}) // Content Intel is optional, don't block on failure
      }
    }
  }, [selectedType, userId])

  // Load context when modal opens
  useEffect(() => {
    if (isOpen && userId && !context) {
      loadContext()
    }
  }, [isOpen, userId])

  async function loadContext() {
    setContextLoading(true)
    try {
      // Load content context and voice profile in parallel
      const [ctx, voiceResult, feedbackInsights] = await Promise.all([
        gatherContentContext(userId, projectId),
        fetchVoiceProfile(userId),
        getVoiceFeedbackInsights(userId)
      ])

      setContext(ctx)
      setCompleteness(getContextCompleteness(ctx))

      // Set voice profile if exists
      if (voiceResult.data) {
        setVoiceProfile(voiceResult.data)
        setVoiceSummary(getVoiceProfileSummary(voiceResult.data))
      }

      // Set voice feedback insights for improved generation
      if (feedbackInsights) {
        setVoiceFeedbackInsights(feedbackInsights)
      }
    } catch (err) {
      console.error('Error loading context:', err)
      setError('Failed to load your data. Content may be less personalized.')
    } finally {
      setContextLoading(false)
    }
  }

  async function handleGenerate(refinement = null) {
    if (!selectedType) {
      setError('Please select a content type')
      return
    }

    if (refinement) {
      setRefining(true)
    } else {
      setLoading(true)
      setGeneratedContent(null)
    }
    setError(null)

    try {
      // Build instructions including refinement, tone, preset, and voice profile
      const toneInfo = TONES.find(t => t.id === selectedTone)
      let instructions = additionalInstructions

      // Add tone instruction (only if no voice profile - voice profile overrides tone)
      const toneInstruction = !voiceProfile && toneInfo
        ? `Write in a ${toneInfo.label.toLowerCase()} tone - ${toneInfo.desc.toLowerCase()}.`
        : ''

      // Build voice instructions if profile exists (includes feedback learning)
      const voiceInstructions = voiceProfile
        ? buildEnhancedVoiceInstructions(voiceProfile, voiceFeedbackInsights)
        : ''

      // Add preset instruction if selected
      const presetInstruction = selectedPreset
        ? `\nSTYLE PRESET: ${QUICK_PRESETS.find(p => p.id === selectedPreset)?.instruction || ''}`
        : ''

      if (refinement && editedContent) {
        const refinementMap = {
          shorter: 'Make this content significantly shorter and more concise while keeping the key message.',
          longer: 'Expand this content with more detail, examples, and depth.',
          professional: 'Rewrite this in a more professional, business-appropriate tone.',
          casual: 'Rewrite this in a more casual, friendly, conversational tone.',
          urgency: 'Add more urgency and FOMO (fear of missing out) to encourage immediate action.',
          storytelling: 'Reframe this with more storytelling elements - setup, conflict, resolution.'
        }
        instructions = `${voiceInstructions}\n${toneInstruction}\n${refinementMap[refinement]}\n\nOriginal content to refine:\n${editedContent}`
      } else {
        const intelContext = (selectedType === 'story_arc' && contentIntelTip)
          ? `\nCONTENT INTEL (from your best-performing reels): ${contentIntelTip} Use these patterns.`
          : ''
        instructions = `${voiceInstructions}\n${toneInstruction}${presetInstruction}${intelContext}\n${additionalInstructions}`.trim()
      }

      const response = await supabase.functions.invoke('content-generator', {
        body: {
          action: 'generate',
          contentType: selectedType,
          platform: selectedPlatform,
          context: context || {},
          additionalInstructions: instructions,
          tone: selectedTone,
          voiceProfile: voiceProfile || null
        }
      })

      if (response.error) throw response.error

      setGeneratedContent(response.data)
      setEditedContent(response.data.content || '')
    } catch (err) {
      console.error('Error generating content:', err)
      setError('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
      setRefining(false)
    }
  }

  // Generate 3 hook variants
  async function handleGenerateHooks() {
    if (!selectedType) {
      setError('Please select a content type first')
      return
    }

    setGeneratingHooks(true)
    setHookVariants([])
    setError(null)

    try {
      const voiceInstructions = voiceProfile
        ? buildEnhancedVoiceInstructions(voiceProfile, voiceFeedbackInsights)
        : ''

      const response = await supabase.functions.invoke('content-generator', {
        body: {
          action: 'generate',
          contentType: selectedType,
          platform: selectedPlatform,
          context: context || {},
          useHaiku: true, // Cost optimization: use cheaper model for simple hook generation
          additionalInstructions: `${voiceInstructions}

SPECIAL INSTRUCTION: Generate exactly 3 different opening hooks/first lines for this content.
Each hook should be completely different in style:
1. A question-based hook that creates curiosity
2. A bold/contrarian statement that challenges beliefs
3. A story-based hook that draws readers in

Format your response as:
HOOK 1: [question hook]
---
HOOK 2: [bold statement hook]
---
HOOK 3: [story hook]

Only provide the hooks, nothing else.`,
          voiceProfile: voiceProfile || null
        }
      })

      if (response.error) throw response.error

      // Parse the 3 hooks from response
      const content = response.data.content || ''
      const hooks = content.split('---').map(h => {
        return h.replace(/HOOK \d:/i, '').trim()
      }).filter(h => h.length > 0)

      setHookVariants(hooks.slice(0, 3))
      setShowHookPicker(true)
    } catch (err) {
      console.error('Error generating hooks:', err)
      setError('Failed to generate hooks. Please try again.')
    } finally {
      setGeneratingHooks(false)
    }
  }

  // Select a hook and use it as the start of the content
  function selectHook(hook) {
    setAdditionalInstructions(prev =>
      `Start the content with this exact hook: "${hook}"\n${prev}`.trim()
    )
    setShowHookPicker(false)
    setHookVariants([])
  }

  // Insert CTA into content
  function insertCta(ctaText) {
    if (editedContent) {
      setEditedContent(prev => `${prev}\n\n${ctaText}`)
    }
    setShowCtaLibrary(false)
  }

  // Generate A/B versions
  async function handleGenerateAB() {
    if (!selectedType) {
      setError('Please select a content type')
      return
    }

    setLoading(true)
    setError(null)
    setAbVersions({ A: '', B: '' })

    try {
      const toneInfo = TONES.find(t => t.id === selectedTone)
      const toneInstruction = !voiceProfile && toneInfo
        ? `Write in a ${toneInfo.label.toLowerCase()} tone - ${toneInfo.desc.toLowerCase()}.`
        : ''
      const voiceInstructions = voiceProfile
        ? buildEnhancedVoiceInstructions(voiceProfile, voiceFeedbackInsights)
        : ''

      // Generate both versions in parallel
      const [responseA, responseB] = await Promise.all(
        AB_VARIATIONS.map(variation =>
          supabase.functions.invoke('content-generator', {
            body: {
              action: 'generate',
              contentType: selectedType,
              platform: selectedPlatform,
              context: context || {},
              additionalInstructions: `${voiceInstructions}\n${toneInstruction}\n${variation.tweak}\n${additionalInstructions}`.trim(),
              tone: selectedTone,
              voiceProfile: voiceProfile || null
            }
          })
        )
      )

      if (responseA.error) throw responseA.error
      if (responseB.error) throw responseB.error

      setAbVersions({
        A: responseA.data?.content || '',
        B: responseB.data?.content || ''
      })
      setGeneratedContent({ abMode: true, contentType: selectedType })
    } catch (err) {
      console.error('Error generating A/B content:', err)
      setError('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (editedContent) {
      await navigator.clipboard.writeText(editedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCopyAB(version) {
    const content = abVersions[version]
    if (content) {
      await navigator.clipboard.writeText(content)
      setAbCopied(prev => ({ ...prev, [version]: true }))
      setTimeout(() => setAbCopied(prev => ({ ...prev, [version]: false })), 2000)
    }
  }

  function handleUpdateABVersion(version, value) {
    setAbVersions(prev => ({ ...prev, [version]: value }))
  }

  function handleUseContent() {
    if (onContentGenerated && generatedContent) {
      onContentGenerated({ ...generatedContent, content: editedContent })
      setIsOpen(false)
    }
  }

  function handleUseABContent(version) {
    if (onContentGenerated && abVersions[version]) {
      onContentGenerated({
        content: abVersions[version],
        contentType: selectedType,
        platform: selectedPlatform,
        version
      })
      setIsOpen(false)
    }
  }

  function handleRegenerate() {
    if (abMode) {
      handleGenerateAB()
    } else {
      handleGenerate()
    }
  }

  function handleRefine(refinementId) {
    handleGenerate(refinementId)
  }

  // Voice feedback handlers
  function toggleVoiceFeedbackOption(optionId) {
    setVoiceFeedbackSelections(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  async function handleSubmitVoiceFeedback() {
    if (voiceFeedbackSelections.length === 0 && !voiceFeedbackComment.trim()) {
      return
    }

    setSubmittingFeedback(true)

    try {
      // Save feedback to database for future voice improvements
      const feedbackData = {
        user_id: userId,
        content_type: selectedType,
        platform: selectedPlatform,
        generated_content: editedContent,
        feedback_options: voiceFeedbackSelections,
        feedback_comment: voiceFeedbackComment.trim(),
        voice_profile_id: voiceProfile?.id || null,
        created_at: new Date().toISOString()
      }

      const { error: saveError } = await supabase
        .from('voice_feedback')
        .insert([feedbackData])

      if (saveError) {
        console.error('Error saving voice feedback:', saveError)
      }

      // Build refinement instructions based on feedback
      const feedbackLabels = voiceFeedbackSelections
        .map(id => VOICE_FEEDBACK_OPTIONS.find(o => o.id === id)?.label)
        .filter(Boolean)

      let refinementPrompt = `The user says this content doesn't sound like them. Issues identified:\n`
      refinementPrompt += feedbackLabels.map(l => `- ${l}`).join('\n')

      if (voiceFeedbackComment.trim()) {
        refinementPrompt += `\n\nAdditional feedback: "${voiceFeedbackComment.trim()}"`
      }

      refinementPrompt += `\n\nPlease regenerate the content addressing these issues while maintaining the original message.`

      // Close feedback modal and regenerate with feedback
      setShowVoiceFeedback(false)
      setVoiceFeedbackSelections([])
      setVoiceFeedbackComment('')

      // Use the feedback to refine
      setRefining(true)
      setError(null)

      const voiceInstructions = voiceProfile
        ? buildEnhancedVoiceInstructions(voiceProfile, voiceFeedbackInsights)
        : ''

      const response = await supabase.functions.invoke('content-generator', {
        body: {
          action: 'generate',
          contentType: selectedType,
          platform: selectedPlatform,
          context: context || {},
          additionalInstructions: `${voiceInstructions}\n\n${refinementPrompt}\n\nOriginal content to refine:\n${editedContent}`,
          tone: selectedTone,
          voiceProfile: voiceProfile || null
        }
      })

      if (response.error) throw response.error

      setGeneratedContent(response.data)
      setEditedContent(response.data.content || '')

    } catch (err) {
      console.error('Error processing voice feedback:', err)
      setError('Failed to apply feedback. Please try again.')
    } finally {
      setSubmittingFeedback(false)
      setRefining(false)
    }
  }

  function resetAndClose() {
    setSelectedType(initialType || null)
    setGeneratedContent(null)
    setEditedContent('')
    setAdditionalInstructions('')
    setAbMode(false)
    setAbVersions({ A: '', B: '' })
    setError(null)
    setIsOpen(false)
  }

  return (
    <>
      <button
        className="content-generator-trigger"
        onClick={() => setIsOpen(true)}
        title="AI Content Generator"
      >
        <span className="trigger-icon">✨</span>
        <span className="trigger-text">AI Generate</span>
      </button>

      {isOpen && (
        <>
        <div className="content-generator-overlay" onClick={resetAndClose}>
          <div className="content-generator-modal" onClick={e => e.stopPropagation()}>
            <div className="cg-header">
              <h2>AI Content Generator</h2>
              <button className="cg-close" onClick={resetAndClose}>×</button>
            </div>

            {/* Context Status */}
            {contextLoading ? (
              <div className="cg-context-loading">
                <div className="cg-spinner"></div>
                <span>Loading your profile data...</span>
              </div>
            ) : completeness && (
              <div className="cg-context-status">
                <div className="context-meter">
                  <div
                    className="context-fill"
                    style={{ width: `${completeness.percentage}%` }}
                  ></div>
                </div>
                <div className="context-info">
                  <span className="context-percentage">{completeness.percentage}% personalized</span>
                  {!completeness.isReady && (
                    <span className="context-warning">Add more data for better results</span>
                  )}
                </div>
                <div className="context-sources">
                  {completeness.items.map(item => (
                    <span
                      key={item.key}
                      className={`source-chip ${item.complete ? 'complete' : 'missing'}`}
                      title={item.complete ? 'Data loaded' : `Add ${item.label}`}
                    >
                      {item.complete ? '✓' : '○'} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Profile Status */}
            {!contextLoading && (
              <div className={`cg-voice-status ${voiceProfile ? 'has-voice' : 'no-voice'}`}>
                {voiceProfile ? (
                  <>
                    <div className="cg-voice-indicator">
                      <span className="cg-voice-icon">🎙️</span>
                      <div className="cg-voice-info">
                        <span className="cg-voice-name">{voiceSummary?.name || 'Custom Voice'}</span>
                        <span className="cg-voice-desc">{voiceSummary?.summary?.slice(0, 60)}...</span>
                      </div>
                    </div>
                    <button
                      className="cg-voice-edit-btn"
                      onClick={() => navigate('/voice-training')}
                      title="Update voice profile"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <div className="cg-voice-indicator">
                      <span className="cg-voice-icon" style={{ opacity: 0.5 }}>🎙️</span>
                      <div className="cg-voice-info">
                        <span className="cg-voice-name">No Voice Profile</span>
                        <span className="cg-voice-desc">Content will use generic tone</span>
                      </div>
                    </div>
                    <button
                      className="cg-voice-setup-btn"
                      onClick={() => navigate('/voice-training')}
                    >
                      Setup Voice
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Content Type Selection */}
            {!generatedContent && (
              <>
                <div className="cg-section">
                  <h3>What type of content?</h3>
                  <div className="cg-type-grid">
                    {CONTENT_TYPES.map(type => (
                      <button
                        key={type.id}
                        className={`cg-type-btn ${selectedType === type.id ? 'selected' : ''}`}
                        onClick={() => {
                          const wasStoryArc = selectedType === 'story_arc'
                          setSelectedType(type.id)
                          if (wasStoryArc && type.id !== 'story_arc') {
                            setAdditionalInstructions('')
                          }
                        }}
                      >
                        <span className="type-icon">{type.icon}</span>
                        <span className="type-name">{type.name}</span>
                        <span className="type-desc">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cg-section">
                  <h3>Which platform?</h3>
                  <div className="cg-platform-grid">
                    {PLATFORMS.map(platform => (
                      <button
                        key={platform.id}
                        className={`cg-platform-btn ${selectedPlatform === platform.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPlatform(platform.id)}
                      >
                        <span className="platform-icon">{platform.icon}</span>
                        <span className="platform-name">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cg-section">
                  <h3>
                    What&apos;s your tone?
                    {voiceProfile && (
                      <span className="tone-override-note">Using your voice profile</span>
                    )}
                  </h3>
                  {voiceProfile ? (
                    <div className="cg-voice-active">
                      <div className="cg-voice-active-card">
                        <span className="cg-voice-active-icon">🎙️</span>
                        <div className="cg-voice-active-info">
                          <strong>{voiceSummary?.name || 'Your Voice'}</strong>
                          <span>Content will match your trained voice profile</span>
                        </div>
                      </div>
                      <button
                        className="cg-voice-use-tone-btn"
                        onClick={() => setVoiceProfile(null)}
                      >
                        Use tone selector instead
                      </button>
                    </div>
                  ) : (
                    <div className="cg-tone-grid">
                      {TONES.map(tone => (
                        <button
                          key={tone.id}
                          className={`cg-tone-btn ${selectedTone === tone.id ? 'selected' : ''}`}
                          onClick={() => setSelectedTone(tone.id)}
                        >
                          <span className="tone-icon">{tone.icon}</span>
                          <span className="tone-label">{tone.label}</span>
                          <span className="tone-desc">{tone.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="cg-section">
                  <h3>Quick presets <span className="optional">(optional)</span></h3>
                  <div className="cg-presets-grid">
                    {QUICK_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        className={`cg-preset-btn ${selectedPreset === preset.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
                      >
                        <span className="cg-preset-icon">{preset.icon}</span>
                        <span className="cg-preset-label">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cg-section">
                  <h3>{selectedType === 'story_arc' ? 'Your story' : 'Any specific angle?'} <span className="optional">{selectedType === 'story_arc' ? '(fill in each stage)' : '(optional)'}</span></h3>
                  <textarea
                    className="cg-instructions"
                    placeholder={selectedType === 'story_arc'
                      ? 'Fill in the story stages above with your specific story beats...'
                      : 'e.g., Focus on the time-saving aspect, mention my coaching program, target new moms...'}
                    value={additionalInstructions}
                    onChange={e => setAdditionalInstructions(e.target.value)}
                    rows={selectedType === 'story_arc' ? 12 : 2}
                  />
                  {/* Content Intel tip for story arc */}
                  {selectedType === 'story_arc' && contentIntelTip && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: 'rgba(94,23,235,0.08)', border: '1px solid rgba(94,23,235,0.12)',
                      borderRadius: 8, fontSize: 11, lineHeight: 1.5,
                    }}>
                      <span style={{ color: '#E9A23B', fontWeight: 600 }}>From your best reels: </span>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{contentIntelTip}</span>
                    </div>
                  )}
                  <div className="cg-hook-generator">
                    <button
                      className="cg-generate-hooks-btn"
                      onClick={handleGenerateHooks}
                      disabled={generatingHooks || !selectedType}
                    >
                      {generatingHooks ? '⏳ Generating...' : '🪝 Generate 3 Hook Ideas'}
                    </button>
                  </div>
                </div>

                {/* Hook Picker Modal */}
                {showHookPicker && hookVariants.length > 0 && (
                  <div className="cg-hook-picker">
                    <h4>Choose a hook to start with:</h4>
                    <div className="cg-hooks-list">
                      {hookVariants.map((hook, i) => (
                        <button
                          key={i}
                          className="cg-hook-option"
                          onClick={() => selectHook(hook)}
                        >
                          <span className="cg-hook-number">{i + 1}</span>
                          <span className="cg-hook-text">{hook}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      className="cg-hook-cancel"
                      onClick={() => {
                        setShowHookPicker(false)
                        setHookVariants([])
                      }}
                    >
                      Skip
                    </button>
                  </div>
                )}

                {error && <div className="cg-error">{error}</div>}

                {/* A/B Testing Toggle */}
                <div className="cg-ab-toggle">
                  <label className="cg-ab-switch">
                    <input
                      type="checkbox"
                      checked={abMode}
                      onChange={e => setAbMode(e.target.checked)}
                    />
                    <span className="cg-ab-slider"></span>
                  </label>
                  <div className="cg-ab-label">
                    <strong>A/B Test Mode</strong>
                    <span>Generate 2 versions to compare</span>
                  </div>
                </div>

                <div className="cg-actions">
                  <button
                    className="cg-generate-btn"
                    onClick={abMode ? handleGenerateAB : handleGenerate}
                    disabled={loading || !selectedType}
                  >
                    {loading ? (
                      <>
                        <span className="cg-spinner small"></span>
                        {abMode ? 'Generating 2 versions...' : 'Generating...'}
                      </>
                    ) : (
                      <>{abMode ? '✨ Generate A/B Versions' : '✨ Generate Content'}</>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Generated Content Display */}
            {generatedContent && !generatedContent.abMode && (
              <div className="cg-result">
                <div className="cg-result-header">
                  <span className="result-type">
                    {CONTENT_TYPES.find(t => t.id === generatedContent.contentType)?.icon}
                    {CONTENT_TYPES.find(t => t.id === generatedContent.contentType)?.name}
                  </span>
                  <span className="result-platform">
                    {currentPlatform?.icon}
                    {currentPlatform?.name}
                  </span>
                </div>

                <div className="cg-content-box">
                  <textarea
                    className="cg-content-editable"
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    placeholder="Generated content will appear here..."
                  />
                  <div className={`cg-char-counter ${isOverLimit ? 'over-limit' : isNearOptimal ? 'optimal' : ''}`}>
                    <span className="char-count">{charCount.toLocaleString()}</span>
                    {currentPlatform?.limit && (
                      <span className="char-limit">/ {currentPlatform.limit.toLocaleString()}</span>
                    )}
                    {isOverLimit && <span className="limit-warning">Over limit!</span>}
                    {isNearOptimal && <span className="optimal-badge">Optimal length</span>}
                  </div>
                </div>

                {/* Refinement Options */}
                <div className="cg-refinements">
                  <span className="refinement-label">Refine:</span>
                  <div className="refinement-buttons">
                    {REFINEMENTS.map(ref => (
                      <button
                        key={ref.id}
                        className="refinement-btn"
                        onClick={() => handleRefine(ref.id)}
                        disabled={refining || loading}
                        title={ref.label}
                      >
                        <span className="refinement-icon">{ref.icon}</span>
                        <span className="refinement-name">{ref.label}</span>
                      </button>
                    ))}
                  </div>
                  {refining && <span className="refining-indicator">Refining...</span>}
                  {voiceProfile && (
                    <button
                      className="cg-voice-feedback-btn"
                      onClick={() => setShowVoiceFeedback(true)}
                      disabled={refining || loading}
                    >
                      🎙️ Doesn&apos;t sound like me
                    </button>
                  )}
                </div>

                {/* Voice Feedback Modal */}
                {showVoiceFeedback && (
                  <div className="cg-voice-feedback-modal">
                    <div className="cg-voice-feedback-content">
                      <div className="cg-vf-header">
                        <h3>🎙️ What doesn&apos;t sound like you?</h3>
                        <button
                          className="cg-vf-close"
                          onClick={() => {
                            setShowVoiceFeedback(false)
                            setVoiceFeedbackSelections([])
                            setVoiceFeedbackComment('')
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <p className="cg-vf-hint">Select all that apply - this helps improve your voice profile</p>

                      <div className="cg-vf-options">
                        {VOICE_FEEDBACK_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            className={`cg-vf-option ${voiceFeedbackSelections.includes(option.id) ? 'selected' : ''}`}
                            onClick={() => toggleVoiceFeedbackOption(option.id)}
                          >
                            <span className="cg-vf-option-icon">{option.icon}</span>
                            <span className="cg-vf-option-label">{option.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="cg-vf-comment">
                        <label>Additional details (optional)</label>
                        <textarea
                          placeholder="Tell us how you'd say this differently..."
                          value={voiceFeedbackComment}
                          onChange={e => setVoiceFeedbackComment(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="cg-vf-actions">
                        <button
                          className="cg-vf-cancel"
                          onClick={() => {
                            setShowVoiceFeedback(false)
                            setVoiceFeedbackSelections([])
                            setVoiceFeedbackComment('')
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="cg-vf-submit"
                          onClick={handleSubmitVoiceFeedback}
                          disabled={submittingFeedback || (voiceFeedbackSelections.length === 0 && !voiceFeedbackComment.trim())}
                        >
                          {submittingFeedback ? (
                            <>
                              <span className="cg-spinner small"></span>
                              Refining...
                            </>
                          ) : 'Regenerate with Feedback'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="cg-context-used">
                  <span className="context-label">Context used:</span>
                  {(voiceProfile || generatedContent.contextUsed?.hasVoice) && <span className="used-chip voice-chip">🎙️ Voice</span>}
                  {generatedContent.contextUsed?.hasPersona && <span className="used-chip">FlowFinder</span>}
                  {generatedContent.contextUsed?.hasValidation && <span className="used-chip">Validation</span>}
                  {generatedContent.contextUsed?.hasOffer && (
                    <span className="used-chip">
                      Offer{generatedContent.contextUsed?.hasOfferV1 && generatedContent.contextUsed?.hasOfferV2 ? ' (V1+V2)' : ''}
                    </span>
                  )}
                  {generatedContent.contextUsed?.hasMarketing && <span className="used-chip">Performance</span>}
                  {generatedContent.contextUsed?.hasDeals && <span className="used-chip">Deals</span>}
                </div>

                {error && <div className="cg-error">{error}</div>}

                <div className="cg-result-actions">
                  <button className="cg-action-btn copy" onClick={handleCopy}>
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button
                    className="cg-action-btn cta-btn"
                    onClick={() => setShowCtaLibrary(true)}
                  >
                    📢 Add CTA
                  </button>
                  <button className="cg-action-btn regenerate" onClick={handleRegenerate} disabled={loading || refining}>
                    {loading ? 'Regenerating...' : '🔄 New Version'}
                  </button>
                  {onContentGenerated && (
                    <button className="cg-action-btn use" onClick={handleUseContent}>
                      ✅ Use This
                    </button>
                  )}
                  <button
                    className="cg-action-btn new"
                    onClick={() => { setGeneratedContent(null); setEditedContent(''); }}
                  >
                    ← Start Over
                  </button>
                </div>
              </div>
            )}

            {/* A/B Generated Content Display */}
            {generatedContent && generatedContent.abMode && (
              <div className="cg-result cg-ab-result">
                <div className="cg-result-header">
                  <span className="result-type">
                    {CONTENT_TYPES.find(t => t.id === selectedType)?.icon}
                    {CONTENT_TYPES.find(t => t.id === selectedType)?.name}
                  </span>
                  <span className="result-platform">
                    {currentPlatform?.icon}
                    {currentPlatform?.name}
                  </span>
                  <span className="cg-ab-badge">A/B Test</span>
                </div>

                <div className="cg-ab-grid">
                  {AB_VARIATIONS.map(variation => (
                    <div key={variation.id} className="cg-ab-version">
                      <div className="cg-ab-version-header">
                        <span className="cg-ab-version-label">{variation.label}</span>
                        <span className="cg-ab-version-desc">{variation.tweak}</span>
                      </div>
                      <textarea
                        className="cg-ab-textarea"
                        value={abVersions[variation.id]}
                        onChange={e => handleUpdateABVersion(variation.id, e.target.value)}
                        placeholder={`${variation.label} content...`}
                      />
                      <div className="cg-ab-version-footer">
                        <span className="cg-ab-char-count">
                          {abVersions[variation.id].length.toLocaleString()} chars
                        </span>
                        <div className="cg-ab-version-actions">
                          <button
                            className="cg-ab-action-btn"
                            onClick={() => handleCopyAB(variation.id)}
                          >
                            {abCopied[variation.id] ? '✓ Copied!' : '📋 Copy'}
                          </button>
                          {onContentGenerated && (
                            <button
                              className="cg-ab-action-btn use"
                              onClick={() => handleUseABContent(variation.id)}
                            >
                              ✅ Use
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cg-context-used">
                  <span className="context-label">Context used:</span>
                  {voiceProfile && <span className="used-chip voice-chip">🎙️ Voice</span>}
                  <span className="used-chip">A/B Variations</span>
                </div>

                {error && <div className="cg-error">{error}</div>}

                <div className="cg-result-actions">
                  <button className="cg-action-btn regenerate" onClick={handleRegenerate} disabled={loading}>
                    {loading ? 'Regenerating...' : '🔄 New Versions'}
                  </button>
                  <button
                    className="cg-action-btn new"
                    onClick={() => { setGeneratedContent(null); setAbVersions({ A: '', B: '' }); setAbMode(false); }}
                  >
                    ← Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Library Modal */}
        {showCtaLibrary && (
          <div className="cg-cta-overlay" onClick={() => setShowCtaLibrary(false)}>
            <div className="cg-cta-modal" onClick={e => e.stopPropagation()}>
              <div className="cg-cta-header">
                <h3>📢 CTA Library</h3>
                <button className="cg-cta-close" onClick={() => setShowCtaLibrary(false)}>×</button>
              </div>
              <p className="cg-cta-subtitle">Click to add a proven call-to-action to your content</p>

              <div className="cg-cta-section">
                <h4>🔥 Engagement</h4>
                <div className="cg-cta-list">
                  {CTA_LIBRARY.filter(c => c.category === 'engagement').map(cta => (
                    <button
                      key={cta.id}
                      className="cg-cta-option"
                      onClick={() => {
                        insertCta(cta.text)
                        setShowCtaLibrary(false)
                      }}
                    >
                      {cta.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cg-cta-section">
                <h4>🎯 Lead Generation</h4>
                <div className="cg-cta-list">
                  {CTA_LIBRARY.filter(c => c.category === 'lead_gen').map(cta => (
                    <button
                      key={cta.id}
                      className="cg-cta-option"
                      onClick={() => {
                        insertCta(cta.text)
                        setShowCtaLibrary(false)
                      }}
                    >
                      {cta.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cg-cta-section">
                <h4>📈 Growth</h4>
                <div className="cg-cta-list">
                  {CTA_LIBRARY.filter(c => c.category === 'growth').map(cta => (
                    <button
                      key={cta.id}
                      className="cg-cta-option"
                      onClick={() => {
                        insertCta(cta.text)
                        setShowCtaLibrary(false)
                      }}
                    >
                      {cta.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </>
  )
}
