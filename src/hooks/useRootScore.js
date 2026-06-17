/**
 * useRootScore.js — Creator Root score (0-5)
 *
 * "Have you built the machine?"
 *
 * 5 binary existence checks × 1 point each.
 * Ratchets up as infrastructure is built, never drops.
 * Each component maps to a pipeline node for diagnostics.
 *
 * V2: Maintenance layer adds 0-5 more (unlocks at Foundation ≥ 3).
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const ROOT_ITEMS = [
  {
    key: 'blow_up_brand',
    label: 'Blow Up Brand',
    node: 'attract',
    prescription: "You haven't defined what makes you different yet. Complete the Blow Up Brand flow to find your remarkable angle.",
    action: { label: 'Find Your Angle', route: '/create/remarkable' },
  },
  {
    key: 'leads_strategy',
    label: 'Leads Strategy',
    node: 'attract',
    prescription: "You don't know where your people hang out yet. Define your leads strategy so you know where to show up.",
    action: { label: 'Define Strategy', route: '/leads-strategy' },
  },
  {
    key: 'lead_magnet',
    label: 'Lead Magnet',
    node: 'capture',
    prescription: "People see your content but you're not collecting their emails. Build a lead magnet so they can sign up.",
    action: { label: 'Build Lead Magnet', route: '/create/attraction-stack' },
  },
  {
    key: 'offer_built',
    label: 'Offer',
    node: 'convert',
    prescription: "You don't have a packaged offer yet. Create a product people can buy.",
    action: { label: 'Build Your Offer', route: '/product-selection' },
  },
  {
    key: 'contacts',
    label: 'Contacts',
    node: 'grow',
    prescription: "Start building your contacts list. Add the people who come to your experiences so you can follow up.",
    action: { label: 'Add Contacts', route: '/crm/contacts' },
  },
]

export { ROOT_ITEMS }

export default function useRootScore(userId) {
  const [data, setData] = useState({
    root: null,
    breakdown: [],
    lowestGap: null,
    loading: true,
  })

  const calculate = useCallback(async () => {
    if (!userId) return

    try {
      const [
        remarkableRes,
        leadsRes,
        attractionFlowRes,
        attractionProductRes,
        offerRes,
        contactsRes,
      ] = await Promise.all([
        // 1. Blow Up Brand — has remarkable angle?
        supabase.from('remarkable_angles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),

        // 2. Leads Strategy — completed leads strategy flow?
        supabase.from('flow_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('flow_type', 'leads_strategy'),

        // 3a. Lead Magnet — completed attraction_offer flow?
        supabase.from('flow_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('flow_type', 'attraction_offer'),

        // 3b. Lead Magnet — OR has attraction-tier product?
        supabase.from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('money_model_tier', 'attraction'),

        // 4. Offer Built — has any product with money_model_tier?
        supabase.from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('money_model_tier', 'is', null),

        // 5. Contacts — has 10+ contacts?
        supabase.from('crm_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ])

      const checks = {
        blow_up_brand: (remarkableRes.count || 0) > 0,
        leads_strategy: (leadsRes.count || 0) > 0,
        lead_magnet: (attractionFlowRes.count || 0) > 0 || (attractionProductRes.count || 0) > 0,
        offer_built: (offerRes.count || 0) > 0,
        contacts: (contactsRes.count || 0) >= 10,
      }

      const breakdown = ROOT_ITEMS.map(item => ({
        ...item,
        built: checks[item.key],
        points: checks[item.key] ? 1 : 0,
      }))

      const root = breakdown.reduce((sum, item) => sum + item.points, 0)

      // Find lowest gap (first unbuilt item in pipeline order)
      const firstGap = breakdown.find(item => !item.built)
      const lowestGap = firstGap ? {
        key: firstGap.key,
        node: firstGap.node,
        prescription: firstGap.prescription,
        action: firstGap.action,
      } : null

      setData({ root, breakdown, lowestGap, loading: false })

    } catch (err) {
      console.error('useRootScore error:', err)
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [userId])

  useEffect(() => {
    calculate()
  }, [calculate])

  return { ...data, refresh: calculate }
}
