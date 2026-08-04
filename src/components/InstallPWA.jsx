import { useState, useEffect } from 'react'
import './InstallPWA.css'

function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e) => {
      // Prevent the default prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
      // Show our custom install button
      setShowInstallButton(true)
      console.log('📱 PWA install prompt available')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
      console.log('📱 App is already installed')
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log(`📱 User response: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('📱 PWA installed successfully')
    }

    // Clear the prompt
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  // Don't show button if prompt not available
  if (!showInstallButton) {
    return null
  }

  return (
    <div className="install-pwa-banner">
      <div className="install-pwa-content">
        <span className="install-pwa-icon">📱</span>
        <div className="install-pwa-text">
          <strong>Install Find My Flow</strong>
          <p>Add to your home screen for quick access and notifications</p>
        </div>
        <button
          className="install-pwa-button"
          onClick={handleInstallClick}
        >
          Install
        </button>
      </div>
    </div>
  )
}

export default InstallPWA
