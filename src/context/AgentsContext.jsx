/**
 * AgentsContext.jsx — State management for AI agents (Zarlo + Perry)
 *
 * Manages conversations, streaming responses, and tasks per agent.
 * Uses Supabase for persistence and edge function for Claude API streaming.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

const AgentsContext = createContext(null)

export function useAgents() {
  const ctx = useContext(AgentsContext)
  if (!ctx) throw new Error('useAgents must be used within AgentsProvider')
  return ctx
}

export const AGENTS = {
  zarlo: {
    id: 'zarlo',
    name: 'Zarlo',
    role: 'Strategy & Research',
    color: '#8b5cf6',
    avatar: '🧠',
    systemPrompt: `You are Zarlo, a strategic advisor for experience creators — people who run workshops, retreats, cohorts, and live events. You help with business strategy, positioning, pricing, audience research, and growth planning. Be direct, insightful, and practical. Draw from frameworks like Hormozi's value equation, but always ground advice in the creator's specific situation. Ask clarifying questions before giving advice.`,
  },
  perry: {
    id: 'perry',
    name: 'Perry',
    role: 'Offer Specialist',
    color: '#3b82f6',
    avatar: '💎',
    systemPrompt: `You are Perry, an offer design specialist for experience creators. You help craft irresistible offers — pricing, bonuses, guarantees, urgency, scarcity, and value stacking. You think in terms of dream outcomes, perceived likelihood of achievement, time delay, and effort/sacrifice (the value equation). Help creators build offers that feel like a no-brainer for their ideal attendee. Be specific and actionable.`,
  },
}

export function AgentsProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id

  const [activeAgentId, setActiveAgentId] = useState('zarlo')
  const [conversations, setConversations] = useState({}) // { agentId: messages[] }
  const [tasks, setTasks] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef(null)

  const activeAgent = AGENTS[activeAgentId]

  // Load conversations from Supabase
  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      const [convoRes, tasksRes] = await Promise.all([
        supabase.from('agent_conversations')
          .select('agent_id, messages')
          .eq('user_id', userId),
        supabase.from('agent_tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ])

      if (convoRes.data) {
        const map = {}
        convoRes.data.forEach(c => { map[c.agent_id] = c.messages || [] })
        setConversations(map)
      }
      if (convoRes.error) console.warn('Agents: conversations fetch failed:', convoRes.error.message)

      if (tasksRes.data) setTasks(tasksRes.data)
      if (tasksRes.error) console.warn('Agents: tasks fetch failed:', tasksRes.error.message)

      setLoading(false)
    }

    load()
  }, [userId])

  // Save conversation to Supabase (debounced via upsert)
  const saveConversation = useCallback(async (agentId, messages) => {
    if (!userId) return
    const { error } = await supabase.from('agent_conversations')
      .upsert({
        user_id: userId,
        agent_id: agentId,
        messages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,agent_id' })

    if (error) console.warn('Agents: save failed:', error.message)
  }, [userId])

  // Send message and stream response
  const sendMessage = useCallback(async (text) => {
    if (!userId || !text.trim() || isStreaming) return

    const agentId = activeAgentId
    const agent = AGENTS[agentId]
    const prevMessages = conversations[agentId] || []

    // Add user message
    const userMsg = { role: 'user', content: text.trim(), timestamp: Date.now() }
    const updated = [...prevMessages, userMsg]
    setConversations(prev => ({ ...prev, [agentId]: updated }))

    // Add placeholder for assistant response
    const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now() }
    const withPlaceholder = [...updated, assistantMsg]
    setConversations(prev => ({ ...prev, [agentId]: withPlaceholder }))
    setIsStreaming(true)

    try {
      // Build messages for Claude API
      const apiMessages = updated.map(m => ({ role: m.role, content: m.content }))

      // Call edge function
      const { data: { session } } = await supabase.auth.getSession()
      const abort = new AbortController()
      abortRef.current = abort

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            agentId,
            systemPrompt: agent.systemPrompt,
            messages: apiMessages,
          }),
          signal: abort.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`Agent chat failed: ${response.status}`)
      }

      // Stream response with proper SSE buffering
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let sseBuffer = ''
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() // keep incomplete last line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { streamDone = true; break }
          try {
            const parsed = JSON.parse(data)
            if (parsed.delta) {
              fullText += parsed.delta
              setConversations(prev => {
                const msgs = [...(prev[agentId] || [])]
                const lastIdx = msgs.length - 1
                if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                  msgs[lastIdx] = { ...msgs[lastIdx], content: fullText }
                }
                return { ...prev, [agentId]: msgs }
              })
            }
            if (parsed.error) {
              throw new Error(parsed.error)
            }
          } catch (e) {
            // Re-throw intentional errors (from parsed.error above)
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }

      // Save final conversation
      const finalMessages = [...updated, { role: 'assistant', content: fullText, timestamp: Date.now() }]
      setConversations(prev => ({ ...prev, [agentId]: finalMessages }))
      await saveConversation(agentId, finalMessages)

    } catch (err) {
      if (err.name === 'AbortError') {
        // Clean up empty assistant placeholder if abort happened before any content
        setConversations(prev => {
          const msgs = [...(prev[agentId] || [])]
          if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' && !msgs[msgs.length - 1].content) {
            msgs.pop()
          }
          return { ...prev, [agentId]: msgs }
        })
        return
      }
      console.warn('Agent chat error:', err.message)
      // Update placeholder with error
      setConversations(prev => {
        const msgs = [...(prev[agentId] || [])]
        const lastIdx = msgs.length - 1
        if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
          msgs[lastIdx] = { ...msgs[lastIdx], content: `Error: ${err.message}. Try again.` }
        }
        return { ...prev, [agentId]: msgs }
      })
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [userId, activeAgentId, conversations, isStreaming, saveConversation])

  const stopStreaming = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
  }, [])

  const clearConversation = useCallback(async () => {
    const agentId = activeAgentId
    setConversations(prev => ({ ...prev, [agentId]: [] }))
    await saveConversation(agentId, [])
  }, [activeAgentId, saveConversation])

  // Task actions
  const addTask = useCallback(async (title) => {
    if (!userId || !title.trim()) return
    const { data, error } = await supabase.from('agent_tasks')
      .insert({ user_id: userId, agent_id: activeAgentId, title: title.trim() })
      .select()
      .single()

    if (data) setTasks(prev => [data, ...prev])
    if (error) console.warn('Agents: add task failed:', error.message)
  }, [userId, activeAgentId])

  const toggleTask = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const newStatus = task.status === 'pending' ? 'done' : 'pending'
    const { error } = await supabase.from('agent_tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }, [tasks])

  const deleteTask = useCallback(async (taskId) => {
    const { error } = await supabase.from('agent_tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }, [])

  const messages = conversations[activeAgentId] || []
  const agentTasks = tasks.filter(t => t.agent_id === activeAgentId)

  return (
    <AgentsContext.Provider value={{
      activeAgent,
      activeAgentId,
      setActiveAgentId,
      messages,
      agentTasks,
      isStreaming,
      loading,
      sendMessage,
      stopStreaming,
      clearConversation,
      addTask,
      toggleTask,
      deleteTask,
    }}>
      {children}
    </AgentsContext.Provider>
  )
}
