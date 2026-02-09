import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import './ProfileHub.css'

const ProfileHub = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const options = [
    {
      id: 'hero-profile',
      icon: '🦸',
      title: 'Hero Profile',
      description: 'View your archetypes, projects, and journey progress',
      path: '/hero-profile',
      color: '#5e17eb'
    },
    {
      id: 'library',
      icon: '📚',
      title: 'Library',
      description: 'Access your saved answers and completed flows',
      path: '/library',
      color: '#E9A23B'
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'User Settings',
      description: 'Update your name, email, and notification preferences',
      path: '/user-settings',
      color: '#6c757d'
    }
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
