import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { inferFromGames, buildDNAProfile, matchFounder } from '../../lib/dnaMatching'
import GameSelection from './GameSelection'
import DNASliders from './DNASliders'
import DNAReveal, { getDisplayCompany } from './DNAReveal'
import StuckPointSelection from './StuckPointSelection'
import FollowUpQuestions from './FollowUpQuestions'
import ProfileSummary from './ProfileSummary'
import { onPlayProfileComplete } from '../../lib/brain/autoPopulate'
import './PlayProfile.css'

// Strip large stageStories from founder objects before saving to localStorage
function stripForStorage(s) {
  if (!s.matchResult) return s
  const stripFounder = (f) => f ? { name: f.name, company: f.company, experienceType: f.experienceType, fuelType: f.fuelType } : f
  return {
    ...s,
    matchResult: {
      ...s.matchResult,
      founder: stripFounder(s.matchResult.founder),
      topMatches: s.matchResult.topMatches?.map(m => ({ ...m, founder: stripFounder(m.founder) })),
    },
  }
}

// Re-hydrate stripped founder refs from full founders array
function rehydrateState(savedState, founders) {
  if (!savedState.matchResult?.founder?.name || !founders) return savedState
  const find = (name) => founders.find(f => f.name === name) || { name }
  return {
    ...savedState,
    matchResult: {
      ...savedState.matchResult,
      founder: find(savedState.matchResult.founder.name),
      topMatches: savedState.matchResult.topMatches?.map(m => ({ ...m, founder: find(m.founder.name) })),
    },
  }
}

export default function PlayProfileQuiz({ userId, onQuizComplete, founders: externalFounders, skipExistingCheck }) {
  const [screen, setScreen] = useState('loading')
  const [founders, setFounders] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [state, setState] = useState({
    selectedGames: [],
    sliderValues: null,
    dnaProfile: null,
    matchResult: null,
    stuckPoint: null,
    followUpAnswers: [],
    openText: '',
  })

  const storageKey = userId ? `playprofile_quiz_${userId}` : null

  // Auto-save progress to localStorage on every step change
  useEffect(() => {
    if (!storageKey || screen === 'loading' || screen === 'saved') return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ screen, state: stripForStorage(state) }))
    } catch {}
  }, [screen, state, storageKey])

  // Load founders data + check for existing result
  useEffect(() => {
    let cancelled = false

    async function init() {
      // If founders passed from parent (flow page), use those
      if (externalFounders) {
        setFounders(externalFounders)
        if (skipExistingCheck) {
          setScreen('games')
          return
        }
      }

      // Start both fetches in parallel
      const [foundersRes, existingRes] = await Promise.all([
        externalFounders
          ? Promise.resolve(externalFounders)
          : fetch('/data/experienceCreatorDNA.json').then(r => r.json()).then(d => d.profiles).catch(() => null),
        (!skipExistingCheck && userId)
          ? supabase
              .from('founder_dna_results')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
          : Promise.resolve({ data: null }),
      ])

      if (cancelled) return

      if (foundersRes && !externalFounders) setFounders(foundersRes)

      const existing = existingRes?.data?.[0]
      if (existing && (foundersRes || externalFounders)) {
        const allFounders = foundersRes || externalFounders
        // Rebuild match result from saved data to show ProfileSummary
        const matchedFounder = allFounders.find(f => f.name === existing.matched_founder)
        if (matchedFounder) {
          setState(prev => ({
            ...prev,
            dnaProfile: { code: existing.dna_code },
            matchResult: {
              founder: matchedFounder,
              distance: existing.match_distance,
              archetype: existing.archetype,
            },
            stuckPoint: existing.stuck_point_id != null
              ? { id: existing.stuck_point_id, name: existing.stuck_point_name, icon: '' }
              : null,
          }))
          setScreen('saved')
          return
        }
      }

      // Check localStorage for in-progress quiz before starting fresh
      const allFounders = foundersRes || externalFounders
      if (storageKey) {
        try {
          const saved = localStorage.getItem(storageKey)
          if (saved) {
            const { screen: savedScreen, state: savedState } = JSON.parse(saved)
            setState(allFounders ? rehydrateState(savedState, allFounders) : savedState)
            setScreen(savedScreen)
            return
          }
        } catch {}
      }

      setScreen('games')
    }

    init()
    return () => { cancelled = true }
  }, [userId, externalFounders, skipExistingCheck])

  const handleGamesComplete = (games) => {
    setState(prev => ({ ...prev, selectedGames: games }))
    setScreen('sliders')
  }

  const handleSlidersComplete = (values) => {
    if (!founders) return
    const { orientation, knowledgeStyle } = inferFromGames(state.selectedGames)
    const profile = buildDNAProfile(
      values.workRhythm,
      values.fuelType,
      orientation,
      knowledgeStyle,
      values.scaleApproach
    )
    const match = matchFounder(profile, founders)

    setState(prev => ({
      ...prev,
      sliderValues: values,
      dnaProfile: profile,
      matchResult: match,
    }))
    setScreen('reveal')
  }

  const handleStuckPointSelect = (sp) => {
    setState(prev => ({ ...prev, stuckPoint: sp }))
    setScreen('followUp')
  }

  const handleFollowUpComplete = (answers, openText) => {
    const updated = { ...state, followUpAnswers: answers, openText }
    setState(updated)
    // Auto-save and skip summary — go straight to diagnostic or saved
    autoSave(updated)
  }

  const autoSave = async (s) => {
    if (!userId || !s.matchResult) return
    setIsSaving(true)
    try {
      const row = {
        user_id: userId,
        selected_games: s.selectedGames.map(g => ({ name: g.name, icon: g.icon, category: g.category })),
        slider_values: s.sliderValues,
        dna_code: s.dnaProfile.code,
        archetype: s.matchResult.archetype,
        matched_founder: s.matchResult.founder.name,
        matched_founder_company: getDisplayCompany(s.matchResult.founder) || null,
        match_distance: s.matchResult.distance,
        stuck_point_id: s.stuckPoint?.id ?? null,
        stuck_point_name: s.stuckPoint?.name ?? null,
        follow_up_answers: s.followUpAnswers,
        open_text: s.openText || null,
        completed_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('founder_dna_results')
        .upsert(row, { onConflict: 'user_id' })

      if (error) console.error('Failed to save founder DNA result:', error)

      // Auto-populate brain
      if (userId) {
        onPlayProfileComplete(userId, {
          dnaCode: s.dnaProfile?.code || row.dna_code,
          archetype: row.archetype,
          matchedFounder: row.matched_founder,
          sliders: s.sliderValues,
        })
      }

      try { if (storageKey) localStorage.removeItem(storageKey) } catch {}

      if (onQuizComplete) {
        onQuizComplete({
          dnaProfile: s.dnaProfile,
          matchResult: s.matchResult,
          stuckPoint: s.stuckPoint,
          followUpAnswers: s.followUpAnswers,
          openText: s.openText,
          selectedGames: s.selectedGames,
          sliderValues: s.sliderValues,
          founders: founders,
        })
      } else {
        setScreen('saved')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetake = () => {
    try { if (storageKey) localStorage.removeItem(storageKey) } catch {}
    setState({
      selectedGames: [],
      sliderValues: null,
      dnaProfile: null,
      matchResult: null,
      stuckPoint: null,
      followUpAnswers: [],
      openText: '',
    })
    setScreen('games')
  }

  if (screen === 'loading') {
    return (
      <div className="play-profile-quiz" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="pp-spinner" />
        <p className="pp-subtitle">Loading...</p>
      </div>
    )
  }

  return (
    <div className="play-profile-quiz">
      {screen === 'games' && (
        <GameSelection onComplete={handleGamesComplete} />
      )}

      {screen === 'sliders' && (
        <DNASliders
          onComplete={handleSlidersComplete}
          onBack={() => setScreen('games')}
          isLoading={!founders}
        />
      )}

      {screen === 'reveal' && state.dnaProfile && state.matchResult && (
        <DNAReveal
          profile={state.dnaProfile}
          match={state.matchResult}
          onContinue={() => setScreen('stuckPoints')}
          onFounderChange={(selectedMatch) => {
            setState(prev => ({
              ...prev,
              matchResult: {
                ...prev.matchResult,
                founder: selectedMatch.founder,
                distance: selectedMatch.distance,
              },
            }))
          }}
        />
      )}

      {screen === 'stuckPoints' && state.matchResult && (
        <StuckPointSelection
          founderName={state.matchResult.founder.name}
          onSelect={handleStuckPointSelect}
          onBack={() => setScreen('reveal')}
        />
      )}

      {screen === 'followUp' && state.stuckPoint && state.matchResult && (
        <FollowUpQuestions
          stuckPoint={state.stuckPoint}
          founderName={state.matchResult.founder.name}
          onComplete={handleFollowUpComplete}
          onBack={() => setScreen('stuckPoints')}
        />
      )}

      {screen === 'saved' && state.matchResult && (
        <ProfileSummary
          founder={state.matchResult.founder}
          stuckPoint={state.stuckPoint || { id: null, name: 'Unknown', icon: '' }}
          dnaCode={state.dnaProfile?.code}
          archetype={state.matchResult.archetype}
          onRetake={handleRetake}
        />
      )}
    </div>
  )
}
