/**
 * FestLeaderboard.jsx
 *
 * Simple RP leaderboard for Vibe Rise Fest.
 * Join = insert into challenge_participants with FEST_GROUP_ID.
 * Leaderboard = all participants ranked by lifetime RP.
 *
 * CSS prefix: fl-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getLevel } from '../lib/crm/statsService'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './FestLeaderboard.css'

// Fixed group ID for Vibe Rise Fest
const FEST_GROUP_ID = 'bbbbbbbb-0000-0000-0000-000000000001'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function FestLeaderboard({ userId, onClose }) {
  const [joined, setJoined] = useState(null) // null = loading, true/false
  const [joining, setJoining] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('group_id', FEST_GROUP_ID)
        .eq('user_id', userId)
        .maybeSingle(),
      loadLeaderboard(),
    ]).then(([{ data }]) => {
      setJoined(!!data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  const loadLeaderboard = async () => {
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('group_id', FEST_GROUP_ID)

    if (!participants?.length) {
      setLeaderboard([])
      return
    }

    const userIds = participants.map(p => p.user_id)

    const [{ data: scores }, { data: profiles }, { data: authNames }] = await Promise.all([
      supabase
        .from('user_lifetime_scores')
        .select('user_id, lifetime_total_score')
        .in('user_id', userIds)
        .is('project_id', null),
      supabase
        .from('lead_flow_profiles')
        .select('user_id, user_name, custom_essence_image, custom_essence_name')
        .in('user_id', userIds)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_leaderboard_names', { p_user_ids: userIds }),
    ])

    const ranked = userIds.map(uid => {
      const score = scores?.find(s => s.user_id === uid)
      const profile = profiles?.find(p => p.user_id === uid)
      const authName = authNames?.find(a => a.user_id === uid)
      const rp = score?.lifetime_total_score || 0
      return {
        user_id: uid,
        firstName: profile?.user_name || authName?.display_name || 'Anonymous',
        essenceName: profile?.custom_essence_name || null,
        avatar: profile?.custom_essence_image || null,
        rp,
        level: getLevel(rp),
      }
    }).sort((a, b) => b.rp - a.rp)

    setLeaderboard(ranked)
  }

  const handleJoin = async () => {
    setJoining(true)
    hapticLight()

    const { error } = await supabase
      .from('challenge_participants')
      .insert({ group_id: FEST_GROUP_ID, user_id: userId })

    if (error) {
      console.error('Fest join error:', error)
      // Might already be joined (unique constraint)
      if (error.code === '23505') {
        setJoined(true)
        await loadLeaderboard()
      }
    } else {
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
                  {p.avatar ? (
                    <img src={p.avatar} alt="" />
                  ) : (
                    <span className="fl-avatar-placeholder">{(p.firstName || '?')[0]}</span>
                  )}
                </div>
                <div className="fl-info">
                  <span className="fl-name">{p.firstName}{isMe ? ' (you)' : ''}</span>
                  {p.essenceName && <span className="fl-essence">{p.essenceName}</span>}
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
