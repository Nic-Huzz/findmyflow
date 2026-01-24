/**
 * Coming Soon - A/B Testing
 * Placeholder page for the upcoming A/B testing feature
 */
import ComingSoon from './ComingSoon'

export default function ComingSoonABTesting() {
  return (
    <ComingSoon
      title="A/B Testing"
      description="Test and optimize your content"
      icon="🧪"
      backPath="/crm/attract"
      backLabel="Back to Attract"
      breadcrumb={[
        { label: 'Home', path: '/crm' },
        { label: 'Attract', path: '/crm/attract' },
        { label: 'A/B Testing' }
      ]}
      features={[
        'Test different headlines and hooks',
        'Compare landing page variations',
        'Track conversion by variant',
        'AI-powered winner prediction',
        'Statistical significance tracking'
      ]}
    />
  )
}
