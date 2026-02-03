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

  // Handle null/undefined input
  if (!rawText || typeof rawText !== 'string') {
    return result
  }

  // Normalize different dash/bullet styles to standard
  let normalizedText = rawText
    .replace(/—/g, '-')     // em-dash to dash
    .replace(/–/g, '-')     // en-dash to dash
    .replace(/⸻/g, '---')   // horizontal line to triple dash
    .replace(/•/g, '-')     // bullet to dash
    .replace(/\t/g, ' ')    // tabs to spaces

  // Check for markers (handle variations)
  const startMarkers = [
    '---START EXTRACTION---',
    '--- START EXTRACTION ---',
    '-START EXTRACTION-',
    'START EXTRACTION'
  ]
  const endMarkers = [
    '---END EXTRACTION---',
    '--- END EXTRACTION ---',
    '-END EXTRACTION-',
    'END EXTRACTION'
  ]

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
  const skillsSection = extractSection(text, 'SKILLS', '##')

  if (!skillsSection) return skills

  // Split by "SKILL:" pattern - handle various formats:
  // - SKILL:, • SKILL:, **SKILL:**, 1. SKILL:, SKILL:
  const skillBlocks = skillsSection.split(/(?=(?:[-•*\d.]+\s*)?(?:\*\*)?SKILL:)/i).filter(s => s.trim())

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
  const problemsSection = extractSection(text, 'PROBLEMS', '##')

  if (!problemsSection) return problems

  // Split by "PROBLEM:" pattern - handle various formats
  const problemBlocks = problemsSection.split(/(?=(?:[-•*\d.]+\s*)?(?:\*\*)?PROBLEM:)/i).filter(s => s.trim())

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
  const personasSection = extractSection(text, 'PERSONAS', '##')

  if (!personasSection) return personas

  // Split by "PERSONA:" pattern - handle various formats
  const personaBlocks = personasSection.split(/(?=(?:[-•*\d.]+\s*)?(?:\*\*)?PERSONA:)/i).filter(s => s.trim())

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
  const themesSection = extractSection(text, 'RECURRING THEMES', '##')

  if (!themesSection) return themes

  // Split by "THEME:" pattern - handle various formats
  const themeBlocks = themesSection.split(/(?=(?:[-•*\d.]+\s*)?(?:\*\*)?THEME:)/i).filter(s => s.trim())

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
  const gapsSection = extractSection(text, 'CURIOSITY GAPS', '##')

  if (!gapsSection) return gaps

  // Split by "GAP:" pattern - handle various formats
  const gapBlocks = gapsSection.split(/(?=(?:[-•*\d.]+\s*)?(?:\*\*)?GAP:)/i).filter(s => s.trim())

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
  const northStarSection = extractSection(text, 'NORTH STAR', '---')

  if (!northStarSection) return ''

  // Look for the quoted statement (handle curly quotes too)
  const quoteMatch = northStarSection.match(/[""]([^""]+)[""]/)
  if (quoteMatch) return quoteMatch[1]

  // Also try standard quotes
  const stdQuoteMatch = northStarSection.match(/"([^"]+)"/)
  if (stdQuoteMatch) return stdQuoteMatch[1]

  // Otherwise return the cleaned section
  return northStarSection
    .replace(/^.*?complete this sentence:/i, '')
    .replace(/^.*?HYPOTHESIS\s*/i, '')
    .trim()
}

/**
 * Extract a section between two headers
 * Handles formats like "## SKILLS" or "SKILLS (description)" or just "SKILLS"
 */
function extractSection(text, sectionName, endMarker) {
  // Try multiple patterns to find the section header (case-insensitive)
  const patterns = [
    new RegExp(`##\\s*${sectionName}[^\\n]*`, 'i'),      // ## SKILLS ...
    new RegExp(`^${sectionName}\\s*\\([^)]*\\)`, 'im'),  // SKILLS (description)
    new RegExp(`^${sectionName}\\s*$`, 'im'),            // Just SKILLS
    new RegExp(`\\n${sectionName}\\s*\\([^)]*\\)`, 'i'), // Newline + SKILLS (description)
    new RegExp(`\\n${sectionName}\\s*\\n`, 'i')          // Newline + SKILLS + newline
  ]

  let startIdx = -1
  let headerLength = 0

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      startIdx = match.index
      headerLength = match[0].length
      break
    }
  }

  if (startIdx === -1) return null

  const contentStart = startIdx + headerLength

  // Find next section or end marker
  // Look for next section header (---\n or ## or UPPERCASE_WORD followed by newline/paren)
  let endIdx = text.length
  const remainingText = text.slice(contentStart)

  // Look for section separators: ---, ##, or next uppercase section header
  const nextSectionPatterns = [
    /\n---+\s*\n/,                           // --- separator
    /\n##\s*[A-Z]/,                          // ## header
    /\n[A-Z][A-Z\s]+\([^)]*\)\s*\n/,        // SECTION_NAME (description)
    /\n[A-Z][A-Z\s]+\n(?=\s*-)/             // SECTION_NAME followed by bullet items
  ]

  for (const pattern of nextSectionPatterns) {
    const match = remainingText.match(pattern)
    if (match && match.index > 0) {
      const newEndIdx = contentStart + match.index
      if (newEndIdx < endIdx) {
        endIdx = newEndIdx
      }
    }
  }

  return text.slice(contentStart, endIdx).trim()
}

/**
 * Extract a field value from a block
 * Handles formats like:
 * - SKILL: value
 * - **SKILL:** value
 * - SKILL: value (on its own line)
 */
function extractField(block, fieldName) {
  // Remove markdown bold markers
  const cleanBlock = block.replace(/\*\*/g, '')

  // Try multiple patterns
  const patterns = [
    // Standard: FIELD: value (until next field, bullet, or double newline)
    new RegExp(`${fieldName}:\\s*(.+?)(?=\\n\\s*(?:[A-Z_]+:|[-•*]|\\n)|$)`, 'is'),
    // Field on its own line with value on same line
    new RegExp(`${fieldName}:\\s*([^\\n]+)`, 'i'),
    // Fallback: just grab everything after the field name
    new RegExp(`${fieldName}:\\s*(.+?)$`, 'is')
  ]

  for (const regex of patterns) {
    const match = cleanBlock.match(regex)
    if (match && match[1]) {
      let value = match[1].trim()
      // Remove surrounding brackets and quotes
      value = value.replace(/^\[|\]$/g, '').replace(/^[""]|[""]$/g, '').trim()
      if (value) return value
    }
  }

  return ''
}

/**
 * Validate parsed data has minimum content
 */
export function validateParsedData(data) {
  const errors = []
  const found = []

  const skills = data?.skills || []
  const problems = data?.problems || []
  const personas = data?.personas || []

  if (skills.length === 0) {
    errors.push('No skills were extracted')
  } else {
    found.push(`${skills.length} skills`)
  }
  if (problems.length === 0) {
    errors.push('No problems were extracted')
  } else {
    found.push(`${problems.length} problems`)
  }
  if (personas.length === 0) {
    errors.push('No personas were extracted')
  } else {
    found.push(`${personas.length} personas`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    found
  }
}

/**
 * Generate a prompt for the user to copy back to their AI to reformat the response
 */
export function generateReformatPrompt(rawText) {
  return `Please reformat your previous response using this EXACT structure. Use these EXACT field names with colons. Do not use markdown headers with ##, just the section names.

---START EXTRACTION---

SKILLS
- SKILL: [Name of skill]
  EVIDENCE: [Brief quote or pattern]
  FREQUENCY: [Low/Medium/High]
  CATEGORY: [Technical/Creative/Interpersonal/Strategic/Healing/Other]

- SKILL: [Next skill...]
  EVIDENCE: ...
  FREQUENCY: ...
  CATEGORY: ...

---

PROBLEMS
- PROBLEM: [Name/Description]
  EVIDENCE: [What made you identify this]
  FREQUENCY: [Low/Medium/High]
  EMOTIONAL_CHARGE: [Low/Medium/High]

---

PERSONAS
- PERSONA: [Description]
  EVIDENCE: [What made you identify this]
  FREQUENCY: [Low/Medium/High]
  CONNECTION: [Why I might relate to this persona]

---

RECURRING THEMES
- THEME: [Name]
  CONNECTS: [Which skills, problems, or personas this links]

---

CURIOSITY GAPS
- GAP: [Topic]
  EVIDENCE: [Why you think I'm curious but haven't gone deep]
  SUGGESTED_CONNECTION: [What existing interest this might link to]

---

NORTH STAR HYPOTHESIS
"You seem most alive when you're using [SKILLS] to help [PERSONAS] solve [PROBLEMS]."

---END EXTRACTION---

IMPORTANT FORMATTING RULES:
1. Start each item with a dash (-) followed by the field name and colon
2. Use SKILL:, PROBLEM:, PERSONA:, THEME:, GAP: exactly as shown
3. Put each field on its own line
4. Include the ---START EXTRACTION--- and ---END EXTRACTION--- markers
5. Separate sections with --- on its own line

Please reformat the extraction you just gave me using this structure.`
}
