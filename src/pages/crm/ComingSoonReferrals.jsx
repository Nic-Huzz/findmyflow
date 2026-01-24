/**
 * Coming Soon - Referrals System
 * Placeholder page for the upcoming referral tracking feature
 */
import ComingSoon from './ComingSoon'

export default function ComingSoonReferrals() {
  return (
    <ComingSoon
      title="Referral System"
      description="Track and reward your referrers"
      icon="🗣️"
      backPath="/crm/nurture"
      backLabel="Back to Nurture"
      breadcrumb={[
        { label: 'Home', path: '/crm' },
        { label: 'Nurture', path: '/crm/nurture' },
        { label: 'Referrals' }
      ]}
      features={[
        'Track referral sources automatically',
        'Create unique referral links',
        'Set up reward tiers for top referrers',
        'Monitor referral conversion rates',
        'Send automated thank-you messages'
      ]}
    />
  )
}
