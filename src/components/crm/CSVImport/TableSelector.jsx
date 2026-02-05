/**
 * TableSelector.jsx
 * Select destination table for CSV import
 */

import { TABLE_CONFIGS } from '../../../lib/crm/csvImportService'

const TABLE_ORDER = ['crm_contacts', 'crm_warm_leads', 'sales_deals']

export default function TableSelector({ onSelect, onBack, selectedTable }) {
  return (
    <div className="step-container table-selector">
      <div className="step-header">
        <h3>Where should this data go?</h3>
        <p>Select the CRM table to import your data into</p>
      </div>

      <div className="table-options">
        {TABLE_ORDER.map((tableKey) => {
          const config = TABLE_CONFIGS[tableKey]
          const isSelected = selectedTable === tableKey

          return (
            <div
              key={tableKey}
              className={`table-option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(tableKey)}
            >
              <span className="table-option-icon">{config.icon}</span>
              <div className="table-option-info">
                <p className="table-option-name">{config.name}</p>
                <p className="table-option-desc">{config.description}</p>
              </div>
              <div className="table-option-check" />
            </div>
          )
        })}
      </div>

      <div className="step-actions">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}
