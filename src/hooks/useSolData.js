import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function useSolData() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [instance, setInstance] = useState(null)
  const [founderProfile, setFounderProfile] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
        return
      }
      setUser(authUser)

      // Fetch Sol instance
      const { data: inst } = await supabase
        .from('sol_instances')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()

      setInstance(inst)

      // If no instance, fetch profile data for provisioning
      if (!inst || inst.status === 'terminated') {
        const { data: profile } = await supabase
          .from('user_profiles_for_crm')
          .select('display_name, email')
          .eq('user_id', authUser.id)
          .maybeSingle()

        // Nikigai clusters: persona=person, skills=craft, problems=message
        const { data: clusters } = await supabase
          .from('nikigai_clusters')
          .select('cluster_type, cluster_label, score')
          .eq('user_id', authUser.id)
          .in('cluster_type', ['persona', 'skills', 'problems'])
          .order('score', { ascending: false })

        const topCluster = (type) =>
          clusters?.find(c => c.cluster_type === type)?.cluster_label || null

        const { data: stage } = await supabase
          .from('user_stage_progress')
          .select('current_stage')
          .eq('user_id', authUser.id)
          .maybeSingle()

        const { data: project } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', authUser.id)
          .limit(1)
          .maybeSingle()

        setFounderProfile({
          name: profile?.display_name || authUser.email?.split('@')[0] || 'Founder',
          email: profile?.email || authUser.email,
          nikigai_message: topCluster('problems'),
          nikigai_person: topCluster('persona'),
          nikigai_craft: topCluster('skills'),
          current_stage: stage?.current_stage || 1,
          project_id: project?.id
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const provisionSol = useCallback(async ({ anthropic_token, telegram_bot_token, telegram_user_id }) => {
    if (!user || !founderProfile) return { error: 'Not ready' }

    const { data, error: fnError } = await supabase.functions.invoke('provision-sol', {
      body: {
        user_id: user.id,
        anthropic_token,
        telegram_bot_token,
        telegram_user_id,
        founder_name: founderProfile.name,
        nikigai_message: founderProfile.nikigai_message,
        nikigai_person: founderProfile.nikigai_person,
        nikigai_craft: founderProfile.nikigai_craft,
        current_stage: founderProfile.current_stage,
        owner_email: founderProfile.email,
        project_id: founderProfile.project_id
      }
    })

    if (fnError) return { error: fnError.message }
    await fetchData()
    return { data }
  }, [user, founderProfile, fetchData])

  const manageSol = useCallback(async (action) => {
    if (!user) return { error: 'Not authenticated' }

    const { data, error: fnError } = await supabase.functions.invoke('manage-sol', {
      body: { user_id: user.id, action }
    })

    if (fnError) return { error: fnError.message }
    await fetchData()
    return { data }
  }, [user, fetchData])

  return {
    loading,
    user,
    instance,
    founderProfile,
    error,
    provisionSol,
    manageSol,
    refresh: fetchData
  }
}
