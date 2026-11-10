import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import DirectionSection from '../components/direction/DirectionSection'

export default function DirectionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [heroStage, setHeroStage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const stage = data?.current_journey_level || 0
        setHeroStage(stage)
        setLoading(false)
        if (stage < 8) navigate('/7-day-challenge?tab=progress')
      })
  }, [user?.id, navigate])

  if (!user) { navigate('/log-in'); return null }
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', padding: '20px 16px' }}>
      <button onClick={() => navigate('/7-day-challenge?tab=progress')} style={{ background: 'none', border: 'none', color: '#5e17eb', fontSize: '0.95rem', cursor: 'pointer', marginBottom: 16 }}>
        &larr; Back to Progress
      </button>
      <DirectionSection userId={user.id} onUpdate={() => {}} />
    </div>
  )
}
