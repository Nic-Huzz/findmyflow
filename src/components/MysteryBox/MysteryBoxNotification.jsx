import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { fetchMysteryBoxes } from '../../lib/mysteryBoxes'
import MysteryBoxModal from './MysteryBoxModal'
import './MysteryBox.css'

/**
 * MysteryBoxNotification — gold shimmer badge in ChallengeHeader.
 * Shows count of unopened boxes. Tap opens the oldest unopened box.
 */
export default function MysteryBoxNotification({ userId }) {
  const [unopened, setUnopened] = useState([])
  const [openingBox, setOpeningBox] = useState(null)

  useEffect(() => {
    if (!userId) return
    fetchMysteryBoxes(userId, true).then(({ data }) => {
      setUnopened(data || [])
    })
  }, [userId])

  if (!unopened.length && !openingBox) return null

  const handleOpen = () => {
    const box = unopened[0]
    if (!box) return
    setOpeningBox(box)
  }

  const handleClose = (insight) => {
    setOpeningBox(null)
    // Remove the opened box from unopened list
    setUnopened(prev => prev.filter(b => b.id !== openingBox?.id))
  }

  return (
    <>
      {unopened.length > 0 && (
        <button className="mb-notification" onClick={handleOpen}>
          <span className="mb-notification-icon">🎁</span>
          {unopened.length > 1 && (
            <span className="mb-notification-count">{unopened.length}</span>
          )}
        </button>
      )}

      {openingBox && (
        <MysteryBoxModal box={openingBox} onClose={handleClose} />
      )}
    </>
  )
}
