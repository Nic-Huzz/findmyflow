/**
 * Coming Soon - Reports
 * Placeholder page for the upcoming reports feature
 */
import ComingSoon from './ComingSoon'

export default function ComingSoonReports() {
  return (
    <ComingSoon
      title="Reports"
      description="In-depth business analytics"
      icon="📊"
      backPath="/crm"
      backLabel="Back to Dashboard"
      breadcrumb={[
        { label: 'Home', path: '/crm' },
        { label: 'Reports' }
      ]}
      features={[
        'Weekly and monthly performance reports',
        'Revenue forecasting',
        'Funnel drop-off analysis',
        'Customer cohort analysis',
        'Export to PDF and CSV'
      ]}
    />
  )
}
