import React from 'react'

/**
 * HeroStoryNarrative - Combines all identity elements into a story paragraph
 *
 * Weaves together: essence archetype, project skill/problem/persona,
 * and protective voice into a cohesive narrative.
 */
function HeroStoryNarrative({ archetypes, project }) {
  if (!archetypes?.essence || !project) {
    return null
  }

  const { essence, protective } = archetypes
  const { skill, problem, persona, name } = project

  // Build narrative parts - only include sections where data exists
  const parts = []

  // Opening: Essence archetype identity
  if (essence.name) {
    parts.push(
      `At your core, you are ${essence.name.toUpperCase()}${essence.poeticLine ? ' — ' + essence.poeticLine.toLowerCase() : '.'}`
    )
  }

  // Skill: Gift through this project
  if (skill?.aspirationalTitle) {
    parts.push(
      `Through this project, you become ${skill.aspirationalTitle.toUpperCase()}, using your gift of ${skill.tagline?.toLowerCase() || skill.displayName?.toLowerCase() || 'your unique talent'}.`
    )
  }

  // Problem: Cause this project champions
  if (problem?.aspirationalTitle) {
    parts.push(
      `Your cause is ${problem.aspirationalTitle.toUpperCase()} — you champion ${problem.tagline?.toLowerCase() || problem.displayName?.toLowerCase() || 'important change'}.`
    )
  }

  // Persona: Tribe this project serves
  if (persona?.aspirationalTitle) {
    parts.push(
      `The people who need you are ${persona.aspirationalTitle.toUpperCase()} — ${persona.tagline?.toLowerCase() || persona.displayName?.toLowerCase() || 'those seeking transformation'}.`
    )
  }

  // Shadow: Protective voice
  if (protective?.name && protective?.coreNarrative) {
    parts.push(
      `But ${protective.name.toUpperCase()} whispers: "${protective.coreNarrative}"`
    )
  }

  if (parts.length === 0) {
    return null
  }

  return (
    <div className="hero-story">
      <h3 className="story-title">Your Story</h3>
      <div className="story-content">
        {parts.map((part, index) => (
          <p key={index} className="story-paragraph">{part}</p>
        ))}
      </div>
    </div>
  )
}

export default HeroStoryNarrative
