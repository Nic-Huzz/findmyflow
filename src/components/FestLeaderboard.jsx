/**
 * FestLeaderboard.jsx
 *
 * Vibe Rise leaderboard popup.
 * Shows all users active in the past 7 days, ranked by capacity score.
 *
 * CSS prefix: fl-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getLevel } from '../lib/crm/statsService'
import './FestLeaderboard.css'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function FestLeaderboard({ userId, onClose }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    loadLeaderboard().finally(() => setLoading(false))
  }, [userId])

  const loadLeaderboard = async () => {
    // All users active in the past 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: scores } = await supabase
      .from('user_lifetime_scores')
      .select('user_id, lifetime_total_score, capacity_score, capacity_zone, safety_score, expression_score')
      .is('project_id', null)
      .gte('updated_at', sevenDaysAgo.toISOString())

    if (!scores?.length) {
      setLeaderboard([])
      return
    }

    const userIds = scores.map(s => s.user_id)

    const [{ data: profiles }, { data: authNames }] = await Promise.all([
      supabase
        .from('lead_flow_profiles')
        .select('user_id, user_name, custom_essence_image, custom_essence_name')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_leaderboard_names', { p_user_ids: userIds }),
    ])

    const ranked = scores.map(score => {
      const uid = score.user_id
      const profile = profiles?.find(p => p.user_id === uid)
      const authName = authNames?.find(a => a.user_id === uid)
      const rp = score.lifetime_total_score || 0

      return {
        user_id: uid,
        firstName: profile?.user_name || authName?.display_name || 'Anonymous',
        avatar: profile?.custom_essence_image || null,
        rp,
        level: getLevel(rp),
        capacity: score.capacity_score ?? 0,
        zone: score.capacity_zone || 'stuck',
        safety: score.safety_score ?? 0,
        expression: score.expression_score ?? 0,
      }
    }).sort((a, b) => b.capacity - a.capacity || b.rp - a.rp)

    setLeaderboard(ranked)
  }

  if (loading) return null

  const myRank = leaderboard.findIndex(p => p.user_id === userId) + 1

  return (
    <div className="fl-overlay" onClick={onClose}>
      <div className="fl-modal fl-leaderboard-modal" onClick={e => e.stopPropagation()}>
        <div className="fl-header">
          <h2 className="fl-title">Vibe Rise Leaderboard</h2>
          <button className="fl-close" onClick={onClose}>×</button>
        </div>

        {myRank > 0 && (
          <div className="fl-my-rank">
            You're #{myRank} of {leaderboard.length}
          </div>
        )}

        <div className="fl-list">
          {leaderboard.map((p, i) => {
            const isMe = p.user_id === userId
            return (
              <div key={p.user_id} className={`fl-row ${isMe ? 'fl-row-me' : ''}`}>
                <span className="fl-rank">{RANK_MEDALS[i] || `#${i + 1}`}</span>
                <div className="fl-avatar">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" />
                  ) : (
                    <span className="fl-avatar-placeholder">{(p.firstName || '?')[0]}</span>
                  )}
                </div>
                <div className="fl-info">
                  <span className="fl-name">{p.firstName}{isMe ? ' (you)' : ''}</span>
                  <span className="fl-level">{p.level.emoji} {p.level.name}: {p.rp} RP</span>
                </div>
                <div className="fl-scores">
                  <span className="fl-axes">🛡️ {p.safety} x ✨ {p.expression}</span>
                  <span className={`fl-capacity fl-capacity-${p.zone}`}>{p.capacity}</span>
                </div>
              </div>
            )
          })}

          {leaderboard.length === 0 && (
            <p className="fl-empty">No active users this week</p>
          )}
        </div>
      </div>
    </div>
  )
}
