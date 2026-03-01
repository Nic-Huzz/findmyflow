/**
 * WeekMatchups — /league/week
 * All matchups for the current week at a glance. Tappable to your own matchup details.
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../../lib/league/leagueConfig'
import './WeekMatchups.css'

// ─── DEV MOCK DATA (remove when league is live) ───
const DEV_MOCK = {
  currentWeek: 3,
  matchups: [
    {
      id: 'm1',
      teamA: 'Groan Crushers',
      teamB: 'Flow Warriors',
      teamACatsWon: 2,
      teamBCatsWon: 1,
      isYours: true,
      calculated: false,
      categories: [
        { key: 'play_list', aScore: 12, bScore: 18 },
        { key: 'healing', aScore: 22, bScore: 14 },
        { key: 'bonus', aScore: 20, bScore: 10 },
      ],
    },
    {
      id: 'm2',
      teamA: 'Healing Vibes',
      teamB: 'Bonus Hunters',
      teamACatsWon: 0,
      teamBCatsWon: 3,
      isYours: false,
      calculated: false,
      categories: [
        { key: 'play_list', aScore: 20, bScore: 22 },
        { key: 'healing', aScore: 18, bScore: 24 },
        { key: 'bonus', aScore: 8, bScore: 25 },
      ],
    },
    {
      id: 'm3',
      teamA: 'Nervous Wrecks',
      teamB: 'Play Masters',
      teamACatsWon: 1,
      teamBCatsWon: 1,
      isYours: false,
      calculated: false,
      categories: [
        { key: 'play_list', aScore: 16, bScore: 10 },
        { key: 'healing', aScore: 12, bScore: 18 },
        { key: 'bonus', aScore: 14, bScore: 14 },
      ],
    },
  ],
}

export default function WeekMatchups() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const {
    loading, league, teams, userTeam,
    isOnTeam, leagueExists, getCurrentWeek, getWeekMatchups,
  } = useLeagueData()

  const hasRealData = leagueExists && isOnTeam
  const useMock = !loading && !hasRealData

  const currentWeek = hasRealData ? (getCurrentWeek?.() || 0) : DEV_MOCK.currentWeek

  // Build matchup cards from real or mock data
  let matchupCards = []
  if (hasRealData) {
    const weekMatchups = getWeekMatchups?.(currentWeek) || []
    const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]))
    matchupCards = weekMatchups.map(m => {
      const teamA = teamMap[m.team_a_id]
      const teamB = teamMap[m.team_b_id]
      const isYours = m.team_a_id === userTeam?.id || m.team_b_id === userTeam?.id
      return {
        id: m.id,
        teamA: teamA?.name || 'Team A',
        teamB: teamB?.name || 'Team B',
        teamACatsWon: m.team_a_categories_won ?? null,
        teamBCatsWon: m.team_b_categories_won ?? null,
        isYours,
        calculated: !!m.calculated_at,
      }
    })
  } else {
    matchupCards = DEV_MOCK.matchups
  }

  if (loading) {
    return (
      <div className="week-matchups-page">
        <div className="wm-toolbar">
          <button className="wm-back" onClick={() => navigate(-1)}>←</button>
          <h2 className="wm-toolbar-title">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="week-matchups-page">
      {useMock && (
        <div style={{ background: '#f59e0b', color: '#000', textAlign: 'center', padding: '4px 0', fontSize: '0.7rem', fontWeight: 700, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
          PREVIEW MODE — Mock Data
        </div>
      )}

      <div className="wm-toolbar" style={useMock ? { top: 22 } : undefined}>
        <button className="wm-back" onClick={() => navigate(-1)}>←</button>
        <h2 className="wm-toolbar-title">Week {currentWeek} Matchups</h2>
      </div>

      <div className="wm-matchup-list">
        {matchupCards.map(m => {
          const aWinning = (m.teamACatsWon ?? 0) > (m.teamBCatsWon ?? 0)
          const bWinning = (m.teamBCatsWon ?? 0) > (m.teamACatsWon ?? 0)

          // Mini category dots
          const cats = useMock
            ? (DEV_MOCK.matchups.find(dm => dm.id === m.id)?.categories || [])
            : null

          return (
            <div
              key={m.id}
              className={`wm-matchup-card${m.isYours ? ' yours' : ''}`}
              onClick={m.isYours ? () => navigate('/league/matchup') : undefined}
              style={m.isYours ? { cursor: 'pointer' } : undefined}
            >
              {m.isYours && <span className="wm-your-badge">Your Matchup</span>}

              <div className="wm-matchup-teams">
                <div className="wm-team-side">
                  <span className={`wm-team-name${aWinning ? ' leading' : ''}`}>{m.teamA}</span>
                  <span className={`wm-team-cats${aWinning ? ' leading' : ''}`}>
                    {m.teamACatsWon ?? '—'}
                  </span>
                </div>
                <span className="wm-vs">vs</span>
                <div className="wm-team-side right">
                  <span className={`wm-team-cats${bWinning ? ' leading' : ''}`}>
                    {m.teamBCatsWon ?? '—'}
                  </span>
                  <span className={`wm-team-name${bWinning ? ' leading' : ''}`}>{m.teamB}</span>
                </div>
              </div>

              {/* Mini category indicator dots */}
              {cats && (
                <div className="wm-cat-dots">
                  {cats.map(c => {
                    const cat = FANTASY_CATEGORIES[c.key]
                    const aWin = c.aScore > c.bScore
                    const bWin = c.bScore > c.aScore
                    return (
                      <div key={c.key} className="wm-cat-dot-row">
                        <span
                          className="wm-cat-dot"
                          style={{ background: aWin ? cat?.color : '#e5e7eb' }}
                          title={`${cat?.label}: ${c.aScore}`}
                        />
                        <span className="wm-cat-dot-label">{cat?.icon}</span>
                        <span
                          className="wm-cat-dot"
                          style={{ background: bWin ? cat?.color : '#e5e7eb' }}
                          title={`${cat?.label}: ${c.bScore}`}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {m.isYours && (
                <span className="wm-tap-hint">Tap for details →</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
