/**
 * AttractionOfferFlow - Attraction Offer assessment flow
 *
 * Thin wrapper around MoneyModelFlowBase with flow-specific configuration.
 */

import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import '../AttractionOfferFlow.css'

function AttractionOfferFlow() {
  const config = MONEY_MODEL_CONFIGS.attractionOffer

  const welcomeContent = (
    <>
      <p><strong>Ready to attract the right leads and build your business?</strong></p>
      <p>Every successful business needs a compelling front-end offer that draws in qualified leads and creates momentum.</p>
      <p>But not all attraction offers are created equal...</p>
      <p>Some work best for high-volume lead generation. Others build trust and authority. Some generate testimonials. Others fill programs.</p>
      <p>The wrong offer? You'll burn cash on ads that don't convert.</p>
      <p>The right offer? You'll attract quality leads that turn into paying customers and advocates.</p>
      <p className="welcome-cta-text">Answer 10 quick questions and I'll recommend the perfect attraction offer for your business model.</p>
    </>
  )

  return (
    <MoneyModelFlowBase
      config={config}
      welcomeContent={welcomeContent}
    />
  )
}

export default AttractionOfferFlow
