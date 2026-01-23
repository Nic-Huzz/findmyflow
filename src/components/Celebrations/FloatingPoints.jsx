// src/components/Celebrations/FloatingPoints.jsx
// Floating points animation when earning points

import { useEffect, useState } from 'react'
import './Celebrations.css'

export default function FloatingPoints({ points, position = {}, onComplete }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible || !points) return null

  const style = {
    ...(position.x !== undefined && { left: position.x }),
    ...(position.y !== undefined && { top: position.y }),
    ...(position.right !== undefined && { right: position.right }),
  }

  return (
    <div className="floating-points" style={style}>
      +{points}
    </div>
  )
}

/**
 * Container for multiple floating point animations
 */
export function FloatingPointsContainer({ items, onItemComplete }) {
  return (
    <div className="floating-points-container">
      {items.map(item => (
        <FloatingPoints
          key={item.id}
          points={item.points}
          position={item.position}
          onComplete={() => onItemComplete?.(item.id)}
        />
      ))}
    </div>
  )
}
