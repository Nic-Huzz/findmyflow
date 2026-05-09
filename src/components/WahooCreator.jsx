/**
 * WahooCreator.jsx
 *
 * Two-path Wahoo creation flow for the Play-list tab.
 * Path A: "I know what I want to try" → free text → AI generates challenge
 * Path B: "Help me find one" → browse play-skill categories → AI suggests 2-3 options
 *
 * Both paths save via createGroanChallenge + acceptGroanChallenge (same data model).
 * Replaces MobilePlaylistPicker.
 *
 * CSS prefix: wc-
 * Created: 2026-05-09
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { SKILLS_SEGMENTS, findSkillSegment } from '../lib/wheelTaxonomy'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './WahooCreator.css'

export default function WahooCreator({
  userId,
  categories = [], // user's play-skill category ids (from nikigai_clusters)
  currentVisibilityLayer = 'screen', // from current level config
  onWahooAccepted,
  onClose,
}) {
  const [step, setStep] = useState('choose') // choose | freetext | browse | generating | preview | suggestions | success
  const [freeText, setFreeText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatedChallenge, setGeneratedChallenge] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState(null)
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  // All play-skill categories (user's selected + custom)
  const userCategories = categories.map(catId => {
    const seg = findSkillSegment(catId)
    return seg
      ? { id: seg.id, name: seg.displayName, icon: seg.icon, isCustom: false }
      : { id: catId, name: catId, icon: '✨', isCustom: true }
  })

  // ─── AI Generation ──────────────────────────────────────────────────────────

  async function generateFromFreeText() {
    if (!freeText.trim() || generating) return
    setGenerating(true)
    setError(null)
    setStep('generating')

    try {
      const { data, error: fnError } = await supabase.functions.invoke('groan-challenge-generator', {
        body: {
          sourceType: 'skill',
          sourceLabel: freeText.trim(),
          sourceInsight: `User-described Wahoo: "${freeText.trim()}"`,
          visibilityLayer: currentVisibilityLayer,
        },
      })

      if (fnError) throw fnError

      setGeneratedChallenge({
        title: data.title,
        description: data.description,
        completionCriteria: data.completionCriteria,
        whyThisMatters: data.whyThisMatters,
        alternativeVersion: data.alternativeVersion,
        scaryScore: data.scaryScore,
        wahooScore: data.wahooScore,
        sourceLabel: freeText.trim(),
        visibilityLayer: currentVisibilityLayer,
      })
      setStep('preview')
    } catch (err) {
      console.error('Wahoo generation error:', err)
      setError('Failed to generate your Wahoo. Try again.')
      setStep('freetext')
    } finally {
      setGenerating(false)
    }
  }

  async function generateSuggestions(categoryId) {
    if (generating) return
    setGenerating(true)
    setError(null)
    setSelectedCategory(categoryId)
    setStep('generating')

    const seg = findSkillSegment(categoryId)
    const label = seg?.displayName || categoryId

    try {
      // Generate 3 suggestions in parallel
      const results = await Promise.all(
        [1, 2, 3].map((n) =>
          supabase.functions.invoke('groan-challenge-generator', {
            body: {
              sourceType: 'skill',
              sourceLabel: label,
              sourceInsight: `Generate suggestion ${n} of 3 for "${label}". Each suggestion must be completely different from the others. Suggestion ${n} should take a distinct angle.`,
              visibilityLayer: currentVisibilityLayer,
            },
          }).then(r => r.data).catch(() => null)
        )
      )

      const validSuggestions = results.filter(Boolean).map(data => ({
        title: data.title,
        description: data.description,
        completionCriteria: data.completionCriteria,
        whyThisMatters: data.whyThisMatters,
        alternativeVersion: data.alternativeVersion,
        scaryScore: data.scaryScore,
        wahooScore: data.wahooScore,
        sourceLabel: label,
        visibilityLayer: currentVisibilityLayer,
      }))

      if (validSuggestions.length === 0) {
        throw new Error('No suggestions generated')
      }

      setSuggestions(validSuggestions)
      setStep('suggestions')
    } catch (err) {
      console.error('Suggestion generation error:', err)
      setError('Failed to generate suggestions. Try again.')
      setStep('browse')
    } finally {
      setGenerating(false)
    }
  }

  // ─── Accept Challenge ───────────────────────────────────────────────────────

  async function acceptChallenge(challenge) {
    setGenerating(true)
    setError(null)

    try {
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: challenge.title,
        description: challenge.description,
        visibilityLayer: challenge.visibilityLayer,
        sourceType: 'skill',
        sourceLabel: challenge.sourceLabel,
        scaryScore: challenge.scaryScore,
        wahooScore: challenge.wahooScore,
      })
      if (saveError || !dbRecord) throw saveError || new Error('Challenge was not saved')

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      // Add to weekly picks
      const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: dbRecord.id,
        display_name: challenge.title,
      })
      if (pickError) throw pickError

      hapticSuccess()
      onWahooAccepted?.()
      setStep('success')
      successTimerRef.current = setTimeout(() => onClose?.(), 1500)
    } catch (err) {
      console.error('Accept Wahoo error:', err)
      setError('Failed to save. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ─── Success ────────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="wc-container">
        <div className="wc-success">
          <div className="wc-success-icon">🔥</div>
          <p className="wc-success-text">Wahoo accepted!</p>
          <p className="wc-success-sub">Go make it happen.</p>
        </div>
      </div>
    )
  }

  // ─── Generating ─────────────────────────────────────────────────────────────

  if (step === 'generating') {
    return (
      <div className="wc-container">
        <div className="wc-generating">
          <div className="wc-spinner" />
          <p className="wc-generating-text">Finding your Wahoo...</p>
        </div>
      </div>
    )
  }

  // ─── Step: Choose Path ──────────────────────────────────────────────────────

  if (step === 'choose') {
    return (
      <div className="wc-container">
        <div className="wc-header">
          <h3 className="wc-title">What's your Wahoo?</h3>
          <p className="wc-subtitle">Something that scares you a little and lights you up a lot.</p>
        </div>

        <button className="wc-path-card" onClick={() => { hapticLight(); setStep('freetext') }}>
          <div className="wc-path-icon">🎯</div>
          <div className="wc-path-body">
            <div className="wc-path-name">I know what I want to try</div>
            <div className="wc-path-desc">Type it in, we'll build your challenge from it</div>
          </div>
          <span className="wc-path-arrow">›</span>
        </button>

        <button className="wc-path-card" onClick={() => { hapticLight(); setStep('browse') }}>
          <div className="wc-path-icon">🔍</div>
          <div className="wc-path-body">
            <div className="wc-path-name">Help me find one</div>
            <div className="wc-path-desc">Browse your play-skills for inspiration</div>
          </div>
          <span className="wc-path-arrow">›</span>
        </button>
      </div>
    )
  }

  // ─── Path A: Free Text ──────────────────────────────────────────────────────

  if (step === 'freetext') {
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('choose')}>← Back</button>

        <div className="wc-card">
          <h3 className="wc-card-title">What's something you'd love to do that scares you a little?</h3>
          <p className="wc-card-sub">Anything goes. Host a silent disco, do magic tricks, post a vulnerable video, cold-call 5 strangers.</p>

          <textarea
            className="wc-textarea"
            placeholder="I want to..."
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            rows={3}
          />

          {error && <p className="wc-error">{error}</p>}

          <button
            className="wc-cta"
            disabled={!freeText.trim() || generating}
            onClick={generateFromFreeText}
          >
            Generate my Wahoo
          </button>
        </div>
      </div>
    )
  }

  // ─── Path B: Browse Categories ──────────────────────────────────────────────

  if (step === 'browse') {
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('choose')}>← Back</button>

        <div className="wc-card">
          <h3 className="wc-card-title">Pick a play-skill</h3>
          <p className="wc-card-sub">We'll suggest Wahoos based on what lights you up.</p>

          {userCategories.length > 0 ? (
            <div className="wc-browse-grid">
              {userCategories.map(cat => (
                <button
                  key={cat.id}
                  className="wc-browse-card"
                  onClick={() => { hapticLight(); generateSuggestions(cat.id) }}
                >
                  <span className="wc-browse-icon">{cat.icon}</span>
                  <span className="wc-browse-name">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="wc-card-sub" style={{ textAlign: 'center', padding: '1rem 0' }}>
              Find your play-skills first to unlock suggestions here.
            </p>
          )}

          {error && <p className="wc-error">{error}</p>}

          <button
            className="wc-text-link"
            onClick={() => setStep('freetext')}
          >
            Or type your own idea instead
          </button>
        </div>
      </div>
    )
  }

  // ─── Preview (single challenge from Path A) ─────────────────────────────────

  if (step === 'preview' && !generatedChallenge) {
    return (
      <div className="wc-container">
        <div className="wc-generating">
          <div className="wc-spinner" />
          <p className="wc-generating-text">Loading...</p>
        </div>
      </div>
    )
  }

  if (step === 'preview' && generatedChallenge) {
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('freetext')}>← Back</button>

        <div className="wc-preview-card">
          <div className="wc-preview-label">Your Wahoo</div>
          <h3 className="wc-preview-title">{generatedChallenge.title}</h3>
          <p className="wc-preview-desc">{generatedChallenge.description}</p>

          {generatedChallenge.completionCriteria && (
            <div className="wc-preview-criteria">
              <span className="wc-preview-criteria-label">Done when:</span>
              <span>{generatedChallenge.completionCriteria}</span>
            </div>
          )}

          {generatedChallenge.alternativeVersion && (
            <div className="wc-preview-alt">
              <span className="wc-preview-alt-label">Easier version:</span>
              <span>{generatedChallenge.alternativeVersion}</span>
            </div>
          )}

          <div className="wc-preview-actions">
            <button
              className="wc-cta"
              onClick={() => acceptChallenge(generatedChallenge)}
              disabled={generating}
            >
              {generating ? 'Saving...' : 'Accept this Wahoo'}
            </button>
            <button
              className="wc-secondary"
              onClick={generateFromFreeText}
              disabled={generating}
            >
              Regenerate
            </button>
          </div>

          {error && <p className="wc-error">{error}</p>}
        </div>
      </div>
    )
  }

  // ─── Suggestions (2-3 options from Path B) ──────────────────────────────────

  if (step === 'suggestions') {
    const seg = findSkillSegment(selectedCategory)
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('browse')}>← {seg?.displayName || 'Back'}</button>

        <div className="wc-card">
          <h3 className="wc-card-title">Pick your Wahoo</h3>
          <p className="wc-card-sub">
            {suggestions.length} suggestions for {seg?.displayName || selectedCategory}
          </p>

          <div className="wc-suggestions-list">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="wc-suggestion-card"
                onClick={() => { hapticLight(); acceptChallenge(s) }}
                disabled={generating}
              >
                <div className="wc-suggestion-title">{s.title}</div>
                <div className="wc-suggestion-desc">{s.description}</div>
              </button>
            ))}
          </div>

          {error && <p className="wc-error">{error}</p>}

          <div className="wc-suggestions-footer">
            <button
              className="wc-secondary"
              onClick={() => generateSuggestions(selectedCategory)}
              disabled={generating}
            >
              Different suggestions
            </button>
            <button
              className="wc-text-link"
              onClick={() => setStep('freetext')}
            >
              Type my own instead
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
