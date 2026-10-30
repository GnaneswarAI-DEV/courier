import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { animate } from 'animejs'
import { useAuth } from '../../context/AuthContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { ROLE_LABEL } from '../../utils/constants'
import { initials } from '../../utils/format'
import { cn } from '../../utils/cn'
import Logo from './Logo'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'driver', 'customer'] },
  { to: '/parcels', label: 'Shipments', icon: PackageSearch, roles: ['admin', 'driver', 'customer'] },
  { to: '/parcels/new', label: 'New shipment', icon: PackagePlus, roles: ['admin', 'customer'] },
  { to: '/track', label: 'Track a parcel', icon: ScanLine, roles: ['admin', 'driver', 'customer'] },
  { to: '/admin/users', label: 'People', icon: Users, roles: ['admin'] },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
]

export default function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const contentRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (reduced || !contentRef.current) return
    animate(contentRef.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 420,
      ease: 'outCubic',
    })
  }, [location.pathname, reduced])

  const handleSignOut = () => {
    signOut()
    navigate('/', { replace: true })
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role))

  const sidebar = (
    <div className="flex h-full flex-col rounded-none bg-ink-950 px-4 py-6 lg:rounded-2xl lg:border lg:border-white/5">
      <div className="flex items-center justify-between px-2">
        <Logo showTagline />
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-1" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/parcels'}
              className={({ isActive }) =>
                cn('nav-link', isActive && 'nav-link-active')
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Secured access
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Role-scoped data. Every scan is written to the shipment history by the API.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-300">
          {initials(user?.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-[11px] text-slate-400">
            {ROLE_LABEL[user?.role] || user?.role}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 p-3 lg:block">{sidebar}</aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-[280px] max-w-[85%]">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-surface/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="hidden text-xs font-medium text-slate-500 sm:block">
                Operations workspace
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/track"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-ink-900 sm:flex"
              >
                <ScanLine className="h-4 w-4" aria-hidden="true" />
                Public tracking
              </Link>
              <span className="hidden h-6 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                  {initials(user?.name)}
                </span>
                <span className="hidden text-xs font-semibold text-ink-900 sm:block">
                  {user?.name?.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main ref={contentRef} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
