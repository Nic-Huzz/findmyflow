/**
 * P&L Service - Profit & Loss data from project_monthly_pnl view
 */
import { supabase } from '../supabaseClient'

/**
 * Fetch P&L data for a user for a given month
 * Uses the project_monthly_pnl database view
 */
export async function fetchProjectPnL(userId, month) {
  const { data, error } = await supabase
    .from('project_monthly_pnl')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)

  if (error) {
    console.error('Error fetching P&L:', error)
    return []
  }

  return (data || []).map(row => ({
    projectId: row.project_id,
    projectName: row.project_name,
    revenue: row.revenue || 0,
    expenses: row.expenses || 0,
    profit: row.profit || 0,
    marginPct: row.margin_pct || 0,
    totalHours: row.total_hours || 0,
    profitPerHour: Math.round(row.profit_per_hour || 0),
  }))
}

/**
 * Get aggregated P&L totals across all projects
 */
export function aggregatePnL(projects) {
  const totals = projects.reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.revenue,
      expenses: acc.expenses + p.expenses,
      profit: acc.profit + p.profit,
      totalHours: acc.totalHours + p.totalHours,
    }),
    { revenue: 0, expenses: 0, profit: 0, totalHours: 0 }
  )

  totals.marginPct = totals.revenue > 0
    ? Math.round((totals.profit / totals.revenue) * 100)
    : 0

  totals.profitPerHour = totals.totalHours > 0
    ? Math.round(totals.profit / totals.totalHours)
    : 0

  return totals
}
