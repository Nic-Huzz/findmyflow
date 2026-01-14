/**
 * OnboardingContext
 *
 * Provides onboarding screen state to Zarlo so it can show
 * screen-specific prompts during the onboarding flow.
 */

import { createContext, useContext, useState } from 'react'

const OnboardingContext = createContext({
  onboardingScreen: null,
  setOnboardingScreen: () => {}
})

export function OnboardingProvider({ children }) {
  const [onboardingScreen, setOnboardingScreen] = useState(null)

  return (
    <OnboardingContext.Provider value={{ onboardingScreen, setOnboardingScreen }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}

export default OnboardingContext
