import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { fetchStats } from '../lib/adminService'
import './ProfileHub.css'

const ProfileHub = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetchStats()
      .then(() => setIsAdmin(true))
      .catch(() => {}) // Not admin — silently ignore
  }, [user?.id])

  const options = [
    {
      id: 'essence',
      icon: '✨',
      title: 'Essence Deep Dive',
      description: 'Explore your essence archetype, strengths, and shadow',
      path: '/archetypes/essence',
      color: '#5e17eb'
    },
    {
      id: 'build-app',
      icon: '🔨',
      title: 'Build an App',
      description: 'Scale your impact and income by building your own app',
      path: '/create/build-app/interest',
      color: '#E9A23B'
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'User Settings',
      description: 'Update your name, email, and notification preferences',
      path: '/user-settings',
      color: '#6c757d'
    },
    ...(isAdmin ? [
      {
        id: 'crm',
        icon: '🏰',
        title: 'CRM Command Center',
        description: 'Manage your marketing, sales, and business tools',
        path: '/crm',
        color: '#7c3aed'
      },
      {
        id: 'admin',
        icon: '🛡️',
        title: 'Admin Dashboard',
        description: 'View all users, stats, and send nudges',
        path: '/admin-dashboard',
        color: '#dc2626'
      }
    ] : [])
  ]

  return (
    <div className="profile-hub-container">
      <div className="profile-hub-header">
        <h1 className="profile-hub-title">Your Profile</h1>
        <p className="profile-hub-subtitle">
          {user?.email || 'Welcome back'}
        </p>
      </div>

      <div className="profile-hub-options">
        {options.map((option) => (
          <button
            key={option.id}
            className="profile-hub-card"
            onClick={() => navigate(option.path)}
            style={{ '--card-color': option.color }}
          >
            <div className="profile-hub-card-icon">{option.icon}</div>
            <div className="profile-hub-card-content">
              <h2 className="profile-hub-card-title">{option.title}</h2>
              <p className="profile-hub-card-description">{option.description}</p>
            </div>
            <div className="profile-hub-card-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProfileHub
