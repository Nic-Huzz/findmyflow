/**
 * LeagueOverview.jsx — /league
 * Fantasy League hub: matchup card, standings, schedule, rules
 *
 * Redesigned hierarchy: identity strip → matchup hero → tabs → content
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { createTeam, joinTeam, joinSolo } from '../../lib/league/leagueService'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../../lib/league/leagueConfig'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import { supabase } from '../../lib/supabaseClient'
import LeagueLeaderboard from '../../components/league/LeagueLeaderboard'
import { trackLeagueJoined } from '../../lib/analytics'
import './LeagueOverview.css'

export default function LeagueOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    loading, league, teams, userTeam, standings, matchups,
    isOnTeam, leagueExists, reloadTeams, getCurrentWeek, getWeekMatchups,
    getWeekDateRange, fetchLiveTeamScores, memberNames, memberAvatars, memberEssenceNames,
  } = useLeagueData()

  // UI State
  const [activeTab, setActiveTab] = useState('feed')
  const [feedData, setFeedData] = useState(null)
  const [feedLoading, setFeedLoading] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSoloModal, setShowSoloModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Interest state (for non-joined landing page)
  const [interestSubmitted, setInterestSubmitted] = useState(false)
  const [interestSubmitting, setInterestSubmitting] = useState(false)

  // Week state (lifted from LeagueLeaderboard so matchup card + standings stay in sync)
  const currentWeek = getCurrentWeek()
  const numWeeks = league?.num_weeks || 4
  const isUpcoming = currentWeek === 0
  const [selectedWeek, setSelectedWeek] = useState(currentWeek || 1)

  useEffect(() => {
    if (currentWeek > 0) setSelectedWeek(currentWeek)
  }, [currentWeek])

  // Live matchup scores (for hero card)
  const [liveMatchupScores, setLiveMatchupScores] = useState(null)
  const [loadingLive, setLoadingLive] = useState(false)

  // Handle ?join= query param
  useEffect(() => {
    const joinParam = searchParams.get('join')
    if (joinParam && !isOnTeam) {
      setJoinCode(joinParam.toUpperCase())
      setShowJoinModal(true)
    }
  }, [searchParams, isOnTeam])

  // Pre-fill display name
  const getDefaultDisplayName = async () => {
    if (!user?.id) return ''
    const { data } = await supabase
      .from('user_stage_progress')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
    return data?.display_name?.split(' ')[0] || user.email?.split('@')[0] || ''
  }

  // ============================================
  // Feed: yesterday's activity for all league members
  // ============================================

  const loadFeedData = useCallback(async () => {
    if (!teams?.length || !league?.start_date) return
    setFeedLoading(true)
    try {
      const allMemberIds = teams.flatMap(t =>
        (t.fantasy_team_members || []).map(m => m.user_id)
      )
      if (allMemberIds.length === 0) { setFeedData({ days: [] }); return }

      // Build list of days from season start to today
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      const seasonStart = league.start_date // YYYY-MM-DD
      const startDate = new Date(seasonStart + 'T00:00:00')

      // If season hasn't started, show empty
      if (startDate > now) {
        setFeedData({ days: [] })
        return
      }

      // Fetch aggregated activity via RPC (bypasses RLS)
      const { data: activity } = await supabase.rpc('get_league_daily_activity', {
        member_ids: allMemberIds,
        since_date: seasonStart,
      })

      // Group by date
      const dayMap = {}
      const addDay = (dateStr) => {
        if (!dayMap[dateStr]) {
          dayMap[dateStr] = {}
          allMemberIds.forEach(id => {
            dayMap[dateStr][id] = { practices: 0, wahoos: 0, healing: 0 }
          })
        }
      }

      // Add today even if empty
      addDay(today)

      ;(activity || []).forEach(row => {
        const dateStr = row.activity_date
        if (!dateStr) return
        addDay(dateStr)
        const u = dayMap[dateStr]?.[row.user_id]
        if (!u) return
        const count = parseInt(row.checkin_count) || 0
        if (row.checkin_type === 'daily') u.practices += count
        else if (row.checkin_type === 'playlist') u.wahoos += count
        else if (row.checkin_type === 'healing') u.healing += count
      })

      // Convert to sorted array (newest first)
      const days = Object.entries(dayMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([dateStr, users]) => ({
          date: dateStr,
          label: dateStr === today ? 'Today' : new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          isToday: dateStr === today,
          players: Object.entries(users).map(([userId, stats]) => {
            const teamEntry = teams.find(t => t.fantasy_team_members?.some(m => m.user_id === userId))
            const total = stats.practices + stats.wahoos + stats.healing
            return {
              userId,
              teamName: teamEntry?.name || 'Player',
              avatar: memberAvatars?.[userId] || null,
              ...stats,
              total,
              active: total > 0,
            }
          }).sort((a, b) => b.total - a.total),
        }))

      setFeedData({ days })
    } catch (err) {
      console.warn('Feed load error:', err)
      setFeedData(null)
    } finally {
      setFeedLoading(false)
    }
  }, [teams, league, memberAvatars])

  useEffect(() => {
    if (activeTab === 'feed' && !feedData && teams?.length) loadFeedData()
  }, [activeTab, feedData, teams, loadFeedData])

  // ============================================
  // Matchup helpers
  // ============================================

  const getTeamById = useCallback((teamId) => {
    return teams.find(t => t.id === teamId)
  }, [teams])

  const getTeamNameById = useCallback((teamId) => {
    return getTeamById(teamId)?.name || 'TBD'
  }, [getTeamById])

  const getTeamMembers = useCallback((teamId) => {
    const team = getTeamById(teamId)
    return (team?.fantasy_team_members || []).map(m => m.user_id)
  }, [getTeamById])

  const getTeamAvatar = useCallback((teamId) => {
    const memberId = getTeamById(teamId)?.fantasy_team_members?.[0]?.user_id
    return memberId ? memberAvatars?.[memberId] : null
  }, [getTeamById, memberAvatars])

  const getTeamEssenceName = useCallback((teamId) => {
    const memberId = getTeamById(teamId)?.fantasy_team_members?.[0]?.user_id
    return memberId ? memberEssenceNames?.[memberId] : null
  }, [getTeamById, memberEssenceNames])

  const getUserMatchup = useCallback((weekNum) => {
    if (!userTeam) return null
    const weekMatchups = getWeekMatchups(weekNum)
    return weekMatchups.find(m =>
      m.team_a_id === userTeam.id || m.team_b_id === userTeam.id
    ) || null
  }, [userTeam, getWeekMatchups])

  const orientMatchup = useCallback((matchup) => {
    if (!matchup || !userTeam) return null
    const isTeamA = matchup.team_a_id === userTeam.id
    return {
      myTeamId: isTeamA ? matchup.team_a_id : matchup.team_b_id,
      oppTeamId: isTeamA ? matchup.team_b_id : matchup.team_a_id,
      myMatchPoints: isTeamA ? matchup.team_a_match_points : matchup.team_b_match_points,
      oppMatchPoints: isTeamA ? matchup.team_b_match_points : matchup.team_a_match_points,
      myCategoriesWon: isTeamA ? matchup.team_a_categories_won : matchup.team_b_categories_won,
      oppCategoriesWon: isTeamA ? matchup.team_b_categories_won : matchup.team_a_categories_won,
      categoryResults: (matchup.category_results || []).map(cr => ({
        ...cr,
        myScore: isTeamA ? cr.teamAScore : cr.teamBScore,
        oppScore: isTeamA ? cr.teamBScore : cr.teamAScore,
        myWinner: cr.winner === (isTeamA ? 'a' : 'b'),
        oppWinner: cr.winner === (isTeamA ? 'b' : 'a'),
      })),
      calculated: !!matchup.calculated_at,
    }
  }, [userTeam])

  // ============================================
  // Live score fetching
  // ============================================

  useEffect(() => {
    if (isUpcoming || !userTeam) {
      setLiveMatchupScores(null)
      setLoadingLive(false)
      return
    }

    const matchup = getUserMatchup(selectedWeek)
    if (!matchup || matchup.calculated_at) {
      setLiveMatchupScores(null)
      setLoadingLive(false)
      return
    }

    let cancelled = false
    setLoadingLive(true)

    const myMembers = getTeamMembers(userTeam.id)
    const oppId = matchup.team_a_id === userTeam.id ? matchup.team_b_id : matchup.team_a_id
    const oppMembers = getTeamMembers(oppId)

    Promise.all([
      fetchLiveTeamScores(myMembers, selectedWeek),
      fetchLiveTeamScores(oppMembers, selectedWeek),
    ]).then(([my, opp]) => {
      if (!cancelled) {
        setLiveMatchupScores(my && opp ? { my, opponent: opp } : null)
        setLoadingLive(false)
      }
    }).catch(() => {
      if (!cancelled) setLoadingLive(false)
    })

    return () => { cancelled = true }
  }, [selectedWeek, userTeam, isUpcoming, getUserMatchup, getTeamMembers, fetchLiveTeamScores])

  // ============================================
  // Week navigation
  // ============================================

  const handlePrevWeek = () => {
    hapticLight()
    setSelectedWeek(w => Math.max(1, w - 1))
  }

  const handleNextWeek = () => {
    hapticLight()
    setSelectedWeek(w => Math.min(numWeeks, w + 1))
  }

  // ============================================
  // Actions
  // ============================================

  const handleJoinSolo = async () => {
    if (!league?.id) return
    setActionLoading(true)
    try {
      const name = displayName.trim()
      const fallback = await getDefaultDisplayName()
      await joinSolo({ leagueId: league.id, userId: user.id, displayName: name || fallback || 'Player' })
      trackLeagueJoined({ leagueId: league.id, teamName: name || fallback || 'Player' })
      hapticSuccess()
      setShowSoloModal(false)
      setDisplayName('')
      await reloadTeams()
    } catch (err) {
      alert(err.message || 'Error joining league')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !league?.id) return
    setActionLoading(true)
    try {
      await createTeam({ leagueId: league.id, name: teamName.trim(), userId: user.id })
      hapticSuccess()
      setShowCreateModal(false)
      setTeamName('')
      await reloadTeams()
    } catch (err) {
      alert(err.message || 'Error creating team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return
    setActionLoading(true)
    try {
      await joinTeam({ inviteCode: joinCode.trim(), userId: user.id })
      hapticSuccess()
      setShowJoinModal(false)
      setJoinCode('')
      await reloadTeams()
    } catch (err) {
      alert(err.message || 'Error joining team')
    } finally {
      setActionLoading(false)
    }
  }

  const handleShare = async () => {
    if (!userTeam?.invite_code) return
    const shareUrl = `${window.location.origin}/league?join=${userTeam.invite_code}`
    const shareText = `Join my Fantasy League on Vibe Rise! Code: ${userTeam.invite_code} — ${shareUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join the League', text: shareText })
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        alert('Share link copied!')
      } catch { /* clipboard failed */ }
    }
  }

  const getDaysUntilStart = () => {
    if (!league?.start_date) return null
    const start = new Date(league.start_date)
    const now = new Date()
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const handleExpressInterest = async () => {
    if (!user?.id) return
    setInterestSubmitting(true)
    try {
      const { error } = await supabase.from('league_signups').insert({
        user_id: user.id,
        name: user.email?.split('@')[0] || 'Player',
        team_readiness: 'solo',
      })
      if (error) {
        console.warn('Interest save failed:', error)
        alert('Something went wrong. Please try again.')
        setInterestSubmitting(false)
        return
      }
      hapticSuccess()
      setInterestSubmitted(true)
    } catch (err) {
      console.warn('Interest error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setInterestSubmitting(false)
    }
  }

  // ============================================
  // Render: Matchup Hero Card (promoted from LeagueLeaderboard)
  // ============================================

  const renderMatchupCard = () => {
    if (isUpcoming || !userTeam) return null

    const matchup = getUserMatchup(selectedWeek)

    // Bye week — compact inline message
    if (!matchup) {
      return (
        <div className="lo-matchup-compact">
          <div className="lo-matchup-week-nav">
            <button className="lo-week-btn" onClick={handlePrevWeek} disabled={selectedWeek <= 1}>←</button>
            <span className="lo-week-display">
              Week {selectedWeek}
              {selectedWeek === currentWeek && <span className="lo-week-current">Current</span>}
            </span>
            <button className="lo-week-btn" onClick={handleNextWeek} disabled={selectedWeek >= numWeeks}>→</button>
          </div>
          <div className="lo-bye-inline">
            <span>🏖️</span>
            <span>Bye week. No matchup this week.</span>
          </div>
        </div>
      )
    }

    const oriented = orientMatchup(matchup)
    const isLive = !oriented.calculated && liveMatchupScores

    let categoryRows
    if (oriented.calculated) {
      categoryRows = oriented.categoryResults
    } else if (isLive) {
      categoryRows = CATEGORY_KEYS.map(key => {
        const myScore = liveMatchupScores.my?.[key] || 0
        const oppScore = liveMatchupScores.opponent?.[key] || 0
        return {
          category: key,
          myScore, oppScore,
          myWinner: myScore > oppScore,
          oppWinner: oppScore > myScore,
        }
      })
    }

    let myWins = 0, oppWins = 0
    if (isLive && categoryRows) {
      categoryRows.forEach(r => {
        if (r.myWinner) myWins++
        if (r.oppWinner) oppWins++
      })
    }

    return (
      <div className="lo-matchup-hero">
        {/* Week nav integrated into card header */}
        <div className="lo-matchup-week-nav">
          <button className="lo-week-btn" onClick={handlePrevWeek} disabled={selectedWeek <= 1}>←</button>
          <span className="lo-week-display">
            Week {selectedWeek}
            {selectedWeek === currentWeek && <span className="lo-week-current">Current</span>}
            {isLive && <span className="lo-live-badge">LIVE</span>}
          </span>
          <button className="lo-week-btn" onClick={handleNextWeek} disabled={selectedWeek >= numWeeks}>→</button>
        </div>

        {/* VS layout with avatars */}
        <div className="lo-matchup-teams">
          <div className="lo-matchup-player">
            {getTeamAvatar(oriented.myTeamId) ? (
              <img src={getTeamAvatar(oriented.myTeamId)} alt="" className="lo-matchup-avatar" />
            ) : (
              <div className="lo-matchup-avatar lo-matchup-avatar--fallback">{getTeamNameById(oriented.myTeamId).charAt(0)}</div>
            )}
            <span className="lo-matchup-team-name">{getTeamNameById(oriented.myTeamId)}</span>
          </div>
          <span className="lo-matchup-vs">VS</span>
          <div className="lo-matchup-player">
            {getTeamAvatar(oriented.oppTeamId) ? (
              <img src={getTeamAvatar(oriented.oppTeamId)} alt="" className="lo-matchup-avatar" />
            ) : (
              <div className="lo-matchup-avatar lo-matchup-avatar--fallback">{getTeamNameById(oriented.oppTeamId).charAt(0)}</div>
            )}
            <span className="lo-matchup-team-name">{getTeamNameById(oriented.oppTeamId)}</span>
          </div>
        </div>

        {/* Category scores */}
        {loadingLive && !categoryRows && (
          <div className="lo-matchup-loading"><div className="lo-spinner" /></div>
        )}

        {categoryRows && (
          <div className="lo-matchup-categories">
            {categoryRows.map(row => {
              const cat = FANTASY_CATEGORIES[row.category]
              if (!cat) return null
              return (
                <div key={row.category} className="lo-cat-row">
                  <span className={`lo-cat-score ${row.myWinner ? 'lo-winning' : ''}`}>{row.myScore}</span>
                  <span className="lo-cat-label">{cat.icon} {cat.label}</span>
                  <span className={`lo-cat-score ${row.oppWinner ? 'lo-winning' : ''}`}>{row.oppScore}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Result */}
        <div className="lo-matchup-result">
          {oriented.calculated ? (
            <span>
              Result: {oriented.myCategoriesWon} – {oriented.oppCategoriesWon}
              {oriented.myMatchPoints === 3 && ' · Win'}
              {oriented.oppMatchPoints === 3 && ' · Loss'}
              {oriented.myMatchPoints === 1 && ' · Draw'}
            </span>
          ) : isLive ? (
            <span>Live: {myWins} – {oppWins}</span>
          ) : null}
        </div>
      </div>
    )
  }

  // ============================================
  // Loading & Empty
  // ============================================

  if (loading) {
    return (
      <div className="league-overview">
        <div className="lo-loading">
          <div className="lo-spinner" />
          <p>Loading league...</p>
        </div>
      </div>
    )
  }

  if (!leagueExists) {
    return (
      <div className="league-overview">
        <div className="lo-toolbar">
          <button className="lo-back" onClick={() => navigate('/me')}>←</button>
          <h2 className="lo-toolbar-title">Fantasy League</h2>
        </div>
        <div className="lo-empty">
          <span className="lo-empty-icon">🏆</span>
          <h3 className="lo-empty-title">No Active League</h3>
          <p className="lo-empty-text">A league hasn't been created yet. Check back soon!</p>
          <button className="lo-cta" onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // Render: Mini landing page for non-joined users
  // ============================================

  if (leagueExists && !isOnTeam && league.status !== 'completed') {
    return (
      <div className="league-overview lo-landing">
        {/* Toolbar */}
        <div className="lo-toolbar">
          <button className="lo-back" onClick={() => navigate('/me')}>←</button>
          <h2 className="lo-toolbar-title">Fantasy League</h2>
        </div>

        {/* Hero */}
        <div className="lo-land-hero">
          <p className="lo-land-eyebrow">SEASON 1</p>
          <h1 className="lo-land-h1">Think Fantasy Football<br />For Your Growth.</h1>
          <p className="lo-land-sub">
            Compete head-to-head each week. Score points for practices, wahoos, and healing you're already doing.
          </p>
          <button className="lo-cta" onClick={() => document.getElementById('lo-interest')?.scrollIntoView({ behavior: 'smooth' })}>
            I'm In <span>→</span>
          </button>
        </div>

        {/* Why It Works */}
        <div className="lo-land-section">
          <p className="lo-land-label">WHY IT WORKS</p>
          <h2 className="lo-land-h2">Making accountability fun.</h2>
          <p className="lo-land-muted">You want to do these things anyway. This just makes it more fun.</p>
          <div className="lo-land-sells">
            <div className="lo-land-sell">
              <span className="lo-land-sell-icon">🎯</span>
              <h3>Score points for what you're already doing</h3>
              <p>Now every action earns you Rise Points.</p>
            </div>
            <div className="lo-land-sell">
              <span className="lo-land-sell-icon">🤝</span>
              <h3>Connect with like-minded legends</h3>
              <p>You're not doing this alone. Play alongside people on the same path.</p>
            </div>
            <div className="lo-land-sell">
              <span className="lo-land-sell-icon">🔥</span>
              <h3>Compete head-to-head each week</h3>
              <p>You vs another player. Who doesn't love to win?</p>
            </div>
          </div>
        </div>

        {/* Example Scoreboard */}
        <div className="lo-land-section">
          <p className="lo-land-label">EXAMPLE SCOREBOARD</p>
          <p className="lo-land-muted">Score more in 2 of 3 categories to win the week.</p>
          <div className="lo-land-scoreboard">
            <div className="lo-land-sc-header">
              <span>Comfort Crushers</span>
              <span className="lo-land-sc-vs">VS</span>
              <span>Flow Finders</span>
            </div>
            {[
              { emoji: '☀️', name: 'Tune', left: 145, right: 162 },
              { emoji: '🔥', name: 'Wahoos', left: 89, right: 67 },
              { emoji: '💚', name: 'Healing', left: 85, right: 70 },
            ].map(row => (
              <div key={row.name} className="lo-land-sc-row">
                <span className={`lo-land-sc-score ${row.left > row.right ? 'lo-land-sc-win' : ''}`}>{row.left}</span>
                <span className="lo-land-sc-cat">{row.emoji} {row.name}</span>
                <span className={`lo-land-sc-score ${row.right > row.left ? 'lo-land-sc-win' : ''}`}>{row.right}</span>
              </div>
            ))}
            <div className="lo-land-sc-result">Comfort Crushers win 2-1 🏆</div>
          </div>
        </div>

        {/* Season Details */}
        <div className="lo-land-section">
          <p className="lo-land-label">SEASON 1</p>
          <h2 className="lo-land-h2">Season Details</h2>
          <div className="lo-land-details">
            {[
              { emoji: '📅', label: 'Duration', value: '4 weeks' },
              { emoji: '⚔️', label: 'Format', value: 'Weekly matchup' },
              { emoji: '📱', label: 'Platform', value: 'Vibe Rise app' },
              { emoji: '🏆', label: 'Prize', value: 'Bragging rights' },
            ].map(item => (
              <div key={item.label} className="lo-land-detail">
                <span className="lo-land-detail-emoji">{item.emoji}</span>
                <span className="lo-land-detail-label">{item.label}</span>
                <span className="lo-land-detail-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Express Interest */}
        <div className="lo-land-section lo-land-interest" id="lo-interest">
          {!interestSubmitted ? (
            <>
              <p className="lo-land-label">JOIN</p>
              <h2 className="lo-land-h2">Express your interest.</h2>
              <p className="lo-land-muted">Tap below and Nic will confirm your spot.</p>
              <div className="lo-land-form">
                <button className="lo-cta" onClick={handleExpressInterest} disabled={interestSubmitting}>
                  {interestSubmitting ? 'Submitting...' : "I'm Interested →"}
                </button>
              </div>
            </>
          ) : (
            <div className="lo-land-success">
              <span className="lo-land-success-icon">🏆</span>
              <h3>Interest received.</h3>
              <p>Nic will confirm your spot shortly.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // Render: Active player view
  // ============================================

  return (
    <div className="league-overview">
      {/* Toolbar */}
      <div className="lo-toolbar">
        <button className="lo-back" onClick={() => navigate('/me')}>←</button>
        <h2 className="lo-toolbar-title">Fantasy League</h2>
      </div>

      {/* Identity Strip — slim, ambient */}
      <div className="lo-identity">
        {isOnTeam ? (
          <>
            <span className="lo-identity-text">
              Playing as <strong>{userTeam.name}</strong>
              {(() => {
                const myStanding = standings.find(s => s.teamId === userTeam.id)
                if (!myStanding || isUpcoming) return null
                return <span className="lo-identity-record"> · {myStanding.wins}W {myStanding.draws}D {myStanding.losses}L</span>
              })()}
            </span>
            <button className="lo-invite-btn" onClick={handleShare}>Invite</button>
          </>
        ) : (
          <span className="lo-identity-text">{league.name} · Season Complete</span>
        )}
      </div>

      {/* Upcoming state */}
      {isUpcoming && getDaysUntilStart() !== null && (
        <div className="lo-upcoming-banner">
          Season starts in {getDaysUntilStart()} day{getDaysUntilStart() !== 1 ? 's' : ''}
        </div>
      )}

      {/* Matchup Card — the true hero */}
      {renderMatchupCard()}

      {/* Tabs — immediately below matchup */}
      <div className="lo-tabs">
        {['feed', 'standings', 'schedule', 'rules'].map(tab => (
          <button
            key={tab}
            className={`lo-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { hapticLight(); setActiveTab(tab) }}
          >
            {tab === 'feed' ? 'Feed' : tab === 'standings' ? 'Standings' : tab === 'schedule' ? 'Schedule' : 'Rules'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <section className="lo-section lo-feed">
          {feedLoading ? (
            <div className="lo-feed-loading"><div className="lo-spinner" /></div>
          ) : !feedData?.days?.length ? (
            <div className="lo-feed-empty">
              <span className="lo-feed-empty-icon">📡</span>
              <p>Season starts {league?.start_date ? new Date(league.start_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'soon'}. Activity will appear here on Day 1.</p>
            </div>
          ) : (
            feedData.days.map(day => (
              <div key={day.date} className="lo-feed-section">
                <span className={`lo-feed-label ${day.isToday ? 'lo-feed-label--today' : ''}`}>
                  {day.isToday ? `TODAY · ${day.label}` : day.label}
                </span>
                {day.players.map(p => (
                  <div key={p.userId} className={`lo-feed-row ${!p.active ? 'lo-feed-row--inactive' : ''}`}>
                    {p.avatar ? (
                      <img src={p.avatar} alt="" className="lo-feed-avatar" />
                    ) : (
                      <div className="lo-feed-avatar lo-feed-avatar--fallback">{p.teamName.charAt(0)}</div>
                    )}
                    <div className="lo-feed-info">
                      <span className="lo-feed-name">{p.teamName}</span>
                      {p.active ? (
                        <span className="lo-feed-stats">
                          {[
                            p.practices > 0 && `${p.practices} practice${p.practices !== 1 ? 's' : ''}`,
                            p.wahoos > 0 && `${p.wahoos} wahoo${p.wahoos !== 1 ? 's' : ''}`,
                            p.healing > 0 && `${p.healing} healing`,
                          ].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="lo-feed-stats lo-feed-stats--none">{day.isToday ? 'No activity yet' : 'No activity'}</span>
                      )}
                    </div>
                    {p.active && <span className="lo-feed-dot" />}
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === 'standings' && (
        <LeagueLeaderboard
          standings={standings}
          matchups={matchups}
          userTeam={userTeam}
          league={league}
          teams={teams}
          getCurrentWeek={getCurrentWeek}
          getWeekMatchups={getWeekMatchups}
          getWeekDateRange={getWeekDateRange}
          fetchLiveTeamScores={fetchLiveTeamScores}
          memberNames={memberNames}
          memberAvatars={memberAvatars}
          memberEssenceNames={memberEssenceNames}
          selectedWeek={selectedWeek}
          liveMatchupScores={liveMatchupScores}
        />
      )}

      {activeTab === 'schedule' && (
        <section className="lo-section">
          {Array.from({ length: numWeeks }, (_, i) => i + 1).map(weekNum => {
            const weekMatchups = getWeekMatchups(weekNum)
            return (
              <div key={weekNum} className="lo-card">
                <div className="lo-week-header">
                  <span className="lo-week-label">Week {weekNum}</span>
                  {weekNum === currentWeek && league.status === 'active' && (
                    <span className="lo-week-badge">Current</span>
                  )}
                </div>
                {weekMatchups.length === 0 ? (
                  <p className="lo-no-matchups">Matchups TBD</p>
                ) : (
                  weekMatchups.map(m => {
                    const isMine = userTeam && (m.team_a_id === userTeam.id || m.team_b_id === userTeam.id)
                    return (
                      <div key={m.id} className={`lo-matchup-row ${isMine ? 'lo-matchup-row--mine' : ''}`}>
                        <div className={`lo-matchup-team ${m.team_a_match_points === 3 ? 'winner' : ''}`}>
                          {getTeamAvatar(m.team_a_id) ? (
                            <img src={getTeamAvatar(m.team_a_id)} alt="" className="lo-schedule-avatar" />
                          ) : (
                            <div className="lo-schedule-avatar lo-schedule-avatar--fallback">{getTeamNameById(m.team_a_id).charAt(0)}</div>
                          )}
                          <span className="lo-matchup-name">{getTeamNameById(m.team_a_id)}</span>
                          {m.calculated_at && (
                            <span className="lo-matchup-score">{m.team_a_categories_won}</span>
                          )}
                        </div>
                        <span className="lo-matchup-vs-text">
                          {m.calculated_at ? `${m.team_a_match_points} - ${m.team_b_match_points}` : 'vs'}
                        </span>
                        <div className={`lo-matchup-team ${m.team_b_match_points === 3 ? 'winner' : ''}`}>
                          {getTeamAvatar(m.team_b_id) ? (
                            <img src={getTeamAvatar(m.team_b_id)} alt="" className="lo-schedule-avatar" />
                          ) : (
                            <div className="lo-schedule-avatar lo-schedule-avatar--fallback">{getTeamNameById(m.team_b_id).charAt(0)}</div>
                          )}
                          <span className="lo-matchup-name">{getTeamNameById(m.team_b_id)}</span>
                          {m.calculated_at && (
                            <span className="lo-matchup-score">{m.team_b_categories_won}</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </section>
      )}

      {activeTab === 'rules' && (
        <section className="lo-section">
          <a href="/league/guide" className="lo-guide-link">
            New to Fantasy? Read the full guide →
          </a>
          <div className="lo-card">
            <h3 className="lo-rules-title">How It Works</h3>
            <div className="lo-rules-list">
              <div className="lo-rule">
                <span className="lo-rule-num">1</span>
                <div>
                  <strong>Join the League</strong>
                  <p>Play solo or form a team. Complete quests to earn points across 3 categories.</p>
                </div>
              </div>
              <div className="lo-rule">
                <span className="lo-rule-num">2</span>
                <div>
                  <strong>Compete Weekly</strong>
                  <p>Head-to-head matchups each week. Your quest scores compete across 3 categories.</p>
                </div>
              </div>
              <div className="lo-rule">
                <span className="lo-rule-num">3</span>
                <div>
                  <strong>Win Categories</strong>
                  <p>Win 2+ of 3 categories = Win (3 pts). Tie 1-1 = Draw (1 pt each). Win 0 = Loss (0 pts).</p>
                </div>
              </div>
            </div>

            <h4 className="lo-rules-subtitle">3 Scoring Categories</h4>
            <div className="lo-categories-grid">
              {CATEGORY_KEYS.map(key => {
                const cat = FANTASY_CATEGORIES[key]
                return (
                  <div key={key} className="lo-category-pill" style={{ borderColor: cat.color }}>
                    <span className="lo-cat-icon">{cat.icon}</span>
                    <span className="lo-cat-label-text">{cat.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Join Solo Modal */}
      {showSoloModal && (
        <div className="lo-modal-overlay" onClick={() => setShowSoloModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Join the League</h3>
              <button className="lo-modal-close" onClick={() => setShowSoloModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-field">
                <label>Display Name (optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to your first name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowSoloModal(false)}>Cancel</button>
                <button className="lo-save" onClick={handleJoinSolo} disabled={actionLoading}>
                  {actionLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="lo-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Join a Team</h3>
              <button className="lo-modal-close" onClick={() => setShowJoinModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-field">
                <label>Invite Code</label>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button className="lo-save" onClick={handleJoinTeam} disabled={actionLoading || !joinCode.trim()}>
                  {actionLoading ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="lo-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="lo-modal" onClick={e => e.stopPropagation()}>
            <div className="lo-modal-header">
              <h3>Create a Team</h3>
              <button className="lo-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="lo-modal-body">
              <div className="lo-field">
                <label>Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Flow Warriors"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>
              <div className="lo-modal-actions">
                <button className="lo-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="lo-save" onClick={handleCreateTeam} disabled={actionLoading || !teamName.trim()}>
                  {actionLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
