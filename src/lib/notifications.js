import { supabase } from './supabaseClient'

// Check if browser supports notifications
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

// Check current notification permission status
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

// Request notification permission from user
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser')
  }

  const permission = await Notification.requestPermission()
  return permission
}

// Register service worker
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported in this browser')
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    })

    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    throw error
  }
}

// Convert base64 to Uint8Array for VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Subscribe to push notifications
export const subscribeToPushNotifications = async (userId, vapidPublicKey) => {
  console.log('[Notifications] subscribeToPushNotifications called', { userId, hasVapidKey: !!vapidPublicKey })

  try {
    // Get service worker registration
    console.log('[Notifications] Waiting for service worker ready...')
    const registration = await navigator.serviceWorker.ready
    console.log('[Notifications] Service worker ready:', registration.scope)

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()
    console.log('[Notifications] Existing subscription:', subscription ? 'yes' : 'no')

    if (!subscription) {
      // Create new subscription
      console.log('[Notifications] Creating new push subscription...')
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
      console.log('[Notifications] Push subscription created:', subscription.endpoint)
    }

    // Save subscription to Supabase
    console.log('[Notifications] Saving subscription to database...')
    await savePushSubscription(userId, subscription)
    console.log('[Notifications] Subscription saved successfully')

    return subscription
  } catch (error) {
    console.error('[Notifications] Error subscribing to push notifications:', error)
    throw error
  }
}

// Save push subscription to database
const savePushSubscription = async (userId, subscription) => {
  const subJson = subscription.toJSON()
  console.log('[Notifications] Subscription JSON:', {
    endpoint: subJson.endpoint?.substring(0, 50) + '...',
    hasP256dh: !!subJson.keys?.p256dh,
    hasAuth: !!subJson.keys?.auth
  })

  const subscriptionData = {
    user_id: userId,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth
    },
    created_at: new Date().toISOString()
  }

  console.log('[Notifications] Saving to push_subscriptions table...', { user_id: userId })

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id,endpoint'
    })
    .select()

  if (error) {
    console.error('[Notifications] Error saving push subscription:', error)
    throw error
  }

  console.log('[Notifications] Push subscription saved successfully:', data)
}

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (userId) => {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log('Unsubscribed from push notifications')

      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
    }

    return true
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    throw error
  }
}

// Show a local notification (for testing)
export const showLocalNotification = async (title, options = {}) => {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported')
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted')
  }

  const registration = await navigator.serviceWorker.ready

  await registration.showNotification(title, {
    body: options.body || '',
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/badge-72x72.png',
    tag: options.tag || 'default',
    data: options.url || '/',
    ...options
  })
}

// Initialize notifications (call this on app startup)
export const initializeNotifications = async (userId, vapidPublicKey) => {
  try {
    // Check if supported
    if (!isNotificationSupported()) {
      console.log('Notifications not supported in this browser')
      return { supported: false }
    }

    // Register service worker
    await registerServiceWorker()

    // Check permission status
    const permission = getNotificationPermission()

    if (permission === 'granted' && userId && vapidPublicKey) {
      // Auto-subscribe if already granted permission
      await subscribeToPushNotifications(userId, vapidPublicKey)
      return { supported: true, permission: 'granted', subscribed: true }
    }

    return { supported: true, permission, subscribed: false }
  } catch (error) {
    console.error('Error initializing notifications:', error)
    return { supported: true, permission: 'default', subscribed: false, error }
  }
}

// Send notification via Supabase Edge Function
export const sendNotification = async (userId, { title, body, url, tag }) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ userId, title, body, url, tag })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to send notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending notification:', error)
    // Don't throw - notifications are non-critical
    return { success: false, error: error.message }
  }
}

// Check and send validation progress notification
// Call this when validation responses are received
export const checkValidationProgressNotification = async (userId, totalResponses, requiredResponses = 3) => {
  const responsesNeeded = requiredResponses - totalResponses

  // Only notify when 1 or 2 responses away from unlocking
  if (responsesNeeded <= 0 || responsesNeeded > 2) {
    return { sent: false, reason: 'Not in notification range' }
  }

  // Check if we've already notified for this milestone
  const notificationKey = `validation_progress_${userId}_${totalResponses}`
  const alreadyNotified = localStorage.getItem(notificationKey)

  if (alreadyNotified) {
    return { sent: false, reason: 'Already notified for this milestone' }
  }

  // Determine message based on responses needed
  let title, body
  if (responsesNeeded === 1) {
    title = '1 more response to unlock AI analysis!'
    body = 'You\'re so close! Get one more validation response to unlock powerful AI insights.'
  } else if (responsesNeeded === 2) {
    title = '2 responses away from AI insights'
    body = 'Your validation survey is gaining traction. 2 more responses unlocks AI analysis.'
  }

  try {
    // Try local notification first (instant)
    if (Notification.permission === 'granted') {
      await showLocalNotification(title, {
        body,
        tag: 'validation-progress',
        data: { url: '/7-day-challenge' }
      })
    }

    // Mark as notified
    localStorage.setItem(notificationKey, Date.now().toString())

    return { sent: true, responsesNeeded }
  } catch (error) {
    console.error('Error sending validation progress notification:', error)
    return { sent: false, error: error.message }
  }
}

// Notify when AI analysis is ready/unlocked
export const sendAnalysisUnlockedNotification = async (userId) => {
  const notificationKey = `validation_analysis_unlocked_${userId}`
  const alreadyNotified = localStorage.getItem(notificationKey)

  if (alreadyNotified) {
    return { sent: false, reason: 'Already notified' }
  }

  try {
    if (Notification.permission === 'granted') {
      await showLocalNotification('AI Analysis Unlocked!', {
        body: 'You have 3+ validation responses. Tap to discover what your audience really wants.',
        tag: 'validation-unlocked',
        data: { url: '/7-day-challenge' }
      })
    }

    localStorage.setItem(notificationKey, Date.now().toString())
    return { sent: true }
  } catch (error) {
    console.error('Error sending analysis unlocked notification:', error)
    return { sent: false, error: error.message }
  }
}

// Send achievement celebration notification (for level ups, streak milestones, etc)
export const sendAchievementNotification = async ({ title, body, url = '/7-day-challenge' }) => {
  try {
    if (!isNotificationSupported()) {
      return { sent: false, reason: 'Notifications not supported' }
    }

    if (Notification.permission !== 'granted') {
      return { sent: false, reason: 'Notification permission not granted' }
    }

    await showLocalNotification(title, {
      body,
      tag: 'achievement',
      url,
      icon: '/icon-192.png'
    })

    return { sent: true }
  } catch (error) {
    console.error('Error sending achievement notification:', error)
    return { sent: false, error: error.message }
  }
}

// Check if user has achievement notifications enabled
export const checkAchievementNotificationsEnabled = async (userId) => {
  try {
    const { supabase } = await import('./supabaseClient')
    const { data } = await supabase
      .from('notification_preferences')
      .select('achievement_celebrations')
      .eq('user_id', userId)
      .single()

    return data?.achievement_celebrations ?? true
  } catch (error) {
    console.error('Error checking achievement notification preference:', error)
    return true // Default to enabled
  }
}

// Debug function - call from browser console: window.debugNotifications()
export const debugNotifications = async () => {
  console.log('=== NOTIFICATION DEBUG ===')

  // 1. Check browser support
  const supported = isNotificationSupported()
  console.log('1. Browser Support:', {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    overallSupported: supported
  })

  // 2. Check permission
  const permission = getNotificationPermission()
  console.log('2. Permission Status:', permission)

  // 3. Check service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    console.log('3. Service Worker Registrations:', registrations.length)
    registrations.forEach((reg, i) => {
      console.log(`   [${i}] Scope: ${reg.scope}, Active: ${!!reg.active}`)
    })
  }

  // 4. Check push subscription
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      console.log('4. Push Subscription:', subscription ? {
        endpoint: subscription.endpoint.substring(0, 60) + '...',
        expirationTime: subscription.expirationTime
      } : 'None')
    } catch (e) {
      console.log('4. Push Subscription: Error -', e.message)
    }
  }

  // 5. Check VAPID key
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  console.log('5. VAPID Public Key:', vapidKey ? `${vapidKey.substring(0, 20)}...` : 'NOT SET')

  // 6. Check database (need to import supabase)
  try {
    const { data: session } = await supabase.auth.getSession()
    const userId = session?.session?.user?.id
    console.log('6. Current User ID:', userId || 'Not logged in')

    if (userId) {
      const { data: subs, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, created_at')
        .eq('user_id', userId)

      console.log('7. Push Subscriptions in DB:', subsError ? `Error: ${subsError.message}` : (subs?.length || 0))
      if (subs?.length) {
        subs.forEach((s, i) => console.log(`   [${i}] ${s.endpoint.substring(0, 50)}...`))
      }

      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      console.log('8. Notification Preferences:', prefsError ? `Error: ${prefsError.message}` : prefs)
    }
  } catch (e) {
    console.log('6-8. Database check error:', e.message)
  }

  console.log('=== END DEBUG ===')
  console.log('To test a notification: window.testNotification()')
}

// Test sending a local notification
export const testNotification = async () => {
  console.log('[Test] Sending test notification...')
  try {
    await showLocalNotification('🔔 Test Notification', {
      body: 'If you see this, notifications are working!',
      tag: 'test-' + Date.now()
    })
    console.log('[Test] Notification sent successfully!')
  } catch (error) {
    console.error('[Test] Failed to send notification:', error)
  }
}

// Test push notification from server
export const testPushNotification = async () => {
  console.log('[Test] Testing push notification from server...')
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session) {
      console.error('[Test] Not logged in')
      return
    }

    const userId = session.session.user.id
    const accessToken = session.session.access_token

    console.log('[Test] Sending push to user:', userId)

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId,
          title: '🔔 Server Push Test',
          body: 'This notification came from the server!',
          url: '/7-day-challenge'
        })
      }
    )

    const result = await response.json()
    console.log('[Test] Push result:', result)
    return result
  } catch (error) {
    console.error('[Test] Push test failed:', error)
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.debugNotifications = debugNotifications
  window.testNotification = testNotification
  window.testPushNotification = testPushNotification
}
