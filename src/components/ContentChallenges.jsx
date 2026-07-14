/**
 * ContentChallenges — Fantasy League Reach challenge cards
 *
 * Renders 6 Reach tasks on the Courage tab (league members only).
 * URL-based challenges open an inline URL input.
 * "Comment & Engage" uses a player picker (select 3 league players).
 * "Accountability Post" uses a quest task picker (multi-select courage tasks).
 * Challenges with crossPostToFeed also post to the community feed.
 */
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONTENT_POINT_VALUES } from '../lib/league/leagueConfig'
import { submitContent } from '../lib/league/leagueService'
import { supabase } from '../lib/supabaseClient'
import { postFeedEvent } from '../lib/communityFeed'
import ContentTemplateModal from './ContentTemplateModal'
import './ContentChallenges.css'

const CONTENT_TYPES = Object.entries(CONTENT_POINT_VALUES)

export default function ContentChallenges({
  leagueId,
  userId,
  teamId,
  weekNumber,
  leagueStatus,
  isOnTeam,
  teams,
  contentSubmissions,
  onSubmitted,
  // Template data props
  standings,
  userTeam,
  userData,
}) {
  const [expandedCard, setExpandedCard] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState(new Set())
  const [selectedTasks, setSelectedTasks] = useState(new Set())
  const [questTasks, setQuestTasks] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null)

  // Build a map of content_type → latest submission this week
  const submissionMap = useMemo(() => {
    const map = {}
    if (!contentSubmissions) return map
    contentSubmissions.forEach(sub => {
      if (sub.week_number === weekNumber) {
        if (!map[sub.content_type] || new Date(sub.created_at) > new Date(map[sub.content_type].created_at)) {
          map[sub.content_type] = sub
        }
      }
    })
    return map
  }, [contentSubmissions, weekNumber])

  // Flatten all league members for the player picker (exclude self)
  const [playerNames, setPlayerNames] = useState({})

  const allPlayerIds = useMemo(() => {
    if (!teams || teams.length === 0) return []
    const players = []
    teams.forEach(team => {
      (team.fantasy_team_members || []).forEach(member => {
        if (member.user_id !== userId) {
          players.push({
            userId: member.user_id,
            teamName: team.name,
          })
        }
      })
    })
    return players
  }, [teams, userId])

  // Resolve display names from lead_flow_profiles
  useEffect(() => {
    if (allPlayerIds.length === 0) return
    const ids = allPlayerIds.map(p => p.userId)
    supabase
      .from('lead_flow_profiles')
      .select('user_id, user_name')
      .in('user_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(row => { map[row.user_id] = row.user_name })
        setPlayerNames(map)
      })
  }, [allPlayerIds])

  const allPlayers = useMemo(() => {
    return allPlayerIds.map(p => ({
      ...p,
      displayName: playerNames[p.userId] || null,
    }))
  }, [allPlayerIds, playerNames])

  // Fetch active courage quest tasks for Accountability Post
  useEffect(() => {
    if (expandedCard !== 'accountability_post' || !userId) return
    supabase
      .from('quest_tasks')
      .select('id, text, quest_id, quests!inner(title, user_id)')
      .eq('quests.user_id', userId)
      .eq('is_courage_challenge', true)
      .eq('done', false)
      .then(({ data }) => setQuestTasks(data || []))
  }, [expandedCard, userId])

  // Empty state — no league or not on team
  if (!leagueId || !isOnTeam) {
    return (
      <div className="content-challenges">
        <div className="content-empty-state">
          <p>Join the Fantasy League to unlock Reach challenges!</p>
          <Link to="/league" className="content-empty-link">Go to Fantasy League</Link>
        </div>
      </div>
    )
  }

  const canSubmit = leagueStatus === 'upcoming' || leagueStatus === 'active'

  const handleToggleCard = (key) => {
    if (expandedCard === key) {
      setExpandedCard(null)
      setUrlInput('')
      setSelectedPlayers(new Set())
      setSelectedTasks(new Set())
    } else {
      setExpandedCard(key)
      setUrlInput('')
      setSelectedPlayers(new Set())
      setSelectedTasks(new Set())
    }
  }

  const handleUrlSubmit = async (contentType) => {
    if (!urlInput.trim()) return
    setSubmitting(true)
    try {
      const submission = await submitContent({
        leagueId, userId, teamId, weekNumber,
        contentType,
        linkUrl: urlInput.trim(),
        description: null,
      })
      setExpandedCard(null)
      setUrlInput('')
      onSubmitted?.()

      // Cross-post to community feed if flagged
      const config = CONTENT_POINT_VALUES[contentType]
      if (config?.crossPostToFeed) {
        postFeedEvent(userId, 'reach_share', config.label, urlInput.trim(), {
          contentType,
          points: config.points,
        })
      }

      // Fire-and-forget: scrape OG metadata
      if (submission?.id) {
        supabase.functions.invoke('scrape-og-metadata', {
          body: { submissionId: submission.id },
        }).catch(err => console.warn('OG scrape failed (non-critical):', err))
      }
    } catch (err) {
      console.error('Error submitting content:', err)
      alert('Error submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlayerPickerSubmit = async () => {
    if (selectedPlayers.size < 3) return
    setSubmitting(true)
    try {
      await submitContent({
        leagueId, userId, teamId, weekNumber,
        contentType: 'comment_engage',
        linkUrl: JSON.stringify([...selectedPlayers]),
        description: null,
      })
      setExpandedCard(null)
      setSelectedPlayers(new Set())
      onSubmitted?.()
    } catch (err) {
      console.error('Error submitting engagement:', err)
      alert('Error submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePlayer = (playerId) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else if (next.size < 3) next.add(playerId)
      return next
    })
  }

  const toggleTask = (taskId) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleAccountabilitySubmit = async () => {
    if (selectedTasks.size === 0) return
    setSubmitting(true)
    try {
      const selectedNames = questTasks
        .filter(t => selectedTasks.has(t.id))
        .map(t => t.text)
      const commitmentText = selectedNames.map(n => `\u2713 ${n}`).join('\n')

      await submitContent({
        leagueId, userId, teamId, weekNumber,
        contentType: 'accountability_post',
        linkUrl: JSON.stringify([...selectedTasks]),
        description: commitmentText,
      })

      // Post to community feed
      postFeedEvent(userId, 'accountability', 'Accountability Post', commitmentText)

      setExpandedCard(null)
      setSelectedTasks(new Set())
      onSubmitted?.()
    } catch (err) {
      console.error('Error submitting accountability post:', err)
      alert('Error submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (contentType) => {
    const sub = submissionMap[contentType]
    if (!sub) return null
    return (
      <span className={`content-status-badge content-status-${sub.status}`}>
        {sub.status === 'pending' ? 'Pending' : sub.status === 'approved' ? 'Approved' : 'Rejected'}
      </span>
    )
  }

  // Build template data for the active template type
  const openTemplate = (templateType) => {
    const baseData = { weekNumber, teamName: userTeam?.name || 'My Team' }

    switch (templateType) {
      case 'leaderboard':
        setActiveTemplate({
          type: 'leaderboard',
          data: {
            ...baseData,
            standings: (standings || []).map(s => ({
              id: s.team_id,
              name: s.team_name || s.name || 'Team',
              wins: s.wins ?? 0,
              draws: s.draws ?? 0,
              losses: s.losses ?? 0,
              points: s.match_points ?? s.points ?? 0,
            })),
            userTeamId: userTeam?.id,
          },
        })
        break

      case 'scorecard':
        setActiveTemplate({
          type: 'scorecard',
          data: {
            ...baseData,
            opponentName: 'Opponent',
            score: '0 \u2013 0',
            categories: [],
          },
        })
        break

      case 'courage':
        setActiveTemplate({
          type: 'courage',
          data: {
            ...baseData,
            challengeText: 'Share a courage challenge you completed',
            visibilityLayer: 'Screen',
          },
        })
        break

      default:
        return
    }
  }

  return (
    <div className="content-challenges">
      <div className="content-card-list">
        {CONTENT_TYPES.map(([key, config]) => {
          const isExpanded = expandedCard === key
          const existingSub = submissionMap[key]
          const isBlocked = existingSub && (existingSub.status === 'pending' || existingSub.status === 'approved')

          return (
            <div key={key} className={`content-card ${isExpanded ? 'expanded' : ''} ${isBlocked ? 'submitted' : ''}`}>
              <button
                className="content-card-header"
                onClick={() => canSubmit && !isBlocked && handleToggleCard(key)}
                disabled={isBlocked || !canSubmit}
              >
                <span className="content-card-icon">{config.icon}</span>
                <div className="content-card-info">
                  <span className="content-card-label">{config.label}</span>
                  <span className="content-card-desc">{config.description}</span>
                </div>
                <div className="content-card-right">
                  {getStatusBadge(key) || (
                    <span className="content-card-points">+{config.points}</span>
                  )}
                </div>
              </button>

              {isExpanded && !isBlocked && config.submissionType === 'url' && (
                <div className="content-card-form">
                  {config.templateType && (
                    <button
                      className="content-template-btn"
                      onClick={(e) => { e.stopPropagation(); openTemplate(config.templateType) }}
                    >
                      <span className="content-template-icon">🎨</span>
                      Get Template Image
                    </button>
                  )}
                  <input
                    type="text"
                    className="content-url-input"
                    placeholder="Paste link to your post..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit(key)}
                    autoFocus
                  />
                  <button
                    className="content-submit-btn"
                    onClick={() => handleUrlSubmit(key)}
                    disabled={submitting || !urlInput.trim()}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}

              {isExpanded && !isBlocked && config.submissionType === 'player_picker' && (
                <div className="content-card-form">
                  <p className="content-picker-hint">
                    Tap 3 players you engaged with
                    <span className="content-picker-count">{selectedPlayers.size}/3</span>
                  </p>
                  <div className="content-player-grid">
                    {allPlayers.map(p => {
                      const isSelected = selectedPlayers.has(p.userId)
                      const isMaxed = selectedPlayers.size >= 3 && !isSelected
                      const firstName = (p.displayName || 'Player').split(' ')[0]
                      return (
                        <button
                          key={p.userId}
                          className={`content-player-chip ${isSelected ? 'selected' : ''} ${isMaxed ? 'maxed' : ''}`}
                          onClick={() => togglePlayer(p.userId)}
                          disabled={isMaxed}
                        >
                          <span className="player-chip-check">{isSelected ? '✓' : ''}</span>
                          <span className="player-chip-name">{firstName}</span>
                          <span className="player-chip-team">{p.teamName}</span>
                        </button>
                      )
                    })}
                  </div>
                  {allPlayers.length === 0 && (
                    <p className="content-picker-empty">No other players in the league yet.</p>
                  )}
                  <button
                    className="content-submit-btn"
                    onClick={handlePlayerPickerSubmit}
                    disabled={submitting || selectedPlayers.size < 3}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}

              {isExpanded && !isBlocked && config.submissionType === 'quest_task_picker' && (
                <div className="content-card-form">
                  <p className="content-picker-hint">
                    Pick courage challenges you're committing to this week
                    <span className="content-picker-count">{selectedTasks.size} selected</span>
                  </p>
                  <div className="content-player-grid">
                    {questTasks.map(task => {
                      const isSelected = selectedTasks.has(task.id)
                      return (
                        <button
                          key={task.id}
                          className={`content-player-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleTask(task.id)}
                        >
                          <span className="player-chip-check">{isSelected ? '✓' : ''}</span>
                          <span className="player-chip-name">{task.text}</span>
                        </button>
                      )
                    })}
                  </div>
                  {questTasks.length === 0 && (
                    <p className="content-picker-empty">No active courage challenges. Add some on the Courage tab first.</p>
                  )}
                  <button
                    className="content-submit-btn"
                    onClick={handleAccountabilitySubmit}
                    disabled={submitting || selectedTasks.size === 0}
                  >
                    {submitting ? 'Posting...' : 'Post Commitment'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activeTemplate && (
        <ContentTemplateModal
          templateType={activeTemplate.type}
          data={activeTemplate.data}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  )
}
