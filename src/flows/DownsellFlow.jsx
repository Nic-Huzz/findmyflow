/**
 * DownsellFlow - Downsell strategy assessment flow
 *
 * Thin wrapper around MoneyModelFlowBase with flow-specific configuration.
 */

import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import '../DownsellFlow.css'

function DownsellFlow() {
  const config = MONEY_MODEL_CONFIGS.downsell

  const welcomeContent = (
    <>
      <p><strong>Turn "no" into "yes" and rescue revenue from lost deals.</strong></p>
      <p>Downsells begin after a customer says no. They're not discounts—they're trades.</p>
      <p>You work with the customer to find combinations of giving and getting until you find a match.</p>
      <p>Through 10 questions we'll identify which of the three downsell strategies is best for you.</p>
      <p>With the right strategy you'll boost conversions by 20-40% and turn "no" customers into loyal advocates.</p>
    </>
  )

  return (
    <MoneyModelFlowBase
      config={config}
      welcomeContent={welcomeContent}
    />
  )
}

export default DownsellFlow
