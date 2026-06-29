import { useState } from 'react'
import { hapticLight } from '../lib/haptics'

export default function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="pl-sec">
      <div className="pl-sec-header" onClick={() => { setOpen(!open); hapticLight() }}>
        {title}
        <span className="pl-sec-toggle">{open ? '▼' : '▶'}</span>
      </div>
      {open && <div className="pl-sec-body">{children}</div>}
    </div>
  )
}
