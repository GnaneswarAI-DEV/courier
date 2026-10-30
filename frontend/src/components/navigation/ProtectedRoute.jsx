import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from './Logo'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink-950">
      <Logo />
      <div className="flex items-center gap-2 text-sm text-slate-400" role="status" aria-live="polite">
        <span className="h-2 w-2 animate-pulseSoft rounded-full bg-brand-400" />
        Checking your session…
      </div>
    </div>
  )
}

export default function ProtectedRoute({ roles }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageLoader />

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
