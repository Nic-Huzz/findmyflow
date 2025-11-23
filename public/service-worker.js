// Service Worker for Push Notifications
// This runs in the background and handles push notifications even when the app is closed

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(self.clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event)

  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {
        title: 'Find My Flow',
        body: event.data.text()
      }
    }
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

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event)

  event.notification.close()

  // Handle action button clicks
  if (event.action) {
    console.log('Action clicked:', event.action)
  }

  // Get the URL to open
  const urlToOpen = event.notification.data || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If not open, open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event)
})
