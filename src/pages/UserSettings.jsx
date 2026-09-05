import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import {
  isNotificationSupported,
  isNativePushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showLocalNotification
} from '../lib/notifications'
import InstallPWA from '../components/InstallPWA'
import './UserSettings.css'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function UserSettings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // Account state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountMessage, setAccountMessage] = useState(null)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Notification state
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false
  })
  const [notifLoading, setNotifLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    questReminders: true,
    achievementCelebrations: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setEmail(user.email || '')

      const init = async () => {
        await checkNotificationStatus()
        await loadPreferences()
      }
      init()
    }
  }, [user])

  // --- Account Methods ---

  const handleSaveAccount = async () => {
    setAccountSaving(true)
    setAccountMessage(null)

    try {
      const updates = {}
      const nameChanged = displayName !== (user.user_metadata?.full_name || user.user_metadata?.name || '')
      const emailChanged = email !== user.email

      if (nameChanged) {
        updates.data = { full_name: displayName, name: displayName }
      }
      if (emailChanged) {
        updates.email = email
      }

      if (!nameChanged && !emailChanged) {
        setAccountMessage({ type: 'info', text: 'No changes to save.' })
        setAccountSaving(false)
        return
      }

      const { error } = await supabase.auth.updateUser(updates)

      if (error) throw error

      if (emailChanged && nameChanged) {
        setAccountMessage({
          type: 'success',
          text: 'Name updated. Check your email to confirm the address change.'
        })
      } else if (emailChanged) {
        setAccountMessage({
          type: 'success',
          text: 'Check your email to confirm the address change.'
        })
      } else {
        setAccountMessage({ type: 'success', text: 'Name updated successfully.' })
      }
    } catch (error) {
      setAccountMessage({ type: 'error', text: error.message })
    } finally {
      setAccountSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      await signOut()
      navigate('/')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  // --- Notification Methods ---

  const checkNotificationStatus = async () => {
    // Native app: check via Capacitor
    if (isNativePushSupported()) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        const permStatus = await PushNotifications.checkPermissions()
        const permission = permStatus.receive === 'granted' ? 'granted' : 'default'
        setNotificationStatus({ supported: true, permission, subscribed: permission === 'granted' })
      } catch {
        setNotificationStatus({ supported: true, permission: 'default', subscribed: false })
      }
      return
    }

    const supported = isNotificationSupported()
    const permission = getNotificationPermission()

    let subscribed = false
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        subscribed = !!subscription
      } catch (err) {
        console.error('Error checking push subscription:', err)
      }
    }

    setNotificationStatus({ supported, permission, subscribed })
  }

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
          questReminders: data.quest_reminders ?? true,
          achievementCelebrations: data.achievement_celebrations ?? true,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const handleEnableNotifications = async () => {
    setNotifLoading(true)
    try {
      const permission = await requestNotificationPermission()
      if (permission === 'granted') {
        if (isNativePushSupported() || VAPID_PUBLIC_KEY) {
          await subscribeToPushNotifications(user.id, VAPID_PUBLIC_KEY)
        }
        await showLocalNotification('Notifications Enabled!', {
          body: "You'll now receive updates about your progress",
          tag: 'welcome',
          url: '/profile-hub'
        })
        setNotificationStatus(prev => ({ ...prev, permission: 'granted', subscribed: true }))
      } else {
        alert('Notification permission denied. You can enable it later in your browser settings.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('Error enabling notifications. Please try again.')
    } finally {
      setNotifLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setNotifLoading(true)
    try {
      await unsubscribeFromPushNotifications(user.id)
      setNotificationStatus(prev => ({ ...prev, subscribed: false }))
    } catch (error) {
      console.error('Error disabling notifications:', error)
    } finally {
      setNotifLoading(false)
    }
  }

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = {
      ...preferences,
      [key]: value !== undefined ? value : !preferences[key]
    }
    setPreferences(newPreferences)

    if (!user) return
    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          quest_reminders: newPreferences.questReminders,
          achievement_celebrations: newPreferences.achievementCelebrations,
          timezone: newPreferences.timezone
        }, { onConflict: 'user_id' })
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  // --- Notification Install Required ---
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true
  const needsPWAInstall = isMobile && !isStandalone && !notificationStatus.supported && !isNativePushSupported()

  return (
    <div className="user-settings-container">
      <button className="user-settings-back" onClick={() => navigate('/profile-hub')}>
        ← Back
      </button>

      <h1 className="user-settings-title">Settings</h1>
      <p className="user-settings-subtitle">{user?.email}</p>

      {/* Account Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Account</h2>

        <div className="settings-field">
          <label className="settings-label">Display Name</label>
          <input
            type="text"
            className="settings-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="settings-field">
          <label className="settings-label">Email</label>
          <input
            type="email"
            className="settings-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <p className="settings-hint">Changing your email will require confirmation via both addresses.</p>
        </div>

        {accountMessage && (
          <div className={`settings-message settings-message--${accountMessage.type}`}>
            {accountMessage.text}
          </div>
        )}

        <button
          className="settings-save-btn"
          onClick={handleSaveAccount}
          disabled={accountSaving}
        >
          {accountSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </section>

      {/* Notifications Section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Notifications</h2>

        {needsPWAInstall ? (
          <div className="settings-notif-install">
            <p>Push notifications require the app to be installed on your home screen.</p>
            <InstallPWA />
          </div>
        ) : !notificationStatus.supported ? (
          <p className="settings-notif-unsupported">
            Push notifications are not supported in your browser. Try Chrome, Firefox, or Safari.
          </p>
        ) : (
          <>
            <div className="settings-notif-status">
              <span className="settings-notif-label">Push Notifications</span>
              <span className={`settings-notif-badge settings-notif-badge--${notificationStatus.permission}`}>
                {notificationStatus.permission === 'granted' ? 'Enabled' :
                 notificationStatus.permission === 'denied' ? 'Blocked' : 'Disabled'}
              </span>
            </div>

            {notificationStatus.permission === 'default' && (
              <button
                className="settings-save-btn"
                onClick={handleEnableNotifications}
                disabled={notifLoading}
              >
                {notifLoading ? 'Enabling...' : 'Enable Notifications'}
              </button>
            )}

            {notificationStatus.permission === 'granted' && (
              <>
                <div className="settings-field">
                  <label className="settings-label">Timezone</label>
                  <p className="settings-hint">Notifications sent at 8am, 12pm & 6pm in your local time</p>
                  <select
                    className="settings-input settings-select"
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  >
                    <optgroup label="Americas">
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
                      <option value="UTC">UTC</option>
                    </optgroup>
                  </select>
                </div>

                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.questReminders}
                    onChange={() => handlePreferenceChange('questReminders')}
                  />
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-name">Path Reminders</span>
                    <span className="settings-toggle-desc">Morning, midday & evening reminders about your paths</span>
                  </div>
                </label>

                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.achievementCelebrations}
                    onChange={() => handlePreferenceChange('achievementCelebrations')}
                  />
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-name">Achievement Celebrations</span>
                    <span className="settings-toggle-desc">Get notified when you unlock achievements or level up</span>
                  </div>
                </label>

                <button
                  className="settings-danger-btn"
                  onClick={handleDisableNotifications}
                  disabled={notifLoading}
                >
                  {notifLoading ? 'Disabling...' : 'Disable Notifications'}
                </button>
              </>
            )}

            {notificationStatus.permission === 'denied' && (
              <div className="settings-notif-blocked">
                <p>Notifications are blocked by your browser. To re-enable:</p>
                <ol>
                  <li>Click the lock icon in your address bar</li>
                  <li>Find "Notifications" and change to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </>
        )}
      </section>

      {/* Sign Out */}
      <section className="settings-section settings-section--signout">
        <button className="settings-signout-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </section>

      {/* Delete Account */}
      <section className="settings-section settings-section--delete">
        {!showDeleteConfirm ? (
          <button
            className="settings-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div className="settings-delete-confirm">
            <h3 className="settings-delete-title">Delete your account?</h3>
            <p className="settings-delete-warning">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <label className="settings-label">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              type="text"
              className="settings-input settings-delete-input"
              value={deleteInput}
              onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null) }}
              placeholder="DELETE"
              autoComplete="off"
            />
            {deleteError && (
              <p className="settings-delete-error">{deleteError}</p>
            )}
            <div className="settings-delete-actions">
              <button
                className="settings-delete-cancel"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(null) }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="settings-delete-confirm-btn"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default UserSettings
