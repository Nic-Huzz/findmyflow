/**
 * Coming Soon - Automations
 * Placeholder page for the upcoming automations feature
 */
import ComingSoon from './ComingSoon'

export default function ComingSoonAutomations() {
  return (
    <ComingSoon
      title="Automations"
      description="Automate your marketing workflows"
      icon="⚡"
      backPath="/crm/execute"
      backLabel="Back to Execute"
      breadcrumb={[
        { label: 'Home', path: '/crm' },
        { label: 'Execute', path: '/crm/execute' },
        { label: 'Automations' }
      ]}
      features={[
        'Trigger-based email sequences',
        'Automated follow-up reminders',
        'Lead scoring automations',
        'Content scheduling workflows',
        'Integration with your calendar'
      ]}
    />
  )
}
