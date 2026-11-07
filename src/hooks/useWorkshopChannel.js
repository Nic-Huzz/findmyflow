import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * useWorkshopChannel — Supabase Realtime broadcast + presence for workshop sync.
 *
 * @param {string} code - Workshop session code
 * @param {object} options
 * @param {string} options.participantId - This user's participant ID (for presence)
 * @param {function} options.onAdvance - Called when facilitator broadcasts 'advance'
 * @param {function} options.onProgress - Called when a participant broadcasts 'progress' (facilitator only)
 */
export function useWorkshopChannel(code, { participantId, onAdvance, onProgress } = {}) {
  const [presenceCount, setPresenceCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!code) return

    const channelName = `workshop:${code}`
    const channel = supabase.channel(channelName, {
      config: { presence: { key: participantId || 'facilitator' } },
    })

    // Listen for advance events (participant side)
    channel.on('broadcast', { event: 'advance' }, (payload) => {
      if (onAdvance) onAdvance(payload.payload)
    })

    // Listen for progress events (facilitator side)
    channel.on('broadcast', { event: 'progress' }, (payload) => {
      if (onProgress) onProgress(payload.payload)
    })

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      setPresenceCount(Object.keys(state).length)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        await channel.track({ participantId, joinedAt: new Date().toISOString() })
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [code, participantId]) // onAdvance/onProgress intentionally excluded — use refs if they change

  const broadcast = useCallback((event, payload) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
  }, [])

  return { broadcast, presenceCount, isConnected }
}
