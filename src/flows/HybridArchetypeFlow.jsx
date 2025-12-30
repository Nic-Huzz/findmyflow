import React, { useState, useEffect, useRef } from 'react'

const HybridArchetypeFlow = ({
  archetypeType, // 'protective' or 'essence'
  onComplete, // Callback when selection is complete
  onBack // Optional callback to go back
}) => {
  const [phase, setPhase] = useState('swipe') // 'swipe', 'battle', 'celebration'
  const [archetypes, setArchetypes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedRight, setSwipedRight] = useState([])
  const [originalArchetypeCount, setOriginalArchetypeCount] = useState(0)
  const [totalBattlesCompleted, setTotalBattlesCompleted] = useState(0)
  const [battleHistory, setBattleHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeHistory, setSwipeHistory] = useState([])
  const [dragDelta, setDragDelta] = useState(0)
  const [showGestureHint, setShowGestureHint] = useState(true)
  const [finalArchetype, setFinalArchetype] = useState(null)
  const [confettiPieces, setConfettiPieces] = useState([])
  const [hoveredCard, setHoveredCard] = useState(null)

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

  // Generate confetti
  const generateConfetti = () => {
    const colors = ['#ffdd27', '#5e17eb', '#7c3aed', '#f59e0b', '#10b981', '#ec4899']
    const pieces = []
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8
      })
    }
    setConfettiPieces(pieces)
  }

  // Handle swipe right
  const handleSwipeRight = () => {
    if (currentIndex < archetypes.length) {
      setSwipeHistory(prev => [...prev, { currentIndex, swipedRight: [...swipedRight] }])
      setSwipedRight(prev => [...prev, archetypes[currentIndex]])
      setCurrentIndex(prev => prev + 1)
      // Hide gesture hint after first successful swipe
      if (showGestureHint) setShowGestureHint(false)
    }
  }

  // Handle swipe left
  const handleSwipeLeft = () => {
    setSwipeHistory(prev => [...prev, { currentIndex, swipedRight: [...swipedRight] }])
    setCurrentIndex(prev => prev + 1)
    // Hide gesture hint after first successful swipe
    if (showGestureHint) setShowGestureHint(false)
  }

  // Animated swipe handlers
  const animateSwipe = (direction) => {
    if (isAnimating) return
    setIsAnimating(true)

    if (cardRef.current) {
      const flyDistance = window.innerWidth * 1.5
      cardRef.current.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease'
      cardRef.current.style.transform = `translateX(${direction === 'right' ? flyDistance : -flyDistance}px) rotate(${direction === 'right' ? 30 : -30}deg)`
      cardRef.current.style.opacity = '0'
    }

    setTimeout(() => {
      if (direction === 'right') handleSwipeRight()
      else handleSwipeLeft()

      setIsAnimating(false)
      if (cardRef.current) {
        cardRef.current.style.transition = ''
        cardRef.current.style.transform = ''
        cardRef.current.style.opacity = ''
      }
    }, 400)
  }

  // Touch/Mouse handlers
  const handleStart = (e) => {
    if (isAnimating) return
    isDragging.current = true
    startX.current = e.type.startsWith('mouse') ? e.clientX : e.touches[0].clientX
    currentX.current = startX.current
  }

  const handleMove = (e) => {
    if (!isDragging.current || isAnimating) return
    currentX.current = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    const deltaX = currentX.current - startX.current
    setDragDelta(deltaX)

    if (cardRef.current) {
      const rotation = deltaX * 0.1
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`
      cardRef.current.style.opacity = Math.max(0.7, 1 - Math.abs(deltaX) / 400)
    }
  }

  const handleEnd = () => {
    if (!isDragging.current || isAnimating) return
    isDragging.current = false

    const deltaX = currentX.current - startX.current
    const threshold = 100

    if (Math.abs(deltaX) > threshold) {
      setDragDelta(0)
      animateSwipe(deltaX > 0 ? 'right' : 'left')
    } else {
      // Spring back
      setDragDelta(0)
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
        cardRef.current.style.transform = ''
        cardRef.current.style.opacity = ''
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transition = ''
        }, 300)
      }
    }
  }

  // Check if swipe phase is complete
  useEffect(() => {
    if (currentIndex >= archetypes.length && phase === 'swipe') {
      if (swipedRight.length === 0) {
        setCurrentIndex(0)
        setSwipedRight([])
      } else if (swipedRight.length === 1) {
        // Single selection - show celebration
        setFinalArchetype(swipedRight[0])
        generateConfetti()
        setPhase('celebration')
        setTimeout(() => {
          if (onComplete) onComplete(swipedRight[0])
        }, 2500)
      } else {
        setOriginalArchetypeCount(swipedRight.length)
        setTotalBattlesCompleted(0)
        setPhase('battle')
      }
    }
  }, [currentIndex, archetypes.length, swipedRight.length, phase, onComplete])

  // Handle battle selection
  const handleBattleSelection = (selectedArchetype) => {
    if (swipedRight.length <= 1) return

    setBattleHistory(prev => [...prev, { swipedRight: [...swipedRight], totalBattlesCompleted }])
    const loser = swipedRight.find(a => a !== selectedArchetype)
    const updatedSwipedRight = swipedRight.filter(a => a !== loser)

    setSwipedRight(updatedSwipedRight)
    setTotalBattlesCompleted(prev => prev + 1)

    if (updatedSwipedRight.length === 1) {
      // Final selection - show celebration
      setFinalArchetype(updatedSwipedRight[0])
      generateConfetti()
      setPhase('celebration')
      setTimeout(() => {
        if (onComplete) onComplete(updatedSwipedRight[0])
      }, 2500)
    }
  }

  // Undo handlers
  const handleSwipeUndo = () => {
    if (swipeHistory.length === 0 || isAnimating) return
    const prev = swipeHistory[swipeHistory.length - 1]
    setCurrentIndex(prev.currentIndex)
    setSwipedRight(prev.swipedRight)
    setSwipeHistory(h => h.slice(0, -1))
  }

  const handleBattleUndo = () => {
    if (battleHistory.length === 0) return
    const prev = battleHistory[battleHistory.length - 1]
    setSwipedRight(prev.swipedRight)
    setTotalBattlesCompleted(prev.totalBattlesCompleted)
    setBattleHistory(h => h.slice(0, -1))
  }

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      padding: '10px 20px',
      justifyContent: 'center',
    },
    instruction: {
      textAlign: 'center',
      color: 'white',
      fontSize: '14px',
      fontStyle: 'italic',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
    },
    cardContainer: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
      minHeight: '420px',
    },
    nextCard: {
      position: 'absolute',
      width: '100%',
      maxWidth: '350px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      transform: 'scale(0.92)',
      opacity: 0.6,
      zIndex: 1,
      filter: 'blur(1px)',
    },
    card: {
      position: 'relative',
      width: '100%',
      maxWidth: '350px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      cursor: 'grab',
      userSelect: 'none',
      overflow: 'hidden',
      zIndex: 2,
      transition: 'box-shadow 0.2s ease',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '16px',
      pointerEvents: 'none',
      zIndex: 10,
      transition: 'opacity 0.15s ease',
    },
    overlayYes: {
      background: 'rgba(74, 222, 128, 0.3)',
      border: '4px solid rgba(74, 222, 128, 0.7)',
    },
    overlayNo: {
      background: 'rgba(248, 113, 113, 0.3)',
      border: '4px solid rgba(248, 113, 113, 0.7)',
    },
    overlayText: {
      fontSize: '42px',
      fontWeight: 900,
      textTransform: 'uppercase',
      padding: '15px 30px',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.95)',
    },
    overlayTextYes: {
      color: '#16a34a',
      border: '4px solid #4ade80',
    },
    overlayTextNo: {
      color: '#dc2626',
      border: '4px solid #f87171',
    },
    cardImage: {
      width: '100%',
      height: '240px',
      objectFit: 'contain',
      background: '#f8f9fa',
    },
    cardContent: {
      padding: '16px 20px 20px',
      textAlign: 'center',
    },
    archetypeName: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#5e17eb',
      marginBottom: '8px',
    },
    cardText: {
      margin: 0,
      color: '#666',
      lineHeight: 1.4,
      fontSize: '15px',
    },
    progressInfo: {
      textAlign: 'center',
      margin: '12px 0 8px 0',
      fontWeight: 600,
      color: 'white',
      fontSize: '14px',
    },
    progressSubtext: {
      textAlign: 'center',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.6)',
      marginBottom: '8px',
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#e1e5e9',
      borderRadius: '4px',
      marginBottom: '15px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #E9A23B, #f59e0b)',
      transition: 'width 0.3s ease',
    },
    actions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'center',
      marginTop: '10px',
    },
    btnLeft: {
      padding: '12px 25px',
      border: 'none',
      borderRadius: '50px',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      background: '#5e17eb',
      color: 'white',
    },
    btnRight: {
      padding: '12px 25px',
      border: 'none',
      borderRadius: '50px',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      background: '#ffdd27',
      color: '#333',
    },
    undoBtn: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    battleContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '20px',
      overflow: 'auto',
    },
    battleIntro: {
      textAlign: 'center',
      color: 'white',
      marginBottom: '8px',
    },
    battleTitle: {
      fontSize: '20px',
      fontWeight: 700,
      marginBottom: '4px',
    },
    battleSubtext: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.7)',
    },
    battleCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      cursor: 'pointer',
      border: '3px solid transparent',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    battleCardHover: {
      borderColor: '#5e17eb',
      transform: 'scale(1.02)',
      boxShadow: '0 8px 25px rgba(94,23,235,0.2)',
    },
    battleImage: {
      width: '100%',
      height: '100px',
      objectFit: 'contain',
      borderRadius: '12px',
      marginBottom: '12px',
      background: '#f8f9fa',
    },
    battleArchetypeName: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#5e17eb',
      marginBottom: '6px',
      textAlign: 'center',
    },
    vsText: {
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 700,
      color: 'white',
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'white',
    },
    gestureHint: {
      position: 'absolute',
      bottom: '30%',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'rgba(255,255,255,0.8)',
      fontSize: '14px',
      animation: 'gestureHintPulse 1.5s ease-in-out infinite',
      zIndex: 5,
      pointerEvents: 'none',
    },
    gestureArrow: {
      fontSize: '24px',
      animation: 'gestureArrowMove 1.5s ease-in-out infinite',
    },
    celebrationContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    },
    confettiPiece: {
      position: 'absolute',
      top: '-20px',
      width: '10px',
      height: '10px',
      borderRadius: '2px',
    },
    celebrationImage: {
      width: '150px',
      height: '150px',
      borderRadius: '20px',
      objectFit: 'contain',
      background: 'white',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      marginBottom: '24px',
      animation: 'celebrationPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    celebrationBadge: {
      padding: '8px 20px',
      background: archetypeType === 'essence'
        ? 'linear-gradient(135deg, #9333EA, #7C3AED)'
        : 'linear-gradient(135deg, #F59E0B, #D97706)',
      borderRadius: '20px',
      color: 'white',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '12px',
    },
    celebrationName: {
      fontSize: '28px',
      fontWeight: 700,
      color: 'white',
      marginBottom: '8px',
      textAlign: 'center',
    },
    celebrationText: {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
    },
  }

  // Inject keyframes
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = `
      @keyframes gestureHintPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes gestureArrowMove {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(15px); }
      }
      @keyframes celebrationPop {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `
    document.head.appendChild(styleEl)
    return () => document.head.removeChild(styleEl)
  }, [])

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading {archetypeType} archetypes...</p>
      </div>
    )
  }

  // Celebration phase
  if (phase === 'celebration' && finalArchetype) {
    const imagePath = archetypeType === 'protective' ? 'lead-magnet-protective' : 'lead-magnet-essence'

    return (
      <div style={styles.celebrationContainer}>
        {/* Confetti */}
        {confettiPieces.map(piece => (
          <div
            key={piece.id}
            style={{
              ...styles.confettiPiece,
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              background: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              animation: `confettiFall ${piece.duration}s ease-out ${piece.delay}s forwards`,
            }}
          />
        ))}

        <img
          src={`/images/archetypes/${imagePath}/${finalArchetype.image}`}
          alt={finalArchetype.name}
          style={styles.celebrationImage}
        />
        <div style={styles.celebrationBadge}>
          {archetypeType === 'essence' ? 'Your Essence' : 'Your Pattern'}
        </div>
        <div style={styles.celebrationName}>{finalArchetype.name}</div>
        <div style={styles.celebrationText}>Perfect match found!</div>
      </div>
    )
  }

  // Battle phase
  if (phase === 'battle' && swipedRight.length >= 2) {
    const [first, second] = swipedRight
    const imagePath = archetypeType === 'protective' ? 'lead-magnet-protective' : 'lead-magnet-essence'
    const totalBattlesNeeded = originalArchetypeCount - 1
    const progressPercentage = totalBattlesNeeded > 0 ? (totalBattlesCompleted / totalBattlesNeeded) * 100 : 0
    const isFinalTwo = swipedRight.length === 2

    return (
      <div style={styles.battleContainer}>
        {/* Battle intro */}
        <div style={styles.battleIntro}>
          <div style={styles.battleTitle}>
            {isFinalTwo ? '🏆 Final 2!' : 'Which resonates more?'}
          </div>
          <div style={styles.battleSubtext}>
            {isFinalTwo
              ? 'Choose the one that feels most like you'
              : `Narrow down from ${swipedRight.length} options`
            }
          </div>
        </div>

        {battleHistory.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <button style={styles.undoBtn} onClick={handleBattleUndo}>↶ Undo</button>
          </div>
        )}

        <div
          style={{
            ...styles.battleCard,
            ...(hoveredCard === 'first' ? styles.battleCardHover : {})
          }}
          onClick={() => handleBattleSelection(first)}
          onMouseEnter={() => setHoveredCard('first')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <img src={`/images/archetypes/${imagePath}/${first.image}`} alt={first.name} style={styles.battleImage} />
          <p style={{ ...styles.cardText, textAlign: 'center' }}>{first.description}</p>
        </div>

        <div style={styles.vsText}>VS</div>

        <div
          style={{
            ...styles.battleCard,
            ...(hoveredCard === 'second' ? styles.battleCardHover : {})
          }}
          onClick={() => handleBattleSelection(second)}
          onMouseEnter={() => setHoveredCard('second')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <img src={`/images/archetypes/${imagePath}/${second.image}`} alt={second.name} style={styles.battleImage} />
          <p style={{ ...styles.cardText, textAlign: 'center' }}>{second.description}</p>
        </div>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progressPercentage}%` }}></div>
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
    const progressPercentage = ((currentIndex + 1) / archetypes.length) * 100
    const cardsRemaining = archetypes.length - currentIndex
    const isAlmostDone = cardsRemaining <= 3

    const nextArchetype = archetypes[currentIndex + 1]

    return (
      <div style={styles.container}>
        <div style={styles.instruction}>
          {isMobile ? (
            <>Swipe right if this sounds like you</>
          ) : (
            'Click the buttons or swipe'
          )}
        </div>

        <div style={styles.cardContainer}>
          {/* Gesture hint for mobile - first card only */}
          {isMobile && showGestureHint && currentIndex === 0 && (
            <div style={styles.gestureHint}>
              <span>Swipe</span>
              <span style={styles.gestureArrow}>→</span>
            </div>
          )}

          {/* Next card preview */}
          {nextArchetype && (
            <div style={styles.nextCard}>
              <img
                src={`/images/archetypes/${imagePath}/${nextArchetype.image}`}
                alt={nextArchetype.name}
                style={styles.cardImage}
              />
              <div style={styles.cardContent}>
                <p style={styles.cardText}>{nextArchetype.description}</p>
              </div>
            </div>
          )}

          {/* Current card */}
          <div
            ref={cardRef}
            style={styles.card}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            {/* YES overlay */}
            <div style={{
              ...styles.overlay,
              ...styles.overlayYes,
              opacity: dragDelta > 50 ? Math.min(1, (dragDelta - 50) / 100) : 0,
            }}>
              <span style={{ ...styles.overlayText, ...styles.overlayTextYes }}>✅ YES</span>
            </div>

            {/* NO overlay */}
            <div style={{
              ...styles.overlay,
              ...styles.overlayNo,
              opacity: dragDelta < -50 ? Math.min(1, (-dragDelta - 50) / 100) : 0,
            }}>
              <span style={{ ...styles.overlayText, ...styles.overlayTextNo }}>❌ NO</span>
            </div>

            <img
              src={`/images/archetypes/${imagePath}/${currentArchetype.image}`}
              alt={currentArchetype.name}
              style={styles.cardImage}
            />
            <div style={styles.cardContent}>
              <p style={styles.cardText}>{currentArchetype.description}</p>
            </div>
          </div>
        </div>

        {/* Better progress display */}
        <div style={styles.progressInfo}>
          {currentIndex + 1} of {archetypes.length} • {swipedRight.length} resonate{swipedRight.length !== 1 ? '' : 's'}
        </div>
        {isAlmostDone && (
          <div style={styles.progressSubtext}>Almost there! 🎯</div>
        )}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progressPercentage}%` }}></div>
        </div>

        {swipeHistory.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <button style={styles.undoBtn} onClick={handleSwipeUndo} disabled={isAnimating}>↶ Undo</button>
          </div>
        )}

        {!isMobile && (
          <div style={styles.actions}>
            <button style={styles.btnLeft} onClick={() => animateSwipe('left')} disabled={isAnimating}>
              ❌ Not Me
            </button>
            <button style={styles.btnRight} onClick={() => animateSwipe('right')} disabled={isAnimating}>
              ✅ {buttonText}
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default HybridArchetypeFlow
