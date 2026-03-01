import { useState } from 'react'
import './UpgradePrompt.css'

function UpgradePrompt({ onUpgrade }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onUpgrade()
    } catch (err) {
      console.error('Upgrade error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-prompt-icon">&#x1f512;</div>
      <p className="upgrade-prompt-message">
        Unlock Business Modules to access this quest
      </p>
      <button
        className="upgrade-prompt-button"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Unlock Business Modules'}
      </button>
    </div>
  )
}

export default UpgradePrompt
