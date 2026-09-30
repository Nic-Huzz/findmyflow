/**
 * ChallengeHeader - Header component for the Challenge page
 *
 * Shows fantasy category scores as mini progress bars with green/red W/L
 * coloring when in an active matchup, or category colors when solo.
 * Team matchup banner replaces old rank display.
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getLevelProgress, getLevelMaxXP, getLevelNumber, LEVELS, getLevel } from '../lib/crm/statsService'
import { FANTASY_CATEGORIES } from '../lib/league/leagueConfig'
import { useScoreAnimation } from '../hooks/useScoreAnimation'
import JourneyGraphPopup from './JourneyGraphPopup'
import {
  FireIcon,
  Cog6ToothIcon,
  HomeIcon,
  BookOpenIcon,
  BellIcon,
  TrophyIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/solid'
// FestLeaderboard removed — re-add when user base exists

// Week type display info
const WEEK_TYPES = {
  push: { label: 'Push', icon: <FireIcon style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'text-bottom' }} />, color: '#ef4444' },
  flow: { label: 'Flow', icon: '🌊', color: '#3b82f6' },
  rest: { label: 'Rest', icon: '🌙', color: '#8b5cf6' },
  launch: { label: 'Launch', icon: <CursorArrowRaysIcon style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'text-bottom' }} />, color: '#f59e0b' }
}

// Lighter variants for category score text in solo mode
const CATEGORY_TEXT_COLORS = {
  tune: '#f9a8d4',
  courage: '#E9A23B',
  reach: '#67e8f9',
}

function ChallengeHeader({
  navigate,
  settingsMenuRef,
  showSettingsMenu,
  setShowSettingsMenu,
  handleOpenExplainer,
  onLeaderboardClick,
  streakDays = 0,
  weekType = null,
  weeklyPoints = 0,
  matchupData = null,
  categoryScores = null,
  matchupLoading = false,
  totalXP = 0,
  currentJourneyLevel = 0,
  wahooCount = 0,
}) {
  const { user } = useAuth()
  const [showGraph, setShowGraph] = useState(false)
  const [showScoreDropdown, setShowScoreDropdown] = useState(false)
  const [heroAvatarUrl, setHeroAvatarUrl] = useState(null)
  const [fetchedXP, setFetchedXP] = useState(null)
  const prevXPRef = useRef(0)

  // Primary: use prop from parent. Fallback: use self-fetched value.
  const lifetimeXP = totalXP > 0 ? totalXP : (fetchedXP || 0)

  // Backup fetch — runs once on mount to guarantee RP shows even if parent is slow
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_lifetime_scores')
      .select('lifetime_total_score')
      .eq('user_id', user.id)
      .is('project_id', null)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.lifetime_total_score != null) {
          setFetchedXP(data.lifetime_total_score)
        }
      })
    // Fetch hero avatar
    supabase
      .from('user_stage_progress')
      .select('hero_avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.hero_avatar_url) setHeroAvatarUrl(data.hero_avatar_url)
      })
  }, [user?.id])

  // Sync XP ref from prop (level-up celebration handled by LevelUpModal in parent)
  useEffect(() => {
    const best = totalXP > 0 ? totalXP : (fetchedXP || 0)
    prevXPRef.current = best
  }, [totalXP, fetchedXP])

  // Flame size based on streak length
  const getFlameClass = () => {
    if (streakDays >= 7) return 'streak-flame legendary'
    if (streakDays >= 5) return 'streak-flame hot'
    if (streakDays >= 3) return 'streak-flame warm'
    if (streakDays >= 1) return 'streak-flame'
    return 'streak-flame cold'
  }

  const weekTypeInfo = weekType ? WEEK_TYPES[weekType] : null

  // Animated numbers — displayed values count up/down, bar widths snap via CSS transition
  const animatedCategoryScores = useScoreAnimation(categoryScores)
  const animatedWeeklyPoints = useScoreAnimation({ pts: weeklyPoints })

  // Display: Tune, Courage, Reach
  const DISPLAY_KEYS = ['tune', 'courage', 'reach']

  // Build score data for display
  const bars = DISPLAY_KEYS.map(key => {
    const cat = FANTASY_CATEGORIES[key]
    const matchCat = matchupData?.categories?.find(c => c.key === key)
    const displayScore = matchCat
      ? (animatedCategoryScores?.[key] ?? matchCat.score)
      : (animatedCategoryScores?.[key] || 0)

    return {
      key,
      label: cat.label,
      icon: cat.icon,
      score: displayScore,
      textColor: CATEGORY_TEXT_COLORS[key],
    }
  })

  return (
    <header className="challenge-header">
      <h1 className="challenge-app-title">Find My Flow</h1>

      {/* Score block: total pts + hero avatar */}
      <div className={`challenge-score-block${matchupLoading ? ' loading' : ''}${!heroAvatarUrl ? ' centered' : ''}`}>
        <div className="challenge-total">
          <span className="challenge-total-value">{animatedWeeklyPoints.pts ?? weeklyPoints}</span>
          <span className="challenge-total-label">
weekly pts
          </span>
        </div>
        {heroAvatarUrl && (
          <div className="challenge-hero-avatar" onClick={() => navigate('/me')}>
            <img src={heroAvatarUrl} alt="Hero" />
          </div>
        )}
      </div>

      {/* Vibe Rank Bar */}
      {(() => {
        const vibeLevel = getLevel(lifetimeXP)
        const vibeProgress = getLevelProgress(lifetimeXP)
        const vibeMax = getLevelMaxXP(lifetimeXP)
        const isMax = getLevelNumber(lifetimeXP) === LEVELS.length
        return (
          <div className="challenge-level-bar">
            <div className="challenge-level-row">
              <span className="challenge-level-name">{vibeLevel.emoji} {vibeLevel.name}</span>
              <span className="challenge-level-xp">{isMax ? `${lifetimeXP} RP ✦` : `${lifetimeXP} / ${vibeMax} RP`}</span>
            </div>
            <div className="challenge-level-track">
              <div className="challenge-level-fill" style={{ width: `${vibeProgress}%` }} />
            </div>
          </div>
        )
      })()}

      {/* Bottom row: Streak + Matchup banner + Settings */}
      <div className="challenge-header-top-row">
        <div className="streak-badge">
          <span className={`hero-streak-flame ${getFlameClass()}`}><FireIcon style={{ width: 20, height: 20 }} /></span>
          <span className="streak-badge-num">{streakDays}</span>
        </div>

        {matchupData ? (
          <div
            className="challenge-matchup-banner"
            onClick={() => setShowScoreDropdown(prev => !prev)}
            style={{ cursor: 'pointer' }}
          >
            <span className="challenge-matchup-team-name">You</span>
            <span className="challenge-matchup-pill">
              <span className={matchupData.myWins > matchupData.oppWins ? 'winning' : matchupData.myWins < matchupData.oppWins ? 'losing' : ''}>
                {matchupData.myWins}
              </span>
              -
              <span className={matchupData.oppWins > matchupData.myWins ? 'winning' : matchupData.oppWins < matchupData.myWins ? 'losing' : ''}>
                {matchupData.oppWins}
              </span>
            </span>
            <span className="challenge-matchup-vs">vs</span>
            <span>Last Week You</span>
            <span className={`challenge-matchup-chevron ${showScoreDropdown ? 'open' : ''}`}>&#x25BE;</span>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        <div className="settings-menu-container" ref={settingsMenuRef}>
          <button
            className="challenge-day settings-badge"
            title="Settings"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <Cog6ToothIcon style={{ width: 20, height: 20 }} />
          </button>
            {showSettingsMenu && (
              <div className="settings-dropdown">
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/me')
                    setShowSettingsMenu(false)
                  }}
                >
                  <HomeIcon style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'text-bottom' }} /> Home
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    handleOpenExplainer()
                    setShowSettingsMenu(false)
                  }}
                >
                  <BookOpenIcon style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'text-bottom' }} /> Explainer
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/settings/notifications')
                    setShowSettingsMenu(false)
                  }}
                >
                  <BellIcon style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'text-bottom' }} /> Notifications
                </button>
                <button
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/league')
                    setShowSettingsMenu(false)
                  }}
                >
                  <TrophyIcon style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'text-bottom' }} /> Fantasy League
                </button>
              </div>
            )}
          </div>
      </div>

      {/* Score dropdown — category pills revealed on matchup banner tap */}
      {matchupData && showScoreDropdown && (
        <div className="challenge-score-dropdown">
          {bars.map(bar => (
            <div key={bar.key} className="challenge-pill" style={bar.textColor ? { color: bar.textColor } : undefined}>
              <span className="challenge-pill-icon">{bar.icon}</span>
              <span className="challenge-pill-score">{bar.score}</span>
              <span className="challenge-pill-label">{bar.label}</span>
            </div>
          ))}
          <div
            className="challenge-pill challenge-pill-matchup-link"
            onClick={(e) => { e.stopPropagation(); navigate(matchupData.opponentName === 'Ghost' ? '/league' : '/league/matchup') }}
            style={{ cursor: 'pointer', opacity: 0.6 }}
          >
            <span className="challenge-pill-label">View matchup →</span>
          </div>
        </div>
      )}

      <JourneyGraphPopup
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        currentLevel={1}
      />
    </header>
  )
}

export default ChallengeHeader
