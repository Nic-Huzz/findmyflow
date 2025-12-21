/**
 * ChallengeOnboarding - Onboarding screens for the Challenge page
 *
 * Handles the initial welcome screen and group selection screen.
 */

function ChallengeOnboarding({
  screen, // 'welcome' | 'group-selection'
  onStartChallenge,
  onPlaySolo,
  onCreateGroup,
  onJoinGroup,
  groupCodeInput,
  onGroupCodeChange
}) {
  if (screen === 'welcome') {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <div className="onboarding-content">
            <h1>🚀 Ready to Find Your Flow?</h1>
            <p className="onboarding-intro">
            You got the job. Made some money. Experienced the ladder.
            </p>
            <p className="onboarding-intro">
            But somewhere along the way, you realised: This isn't it.
            </p>
            <p className="onboarding-intro">
            You had your awakening...Now what?
            </p>
            <p className="onboarding-intro">
              You know there's something more— you've felt it.
            </p>
            <p className="onboarding-intro">
              Moments of aliveness. Impact. Flow.
            </p>
            <p className="onboarding-intro">
              But you don't know how to get from where you are to where you sense you could be.
            </p>
            <p className="onboarding-intro">
              That's what Find My Flow is for.
            </p>
            <p className="onboarding-intro">
              Over the next 7 days you'll complete quests across four categories to help you re-find your flow and amplify your impact:
            </p>

            <div className="onboarding-categories">
              <div className="onboarding-category">
                <h3>🔍 Recognise</h3>
                <p>Build awareness of what's blocking your flow and what your flow is</p>
              </div>
              <div className="onboarding-category">
                <h3>🕊️ Release</h3>
                <p>Let go of traumas blocking your flow</p>
              </div>
              <div className="onboarding-category">
                <h3>⚡ Rewire</h3>
                <p>Act in alignment with your flow</p>
              </div>
              <div className="onboarding-category">
                <h3>🌊 Reconnect</h3>
                <p>Live from your essence and find your flow</p>
              </div>
            </div>

            <button className="start-challenge-btn" onClick={onStartChallenge}>
              Start My 7-Day Journey
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'group-selection') {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <div className="onboarding-content">
            <h1>🎯 Choose Your Challenge Mode</h1>
            <p className="onboarding-intro">
              Play solo or create/join a group to compete with friends and family!
            </p>

            <div className="group-selection-buttons">
              <button className="group-mode-btn solo" onClick={onPlaySolo}>
                <div className="mode-icon">🎯</div>
                <h3>Play Solo</h3>
                <p>Complete the challenge on your own</p>
              </button>

              <button className="group-mode-btn create" onClick={onCreateGroup}>
                <div className="mode-icon">👥</div>
                <h3>Create Group</h3>
                <p>Start a new group and invite others</p>
              </button>

              <div className="group-mode-btn join">
                <div className="mode-icon">🔗</div>
                <h3>Join Group</h3>
                <p>Enter a group code to join</p>
                <input
                  type="text"
                  className="group-code-input"
                  placeholder="Enter 6-digit code"
                  value={groupCodeInput}
                  onChange={(e) => onGroupCodeChange(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button className="join-group-btn" onClick={onJoinGroup}>
                  Join Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default ChallengeOnboarding
