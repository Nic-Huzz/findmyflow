import React from 'react'

/**
 * Stage names for business journey
 */
const STAGE_NAMES = {
  1: 'Validation',
  2: 'Product',
  3: 'Testing',
  4: 'Money Models',
  5: 'Grand Slam',
  6: 'Campaign',
  7: 'Launch',
  8: 'Tracking',
}

/**
 * HeroStoryNarrative - Combines all identity elements into a story paragraph
 *
 * Template from hero-journey-game-design.md:
 * THE STORY OF [PROJECT NAME]
 * - Essence archetype + poetic line
 * - Skill/Gift expression
 * - Problem/Cause
 * - Persona/Tribe
 * - Protective Voice
 * - Current stage + XP
 * - Closing
 */
function HeroStoryNarrative({ archetypes, project }) {
  if (!archetypes?.essence || !project) {
    return null
  }

  const { essence, protective } = archetypes
  const { skill, problem, persona, name, stage, xp } = project

  const stageName = STAGE_NAMES[stage] || `Stage ${stage}`

  return (
    <div className="hero-story">
      <h3 className="story-title">The Story of {name}</h3>
      <div className="story-content">
        {/* Essence */}
        {essence.name && (
          <p className="story-paragraph">
            At your core, you are <strong>{essence.name.toUpperCase()}</strong>
            {essence.poeticLine ? ` — ${essence.poeticLine.toLowerCase()}` : '.'}
          </p>
        )}

        {/* Skill/Gift */}
        {skill?.aspirationalTitle && (
          <p className="story-paragraph">
            Through <strong>{name}</strong>, you express this essence by becoming{' '}
            <strong>{skill.aspirationalTitle.toUpperCase()}</strong>, using your gift of{' '}
            {skill.tagline?.toLowerCase() || skill.displayName?.toLowerCase() || 'your unique talent'}.
          </p>
        )}

        {/* Problem/Cause */}
        {problem?.aspirationalTitle && (
          <p className="story-paragraph">
            Your cause is <strong>{problem.aspirationalTitle.toUpperCase()}</strong> — you champion{' '}
            {problem.tagline?.toLowerCase() || problem.displayName?.toLowerCase() || 'important change'}.
          </p>
        )}

        {/* Persona/Tribe */}
        {persona?.aspirationalTitle && (
          <p className="story-paragraph">
            The people who need you most are <strong>{persona.aspirationalTitle.toUpperCase()}</strong> —{' '}
            {persona.tagline?.toLowerCase() || persona.displayName?.toLowerCase() || 'those seeking transformation'}.
          </p>
        )}

        {/* Protective Voice */}
        {protective?.name && protective?.coreNarrative && (
          <p className="story-paragraph">
            But <strong>{protective.name.toUpperCase()}</strong> whispers: "{protective.coreNarrative}"
          </p>
        )}

        {/* Progress */}
        <p className="story-paragraph">
          You are currently at <strong>{stageName}</strong>.
          {xp > 0 && ` Your score is ${xp.toLocaleString()} XP.`}
        </p>

        {/* Closing */}
        <p className="story-paragraph story-closing">
          This is your hero's journey. Not the only one — but this one is yours.
        </p>
      </div>
    </div>
  )
}

export default HeroStoryNarrative
