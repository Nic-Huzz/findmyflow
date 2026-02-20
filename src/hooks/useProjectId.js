import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

export function useProjectId() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || null)
  const [loading, setLoading] = useState(!searchParams.get('projectId'))

  useEffect(() => {
    const urlProjectId = searchParams.get('projectId')
    if (urlProjectId) {
      setProjectId(urlProjectId)
      setLoading(false)
      return
    }

    // Check localStorage for last selected project (set by challenge system)
    try {
      const stored = localStorage.getItem('fmf_selected_project_id')
      if (stored) {
        setProjectId(stored)
        setLoading(false)
        return
      }
    } catch {}

    // Final fallback: primary project
    if (user?.id) {
      supabase.from('user_projects').select('id')
        .eq('user_id', user.id).eq('is_primary', true)
        .maybeSingle()
        .then(({ data }) => {
          setProjectId(data?.id || null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [searchParams, user])

  return { projectId, loading }
}
