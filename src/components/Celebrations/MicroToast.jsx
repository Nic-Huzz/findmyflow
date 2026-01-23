// src/components/Celebrations/MicroToast.jsx
// Small encouraging messages that appear briefly

import { useEffect, useState } from 'react'
import './Celebrations.css'

const MESSAGES = {
  first_task: "Great start! 🚀",
  all_done: "All done! 🎉",
  streak_7: "7-day streak! 🔥",
  streak_30: "30-day streak! 🏆",
  streak_100: "100-day streak! 👑",
  improvement_works: "It worked! 📈",
  level_up: "Level up! ⭐"
}

export default function MicroToast({ type, message, duration = 2500, onComplete }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const displayMessage = message || MESSAGES[type] || type

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true)
    }, duration - 300)

    const completeTimer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  if (!visible) return null

  return (
    <div className={`micro-toast ${exiting ? 'exiting' : ''}`}>
      {displayMessage}
    </div>
  )
}
