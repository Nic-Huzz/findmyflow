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
  
  const cardRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)

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

  // Load archetype data
  useEffect(() => {
    const loadArchetypes = async () => {
      try {
        const fileName = archetypeType === 'protective' ? 'Protective-test.json' : 'Essence-test.json'
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

  // Handle swipe right
  const handleSwipeRight = () => {
    if (currentIndex < archetypes.length) {
      const currentArchetype = archetypes[currentIndex]
      setSwipedRight(prev => [...prev, currentArchetype])
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Handle swipe left
  const handleSwipeLeft = () => {
    setCurrentIndex(prev => prev + 1)
  }

  // Touch/Mouse handlers
  const handleStart = (e) => {
    isDragging.current = true
    startX.current = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    currentX.current = startX.current
  }

  const handleMove = (e) => {
    if (!isDragging.current) return
    
    currentX.current = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    const deltaX = currentX.current - startX.current
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`
      cardRef.current.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200)
    }
  }

  const handleEnd = () => {
    if (!isDragging.current) return
    
    isDragging.current = false
    const deltaX = currentX.current - startX.current
    const threshold = 100
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handleSwipeRight()
      } else {
        handleSwipeLeft()
      }
    }
    
    if (cardRef.current) {
      cardRef.current.style.transform = ''
      cardRef.current.style.opacity = ''
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

  // Handle undo
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
          </div>
          
          <div className="card-stack">
            <div 
              ref={cardRef}
              className="swipe-card"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            >
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
                onClick={handleSwipeLeft}
              >
                ❌ Not Me
              </button>
              <button 
                className="swipe-right-btn"
                onClick={handleSwipeRight}
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
