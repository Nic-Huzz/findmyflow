import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import DiscoverTab from '../components/DiscoverTab'

export default function DiscoveryPage() {
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
        setHeroStage(data?.current_journey_level || 0)
        setLoading(false)
      })
  }, [user?.id])

  if (!user) { navigate('/log-in'); return null }
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
      <DiscoverTab
        userId={user.id}
        heroStage={heroStage}
        hideDirection={true}
        onUpdate={() => {}}
      />
    </div>
  )
}
