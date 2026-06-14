import { supabase } from './supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

async function adminFetch(action, params = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

export const fetchUsers = (filter, search, page, pageSize) =>
  adminFetch('get_users', { filter, search, page, pageSize })

export const fetchStats = () =>
  adminFetch('get_stats')

export const fetchEngagement = () =>
  adminFetch('get_engagement')

export const sendNudge = (targetUserId, title, body, url) =>
  adminFetch('send_nudge', { targetUserId, title, body, url })
