/**
 * ChallengeFilters - Filter chips for Groans and Healing tabs
 *
 * Provides frequency (All/Daily/Weekly) and R-type filters.
 */

function ChallengeFilters({
  activeCategory,
  activeFrequencyFilter,
  setActiveFrequencyFilter,
  activeRTypeFilter,
  setActiveRTypeFilter
}) {
  return (
    <div className="quest-filters">
      <div className="frequency-toggle">
        <button
          className={`filter-chip ${activeFrequencyFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFrequencyFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-chip ${activeFrequencyFilter === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveFrequencyFilter('daily')}
        >
          Daily
        </button>
        <button
          className={`filter-chip ${activeFrequencyFilter === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveFrequencyFilter('weekly')}
        >
          Weekly
        </button>
      </div>

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
          </>
        )}
      </div>
    </div>
  )
}

export default ChallengeFilters
