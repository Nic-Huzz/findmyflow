/**
 * ContentIntel.jsx — AI-powered reel analysis cards for Growth tab
 * Shows reels with metrics + Gemini video analysis tags
 */

import { useState } from 'react'
import useContentIntel from '../../hooks/useContentIntel'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

const HOOK_LABELS = {
  face_to_camera: 'Face to Camera',
  text_overlay: 'Text Overlay',
  pattern_interrupt: 'Pattern Interrupt',
  question: 'Question',
  shock: 'Shock',
  story_opening: 'Story',
  b_roll: 'B-Roll',
  montage: 'Montage',
}

const HOOK_ICONS = {
  face_to_camera: '🎙',
  text_overlay: '📝',
  pattern_interrupt: '⚡',
  question: '❓',
  shock: '😱',
  story_opening: '📖',
  b_roll: '🎬',
  montage: '🎞',
}

const CONTENT_LABELS = {
  teaches: 'Teaches',
  entertains: 'Entertains',
  inspires: 'Inspires',
  storytelling: 'Story',
  behind_the_scenes: 'BTS',
  transformation: 'Transform',
}

const OPENING_LABELS = {
  bold_claim: 'Bold Claim',
  vulnerable_confession: 'Vulnerable',
  contrarian_take: 'Contrarian',
  relatable_pain: 'Relatable Pain',
  curiosity_gap: 'Curiosity Gap',
  direct_address: 'Direct Address',
  statistic: 'Statistic',
}

const STORY_LABELS = {
  origin_story: 'Origin Story',
  lesson_learned: 'Lesson Learned',
  before_after: 'Before/After',
  day_in_life: 'Day in Life',
  challenge_journey: 'Challenge Journey',
  analogy: 'Analogy',
  myth_busting: 'Myth Busting',
  direct_advice: 'Direct Advice',
}

const SORT_OPTIONS = [
  { value: 'posted_at', label: 'Recent' },
  { value: 'views', label: 'Views' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'skip_rate', label: 'Skip Rate' },
  { value: 'avg_watch_time', label: 'Watch Time' },
]

export default function ContentIntel() {
  const {
    reels, loading, analyzing, progress, unanalyzedCount,
    patterns, sortBy, setSortBy, filterHookType, setFilterHookType,
    analyzeReel, analyzeAll,
  } = useContentIntel()
  const [expandedId, setExpandedId] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)

  if (loading) return null
  if (reels.length === 0) return null

  async function handleAnalyzeOne(igMediaId) {
    hapticLight()
    setAnalyzingId(igMediaId)
    try {
      const result = await analyzeReel(igMediaId)
      if (result?.success) hapticSuccess()
    } catch (e) {
      console.warn('Analysis failed:', e)
    }
    setAnalyzingId(null)
  }

  async function handleAnalyzeAll() {
    hapticLight()
    await analyzeAll()
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(94, 23, 235, 0.18)',
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: 1, color: '#E9A23B',
        }}>
          Content Intel
        </div>
        {unanalyzedCount > 0 && !analyzing && (
          <button
            onClick={handleAnalyzeAll}
            style={{
              fontSize: 10, fontWeight: 600, padding: '5px 12px',
              background: 'linear-gradient(135deg, rgba(94,23,235,0.2), rgba(233,162,59,0.15))',
              border: '1px solid rgba(233,162,59,0.25)',
              borderRadius: 20, color: '#E9A23B', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Analyze {unanalyzedCount} new
          </button>
        )}
        {analyzing && (
          <div style={{
            fontSize: 10, fontWeight: 600, color: '#E9A23B',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6,
              borderRadius: '50%', background: '#E9A23B',
              animation: 'ch2spin 1s ease-in-out infinite',
            }} />
            {progress.current}/{progress.total}
          </div>
        )}
      </div>

      {/* Pattern Summary */}
      {patterns && (
        <div style={{
          margin: '12px 16px 0',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(94,23,235,0.1), rgba(233,162,59,0.06))',
          border: '1px solid rgba(94,23,235,0.12)',
          borderRadius: 10,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 0.8, color: 'rgba(255,255,255,0.25)', marginBottom: 6,
          }}>
            {patterns.analyzedCount} reels analyzed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {patterns.bestHook && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{HOOK_ICONS[patterns.bestHook] || '🎯'}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{HOOK_LABELS[patterns.bestHook]}</span> hooks perform best
                </span>
                {patterns.bestHookMultiplier && patterns.bestHookMultiplier > 1 && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                    background: 'rgba(16,185,129,0.15)', color: '#10b981',
                    borderRadius: 6, marginLeft: 'auto',
                  }}>
                    {patterns.bestHookMultiplier}x
                  </span>
                )}
              </div>
            )}
            {patterns.bestContent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>💾</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{CONTENT_LABELS[patterns.bestContent]}</span> content gets most saves
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sort / Filter */}
      <div style={{
        padding: '12px 16px 8px',
        display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { hapticLight(); setSortBy(opt.value) }}
            style={{
              fontSize: 10, fontWeight: sortBy === opt.value ? 600 : 400,
              padding: '4px 10px',
              borderRadius: 16,
              border: sortBy === opt.value ? '1px solid rgba(233,162,59,0.3)' : '1px solid transparent',
              background: sortBy === opt.value ? 'rgba(233,162,59,0.12)' : 'rgba(255,255,255,0.04)',
              color: sortBy === opt.value ? '#E9A23B' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        ))}
        {filterHookType && (
          <button
            onClick={() => setFilterHookType(null)}
            style={{
              fontSize: 10, padding: '4px 10px', borderRadius: 16,
              border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)',
              color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            ✕ {HOOK_LABELS[filterHookType] || filterHookType}
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{
        height: 1, margin: '0 16px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
      }} />

      {/* Reel Cards */}
      <div style={{ maxHeight: 460, overflowY: 'auto', padding: '4px 16px 16px' }}>
        {reels.map(reel => {
          const a = reel.ai_analysis
          const isExpanded = expandedId === reel.id
          const isAnalyzing = analyzingId === reel.ig_media_id || (analyzing && progress.currentId === reel.ig_media_id)
          const engRate = reel.reach > 0
            ? (((reel.like_count || 0) + (reel.comments_count || 0) + (reel.shares || 0) + (reel.saves || 0)) / reel.reach * 100).toFixed(1)
            : null

          return (
            <div
              key={reel.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: a ? 'pointer' : 'default',
              }}
              onClick={() => a && setExpandedId(isExpanded ? null : reel.id)}
            >
              {/* Top row: thumb + info */}
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Thumbnail */}
                <div style={{
                  width: 54, height: 74, borderRadius: 8, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  <div style={{
                    display: reel.thumbnail_url ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    height: '100%', fontSize: 20, color: 'rgba(255,255,255,0.15)',
                  }}>🎬</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {reel.caption?.substring(0, 60) || 'No caption'}
                    {reel.caption?.length > 60 ? '...' : ''}
                  </div>

                  {/* Metrics row */}
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4,
                    display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                      {(reel.views || 0).toLocaleString()}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.12)' }}>views</span>
                    <span style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
                    <span>{reel.like_count || 0} likes</span>
                    {reel.shares > 0 && <span>{reel.shares} shares</span>}
                    {reel.saves > 0 && <span>{reel.saves} saves</span>}
                    {engRate && (
                      <span style={{
                        color: '#E9A23B', fontWeight: 600,
                        marginLeft: 'auto',
                      }}>
                        {engRate}%
                      </span>
                    )}
                  </div>

                  {/* Reel-specific metrics */}
                  {(reel.skip_rate !== null || reel.avg_watch_time !== null) && (
                    <div style={{
                      fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3,
                      display: 'flex', gap: 8,
                    }}>
                      {reel.skip_rate !== null && (
                        <span style={{
                          color: Number(reel.skip_rate) < 20 ? '#10b981'
                            : Number(reel.skip_rate) > 50 ? '#ef4444'
                            : 'rgba(255,255,255,0.3)',
                          fontWeight: 500,
                        }}>
                          {`${Number(reel.skip_rate).toFixed(0)}%`} skip
                        </span>
                      )}
                      {reel.avg_watch_time !== null && (
                        <span>{Number(reel.avg_watch_time).toFixed(1)}s avg</span>
                      )}
                    </div>
                  )}

                  {/* AI Tags or Analyze button */}
                  {a ? (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.hook_type && (
                        <Tag
                          color="#5e17eb"
                          onClick={e => { e.stopPropagation(); hapticLight(); setFilterHookType(a.hook_type) }}
                        >
                          {HOOK_LABELS[a.hook_type] || a.hook_type}
                        </Tag>
                      )}
                      {a.content_type && (
                        <Tag color="#E9A23B">{CONTENT_LABELS[a.content_type] || a.content_type}</Tag>
                      )}
                      {a.hook_energy && (
                        <Tag color="#10b981">Energy {a.hook_energy}/5</Tag>
                      )}
                      {isExpanded
                        ? <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto', alignSelf: 'center' }}>tap to close</span>
                        : <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto', alignSelf: 'center' }}>tap for details</span>
                      }
                    </div>
                  ) : isAnalyzing ? (
                    <div style={{
                      marginTop: 6, fontSize: 10, color: '#E9A23B',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        display: 'inline-block', width: 5, height: 5,
                        borderRadius: '50%', background: '#E9A23B',
                        animation: 'ch2spin 1s ease-in-out infinite',
                      }} />
                      Watching reel...
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); handleAnalyzeOne(reel.ig_media_id) }}
                      style={{
                        marginTop: 6, fontSize: 10, fontWeight: 500, padding: '4px 14px',
                        background: 'rgba(94, 23, 235, 0.1)',
                        border: '1px solid rgba(94, 23, 235, 0.2)',
                        borderRadius: 16, color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s ease',
                      }}
                    >
                      Analyze
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded analysis */}
              {isExpanded && a && (
                <div style={{
                  marginTop: 10, padding: 14,
                  background: 'linear-gradient(135deg, rgba(94,23,235,0.06), rgba(233,162,59,0.03))',
                  border: '1px solid rgba(94,23,235,0.1)',
                  borderRadius: 10,
                }}>
                  {/* Viewer journey: Hook → Middle → Attention */}
                  {(reel.skip_rate !== null || reel.avg_watch_time !== null || (reel.total_watch_time > 0 && reel.views > 0)) && (
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                      marginBottom: 14, paddingBottom: 12,
                      borderBottom: '1px solid rgba(94,23,235,0.1)',
                    }}>
                      {/* Hook */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: 0.8, color: 'rgba(255,255,255,0.2)', marginBottom: 4,
                        }}>Hook</div>
                        <div style={{
                          fontSize: 18, fontWeight: 700, letterSpacing: -0.5,
                          color: reel.skip_rate !== null
                            ? (Number(reel.skip_rate) < 20 ? '#10b981' : Number(reel.skip_rate) > 50 ? '#ef4444' : 'rgba(255,255,255,0.5)')
                            : 'rgba(255,255,255,0.12)',
                        }}>
                          {reel.skip_rate !== null ? `${Number(reel.skip_rate).toFixed(0)}%` : '--'}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 1 }}>
                          skip rate
                        </div>
                      </div>

                      {/* Middle */}
                      <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{
                          fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: 0.8, color: 'rgba(255,255,255,0.2)', marginBottom: 4,
                        }}>Middle</div>
                        <div style={{
                          fontSize: 18, fontWeight: 700, letterSpacing: -0.5,
                          color: reel.avg_watch_time !== null ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
                        }}>
                          {reel.avg_watch_time !== null ? Number(reel.avg_watch_time).toFixed(1) : '--'}
                          {reel.avg_watch_time !== null && <span style={{ fontSize: 10, fontWeight: 400 }}>s</span>}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 1 }}>
                          avg watch
                        </div>
                      </div>

                      {/* Attention */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: 0.8, color: 'rgba(233,162,59,0.5)', marginBottom: 4,
                        }}>Attention</div>
                        <div style={{
                          fontSize: 18, fontWeight: 700, letterSpacing: -0.5,
                          color: (reel.total_watch_time > 0 && reel.views > 0) ? '#E9A23B' : 'rgba(255,255,255,0.12)',
                        }}>
                          {reel.total_watch_time > 0 && reel.views > 0
                            ? (Number(reel.total_watch_time) / reel.views).toFixed(1)
                            : '--'}
                          {reel.total_watch_time > 0 && reel.views > 0 && <span style={{ fontSize: 10, fontWeight: 400 }}>s</span>}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 1 }}>
                          per viewer
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                    <DetailItem label="Structure" value={(a.structure || '').replace(/_/g, ' ')} />
                    <DetailItem label="Talking head" value={`${a.talking_head_pct}%`} />
                    <DetailItem label="Audio" value={`${a.audio_type}${a.music_present ? ' + music' : ''}`} />
                    <DetailItem label="Pacing" value={a.pacing} />
                    <DetailItem label="Text overlays" value={a.text_overlay_present ? 'Yes' : 'No'} />
                    <DetailItem label="CTA" value={a.cta_present ? a.cta_type : 'None'} />
                    <DetailItem label="Emotional arc" value={(a.emotional_arc || '').replace(/_/g, ' ')} />
                    <DetailItem label="Duration" value={`${a.duration_estimate_seconds}s`} />
                    {a.opening_line_type && a.opening_line_type !== 'none' && <DetailItem label="Opening line" value={OPENING_LABELS[a.opening_line_type] || a.opening_line_type.replace(/_/g, ' ')} />}
                    {a.storytelling_framework && a.storytelling_framework !== 'none' && <DetailItem label="Story framework" value={STORY_LABELS[a.storytelling_framework] || a.storytelling_framework.replace(/_/g, ' ')} />}
                  </div>

                  {/* Key message */}
                  {a.key_message && (
                    <div style={{
                      marginTop: 12, padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      borderLeft: '2px solid rgba(233,162,59,0.3)',
                    }}>
                      <div style={{
                        fontSize: 10, color: 'rgba(255,255,255,0.45)',
                        lineHeight: 1.5, fontStyle: 'italic',
                      }}>
                        "{a.key_message}"
                      </div>
                    </div>
                  )}

                  {/* Uniqueness factors */}
                  {a.uniqueness_factors?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: 0.8, color: 'rgba(255,255,255,0.2)', marginBottom: 6,
                      }}>
                        What makes it unique
                      </div>
                      {a.uniqueness_factors.map((f, i) => (
                        <div key={i} style={{
                          fontSize: 10, color: 'rgba(255,255,255,0.35)',
                          lineHeight: 1.5, paddingLeft: 10,
                          borderLeft: '1px solid rgba(94,23,235,0.15)',
                          marginBottom: 4,
                        }}>
                          {f}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Visual style - subtle footer */}
                  {a.visual_style && (
                    <div style={{
                      marginTop: 8, paddingTop: 8,
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      fontSize: 9, color: 'rgba(255,255,255,0.12)',
                      fontStyle: 'italic',
                    }}>
                      {a.visual_style}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tag({ color, children, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        fontSize: 9, fontWeight: 600, padding: '2px 8px',
        borderRadius: 10,
        background: `${color}14`,
        color: `${color}bb`,
        border: `1px solid ${color}20`,
        cursor: onClick ? 'pointer' : 'default',
        letterSpacing: 0.2,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </span>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: 0.5, color: 'rgba(255,255,255,0.2)', marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500,
        textTransform: 'capitalize',
      }}>
        {value}
      </div>
    </div>
  )
}
