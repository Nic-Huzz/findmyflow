import { supabase } from './supabaseClient'
import { isNativeApp } from './platform'

// Lazy-load Capacitor Push plugin only when in native app
let PushNotifications = null
const getNativePush = async () => {
  if (!PushNotifications) {
    const mod = await import('@capacitor/push-notifications')
    PushNotifications = mod.PushNotifications
  }
  return PushNotifications
}

// Race a promise against a timeout
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ])


// Check if running in Capacitor native shell
export const isNativePushSupported = () => isNativeApp()

// Check if browser supports web push notifications
export const isWebPushSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

// Check if ANY notification method is supported (native or web)
export const isNotificationSupported = () => {
  return isNativePushSupported() || isWebPushSupported()
}

// Check current notification permission status
export const getNotificationPermission = () => {
  if (isNativePushSupported()) return 'default' // Will check native status async
  if (!isWebPushSupported()) return 'unsupported'
  return Notification.permission
}

// Request notification permission from user
export const requestNotificationPermission = async () => {
  if (isNativePushSupported()) {
    try {
      const Push = await withTimeout(getNativePush(), 5000, 'Loading push plugin')

      // Official Capacitor pattern: check first, only request if 'prompt'
      let permStatus = await withTimeout(Push.checkPermissions(), 5000, 'Checking permissions')
      console.log('[Notifications] Current permission status:', JSON.stringify(permStatus))

      if (permStatus.receive === 'prompt') {
        permStatus = await withTimeout(Push.requestPermissions(), 10000, 'Requesting permissions')
        console.log('[Notifications] After request:', JSON.stringify(permStatus))
      }

      return permStatus.receive === 'granted' ? 'granted' : 'denied'
    } catch (error) {
      console.error('[Notifications] Native permission error:', JSON.stringify(error), error?.message, error?.code)
      throw error
    }
  }

  if (!isWebPushSupported()) {
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

// Track whether native listeners are registered to avoid duplicates
let nativeListenersRegistered = false
// Mutable ref for current userId so listeners always use the latest
let currentNativeUserId = null

// Register for native push notifications (Capacitor)
// Follows official Capacitor pattern: listeners FIRST, then register()
export const registerNativePush = async (userId) => {
  console.log('[Notifications] Registering native push for user:', userId)
  const Push = await getNativePush()

  // Always update the current user (so existing listeners save to correct account)
  currentNativeUserId = userId

  // Set up listeners BEFORE calling register() (official Capacitor pattern)
  // This ensures the registration token event is never missed
  if (!nativeListenersRegistered) {
    nativeListenersRegistered = true

    Push.addListener('registration', async (token) => {
      console.log('[Notifications] APNs device token:', token.value?.substring(0, 20) + '...')
      try {
        await saveNativePushToken(currentNativeUserId, token.value)
      } catch (e) {
        console.error('[Notifications] Failed to save token:', e)
      }
    })

    Push.addListener('registrationError', (error) => {
      console.error('[Notifications] Native push registration error:', error)
    })

    Push.addListener('pushNotificationReceived', (notification) => {
      console.log('[Notifications] Foreground notification:', notification)
    })

    Push.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Notifications] Notification tapped:', action)
      const url = action.notification?.data?.url
      if (url) window.location.href = url
    })
  }

  // Register with APNs (token arrives via 'registration' listener above)
  await withTimeout(Push.register(), 10000, 'APNs registration')
}

// Save APNs device token to Supabase
const saveNativePushToken = async (userId, token) => {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: `apns://${token}`,
      keys: { platform: 'ios', token },
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id,endpoint' })

  if (error) {
    console.error('[Notifications] Error saving APNs token:', error)
    throw error
  }
  console.log('[Notifications] APNs token saved')
}

// Subscribe to push notifications
export const subscribeToPushNotifications = async (userId, vapidPublicKey) => {
  // Native path
  if (isNativePushSupported()) {
    await registerNativePush(userId)
    return { native: true }
  }

  // Web push path
  console.log('[Notifications] subscribeToPushNotifications called', { userId, hasVapidKey: !!vapidPublicKey })

  try {
    // Ensure service worker is registered before awaiting .ready
    // Without this, navigator.serviceWorker.ready hangs forever
    await registerServiceWorker()

    console.log('[Notifications] Waiting for service worker ready...')
    const registration = await navigator.serviceWorker.ready
    console.log('[Notifications] Service worker ready:', registration.scope)

    let subscription = await registration.pushManager.getSubscription()
    console.log('[Notifications] Existing subscription:', subscription ? 'yes' : 'no')

    if (!subscription) {
      console.log('[Notifications] Creating new push subscription...')
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
      console.log('[Notifications] Push subscription created:', subscription.endpoint)
    }

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
    // Native: just remove from database (APNs token stays registered on device)
    if (isNativePushSupported()) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
      console.log('Unsubscribed from native push notifications')
      return true
    }

    // Web: unsubscribe from PushManager + remove from database
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log('Unsubscribed from push notifications')

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

// Show a local notification
export const showLocalNotification = async (title, options = {}) => {
  // Native: local notifications not available without @capacitor/local-notifications
  // Remote push notifications will work via APNs; local ones are skipped in native
  if (isNativePushSupported()) {
    console.log('[Notifications] Local notification skipped in native app:', title)
    return
  }

  // Web: use service worker
  if (!isWebPushSupported()) {
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
    // Native app path
    if (isNativePushSupported()) {
      const Push = await withTimeout(getNativePush(), 5000, 'Loading push plugin')
      const permStatus = await withTimeout(Push.checkPermissions(), 5000, 'Checking permissions')
      const permission = permStatus.receive === 'granted' ? 'granted' : 'default'

      if (permission === 'granted' && userId) {
        // Don't block app startup if APNs registration is slow
        registerNativePush(userId).catch(e =>
          console.warn('[Notifications] Background registration failed:', e.message)
        )
        return { supported: true, permission: 'granted', subscribed: true, native: true }
      }

      return { supported: true, permission, subscribed: false, native: true }
    }

    // Web push path
    if (!isWebPushSupported()) {
      console.log('Notifications not supported in this browser')
      return { supported: false }
    }

    await registerServiceWorker()
    const permission = getNotificationPermission()

    if (permission === 'granted' && userId && vapidPublicKey) {
      await subscribeToPushNotifications(userId, vapidPublicKey)
      return { supported: true, permission: 'granted', subscribed: true }
    }

    return { supported: true, permission, subscribed: false }
  } catch (error) {
    console.error('Error initializing notifications:', JSON.stringify(error), error?.message, error?.code)
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
    const hasPermission = isNativePushSupported() || Notification.permission === 'granted'
    if (hasPermission) {
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
    const hasPermission = isNativePushSupported() || Notification.permission === 'granted'
    if (hasPermission) {
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

    const hasPermission = isNativePushSupported() || Notification.permission === 'granted'
    if (!hasPermission) {
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
