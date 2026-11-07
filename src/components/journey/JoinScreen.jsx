import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

/**
 * JoinScreen — Workshop join form. Name + email, anonymous auth behind the scenes.
 *
 * @param {string} code - Workshop session code
 * @param {function} onJoined - Called with { participantId, sessionId, anonUserId } after join
 */
export default function JoinScreen({ code, onJoined }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError(null)

    try {
      // 1. Sign in anonymously first (needed for RLS to allow session lookup)
      let anonUserId
      const { data: existingSession } = await supabase.auth.getSession()
      if (existingSession?.session?.user?.is_anonymous) {
        // Resume existing anonymous session (page refresh / re-submit)
        anonUserId = existingSession.session.user.id
      } else {
        const { data: authData, error: authErr } = await supabase.auth.signInAnonymously()
        if (authErr) {
          setError('Could not join. Please try again.')
          console.warn('Anonymous auth error:', authErr)
          setLoading(false)
          return
        }
        anonUserId = authData.user.id
      }

      // 2. Look up workshop session by code (now authenticated)
      const { data: session, error: sessionErr } = await supabase
        .from('workshop_sessions')
        .select('id, status')
        .eq('code', code.toUpperCase())
        .single()

      if (sessionErr || !session) {
        setError('Workshop not found. Check your code.')
        setLoading(false)
        return
      }

      // 3. Check for existing participant row (page refresh case)
      const { data: existingParticipant } = await supabase
        .from('workshop_participants')
        .select('id')
        .eq('session_id', session.id)
        .eq('anon_user_id', anonUserId)
        .maybeSingle()

      if (existingParticipant) {
        // Resume existing participation
        onJoined({
          participantId: existingParticipant.id,
          sessionId: session.id,
          anonUserId,
        })
        return
      }

      // 4. Create participant row
      const { data: participant, error: partErr } = await supabase
        .from('workshop_participants')
        .insert({
          session_id: session.id,
          anon_user_id: anonUserId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
        })
        .select('id')
        .single()

      if (partErr) {
        setError('Could not join. Please try again.')
        console.warn('Participant insert error:', partErr)
        setLoading(false)
        return
      }

      onJoined({
        participantId: participant.id,
        sessionId: session.id,
        anonUserId,
      })
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.warn('Join error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="jc" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, background: '#09090F', color: '#fff' }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Essence Journey</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Enter your details to join the workshop.</p>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '1rem' }}
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '1rem' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #D946EF 0%, #FFB800 100%)', color: '#000', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Joining...' : 'Join Workshop'}
          </button>
        </form>
      </div>
    </div>
  )
}
