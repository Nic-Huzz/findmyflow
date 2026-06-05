/**
 * useExperiencePipeline.js — Compute 5-node Growth Line for a specific experience
 *
 * Primary data source: pipeline_metrics (manual user-reported numbers)
 * Fallback: in-app data (content_history, contact_experiences, etc.)
 *
 * Node definitions (Hormozi framework):
 *   Attract = eyeballs (reach across all methods)
 *   Capture = clicked the link (signups/interest)
 *   Convert = bought a ticket (paid attendees + revenue)
 *   Deliver = showed up (actual attendance) + readiness checklist
 *   Grow = follow-up actions post-event
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
  grand_slam: (data) => data.flowSessions?.some(f => f.flow_type === 'grand_slam_offer' || f.flow_type === 'offer_builder_v2'),
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
      expRes, metricsRes, contentRes, contactsRes, attendeesRes, dealsRes,
      checklistRes, wahoosRes, flowsRes, productsRes, remarkableRes, blueprintRes,
    ] = await Promise.all([
      // Experience details
      supabase.from('experiences').select('*').eq('id', experienceId).single(),
      // Manual pipeline metrics (primary source)
      supabase.from('pipeline_metrics')
        .select('node, method, metric_key, metric_value, partner_name')
        .eq('experience_id', experienceId)
        .eq('user_id', userId),
      // Fallback: Attract content for this event
      supabase.from('content_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('experience_id', experienceId),
      // Fallback: Capture leads tagged to this event
      supabase.from('contact_experiences')
        .select('id', { count: 'exact', head: true })
        .eq('experience_id', experienceId).eq('user_id', userId),
      // Fallback: Convert attendees
      supabase.from('contact_experiences')
        .select('id', { count: 'exact', head: true })
        .eq('experience_id', experienceId)
        .eq('user_id', userId)
        .eq('role', 'attendee'),
      // Fallback: Convert revenue
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
    ;[expRes, metricsRes, contentRes, contactsRes, attendeesRes, dealsRes, checklistRes, wahoosRes, flowsRes, productsRes, remarkableRes, blueprintRes]
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

    // Aggregate manual pipeline metrics by node
    const metrics = metricsRes.data || []
    const metricSum = (node, key) => metrics
      .filter(m => m.node === node && m.metric_key === key)
      .reduce((sum, m) => sum + Number(m.metric_value || 0), 0)
    const nodeHasMetrics = (node) => metrics.some(m => m.node === node)

    // Attract: total reach across all methods (manual), fallback to content_history count
    const attractReach = metricSum('attract', 'reach')
    const attractPosts = metricSum('attract', 'posts')
    const attractTotal = attractReach > 0 ? attractReach : attractPosts
    const contentCount = contentRes.count || 0
    const attractValue = nodeHasMetrics('attract') ? attractTotal : contentCount
    const attractSublabel = nodeHasMetrics('attract') ? (attractReach ? 'reach' : 'posts') : 'posts'

    // Capture: manual clicks/signups, fallback to contact_experiences count
    const captureManual = metricSum('capture', 'clicks') + metricSum('capture', 'signups')
    const captureCount = contactsRes.count || 0
    const captureValue = nodeHasMetrics('capture') ? captureManual : captureCount

    // Convert: manual tickets + revenue, fallback to contact_experiences attendees + deals
    const convertTickets = metricSum('convert', 'tickets')
    const convertRevenue = metricSum('convert', 'revenue')
    const attendeeCount = attendeesRes.count || 0
    const deals = dealsRes.data || []
    const dealsRevenue = deals.filter(d => ['won', 'delivering', 'completed'].includes(d.status))
      .reduce((sum, d) => sum + (d.value || 0), 0)
    const finalTickets = nodeHasMetrics('convert') ? convertTickets : attendeeCount
    const finalRevenue = nodeHasMetrics('convert') ? convertRevenue : dealsRevenue

    // Deliver: manual showed_up count, fallback to contact_experiences attended count
    const deliverShowedUp = metricSum('deliver', 'showed_up')

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
        value: String(attractValue),
        sublabel: attractSublabel,
        status: deriveStatus(attractValue, { good: 100, warn: 10 }),
        readinessPercent: Math.round((marketingPct + moduleReadiness(attractModules)) / 2),
        hasManualMetrics: nodeHasMetrics('attract'),
      },
      {
        key: 'capture',
        label: 'Capture',
        value: String(captureValue),
        sublabel: 'signups',
        status: deriveStatus(captureValue, { good: 20, warn: 5 }),
        readinessPercent: moduleReadiness(captureModules),
        hasManualMetrics: nodeHasMetrics('capture'),
      },
      {
        key: 'convert',
        label: 'Convert',
        value: String(finalTickets),
        sublabel: finalRevenue > 0 ? `$${finalRevenue.toLocaleString()}` : 'tickets',
        status: deriveStatus(finalTickets, { good: 10, warn: 3 }),
        readinessPercent: moduleReadiness(convertModules),
        revenue: finalRevenue,
        attendeeCount: finalTickets,
        hasManualMetrics: nodeHasMetrics('convert'),
      },
      {
        key: 'deliver',
        label: 'Deliver',
        value: isPast
          ? (deliverShowedUp > 0 ? String(deliverShowedUp) : (attendeeCount > 0 ? String(attendeeCount) : 'Done'))
          : (days !== null ? `${days}d` : '—'),
        sublabel: isPast ? 'showed up' : 'until',
        status: isPast ? 'good' : deriveStatus(orgPct, { good: 70, warn: 30 }),
        readinessPercent: orgPct,
        hasManualMetrics: nodeHasMetrics('deliver'),
      },
      {
        key: 'grow',
        label: 'Grow',
        value: isPast ? `${followupPct}%` : '—',
        sublabel: isPast ? 'follow-up' : 'after',
        status: isPast ? deriveStatus(followupPct, { good: 80, warn: 50 }) : 'empty',
        readinessPercent: isPast ? Math.round((followupPct + moduleReadiness(growModules)) / 2) : moduleReadiness(growModules),
        hasManualMetrics: nodeHasMetrics('grow'),
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
    userId,
    loading,
    isModuleComplete,
    refresh: fetchPipeline,
  }
}

// Utility: save a manual metric
export async function savePipelineMetric(userId, experienceId, { node, method, metric_key, metric_value, partner_name, notes }) {
  const { error } = await supabase.from('pipeline_metrics').insert({
    user_id: userId,
    experience_id: experienceId,
    node,
    method: method || null,
    metric_key,
    metric_value,
    partner_name: partner_name || null,
    notes: notes || null,
  })
  if (error) console.error('Save pipeline metric error:', error)
  return !error
}
