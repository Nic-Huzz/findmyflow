/**
 * CreatorPositionCard — Unified industry position + positioning statement
 *
 * Merges BranchInsightCard + PositioningSummary into one card for the Creator Portal.
 * Leads with the industry frontier (dominant/crowded/gap), shows rarity + gap insight,
 * and handles positioning statement generation (life quake + transformation + AI).
 *
 * Two states:
 *   Pre-Remarkable: frontier + rarity + "Is this the assumption you're breaking?"
 *   Post-Remarkable: frontier + rarity + rule break + positioning statement
 *
 * Replaces PositioningSummary on CreatorHomeV2.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useBranchScoring } from '../hooks/useBranchScoring'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import dnaData from '../../public/data/experienceCreatorDNA.json'
import './CreatorPositionCard.css'

const BRANCH_META = {
  movement: { label: 'Movement', color: '#7c3aed' },
  nourishment: { label: 'Nourishment', color: '#22c55e' },
  tools: { label: 'Tools', color: '#0ea5e9' },
  status: { label: 'Status', color: '#e879f9' },
  bonds: { label: 'Bonds', color: '#f472b6' },
  shelter: { label: 'Shelter', color: '#38bdf8' },
  story: { label: 'Story', color: '#fb923c' },
  fire: { label: 'Fire', color: '#f59e0b' },
  healing: { label: 'Healing', color: '#a78bfa' },
  threat: { label: 'Threat', color: '#ef4444' },
}

export default function CreatorPositionCard({ userId, essenceName, skills, problems, remarkableAngle, onCreatorTap }) {
  // Branch scoring
  const { loading: branchLoading, primary, secondary, scores, gap, rarity, confidence } = useBranchScoring()

  // Competitive density (nearby experience creators by branch)
  const nearbyCreators = useMemo(() => {
    if (!primary) return []
    const pb = primary.branch
    const sb = secondary?.branch
    const profiles = dnaData.profiles || []
    return profiles.filter(p => {
      if (!p.primaryBranch) return false
      return (
        p.primaryBranch === pb ||
        p.secondaryBranch === pb ||
        (sb && p.primaryBranch === sb) ||
        (sb && p.secondaryBranch === sb)
      )
    }).slice(0, 5)
  }, [primary?.branch, secondary?.branch])

  // Matrix data
  const [matrixData, setMatrixData] = useState(null)

  // Positioning statement (absorbed from PositioningSummary)
  const [lifeQuake, setLifeQuake] = useState('')
  const [transformation, setTransformation] = useState('')
  const [statement, setStatement] = useState('')
  const [editingStatement, setEditingStatement] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [posLoaded, setPosLoaded] = useState(false)
  const saveTimerRef = useRef(null)
  const profileIdRef = useRef(null)

  // AI monopoly statement (Sprint 3)
  const [monopolyStatement, setMonopolyStatement] = useState('')
  const [generatingMonopoly, setGeneratingMonopoly] = useState(false)
  const [monopolyError, setMonopolyError] = useState(null)

  // UI
  const [frontierExpanded, setFrontierExpanded] = useState(false)
  const [secondaryExpanded, setSecondaryExpanded] = useState(false)
  const [branchesExpanded, setBranchesExpanded] = useState(false)
  const [posExpanded, setPosExpanded] = useState(false)

  // Load matrix data
  useEffect(() => {
    fetch('/data/spiralDynamicsMatrix.json')
      .then(r => r.json())
      .then(setMatrixData)
      .catch(err => console.error('Failed to load matrix data:', err))
  }, [])

  // Load positioning data (from PositioningSummary)
  useEffect(() => {
    if (!userId) return
    supabase
      .from('lead_flow_profiles')
      .select('id, life_quake, transformation, positioning_statement, ai_monopoly_statement')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          profileIdRef.current = data.id
          if (data.life_quake) setLifeQuake(data.life_quake)
          if (data.transformation) setTransformation(data.transformation)
          if (data.positioning_statement) setStatement(data.positioning_statement)
          if (data.ai_monopoly_statement) setMonopolyStatement(data.ai_monopoly_statement)
        }
        setPosLoaded(true)
      })
  }, [userId])

  // Auto-save with debounce
  const saveField = useCallback((field, value) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (profileIdRef.current && profileIdRef.current !== 'pending') {
        await supabase.from('lead_flow_profiles').update({ [field]: value || null }).eq('id', profileIdRef.current)
      } else if (profileIdRef.current !== 'pending') {
        profileIdRef.current = 'pending'
        const { data } = await supabase
          .from('lead_flow_profiles')
          .insert({ user_id: userId, [field]: value || null })
          .select('id')
          .single()
        if (data) profileIdRef.current = data.id
      }
    }, 800)
  }, [userId])

  // Generate positioning statement
  const generateStatement = async () => {
    if (!lifeQuake.trim() || !transformation.trim()) return
    hapticLight()
    setGenerating(true)
    try {
      const prompt = buildPrompt({ essenceName, skills, problems, remarkableAngle, lifeQuake: lifeQuake.trim(), transformation: transformation.trim(), gap, primary })
      const { data, error } = await supabase.functions.invoke('generate-positioning', { body: { prompt, user_id: userId } })
      if (error) throw error
      const result = data?.statement || ''
      setStatement(result)
      setEditingStatement(false)
      setPosExpanded(true)
      if (profileIdRef.current) {
        await supabase.from('lead_flow_profiles').update({ positioning_statement: result }).eq('id', profileIdRef.current)
      }
      hapticSuccess()
    } catch (err) {
      console.error('Positioning generation failed:', err)
      const fallback = buildFallbackStatement({ essenceName, lifeQuake: lifeQuake.trim(), transformation: transformation.trim(), skills, remarkableAngle })
      setStatement(fallback)
      setPosExpanded(true)
      if (profileIdRef.current) {
        await supabase.from('lead_flow_profiles').update({ positioning_statement: fallback }).eq('id', profileIdRef.current)
      }
    } finally {
      setGenerating(false)
    }
  }

  const saveEditedStatement = async () => {
    setEditingStatement(false)
    hapticLight()
    if (profileIdRef.current) {
      await supabase.from('lead_flow_profiles').update({ positioning_statement: statement }).eq('id', profileIdRef.current)
    }
  }

  // Generate AI monopoly statement
  const generateMonopoly = async () => {
    hapticLight()
    setGeneratingMonopoly(true)
    setMonopolyError(null)
    try {
      // Build the frontier text from matrix data
      let frontierText = ''
      if (matrixData?.cells && primary) {
        const cell = findCell(matrixData, primary.branch, 'frontier')
        if (cell?.simple) {
          frontierText = `Crowded: ${cell.simple.crowded || ''}\nWhat's missing: ${cell.simple.stuck || ''}\nThe gap: ${cell.simple.gap || ''}`
        }
      }

      const prompt = buildMonopolyPrompt({
        essenceName,
        skills,
        problems,
        remarkableAngle,
        lifeQuake,
        transformation,
        gap,
        primary,
        secondary,
        rarity,
        frontierText,
        nearbyCreators,
        totalCreators: (dnaData.profiles || []).length,
      })

      const { data, error } = await supabase.functions.invoke('generate-positioning', {
        body: { prompt, user_id: userId },
      })
      if (error) throw error
      const result = data?.statement || ''
      setMonopolyStatement(result)

      // Save to DB — wait for pending insert if needed
      const waitForProfile = async () => {
        if (profileIdRef.current && profileIdRef.current !== 'pending') return profileIdRef.current
        // If pending, poll briefly for the insert to resolve
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 200))
          if (profileIdRef.current && profileIdRef.current !== 'pending') return profileIdRef.current
        }
        return null
      }

      const profileId = await waitForProfile()
      if (profileId) {
        await supabase.from('lead_flow_profiles').update({ ai_monopoly_statement: result }).eq('id', profileId)
      } else {
        profileIdRef.current = 'pending'
        const { data: row } = await supabase
          .from('lead_flow_profiles')
          .insert({ user_id: userId, ai_monopoly_statement: result })
          .select('id')
          .single()
        if (row) profileIdRef.current = row.id
      }
      hapticSuccess()
    } catch (err) {
      console.error('Monopoly statement generation failed:', err)
      setMonopolyError('Generation failed. Try again.')
    } finally {
      setGeneratingMonopoly(false)
    }
  }

  // ── Render ──

  if (branchLoading || !posLoaded) return null

  // No branch data at all
  if (!primary && !scores?.length) {
    return (
      <div className="cpc-card">
        <div className="cpc-header">
          <span className="cpc-icon">🗺️</span>
          <div className="cpc-header-text">
            <div className="cpc-title">Your Industry Position</div>
            <div className="cpc-sub">Complete the Curiosity Map or Life Map to see where you sit</div>
          </div>
        </div>
      </div>
    )
  }

  const primaryMeta = primary ? BRANCH_META[primary.branch] : null
  const secondaryMeta = secondary ? BRANCH_META[secondary.branch] : null
  const frontierCell = matrixData ? findCell(matrixData, primary?.branch, 'frontier') : null
  const emergingCell = matrixData ? findCell(matrixData, primary?.branch, 'emerging') : null
  const secondaryFrontier = secondary && matrixData ? findCell(matrixData, secondary.branch, 'frontier') : null
  const secondaryEmerging = secondary && matrixData ? findCell(matrixData, secondary.branch, 'emerging') : null
  const hasRemarkable = !!remarkableAngle?.combination_insight
  const hasStatement = statement.trim().length > 0
  const canGenerate = lifeQuake.trim().length > 5 && transformation.trim().length > 5
  const visibleScores = (scores || []).filter(s => s.score > 0).slice(0, 5)
  const maxScore = primary?.score || 1
  const hasMerge = primary && secondary && primary.branch !== secondary.branch

  return (
    <div className="cpc-card">
      {/* Header */}
      <div className="cpc-header">
        <span className="cpc-icon">{hasRemarkable ? '🎯' : '🗺️'}</span>
        <div className="cpc-header-text">
          <div className="cpc-title">{hasRemarkable ? 'Your Position' : 'Your Industry Frontier'}</div>
          {hasMerge && (
            <div className="cpc-sub">
              <span style={{ color: primaryMeta.color }}>{primaryMeta.label}</span>
              {' × '}
              <span style={{ color: secondaryMeta.color }}>{secondaryMeta.label}</span>
            </div>
          )}
        </div>
        {confidence > 0 && (
          <div className="cpc-confidence">{confidence}%</div>
        )}
      </div>

      {/* Monopoly block: number + intersection + vehicle/territory */}
      {rarity && (
        <div className="cpc-monopoly-block">
          <div className="cpc-rarity-number">
            {rarity.matchCount === 0
              ? `0 of ${rarity.totalProfiles}`
              : `${rarity.matchCount} of ${rarity.totalProfiles}`
            }
          </div>
          <div className="cpc-rarity-desc">
            {rarity.matchCount === 0
              ? 'Nobody shares your combination'
              : 'share your combination'
            }
          </div>
          {rarity.dimensions && (
            <div className="cpc-rarity-dims">
              {rarity.topSkill}{rarity.topProblem ? ` + ${rarity.topProblem.replace(/_/g, ' ')}` : ''}{rarity.topPersona ? ` + ${rarity.topPersona}` : ''}
            </div>
          )}
          {rarity.topMatches?.length > 0 && (
            <div className="cpc-rarity-matches">
              {rarity.matchCount === 0
                ? `Closest: ${rarity.topMatches.map(m => m.name).join(', ')}`
                : `Similar: ${rarity.topMatches.map(m => m.name).join(', ')}`
              }
            </div>
          )}

          {/* Competitive density (nearby experience creators) */}
          {nearbyCreators.length > 0 ? (
            <div className="cpc-competitive">
              <div className="cpc-competitive-label">Nearby creators</div>
              <div className="cpc-competitive-count">
                {nearbyCreators.length} of {(dnaData.profiles || []).length} experience creators work near your intersection
              </div>
              <div className="cpc-competitive-chips">
                {nearbyCreators.map(c => {
                  const meta = BRANCH_META[c.primaryBranch]
                  return (
                    <span
                      key={c.name}
                      className="cpc-competitive-chip"
                      style={{ borderColor: meta?.color || 'rgba(0,0,0,0.1)' }}
                      onClick={onCreatorTap ? () => onCreatorTap(c.name) : undefined}
                    >
                      {c.name} <span className="cpc-competitive-branch">{meta?.label || c.primaryBranch}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          ) : primary && (
            <div className="cpc-competitive">
              <div className="cpc-competitive-empty">No experience creators currently work at your intersection.</div>
            </div>
          )}

          {hasMerge && (
            <div className="cpc-merge-inline">
              Where <span style={{ color: primaryMeta.color, fontWeight: 700 }}>{primaryMeta.label}</span> meets <span style={{ color: secondaryMeta.color, fontWeight: 700 }}>{secondaryMeta.label}</span>. That intersection is yours.
            </div>
          )}

          {gap && (
            <div className="cpc-gap-inline">
              {gap.insight}
            </div>
          )}
        </div>
      )}

      {/* Primary Frontier Card */}
      {frontierCell && (<>
        <button
          type="button"
          className="cpc-frontier"
          onClick={() => setFrontierExpanded(!frontierExpanded)}
          aria-expanded={frontierExpanded}
        >
          {primaryMeta && (
            <div className="cpc-frontier-branch" style={{ color: primaryMeta.color }}>
              {primaryMeta.label} {frontierCell.phase === 'phase3' ? 'landscape' : 'frontier'}
            </div>
          )}

          {(() => {
            // Use simplified text if available, fall back to raw research text
            const s = frontierCell.simple
            const eS = emergingCell?.simple

            if (!frontierExpanded) {
              return (
                <>
                  <p className="cpc-frontier-gap">
                    {s?.gap || frontierCell.prediction || frontierCell.assumption}
                  </p>
                  <div className="cpc-frontier-tap">Tap to see full landscape</div>
                </>
              )
            }

            const isPhase3 = frontierCell.phase === 'phase3'
            const skillLabel = rarity?.topSkill?.replace(/_/g, ' ')
            const problemLabel = rarity?.topProblem?.replace(/_/g, ' ')
            return (
              <div className="cpc-frontier-expanded">
                <div className="cpc-frontier-section">
                  <div className="cpc-frontier-label">{isPhase3 ? "What's already working" : 'What everyone does'}</div>
                  <p>{s?.crowded || frontierCell.assumption}</p>
                </div>
                <div className="cpc-frontier-section">
                  <div className="cpc-frontier-label">{isPhase3 ? "What's still missing" : 'Why it no longer works'}</div>
                  <p>{s?.stuck || frontierCell.problem}</p>
                </div>
                {isPhase3 ? (
                  <div className="cpc-frontier-section">
                    <div className="cpc-frontier-label cpc-gap-label">Your opportunity</div>
                    {monopolyStatement ? (
                      <p className="cpc-gap-text">{monopolyStatement}</p>
                    ) : (
                      <p className="cpc-gap-text">
                        {skillLabel && problemLabel
                          ? `You ${skillLabel} people who experience ${problemLabel}. At this intersection: `
                          : ''
                        }
                        {s?.gap || eS?.gap || frontierCell.prediction}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="cpc-frontier-section">
                      <div className="cpc-frontier-label">What would actually work</div>
                      <p>{s?.gap || eS?.gap || frontierCell.prediction}</p>
                    </div>
                    <div className="cpc-frontier-section">
                      <div className="cpc-frontier-label cpc-gap-label">Your opportunity</div>
                      {monopolyStatement ? (
                        <p className="cpc-gap-text">{monopolyStatement}</p>
                      ) : (
                        <p className="cpc-gap-text">
                          {skillLabel && problemLabel
                            ? `You ${skillLabel} people who experience ${problemLabel}. Here, that looks like: ${s?.prediction || eS?.prediction || frontierCell.prediction || ''}`
                            : s?.prediction || eS?.prediction || ''
                          }
                        </p>
                      )}
                    </div>
                  </>
                )}
                <div className="cpc-frontier-tap">Collapse</div>
              </div>
            )
          })()}
        </button>

        {/* Generate / Regenerate monopoly — outside <button> to avoid nested buttons */}
        {frontierExpanded && rarity?.topSkill && rarity?.topProblem && (
          <div className="cpc-monopoly-action">
            {monopolyError && <div className="cpc-monopoly-error">{monopolyError}</div>}
            <button
              type="button"
              className="cpc-generate-monopoly"
              disabled={generatingMonopoly}
              onClick={generateMonopoly}
            >
              {generatingMonopoly ? 'Writing...' : monopolyStatement ? 'Regenerate my position' : 'Generate my position'}
            </button>
          </div>
        )}
      </>
      )}

      {/* Secondary frontier (if merge exists) */}
      {hasMerge && secondaryFrontier && (
        <button
          type="button"
          className="cpc-frontier cpc-frontier-secondary"
          onClick={() => setSecondaryExpanded(!secondaryExpanded)}
          aria-expanded={secondaryExpanded}
        >
          {secondaryMeta && (
            <div className="cpc-frontier-branch" style={{ color: secondaryMeta.color }}>
              {secondaryMeta.label} {secondaryFrontier?.phase === 'phase3' ? 'landscape' : 'frontier'}
            </div>
          )}
          {(() => {
            const s2 = secondaryFrontier.simple
            if (!secondaryExpanded) {
              return (
                <>
                  <p className="cpc-frontier-gap">{s2?.gap || secondaryFrontier.prediction || secondaryFrontier.assumption}</p>
                  <div className="cpc-frontier-tap">Tap to expand</div>
                </>
              )
            }
            const isP3 = secondaryFrontier.phase === 'phase3'
            return (
              <div className="cpc-frontier-expanded">
                <div className="cpc-frontier-section">
                  <div className="cpc-frontier-label">{isP3 ? "What's already working" : 'What everyone does'}</div>
                  <p>{s2?.crowded || secondaryFrontier.assumption}</p>
                </div>
                <div className="cpc-frontier-section">
                  <div className="cpc-frontier-label">{isP3 ? "What's still missing" : 'Why it no longer works'}</div>
                  <p>{s2?.stuck || secondaryFrontier.problem}</p>
                </div>
                {isP3 ? (
                  <div className="cpc-frontier-section">
                    <div className="cpc-frontier-label cpc-gap-label">Your opportunity</div>
                    <p className="cpc-gap-text">{s2?.gap || secondaryFrontier.prediction}</p>
                  </div>
                ) : (
                  <>
                    <div className="cpc-frontier-section">
                      <div className="cpc-frontier-label">What would actually work</div>
                      <p>{s2?.gap || secondaryFrontier.prediction}</p>
                    </div>
                    <div className="cpc-frontier-section">
                      <div className="cpc-frontier-label cpc-gap-label">Your opportunity</div>
                      <p className="cpc-gap-text">{s2?.prediction || secondaryFrontier.prediction}</p>
                    </div>
                  </>
                )}
                <div className="cpc-frontier-tap">Collapse</div>
              </div>
            )
          })()}
        </button>
      )}

      {/* Branch chart (collapsible) */}
      {visibleScores.length > 0 && (
        <div className="cpc-branches-section">
          <button
            type="button"
            className="cpc-branches-toggle"
            onClick={() => setBranchesExpanded(!branchesExpanded)}
            aria-expanded={branchesExpanded}
          >
            Your branches {branchesExpanded ? '▴' : '▾'}
          </button>
          {branchesExpanded && (
            <div className="cpc-branches">
              {visibleScores.map(({ branch, score }) => {
                const meta = BRANCH_META[branch]
                if (!meta) return null
                const pct = Math.round((score / maxScore) * 100)
                return (
                  <div key={branch} className="cpc-branch-row">
                    <div className="cpc-branch-label" style={{ color: meta.color }}>{meta.label}</div>
                    <div className="cpc-branch-track">
                      <div className="cpc-branch-fill" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rule break (post-Remarkable) */}
      {hasRemarkable && remarkableAngle.combination_insight && (
        <div className="cpc-rulebreak">
          <div className="cpc-rulebreak-label">Your rule break</div>
          <p>{remarkableAngle.combination_insight}</p>
        </div>
      )}

      {/* Positioning statement (post-Remarkable) */}
      {hasRemarkable && (
        <div className="cpc-positioning">
          {hasStatement && !posExpanded ? (
            <div className="cpc-pos-collapsed" onClick={() => setPosExpanded(true)} style={{ cursor: 'pointer' }}>
              <div className="cpc-pos-label">Your positioning</div>
              <p className="cpc-pos-text">{statement}</p>
              <span className="cpc-pos-edit">Edit ↓</span>
            </div>
          ) : (
            <>
              <div className="cpc-pos-label" onClick={hasStatement ? () => setPosExpanded(false) : undefined} style={{ cursor: hasStatement ? 'pointer' : 'default' }}>
                Your positioning {hasStatement && <span className="cpc-pos-edit">↑</span>}
              </div>

              <div className="cpc-pos-field">
                <label className="cpc-input-label">What moment brings someone to your door?</label>
                <textarea
                  className="cpc-input"
                  value={lifeQuake}
                  onChange={e => { setLifeQuake(e.target.value); saveField('life_quake', e.target.value) }}
                  placeholder="e.g. Just left a decade-long job"
                  rows={2}
                  maxLength={300}
                />
              </div>

              <div className="cpc-pos-field">
                <label className="cpc-input-label">What do they want to feel after?</label>
                <textarea
                  className="cpc-input"
                  value={transformation}
                  onChange={e => { setTransformation(e.target.value); saveField('transformation', e.target.value) }}
                  placeholder="e.g. Grounded and clear on what's next"
                  rows={2}
                  maxLength={300}
                />
              </div>

              {canGenerate && (
                <button className="cpc-generate" onClick={generateStatement} disabled={generating}>
                  {generating ? 'Writing...' : hasStatement ? 'Regenerate' : 'Generate My Positioning'}
                </button>
              )}

              {hasStatement && (
                <div className="cpc-pos-output">
                  {editingStatement ? (
                    <>
                      <textarea className="cpc-pos-edit-area" value={statement} onChange={e => setStatement(e.target.value)} rows={4} />
                      <button className="cpc-pos-save" onClick={saveEditedStatement}>Save</button>
                    </>
                  ) : (
                    <>
                      <p className="cpc-pos-text">{statement}</p>
                      <button className="cpc-pos-edit-btn" onClick={() => { hapticLight(); setEditingStatement(true) }}>Edit</button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Pre-Remarkable prompt */}
      {!hasRemarkable && frontierCell && (
        <div className="cpc-prompt">
          Is this the assumption you're breaking?
        </div>
      )}
    </div>
  )
}

// ── Helpers ──

function findCell(matrix, branchId, status) {
  if (!matrix?.cells || !branchId) return null
  const sdLevels = ['purple', 'red', 'blue', 'orange', 'green', 'yellow']
  for (const sd of sdLevels) {
    const cell = matrix.cells[`${branchId}-${sd}`]
    if (cell?.status === status) return cell
  }
  return null
}

function buildPrompt({ essenceName, skills, problems, remarkableAngle, lifeQuake, transformation, gap, primary }) {
  const parts = []
  parts.push(`Write a positioning statement for an experience creator. 2-3 sentences maximum. Plain English, no jargon, no em dashes. First person ("I help...").`)
  parts.push(`\nTheir identity: ${essenceName || 'Experience Creator'}`)
  if (skills?.length) parts.push(`Their skills: ${skills.slice(0, 3).join(', ')}`)
  if (problems?.length) parts.push(`Problems they solve: ${problems.slice(0, 3).join(', ')}`)
  if (remarkableAngle?.combination_insight) parts.push(`What makes them different: ${remarkableAngle.combination_insight}`)
  if (remarkableAngle?.ai_remarkable_bio) parts.push(`Their remarkable bio: ${remarkableAngle.ai_remarkable_bio}`)
  if (gap) parts.push(`Their strategic insight: ${gap.insight}`)
  if (primary) parts.push(`Their primary industry branch: ${primary.branch}`)
  parts.push(`\nWho comes to them: People who ${lifeQuake}`)
  parts.push(`What those people want: To ${transformation}`)
  parts.push(`\nWrite a crisp positioning statement that captures who they are, who they help, and why they're the right person. Make it feel human and specific, not generic.`)
  return parts.join('\n')
}

function buildFallbackStatement({ essenceName, lifeQuake, transformation, skills, remarkableAngle }) {
  const who = lifeQuake
  const what = transformation
  const skillStr = skills?.length ? skills[0] : ''
  const edge = remarkableAngle?.combination_insight || ''
  let s = `I help people who ${who} ${what ? `feel ${what}` : 'find their way back'}`
  if (skillStr) s += ` through ${skillStr.toLowerCase()}`
  s += '.'
  if (edge) s += ` ${edge}.`
  return s
}

function buildMonopolyPrompt({ essenceName, skills, problems, remarkableAngle, lifeQuake, transformation, gap, primary, secondary, rarity, frontierText, nearbyCreators, totalCreators }) {
  const parts = []
  parts.push(`You are a sharp strategic advisor. Write a 3-4 sentence positioning insight for an experience creator. This should read like a mentor who looked at all their data and told them exactly what they see.

Rules:
- Plain English a 12-year-old could understand
- No em dashes, no jargon, no buzzwords
- Second person ("You help..." not "I help...")
- Be specific to THEIR data, not generic
- Name real companies/models as reference points where relevant
- End with why their position matters or what gap they fill`)

  parts.push(`\n--- THEIR DATA ---`)
  if (essenceName) parts.push(`Essence archetype: ${essenceName}`)
  if (skills?.length) parts.push(`Skills: ${skills.slice(0, 4).join(', ')}`)
  if (problems?.length) parts.push(`Problems they solve: ${problems.slice(0, 4).join(', ')}`)

  if (primary) {
    parts.push(`Primary branch: ${primary.branch}`)
    if (secondary) parts.push(`Secondary branch: ${secondary.branch}`)
  }

  if (gap) parts.push(`Vehicle vs territory: ${gap.insight}`)

  if (rarity) {
    const dims = [rarity.topSkill?.replace(/_/g, ' '), rarity.topProblem?.replace(/_/g, ' '), rarity.topPersona].filter(Boolean).join(' + ')
    parts.push(`Monopoly: ${rarity.matchCount} of ${rarity.totalProfiles} share their combination (${dims})`)
    if (rarity.topMatches?.length) {
      parts.push(`Closest matches: ${rarity.topMatches.map(m => m.name).join(', ')}`)
    }
  }

  if (frontierText) parts.push(`\nMarket landscape for ${primary?.branch || 'their branch'}:\n${frontierText}`)

  if (nearbyCreators?.length > 0) {
    parts.push(`\nCompetitive landscape: ${nearbyCreators.length} of ${totalCreators || 33} curated experience creators work near their branch intersection: ${nearbyCreators.map(c => c.name).join(', ')}`)
  } else if (totalCreators) {
    parts.push(`\nCompetitive landscape: Nobody in our ${totalCreators} reference experience creators works at their intersection. They have no direct competition.`)
  }

  if (remarkableAngle?.combination_insight) parts.push(`\nTheir rule break: ${remarkableAngle.combination_insight}`)
  if (remarkableAngle?.different) parts.push(`What makes them different: ${remarkableAngle.different}`)

  if (lifeQuake) parts.push(`\nWho comes to their door: People who ${lifeQuake}`)
  if (transformation) parts.push(`What those people want: To ${transformation}`)

  parts.push(`\nWrite the positioning insight now. 3-4 sentences. Make it feel like a mentor speaking directly to them.`)
  return parts.join('\n')
}
