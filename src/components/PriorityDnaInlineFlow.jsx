/**
 * PriorityDnaInlineFlow.jsx
 *
 * Inline "Get Unstuck" flow for the Play Profile section in PriorityWeekPicker.
 * Reuses existing Play Profile sub-components with callback-based navigation
 * instead of URL redirects.
 *
 * Flow: StuckPointSelection → FollowUpQuestions → AIDiagnostic → ChallengeDelivery
 *
 * Created: 2026-03-04
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { generateChallenge } from '../lib/founderDnaAI'
import './PlayProfile/PlayProfile.css'
import StuckPointSelection from './PlayProfile/StuckPointSelection'
import FollowUpQuestions from './PlayProfile/FollowUpQuestions'
import AIDiagnostic from './PlayProfile/AIDiagnostic'
import ChallengeDelivery from './PlayProfile/ChallengeDelivery'

export default function PriorityDnaInlineFlow({ userId, dnaResult, onChallengeCreated, onBack }) {
  const [screen, setScreen] = useState('loading')
  const [founders, setFounders] = useState(null)
  const [stuckPoint, setStuckPoint] = useState(null)
  const [followUpQA, setFollowUpQA] = useState(null)
  const [openText, setOpenText] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const sessionIdRef = useRef(null)

  // Load founders JSON on mount
  useEffect(() => {
    let cancelled = false
    fetch('/data/founderDnaFounders.json')
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setFounders(data)
          setScreen('stuckPoints')
        }
      })
      .catch(() => {
        if (!cancelled) setScreen('stuckPoints') // proceed without founders
      })
    return () => { cancelled = true }
  }, [])

  // ── Stuck point selected ──
  function handleStuckPointSelect(sp) {
    setStuckPoint(sp)
    setScreen('followUp')
  }

  // ── Follow-up complete ──
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
  async function createSession(sp, qa, text) {
    if (!userId || !dnaResult) return
    const { data, error } = await supabase
      .from('founder_dna_sessions')
      .insert({
        user_id: userId,
        matched_founder: dnaResult.matched_founder,
        dna_code: dnaResult.dna_code,
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
    }
  }

  // ── Diagnostic complete → generate challenge ──
  async function handleDiagnosisComplete(diag, aiExchanges) {
    if (!dnaResult) return
    setScreen('generating')

    try {
      const sid = sessionIdRef.current
      if (sid) {
        await supabase.from('founder_dna_sessions').update({
          ai_exchanges: aiExchanges.map(m => ({ role: m.role, content: m.content })),
          ai_diagnosis: diag,
        }).eq('id', sid)
      }

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
    } catch (err) {
      console.error('PriorityDnaInlineFlow: challenge generation failed', err)
      setIsGenerating(false)
      setScreen('stuckPoints')
    }
  }

  // ── Accept challenge ──
  function handleAcceptChallenge() {
    onChallengeCreated()
  }

  // Helper: get stage stories for founder + stuck point
  function getStageStories(founder, stuckPointId) {
    if (!founder?.stageStories) return []
    const stageKey = String(stuckPointId)
    const specific = founder.stageStories[stageKey] || []
    const general = founder.stageStories['general'] || []
    return specific.length > 0 ? specific : general
  }

  // Helper: get founder object
  function getFounder() {
    if (!dnaResult || !founders) return null
    return founders.find(f => f.name === dnaResult.matched_founder) || null
  }

  if (screen === 'loading') {
    return (
      <div className="play-profile-quiz" style={{ textAlign: 'center', padding: '40px 0' }}>
        <div className="pp-spinner" />
      </div>
    )
  }

  return (
    <div className="play-profile-quiz">
      {screen === 'stuckPoints' && dnaResult && (
        <StuckPointSelection
          founderName={dnaResult.matched_founder}
          onSelect={handleStuckPointSelect}
          onBack={onBack}
          stepLabel="Step 1 of 4"
        />
      )}

      {screen === 'followUp' && stuckPoint && dnaResult && (
        <FollowUpQuestions
          stuckPoint={stuckPoint}
          founderName={dnaResult.matched_founder}
          onComplete={handleFollowUpComplete}
          onBack={() => setScreen('stuckPoints')}
        />
      )}

      {screen === 'diagnostic' && dnaResult && stuckPoint && followUpQA && (
        <AIDiagnostic
          dnaCode={dnaResult.dna_code}
          archetype={dnaResult.archetype}
          founder={getFounder() || { name: dnaResult.matched_founder, bio: '', oneLiner: '' }}
          stuckPoint={stuckPoint}
          followUpQA={followUpQA}
          openText={openText}
          onDiagnosisComplete={handleDiagnosisComplete}
          onBack={() => setScreen('followUp')}
        />
      )}

      {screen === 'generating' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div className="pp-spinner" />
          <p className="pp-subtitle">Generating your challenge...</p>
        </div>
      )}

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
    </div>
  )
}
