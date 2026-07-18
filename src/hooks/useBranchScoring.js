/**
 * useBranchScoring - Computes a user's branch profile from their data across the app.
 *
 * Sources (weighted by signal strength — action + wounds > curiosity > skills > history):
 *   - Favourited problem clusters (categoryId)  ×3.0  (wounds are unambiguous)
 *   - Active quests at vibe state               ×3.0  (what you're building + feels alive)
 *   - Curiosity clusters (branch field)         ×2.0  (could be hobby, not work)
 *   - Active quests at other state              ×2.0  (building but not lit up)
 *   - Favourited skill clusters (keywords)      ×2.0  (how you operate)
 *   - Life path careers                         ×2.0  (overlaps with quests)
 *   - Non-favourite problem clusters            ×1.0  (present, not prioritized)
 *   - Non-favourite skill clusters              ×0.5  (weakest signal)
 *
 * Output: { primary, secondary, tertiary, scores, gap, rarity, branchSpread }
 *
 * NOTE: SD level assessment was explored but removed — depth_level measures skill
 * progression, not value systems. See docs/features/personal-monopoly-finder.md
 * appendix for the exploration notes if we revisit.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import careerModelsData from '../../public/data/careerModels.json'

// Problem categoryId → branch mapping (from wheel taxonomy)
const PROBLEM_BRANCH_MAP = {
  voice_taken: ['healing', 'bonds'],
  pain_not_believed: ['healing'],
  kids_deserved_better: ['healing', 'bonds'],
  work_hollows: ['healing', 'movement'],
  forgot_what_for: ['healing', 'story'],
  life_not_yours: ['healing', 'status'],
  feeling_stupid: ['tools', 'status'],
  locked_out: ['bonds', 'shelter'],
  stopped_wondering: ['healing', 'tools', 'story'],
  work_treated_nothing: ['status'],
  left_behind: ['bonds'],
  world_losing: ['fire', 'threat'],
}

// Career label → branch keyword matching
const CAREER_BRANCH_KEYWORDS = {
  healing: ['coach', 'therapist', 'healer', 'breathwork', 'wellness', 'nervous system', 'transformation', 'workshop facilitator', 'personal transformation'],
  story: ['teacher', 'speaker', 'writer', 'content', 'keynote', 'author', 'storytell', 'seminar', 'curriculum', 'education'],
  tools: ['developer', 'engineer', 'builder', 'coder', 'software', 'tech', 'ai ', 'coding', 'startup'],
  bonds: ['event', 'host', 'facilitator', 'community', 'festival', 'retreat', 'circle', 'gathering'],
  movement: ['athlete', 'fitness', 'movement', 'dance', 'sport', 'physical', 'travel', 'tuk tuk', 'game host'],
  status: ['designer', 'brand', 'stylist', 'creative', 'fashion', 'luxury', 'image'],
  nourishment: ['chef', 'nutrition', 'farm', 'food', 'cook', 'diet', 'restaurant'],
  shelter: ['architect', 'property', 'interior', 'real estate', 'housing', 'building'],
  fire: ['energy', 'sustainability', 'climate', 'solar', 'power'],
  threat: ['security', 'police', 'military', 'safety', 'defense'],
}

// Skill cluster label → branch keyword matching
const SKILL_BRANCH_KEYWORDS = {
  healing: ['transform', 'healing', 'emotional', 'subconscious', 'alchemist', 'nervous system', 'therapy'],
  movement: ['movement', 'dance', 'embodied', 'physical', 'play', 'sport', 'presence'],
  bonds: ['community', 'experience', 'facilitat', 'event', 'catalyst', 'joy', 'connect'],
  story: ['storytell', 'teaching', 'writing', 'present', 'speak', 'narrative', 'guide'],
  tools: ['build', 'innovation', 'startup', 'coding', 'visionary', 'architect', 'creator'],
  status: ['brand', 'design', 'creative', 'identity', 'style'],
  nourishment: ['nutrition', 'food', 'chef', 'cook'],
  shelter: ['architect', 'space', 'interior'],
  fire: ['energy', 'sustainability'],
  threat: ['security', 'resilience', 'protect'],
}

function matchCareerToBranches(label) {
  if (!label) return []
  const lower = label.toLowerCase()
  const matches = []
  for (const [branch, keywords] of Object.entries(CAREER_BRANCH_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matches.push(branch)
    }
  }
  return matches.length > 0 ? matches : ['default']
}

function matchSkillToBranches(label) {
  if (!label) return []
  const lower = label.toLowerCase()
  const matches = []
  for (const [branch, keywords] of Object.entries(SKILL_BRANCH_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matches.push(branch)
    }
  }
  return matches
}

export function useBranchScoring() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState({})

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }

    async function compute() {
      try {
        // Parallel data fetch
        const [curiosityRes, questsRes, nikigaiRes, lifePathRes] = await Promise.all([
          supabase.from('curiosity_clusters')
            .select('branch, cluster_name')
            .eq('user_id', user.id)
            .not('branch', 'is', null)
            .neq('branch', 'default'),
          supabase.from('quests')
            .select('id, label, predicted_state, depth_level, status, skill_tags, branch')
            .eq('user_id', user.id)
            .in('status', ['active', 'completed']),
          supabase.from('nikigai_clusters')
            .select('cluster_type, cluster_label, is_favourite, items')
            .eq('user_id', user.id),
          user.email
            ? supabase.from('life_path_sessions')
                .select('careers, current_career')
                .eq('client_email', user.email)
                .order('created_at', { ascending: false })
                .limit(1)
            : Promise.resolve({ data: [] }),
        ])

        const curiosity = curiosityRes.data || []
        const quests = questsRes.data || []
        const nikigai = nikigaiRes.data || []
        const lifePaths = lifePathRes.data || []

        // ── Score accumulation ──
        const scores = {}
        const ALL_BRANCHES = ['movement', 'nourishment', 'tools', 'status', 'bonds', 'shelter', 'story', 'fire', 'healing', 'threat']
        ALL_BRANCHES.forEach(b => { scores[b] = 0 })

        const addScore = (branch, weight) => {
          if (branch && scores[branch] !== undefined) scores[branch] += weight
        }

        // Weighting principle: action + wounds > curiosity > skills > history
        // Wounds are "unambiguous, strongest taxonomy" (MasterMind Council)
        // What you DO outweighs what you READ ABOUT

        // 1. Curiosity clusters (×2 — could be hobby interest, not work direction)
        const curiosityByBranch = {}
        curiosity.forEach(c => {
          curiosityByBranch[c.branch] = (curiosityByBranch[c.branch] || 0) + 1
          addScore(c.branch, 2)
        })

        // 2. Life path careers (×2 — overlaps with quests, don't double-count)
        const rawCareers = lifePaths[0]?.careers
        const careers = Array.isArray(rawCareers) ? rawCareers : []
        careers.forEach(career => {
          if (!career?.label) return
          const branches = matchCareerToBranches(career.label)
          const weight = career.predictedState === 'vibe' ? 2 : 1.5
          branches.forEach(b => addScore(b, weight))
        })

        // 3. Active quests (×3 vibe, ×2 other — what you're building is strongest action signal)
        // Use quest.branch field (AI-classified) when available, fall back to label keyword matching
        quests.forEach(q => {
          if (q.status !== 'active') return // only score active quests for base signal
          const branches = q.branch ? [q.branch] : matchCareerToBranches(q.label)
          const weight = q.predicted_state === 'vibe' ? 3 : 2
          branches.forEach(b => addScore(b, weight))
        })

        // 4. Nikigai clusters (problems ×3 fav / ×1 non-fav, skills ×2 fav / ×0.5 non-fav)
        nikigai.forEach(n => {
          if (n.cluster_type === 'problems') {
            // Extract categoryId from items
            let categoryId = null
            try {
              const items = typeof n.items === 'string' ? JSON.parse(n.items) : n.items
              categoryId = items?.[0]?.categoryId
            } catch (e) { /* ignore */ }

            const branches = categoryId ? (PROBLEM_BRANCH_MAP[categoryId] || []) : []
            const weight = n.is_favourite ? 3 : 1
            branches.forEach(b => addScore(b, weight))
          }

          if (n.cluster_type === 'skills') {
            const branches = matchSkillToBranches(n.cluster_label)
            const weight = n.is_favourite ? 2 : 0.5
            branches.forEach(b => addScore(b, weight))
          }
        })

        // ── Rank branches ──
        const ranked = ALL_BRANCHES
          .map(b => ({ branch: b, score: Math.round(scores[b] * 10) / 10 }))
          .filter(b => b.score > 0)
          .sort((a, b) => b.score - a.score)

        const primary = ranked[0] || null
        const secondary = ranked[1] || null
        const tertiary = ranked[2]?.score > (primary?.score || 0) * 0.3 ? ranked[2] : null
        const branchSpread = ranked.length

        // ── Gap insight ──
        // Compare curiosity-dominant branch vs quest-dominant branch
        const curiosityTop = Object.entries(curiosityByBranch)
          .sort(([, a], [, b]) => b - a)[0]?.[0]

        const questBranches = {}
        quests.forEach(q => {
          matchCareerToBranches(q.label).forEach(b => {
            if (b !== 'default') questBranches[b] = (questBranches[b] || 0) + 1
          })
        })
        const questTop = Object.entries(questBranches)
          .sort(([, a], [, b]) => b - a)[0]?.[0]

        let gap = null
        if (curiosityTop && questTop && curiosityTop !== questTop) {
          gap = {
            curiosityBranch: curiosityTop,
            actionBranch: questTop,
            insight: `Your curiosities cluster in ${curiosityTop}. Your active quests point to ${questTop}. ${curiosityTop.charAt(0).toUpperCase() + curiosityTop.slice(1)} may be your vehicle, ${questTop} your territory.`
          }
        }

        // ── Taxonomy extraction (prioritise favourited clusters) ──
        // Skills: extract taxonomy IDs, favourited clusters first
        const favouritedSkills = nikigai.filter(n => n.cluster_type === 'skills' && n.is_favourite)
        const otherSkills = nikigai.filter(n => n.cluster_type === 'skills' && !n.is_favourite)
        const orderedSkillClusters = [...favouritedSkills, ...otherSkills]
        const userSkillIds = orderedSkillClusters.flatMap(n => {
          try {
            const items = typeof n.items === 'string' ? JSON.parse(n.items) : n.items
            return (items || []).map(i => i.category).filter(Boolean)
          } catch { return [] }
        })

        // Problems: extract taxonomy IDs, favourited clusters first
        const favouritedProblems = nikigai.filter(n => n.cluster_type === 'problems' && n.is_favourite)
        const otherProblems = nikigai.filter(n => n.cluster_type === 'problems' && !n.is_favourite)
        const orderedProblemClusters = [...favouritedProblems, ...otherProblems]
        const userProblemIds = orderedProblemClusters.flatMap(n => {
          try {
            const items = typeof n.items === 'string' ? JSON.parse(n.items) : n.items
            return (items || []).map(i => i.categoryId).filter(Boolean)
          } catch { return [] }
        })

        // Pick top skill + problem by weighted frequency (favourites count 3x)
        const skillCounts = {}
        orderedSkillClusters.forEach(n => {
          const w = n.is_favourite ? 3 : 1
          try {
            const items = typeof n.items === 'string' ? JSON.parse(n.items) : n.items
            ;(items || []).forEach(i => {
              if (i.category) skillCounts[i.category] = (skillCounts[i.category] || 0) + w
            })
          } catch {}
          // Also keyword-match the cluster LABEL to skill taxonomy (for freeform favourited clusters)
          if (n.is_favourite && n.cluster_label) {
            const matchedSkills = matchSkillToBranches(n.cluster_label)
            // Map branch matches back to skill taxonomy where possible
            const labelLower = (n.cluster_label || '').toLowerCase()
            const skillKeywordMap = {
              storytelling: ['storytell', 'narrative', 'writing', 'author'],
              teaching: ['teach', 'mentor', 'educat', 'guide', 'illuminat'],
              coaching: ['coach', 'transform', 'alchemist', 'facilitat', 'catalyst'],
              performing: ['perform', 'present', 'dance', 'movement', 'embodi', 'expression', 'play'],
              creating: ['creat', 'design', 'innovat', 'architect', 'build'],
              building: ['build', 'startup', 'visionary', 'engineer', 'code'],
              leading: ['lead', 'found', 'direct'],
              connecting: ['connect', 'communit', 'network', 'gather'],
              speaking_up: ['speak', 'voice', 'advocate', 'authentic'],
              designing: ['design', 'brand', 'style', 'aesthetic'],
            }
            for (const [skill, kws] of Object.entries(skillKeywordMap)) {
              if (kws.some(kw => labelLower.includes(kw))) {
                skillCounts[skill] = (skillCounts[skill] || 0) + w
              }
            }
          }
        })

        const problemCounts = {}
        orderedProblemClusters.forEach(n => {
          const w = n.is_favourite ? 3 : 1
          try {
            const items = typeof n.items === 'string' ? JSON.parse(n.items) : n.items
            ;(items || []).forEach(i => {
              if (i.categoryId) problemCounts[i.categoryId] = (problemCounts[i.categoryId] || 0) + w
            })
          } catch {}
        })

        // ── Persona extraction (keyword-match freeform cluster labels to 12 segments) ──
        const personaClusters = nikigai.filter(n => n.cluster_type === 'persona')
        const personaKeywords = {
          seekers: ['seek', 'lost', 'search', 'finding', 'direction', 'limbo', 'transition', 'clarity'],
          builders: ['build', 'creat', 'architect', 'launch', 'entrepreneur', 'startup', 'innovat'],
          healers: ['heal', 'wound', 'recover', 'pain', 'trauma', 'broken', 'mend'],
          teachers: ['teach', 'learn', 'student', 'mentor', 'educat', 'knowledge', 'grow'],
          connectors: ['connect', 'belong', 'community', 'network', 'relationship', 'tribe'],
          achievers: ['achiev', 'success', 'perform', 'ambiti', 'driven', 'corporate', 'profession'],
          explorers: ['explor', 'adventure', 'freedom', 'travel', 'discover', 'wander'],
          visionaries: ['vision', 'impact', 'change', 'world', 'transform', 'movement', 'leader'],
          protectors: ['protect', 'safe', 'secur', 'guardian', 'defend', 'shield'],
          creators: ['artist', 'express', 'creative', 'voice', 'authentic', 'original'],
          nurturers: ['nurtur', 'care', 'support', 'empath', 'compassion', 'hold space'],
          challengers: ['challeng', 'justice', 'fight', 'rights', 'activist', 'rebel'],
        }

        const personaScores = {}
        personaClusters.forEach(n => {
          const label = (n.cluster_label || '').toLowerCase()
          const weight = n.is_favourite ? 2 : 1
          for (const [persona, keywords] of Object.entries(personaKeywords)) {
            // Count how many keywords match (more hits = stronger signal)
            const hits = keywords.filter(kw => label.includes(kw)).length
            if (hits > 0) {
              personaScores[persona] = (personaScores[persona] || 0) + (hits * weight)
            }
          }
        })
        const topPersona = Object.entries(personaScores).sort(([,a],[,b]) => b - a)[0]?.[0]

        // ── Monopoly rarity (exact combination: skill × problem × persona) ──
        // 10 skills × 12 problems × 12 personas = 1,440 positions vs 299 profiles
        let rarity = null
        const topSkill = Object.entries(skillCounts).sort(([,a],[,b]) => b - a)[0]?.[0]
        const topProblem = Object.entries(problemCounts).sort(([,a],[,b]) => b - a)[0]?.[0]
        if (topSkill && topProblem) {
          const profiles = careerModelsData?.profiles || []
          const exactMatches = profiles.filter(p => {
            const hasSkill = (p.primarySkills || []).includes(topSkill)
            const hasProblem = p.primaryProblem === topProblem
            const hasPersona = topPersona ? p.primaryPersona === topPersona : true
            return hasSkill && hasProblem && hasPersona
          })

          // If no exact matches, find nearest (share 2 of 3 dimensions)
          let displayMatches = exactMatches.slice(0, 3)
          if (displayMatches.length === 0) {
            const nearMisses = profiles
              .map(p => {
                let overlap = 0
                if ((p.primarySkills || []).includes(topSkill)) overlap++
                if (p.primaryProblem === topProblem) overlap++
                if (topPersona && p.primaryPersona === topPersona) overlap++
                return { ...p, overlap }
              })
              .filter(p => p.overlap >= 2)
              .sort((a, b) => b.overlap - a.overlap)
              .slice(0, 3)
            displayMatches = nearMisses
          }

          rarity = {
            totalProfiles: profiles.length,
            matchCount: exactMatches.length,
            topSkill,
            topProblem,
            topPersona: topPersona || null,
            dimensions: topPersona ? 3 : 2,
            topMatches: displayMatches.map(m => ({ name: m.name, domain: m.domain })),
          }
        }

        // ── Data completeness ──
        const dataSources = {
          curiosity: curiosity.length > 0,
          lifePaths: careers.length > 0,
          quests: quests.length > 0,
          nikigaiProblems: nikigai.some(n => n.cluster_type === 'problems'),
          nikigaiSkills: nikigai.some(n => n.cluster_type === 'skills'),
        }
        const completeness = Object.values(dataSources).filter(Boolean).length
        const confidence = Math.min(60 + completeness * 8, 92) // 60% base, +8% per source, max 92%

        setResult({
          primary,
          secondary,
          tertiary,
          scores: ranked,
          gap,
          branchSpread,
          curiosityByBranch,
          rarity,
          dataSources,
          confidence,
        })
      } catch (err) {
        console.error('Branch scoring error:', err)
        setResult({})
      } finally {
        setLoading(false)
      }
    }

    compute()
  }, [user?.id])

  return { loading, ...result }
}
