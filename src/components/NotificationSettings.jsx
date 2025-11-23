import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showLocalNotification
} from '../lib/notifications'
import InstallPWA from './InstallPWA'
import './NotificationSettings.css'

// VAPID Public Key from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function NotificationSettings() {
  const { user } = useAuth()
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false
  })
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    dailyQuests: true,
    leaderboardUpdates: true,
    groupActivity: true,
    artifactUnlocks: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Auto-detect timezone
  })

  useEffect(() => {
    checkNotificationStatus()
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setPreferences({
          dailyQuests: data.daily_quests ?? true,
          leaderboardUpdates: data.leaderboard_updates ?? true,
          groupActivity: data.group_activity ?? true,
          artifactUnlocks: data.artifact_unlocks ?? true,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const checkNotificationStatus = async () => {
    const supported = isNotificationSupported()
    const permission = getNotificationPermission()

    // TODO: Check if user has an active subscription in database
    // For now, assume subscribed if permission is granted
    const subscribed = permission === 'granted'

    setNotificationStatus({ supported, permission, subscribed })
  }

  const handleEnableNotifications = async () => {
    setLoading(true)
    try {
      // Request permission
      const permission = await requestNotificationPermission()

      if (permission === 'granted') {
        // Subscribe to push notifications
        if (VAPID_PUBLIC_KEY) {
          await subscribeToPushNotifications(user.id, VAPID_PUBLIC_KEY)
        }

        // Show test notification
        await showLocalNotification(
          '🎉 Notifications Enabled!',
          {
            body: 'You\'ll now receive updates about your 7-Day Challenge',
            tag: 'welcome',
            url: '/challenge'
          }
        )

        setNotificationStatus(prev => ({
          ...prev,
          permission: 'granted',
          subscribed: true
        }))
      } else {
        alert('Notification permission denied. You can enable it later in your browser settings.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('Error enabling notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setLoading(true)
    try {
      await unsubscribeFromPushNotifications(user.id)
      setNotificationStatus(prev => ({
        ...prev,
        subscribed: false
      }))
    } catch (error) {
      console.error('Error disabling notifications:', error)
      alert('Error disabling notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await showLocalNotification(
        '🔔 Test Notification',
        {
          body: 'This is what your notifications will look like!',
          tag: 'test',
          url: '/challenge'
        }
      )
    } catch (error) {
      console.error('Error showing test notification:', error)
      alert('Please enable notifications first')
    }
  }

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = {
      ...preferences,
      [key]: value !== undefined ? value : !preferences[key]
    }

    setPreferences(newPreferences)

    // Save to database
    if (!user) return

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          daily_quests: newPreferences.dailyQuests,
          leaderboard_updates: newPreferences.leaderboardUpdates,
          group_activity: newPreferences.groupActivity,
          artifact_unlocks: newPreferences.artifactUnlocks,
          timezone: newPreferences.timezone
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error saving preferences:', error)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  if (!notificationStatus.supported) {
    // Check if user is on mobile Chrome/iOS Safari browser (not PWA)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)

    return (
      <div className="notification-settings">
        {isMobile && !isStandalone ? (
          <div className="notification-install-required">
            <h2 className="settings-title">📱 Install Required</h2>
            <p className="install-explanation">
              Push notifications are only available when Find My Flow is installed
              as an app on your home screen.
            </p>

            <InstallPWA />

            <div className="install-steps">
              <h3>How to Install on Your Device:</h3>

              {isIOS && (
                <div className="device-instructions">
                  <h4>📱 iPhone/iPad Instructions:</h4>
                  <ol>
                    <li>
                      <strong>Safari:</strong> Tap the share button (
                      <svg width="14" height="14" viewBox="0 0 14 14" style={{display: 'inline', verticalAlign: 'middle'}}>
                        <path d="M7 0L7 9M7 0L4 3M7 0L10 3M2 5L2 14L12 14L12 5" stroke="currentColor" fill="none"/>
                      </svg>
                      ) at the bottom, then scroll down and tap "Add to Home Screen"
                    </li>
                    <li>
                      <strong>Chrome:</strong> Tap the share button (
                      <svg width="14" height="14" viewBox="0 0 14 14" style={{display: 'inline', verticalAlign: 'middle'}}>
                        <path d="M7 0L7 9M7 0L4 3M7 0L10 3M2 5L2 14L12 14L12 5" stroke="currentColor" fill="none"/>
                      </svg>
                      ), then tap "Add to Home Screen"
                    </li>
                  </ol>
                </div>
              )}

              {isAndroid && (
                <div className="device-instructions">
                  <h4>🤖 Android Instructions:</h4>
                  <ol>
                    <li>
                      <strong>Chrome:</strong> Tap the install button above, or tap the menu (⋮) in the top right and select "Add to Home screen"
                    </li>
                    <li>
                      <strong>Firefox:</strong> Tap the menu (⋮) and select "Install"
                    </li>
                  </ol>
                </div>
              )}

              <p className="install-note">
                💡 After installing, open the app from your home screen and return
                to this page to enable notifications!
              </p>
            </div>
          </div>
        ) : (
          <div className="notification-unsupported">
            <p>⚠️ Push notifications are not supported in your browser.</p>
            <p className="notification-hint">
              Try using Chrome, Firefox, or Safari on a supported device.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="notification-settings">
      <h2 className="settings-title">🔔 Notification Settings</h2>
      <p className="settings-description">
        Get timely reminders and updates about your 7-Day Challenge
      </p>

      <div className="notification-status-card">
        <div className="status-header">
          <span className="status-label">Notifications</span>
          <span className={`status-badge ${notificationStatus.permission}`}>
            {notificationStatus.permission === 'granted' ? '✓ Enabled' :
             notificationStatus.permission === 'denied' ? '✗ Blocked' :
             '○ Disabled'}
          </span>
        </div>

        {notificationStatus.permission === 'default' && (
          <button
            className="enable-notifications-btn"
            onClick={handleEnableNotifications}
            disabled={loading}
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        )}

        {notificationStatus.permission === 'granted' && (
          <>
            <div className="notification-actions">
              <button
                className="test-notification-btn"
                onClick={handleTestNotification}
              >
                Send Test Notification
              </button>
              <button
                className="disable-notifications-btn"
                onClick={handleDisableNotifications}
                disabled={loading}
              >
                {loading ? 'Disabling...' : 'Disable Notifications'}
              </button>
            </div>

            <div className="notification-preferences">
              <h3>Notification Preferences</h3>
              <p className="preferences-description">Choose what you want to be notified about</p>

              <div className="timezone-selector">
                <label className="timezone-label">
                  <span className="preference-name">🌍 Your Timezone</span>
                  <span className="preference-description">
                    Notifications will be sent based on your local time (7am, 9am, 12pm, 5pm, 8pm)
                  </span>
                </label>
                <select
                  className="timezone-select"
                  value={preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                >
                  <optgroup label="Common Timezones">
                    <option value="America/New_York">Eastern Time (New York)</option>
                    <option value="America/Chicago">Central Time (Chicago)</option>
                    <option value="America/Denver">Mountain Time (Denver)</option>
                    <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                    <option value="America/Anchorage">Alaska Time</option>
                    <option value="Pacific/Honolulu">Hawaii Time</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Europe/Berlin">Berlin (CET)</option>
                    <option value="Europe/Rome">Rome (CET)</option>
                    <option value="Europe/Madrid">Madrid (CET)</option>
                    <option value="Europe/Athens">Athens (EET)</option>
                  </optgroup>
                  <optgroup label="Asia">
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </optgroup>
                  <optgroup label="Australia & Pacific">
                    <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                    <option value="Australia/Melbourne">Melbourne (AEDT/AEST)</option>
                    <option value="Australia/Brisbane">Brisbane (AEST)</option>
                    <option value="Australia/Perth">Perth (AWST)</option>
                    <option value="Pacific/Auckland">Auckland (NZDT/NZST)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                  </optgroup>
                </select>
              </div>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences.dailyQuests}
                  onChange={() => handlePreferenceChange('dailyQuests')}
                />
                <div className="preference-info">
                  <span className="preference-name">Daily Quest Reminders</span>
                  <span className="preference-description">
                    Get notified when new daily quests unlock
                  </span>
                </div>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences.leaderboardUpdates}
                  onChange={() => handlePreferenceChange('leaderboardUpdates')}
                />
                <div className="preference-info">
                  <span className="preference-name">Leaderboard Updates</span>
                  <span className="preference-description">
                    Get notified about your rank changes
                  </span>
                </div>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences.groupActivity}
                  onChange={() => handlePreferenceChange('groupActivity')}
                />
                <div className="preference-info">
                  <span className="preference-name">Group Activity</span>
                  <span className="preference-description">
                    Get notified when friends join your group
                  </span>
                </div>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences.artifactUnlocks}
                  onChange={() => handlePreferenceChange('artifactUnlocks')}
                />
                <div className="preference-info">
                  <span className="preference-name">Artifact Unlocks</span>
                  <span className="preference-description">
                    Get notified when you unlock new artifacts
                  </span>
                </div>
              </label>
            </div>
          </>
        )}

        {notificationStatus.permission === 'denied' && (
          <div className="notification-blocked">
            <p>❌ Notifications are blocked</p>
            <p className="notification-hint">
              To enable notifications, please update your browser settings:
            </p>
            <ol>
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions list</li>
              <li>Change it to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>

      {!VAPID_PUBLIC_KEY && (
        <div className="setup-warning">
          <strong>⚠️ Setup Required:</strong> VAPID keys need to be configured.
          See md files/PUSH_NOTIFICATIONS_SETUP.md for instructions.
        </div>
      )}
    </div>
  )
}

export default NotificationSettings
