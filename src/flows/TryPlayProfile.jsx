import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { inferFromGames, buildDNAProfile, matchFounder } from '../lib/dnaMatching'
import GameSelection from '../components/PlayProfile/GameSelection'
import DNASliders from '../components/PlayProfile/DNASliders'
import DNAReveal from '../components/PlayProfile/DNAReveal'
import PublicEmailGate from '../components/PublicEmailGate'
import '../components/PlayProfile/PlayProfile.css'

const STORAGE_KEY = 'try_play_profile_progress'

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveProgress(screen, state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ screen, state }))
  } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

/**
 * TryPlayProfile — Public lead magnet at /try/play-profile
 * No auth required. 3 steps + email gate:
 *   Games → Sliders → Email Gate → DNA Reveal + CTA
 */
export default function TryPlayProfile() {
  const saved = useRef(loadProgress())
  const [screen, setScreen] = useState(() => saved.current?.screen || 'games')
  const [founders, setFounders] = useState(null)
  const [utmParams, setUtmParams] = useState({})

  const [state, setState] = useState(() => saved.current?.state || {
    selectedGames: [],
    sliderValues: null,
    dnaProfile: null,
    matchResult: null,
  })

  // Load founders data
  useEffect(() => {
    fetch('/data/founderDnaFounders.json')
      .then(r => r.json())
      .then(setFounders)
      .catch(() => {})
  }, [])

  // Extract UTM params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || null,
    })
  }, [])

  // Save progress on screen/state changes
  useEffect(() => {
    if (screen === 'reveal') return // don't save after email gate (already in DB)
    saveProgress(screen, state)
  }, [screen, state])

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [screen])

  // ── Games complete ──
  const handleGamesComplete = (games) => {
    setState(prev => ({ ...prev, selectedGames: games }))
    setScreen('sliders')
  }

  // ── Sliders complete → compute DNA ──
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
    setScreen('email')
  }

  // ── Email submitted → save lead + show reveal ──
  const handleEmailSubmit = async (email, name) => {
    setScreen('reveal')
    clearProgress()

    // Save to DB (fire-and-forget)
    try {
      const founderName = state.matchResult?.founder?.name || state.matchResult?.topMatches?.[0]?.founder?.name
      await supabase.from('public_leads').upsert({
        email,
        name: name || null,
        source_flow: 'play_profile',
        flow_results: {
          dna_code: state.dnaProfile?.code,
          archetype: state.matchResult?.archetype,
          matched_founder: founderName,
          selected_games: state.selectedGames.map(g => g.name),
        },
        ...utmParams,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })

      // Notify lead capture
      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email,
          name,
          source: 'Play Profile',
          meta: {
            dna_code: state.dnaProfile?.code,
            archetype: state.matchResult?.archetype,
            matched_founder: founderName,
          },
        },
      }).catch(() => {})
    } catch (err) {
      console.error('Error saving play profile lead:', err)
    }
  }

  // ── CTA → sign up ──
  const handleContinue = () => {
    window.location.href = '/'
  }

  return (
    <div className="pp-flow-page">
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

        {screen === 'email' && (
          <PublicEmailGate
            flowType="play_profile"
            onEmailSubmit={handleEmailSubmit}
            title="Your Founder DNA is ready"
            subtitle="Enter your details to see which legendary founder thinks like you"
          />
        )}

        {screen === 'reveal' && state.dnaProfile && state.matchResult && (
          <DNAReveal
            profile={state.dnaProfile}
            match={state.matchResult}
            onContinue={handleContinue}
            continueLabel="Go deeper — find your stuck point"
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
      </div>
    </div>
  )
}
