/**
 * PortalContext.jsx — State management for AI Portal
 *
 * Fetches clients, growth nodes, grind loops, and tasks from Supabase.
 * Provides selection state and task completion actions.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

const PortalContext = createContext(null)

export function usePortal() {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalProvider')
  return ctx
}

export function PortalProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id

  // Data
  const [clients, setClients] = useState([])
  const [currentClientId, setCurrentClientId] = useState(null)
  const [growthNodes, setGrowthNodes] = useState([])
  const [grindLoops, setGrindLoops] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedLoopId, setSelectedLoopId] = useState(null)

  const currentClient = clients.find(c => c.id === currentClientId) || null
  const initializedRef = useRef(false)

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('portal_clients')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) { console.warn('Portal: failed to fetch clients:', error.message); return }
    if (data) {
      setClients(data)
      if (!initializedRef.current && data.length > 0) {
        initializedRef.current = true
        setCurrentClientId(data[0].id)
      }
    }
  }, [userId])

  // Fetch growth nodes + grind loops + tasks for current client
  const fetchClientData = useCallback(async () => {
    if (!currentClientId) {
      setGrowthNodes([])
      setGrindLoops([])
      setTasks([])
      return
    }

    const [nodesRes, loopsRes, tasksRes] = await Promise.all([
      supabase
        .from('portal_growth_nodes')
        .select('*')
        .eq('client_id', currentClientId)
        .order('sort_order'),
      supabase
        .from('portal_grind_loops')
        .select('*')
        .eq('client_id', currentClientId)
        .order('sort_order'),
      supabase
        .from('portal_tasks')
        .select('*')
        .eq('client_id', currentClientId)
        .order('sort_order'),
    ])

    if (nodesRes.error) console.warn('Portal: growth nodes fetch failed:', nodesRes.error.message)
    if (loopsRes.error) console.warn('Portal: grind loops fetch failed:', loopsRes.error.message)
    if (tasksRes.error) console.warn('Portal: tasks fetch failed:', tasksRes.error.message)

    if (nodesRes.data) setGrowthNodes(nodesRes.data)
    if (loopsRes.data) setGrindLoops(loopsRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
  }, [currentClientId])

  // Initial load
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    fetchClients().finally(() => setLoading(false))
  }, [userId, fetchClients])

  // Reload client data when client changes
  useEffect(() => {
    if (currentClientId) fetchClientData()
  }, [currentClientId, fetchClientData])

  // Actions
  const completeTask = useCallback(async (taskId) => {
    // Capture title synchronously before async work
    const taskTitle = tasks.find(t => t.id === taskId)?.title

    const { error } = await supabase
      .from('portal_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t
      ))
      // Log activity
      if (currentClientId) {
        const { error: actErr } = await supabase.from('portal_activity').insert({
          client_id: currentClientId,
          task_id: taskId,
          action: 'task_completed',
          summary: taskTitle,
        })
        if (actErr) console.warn('Portal: activity log failed:', actErr.message)
      }
    }
  }, [currentClientId, tasks])

  const reopenTask = useCallback(async (taskId) => {
    const { error } = await supabase
      .from('portal_tasks')
      .update({ status: 'open', completed_at: null })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'open', completed_at: null } : t
      ))
    }
  }, [])

  const createClient = useCallback(async (name) => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('portal_clients')
      .insert({ user_id: userId, name })
      .select()
      .single()

    if (data) {
      setClients(prev => [data, ...prev])
      setCurrentClientId(data.id)
      return data
    }
    return null
  }, [userId])

  const selectNode = useCallback((nodeId) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId)
    setSelectedLoopId(null)
  }, [])

  const selectLoop = useCallback((loopId) => {
    setSelectedLoopId(prev => prev === loopId ? null : loopId)
    setSelectedNodeId(null)
  }, [])

  // Derived
  const selectedNode = growthNodes.find(n => n.id === selectedNodeId) || null
  const selectedLoop = grindLoops.find(l => l.id === selectedLoopId) || null

  const nodeTasks = selectedNodeId
    ? tasks.filter(t => t.growth_node_id === selectedNodeId)
    : []

  const loopTasks = selectedLoopId
    ? tasks.filter(t => t.grind_loop_id === selectedLoopId)
    : []

  return (
    <PortalContext.Provider value={{
      // Data
      clients,
      currentClient,
      currentClientId,
      setCurrentClientId,
      growthNodes,
      grindLoops,
      tasks,
      loading,

      // Selection
      selectedNode,
      selectedLoop,
      selectedNodeId,
      selectedLoopId,
      selectNode,
      selectLoop,
      nodeTasks,
      loopTasks,

      // Actions
      completeTask,
      reopenTask,
      createClient,
      refresh: fetchClientData,
    }}>
      {children}
    </PortalContext.Provider>
  )
}
