/**
 * ChallengeFilters - Filter tabs and chips for Groans and Healing tabs
 *
 * Features:
 * - Frequency tabs (All/Daily/Weekly) - styled like stage tabs for view switching
 * - R-type filter chips for category filtering
 */

import './ChallengeFilters.css'

// Frequency tab config - Daily first as default, then Weekly, Deep Dive, then All
const FREQUENCY_TABS = [
  { id: 'daily', label: 'Daily', icon: '☀️' },
  { id: 'weekly', label: 'Weekly', icon: '📅' },
  { id: 'deepdive', label: 'Deep Dive', icon: '🌊' },
  { id: 'all', label: 'All', icon: '📋' }
]

function ChallengeFilters({
  activeCategory,
  activeFrequencyFilter,
  setActiveFrequencyFilter,
  activeRTypeFilter,
  setActiveRTypeFilter
}) {
  return (
    <div className="quest-filters">
      {/* Frequency Tabs - styled like stage tabs */}
      <div className="frequency-tabs">
        {FREQUENCY_TABS.map(tab => (
          <button
            key={tab.id}
            className={`frequency-tab ${activeFrequencyFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFrequencyFilter(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* R-Type Filter Chips - hide for Deep Dive since all are Recognise */}
      {activeFrequencyFilter !== 'deepdive' && (
      <div className="rtype-filters">
        <button
          className={`filter-chip ${activeRTypeFilter === 'All' ? 'active' : ''}`}
          onClick={() => setActiveRTypeFilter('All')}
        >
          All
        </button>
        {activeCategory === 'Groans' ? (
          <>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Recognise' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Recognise')}
            >
              Recognise
            </button>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Rewire' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Rewire')}
            >
              Rewire
            </button>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Reconnect' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Reconnect')}
            >
              Reconnect
            </button>
          </>
        ) : (
          <>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Recognise' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Recognise')}
            >
              Recognise
            </button>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Release' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Release')}
            >
              Release
            </button>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Rewire' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Rewire')}
            >
              Rewire
            </button>
            <button
              className={`filter-chip ${activeRTypeFilter === 'Reconnect' ? 'active' : ''}`}
              onClick={() => setActiveRTypeFilter('Reconnect')}
            >
              Reconnect
            </button>
          </>
        )}
      </div>
      )}
    </div>
  )
}

export default ChallengeFilters
