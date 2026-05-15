/**
 * FestLeaderboard.jsx
 *
 * Simple RP leaderboard for Vibe Rise Fest.
 * Join prompt → ranked list of participants by lifetime RP.
 *
 * CSS prefix: fl-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getLevel } from '../lib/crm/statsService'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './FestLeaderboard.css'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function FestLeaderboard({ userId, onClose }) {
  const [joined, setJoined] = useState(null) // null = loading, true/false
  const [joining, setJoining] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  // Check if user has joined + load leaderboard
  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase
        .from('user_stage_progress')
        .select('fest_participant, user_name')
        .eq('user_id', userId)
        .maybeSingle(),
      loadLeaderboard(),
    ]).then(([{ data }]) => {
      setJoined(data?.fest_participant || false)
      setUserName(data?.user_name || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  const loadLeaderboard = async () => {
    // Get all fest participants with their lifetime scores
    const { data: participants } = await supabase
      .from('user_stage_progress')
      .select('user_id, user_name, hero_avatar_url')
      .eq('fest_participant', true)

    if (!participants?.length) {
      setLeaderboard([])
      return
    }

    const userIds = participants.map(p => p.user_id)
    const { data: scores } = await supabase
      .from('user_lifetime_scores')
      .select('user_id, lifetime_total_score')
      .in('user_id', userIds)
      .is('project_id', null)

    const ranked = participants.map(p => {
      const score = scores?.find(s => s.user_id === p.user_id)
      return {
        ...p,
        rp: score?.lifetime_total_score || 0,
        level: getLevel(score?.lifetime_total_score || 0),
      }
    }).sort((a, b) => b.rp - a.rp)

    setLeaderboard(ranked)
  }

  const handleJoin = async () => {
    setJoining(true)
    hapticLight()

    const { error } = await supabase
      .from('user_stage_progress')
      .upsert({ user_id: userId, fest_participant: true }, { onConflict: 'user_id' })

    if (!error) {
      hapticSuccess()
      setJoined(true)
      await loadLeaderboard()
    }
    setJoining(false)
  }

  if (loading || joined === null) return null

  // Join prompt
  if (!joined) {
    return (
      <div className="fl-overlay" onClick={onClose}>
        <div className="fl-modal" onClick={e => e.stopPropagation()}>
          <div className="fl-join">
            <div className="fl-join-icon">⚡</div>
            <h2 className="fl-join-title">Join Vibe Rise Fest Group?</h2>
            <p className="fl-join-sub">Compete with others on the leaderboard. Your Rise Points track your progress.</p>
            <button className="fl-join-btn" onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join Now'}
            </button>
            <button className="fl-join-skip" onClick={onClose}>Maybe later</button>
          </div>
        </div>
      </div>
    )
  }

  // Leaderboard
  const myRank = leaderboard.findIndex(p => p.user_id === userId) + 1

  return (
    <div className="fl-overlay" onClick={onClose}>
      <div className="fl-modal fl-leaderboard-modal" onClick={e => e.stopPropagation()}>
        <div className="fl-header">
          <h2 className="fl-title">Vibe Rise Fest</h2>
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
                  {p.hero_avatar_url ? (
                    <img src={p.hero_avatar_url} alt="" />
                  ) : (
                    <span className="fl-avatar-placeholder">{(p.user_name || '?')[0]}</span>
                  )}
                </div>
                <div className="fl-info">
                  <span className="fl-name">{p.user_name || 'Anonymous'}{isMe ? ' (you)' : ''}</span>
                  <span className="fl-level">{p.level.emoji} {p.level.name}</span>
                </div>
                <span className="fl-rp">{p.rp} RP</span>
              </div>
            )
          })}

          {leaderboard.length === 0 && (
            <p className="fl-empty">No participants yet. You're first!</p>
          )}
        </div>
      </div>
    </div>
  )
}
