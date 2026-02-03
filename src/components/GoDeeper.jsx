/**
 * GoDeeper.jsx
 *
 * Reusable CTA component to encourage users to explore deeper flows.
 * Used after quick discovery flows to route to full Flow Finder experiences.
 *
 * Props:
 * - title: Header text (default: "Want to go deeper?")
 * - description: Body text explaining what the deeper flow offers
 * - buttonText: CTA button text (default: "Go Deeper →")
 * - route: Where the button navigates to
 * - flowType: 'skills' | 'problems' | 'persona' - determines default description
 *
 * Created: Feb 2026
 */

import { useNavigate } from 'react-router-dom'
import './GoDeeper.css'

const FLOW_DEFAULTS = {
  skills: {
    description: "The full Skills Discovery flow digs into your life story to uncover even more about your natural talents.",
    route: '/nikigai/skills'
  },
  problems: {
    description: "The full Problems Discovery flow explores the challenges you're passionate about solving.",
    route: '/nikigai/problems'
  },
  persona: {
    description: "The full Persona Discovery flow helps you identify exactly who you're meant to serve.",
    route: '/nikigai/persona'
  }
}

export default function GoDeeper({
  title = "Want to go deeper?",
  description,
  buttonText = "Go Deeper →",
  route,
  flowType = 'skills'
}) {
  const navigate = useNavigate()

  const defaults = FLOW_DEFAULTS[flowType] || FLOW_DEFAULTS.skills
  const finalDescription = description || defaults.description
  const finalRoute = route || defaults.route

  return (
    <div className="go-deeper">
      <h3>{title}</h3>
      <p>{finalDescription}</p>
      <button
        className="go-deeper-btn"
        onClick={() => navigate(finalRoute)}
      >
        {buttonText}
      </button>
    </div>
  )
}
