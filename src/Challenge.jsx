import { useState, useEffect } from 'react'
import { useAuth } from './auth/AuthProvider'
import { supabase } from './lib/supabaseClient'
import './Challenge.css'

function Challenge() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Recognise')
  const [challengeData, setData] = useState(null)
  const [progress, setProgress] = useState(null)
  const [completions, setCompletions] = useState([])
  const [questInputs, setQuestInputs] = useState({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardView, setLeaderboardView] = useState('weekly') // 'weekly' or 'alltime'
  const [userRank, setUserRank] = useState(null)

  const categories = ['Recognise', 'Release', 'Rewire', 'Reconnect', 'Leaderboard']

  useEffect(() => {
    loadChallengeData()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserProgress()
      loadLeaderboard()
    }
  }, [user])

  useEffect(() => {
    if (user && progress) {
      loadLeaderboard()
    }
  }, [leaderboardView, progress])

  // Set up real-time subscription for leaderboard updates
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('challenge_progress_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_progress' },
        (payload) => {
          console.log('Leaderboard update:', payload)
          loadLeaderboard()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, leaderboardView])

  const loadChallengeData = async () => {
    try {
      const response = await fetch('/challengeQuests.json')
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error loading challenge data:', error)
    }
  }

  const loadUserProgress = async () => {
    try {
      setLoading(true)

      // Load challenge progress
      const { data: progressData, error: progressError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading progress:', progressError)
      }

      if (!progressData) {
        // First time - show onboarding
        setShowOnboarding(true)
        setLoading(false)
        return
      }

      setProgress(progressData)

      // Check if we need to advance the day
      const lastActive = new Date(progressData.last_active_date)
      const now = new Date()
      const daysSinceLastActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActive >= 1 && progressData.current_day < 7) {
        await advanceDay(progressData)
      }

      // Load quest completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', user.id)

      if (completionsError) {
        console.error('Error loading completions:', completionsError)
      } else {
        setCompletions(completionsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error in loadUserProgress:', error)
      setLoading(false)
    }
  }

  const advanceDay = async (currentProgress) => {
    const newDay = Math.min(currentProgress.current_day + 1, 7)

    const { data, error } = await supabase
      .from('challenge_progress')
      .update({
        current_day: newDay,
        last_active_date: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error) {
      setProgress(data)
    }
  }

  const startChallenge = async () => {
    try {
      // Get session_id from lead_flow_profiles
      const { data: profileData } = await supabase
        .from('lead_flow_profiles')
        .select('session_id')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const sessionId = profileData?.session_id || `session_${Date.now()}`

      const { data, error } = await supabase
        .from('challenge_progress')
        .insert([{
          user_id: user.id,
          session_id: sessionId,
          current_day: 1,
          challenge_start_date: new Date().toISOString(),
          last_active_date: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error starting challenge:', error)
        alert('Error starting challenge. Please try again.')
        return
      }

      setProgress(data)
      setShowOnboarding(false)
    } catch (error) {
      console.error('Error in startChallenge:', error)
      alert('Error starting challenge. Please try again.')
    }
  }

  const loadLeaderboard = async () => {
    try {
      if (!user) return

      // Build the query for challenge_progress
      let challengeQuery = supabase
        .from('challenge_progress')
        .select('*')
        .order('total_points', { ascending: false })

      // Filter by weekly cohort if in weekly view
      if (leaderboardView === 'weekly' && progress) {
        const startDate = new Date(progress.challenge_start_date)
        const weekStart = new Date(startDate)
        weekStart.setDate(weekStart.getDate() - ((startDate.getDay() + 6) % 7)) // Start of week (Monday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        challengeQuery = challengeQuery
          .gte('challenge_start_date', weekStart.toISOString())
          .lt('challenge_start_date', weekEnd.toISOString())
      }

      const { data: challengeData, error: challengeError } = await challengeQuery

      if (challengeError) {
        console.error('Error loading leaderboard:', challengeError)
        return
      }

      if (!challengeData || challengeData.length === 0) {
        setLeaderboard([])
        setUserRank(null)
        return
      }

      // Get all session_ids to fetch profiles
      const sessionIds = challengeData.map(entry => entry.session_id).filter(Boolean)

      // Fetch user names from lead_flow_profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('lead_flow_profiles')
        .select('session_id, user_name, email')
        .in('session_id', sessionIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
      }

      // Create a map of session_id to user_name
      const profileMap = {}
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap[profile.session_id] = profile.user_name
        })
      }

      // Process leaderboard data
      const leaderboardData = challengeData.map((entry, index) => {
        const userName = profileMap[entry.session_id] || 'Anonymous'
        const firstName = userName.split(' ')[0] // First name only

        return {
          rank: index + 1,
          userId: entry.user_id,
          name: firstName,
          totalPoints: entry.total_points || 0,
          currentDay: entry.current_day,
          isCurrentUser: entry.user_id === user.id
        }
      })

      setLeaderboard(leaderboardData)

      // Set current user's rank
      const userEntry = leaderboardData.find(entry => entry.isCurrentUser)
      setUserRank(userEntry?.rank || null)

    } catch (error) {
      console.error('Error in loadLeaderboard:', error)
    }
  }

  const isQuestCompletedToday = (questId, quest) => {
    const today = new Date().setHours(0, 0, 0, 0)

    if (quest.type === 'daily') {
      return completions.some(c => {
        const completedDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
        return c.quest_id === questId && completedDate === today
      })
    } else {
      // Weekly and anytime quests
      const questCompletions = completions.filter(c => c.quest_id === questId)

      if (quest.maxCompletions) {
        return questCompletions.length >= quest.maxCompletions
      }

      if (quest.maxPerDay) {
        const todayCompletions = questCompletions.filter(c => {
          const completedDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
          return completedDate === today
        })
        return todayCompletions.length >= quest.maxPerDay
      }

      return questCompletions.length > 0
    }
  }

  const handleQuestComplete = async (quest) => {
    const inputValue = questInputs[quest.id]

    // Validate input
    if (quest.inputType === 'text' && (!inputValue || inputValue.trim() === '')) {
      alert('Please enter your reflection before completing this quest.')
      return
    }

    try {
      // Create quest completion
      const { error: completionError } = await supabase
        .from('quest_completions')
        .insert([{
          user_id: user.id,
          quest_id: quest.id,
          quest_category: quest.category,
          quest_type: quest.type,
          points_earned: quest.points,
          reflection_text: inputValue || null,
          challenge_day: progress.current_day
        }])

      if (completionError) {
        console.error('Error completing quest:', completionError)
        alert('Error completing quest. Please try again.')
        return
      }

      // Calculate new points
      const categoryLower = quest.category.toLowerCase()
      const typeKey = quest.type === 'daily' ? 'daily' : 'weekly'
      const pointsField = `${categoryLower}_${typeKey}_points`

      const newCategoryPoints = (progress[pointsField] || 0) + quest.points
      const newTotalPoints = (progress.total_points || 0) + quest.points

      // Check artifact unlock conditions
      const artifacts = challengeData?.artifacts || []
      const categoryArtifact = artifacts.find(a => a.category === quest.category)
      const artifactUnlocked = categoryArtifact ? checkArtifactUnlock(quest.category, newCategoryPoints, typeKey) : false

      // Update progress
      const updateData = {
        [pointsField]: newCategoryPoints,
        total_points: newTotalPoints,
        last_active_date: new Date().toISOString()
      }

      if (artifactUnlocked && categoryArtifact) {
        const artifactKey = `${categoryArtifact.id}_unlocked`
        updateData[artifactKey] = true
      }

      const { data: updatedProgress, error: progressError } = await supabase
        .from('challenge_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (progressError) {
        console.error('Error updating progress:', progressError)
        alert('Error updating progress. Please try again.')
        return
      }

      setProgress(updatedProgress)

      // Reload completions
      const { data: newCompletions } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', user.id)

      setCompletions(newCompletions || [])

      // Clear input
      setQuestInputs(prev => ({ ...prev, [quest.id]: '' }))

      // Show success message
      if (artifactUnlocked) {
        alert(`🎉 Quest complete! +${quest.points} points\n\n✨ You unlocked the ${categoryArtifact.name}!`)
      } else {
        alert(`✅ Quest complete! +${quest.points} points`)
      }
    } catch (error) {
      console.error('Error in handleQuestComplete:', error)
      alert('Error completing quest. Please try again.')
    }
  }

  const checkArtifactUnlock = (category, newPoints, typeKey) => {
    if (!challengeData) return false

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return false

    const categoryLower = category.toLowerCase()
    const dailyPoints = typeKey === 'daily' ? newPoints : (progress[`${categoryLower}_daily_points`] || 0)
    const weeklyPoints = typeKey === 'weekly' ? newPoints : (progress[`${categoryLower}_weekly_points`] || 0)

    return dailyPoints >= artifact.dailyPointsRequired && weeklyPoints >= artifact.weeklyPointsRequired
  }

  const getCategoryPoints = (category) => {
    if (!progress) return { daily: 0, weekly: 0, total: 0 }

    const categoryLower = category.toLowerCase()
    const daily = progress[`${categoryLower}_daily_points`] || 0
    const weekly = progress[`${categoryLower}_weekly_points`] || 0

    return { daily, weekly, total: daily + weekly }
  }

  const getArtifactProgress = (category) => {
    if (!challengeData) return null

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return null

    const points = getCategoryPoints(category)
    const unlocked = progress?.[`${artifact.id}_unlocked`] || false

    return {
      ...artifact,
      currentDaily: points.daily,
      currentWeekly: points.weekly,
      unlocked
    }
  }

  const getDailyStreak = (questId) => {
    if (!progress) return [false, false, false, false, false, false, false]

    const challengeStart = new Date(progress.challenge_start_date)
    challengeStart.setHours(0, 0, 0, 0)

    // Get all completions for this quest
    const questCompletions = completions.filter(c => c.quest_id === questId)

    // Create array for 7 days [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const streak = [false, false, false, false, false, false, false]

    questCompletions.forEach(completion => {
      const completionDate = new Date(completion.completed_at)
      completionDate.setHours(0, 0, 0, 0)

      // Calculate which day of the challenge this was (0-6)
      const daysSinceStart = Math.floor((completionDate - challengeStart) / (1000 * 60 * 60 * 24))

      if (daysSinceStart >= 0 && daysSinceStart < 7) {
        streak[daysSinceStart] = true
      }
    })

    return streak
  }

  const filteredQuests = challengeData?.quests.filter(q => q.category === activeCategory) || []
  const dailyQuests = filteredQuests.filter(q => q.type === 'daily')
  const weeklyQuests = filteredQuests.filter(q => q.type === 'weekly')
  const bonusQuests = challengeData?.quests.filter(q => q.category === 'Bonus') || []

  if (showOnboarding) {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <div className="onboarding-content">
            <h1>🚀 Welcome to the Vibe Rise Game</h1>
            <p className="onboarding-intro">
              Embark on a transformational journey to embody your essence archetype.
              Over the next 7 days, you'll complete quests across four categories:
            </p>

            <div className="onboarding-categories">
              <div className="onboarding-category">
                <h3>🔍 Recognise</h3>
                <p>Build awareness of your protective and essence patterns</p>
              </div>
              <div className="onboarding-category">
                <h3>🕊️ Release</h3>
                <p>Let go of what no longer serves you</p>
              </div>
              <div className="onboarding-category">
                <h3>⚡ Rewire</h3>
                <p>Create new behaviors aligned with your essence</p>
              </div>
              <div className="onboarding-category">
                <h3>🌊 Reconnect</h3>
                <p>Anchor into your true self through daily practices</p>
              </div>
            </div>

            <div className="onboarding-artifacts">
              <h3>🏆 Unlock 4 Sacred Artifacts</h3>
              <p>Complete quests to unlock the Essence Boat, Captain's Hat, Treasure Map, and Sailing Sails.</p>
            </div>

            <button className="start-challenge-btn" onClick={startChallenge}>
              Start My 7-Day Journey
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="challenge-container">
        <div className="challenge-loading">Loading your challenge...</div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="challenge-container">
        <div className="challenge-error">
          <p>Unable to load challenge progress. Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const categoryPoints = getCategoryPoints(activeCategory)
  const artifactProgress = getArtifactProgress(activeCategory)

  return (
    <div className="challenge-container">
      <header className="challenge-header">
        <div className="challenge-header-top">
          <h1>Vibe Rise Game</h1>
          <div className="challenge-day">Day {progress.current_day}/7</div>
        </div>
        <div className="challenge-points">
          <div className="total-points">
            <span className="points-label">Total Points</span>
            <span className="points-value">{progress.total_points || 0}</span>
          </div>
          {userRank && (
            <div className="total-points">
              <span className="points-label">Your Rank</span>
              <span className="points-value">#{userRank}</span>
            </div>
          )}
        </div>
      </header>

      <div className="challenge-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`challenge-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="challenge-content">
        {/* Leaderboard Tab */}
        {activeCategory === 'Leaderboard' && (
          <div className="leaderboard-section">
            <div className="leaderboard-header">
              <h2 className="section-title">🏆 Leaderboard</h2>
              <div className="leaderboard-toggle">
                <button
                  className={`toggle-btn ${leaderboardView === 'weekly' ? 'active' : ''}`}
                  onClick={() => setLeaderboardView('weekly')}
                >
                  This Week
                </button>
                <button
                  className={`toggle-btn ${leaderboardView === 'alltime' ? 'active' : ''}`}
                  onClick={() => setLeaderboardView('alltime')}
                >
                  All Time
                </button>
              </div>
            </div>

            <div className="leaderboard-list">
              {leaderboard.length === 0 && (
                <div className="leaderboard-empty">
                  <p>No participants yet. Be the first to complete a quest!</p>
                </div>
              )}

              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`leaderboard-entry ${entry.isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="leaderboard-rank">
                    {entry.rank === 1 && '🥇'}
                    {entry.rank === 2 && '🥈'}
                    {entry.rank === 3 && '🥉'}
                    {entry.rank > 3 && `#${entry.rank}`}
                  </div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">
                      {entry.name}
                      {entry.isCurrentUser && <span className="you-badge">You</span>}
                    </div>
                    <div className="leaderboard-meta">Day {entry.currentDay}/7</div>
                  </div>
                  <div className="leaderboard-points">
                    {entry.totalPoints} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quest Content - only show if not on Leaderboard tab */}
        {activeCategory !== 'Leaderboard' && (
          <>
        {/* Artifact Progress */}
        {artifactProgress && (
          <div className={`artifact-progress ${artifactProgress.unlocked ? 'unlocked' : ''}`}>
            <div className="artifact-header">
              <h3>{artifactProgress.unlocked ? '✨' : '🔒'} {artifactProgress.name}</h3>
              <p className="artifact-description">{artifactProgress.description}</p>
            </div>

            {!artifactProgress.unlocked && (
              <div className="artifact-bars">
                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Daily Points</span>
                    <span>{artifactProgress.currentDaily}/{artifactProgress.dailyPointsRequired}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill daily"
                      style={{ width: `${Math.min((artifactProgress.currentDaily / artifactProgress.dailyPointsRequired) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Weekly Points</span>
                    <span>{artifactProgress.currentWeekly}/{artifactProgress.weeklyPointsRequired}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill weekly"
                      style={{ width: `${Math.min((artifactProgress.currentWeekly / artifactProgress.weeklyPointsRequired) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {artifactProgress.unlocked && (
              <div className="artifact-unlocked-message">
                🎉 Artifact Unlocked! You've completed this category.
              </div>
            )}
          </div>
        )}

        {/* Category Points Summary */}
        <div className="category-points-summary">
          <div className="category-point-item">
            <span>Daily Points</span>
            <span className="point-value">{categoryPoints.daily}</span>
          </div>
          <div className="category-point-item">
            <span>Weekly Points</span>
            <span className="point-value">{categoryPoints.weekly}</span>
          </div>
          <div className="category-point-item total">
            <span>Category Total</span>
            <span className="point-value">{categoryPoints.total}</span>
          </div>
        </div>

        {/* Daily Quests */}
        {dailyQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Daily Quests</h2>
            <div className="quest-grid">
              {dailyQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                const streak = getDailyStreak(quest.id)
                const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

                return (
                  <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>

                    {/* Daily Streak Bubbles */}
                    <div className="daily-streak">
                      {dayLabels.map((label, index) => (
                        <div
                          key={index}
                          className={`streak-bubble ${streak[index] ? 'completed' : ''}`}
                          title={`Day ${index + 1}`}
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <p className="quest-description">{quest.description}</p>

                    {!completed && (
                      <div className="quest-input-area">
                        {quest.inputType === 'text' ? (
                          <textarea
                            className="quest-textarea"
                            placeholder={quest.placeholder}
                            value={questInputs[quest.id] || ''}
                            onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            rows={3}
                          />
                        ) : (
                          <div className="quest-checkbox-area">
                            <label className="quest-checkbox-label">
                              Mark as complete
                            </label>
                          </div>
                        )}
                        <button
                          className="quest-complete-btn"
                          onClick={() => handleQuestComplete(quest)}
                        >
                          Complete Quest
                        </button>
                      </div>
                    )}

                    {completed && (
                      <div className="quest-completed-badge">
                        ✅ Completed Today
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Weekly Quests */}
        {weeklyQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Weekly Quests</h2>
            <div className="quest-grid">
              {weeklyQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                return (
                  <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>
                    <p className="quest-description">{quest.description}</p>

                    {!completed && (
                      <div className="quest-input-area">
                        {quest.inputType === 'text' ? (
                          <textarea
                            className="quest-textarea"
                            placeholder={quest.placeholder}
                            value={questInputs[quest.id] || ''}
                            onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            rows={3}
                          />
                        ) : (
                          <div className="quest-checkbox-area">
                            <label className="quest-checkbox-label">
                              Mark as complete
                            </label>
                          </div>
                        )}
                        <button
                          className="quest-complete-btn"
                          onClick={() => handleQuestComplete(quest)}
                        >
                          Complete Quest
                        </button>
                      </div>
                    )}

                    {completed && (
                      <div className="quest-completed-badge">
                        ✅ Completed
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bonus Quests - only show if we're on the Recognise tab */}
        {activeCategory === 'Recognise' && bonusQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Bonus Quests</h2>
            <div className="quest-grid">
              {bonusQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                return (
                  <div key={quest.id} className={`quest-card bonus ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>
                    <p className="quest-description">{quest.description}</p>

                    {!completed && (
                      <div className="quest-input-area">
                        {quest.inputType === 'text' ? (
                          <textarea
                            className="quest-textarea"
                            placeholder={quest.placeholder}
                            value={questInputs[quest.id] || ''}
                            onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            rows={3}
                          />
                        ) : (
                          <div className="quest-checkbox-area">
                            <label className="quest-checkbox-label">
                              Mark as complete
                            </label>
                          </div>
                        )}
                        <button
                          className="quest-complete-btn"
                          onClick={() => handleQuestComplete(quest)}
                        >
                          Complete Quest
                        </button>
                      </div>
                    )}

                    {completed && (
                      <div className="quest-completed-badge">
                        ✅ Completed
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}

export default Challenge
