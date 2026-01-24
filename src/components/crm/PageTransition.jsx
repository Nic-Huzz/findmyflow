/**
 * PageTransition - Animated route transitions
 * Wraps page content with fade/slide animations
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './PageTransition.css'

export default function PageTransition({ children }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('entered')

  useEffect(() => {
    if (children !== displayChildren) {
      // Start exit animation
      setTransitionStage('exiting')
    }
  }, [children, displayChildren])

  function handleAnimationEnd() {
    if (transitionStage === 'exiting') {
      // Switch content and start enter animation
      setDisplayChildren(children)
      setTransitionStage('entering')
    } else if (transitionStage === 'entering') {
      setTransitionStage('entered')
    }
  }

  return (
    <div
      className={`page-transition ${transitionStage}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {displayChildren}
    </div>
  )
}

/**
 * Simple fade transition wrapper
 * Use this for lighter-weight transitions
 */
export function FadeTransition({ children, show = true }) {
  return (
    <div className={`fade-transition ${show ? 'visible' : ''}`}>
      {children}
    </div>
  )
}
