import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SUPABASE_AUTH_URL = 'https://qlwfcfypnoptsocdpxuv.supabase.co/auth/v1/oauth'

/**
 * Redirects OAuth requests to Supabase GoTrue.
 * Claude sends /authorize and /token to the MCP server domain.
 * We redirect them to Supabase where the actual OAuth server lives.
 */
export function OAuthAuthorize() {
  const location = useLocation()
  useEffect(() => {
    window.location.href = `${SUPABASE_AUTH_URL}/authorize${location.search}`
  }, [location.search])
  return null
}

export function OAuthToken() {
  const location = useLocation()
  useEffect(() => {
    window.location.href = `${SUPABASE_AUTH_URL}/token${location.search}`
  }, [location.search])
  return null
}
