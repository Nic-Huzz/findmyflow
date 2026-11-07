import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function WorkshopCreatePage() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [createdSession, setCreatedSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#09090F', color: '#fff' }}>
        <p>Please log in to create a workshop.</p>
      </div>
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const code = generateCode()

    const { data, error: insertErr } = await supabase
      .from('workshop_sessions')
      .insert({
        code,
        name: name.trim(),
        facilitator_user_id: user.id,
      })
      .select('id, code, name')
      .single()

    if (insertErr) {
      // Code collision — retry once
      if (insertErr.code === '23505') {
        const retryCode = generateCode()
        const { data: retryData, error: retryErr } = await supabase
          .from('workshop_sessions')
          .insert({ code: retryCode, name: name.trim(), facilitator_user_id: user.id })
          .select('id, code, name')
          .single()
        if (retryErr) {
          setError('Could not create workshop. Try again.')
          setLoading(false)
          return
        }
        setCreatedSession(retryData)
      } else {
        setError('Could not create workshop. Try again.')
        setLoading(false)
        return
      }
    } else {
      setCreatedSession(data)
    }
    setLoading(false)
  }

  const baseUrl = window.location.origin
  const participantLink = createdSession ? `${baseUrl}/journey/${createdSession.code}` : ''
  const facilitateLink = createdSession ? `${baseUrl}/journey/${createdSession.code}/facilitate` : ''

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, background: '#09090F', color: '#fff' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>Create Workshop</h1>

        {!createdSession ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              placeholder="Workshop name (e.g. Sarah's Clients - Nov 7)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '1rem' }}
            />
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #D946EF 0%, #FFB800 100%)', color: '#000', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'Creating...' : 'Create Workshop'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Workshop Code</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: 4 }}>{createdSession.code}</p>
            </div>

            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Participant link (share with attendees)</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={participantLink} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem' }} />
                <button onClick={() => copyToClipboard(participantLink, 'participant')} style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: '#D946EF', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {copied === 'participant' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Facilitator link (for you)</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={facilitateLink} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem' }} />
                <button onClick={() => copyToClipboard(facilitateLink, 'facilitate')} style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: '#D946EF', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {copied === 'facilitate' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
