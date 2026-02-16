import { useLocation } from 'react-router-dom'

export default function AnimatedOutlet({ children }) {
  const location = useLocation()
  return (
    <div key={location.key} className="page-enter">
      {children}
    </div>
  )
}
