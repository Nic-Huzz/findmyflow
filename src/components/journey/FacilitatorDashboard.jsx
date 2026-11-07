import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { useWorkshopChannel } from '../../hooks/useWorkshopChannel'

const STAGE_LABELS = [
  'Living from Essence',
  'Essence Suppressed',
  'Consequences',
  'The Search',
  'The Challenge',
]

export default function FacilitatorDashboard() {
  const { code } = useParams()
  const { user } = useAuth()

  const [session, setSession] = useState(null)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [completedPerStage, setCompletedPerStage] = useState([0, 0, 0, 0, 0])
  const [currentStage, setCurrentStage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [confirmAdvance, setConfirmAdvance] = useState(false)

  // Track completed counts via progress events
  const completedRef = useRef(completedPerStage)
  useEffect(() => { completedRef.current = completedPerStage }, [completedPerStage])

  const handleProgress = useCallback((payload) => {
    if (payload.status === 'completed') {
      setCompletedPerStage(prev => {
        const next = [...prev]
        next[payload.stage] = (next[payload.stage] || 0) + 1
        return next
      })
    }
  }, [])

  const { broadcast, presenceCount } = useWorkshopChannel(
    authorized ? code : null,
    {
      participantId: 'facilitator',
      onProgress: handleProgress,
    }
  )

  // Load session + verify auth
  useEffect(() => {
    if (!code || !user) return

    const load = async () => {
      const { data: sess } = await supabase
        .from('workshop_sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (!sess || sess.facilitator_user_id !== user.id) {
        setAuthorized(false)
        setLoading(false)
        return
      }

      setSession(sess)
      setCurrentStage(sess.current_stage || 0)
      setAuthorized(true)

      // Get participant counts
      const { count } = await supabase
        .from('workshop_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sess.id)

      setTotalParticipants(count || 0)

      // Get per-stage completion counts
      const { data: parts } = await supabase
        .from('workshop_participants')
        .select('stage_completed')
        .eq('session_id', sess.id)

      if (parts) {
        const counts = [0, 0, 0, 0, 0]
        parts.forEach(p => {
          if (p.stage_completed) {
            p.stage_completed.forEach((done, i) => {
              if (done) counts[i]++
            })
          }
        })
        setCompletedPerStage(counts)
      }

      setLoading(false)
    }

    load()
  }, [code, user])

  // Refresh participant count periodically
  useEffect(() => {
    if (!session) return
    const interval = setInterval(async () => {
      const { count } = await supabase
        .from('workshop_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
      setTotalParticipants(count || 0)
    }, 10000)
    return () => clearInterval(interval)
  }, [session])

  const handleAdvance = async () => {
    const nextStage = currentStage + 1
    if (nextStage > 4) return

    // Update DB
    await supabase
      .from('workshop_sessions')
      .update({
        current_stage: nextStage,
        status: nextStage === 0 ? 'active' : undefined,
        started_at: currentStage === 0 ? new Date().toISOString() : undefined,
      })
      .eq('id', session.id)

    // Broadcast advance
    broadcast('advance', { stage: nextStage })
    setCurrentStage(nextStage)
    setConfirmAdvance(false)
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#09090F', color: '#fff' }}>Loading...</div>
  }

  if (!authorized) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#09090F', color: '#fff' }}>Not authorized.</div>
  }

  const incompleteCount = totalParticipants - (completedPerStage[currentStage] || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: 24, background: '#09090F', color: '#fff' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', margin: 0 }}>Essence Journey</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>Code: {code}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{presenceCount || totalParticipants}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.8rem' }}>participants</p>
          </div>
        </div>

        {/* Stage list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {STAGE_LABELS.map((label, i) => {
            const isActive = i === currentStage
            const isDone = i < currentStage
            const completed = completedPerStage[i] || 0
            const total = totalParticipants || 1
            const pct = Math.round((completed / total) * 100)

            return (
              <div key={i} style={{
                padding: 16, borderRadius: 12,
                background: isActive ? 'rgba(217, 70, 239, 0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(217, 70, 239, 0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: isActive ? '#D946EF' : isDone ? '#FFB800' : 'rgba(255,255,255,0.4)' }}>
                    {isDone ? '✓' : isActive ? '●' : '○'} Stage {i + 1}: {label}
                  </span>
                  {isActive && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{completed}/{totalParticipants}</span>}
                </div>
                {isActive && (
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#D946EF', borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Advance button */}
        {currentStage < 4 && !confirmAdvance && (
          <button
            onClick={() => setConfirmAdvance(true)}
            style={{
              width: '100%', padding: '16px 32px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #D946EF 0%, #FFB800 100%)',
              color: '#000', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Unlock Next Stage &rarr;
          </button>
        )}

        {confirmAdvance && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {incompleteCount > 0 && (
              <p style={{ color: '#FFB800', textAlign: 'center', fontSize: '0.9rem' }}>
                {incompleteCount} participant{incompleteCount !== 1 ? 's' : ''} haven&apos;t finished. Unlock anyway?
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmAdvance(false)}
                style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
              >
                Wait
              </button>
              <button
                onClick={handleAdvance}
                style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#D946EF', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Unlock
              </button>
            </div>
          </div>
        )}

        {currentStage >= 4 && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>All stages unlocked. Workshop complete.</p>
        )}
      </div>
    </div>
  )
}
