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
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      console.log('Push subscription created:', subscription)
    }

    // Save subscription to Supabase
    await savePushSubscription(userId, subscription)

    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    throw error
  }
}

// Save push subscription to database
const savePushSubscription = async (userId, subscription) => {
  const subscriptionData = {
    user_id: userId,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.toJSON().keys.p256dh,
      auth: subscription.toJSON().keys.auth
    },
    created_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id,endpoint'
    })

  if (error) {
    console.error('Error saving push subscription:', error)
    throw error
  }

  console.log('Push subscription saved to database')
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
