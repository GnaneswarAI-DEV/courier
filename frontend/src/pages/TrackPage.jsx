import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { animate, utils } from 'animejs'
import {
  ArrowRight,
  CalendarClock,
  Info,
  MapPin,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  Weight,
} from 'lucide-react'
import Logo from '../components/navigation/Logo'
import Button from '../components/common/Button'
import StatusBadge from '../components/common/StatusBadge'
import TrackingTimeline from '../components/tracking/TrackingTimeline'
import { Spinner } from '../components/common/States'
import { trackingService } from '../services/parcels.service'
import { apiError } from '../services/api'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { formatDate, formatDateTime, formatWeight } from '../utils/format'

const TRACKING_PATTERN = /^[A-Za-z0-9-]{5,24}$/

export default function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialNumber = searchParams.get('number') || ''
  const [number, setNumber] = useState(initialNumber)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef(null)
  const reduced = useReducedMotion()
  const lookedUp = useRef(false)

  const lookup = async (value) => {
    const cleaned = value.trim().toUpperCase()
    if (!TRACKING_PATTERN.test(cleaned)) {
      setError('Tracking numbers look like CPT-8F2K9Q4M. Check the number and try again.')
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await trackingService.track(cleaned))
    } catch (lookupError) {
      const status = lookupError?.response?.status
      setError(
        status === 404
          ? 'No shipment matches that tracking number. Double-check it with the sender.'
          : apiError(lookupError, 'We could not look up that shipment. Please try again.'),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialNumber && !lookedUp.current) {
      lookedUp.current = true
      lookup(initialNumber)
    }
    // Only look up the number that was present when the page first opened.
  }, [])

  useEffect(() => {
    if (!result || !resultRef.current || reduced) return
    animate(resultRef.current, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 520,
      ease: 'outCubic',
    })
  }, [result, reduced])

  useLayoutEffect(() => {
    if (reduced && resultRef.current) {
      utils.set(resultRef.current, { opacity: 1, translateY: 0 })
    }
  }, [reduced])

  const onSubmit = (event) => {
    event.preventDefault()
    setSearchParams(number.trim() ? { number: number.trim().toUpperCase() } : {}, {
      replace: true,
    })
    lookup(number)
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo tone="light" />
          <div className="flex items-center gap-2">
            <Button as={Link} to="/login" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button as={Link} to="/register" variant="secondary" size="sm" iconRight={ArrowRight}>
              Create account
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <ScanLine className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
            Public tracking
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Where is my parcel?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
            Enter the tracking number from your booking confirmation. No account is required, and
            street-level addresses stay private.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card sm:flex-row"
        >
          <label htmlFor="tracking-input" className="sr-only">
            Tracking number
          </label>
          <div className="relative flex-1">
            <PackageSearch
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="tracking-input"
              value={number}
              onChange={(event) => {
                setNumber(event.target.value)
                if (error) setError('')
              }}
              placeholder="CPT-8F2K9Q4M"
              autoComplete="off"
              spellCheck={false}
              className="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-10 pr-3 font-mono text-sm uppercase tracking-wide text-ink-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Button type="submit" variant="accent" className="h-12 shrink-0 px-6" loading={loading}>
            {loading ? 'Searching…' : 'Track'}
          </Button>
        </form>

        <div className="mx-auto mt-8 max-w-3xl">
          {loading ? (
            <div className="card flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
              <Spinner />
              Looking up your shipment…
            </div>
          ) : error ? (
            <div className="card px-6 py-12 text-center" role="alert">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <PackageSearch className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-ink-900">We couldn’t find that shipment</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{error}</p>
            </div>
          ) : result ? (
            <div ref={resultRef} className="space-y-5">
              <section className="card overflow-hidden">
                <div className="border-b border-slate-100 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800 px-6 py-6 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Tracking number
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold">{result.tracking_number}</p>
                    </div>
                    <StatusBadge status={result.status} />
                  </div>

                  <div className="mt-5 flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand-400" aria-hidden="true" />
                      {result.pickup_city}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-accent/70" aria-hidden="true" />
                      {result.delivery_city}
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-4 px-6 py-5 sm:grid-cols-4">
                  <div>
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <Weight className="h-3.5 w-3.5" aria-hidden="true" />
                      Weight
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink-900">
                      {formatWeight(result.weight)}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      Estimated
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink-900">
                      {result.estimated_delivery ? formatDate(result.estimated_delivery) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Booked
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink-900">
                      {formatDate(result.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Delivered
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink-900">
                      {result.delivered_at ? formatDate(result.delivered_at) : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink-900">Shipment journey</h2>
                  <span className="text-[11px] text-slate-400">
                    {result.events.length} scan{result.events.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-5">
                  <TrackingTimeline events={result.events} status={result.status} />
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-success-500" aria-hidden="true" />
                  Showing {result.sender_name} → {result.receiver_name}. Street addresses are hidden.
                </p>
                <p className="text-[11px] text-slate-400">
                  Last update {formatDateTime(result.updated_at)}
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-8">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-accent/10 p-2 text-accent">
                  <Info className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">What you’ll see</h2>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• The current status and every scan, newest last.</li>
                    <li>• Origin and destination cities, weight and estimated delivery.</li>
                    <li>• Names of the sender and receiver — never their addresses or contact details.</li>
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-slate-400">
                    Tracking numbers are issued when a shipment is booked. If you are the sender,
                    sign in to see the full record.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Courier</p>
          <Link to="/" className="font-semibold text-slate-600 hover:text-ink-900">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  )
}
