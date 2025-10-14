import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import Profile from './Profile'
import HealingCompass from './HealingCompass'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import './Profile.css'
import './Auth.css'

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/me" element={
            <AuthGate>
              <Profile />
            </AuthGate>
          } />
          <Route path="/healing-compass" element={
            <AuthGate>
              <HealingCompass />
            </AuthGate>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default AppRouter
