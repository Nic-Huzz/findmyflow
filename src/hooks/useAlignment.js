import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Compares what the user's nikigai says (favourite skill clusters)
 * vs what they actually do (completed tasks in last 30 days by skill).
 *
 * Returns: { score, nikigaiSkills, taskSkillCounts, insight, loading }
 */
export function useAlignment(userId) {
  const [data, setData] = useState({ score: null, nikigaiSkills: [], taskSkillCounts: {}, insight: null, loading: true })

  useEffect(() => {
    if (!userId) return
    let active = true

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

    Promise.all([
      // What user says matters: favourite skill clusters with skill_tags
      supabase.from('nikigai_clusters')
        .select('skill_tags')
        .eq('user_id', userId)
        .eq('cluster_type', 'skills')
        .eq('is_favourite', true)
        .not('skill_tags', 'is', null),

      // What user actually does: completed tasks with skill_tags in last 30 days
      supabase.from('quest_tasks')
        .select('skill_tags')
        .eq('user_id', userId)
        .eq('done', true)
        .not('skill_tags', 'is', null)
        .gte('completed_at', thirtyDaysAgo),
    ]).then(([nikigaiRes, taskRes]) => {
      if (!active) return

      // Extract unique nikigai skills
      const nikigaiSkills = [...new Set(
        (nikigaiRes.data || []).flatMap(c => c.skill_tags || [])
      )]

      // Count task skills
      const taskSkillCounts = {}
      ;(taskRes.data || []).forEach(t => {
        (t.skill_tags || []).forEach(skill => {
          taskSkillCounts[skill] = (taskSkillCounts[skill] || 0) + 1
        })
      })

      const totalTasks = Object.values(taskSkillCounts).reduce((a, b) => a + b, 0)

      if (totalTasks < 5 || nikigaiSkills.length === 0) {
        setData({ score: null, nikigaiSkills, taskSkillCounts, insight: null, loading: false })
        return
      }

      const alignedTasks = nikigaiSkills.reduce((sum, skill) =>
        sum + (taskSkillCounts[skill] || 0), 0)
      const score = Math.round((alignedTasks / totalTasks) * 100)

      // Find the most-used skill that ISN'T in nikigai
      const nonNikigaiSkills = Object.entries(taskSkillCounts)
        .filter(([skill]) => !nikigaiSkills.includes(skill))
        .sort((a, b) => b[1] - a[1])
      const topDrift = nonNikigaiSkills[0]

      let insight = null
      if (score < 40 && topDrift) {
        insight = `Most of your recent work uses ${topDrift[0].replace('_', ' ')}. Your nikigai says ${nikigaiSkills.slice(0, 2).join(' and ').replace(/_/g, ' ')} light you up. Are you drifting?`
      } else if (score >= 40 && score < 70) {
        insight = `Mixed alignment. Some of your work matches your nikigai, some doesn't.`
      } else if (score >= 70) {
        insight = `Strongly aligned. Your actions match your self-knowledge.`
      }

      setData({ score, nikigaiSkills, taskSkillCounts, insight, loading: false })
    }).catch(err => {
      console.warn('Alignment fetch error:', err)
      if (active) setData(prev => ({ ...prev, loading: false }))
    })

    return () => { active = false }
  }, [userId])

  return data
}
