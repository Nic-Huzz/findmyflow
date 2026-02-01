/**
 * ChallengeOnboarding - Onboarding screens for the Challenge page
 *
 * Handles:
 * - Welcome screen (story intro)
 * - Install app screen (PWA instructions)
 * - Enable notifications screen
 * - Group selection screen
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  showLocalNotification
} from '../lib/notifications'
import { supabase } from '../lib/supabaseClient'
import './ChallengeOnboarding.css'

const INSTALL_SEEN_KEY = 'hasSeenChallengeInstallPrompt'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function ChallengeOnboarding({
  userId,
  screen, // 'welcome' | 'install-app' | 'enable-notifications' | 'group-selection'
  onScreenChange, // Callback to change screens
  onStartChallenge,
  onPlaySolo,
  onCreateGroup,
  onJoinGroup,
  groupCodeInput,
  onGroupCodeChange,
  onBack // Optional callback to go back
}) {
  const navigate = useNavigate()
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState('default')
  const [toastMessage, setToastMessage] = useState(null)

  // Detect device type
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isAndroid = /Android/i.test(navigator.userAgent)

  // Browser selection for install instructions (default based on device)
  const [selectedBrowser, setSelectedBrowser] = useState(isIOS ? 'safari' : 'chrome')
  const isMobile = isIOS || isAndroid
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true

  // Check notification status on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationStatus(getNotificationPermission())
    }
  }, [])

  // Hide bottom toolbar on install and notifications screens
  useEffect(() => {
    if (screen === 'install-app' || screen === 'enable-notifications') {
      document.body.classList.add('hide-bottom-toolbar')
      return () => document.body.classList.remove('hide-bottom-toolbar')
    }
  }, [screen])

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/me')
    }
  }

  // Navigate through screens
  const goToNextScreen = (currentScreen) => {
    if (currentScreen === 'install-app') {
      localStorage.setItem(INSTALL_SEEN_KEY, 'true')
      // Skip notifications for mobile browser - they won't work until app is installed
      // Users will see notifications screen next time they open from PWA
      onStartChallenge()
    } else if (currentScreen === 'enable-notifications') {
      onStartChallenge()
    }
  }

  // Handle notification enable
  const handleEnableNotifications = async () => {
    console.log('[ChallengeOnboarding] handleEnableNotifications called')
    console.log('[ChallengeOnboarding] userId:', userId)
    console.log('[ChallengeOnboarding] VAPID_PUBLIC_KEY exists:', !!VAPID_PUBLIC_KEY)

    setNotificationLoading(true)
    try {
      console.log('[ChallengeOnboarding] Requesting notification permission...')
      const permission = await requestNotificationPermission()
      console.log('[ChallengeOnboarding] Permission result:', permission)

      if (permission === 'granted') {
        // Subscribe to push notifications
        if (VAPID_PUBLIC_KEY && userId) {
          console.log('[ChallengeOnboarding] Subscribing to push notifications...')
          await subscribeToPushNotifications(userId, VAPID_PUBLIC_KEY)

          // Save default notification preferences with auto-detected timezone
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
          console.log('[ChallengeOnboarding] Saving notification preferences...', { timezone: userTimezone })

          const { data, error } = await supabase
            .from('notification_preferences')
            .upsert({
              user_id: userId,
              quest_reminders: true,
              achievement_celebrations: true,
              timezone: userTimezone
            }, {
              onConflict: 'user_id'
            })
            .select()

          if (error) {
            console.error('[ChallengeOnboarding] Error saving preferences:', error)
          } else {
            console.log('[ChallengeOnboarding] Preferences saved:', data)
          }
        } else {
          console.warn('[ChallengeOnboarding] Missing VAPID_PUBLIC_KEY or userId:', {
            hasVapidKey: !!VAPID_PUBLIC_KEY,
            hasUserId: !!userId
          })
        }

        // Show welcome notification
        console.log('[ChallengeOnboarding] Showing welcome notification...')
        await showLocalNotification(
          '🎉 You\'re all set!',
          {
            body: 'You\'ll receive helpful reminders throughout your challenge',
            tag: 'welcome',
            url: '/7-day-challenge'
          }
        )

        setNotificationStatus('granted')
        console.log('[ChallengeOnboarding] Notifications enabled successfully!')

        // Auto-proceed to next screen after enabling
        goToNextScreen('enable-notifications')
      } else {
        console.log('[ChallengeOnboarding] Permission denied or dismissed:', permission)
        // Show toast and proceed after delay
        setToastMessage('Notifications not enabled. You can turn them on later in Settings.')
        setTimeout(() => goToNextScreen('enable-notifications'), 2500)
      }
    } catch (error) {
      console.error('[ChallengeOnboarding] Error enabling notifications:', error)
      setToastMessage('Something went wrong. You can try again later in Settings.')
      setTimeout(() => goToNextScreen('enable-notifications'), 2500)
    } finally {
      setNotificationLoading(false)
    }
  }

  // INSTALL APP SCREEN
  if (screen === 'install-app') {
    return (
      <div className="challenge-container hide-toolbar">
        <div className="challenge-onboarding install-screen">
          <div className="onboarding-content">
            <div className="install-header">
              <span className="install-icon">📱</span>
              <h1>Add to Home Screen</h1>
              <p className="install-subtitle">
                For the best experience, add Find My Flow to your home screen.
                It'll work like an app and you'll get helpful reminders.
              </p>
            </div>

            <div className="install-instructions">
              {/* Browser Toggle Tabs */}
              <div className="browser-tabs">
                <button
                  className={`browser-tab ${selectedBrowser === 'safari' ? 'active' : ''}`}
                  onClick={() => setSelectedBrowser('safari')}
                >
                  Safari
                </button>
                <button
                  className={`browser-tab ${selectedBrowser === 'chrome' ? 'active' : ''}`}
                  onClick={() => setSelectedBrowser('chrome')}
                >
                  Chrome
                </button>
              </div>

              {selectedBrowser === 'safari' && (
                <div className="device-instructions ios">
                  <div className="instruction-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>Tap the <strong>three dots (...)</strong> in the bottom right corner of Safari</p>
                      <div className="step-visual">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="19" cy="12" r="2"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="instruction-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>Tap the <strong>Share</strong> button</p>
                      <div className="step-visual">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L12 16M12 2L8 6M12 2L16 6M4 10L4 22L20 22L20 10"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="instruction-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                      <div className="step-visual">
                        <span className="visual-icon">➕</span>
                      </div>
                    </div>
                  </div>
                  <div className="instruction-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <p>Tap <strong>"Add"</strong> in the top right corner</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBrowser === 'chrome' && (
                <div className="device-instructions android">
                  <div className="instruction-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>Tap the <strong>Share</strong> button at the top right of Chrome</p>
                      <div className="step-visual">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L12 16M12 2L8 6M12 2L16 6M4 10L4 22L20 22L20 10"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="instruction-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>Tap <strong>"Add to Home Screen"</strong></p>
                    </div>
                  </div>
                  <div className="instruction-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <p>Tap <strong>"Add"</strong> to confirm</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="install-tip">
              <span className="tip-icon">💡</span>
              <p>Don't worry, you can always do this later from Settings!</p>
            </div>

            <div className="install-actions">
              <button className="start-challenge-btn" onClick={() => goToNextScreen('install-app')}>
                I've Added It / Continue
              </button>
              <button className="skip-btn" onClick={() => goToNextScreen('install-app')}>
                Skip for now
              </button>
              <button className="back-link-btn" onClick={handleBack}>
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ENABLE NOTIFICATIONS SCREEN
  if (screen === 'enable-notifications') {
    const notificationsSupported = isNotificationSupported()
    const alreadyEnabled = notificationStatus === 'granted'

    return (
      <div className="challenge-container hide-toolbar">
        <div className="challenge-onboarding notifications-screen">
          {toastMessage && (
            <div className="onboarding-toast">
              <span className="toast-icon">ℹ️</span>
              <p>{toastMessage}</p>
            </div>
          )}
          <div className="onboarding-content">
            <div className="notifications-header">
              <span className="notifications-icon">🔔</span>
              <h1>Stay on Track</h1>
              <p className="notifications-subtitle">
                Enable notifications to receive gentle reminders and celebrate your wins throughout the challenge.
              </p>
            </div>

            <div className="notification-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🌅</span>
                <div className="benefit-content">
                  <strong>Morning Motivation</strong>
                  <span>Start your day with a quick quest reminder</span>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <div className="benefit-content">
                  <strong>Midday Check-in</strong>
                  <span>A gentle nudge to keep momentum</span>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🌙</span>
                <div className="benefit-content">
                  <strong>Evening Reflection</strong>
                  <span>Log your flow before bed</span>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🏆</span>
                <div className="benefit-content">
                  <strong>Celebrations</strong>
                  <span>Get notified when you unlock achievements</span>
                </div>
              </div>
            </div>

            {!notificationsSupported && !isStandalone && isMobile && (
              <div className="notification-warning">
                <span className="warning-icon">⚠️</span>
                <p>
                  Notifications require the app to be installed on your home screen.
                  Go back and follow the install instructions first!
                </p>
              </div>
            )}

            {alreadyEnabled && (
              <div className="notification-success">
                <span className="success-icon">✅</span>
                <p>Notifications are already enabled! You're all set.</p>
              </div>
            )}

            <div className="notifications-actions">
              {notificationsSupported && !alreadyEnabled && (
                <button
                  className="start-challenge-btn enable-btn"
                  onClick={handleEnableNotifications}
                  disabled={notificationLoading}
                >
                  {notificationLoading ? 'Enabling...' : 'Enable Notifications'}
                </button>
              )}

              <button
                className={alreadyEnabled ? 'start-challenge-btn' : 'skip-btn'}
                onClick={() => goToNextScreen('enable-notifications')}
              >
                {alreadyEnabled ? 'Continue to Challenge' : 'Maybe Later'}
              </button>

              <button className="back-link-btn" onClick={handleBack}>
                ← Go Back
              </button>
            </div>

            <p className="notifications-note">
              You can change notification settings anytime in your profile.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // GROUP SELECTION SCREEN
  if (screen === 'group-selection') {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <button className="go-back-btn" onClick={handleBack}>
            ← Go Back
          </button>
          <div className="onboarding-content">
            <h1>Choose Your Challenge Mode</h1>
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
