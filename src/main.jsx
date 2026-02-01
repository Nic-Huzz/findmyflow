import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter.jsx'
import checkAppVersion from './lib/versionCheck.js'
import './index.css'

// Clear stale localStorage when app version changes
// This ensures returning users see new UI, not cached old state
checkAppVersion()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
