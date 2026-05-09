/**
 * PlayProfileFlow.jsx
 *
 * Flow page at /play-profile with modes:
 *   ?mode=retake   — full quiz (overwrites DNA result)
 *   ?mode=unstuck  — repeatable: stuck point → follow-up → AI diagnostic → challenge
 *   ?mode=rate&sessionId=X — rate an active challenge
 *   (default, no result) — full quiz for first-time users
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { generateChallenge } from '../lib/founderDnaAI'
import { syncFounderDnaChallengeCompletion } from '../lib/questCompletionHelpers'
import PlayProfileQuiz from '../components/PlayProfile/PlayProfileQuiz'
import StuckPointSelection from '../components/PlayProfile/StuckPointSelection'
import FollowUpQuestions from '../components/PlayProfile/FollowUpQuestions'
import AIDiagnostic from '../components/PlayProfile/AIDiagnostic'
import ChallengeDelivery from '../components/PlayProfile/ChallengeDelivery'
import ChallengeRating from '../components/PlayProfile/ChallengeRating'
import '../components/PlayProfile/PlayProfile.css'

export default function PlayProfileFlow() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const sessionId = searchParams.get('sessionId')

  const [screen, setScreen] = useState('loading')
  const [founders, setFounders] = useState(null)
  const [dnaResult, setDnaResult] = useState(null) // from founder_dna_results
  const [sessionData, setSessionData] = useState(null) // current founder_dna_sessions row
  const [isGenerating, setIsGenerating] = useState(false)
  const [cameFromQuiz, setCameFromQuiz] = useState(false)
  const sessionIdRef = useRef(null)

  // Quiz + unstuck shared state
  const [stuckPoint, setStuckPoint] = useState(null)
  const [followUpQA, setFollowUpQA] = useState(null)
  const [openText, setOpenText] = useState('')
  const [diagnosis, setDiagnosis] = useState(null)
  const [challenge, setChallenge] = useState(null)

  // Load founders JSON + existing DNA result
  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function init() {
      const [foundersRes, resultRes] = await Promise.all([
        fetch('/data/experienceCreatorDNA.json').then(r => r.json()).then(d => d.profiles).catch(() => null),
        supabase
          .from('founder_dna_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return
      if (foundersRes) setFounders(foundersRes)

      const existing = resultRes?.data || null
      setDnaResult(existing)

      // Route to correct screen based on mode
      if (mode === 'rate' && sessionId) {
        // Load the session to rate
        const { data: session } = await supabase
          .from('founder_dna_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (session) {
          setSessionData(session)
          setScreen('rating')
        } else {
          setScreen('done')
        }
      } else if (mode === 'retake' || !existing) {
        setScreen('quiz')
      } else if (mode === 'unstuck') {
        setScreen('stuckPoints')
      } else {
        // Has result, no specific mode — go to unstuck flow
        setScreen('stuckPoints')
      }
    }

    init()
    return () => { cancelled = true }
  }, [user, mode, sessionId])

  // ── Quiz complete → chain into diagnostic ──
  function handleQuizComplete(quizData) {
    // quizData has: dnaProfile, matchResult, stuckPoint, followUpAnswers, openText, selectedGames, sliderValues, founders
    const newDnaResult = {
      dna_code: quizData.dnaProfile.code,
      archetype: quizData.matchResult.archetype,
      matched_founder: quizData.matchResult.founder.name,
      matched_founder_company: quizData.matchResult.founder.company,
      slider_values: quizData.sliderValues,
      selected_games: quizData.selectedGames.map(g => ({ name: g.name, icon: g.icon, category: g.category })),
    }
    setDnaResult(newDnaResult)
    if (quizData.founders) setFounders(quizData.founders)
    setStuckPoint(quizData.stuckPoint)
    setCameFromQuiz(true)

    // Build followUpQA from answers + stuckPoint questions
    const qa = quizData.stuckPoint?.followUpQuestions?.map((q, i) => ({
      question: q.question,
      answer: q.options[quizData.followUpAnswers[i]] || '',
    })) ?? []
    setFollowUpQA(qa)
    setOpenText(quizData.openText || '')

    // Jump to diagnostic — pass dnaResult directly to avoid stale state
    setScreen('diagnostic')
    createSession(quizData.stuckPoint, qa, quizData.openText, newDnaResult)
  }

  // ── Stuck point selected (unstuck mode) ──
  function handleStuckPointSelect(sp) {
    setStuckPoint(sp)
    setScreen('followUp')
  }

  // ── Follow-up complete (unstuck mode) ──
  function handleFollowUpComplete(answers, text) {
    const qa = (stuckPoint.followUpQuestions || []).map((q, i) => ({
      question: q.question,
      answer: q.options[answers[i]] || '',
    }))
    setFollowUpQA(qa)
    setOpenText(text || '')
    setScreen('diagnostic')
    createSession(stuckPoint, qa, text)
  }

  // ── Create session row in DB ──
  async function createSession(sp, qa, text, dnaResultOverride) {
    const dna = dnaResultOverride || dnaResult
    if (!user || !dna) return
    const { data, error } = await supabase
      .from('founder_dna_sessions')
      .insert({
        user_id: user.id,
        matched_founder: dna.matched_founder,
        dna_code: dna.dna_code,
        stuck_point_id: sp.id,
        stuck_point_name: sp.name,
        follow_up_qa: qa,
        open_text: text || null,
        status: 'diagnostic',
      })
      .select('id')
      .single()

    if (!error && data) {
      sessionIdRef.current = data.id
      setSessionData({ id: data.id })
    }
  }

  // ── Diagnostic complete → generate challenge ──
  async function handleDiagnosisComplete(diag, aiExchanges) {
    if (!dnaResult) return
    setDiagnosis(diag)
    setScreen('generating')

    const sid = sessionIdRef.current
    // Update session with diagnostic data
    if (sid) {
      await supabase.from('founder_dna_sessions').update({
        ai_exchanges: aiExchanges.map(m => ({ role: m.role, content: m.content })),
        ai_diagnosis: diag,
      }).eq('id', sid)
    }

    // Generate challenge
    setIsGenerating(true)
    const founder = founders?.find(f => f.name === dnaResult.matched_founder)
    const stageStories = getStageStories(founder, stuckPoint?.id)
    const sliderValues = dnaResult.slider_values || {}

    const result = await generateChallenge({
      founderName: dnaResult.matched_founder,
      stageStories,
      diagnosis: diag,
      knowledgeStyle: sliderValues.knowledgeStyle || founder?.knowledgeStyle || 3,
      fuelType: sliderValues.fuelType || founder?.fuelType || 3,
      gameCategories: (dnaResult.selected_games || []).map(g => g.category).filter(Boolean),
    })

    setChallenge(result)
    setIsGenerating(false)

    // Update session with challenge data
    if (sid) {
      await supabase.from('founder_dna_sessions').update({
        challenge_name: result.challengeName || null,
        challenge_type: result.challengeType,
        challenge_mirror: result.mirror,
        challenge_bridge: result.bridge,
        challenge_action: result.action,
        status: 'active',
      }).eq('id', sid)
    }

    setScreen('challenge')
  }

  // ── Accept challenge → back to dashboard ──
  function handleAcceptChallenge() {
    window.location.href = '/7-day-challenge?tab=playlist&sub=play-profile'
  }

  // ── Rate challenge ──
  async function handleRate(ratings) {
    const sid = sessionData?.id
    if (sid) {
      await supabase.from('founder_dna_sessions').update({
        voice_type: ratings.voice_type,
        voice_reflection: ratings.voice_reflection,
        compass_internal: ratings.internal_state,
        compass_external: ratings.external_state,
        compass_direction: ratings.compass_direction,
        rated_at: new Date().toISOString(),
        status: 'completed',
      }).eq('id', sid)

      // Award 10 points towards Play-list category
      if (user?.id) await syncFounderDnaChallengeCompletion(user.id, sid)
    }
    window.location.href = '/7-day-challenge?tab=playlist&sub=play-profile'
  }

  // Helper: get stage stories for founder + stuck point
  function getStageStories(founder, stuckPointId) {
    if (!founder?.stageStories) return []
    const stageKey = String(stuckPointId)
    const specific = founder.stageStories[stageKey] || []
    const general = founder.stageStories['general'] || []
    return specific.length > 0 ? specific : general
  }

  // Helper: get founder object from founders array
  function getFounder() {
    if (!dnaResult || !founders) return null
    return founders.find(f => f.name === dnaResult.matched_founder) || null
  }

  if (screen === 'loading') {
    return (
      <div className="pp-flow-page">
        <div className="play-profile-quiz" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="pp-spinner" />
          <p className="pp-subtitle">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pp-flow-page">
      <div className="play-profile-quiz">
        {/* Full quiz (first-time or retake) */}
        {screen === 'quiz' && (
          <PlayProfileQuiz
            userId={user?.id}
            founders={founders}
            skipExistingCheck={mode === 'retake'}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {/* Stuck point selection (unstuck mode) */}
        {screen === 'stuckPoints' && dnaResult && (
          <StuckPointSelection
            founderName={dnaResult.matched_founder}
            onSelect={handleStuckPointSelect}
            onBack={() => { window.location.href = '/7-day-challenge?tab=playlist&sub=play-profile' }}
          />
        )}

        {/* Follow-up questions (unstuck mode) */}
        {screen === 'followUp' && stuckPoint && dnaResult && (
          <FollowUpQuestions
            stuckPoint={stuckPoint}
            founderName={dnaResult.matched_founder}
            onComplete={handleFollowUpComplete}
            onBack={() => setScreen('stuckPoints')}
          />
        )}

        {/* AI Diagnostic */}
        {screen === 'diagnostic' && dnaResult && stuckPoint && followUpQA && (
          <AIDiagnostic
            dnaCode={dnaResult.dna_code}
            archetype={dnaResult.archetype}
            founder={getFounder() || { name: dnaResult.matched_founder, bio: '', oneLiner: '' }}
            stuckPoint={stuckPoint}
            followUpQA={followUpQA}
            openText={openText}
            onDiagnosisComplete={handleDiagnosisComplete}
            onBack={cameFromQuiz
              ? () => { window.location.href = '/7-day-challenge?tab=playlist&sub=play-profile' }
              : () => setScreen('followUp')
            }
          />
        )}

        {/* Generating challenge */}
        {screen === 'generating' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="pp-spinner" />
            <p className="pp-subtitle">Generating your challenge...</p>
          </div>
        )}

        {/* Challenge delivery */}
        {screen === 'challenge' && challenge && (
          <ChallengeDelivery
            founderName={dnaResult?.matched_founder || 'Your founder'}
            challengeName={challenge.challengeName}
            challengeType={challenge.challengeType}
            mirror={challenge.mirror}
            bridge={challenge.bridge}
            action={challenge.action}
            onAccept={handleAcceptChallenge}
          />
        )}

        {/* Rating */}
        {screen === 'rating' && sessionData && (
          <ChallengeRating
            founderName={sessionData.matched_founder || dnaResult?.matched_founder || 'Your founder'}
            challengeAction={sessionData.challenge_action}
            onRate={handleRate}
            onBack={() => { window.location.href = '/7-day-challenge?tab=playlist&sub=play-profile' }}
          />
        )}

        {/* Done (fallback) */}
        {screen === 'done' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p className="pp-subtitle">Session not found.</p>
            <a
              href="/7-day-challenge?tab=playlist&sub=play-profile"
              className="pp-btn-ghost"
              style={{ display: 'inline-block', textDecoration: 'none', marginTop: 16 }}
            >
              Back to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
