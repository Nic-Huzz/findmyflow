/**
 * useTemplateGenerator.js — Hook for generating template output
 *
 * Parallel fetches brain + experience + voice, then fires all item
 * generations in parallel via content-generator edge function.
 *
 * Usage:
 *   const { generate, generating, progress, results, error } = useTemplateGenerator(userId)
 *   await generate('event_page', experienceId)
 */

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getBrainContext } from '../lib/brain'
import { fetchVoiceProfile, buildEnhancedVoiceInstructions } from '../lib/voiceProfile'
import { getTemplate } from '../lib/experienceTemplates'

export default function useTemplateGenerator(userId) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const generate = useCallback(async (templateId, experienceId) => {
    if (!userId || generating) return
    setGenerating(true)
    setProgress('Loading context...')
    setResults(null)
    setError(null)

    try {
      const template = getTemplate(templateId)
      if (!template || template.items.length === 0) {
        throw new Error('Template not found or has no items')
      }

      // Parallel: brain context + experience + voice profile
      const [brainContext, expResult, voiceResult] = await Promise.all([
        getBrainContext(userId, ['identity', 'offer', 'voice', 'inner_game']),
        supabase.from('experiences').select('*').eq('id', experienceId).single(),
        fetchVoiceProfile(userId),
      ])

      if (expResult.error) throw new Error(expResult.error.message || 'Failed to load experience')
      const experience = expResult.data
      if (!experience) throw new Error('Experience not found')

      const voiceProfile = voiceResult.data || null
      const voiceInstructions = voiceProfile
        ? buildEnhancedVoiceInstructions(voiceProfile)
        : ''

      // Fire all items in parallel
      setProgress(`Generating 0 of ${template.items.length}...`)
      let completed = 0

      const itemResults = await Promise.all(
        template.items.map(async (item) => {
          try {
            const instructions = [
              voiceInstructions,
              brainContext ? `\nCREATOR BRAIN CONTEXT:\n${brainContext}` : '',
              item.buildInstructions(experience, brainContext || ''),
            ].filter(Boolean).join('\n\n')

            const { data, error: fnError } = await supabase.functions.invoke('content-generator', {
              body: {
                action: 'generate',
                contentType: item.contentType,
                platform: item.platform,
                context: {},
                additionalInstructions: instructions,
                voiceProfile,
              },
            })

            completed++
            setProgress(`Generating ${completed} of ${template.items.length}...`)

            if (fnError) throw fnError
            return { label: item.label, content: data?.content || '', platform: item.platform, error: null }
          } catch (err) {
            completed++
            setProgress(`Generating ${completed} of ${template.items.length}...`)
            return { label: item.label, content: '', platform: item.platform, error: err.message }
          }
        })
      )

      setResults(itemResults)
      setProgress('')
    } catch (err) {
      console.error('Template generation error:', err)
      setError(err.message || 'Generation failed')
      setProgress('')
    } finally {
      setGenerating(false)
    }
  }, [userId, generating])

  const clear = useCallback(() => {
    setResults(null)
    setError(null)
    setProgress('')
  }, [])

  return { generate, generating, progress, results, error, clear }
}
