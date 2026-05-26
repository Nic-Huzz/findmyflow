/**
 * useExperiencePipeline.js — Compute 5-node Growth Line for a specific experience
 *
 * Fetches per-experience data and computes:
 *   Attract (content posted), Capture (leads tagged), Convert (booked + revenue),
 *   Deliver (checklist + countdown), Grow (follow-up + repeat rate)
 *
 * Each node: { key, label, value, sublabel, status, readinessPercent }
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

// Module completion checks — which flows/tables indicate a module is done
const MODULE_CHECKS = {
  // Attract modules
  leads_strategy: (data) => data.flowSessions?.some(f => f.flow_type === 'leads_strategy'),
  blow_up_brand: (data) => !!data.remarkableAngle,
  validation: (data) => data.flowSessions?.some(f => f.flow_type === 'persona_selection'),
  // Capture modules
  attraction_offer: (data) => data.flowSessions?.some(f => f.flow_type === 'attraction_offer'),
  lead_magnet: (data) => data.products?.some(p => p.money_model_tier === 'attraction'),
  funnel_builder: (data) => data.flowSessions?.some(f => f.flow_type === 'funnel_builder'),
  // Convert modules
  grand_slam: (data) => data.flowSessions?.some(f => f.flow_type === 'grand_slam_offer'),
  offer_builder: (data) => data.flowSessions?.some(f => f.flow_type === '100m_offer'),
  product_selection: (data) => data.flowSessions?.some(f => f.flow_type === 'product_selection'),
  launch_readiness: (data) => data.flowSessions?.some(f => f.flow_type === 'launch_readiness'),
  // Deliver modules
  journey_designer: (data) => data.blueprints?.length > 0,
  testing: (data) => data.flowSessions?.some(f => f.flow_type === 'mvp_readiness'),
  // Grow modules
  upsell: (data) => data.flowSessions?.some(f => f.flow_type === 'upsell_offer'),
  downsell: (data) => data.flowSessions?.some(f => f.flow_type === 'downsell_offer'),
  continuity: (data) => data.flowSessions?.some(f => f.flow_type === 'continuity_offer'),
  scale_income: (data) => data.products?.filter(p => p.money_model_tier).length >= 3,
}

function deriveStatus(value, thresholds) {
  if (value >= thresholds.good) return 'good'
  if (value >= thresholds.warn) return 'warn'
  return 'bad'
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function useExperiencePipeline(experienceId) {
  const { user } = useAuth()
  const userId = user?.id

  const [nodes, setNodes] = useState([])
  const [checklists, setChecklists] = useState({})
  const [wahoos, setWahoos] = useState([])
  const [moduleData, setModuleData] = useState({})
  const [experience, setExperience] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPipeline = useCallback(async () => {
    if (!userId || !experienceId) { setLoading(false); return }

    try {
    const [
      expRes, contentRes, contactsRes, attendeesRes, dealsRes,
      checklistRes, wahoosRes, flowsRes, productsRes, remarkableRes, blueprintRes,
    ] = await Promise.all([
      // Experience details
      supabase.from('experiences').select('*').eq('id', experienceId).single(),
      // Attract: content for this event
      supabase.from('content_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('experience_id', experienceId),
      // Capture: leads tagged to this event
      supabase.from('contact_experiences')
        .select('id', { count: 'exact', head: true })
        .eq('experience_id', experienceId).eq('user_id', userId),
      // Convert: attendees
      supabase.from('experience_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('experience_id', experienceId)
        .eq('user_id', userId),
      // Convert: revenue
      supabase.from('sales_deals')
        .select('value, status')
        .eq('experience_id', experienceId).eq('user_id', userId),
      // Checklists
      supabase.from('experience_checklist_items')
        .select('section, completed')
        .eq('experience_id', experienceId)
        .eq('user_id', userId),
      // Wahoos (courage challenges linked to experience)
      supabase.from('groan_challenges')
        .select('*')
        .eq('experience_id', experienceId).eq('user_id', userId)
        .order('created_at', { ascending: false }),
      // Module completion: flow sessions
      supabase.from('flow_sessions')
        .select('flow_type')
        .eq('user_id', userId),
      // Module completion: products
      supabase.from('products')
        .select('money_model_tier')
        .eq('user_id', userId),
      // Module completion: remarkable angle
      supabase.from('remarkable_angles')
        .select('id')
        .eq('user_id', userId)
        .limit(1),
      // Module completion: journey blueprints
      supabase.from('experience_blueprints')
        .select('id')
        .eq('experience_id', experienceId)
        .limit(1),
    ])

    // Log any query errors
    ;[expRes, contentRes, contactsRes, attendeesRes, dealsRes, checklistRes, wahoosRes, flowsRes, productsRes, remarkableRes, blueprintRes]
      .forEach((res, i) => { if (res.error) console.warn(`Pipeline query ${i} failed:`, res.error.message) })

    const exp = expRes.data
    setExperience(exp)
    if (!exp || expRes.error) { setLoading(false); return }

    // Module check data
    const mData = {
      flowSessions: flowsRes.data || [],
      products: productsRes.data || [],
      remarkableAngle: remarkableRes.data?.length > 0,
      blueprints: blueprintRes.data || [],
    }
    setModuleData(mData)

    // Checklists by section
    const clItems = checklistRes.data || []
    const cl = {}
    clItems.forEach(item => {
      if (!cl[item.section]) cl[item.section] = { total: 0, done: 0 }
      cl[item.section].total++
      if (item.completed) cl[item.section].done++
    })
    setChecklists(cl)

    // Wahoos
    setWahoos(wahoosRes.data || [])

    // Compute nodes
    const contentCount = contentRes.count || 0
    const captureCount = contactsRes.count || 0
    const attendeeCount = attendeesRes.count || 0
    const deals = dealsRes.data || []
    const revenue = deals.filter(d => ['won', 'delivering', 'completed'].includes(d.status))
      .reduce((sum, d) => sum + (d.value || 0), 0)

    const marketingCl = cl.marketing || { total: 0, done: 0 }
    const orgCl = cl.organisation || { total: 0, done: 0 }
    const followupCl = cl.followup || { total: 0, done: 0 }

    const marketingPct = marketingCl.total > 0 ? Math.round(marketingCl.done / marketingCl.total * 100) : 0
    const orgPct = orgCl.total > 0 ? Math.round(orgCl.done / orgCl.total * 100) : 0
    const followupPct = followupCl.total > 0 ? Math.round(followupCl.done / followupCl.total * 100) : 0

    // Module readiness per node
    const attractModules = ['leads_strategy', 'blow_up_brand', 'validation']
    const captureModules = ['attraction_offer', 'lead_magnet', 'funnel_builder']
    const convertModules = ['grand_slam', 'offer_builder', 'product_selection', 'launch_readiness']
    const deliverModules = ['journey_designer', 'testing']
    const growModules = ['upsell', 'downsell', 'continuity', 'scale_income']

    function moduleReadiness(keys) {
      const done = keys.filter(k => MODULE_CHECKS[k]?.(mData)).length
      return keys.length > 0 ? Math.round(done / keys.length * 100) : 0
    }

    const days = daysUntil(exp?.experience_date)
    const isPast = exp?.status === 'completed' || exp?.status === 'archived'

    setNodes([
      {
        key: 'attract',
        label: 'Attract',
        value: String(contentCount),
        sublabel: 'posts',
        status: deriveStatus(contentCount, { good: 3, warn: 1 }),
        readinessPercent: Math.round((marketingPct + moduleReadiness(attractModules)) / 2),
      },
      {
        key: 'capture',
        label: 'Capture',
        value: String(captureCount),
        sublabel: 'leads',
        status: deriveStatus(captureCount, { good: 10, warn: 3 }),
        readinessPercent: moduleReadiness(captureModules),
      },
      {
        key: 'convert',
        label: 'Convert',
        value: attendeeCount > 0 ? String(attendeeCount) : '0',
        sublabel: revenue > 0 ? `$${revenue.toLocaleString()}` : 'booked',
        status: deriveStatus(attendeeCount, { good: 5, warn: 1 }),
        readinessPercent: moduleReadiness(convertModules),
        revenue,
        attendeeCount,
      },
      {
        key: 'deliver',
        label: 'Deliver',
        value: days !== null ? `${days}d` : (isPast ? 'Done' : '—'),
        sublabel: isPast ? 'completed' : 'until',
        status: isPast ? 'good' : deriveStatus(orgPct, { good: 70, warn: 30 }),
        readinessPercent: orgPct,
      },
      {
        key: 'grow',
        label: 'Grow',
        value: isPast ? `${followupPct}%` : '—',
        sublabel: isPast ? 'follow-up' : 'after',
        status: isPast ? deriveStatus(followupPct, { good: 80, warn: 50 }) : 'empty',
        readinessPercent: isPast ? Math.round((followupPct + moduleReadiness(growModules)) / 2) : moduleReadiness(growModules),
      },
    ])

    } catch (err) {
      console.warn('Pipeline fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, experienceId])

  useEffect(() => {
    setLoading(true)
    fetchPipeline()
  }, [fetchPipeline])

  // Check if a specific module is complete
  const isModuleComplete = useCallback((moduleKey) => {
    return MODULE_CHECKS[moduleKey]?.(moduleData) ?? false
  }, [moduleData])

  return {
    nodes,
    checklists,
    wahoos,
    experience,
    loading,
    isModuleComplete,
    refresh: fetchPipeline,
  }
}
