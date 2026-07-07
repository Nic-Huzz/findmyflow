/**
 * ContentIntel.jsx — AI-powered reel analysis cards for Growth tab
 * Shows reels with metrics + Gemini video analysis tags
 */

import { useState } from 'react'
import useContentIntel from '../../hooks/useContentIntel'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

const HOOK_LABELS = {
  face_to_camera: '🎙 Face to Camera',
  text_overlay: '📝 Text Overlay',
  pattern_interrupt: '⚡ Pattern Interrupt',
  question: '❓ Question',
  shock: '😱 Shock',
  story_opening: '📖 Story',
  b_roll: '🎬 B-Roll',
  montage: '🎞 Montage',
}

const CONTENT_LABELS = {
  teaches: '📚 Teaches',
  entertains: '🎭 Entertains',
  inspires: '💡 Inspires',
  storytelling: '📖 Story',
  behind_the_scenes: '🎬 BTS',
  transformation: '🔄 Transform',
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
    <div className="ch2-card" style={{ border: '1px solid rgba(94, 23, 235, 0.2)', padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="ch2-label" style={{ margin: 0 }}>Content Intel</div>
        {unanalyzedCount > 0 && !analyzing && (
          <button
            className="ch2-btn-outline"
            style={{ fontSize: 10, padding: '4px 10px' }}
            onClick={handleAnalyzeAll}
          >
            Analyze All ({unanalyzedCount})
          </button>
        )}
        {analyzing && (
          <div style={{ fontSize: 10, color: '#E9A23B' }}>
            Analyzing {progress.current}/{progress.total}...
          </div>
        )}
      </div>

      {/* Pattern Summary */}
      {patterns && (
        <div style={{ padding: '8px 14px', margin: '8px 14px 0', background: 'rgba(94, 23, 235, 0.08)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            {patterns.analyzedCount} reels analyzed
          </div>
          {patterns.bestHook && (
            <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.5 }}>
              <span style={{ color: '#E9A23B' }}>Best hook:</span> {HOOK_LABELS[patterns.bestHook] || patterns.bestHook}
              {patterns.bestHookMultiplier && patterns.bestHookMultiplier > 1 && (
                <span style={{ color: '#10b981', marginLeft: 6 }}>{patterns.bestHookMultiplier}x avg views</span>
              )}
            </div>
          )}
          {patterns.bestContent && (
            <div style={{ fontSize: 11, color: '#fff' }}>
              <span style={{ color: '#E9A23B' }}>Most saved:</span> {CONTENT_LABELS[patterns.bestContent] || patterns.bestContent}
            </div>
          )}
        </div>
      )}

      {/* Sort / Filter */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { hapticLight(); setSortBy(opt.value) }}
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 12,
              border: 'none',
              background: sortBy === opt.value ? 'rgba(233, 162, 59, 0.25)' : 'rgba(255,255,255,0.06)',
              color: sortBy === opt.value ? '#E9A23B' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
        {filterHookType && (
          <button
            onClick={() => setFilterHookType(null)}
            style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.3)', background: 'none',
              color: 'rgba(239,68,68,0.7)', cursor: 'pointer',
            }}
          >
            ✕ {filterHookType}
          </button>
        )}
      </div>

      {/* Reel Cards */}
      <div style={{ maxHeight: 420, overflowY: 'auto', padding: '0 14px 14px' }}>
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
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: a ? 'pointer' : 'default',
              }}
              onClick={() => a && setExpandedId(isExpanded ? null : reel.id)}
            >
              {/* Top row: thumb + info */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Thumbnail */}
                <div style={{
                  width: 52, height: 72, borderRadius: 6, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)', flexShrink: 0,
                }}>
                  {reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  <div style={{ display: reel.thumbnail_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>🎬</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {reel.caption?.substring(0, 55) || 'No caption'}
                    {reel.caption?.length > 55 ? '...' : ''}
                  </div>

                  {/* Metrics row */}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{(reel.views || 0).toLocaleString()} views</span>
                    <span>{reel.like_count || 0} likes</span>
                    {reel.shares > 0 && <span>{reel.shares} shares</span>}
                    {reel.saves > 0 && <span>{reel.saves} saves</span>}
                    {engRate && <span style={{ color: 'rgba(233,162,59,0.6)' }}>{engRate}% eng</span>}
                  </div>

                  {/* Reel-specific metrics */}
                  {(reel.skip_rate !== null || reel.avg_watch_time !== null) && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2, display: 'flex', gap: 8 }}>
                      {reel.skip_rate !== null && (
                        <span style={{ color: Number(reel.skip_rate) < 20 ? '#10b981' : Number(reel.skip_rate) > 50 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
                          Skip: {`${Number(reel.skip_rate).toFixed(0)}%`}
                        </span>
                      )}
                      {reel.avg_watch_time !== null && <span>Avg: {Number(reel.avg_watch_time).toFixed(1)}s</span>}
                    </div>
                  )}

                  {/* AI Tags or Analyze button */}
                  {a ? (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.hook_type && (
                        <span
                          onClick={e => { e.stopPropagation(); hapticLight(); setFilterHookType(a.hook_type) }}
                          style={tagStyle('#5e17eb')}
                        >
                          {HOOK_LABELS[a.hook_type] || a.hook_type}
                        </span>
                      )}
                      {a.content_type && <span style={tagStyle('#E9A23B')}>{CONTENT_LABELS[a.content_type] || a.content_type}</span>}
                      {a.hook_energy && <span style={tagStyle('#10b981')}>⚡ {a.hook_energy}/5</span>}
                    </div>
                  ) : isAnalyzing ? (
                    <div style={{ marginTop: 4, fontSize: 10, color: '#E9A23B' }}>
                      Watching reel...
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); handleAnalyzeOne(reel.ig_media_id) }}
                      style={{
                        marginTop: 4, fontSize: 10, padding: '3px 10px',
                        background: 'rgba(94, 23, 235, 0.15)', border: '1px solid rgba(94, 23, 235, 0.3)',
                        borderRadius: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                      }}
                    >
                      Analyze
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded analysis */}
              {isExpanded && a && (
                <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={detailRow}><span style={detailLabel}>Structure</span><span style={detailVal}>{a.structure}</span></div>
                  <div style={detailRow}><span style={detailLabel}>Talking head</span><span style={detailVal}>{a.talking_head_pct}%</span></div>
                  <div style={detailRow}><span style={detailLabel}>Audio</span><span style={detailVal}>{a.audio_type}{a.music_present ? ' + music' : ''}</span></div>
                  <div style={detailRow}><span style={detailLabel}>Pacing</span><span style={detailVal}>{a.pacing}</span></div>
                  <div style={detailRow}><span style={detailLabel}>Text overlays</span><span style={detailVal}>{a.text_overlay_present ? 'Yes' : 'No'}</span></div>
                  <div style={detailRow}><span style={detailLabel}>CTA</span><span style={detailVal}>{a.cta_present ? a.cta_type : 'None'}</span></div>
                  <div style={detailRow}><span style={detailLabel}>Emotional arc</span><span style={detailVal}>{(a.emotional_arc || '').replace(/_/g, ' ')}</span></div>
                  <div style={detailRow}><span style={detailLabel}>Duration est.</span><span style={detailVal}>{a.duration_estimate_seconds}s</span></div>
                  {a.key_message && (
                    <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, fontStyle: 'italic' }}>
                      "{a.key_message}"
                    </div>
                  )}
                  {a.uniqueness_factors?.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 3 }}>What makes it unique</div>
                      {a.uniqueness_factors.map((f, i) => (
                        <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>
                    {a.visual_style}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function tagStyle(color) {
  return {
    fontSize: 9,
    padding: '2px 6px',
    borderRadius: 8,
    background: `${color}18`,
    color: `${color}cc`,
    border: `1px solid ${color}22`,
    cursor: 'pointer',
  }
}

const detailRow = { display: 'flex', justifyContent: 'space-between', marginBottom: 3 }
const detailLabel = { fontSize: 10, color: 'rgba(255,255,255,0.25)' }
const detailVal = { fontSize: 10, color: 'rgba(255,255,255,0.5)' }
