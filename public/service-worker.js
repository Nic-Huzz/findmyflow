// Service Worker for Push Notifications
// This runs in the background and handles push notifications even when the app is closed

const SW_VERSION = '1.0.1' // Increment to force update

self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`)
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`)
  event.waitUntil(self.clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log(`[SW ${SW_VERSION}] Push received!`, event)

  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
      console.log(`[SW ${SW_VERSION}] Push data (JSON):`, data)
    } catch (e) {
      const text = event.data.text()
      console.log(`[SW ${SW_VERSION}] Push data (text):`, text)
      data = {
        title: 'Find My Flow',
        body: text
      }
    }
  } else {
    console.log(`[SW ${SW_VERSION}] Push received with no data`)
  }

  const title = data.title || 'Find My Flow'
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    data: data.url || '/',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [200, 100, 200]
  }

  console.log(`[SW ${SW_VERSION}] Showing notification:`, { title, options })

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log(`[SW ${SW_VERSION}] Notification shown successfully`))
      .catch(err => console.error(`[SW ${SW_VERSION}] Error showing notification:`, err))
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log(`[SW ${SW_VERSION}] Notification clicked`, event.notification.tag)

  event.notification.close()

  // Handle action button clicks
  if (event.action) {
    console.log(`[SW ${SW_VERSION}] Action clicked:`, event.action)
  }

  // Get the URL to open
  const urlToOpen = event.notification.data || '/'
  console.log(`[SW ${SW_VERSION}] Opening URL:`, urlToOpen)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log(`[SW ${SW_VERSION}] Found ${clientList.length} open clients`)
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            console.log(`[SW ${SW_VERSION}] Focusing existing client`)
            return client.focus()
          }
        }
        // If not open, open new window
        if (self.clients.openWindow) {
          console.log(`[SW ${SW_VERSION}] Opening new window`)
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log(`[SW ${SW_VERSION}] Notification dismissed:`, event.notification.tag)
})
