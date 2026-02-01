/**
 * Mind Space Parser
 * Parses AI-generated extraction responses into structured data
 */

/**
 * Parse the AI response text into structured data
 * @param {string} rawText - The full AI response
 * @returns {object} Parsed data with skills, problems, personas, themes, gaps, northStar
 */
export function parseMindSpaceResponse(rawText) {
  const result = {
    skills: [],
    problems: [],
    personas: [],
    themes: [],
    curiosityGaps: [],
    northStar: '',
    parseErrors: []
  }

  // Normalize different dash styles to standard
  let normalizedText = rawText
    .replace(/—/g, '---')  // em-dash to triple dash
    .replace(/–/g, '-')     // en-dash to dash
    .replace(/•/g, '-')     // bullet to dash

  // Check for markers (handle variations)
  const startMarkers = ['---START EXTRACTION---', '--- START EXTRACTION ---', 'START EXTRACTION']
  const endMarkers = ['---END EXTRACTION---', '--- END EXTRACTION ---', 'END EXTRACTION']

  let contentToParse = normalizedText

  for (const startMarker of startMarkers) {
    if (normalizedText.includes(startMarker)) {
      const startIdx = normalizedText.indexOf(startMarker) + startMarker.length
      for (const endMarker of endMarkers) {
        if (normalizedText.includes(endMarker)) {
          const endIdx = normalizedText.indexOf(endMarker)
          contentToParse = normalizedText.slice(startIdx, endIdx).trim()
          break
        }
      }
      break
    }
  }

  // Parse each section
  result.skills = parseSkillsSection(contentToParse)
  result.problems = parseProblemsSection(contentToParse)
  result.personas = parsePersonasSection(contentToParse)
  result.themes = parseThemesSection(contentToParse)
  result.curiosityGaps = parseCuriosityGapsSection(contentToParse)
  result.northStar = parseNorthStar(contentToParse)

  return result
}

/**
 * Parse skills section
 */
function parseSkillsSection(text) {
  const skills = []
  const skillsSection = extractSection(text, '## SKILLS', '##')

  if (!skillsSection) return skills

  // Split by "SKILL:" pattern (with optional bullet/dash prefix)
  const skillBlocks = skillsSection.split(/(?=[-•]\s*SKILL:)/i).filter(s => s.trim())

  for (const block of skillBlocks) {
    const skill = {
      name: extractField(block, 'SKILL'),
      evidence: extractField(block, 'EVIDENCE'),
      frequency: normalizeFrequency(extractField(block, 'FREQUENCY')),
      category: extractField(block, 'CATEGORY') || 'Other',
      mappedTo: null,
      userLevel: null
    }

    if (skill.name) {
      skills.push(skill)
    }
  }

  return skills
}

/**
 * Normalize frequency values (handle Medium-High, etc.)
 */
function normalizeFrequency(freq) {
  if (!freq) return 'Medium'
  const normalized = freq.toLowerCase().trim()
  if (normalized.includes('high')) return 'High'
  if (normalized.includes('low')) return 'Low'
  return 'Medium'
}

/**
 * Parse problems section
 */
function parseProblemsSection(text) {
  const problems = []
  const problemsSection = extractSection(text, '## PROBLEMS', '##')

  if (!problemsSection) return problems

  const problemBlocks = problemsSection.split(/(?=[-•]\s*PROBLEM:)/i).filter(s => s.trim())

  for (const block of problemBlocks) {
    const problem = {
      name: extractField(block, 'PROBLEM'),
      evidence: extractField(block, 'EVIDENCE'),
      frequency: normalizeFrequency(extractField(block, 'FREQUENCY')),
      emotionalCharge: normalizeFrequency(extractField(block, 'EMOTIONAL_CHARGE')),
      mappedTo: null,
      userLevel: null
    }

    if (problem.name) {
      problems.push(problem)
    }
  }

  return problems
}

/**
 * Parse personas section
 */
function parsePersonasSection(text) {
  const personas = []
  const personasSection = extractSection(text, '## PERSONAS', '##')

  if (!personasSection) return personas

  const personaBlocks = personasSection.split(/(?=[-•]\s*PERSONA:)/i).filter(s => s.trim())

  for (const block of personaBlocks) {
    const persona = {
      name: extractField(block, 'PERSONA'),
      evidence: extractField(block, 'EVIDENCE'),
      frequency: normalizeFrequency(extractField(block, 'FREQUENCY')),
      connection: extractField(block, 'CONNECTION'),
      mappedTo: null,
      userLevel: null
    }

    if (persona.name) {
      personas.push(persona)
    }
  }

  return personas
}

/**
 * Parse themes section
 */
function parseThemesSection(text) {
  const themes = []
  const themesSection = extractSection(text, '## RECURRING THEMES', '##')

  if (!themesSection) return themes

  const themeBlocks = themesSection.split(/(?=[-•]\s*THEME:)/i).filter(s => s.trim())

  for (const block of themeBlocks) {
    const theme = {
      name: extractField(block, 'THEME'),
      connects: extractField(block, 'CONNECTS')
    }

    if (theme.name) {
      themes.push(theme)
    }
  }

  return themes
}

/**
 * Parse curiosity gaps section
 */
function parseCuriosityGapsSection(text) {
  const gaps = []
  const gapsSection = extractSection(text, '## CURIOSITY GAPS', '##')

  if (!gapsSection) return gaps

  const gapBlocks = gapsSection.split(/(?=[-•]\s*GAP:)/i).filter(s => s.trim())

  for (const block of gapBlocks) {
    const gap = {
      name: extractField(block, 'GAP'),
      evidence: extractField(block, 'EVIDENCE'),
      suggestedConnection: extractField(block, 'SUGGESTED_CONNECTION')
    }

    if (gap.name) {
      gaps.push(gap)
    }
  }

  return gaps
}

/**
 * Parse north star statement
 */
function parseNorthStar(text) {
  const northStarSection = extractSection(text, '## NORTH STAR', '---')

  if (!northStarSection) return ''

  // Look for the quoted statement or the full paragraph
  const quoteMatch = northStarSection.match(/"([^"]+)"/)
  if (quoteMatch) return quoteMatch[1]

  // Otherwise return the cleaned section
  return northStarSection
    .replace(/^.*?complete this sentence:/i, '')
    .trim()
}

/**
 * Extract a section between two headers
 */
function extractSection(text, startHeader, endMarker) {
  const startIdx = text.indexOf(startHeader)
  if (startIdx === -1) return null

  const contentStart = startIdx + startHeader.length

  // Find next section or end marker
  let endIdx = text.length
  const nextSectionMatch = text.slice(contentStart).match(new RegExp(`\n${endMarker}\\s*[A-Z]`))
  if (nextSectionMatch) {
    endIdx = contentStart + nextSectionMatch.index
  }

  return text.slice(contentStart, endIdx).trim()
}

/**
 * Extract a field value from a block
 */
function extractField(block, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n-|\\n\\n|$)`, 'is')
  const match = block.match(regex)
  if (match) {
    return match[1].trim().replace(/^\[|\]$/g, '').trim()
  }
  return ''
}

/**
 * Validate parsed data has minimum content
 */
export function validateParsedData(data) {
  const errors = []

  if (data.skills.length === 0) {
    errors.push('No skills were extracted')
  }
  if (data.problems.length === 0) {
    errors.push('No problems were extracted')
  }
  if (data.personas.length === 0) {
    errors.push('No personas were extracted')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
