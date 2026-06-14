import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import AppRouter from './AppRouter.jsx'
import checkAppVersion from './lib/versionCheck.js'
import { captureUtmParams, trackAppOpened } from './lib/analytics.js'
import './index.css'

// Clear stale localStorage when app version changes
// This ensures returning users see new UI, not cached old state
checkAppVersion()

// Capture UTM params on first page load — persists in sessionStorage
captureUtmParams()

// Track app open for daily active user signal
trackAppOpened()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
    <Analytics />
  </React.StrictMode>,
)
