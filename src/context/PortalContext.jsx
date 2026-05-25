/**
 * PortalContext.jsx — State management for AI Portal
 *
 * Growth Line nodes are COMPUTED from existing FMF data (content, contacts,
 * deals, experiences, attendees). No separate node storage table.
 * Only portal_tasks (action items) and portal_activity (log) are stored.
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

// ─── Pipeline node definitions ────────────────────────────────────────────

const PIPELINE_NODES = [
  { key: 'awareness',      label: 'Awareness',      thresholds: { good: 3, warn: 1 } },
  { key: 'contact',        label: 'Contact',         thresholds: { good: 10, warn: 3 } },
  { key: 'outreach',       label: 'Outreach',        thresholds: { good: 5, warn: 1 } },
  { key: 'conversation',   label: 'Conversation',    thresholds: { good: 3, warn: 1 } },
  { key: 'qualified',      label: 'Qualified',       thresholds: { good: 50, warn: 25 } },
  { key: 'meeting_booked', label: 'Meeting Booked',  thresholds: { good: 2, warn: 1 } },
  { key: 'close',          label: 'Close',           thresholds: { good: 80, warn: 40 } },
  { key: 'onboard',        label: 'Onboard',         thresholds: { good: 75, warn: 25 } },
  { key: 'deliver',        label: 'Deliver',         thresholds: { good: 1, warn: 0 } },
  { key: 'support',        label: 'Support',         thresholds: { good: 80, warn: 50 } },
  { key: 'retain',         label: 'Retain',          thresholds: { good: 20, warn: 5 } },
]

function deriveStatus(value, thresholds) {
  if (value >= thresholds.good) return 'good'
  if (value >= thresholds.warn) return 'warn'
  return 'bad'
}

function weekAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

function monthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ─── Data fetchers ────────────────────────────────────────────────────────

async function fetchPipelineData(userId) {
  const [contentRes, contactsRes, dealsRes, experiencesRes, attendeesRes, checklistRes, ecosystemRes] =
    await Promise.all([
      // Awareness: content posted this week
      supabase.from('content_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gte('created_at', weekAgo()),

      // Contact/Outreach/Conversation/Meeting: contacts by outreach_status
      supabase.from('crm_contacts')
        .select('id, outreach_status, lifecycle_stage')
        .eq('user_id', userId),

      // Qualified/Close: deals with value + status
      supabase.from('sales_deals')
        .select('id, status, value, probability, actual_close_date, updated_at')
        .eq('user_id', userId),

      // Deliver: upcoming experiences
      supabase.from('experiences')
        .select('id, status')
        .eq('user_id', userId),

      // Retain: attendee repeat rate
      supabase.from('experience_attendees')
        .select('contact_id')
        .eq('user_id', userId),

      // Support: followup checklist completion
      supabase.from('experience_checklist_items')
        .select('completed, section')
        .eq('user_id', userId)
        .eq('section', 'followup'),

      // Onboard: ecosystem progress
      supabase.from('ecosystem_system_progress')
        .select('completed')
        .eq('user_id', userId),
    ])

  // ─── Compute per-node values ──────────────────────────────────────────

  // Awareness: posts this week
  const contentCount = contentRes.count || 0

  // Contacts by outreach status
  const contacts = contactsRes.data || []
  const warmLeads = contacts.filter(c =>
    ['to_contact', 'reached_out', 'in_conversation', 'meeting_booked'].includes(c.outreach_status)
  ).length
  const reachedOut = contacts.filter(c =>
    ['reached_out', 'in_conversation'].includes(c.outreach_status)
  ).length
  const inConversation = contacts.filter(c => c.outreach_status === 'in_conversation').length
  const meetingBooked = contacts.filter(c => c.outreach_status === 'meeting_booked').length

  // Deals
  const deals = dealsRes.data || []
  const now = new Date()
  const wonThisMonth = deals.filter(d => {
    if (!['won', 'delivering', 'completed'].includes(d.status)) return false
    const closeDate = new Date(d.actual_close_date || d.updated_at)
    return closeDate.getMonth() === now.getMonth() && closeDate.getFullYear() === now.getFullYear()
  })
  const revenue = wonThisMonth.reduce((sum, d) => sum + (d.value || 0), 0)
  const pipelineValue = deals
    .filter(d => !['won', 'lost', 'delivering', 'completed'].includes(d.status))
    .reduce((sum, d) => sum + (d.value || 0), 0)
  const wonCount = deals.filter(d => d.status === 'won').length
  const lostCount = deals.filter(d => d.status === 'lost').length
  const closedCount = wonCount + lostCount
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0

  // Experiences
  const experiences = experiencesRes.data || []
  const upcoming = experiences.filter(e => e.status === 'upcoming').length

  // Attendees: repeat rate
  const attendees = attendeesRes.data || []
  const attendeeCounts = {}
  attendees.forEach(a => { if (a.contact_id) attendeeCounts[a.contact_id] = (attendeeCounts[a.contact_id] || 0) + 1 })
  const totalUnique = Object.keys(attendeeCounts).length
  const repeats = Object.values(attendeeCounts).filter(c => c >= 2).length
  const repeatRate = totalUnique > 0 ? Math.round((repeats / totalUnique) * 100) : 0

  // Support: followup completion
  const followupItems = checklistRes.data || []
  const followupTotal = followupItems.length
  const followupDone = followupItems.filter(i => i.completed).length
  const followupPct = followupTotal > 0 ? Math.round((followupDone / followupTotal) * 100) : 100

  // Onboard: ecosystem progress
  const ecoItems = ecosystemRes.data || []
  const ecoTotal = ecoItems.length
  const ecoDone = ecoItems.filter(i => i.completed).length
  const ecoPct = ecoTotal > 0 ? Math.round((ecoDone / ecoTotal) * 100) : 0

  // ─── Build node objects ───────────────────────────────────────────────

  const nodeValues = {
    awareness:      { raw: contentCount,   headline: `${contentCount} posts`,        label: 'this week' },
    contact:        { raw: warmLeads,      headline: `${warmLeads} leads`,           label: 'warm' },
    outreach:       { raw: reachedOut,     headline: `${reachedOut} reached`,        label: 'out' },
    conversation:   { raw: inConversation, headline: `${inConversation} active`,     label: 'conversations' },
    qualified:      { raw: pipelineValue,  headline: `$${pipelineValue.toLocaleString()}`, label: 'pipeline' },
    meeting_booked: { raw: meetingBooked,  headline: `${meetingBooked} booked`,      label: 'meetings' },
    close:          { raw: winRate,        headline: `$${revenue.toLocaleString()}`,  label: `${winRate}% win rate` },
    onboard:        { raw: ecoPct,         headline: `${ecoPct}%`,                   label: 'systems set up' },
    deliver:        { raw: upcoming,       headline: `${upcoming} upcoming`,         label: 'experiences' },
    support:        { raw: followupPct,    headline: `${followupPct}%`,              label: 'follow-up done' },
    retain:         { raw: repeatRate,     headline: `${repeatRate}%`,               label: 'repeat rate' },
  }

  return PIPELINE_NODES.map(node => ({
    key: node.key,
    label: node.label,
    headline_value: nodeValues[node.key].headline,
    headline_label: nodeValues[node.key].label,
    status: deriveStatus(nodeValues[node.key].raw, node.thresholds),
    raw: nodeValues[node.key].raw,
  }))
}

// ─── Provider ─────────────────────────────────────────────────────────────

export function PortalProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id

  const [nodes, setNodes] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNodeKey, setSelectedNodeKey] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return }

    const [pipelineData, tasksRes] = await Promise.all([
      fetchPipelineData(userId).catch(err => {
        console.warn('Portal: pipeline fetch failed:', err.message)
        return []
      }),
      supabase.from('portal_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order'),
    ])

    setNodes(pipelineData)
    if (tasksRes.error) console.warn('Portal: tasks fetch failed:', tasksRes.error.message)
    if (tasksRes.data) setTasks(tasksRes.data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(true)
    fetchAll()
  }, [fetchAll])

  // Selection
  const selectedNode = nodes.find(n => n.key === selectedNodeKey) || null
  const nodeTasks = selectedNodeKey
    ? tasks.filter(t => t.node_key === selectedNodeKey)
    : []

  // Actions
  const completeTask = useCallback(async (taskId) => {
    const taskTitle = tasks.find(t => t.id === taskId)?.title
    const taskNodeKey = tasks.find(t => t.id === taskId)?.node_key

    const { error } = await supabase
      .from('portal_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t
      ))
      const { error: actErr } = await supabase.from('portal_activity').insert({
        user_id: userId,
        task_id: taskId,
        node_key: taskNodeKey,
        action: 'task_completed',
        summary: taskTitle,
      })
      if (actErr) console.warn('Portal: activity log failed:', actErr.message)
    }
  }, [userId, tasks])

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

  const selectNode = useCallback((key) => {
    setSelectedNodeKey(prev => prev === key ? null : key)
  }, [])

  return (
    <PortalContext.Provider value={{
      nodes,
      tasks,
      loading,
      selectedNode,
      selectedNodeKey,
      nodeTasks,
      selectNode,
      completeTask,
      reopenTask,
      refresh: fetchAll,
    }}>
      {children}
    </PortalContext.Provider>
  )
}
