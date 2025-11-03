import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import Profile from './Profile'
import HealingCompass from './HealingCompass'
import EssenceTest from './EssenceTest'
import HybridEssenceFlow from './HybridEssenceFlow'
import HybridProtectiveFlow from './HybridProtectiveFlow'
import HybridCombinedFlow from './HybridCombinedFlow'
import AppTest from './App-test'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import './App.css'
import './Profile.css'
import './Auth.css'
import './EssenceTest.css'
import './HybridEssenceFlow.css'

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
          <Route path="/essence-test" element={<EssenceTest />} />
          <Route path="/hybrid-essence" element={<HybridEssenceFlow />} />
          <Route path="/hybrid-protective" element={<HybridProtectiveFlow />} />
          <Route path="/hybrid-combined" element={<HybridCombinedFlow />} />
          <Route path="/test" element={<AppTest />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default AppRouter
