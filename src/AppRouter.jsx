import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import Profile from './Profile'
import HealingCompass from './HealingCompass'
import Challenge from './Challenge'
import NikigaiTest from './NikigaiTest'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import './App.css'
import './Profile.css'
import './Auth.css'
import './HybridEssenceFlow.css'
import './Challenge.css'

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
          <Route path="/7-day-challenge" element={
            <AuthGate>
              <Challenge />
            </AuthGate>
          } />
          <Route path="/nikigai-test" element={
            <AuthGate>
              <NikigaiTest />
            </AuthGate>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default AppRouter
