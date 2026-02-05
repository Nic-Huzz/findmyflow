/**
 * ImportResults.jsx
 * Show import success/failure summary with option to download failed rows
 */

import { generateFailedRowsCSV, downloadCSV } from '../../../lib/crm/csvImportService'

export default function ImportResults({
  results,
  csvHeaders,
  onImportMore,
  onComplete,
}) {
  // Safety check for null results
  if (!results) {
    return (
      <div className="step-container import-results">
        <div className="results-header">
          <div className="results-icon">❌</div>
          <h3>Something went wrong</h3>
          <p>No import results available</p>
        </div>
        <div className="step-actions">
          <button className="primary-btn" onClick={onImportMore}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const { success, failed, skipped, errors = [] } = results

  const isFullSuccess = failed === 0
  const isPartialSuccess = success > 0 && failed > 0
  const isFailure = success === 0 && failed > 0

  const handleDownloadFailed = () => {
    if (errors.length === 0) return

    const csvContent = generateFailedRowsCSV(errors, csvHeaders)
    const filename = `failed-import-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csvContent, filename)
  }

  return (
    <div className="step-container import-results">
      {/* Header */}
      <div className="results-header">
        <div className="results-icon">
          {isFullSuccess && '🎉'}
          {isPartialSuccess && '⚠️'}
          {isFailure && '❌'}
        </div>
        <h3>
          {isFullSuccess && 'Import Complete!'}
          {isPartialSuccess && 'Partial Import'}
          {isFailure && 'Import Failed'}
        </h3>
        <p>
          {isFullSuccess && `Successfully imported ${success} record${success !== 1 ? 's' : ''}`}
          {isPartialSuccess && `${success} imported, ${failed} failed`}
          {isFailure && 'No records were imported'}
        </p>
      </div>

      {/* Stats */}
      <div className="results-stats">
        <div className={`results-stat ${success > 0 ? 'success' : ''}`}>
          <div className="stat-value">{success}</div>
          <div className="stat-label">Imported</div>
        </div>
        {failed > 0 && (
          <div className="results-stat failed">
            <div className="stat-value">{failed}</div>
            <div className="stat-label">Failed</div>
          </div>
        )}
        {skipped > 0 && (
          <div className="results-stat skipped">
            <div className="stat-value">{skipped}</div>
            <div className="stat-label">Skipped</div>
          </div>
        )}
      </div>

      {/* Failed Rows Detail */}
      {errors.length > 0 && (
        <div className="failed-rows-section">
          <h4>Failed Rows</h4>
          <div className="failed-rows-list">
            {errors.slice(0, 10).map((error, idx) => (
              <div key={idx} className="failed-row">
                <span className="row-num">Row {error.rowIndex}:</span>
                <span className="row-error">{error.error}</span>
              </div>
            ))}
            {errors.length > 10 && (
              <div className="failed-row">
                <span className="row-error">...and {errors.length - 10} more</span>
              </div>
            )}
          </div>
          <button className="download-failed-btn" onClick={handleDownloadFailed}>
            Download Failed Rows as CSV
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="step-actions">
        <button className="back-btn" onClick={onImportMore}>
          Import More
        </button>
        <button className="primary-btn" onClick={onComplete}>
          Done
        </button>
      </div>
    </div>
  )
}
