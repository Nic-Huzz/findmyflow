import React, { useState, useEffect, useRef } from 'react'
import './HybridEssenceFlow.css' // Use the same CSS as hybrid essence flow

const HybridArchetypeFlow = ({ 
  archetypeType, // 'protective' or 'essence'
  onComplete, // Callback when selection is complete
  onBack // Optional callback to go back
}) => {
  const [phase, setPhase] = useState('swipe') // 'swipe', 'battle', 'result'
  const [archetypes, setArchetypes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedRight, setSwipedRight] = useState([])
  const [originalArchetypeCount, setOriginalArchetypeCount] = useState(0)
  const [totalBattlesCompleted, setTotalBattlesCompleted] = useState(0)
  const [battleHistory, setBattleHistory] = useState([])
  const [finalResult, setFinalResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState(null) // 'left' or 'right'
  const [swipeHistory, setSwipeHistory] = useState([]) // Track swipe history for undo
  const [dragDelta, setDragDelta] = useState(0) // Track current drag distance for overlays

  const cardRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const animationFrameId = useRef(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  // Load archetype data
  useEffect(() => {
    const loadArchetypes = async () => {
      try {
        const fileName = archetypeType === 'protective' ? 'protective-archetypes.json' : 'essence-archetypes.json'
        const response = await fetch(`/${fileName}`)
        const data = await response.json()
        setArchetypes(data.archetypes || [])
        setLoading(false)
      } catch (error) {
        console.error('Error loading archetypes:', error)
        setLoading(false)
      }
    }
    
    loadArchetypes()
  }, [archetypeType])

  // Handle swipe right (actual state update)
  const handleSwipeRight = () => {
    if (currentIndex < archetypes.length) {
      // Save current state to history before making changes
      const currentState = {
        currentIndex: currentIndex,
        swipedRight: [...swipedRight],
        action: 'right',
        timestamp: Date.now()
      }
      setSwipeHistory(prev => [...prev, currentState])

      const currentArchetype = archetypes[currentIndex]
      setSwipedRight(prev => [...prev, currentArchetype])
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Handle swipe left (actual state update)
  const handleSwipeLeft = () => {
    // Save current state to history before making changes
    const currentState = {
      currentIndex: currentIndex,
      swipedRight: [...swipedRight],
      action: 'left',
      timestamp: Date.now()
    }
    setSwipeHistory(prev => [...prev, currentState])

    setCurrentIndex(prev => prev + 1)
  }

  // Animated button handlers
  const handleSwipeRightButton = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setSwipeDirection('right')

    if (cardRef.current) {
      const flyDistance = window.innerWidth * 1.5
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease'
      cardRef.current.style.transform = `translate3d(${flyDistance}px, 0, 0) rotate(30deg)`
      cardRef.current.style.opacity = '0'
    }

    setTimeout(() => {
      handleSwipeRight()
      setIsAnimating(false)
      setSwipeDirection(null)
      if (cardRef.current) {
        cardRef.current.style.transition = ''
        cardRef.current.style.transform = ''
        cardRef.current.style.opacity = ''
      }
    }, 400)
  }

  const handleSwipeLeftButton = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setSwipeDirection('left')

    if (cardRef.current) {
      const flyDistance = window.innerWidth * 1.5
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease'
      cardRef.current.style.transform = `translate3d(${-flyDistance}px, 0, 0) rotate(-30deg)`
      cardRef.current.style.opacity = '0'
    }

    setTimeout(() => {
      handleSwipeLeft()
      setIsAnimating(false)
      setSwipeDirection(null)
      if (cardRef.current) {
        cardRef.current.style.transition = ''
        cardRef.current.style.transform = ''
        cardRef.current.style.opacity = ''
      }
    }, 400)
  }

  // Touch/Mouse handlers
  const handleStart = (e) => {
    isDragging.current = true
    startX.current = e.type.startsWith('mouse') ? e.clientX : e.touches[0].clientX
    currentX.current = startX.current
    setDragDelta(0)
  }

  const handleMove = (e) => {
    if (!isDragging.current) return

    currentX.current = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX

    // Throttle updates using requestAnimationFrame for 60fps performance
    if (animationFrameId.current) return

    animationFrameId.current = requestAnimationFrame(() => {
      const deltaX = currentX.current - startX.current

      // Update drag delta state for overlays
      setDragDelta(deltaX)

      if (cardRef.current) {
        const rotation = deltaX * 0.1
        const opacity = Math.max(0.7, 1 - Math.abs(deltaX) / 400) // Improved: keep opacity higher

        // Use translate3d for hardware acceleration
        cardRef.current.style.transform = `translate3d(${deltaX}px, 0, 0) rotate(${rotation}deg)`
        cardRef.current.style.opacity = opacity

        // Add border color feedback based on drag direction
        const threshold = 50
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            cardRef.current.style.borderColor = '#4ade80' // Green for right
            cardRef.current.style.boxShadow = '0 10px 40px rgba(74, 222, 128, 0.4)'
          } else {
            cardRef.current.style.borderColor = '#f87171' // Red for left
            cardRef.current.style.boxShadow = '0 10px 40px rgba(248, 113, 113, 0.4)'
          }
        } else {
          cardRef.current.style.borderColor = 'transparent'
          cardRef.current.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'
        }
      }

      animationFrameId.current = null
    })
  }

  const handleEnd = () => {
    if (!isDragging.current) return

    isDragging.current = false
    const deltaX = currentX.current - startX.current
    const threshold = 100

    if (Math.abs(deltaX) > threshold) {
      // Trigger fly-off animation
      setIsAnimating(true)
      const direction = deltaX > 0 ? 'right' : 'left'
      setSwipeDirection(direction)

      if (cardRef.current) {
        // Animate card flying off screen (hardware accelerated)
        const flyDistance = window.innerWidth * 1.5
        cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease'
        cardRef.current.style.transform = `translate3d(${direction === 'right' ? flyDistance : -flyDistance}px, 0, 0) rotate(${direction === 'right' ? 30 : -30}deg)`
        cardRef.current.style.opacity = '0'
      }

      // Wait for animation to complete before moving to next card
      setTimeout(() => {
        if (direction === 'right') {
          handleSwipeRight()
        } else {
          handleSwipeLeft()
        }
        setIsAnimating(false)
        setSwipeDirection(null)
        setDragDelta(0) // Reset drag delta

        if (cardRef.current) {
          cardRef.current.style.transition = ''
          cardRef.current.style.transform = ''
          cardRef.current.style.opacity = ''
        }
      }, 400)
    } else {
      // Spring back animation
      setDragDelta(0) // Reset drag delta

      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease'
        cardRef.current.style.transform = ''
        cardRef.current.style.opacity = ''

        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = ''
          }
        }, 300)
      }
    }
  }

  // Check if swipe phase is complete
  useEffect(() => {
    if (currentIndex >= archetypes.length && phase === 'swipe') {
      if (swipedRight.length === 0) {
        // Restart if no selections
        setCurrentIndex(0)
        setSwipedRight([])
      } else if (swipedRight.length === 1) {
        // Single selection - show result
        setFinalResult(swipedRight[0])
        setPhase('result')
      } else {
        // Multiple selections - start battle phase
        setOriginalArchetypeCount(swipedRight.length)
        setTotalBattlesCompleted(0)
        setPhase('battle')
      }
    }
  }, [currentIndex, archetypes.length, swipedRight.length, phase])

  // Get next battle pair for sequential elimination
  const getNextBattlePair = () => {
    if (swipedRight.length <= 1) return null
    return [swipedRight[0], swipedRight[1]]
  }

  // Handle battle selection
  const handleBattleSelection = (selectedArchetype) => {
    console.log('Battle selection clicked:', selectedArchetype.name)
    
    const currentPair = getNextBattlePair()
    if (!currentPair) return
    
    // Save current state to history before making changes
    const currentState = {
      swipedRight: [...swipedRight],
      totalBattlesCompleted: totalBattlesCompleted,
      timestamp: Date.now()
    }
    setBattleHistory(prev => [...prev, currentState])
    
    const winner = selectedArchetype
    const loser = currentPair.find(archetype => archetype !== selectedArchetype)
    
    console.log('Winner:', winner.name, 'Loser:', loser.name)
    
    // Remove loser from remaining archetypes
    const updatedSwipedRight = swipedRight.filter(archetype => archetype !== loser)
    console.log('Updated swiped right:', updatedSwipedRight.map(a => a.name))
    
    // Update state
    setSwipedRight(updatedSwipedRight)
    setTotalBattlesCompleted(prev => {
      const newTotal = prev + 1
      console.log('Battle completed:', newTotal, 'Remaining archetypes:', updatedSwipedRight.length)
      return newTotal
    })
    
    if (updatedSwipedRight.length === 1) {
      // Battle complete - show result
      console.log('Battle phase complete, showing result')
      setFinalResult(updatedSwipedRight[0])
      setPhase('result')
    }
  }

  // Handle undo in swipe phase
  const handleSwipeUndo = () => {
    if (swipeHistory.length === 0 || isAnimating) return

    const previousState = swipeHistory[swipeHistory.length - 1]
    console.log('Undoing swipe to state:', previousState)

    setCurrentIndex(previousState.currentIndex)
    setSwipedRight(previousState.swipedRight)
    setSwipeHistory(prev => prev.slice(0, -1)) // Remove the last state from history
  }

  // Handle undo in battle phase
  const handleUndo = () => {
    if (battleHistory.length === 0) return

    const previousState = battleHistory[battleHistory.length - 1]
    console.log('Undoing to state:', previousState)

    setSwipedRight(previousState.swipedRight)
    setTotalBattlesCompleted(previousState.totalBattlesCompleted)
    setBattleHistory(prev => prev.slice(0, -1)) // Remove the last state from history
  }

  // Handle completion
  const handleComplete = () => {
    if (finalResult && onComplete) {
      onComplete(finalResult)
    }
  }

  if (loading) {
    return (
      <div className="hybrid-flow">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading {archetypeType} archetypes...</p>
        </div>
      </div>
    )
  }

  // Result phase
  if (phase === 'result' && finalResult) {
    const imagePath = archetypeType === 'protective' ? 'lead-magnet-protective' : 'lead-magnet-essence'
    
    return (
      <div className="hybrid-flow">
        <div className="result-container">
          <div className="result-card">
            <img 
              src={`/images/archetypes/${imagePath}/${finalResult.image}`} 
              alt={finalResult.name}
              className="result-image"
            />
            <h2>{finalResult.name}</h2>
            <p className="result-description">{finalResult.description}</p>
          </div>
          
          <div className="result-actions">
            <button onClick={handleComplete} className="continue-button">
              {archetypeType === 'protective' ? 'Learn More' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Battle phase
  if (phase === 'battle') {
    const currentPair = getNextBattlePair()
    if (!currentPair) return null
    
    const imagePath = archetypeType === 'protective' ? 'lead-magnet-protective' : 'lead-magnet-essence'
    
    // Calculate progress: battles completed / total battles needed
    const totalBattlesNeeded = originalArchetypeCount - 1
    const progressPercentage = totalBattlesNeeded > 0 ? (totalBattlesCompleted / totalBattlesNeeded) * 100 : 0
    
    return (
      <div className="hybrid-flow">
        <div className="battle-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, progressPercentage)}%` }}></div>
          </div>
          <div className="battle-instruction">
            Select which one sounds more like you
            {battleHistory.length > 0 && (
              <button 
                onClick={handleUndo}
                className="undo-button"
                title="Undo last selection"
              >
                ↶ Undo
              </button>
            )}
          </div>
          <div className="battle-options">
            <div 
              className="battle-card"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBattleSelection(currentPair[0])
              }}
            >
              <img 
                src={`/images/archetypes/${imagePath}/${currentPair[0].image}`} 
                alt={currentPair[0].name}
              />
              {archetypeType === 'protective' && <h3 style={{ textAlign: 'center' }}>{currentPair[0].name}</h3>}
              <p><strong>{currentPair[0].description}</strong></p>
            </div>
            <div className="vs-divider">VS</div>
            <div 
              className="battle-card"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBattleSelection(currentPair[1])
              }}
            >
              <img 
                src={`/images/archetypes/${imagePath}/${currentPair[1].image}`} 
                alt={currentPair[1].name}
              />
              {archetypeType === 'protective' && <h3 style={{ textAlign: 'center' }}>{currentPair[1].name}</h3>}
              <p><strong>{currentPair[1].description}</strong></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Swipe phase
  if (phase === 'swipe') {
    const currentArchetype = archetypes[currentIndex]
    if (!currentArchetype) return null

    const imagePath = archetypeType === 'protective' ? 'lead-magnet-protective' : 'lead-magnet-essence'
    const buttonText = archetypeType === 'protective' ? 'Sounds Familiar' : 'Sounds Like Me'

    return (
      <div className="hybrid-flow">
        <div className="swipe-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentIndex + 1) / archetypes.length) * 100}%` }}></div>
          </div>
          
          <div className="swipe-progress-info">
            <span>{swipedRight.length} selected</span>
          </div>
          
          <div className="swipe-instruction">
            {isMobile
              ? `Swipe right if this sounds like you, left if it doesn't`
              : `Click the buttons below or swipe right if this sounds like you, left if it doesn't`
            }
            {swipeHistory.length > 0 && (
              <button
                onClick={handleSwipeUndo}
                className="undo-button"
                title="Undo last swipe"
                disabled={isAnimating}
              >
                ↶ Undo
              </button>
            )}
          </div>
          
          <div className="card-stack">
            {/* Next card preview */}
            {archetypes[currentIndex + 1] && (
              <div className="swipe-card swipe-card-next">
                <img
                  src={`/images/archetypes/${imagePath}/${archetypes[currentIndex + 1].image}`}
                  alt={archetypes[currentIndex + 1].name}
                  className="card-image"
                />
                <div className="card-content">
                  {archetypeType === 'protective' && <h3>{archetypes[currentIndex + 1].name}</h3>}
                  <p><strong>{archetypes[currentIndex + 1].description}</strong></p>
                </div>
              </div>
            )}

            {/* Current card */}
            <div
              ref={cardRef}
              className="swipe-card swipe-card-current"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            >
              {/* YES/NO Overlays */}
              <div className="swipe-overlay swipe-overlay-yes" style={{
                opacity: dragDelta > 50 ? 1 : 0,
                transition: 'opacity 0.2s ease'
              }}>
                <span className="overlay-text">✅ YES</span>
              </div>
              <div className="swipe-overlay swipe-overlay-no" style={{
                opacity: dragDelta < -50 ? 1 : 0,
                transition: 'opacity 0.2s ease'
              }}>
                <span className="overlay-text">❌ NO</span>
              </div>

              <img
                src={`/images/archetypes/${imagePath}/${currentArchetype.image}`}
                alt={currentArchetype.name}
                className="card-image"
              />
              <div className="card-content">
                {archetypeType === 'protective' && <h3>{currentArchetype.name}</h3>}
                <p><strong>{currentArchetype.description}</strong></p>
              </div>
            </div>
          </div>
          
          {!isMobile && (
            <div className="swipe-actions">
              <button
                className="swipe-left-btn"
                onClick={handleSwipeLeftButton}
                disabled={isAnimating}
              >
                ❌ Not Me
              </button>
              <button
                className="swipe-right-btn"
                onClick={handleSwipeRightButton}
                disabled={isAnimating}
              >
                ✅ {buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default HybridArchetypeFlow
