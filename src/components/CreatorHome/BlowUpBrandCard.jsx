/**
 * BlowUpBrandCard.jsx — Single "Blow Up Your Brand" pipeline card
 * Presentational only. All data + completion flags come from CreatorHomeV2.
 * 4-node stepper: Results → Reach → Growth → Score.
 * Stage-current logic mirrors the old sequential locking ternaries exactly:
 *   Reach unlocks when remarkableAngle exists, Growth when hasReach,
 *   Score when hasGrowth.
 */

import { useState } from 'react'

const STAGES = [
  {
    key: 'results',
    icon: '💎',
    label: 'Results',
    title: 'Remarkable Results',
    route: '/create/remarkable',
    desc: 'What do you do differently that gets unexpected results? Find your rule break. It powers everything after this.',
    cta: 'Find your rule break →',
    doneVal: 'Rule break found',
  },
  {
    key: 'reach',
    icon: '📡',
    label: 'Reach',
    title: 'Remarkable Reach',
    route: '/create/narrative-builder',
    desc: 'How do people hear about you? Find your strongest vehicle, your language, and who gives your audience permission.',
    cta: 'Build your reach →',
    doneVal: 'Vehicle, language, and cosign mapped',
  },
  {
    key: 'growth',
    icon: '🚀',
    label: 'Growth',
    title: 'Remarkable Growth',
    route: '/create/access-architecture',
    desc: 'Audit the 5 barriers between someone and your experience. Design a zero-friction on-ramp.',
    cta: 'Audit my barriers →',
    doneVal: '5 barriers audited, on-ramp designed',
  },
  {
    key: 'score',
    icon: '📊',
    label: 'Score',
    title: 'Scale Score',
    route: '/create/scale-diagnostic',
    desc: 'Will your experience scale? 3-pillar diagnostic that pulls from your previous work.',
    cta: 'Score my experience →',
    doneVal: '3-pillar diagnostic complete',
  },
]

export default function BlowUpBrandCard({ remarkableAngle, hasReach, hasGrowth, hasScaleScore, blowUpReadiness, navigate }) {
  const [showResultsMore, setShowResultsMore] = useState(false)

  const doneFlags = [!!remarkableAngle, hasReach, hasGrowth, hasScaleScore]
  const currentIndex = doneFlags.indexOf(false) // -1 when all done
  const allDone = currentIndex === -1
  const doneCount = doneFlags.filter(Boolean).length

  const badge = allDone
    ? { cls: 'ch2-badge-done', text: 'COMPLETE' }
    : currentIndex === 0
      ? { cls: 'ch2-badge-next', text: 'START HERE' }
      : { cls: 'ch2-badge-next', text: `STEP ${currentIndex + 1} OF 4` }

  const stepState = (i) => doneFlags[i] ? 'done' : i === currentIndex ? 'current' : 'locked'
  // Line between step i and i+1
  const lineState = (i) => doneFlags[i + 1] ? 'done' : doneFlags[i] ? 'half' : ''

  const currentStage = allDone ? null : STAGES[currentIndex]
  // Exclude stages already done (odd data states can have a later flag true while an earlier one is false)
  const lockedStages = allDone ? [] : STAGES.filter((s, i) => i > currentIndex && !doneFlags[i])

  return (
    <div className="ch2-id-section" id="ch2-playbook-card" style={{ paddingTop: 14 }}>
      <div className="ch2-card-header">
        <div className="ch2-card-header-left">
          <span className="ch2-card-icon">📣</span>
          <span className="ch2-label" style={{ margin: 0 }}>Blow Up Your Brand</span>
        </div>
        <span className={`ch2-card-badge ${badge.cls}`}>{badge.text}</span>
      </div>

      {/* Path stepper */}
      <div className="ch2-stepper">
        {STAGES.map((s, i) => (
          <span key={s.key} style={{ display: 'contents' }}>
            <div className={`ch2-step ${stepState(i)}`}>
              <div className="ch2-step-node">{s.icon}</div>
              <div className="ch2-step-label">{s.label}</div>
            </div>
            {i < STAGES.length - 1 && <div className={`ch2-step-line ${lineState(i)}`} />}
          </span>
        ))}
      </div>

      {/* Rule break tagline */}
      {remarkableAngle?.ai_rule_statement && (
        <div className="ch2-tagline">{remarkableAngle.ai_rule_statement}</div>
      )}

      {/* Done rows */}
      {STAGES.map((s, i) => {
        if (!doneFlags[i]) return null
        const isResults = s.key === 'results'
        return (
          <div key={s.key}>
            <div
              className="ch2-biz-row"
              style={{ cursor: 'pointer' }}
              onClick={() => isResults ? setShowResultsMore(v => !v) : navigate(s.route)}
            >
              <div className="ch2-check done">✓</div>
              <div className="ch2-biz-info">
                <div className="ch2-biz-label">{s.title} · Done</div>
                <div className="ch2-biz-val">
                  {isResults ? (remarkableAngle.extreme_action_plan || s.doneVal) : s.doneVal}
                </div>
              </div>
              <div className="ch2-row-chevron">{isResults ? (showResultsMore ? '˅' : '›') : '›'}</div>
            </div>

            {/* Expandable Results details + readiness */}
            {isResults && showResultsMore && (
              <div className="ch2-results-more">
                {remarkableAngle.experience && (
                  <DetailRow icon="🎪" label="The Experience" val={remarkableAngle.experience} />
                )}
                {remarkableAngle.different && (
                  <DetailRow icon="✨" label="How You're Different" val={remarkableAngle.different} />
                )}
                {remarkableAngle.assumption && (
                  <DetailRow icon="🔥" label="The Assumption You Break" val={remarkableAngle.assumption} />
                )}
                {remarkableAngle.combination_insight && (
                  <DetailRow icon="🔀" label="Two Worlds" val={remarkableAngle.combination_insight} />
                )}
                {remarkableAngle.wound_problem && (
                  <DetailRow icon="🎯" label="The Problem" val={remarkableAngle.wound_problem} />
                )}
                {remarkableAngle.score_unique != null && remarkableAngle.score_share != null && remarkableAngle.score_simple != null && (
                  <DetailRow icon="📊" label="Remarkability Score" val={`${remarkableAngle.score_unique} × ${remarkableAngle.score_share} × ${remarkableAngle.score_simple} = ${remarkableAngle.score_unique * remarkableAngle.score_share * remarkableAngle.score_simple}`} />
                )}
                {remarkableAngle.ai_remarkable_bio && (
                  <DetailRow icon="📝" label="Remarkable Bio" val={remarkableAngle.ai_remarkable_bio} />
                )}

                {blowUpReadiness && (
                  <>
                    <div className="ch2-label" style={{ marginTop: 10 }}>Readiness</div>
                    <ReadinessRow
                      status={blowUpReadiness.layer1_status}
                      name="Distilled"
                      hint={blowUpReadiness.layer1_status === 'green'
                        ? remarkableAngle.extreme_action_plan || 'Your method is compressed'
                        : 'Keep running experiences. Capture 3% after each.'}
                    />
                    <ReadinessRow
                      status={blowUpReadiness.layer2_status}
                      name="Proven"
                      hint={blowUpReadiness.layer2_status === 'green'
                        ? `${blowUpReadiness.proof_count === '50_plus' ? '50+' : '10-50'} people experienced it`
                        : blowUpReadiness.layer2_status === 'amber'
                          ? '1-10 people so far. Keep going.'
                          : 'Run 5 experiences. Capture one 3% improvement after each.'}
                    />
                    <ReadinessRow
                      status={blowUpReadiness.layer3_status}
                      name="Ceiling"
                      hint={blowUpReadiness.ceiling_type === 'reach'
                        ? 'Reach ceiling. Your method is ready for a bigger container.'
                        : blowUpReadiness.ceiling_type === 'credibility'
                          ? 'Credibility ceiling. You need proof that scales.'
                          : 'Keep filling the room you\'re in.'}
                    />
                  </>
                )}
                <button className="ch2-readiness-retake" onClick={() => navigate('/create/remarkable')}>
                  Open Remarkable Results →
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* NEXT UP block for the current stage */}
      {currentStage && (
        <div className="ch2-next-block">
          <div className="ch2-card-header" style={{ marginBottom: 2 }}>
            <div className="ch2-card-header-left">
              <span className="ch2-card-icon">{currentStage.icon}</span>
              <span className="ch2-label" style={{ margin: 0, color: 'var(--gold-text)' }}>{currentStage.title}</span>
            </div>
            <span className="ch2-card-badge ch2-badge-next">NEXT UP</span>
          </div>
          <p className="ch2-next-desc">{currentStage.desc}</p>
          <button className="ch2-btn-gold" style={{ width: '100%', marginTop: 12 }} onClick={() => navigate(currentStage.route)}>
            {currentStage.cta}
          </button>
        </div>
      )}

      {/* Locked stages coming up */}
      {lockedStages.map((s, i) => (
        <div key={s.key} className="ch2-biz-row ch2-row-dim">
          <div className="ch2-biz-icon">{s.icon}</div>
          <div className="ch2-biz-info">
            <div className="ch2-biz-label">{s.title}</div>
            <div className="ch2-biz-val" style={{ fontWeight: 500, color: 'var(--grey)' }}>
              Unlocks after {i === 0 ? currentStage.label : lockedStages[i - 1].label}
            </div>
          </div>
          <div style={{ fontSize: 13 }}>🔒</div>
        </div>
      ))}

      {/* Hidden anchor for hero progress consumers */}
      <span style={{ display: 'none' }} data-done-count={doneCount} />
    </div>
  )
}

function DetailRow({ icon, label, val }) {
  return (
    <div className="ch2-biz-row">
      <div className="ch2-biz-icon">{icon}</div>
      <div className="ch2-biz-info">
        <div className="ch2-biz-label">{label}</div>
        <div className="ch2-biz-val">{val}</div>
      </div>
    </div>
  )
}

function ReadinessRow({ status, name, hint }) {
  return (
    <div className={`ch2-readiness-row ch2-readiness-${status}`}>
      <span className="ch2-readiness-dot" />
      <div className="ch2-readiness-info">
        <span className="ch2-readiness-name">{name}</span>
        <span className="ch2-readiness-hint">{hint}</span>
      </div>
    </div>
  )
}
