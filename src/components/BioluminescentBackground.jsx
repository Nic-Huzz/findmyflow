import { useEffect, useRef } from 'react'

export default function BioluminescentBackground() {
  const sporeRef = useRef(null)

  useEffect(() => {
    const container = sporeRef.current
    if (!container) return

    const palette = [
      'rgba(255,60,172,0.5)',
      'rgba(255,60,172,0.3)',
      'rgba(224,64,251,0.4)',
      'rgba(224,64,251,0.25)',
      'rgba(255,184,0,0.3)',
      'rgba(0,229,204,0.2)',
    ]

    const clusters = [
      { x: 15, y: 85 }, { x: 45, y: 90 }, { x: 75, y: 80 },
      { x: 25, y: 95 }, { x: 60, y: 88 }, { x: 85, y: 92 },
      { x: 50, y: 95 },
    ]

    const spores = []

    clusters.forEach((cluster, ci) => {
      const count = 5 + Math.floor(Math.random() * 4)
      for (let i = 0; i < count; i++) {
        const d = document.createElement('div')
        d.className = 'bio-spore'
        const s = 2 + Math.random() * 4
        const col = palette[Math.floor(Math.random() * palette.length)]
        const x = cluster.x + (Math.random() - 0.5) * 8
        const y = cluster.y + (Math.random() - 0.5) * 6
        const dur = 16 + Math.random() * 20
        const delay = ci * 3 + Math.random() * 8
        d.style.cssText = `width:${s}px;height:${s}px;background:${col};box-shadow:0 0 ${s * 3}px ${col};left:${x}%;top:${y}%;animation-duration:${dur}s;animation-delay:${delay}s;`
        container.appendChild(d)
        spores.push(d)
      }
    })

    return () => {
      spores.forEach(s => s.remove())
    }
  }, [])

  return (
    <>
      <div className="bio-reef-glow">
        <div className="bio-rg1" />
        <div className="bio-rg2" />
        <div className="bio-rg3" />
        <div className="bio-rg4" />
      </div>
      <div className="bio-living-texture" />
      <div className="bio-spore-layer" ref={sporeRef} />
    </>
  )
}
