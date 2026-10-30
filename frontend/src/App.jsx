import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/navigation/AppShell'
import ProtectedRoute from './components/navigation/ProtectedRoute'
import { Spinner } from './components/common/States'

// Route-level code splitting keeps the landing page fast; the dashboard and
// chart-heavy admin screens load only when a signed-in user needs them.
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const TrackPage = lazy(() => import('./pages/TrackPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ParcelsPage = lazy(() => import('./pages/ParcelsPage'))
const NewParcelPage = lazy(() => import('./pages/NewParcelPage'))
const ParcelDetailPage = lazy(() => import('./pages/ParcelDetailPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-3 bg-surface text-sm text-slate-500">
      <Spinner />
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/track" element={<TrackPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/parcels" element={<ParcelsPage />} />
              <Route path="/parcels/new" element={<NewParcelPage />} />
              <Route path="/parcels/:trackingNumber" element={<ParcelDetailPage />} />
              <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AppShell />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
