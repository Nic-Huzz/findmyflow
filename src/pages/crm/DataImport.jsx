/**
 * DataImport.jsx
 * Standalone page wrapper for CSV Import Wizard
 * Route: /crm/import
 */

import { useNavigate } from 'react-router-dom'
import { CSVImportWizard } from '../../components/crm/CSVImport'

export default function DataImport() {
  const navigate = useNavigate()

  const handleComplete = (results) => {
    // Navigate back to the appropriate page based on what was imported
    // For now, go back to Tools
    navigate('/crm/tools')
  }

  const handleClose = () => {
    navigate('/crm/tools')
  }

  return (
    <CSVImportWizard
      onComplete={handleComplete}
      onClose={handleClose}
    />
  )
}
