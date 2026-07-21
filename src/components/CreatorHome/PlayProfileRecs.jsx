/**
 * PlayProfileRecs.jsx — Play Profile Recommendations.
 *
 * Two exports:
 *   PlayProfileEventRec — Event format card for the Experiences tab
 *   PlayProfileContentRec — Content channel card for the Growth tab
 *
 * Reads the user's 5 DNA sliders and experience history to produce
 * personalised recommendations that evolve with their data.
 */
import { useMemo } from 'react'
import { hapticLight } from '../../lib/haptics'

// ─── Slider Parser ───────────────────────────────────────────────────

export function parseSliders(dnaCode) {
  if (!dnaCode) return null
  const parts = dnaCode.split('-').map(Number)
  if (parts.length !== 5 || parts.some(isNaN)) return null
  return {
    workRhythm: parts[0],     // 1=Marathon, 5=Sprints
    fuelType: parts[1],       // 1=Fire, 5=Purpose
    orientation: parts[2],    // 1=Solo, 5=Social
    knowledgeStyle: parts[3], // 1=Analytical, 5=Intuitive
    scaleApproach: parts[4],  // 1=Craft, 5=Empire
  }
}

// ─── Experience type matching ────────────────────────────────────────

// Map recommended formats to the experience_type values in the DB
const FORMAT_TO_TYPES = {
  'Weekly intimate class': ['workshop', 'circle', 'one_on_one'],
  'Weekly community gathering': ['workshop', 'circle'],
  'Weekly class that feeds a certification': ['workshop', 'course'],
  'Weekend intensive or festival': ['retreat', 'popup'],
  'Monthly deep retreat': ['retreat'],
  'Monthly immersive workshop': ['workshop', 'retreat'],
  'Weekend immersive or multi-day event': ['retreat', 'popup'],
  'Weekly 1:1 or small group session': ['one_on_one', 'circle'],
  'Weekly recurring class': ['workshop', 'circle'],
  'Monthly intensive workshop': ['workshop'],
  'Bi-weekly workshop or monthly deep session': ['workshop', 'retreat'],
}

function checkAlignment(recFormat, pastExperiences) {
  const matchTypes = FORMAT_TO_TYPES[recFormat] || []
  if (!matchTypes.length || !pastExperiences.length) return null

  const aligned = pastExperiences.filter(e => matchTypes.includes(e.experience_type))
  const misaligned = pastExperiences.filter(e => e.experience_type && !matchTypes.includes(e.experience_type))

  // No experience_type set on any past experience
  if (aligned.length === 0 && misaligned.length === 0) return 'exploring'
  if (aligned.length === 0 && misaligned.length > 0) return 'misaligned'
  if (aligned.length > misaligned.length) return 'aligned'
  if (misaligned.length > aligned.length) return 'mixed'
  return 'exploring'
}

function getEventRec(s) {
  const isMarathon = s.workRhythm <= 2
  const isSprint = s.workRhythm >= 4
  const isSolo = s.orientation <= 2
  const isSocial = s.orientation >= 4
  const isCraft = s.scaleApproach <= 2
  const isEmpire = s.scaleApproach >= 4

  if (isMarathon && isCraft && isSolo) return {
    format: 'Weekly intimate class',
    size: '8-15 people',
    why: 'You need consistency and depth, not big productions. Steady reps in small rooms.',
    icon: '🧘',
  }
  if (isMarathon && isCraft && isSocial) return {
    format: 'Weekly community gathering',
    size: '15-30 people',
    why: 'Recurring and people-powered. Your energy comes from the group, your rhythm comes from consistency.',
    icon: '🤝',
  }
  if (isMarathon && isEmpire) return {
    format: 'Weekly class that feeds a certification',
    size: '15-30 people',
    why: 'Steady reps building toward a scalable method. Each class refines the system others will teach.',
    icon: '📋',
  }
  if (isSprint && isEmpire && isSocial) return {
    format: 'Weekend intensive or festival',
    size: '50-200+ people',
    why: 'You thrive in big bursts with big rooms. Intensive energy, then recovery.',
    icon: '🎪',
  }
  if (isSprint && isCraft && isSolo) return {
    format: 'Monthly deep retreat',
    size: '6-12 people',
    why: 'Intense but intimate. Deep work in bursts, then space to recover and reflect.',
    icon: '🏔️',
  }
  if (isSprint && isCraft && isSocial) return {
    format: 'Monthly immersive group workshop',
    size: '15-30 people',
    why: 'Batch energy into focused group events. Quality and community together.',
    icon: '✨',
  }
  if (isSprint && isCraft) return {
    format: 'Monthly immersive workshop',
    size: '10-20 people',
    why: 'Batch your energy into focused events. Quality over quantity.',
    icon: '✨',
  }
  if (isSprint && isSocial) return {
    format: 'Weekend immersive or multi-day event',
    size: '30-100 people',
    why: 'Big energy, bigger rooms. You come alive when the stakes are high.',
    icon: '🔥',
  }
  if (isMarathon && isSolo) return {
    format: 'Weekly 1:1 or small group session',
    size: '1-8 people',
    why: 'Depth over breadth. Your impact comes from going deep with fewer people.',
    icon: '💎',
  }
  if (isMarathon) return {
    format: 'Weekly recurring class',
    size: '10-25 people',
    why: 'Consistency is your superpower. Same day, same time, same room. Let it compound.',
    icon: '📅',
  }
  if (isSprint) return {
    format: 'Monthly intensive workshop',
    size: '15-40 people',
    why: 'Burst and recover. Design your calendar around intense build weeks.',
    icon: '⚡',
  }
  // Default for mid-range
  return {
    format: 'Bi-weekly workshop or monthly deep session',
    size: '10-25 people',
    why: 'You have flexibility. Experiment with cadence until you find what energises you.',
    icon: '🎯',
  }
}

function getContentRec(s) {
  const isSolo = s.orientation <= 2
  const isSocial = s.orientation >= 4
  const isAnalytical = s.knowledgeStyle <= 2
  const isIntuitive = s.knowledgeStyle >= 4
  const isMarathon = s.workRhythm <= 2
  const isSprint = s.workRhythm >= 4

  let channel, format, cadence

  if (isSolo && isAnalytical) {
    channel = 'Newsletter or blog'
    format = 'Research-backed long-form. One channel, deep.'
  } else if (isSolo && isIntuitive) {
    channel = 'Podcast or book'
    format = 'Deep storytelling. Unscripted depth over polished production.'
  } else if (isSocial && isAnalytical) {
    channel = 'YouTube or carousels'
    format = 'Data-driven visual content. Collaborations and breakdowns.'
  } else if (isSocial && isIntuitive) {
    channel = 'Reels, lives, TikTok'
    format = 'Raw, in-the-moment. Your energy is the content.'
  } else if (isSolo) {
    channel = 'Newsletter or podcast'
    format = 'Depth-first. Written or spoken, solo production.'
  } else if (isSocial) {
    channel = 'Social-first (Reels, lives, collabs)'
    format = 'People-powered. Conversations over monologues.'
  } else {
    channel = 'Pick one that energises you'
    format = 'You have range. Commit to one channel for 3 months, then assess.'
  }

  if (isMarathon) {
    cadence = 'Weekly, same day. Build the habit. Your consistency compounds.'
  } else if (isSprint) {
    cadence = 'Batch-create in bursts. Film or write a batch, schedule it, then go dark.'
  } else {
    cadence = 'Find your rhythm. Weekly is safe, but test bi-weekly or batching.'
  }

  return { channel, format, cadence }
}

// ─── Event Format Card (Experiences tab) ─────────────────────────────

export function PlayProfileEventRec({ dnaResult, experiences = [], onCreateExperience, onNavigate }) {
  const sliders = useMemo(() => parseSliders(dnaResult?.dna_code), [dnaResult?.dna_code])

  if (!sliders) return null

  const eventRec = getEventRec(sliders)
  const matchName = dnaResult?.matched_founder
  const pastExps = experiences.filter(e => e.status === 'completed' || e.status === 'archived')
  const stage = pastExps.length === 0 ? 1 : pastExps.length <= 3 ? 2 : 3
  const alignment = stage >= 2 ? checkAlignment(eventRec.format, pastExps) : null

  return (
    <div className="ppr-card">
      <div className="ch2-card-header">
        <div className="ch2-card-header-left">
          <span className="ch2-card-icon">🎛️</span>
          <span className="ch2-label" style={{ margin: 0 }}>Built for You</span>
        </div>
        {matchName && (
          <div className="ppr-match-pill" onClick={() => { hapticLight(); onNavigate?.('/play-profile') }}>
            Works like {matchName} →
          </div>
        )}
      </div>

      <div className="ppr-rec-block">
        <div className="ppr-rec-header">
          <span className="ppr-rec-icon">{eventRec.icon}</span>
          <div>
            <div className="ppr-rec-title">Your event format</div>
            <div className="ppr-rec-value">{eventRec.format}</div>
          </div>
        </div>
        <div className="ppr-rec-detail">
          <span className="ppr-rec-size">{eventRec.size}</span>
          <span className="ppr-rec-why">{eventRec.why}</span>
        </div>

        {/* Stage 2-3: data-backed feedback */}
        {stage >= 2 && alignment === 'aligned' && (
          <div className="ppr-rec-evidence">
            {pastExps.length} experience{pastExps.length > 1 ? 's' : ''} completed. Your events match your profile. This is your lane.
          </div>
        )}
        {stage >= 2 && alignment === 'misaligned' && (
          <div className="ppr-rec-nudge">
            You've run {pastExps.length} experience{pastExps.length > 1 ? 's' : ''}, but they don't match your natural format. Worth trying a {eventRec.format.toLowerCase()} to see how it feels?
          </div>
        )}
        {stage >= 2 && alignment === 'mixed' && (
          <div className="ppr-rec-evidence">
            {pastExps.length} experience{pastExps.length > 1 ? 's' : ''} completed. You're experimenting with formats. Notice which ones leave you energised vs drained.
          </div>
        )}
        {stage >= 2 && alignment === 'exploring' && (
          <div className="ppr-rec-evidence">
            {pastExps.length} experience{pastExps.length > 1 ? 's' : ''} completed. Keep exploring. Your data will show your lane.
          </div>
        )}
      </div>

      {stage === 1 && onCreateExperience && (
        <button
          className="ppr-cta"
          onClick={() => { hapticLight(); onCreateExperience() }}
        >
          Create your first {eventRec.format.toLowerCase().split(' ').slice(0, 2).join(' ')} →
        </button>
      )}
    </div>
  )
}

// ─── Content Channel Card (Growth tab) ───────────────────────────────

export function PlayProfileContentRec({ dnaResult, onNavigate }) {
  const sliders = useMemo(() => parseSliders(dnaResult?.dna_code), [dnaResult?.dna_code])

  if (!sliders) return null

  const contentRec = getContentRec(sliders)
  const matchName = dnaResult?.matched_founder

  return (
    <div className="ppr-card">
      <div className="ch2-card-header">
        <div className="ch2-card-header-left">
          <span className="ch2-card-icon">📡</span>
          <span className="ch2-label" style={{ margin: 0 }}>Your Content Channel</span>
        </div>
        {matchName && (
          <div className="ppr-match-pill" onClick={() => { hapticLight(); onNavigate?.('/play-profile') }}>
            Based on your profile →
          </div>
        )}
      </div>

      <div className="ppr-rec-block">
        <div className="ppr-rec-header">
          <span className="ppr-rec-icon">🎯</span>
          <div>
            <div className="ppr-rec-title">Best channel for you</div>
            <div className="ppr-rec-value">{contentRec.channel}</div>
          </div>
        </div>
        <div className="ppr-rec-detail">
          <span className="ppr-rec-why">{contentRec.format}</span>
        </div>
        <div className="ppr-rec-cadence">
          ⏱ {contentRec.cadence}
        </div>
      </div>
    </div>
  )
}

// Default export for backward compat
export default PlayProfileEventRec
