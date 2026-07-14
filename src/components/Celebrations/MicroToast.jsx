// src/components/Celebrations/MicroToast.jsx
// Zarlo-voiced celebration messages that appear briefly

import { useEffect, useState } from 'react'
import './Celebrations.css'

// Zarlo-voiced copy: multiple variations per achievement, randomly selected
const VOICED_MESSAGES = {
  first_task: [
    "You showed up. That's the hardest part.",
    "First one down. Your system just noticed.",
  ],
  all_done: [
    "Everything done. Your future self just exhaled.",
    "All of it. Done. That's not nothing.",
  ],
  streak_7: [
    "A week. Your nervous system just realised you might be serious.",
    "7 days. That's not luck. That's you building something.",
  ],
  streak_30: [
    "30 days. This isn't a phase anymore. This is who you are now.",
    "A month of showing up. The version of you from day 1 wouldn't believe this.",
  ],
  streak_100: [
    "100 days. You've rewritten the contract. The old rules don't apply.",
    "Triple digits. Most people quit at 3. You did 100.",
  ],
  improvement_works: [
    "See? The data doesn't lie. That shift was real.",
    "It landed. Trust what just happened.",
  ],
  level_up: [
    "New level. You earned this one the hard way.",
    "Something just opened up. You'll feel it soon.",
  ],
  first_wahoo: [
    "You did the thing. The voice said don't. You did it anyway.",
    "First one. The voice that said 'not yet' just lost its first argument.",
  ],
  first_vulnerable: [
    "Vulnerable. That's the category most people never touch. You just did.",
    "A vulnerable one. That took something most people don't have.",
  ],
  pressure_wahoo: [
    "That wasn't fun. It wasn't supposed to be. You did it anyway.",
    "Pressure. Not every win feels good. This one still counts.",
  ],
  streak_broken: [
    "The streak resets. What you built doesn't.",
    "Streak gone. The learning stays. Come back when you're ready.",
  ],
  all_categories: [
    "Screen, Live, Money. You're not picking easy ones. I see that.",
    "Every category touched. You're not hiding from any of them.",
  ],
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function MicroToast({ type, message, duration = 2500, onComplete }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const displayMessage = message || (VOICED_MESSAGES[type] ? pickRandom(VOICED_MESSAGES[type]) : type)

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
