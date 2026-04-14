/**
 * Wheel Alignment & Gap Analysis
 *
 * Calculates cross-wheel alignment scores and identifies gaps/opportunities
 * based on natural relationships between Skills, Problems, and Personas.
 */

import {
  SKILLS_SEGMENTS,
  PROBLEM_SEGMENTS,
  PERSONA_SEGMENTS,
  PROFICIENCY_RINGS,
  PROBLEMS_PROFICIENCY_RINGS,
  JOURNEY_STAGES,
  findSkillSegment,
  resolveSkillId,
  findProblemSegment,
  resolveProblemId,
} from './wheelTaxonomy'
import careerModelsData from '../../public/data/careerModels.json'

// ============================================================================
// CROSS-WHEEL ALIGNMENT MAPPINGS
// Defines natural relationships between segments across wheels
// ============================================================================

/**
 * Skills → Problems mapping
 * Which problem domains naturally benefit from which skills?
 *
 * Format: { skillId: [problemId, problemId, ...] }
 *
 * Logic: "If you have THIS skill, you can help with THESE problems"
 */
export const SKILLS_TO_PROBLEMS = {
  storytelling: ['voice_taken', 'work_treated_nothing', 'forgot_what_for'],
  teaching: ['feeling_stupid', 'locked_out', 'kids_deserved_better'],
  coaching: ['forgot_what_for', 'kids_deserved_better', 'pain_not_believed'],
  performing: ['voice_taken', 'work_treated_nothing', 'work_hollows'],
  creating: ['work_treated_nothing', 'voice_taken', 'stopped_wondering'],
  building: ['locked_out', 'feeling_stupid', 'left_behind'],
  designing: ['work_treated_nothing', 'left_behind', 'feeling_stupid'],
  leading: ['work_hollows', 'left_behind', 'life_not_yours'],
  connecting: ['left_behind', 'forgot_what_for', 'voice_taken'],
  speaking_up: ['life_not_yours', 'voice_taken', 'world_losing'],
}

/**
 * Problems → Personas mapping
 * Which persona types typically face which problems?
 *
 * Format: { problemId: [personaId, personaId, ...] }
 *
 * Logic: "People who care about THIS problem are typically THESE persona types"
 */
export const PROBLEMS_TO_PERSONAS = {
  kids_deserved_better: ['nurturers', 'teachers', 'protectors'],
  voice_taken: ['challengers', 'creators', 'seekers'],
  pain_not_believed: ['healers', 'nurturers', 'protectors'],
  world_losing: ['protectors', 'visionaries', 'challengers'],
  life_not_yours: ['challengers', 'visionaries', 'protectors'],
  feeling_stupid: ['teachers', 'builders', 'seekers'],
  locked_out: ['builders', 'challengers', 'connectors'],
  work_treated_nothing: ['creators', 'explorers', 'visionaries'],
  left_behind: ['connectors', 'nurturers', 'builders'],
  forgot_what_for: ['seekers', 'healers', 'explorers'],
  stopped_wondering: ['seekers', 'visionaries', 'teachers'],
  work_hollows: ['builders', 'explorers', 'achievers'],
}

/**
 * Skills → Personas mapping (direct)
 * Which persona types naturally seek which skills?
 *
 * Format: { skillId: [personaId, personaId, ...] }
 *
 * Logic: "THESE persona types naturally seek out people with THIS skill"
 */
export const SKILLS_TO_PERSONAS = {
  storytelling: ['creators', 'seekers', 'visionaries'],
  teaching: ['seekers', 'teachers', 'builders'],
  coaching: ['healers', 'nurturers', 'seekers'],
  performing: ['creators', 'challengers', 'achievers'],
  creating: ['creators', 'explorers', 'visionaries'],
  building: ['builders', 'visionaries', 'creators'],
  designing: ['creators', 'builders', 'visionaries'],
  leading: ['achievers', 'builders', 'visionaries'],
  connecting: ['connectors', 'seekers', 'nurturers'],
  speaking_up: ['challengers', 'visionaries', 'protectors'],
}

// ============================================================================
// ALIGNMENT SCORE CALCULATION
// ============================================================================

/**
 * Calculate alignment score between user's lit segments across all three wheels
 *
 * @param {Object} wheelData - { skills: [...], problems: [...], personas: [...] }
 *   Each array contains { segmentId, proficiency } objects
 * @returns {Object} - { score, breakdown, strongAlignments, misalignments }
 */
export function calculateAlignmentScore(wheelData) {
  const { skills = [], problems = [], personas = [] } = wheelData

  if (skills.length === 0 && problems.length === 0 && personas.length === 0) {
    return {
      score: 0,
      breakdown: { skillsToProblemScore: 0, problemsToPersonaScore: 0, skillsToPersonaScore: 0 },
      strongAlignments: [],
      misalignments: [],
      opportunities: [],
    }
  }

  // Extract segment IDs
  const skillIds = skills.map(s => s.segmentId)
  const problemIds = problems.map(p => p.segmentId)
  const personaIds = personas.map(p => p.segmentId)

  // Calculate individual alignment scores
  const skillsToProblemScore = calculatePairwiseAlignment(skillIds, problemIds, SKILLS_TO_PROBLEMS)
  const problemsToPersonaScore = calculatePairwiseAlignment(problemIds, personaIds, PROBLEMS_TO_PERSONAS)
  const skillsToPersonaScore = calculatePairwiseAlignment(skillIds, personaIds, SKILLS_TO_PERSONAS)

  // Weighted average (Skills↔Problems is most important)
  const overallScore = Math.round(
    (skillsToProblemScore * 0.4) +
    (problemsToPersonaScore * 0.35) +
    (skillsToPersonaScore * 0.25)
  )

  // Find strong alignments (where all three wheels connect)
  const strongAlignments = findStrongAlignments(skills, problems, personas)

  // Find misalignments (gaps between wheels)
  const misalignments = findMisalignments(skillIds, problemIds, personaIds)

  return {
    score: overallScore,
    breakdown: {
      skillsToProblemScore,
      problemsToPersonaScore,
      skillsToPersonaScore,
    },
    strongAlignments,
    misalignments,
  }
}

/**
 * Calculate pairwise alignment between two sets of segments
 */
function calculatePairwiseAlignment(sourceIds, targetIds, mappingTable) {
  if (sourceIds.length === 0 || targetIds.length === 0) return 0

  let matches = 0
  let totalPossible = 0

  sourceIds.forEach(rawSourceId => {
    const sourceId = resolveSkillId(rawSourceId) || rawSourceId
    const expectedTargets = mappingTable[sourceId] || []
    totalPossible += expectedTargets.length

    expectedTargets.forEach(expectedTarget => {
      if (targetIds.includes(expectedTarget)) {
        matches++
      }
    })
  })

  if (totalPossible === 0) return 50 // Neutral if no mappings exist

  return Math.round((matches / totalPossible) * 100)
}

/**
 * Find strong alignments where Skills + Problems + Persona all connect
 */
function findStrongAlignments(skills, problems, personas) {
  const alignments = []

  skills.forEach(skill => {
    const resolvedId = resolveSkillId(skill.segmentId) || skill.segmentId
    const relatedProblems = SKILLS_TO_PROBLEMS[resolvedId] || []
    const relatedPersonas = SKILLS_TO_PERSONAS[resolvedId] || []

    problems.forEach(problem => {
      if (!relatedProblems.includes(problem.segmentId)) return

      const problemPersonas = PROBLEMS_TO_PERSONAS[resolveProblemId(problem.segmentId)] || []

      personas.forEach(persona => {
        if (relatedPersonas.includes(persona.segmentId) && problemPersonas.includes(persona.segmentId)) {
          // Triple alignment found!
          const skillSegment = findSkillSegment(skill.segmentId)
          const problemSegment = findProblemSegment(problem.segmentId)
          const personaSegment = PERSONA_SEGMENTS.find(p => p.id === persona.segmentId)

          alignments.push({
            skill: {
              id: skill.segmentId,
              name: skillSegment?.displayName,
              proficiency: skill.proficiency,
            },
            problem: {
              id: problem.segmentId,
              name: problemSegment?.displayName,
              proficiency: problem.proficiency,
            },
            persona: {
              id: persona.segmentId,
              name: personaSegment?.displayName,
              proficiency: persona.proficiency,
            },
            strength: calculateAlignmentStrength(skill, problem, persona),
            opportunity: generateOpportunityStatement(skillSegment, problemSegment, personaSegment),
          })
        }
      })
    })
  })

  // Sort by strength
  return alignments.sort((a, b) => b.strength - a.strength)
}

/**
 * Calculate strength of a triple alignment based on proficiency levels
 */
function calculateAlignmentStrength(skill, problem, persona) {
  const proficiencyScores = {
    // Skills
    emerging: 1, establishing: 2, mastering: 3,
    // Problems
    exploring: 1, pursuing: 2, proven: 3,
    // Personas
    awakening: 1, struggling: 2, ready: 3,
  }

  const skillScore = proficiencyScores[skill.proficiency] || 2
  const problemScore = proficiencyScores[problem.proficiency] || 2
  const personaScore = proficiencyScores[persona.proficiency] || 2

  return Math.round(((skillScore + problemScore + personaScore) / 9) * 100)
}

/**
 * Generate opportunity statement for an alignment
 */
function generateOpportunityStatement(skill, problem, persona) {
  return `Use your ${skill?.displayName} skills to help ${persona?.displayName} with ${problem?.displayName}`
}

/**
 * Find misalignments (gaps) between wheels
 */
function findMisalignments(skillIds, problemIds, personaIds) {
  const gaps = []

  // Skills without matching Problems
  skillIds.forEach(rawSkillId => {
    const skillId = resolveSkillId(rawSkillId) || rawSkillId
    const expectedProblems = SKILLS_TO_PROBLEMS[skillId] || []
    const hasMatchingProblem = expectedProblems.some(p => problemIds.includes(p))

    if (!hasMatchingProblem && expectedProblems.length > 0) {
      const skill = findSkillSegment(skillId)
      const suggestedProblems = expectedProblems
        .map(pId => findProblemSegment(pId)?.displayName)
        .filter(Boolean)

      gaps.push({
        type: 'skill_without_problem',
        message: `You have ${skill?.displayName} skills but no matching problem domain lit`,
        suggestion: `Consider exploring: ${suggestedProblems.join(', ')}`,
        severity: 'medium',
      })
    }
  })

  // Problems without matching Personas
  problemIds.forEach(problemId => {
    const expectedPersonas = PROBLEMS_TO_PERSONAS[problemId] || []
    const hasMatchingPersona = expectedPersonas.some(p => personaIds.includes(p))

    if (!hasMatchingPersona && expectedPersonas.length > 0) {
      const problem = findProblemSegment(problemId)
      const suggestedPersonas = expectedPersonas
        .map(pId => PERSONA_SEGMENTS.find(p => p.id === pId)?.displayName)
        .filter(Boolean)

      gaps.push({
        type: 'problem_without_persona',
        message: `You care about ${problem?.displayName} but haven't identified your target persona`,
        suggestion: `Typical personas for this problem: ${suggestedPersonas.join(', ')}`,
        severity: 'high',
      })
    }
  })

  // Skills without matching Personas (direct)
  skillIds.forEach(rawSkillId => {
    const skillId = resolveSkillId(rawSkillId) || rawSkillId
    const expectedPersonas = SKILLS_TO_PERSONAS[skillId] || []
    const hasMatchingPersona = expectedPersonas.some(p => personaIds.includes(p))

    if (!hasMatchingPersona && expectedPersonas.length > 0) {
      const skill = findSkillSegment(skillId)
      gaps.push({
        type: 'skill_without_persona',
        message: `You have ${skill?.displayName} skills but no natural persona match`,
        suggestion: `This skill typically serves: ${expectedPersonas.map(pId => PERSONA_SEGMENTS.find(p => p.id === pId)?.displayName).join(', ')}`,
        severity: 'low',
      })
    }
  })

  return gaps
}

// ============================================================================
// GAP ANALYSIS & OPPORTUNITY DETECTION
// ============================================================================

/**
 * Analyze gaps and generate actionable opportunities
 *
 * @param {Object} wheelData - { skills: [...], problems: [...], personas: [...] }
 * @returns {Object} - { gaps, opportunities, recommendations }
 */
export function analyzeGapsAndOpportunities(wheelData) {
  const { skills = [], problems = [], personas = [] } = wheelData
  const alignment = calculateAlignmentScore(wheelData)

  const opportunities = []
  const recommendations = []

  // Pattern 1: Skills + Problems, no Persona
  if (skills.length > 0 && problems.length > 0 && personas.length === 0) {
    opportunities.push({
      pattern: 'missing_persona',
      title: 'Define Your Audience',
      description: 'You know WHAT you can do and WHY it matters, but need to clarify WHO you serve',
      action: 'Complete the Persona Flow Finder to identify your ideal customer',
      priority: 'high',
    })
  }

  // Pattern 2: Skills + Persona, no Problems
  if (skills.length > 0 && personas.length > 0 && problems.length === 0) {
    opportunities.push({
      pattern: 'missing_problem',
      title: 'Find Your Problem Focus',
      description: 'You know WHO you help and WHAT skills you bring, but need to pinpoint the specific problem',
      action: 'Complete the Problems Flow Finder to identify pain points',
      priority: 'high',
    })
  }

  // Pattern 3: Problems + Persona, no Skills
  if (problems.length > 0 && personas.length > 0 && skills.length === 0) {
    opportunities.push({
      pattern: 'missing_skills',
      title: 'Identify Your Superpower',
      description: 'You know WHO has WHAT problem, but need to clarify your unique skills to solve it',
      action: 'Complete the Skills Flow Finder to uncover your abilities',
      priority: 'high',
    })
  }

  // Pattern 4: Strong alignment but low proficiency
  alignment.strongAlignments.forEach(align => {
    if (align.strength < 50) {
      opportunities.push({
        pattern: 'emerging_opportunity',
        title: `Develop: ${align.skill.name} for ${align.persona.name}`,
        description: `You have alignment but are still early in your journey. This is a growth opportunity.`,
        action: `Focus on developing your ${align.skill.name} skills and building proof in ${align.problem.name}`,
        priority: 'medium',
      })
    }
  })

  // Pattern 5: Strong alignment and high proficiency - READY TO LAUNCH
  alignment.strongAlignments.forEach(align => {
    if (align.strength >= 70) {
      opportunities.push({
        pattern: 'ready_to_launch',
        title: `Launch: ${align.problem.name} for ${align.persona.name}`,
        description: `Strong alignment across all three wheels with proven expertise. You're ready to build.`,
        action: `Create an offer using your ${align.skill.name} to help ${align.persona.name} with ${align.problem.name}`,
        priority: 'immediate',
      })
    }
  })

  // Generate recommendations based on gaps
  alignment.misalignments.forEach(gap => {
    recommendations.push({
      type: gap.type,
      message: gap.message,
      action: gap.suggestion,
      severity: gap.severity,
    })
  })

  return {
    gaps: alignment.misalignments,
    opportunities: opportunities.sort((a, b) => {
      const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }),
    recommendations,
    alignmentScore: alignment.score,
    strongAlignments: alignment.strongAlignments,
  }
}

// ============================================================================
// ZARLO CONTEXT GENERATION
// ============================================================================

/**
 * Generate context string for Zarlo AI co-founder
 * This gets injected into Zarlo's system prompt
 *
 * @param {Object} wheelData - { skills: [...], problems: [...], personas: [...] }
 * @returns {string} - Formatted context for AI
 */
export function generateZarloWheelContext(wheelData) {
  const { skills = [], problems = [], personas = [] } = wheelData

  if (skills.length === 0 && problems.length === 0 && personas.length === 0) {
    return `
USER'S FOUNDER DNA: Not yet discovered.
The user hasn't completed any Flow Finder assessments yet.
Encourage them to start with Skills Discovery to uncover their unique abilities.
`
  }

  const analysis = analyzeGapsAndOpportunities(wheelData)
  const alignment = calculateAlignmentScore(wheelData)

  // Format skills
  const skillsContext = skills.length > 0
    ? skills.map(s => {
        const segment = findSkillSegment(s.segmentId)
        const proficiencyRing = PROFICIENCY_RINGS.find(r => r.id === s.proficiency)
        return `- ${segment?.displayName} (${segment?.aspirationalTitle}): ${proficiencyRing?.label || 'Unknown'} - ${segment?.valueCreated}`
      }).join('\n')
    : '- Not yet discovered'

  // Format problems
  const problemsContext = problems.length > 0
    ? problems.map(p => {
        const segment = findProblemSegment(p.segmentId)
        const proficiencyRing = PROBLEMS_PROFICIENCY_RINGS.find(r => r.id === p.proficiency)
        return `- ${segment?.displayName}: ${proficiencyRing?.label || 'Unknown'} - ${segment?.tagline}`
      }).join('\n')
    : '- Not yet discovered'

  // Format personas
  const personasContext = personas.length > 0
    ? personas.map(p => {
        const segment = PERSONA_SEGMENTS.find(seg => seg.id === p.segmentId)
        const journeyStage = JOURNEY_STAGES.find(j => j.id === p.proficiency)
        return `- ${segment?.displayName} (${segment?.aspirationalTitle}): ${journeyStage?.label || 'Unknown'} stage - ${segment?.coreDrive} driven, seeking ${segment?.whatTheySeeking}`
      }).join('\n')
    : '- Not yet discovered'

  // Format alignments
  const alignmentsContext = alignment.strongAlignments.length > 0
    ? alignment.strongAlignments.slice(0, 3).map(a =>
        `- ${a.skill.name} + ${a.problem.name} + ${a.persona.name} (${a.strength}% strength)`
      ).join('\n')
    : '- No triple alignments yet'

  // Format gaps
  const gapsContext = analysis.gaps.length > 0
    ? analysis.gaps.slice(0, 3).map(g => `- ${g.message}`).join('\n')
    : '- No major gaps identified'

  // Format opportunities
  const opportunitiesContext = analysis.opportunities.length > 0
    ? analysis.opportunities.slice(0, 2).map(o =>
        `- [${o.priority.toUpperCase()}] ${o.title}: ${o.description}`
      ).join('\n')
    : '- Complete more assessments to unlock opportunities'

  return `
USER'S FOUNDER DNA:

SKILLS (What they're good at):
${skillsContext}

PROBLEMS (What they care about solving):
${problemsContext}

PERSONAS (Who they're drawn to serve):
${personasContext}

ALIGNMENT SCORE: ${alignment.score}%
- Skills↔Problems: ${alignment.breakdown.skillsToProblemScore}%
- Problems↔Personas: ${alignment.breakdown.problemsToPersonaScore}%
- Skills↔Personas: ${alignment.breakdown.skillsToPersonaScore}%

STRONG ALIGNMENTS (Business sweet spots):
${alignmentsContext}

GAPS TO ADDRESS:
${gapsContext}

TOP OPPORTUNITIES:
${opportunitiesContext}

PEOPLE WHO BUILT WHAT YOU'RE DREAMING OF:
${(() => {
    const skillIds = skills.map(s => s.segmentId)
    const problemIds = problems.map(p => p.segmentId)
    const matches = findCareerMatches(skillIds, problemIds, 5)
    if (matches.length === 0) return '- Complete more assessments to find your career matches'
    return matches.map(m => {
      const cm = m.careerModel || {}
      return `- ${m.name} (${cm.type}): ${cm.trajectory || ''}\n  Lesson: ${cm.lessonsForUser || ''}`
    }).join('\n')
  })()}

COACHING GUIDANCE:
${alignment.score >= 70 ? '- High alignment! Focus on execution and offer creation.' : ''}
${alignment.score >= 40 && alignment.score < 70 ? '- Moderate alignment. Help them identify missing pieces.' : ''}
${alignment.score < 40 ? '- Low alignment. Guide them through more discovery work.' : ''}
${skills.length === 0 ? '- Encourage starting with Skills Discovery.' : ''}
${problems.length === 0 && skills.length > 0 ? '- Ready for Problems Discovery.' : ''}
${personas.length === 0 && problems.length > 0 ? '- Ready for Persona Discovery.' : ''}
`
}

/**
 * Find career model matches for a user based on their skill + problem categories
 */
export function findCareerMatches(skillIds, problemIds, limit = 5) {
  if (skillIds.length === 0 && problemIds.length === 0) return []

  const resolvedSkills = new Set(skillIds.map(id => resolveSkillId(id) || id))
  const resolvedProblems = new Set(problemIds.map(id => resolveProblemId(id) || id))

  const scored = careerModelsData.profiles.map(profile => {
    const profileSkills = new Set(profile.primarySkills || [])
    const profileProblem = profile.primaryProblem || ''

    const skillOverlap = [...resolvedSkills].filter(s => profileSkills.has(s)).length
    const problemMatch = resolvedProblems.has(profileProblem) ? 1 : 0

    return { profile, score: skillOverlap + (problemMatch * 2) }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.profile)
}

/**
 * Get brief wheel summary for quick context
 */
export function getWheelSummary(wheelData) {
  const { skills = [], problems = [], personas = [] } = wheelData
  const alignment = calculateAlignmentScore(wheelData)

  const topSkill = skills.length > 0
    ? findSkillSegment(skills[0].segmentId)?.displayName
    : null
  const topProblem = problems.length > 0
    ? findProblemSegment(problems[0].segmentId)?.displayName
    : null
  const topPersona = personas.length > 0
    ? PERSONA_SEGMENTS.find(p => p.id === personas[0].segmentId)?.displayName
    : null

  return {
    skills: skills.length,
    problems: problems.length,
    personas: personas.length,
    alignmentScore: alignment.score,
    topSkill,
    topProblem,
    topPersona,
    hasFullAlignment: alignment.strongAlignments.length > 0,
  }
}
