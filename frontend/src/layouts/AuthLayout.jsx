import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import Logo from '../components/navigation/Logo'

const POINTS = [
  'Role-scoped access — customers, drivers, administrators',
  'Every status change appends an immutable tracking event',
  'Argon2id password hashing and signed JWT sessions',
]

export default function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="absolute inset-0 bg-grid-dark bg-[size:52px_52px] opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-brand-500/15 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-accent/100/20 blur-[100px]"
          aria-hidden="true"
        />

        <div className="relative">
          <Logo showTagline />
        </div>

        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Operations workspace
          </p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-[40px]">
            The desk that knows where every parcel is.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Courier. Built with React, FastAPI and MySQL.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-8 lg:min-h-0 lg:justify-center lg:px-14 xl:px-20">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Logo tone="light" />
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 hidden items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-ink-900 lg:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>

          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
          ) : null}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}
