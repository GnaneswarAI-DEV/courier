import { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCheck,
  MapPin,
  Navigation,
  PackageCheck,
  PackagePlus,
  Truck,
} from 'lucide-react'
import { animate, stagger, utils } from 'animejs'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { PARCEL_STATUS, STATUS_ORDER } from '../../utils/constants'
import { formatDateTime } from '../../utils/format'
import { cn } from '../../utils/cn'

const STATUS_ICON = {
  CREATED: PackagePlus,
  PICKED_UP: PackageCheck,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: Navigation,
  DELIVERED: CheckCheck,
  FAILED: AlertTriangle,
  CANCELLED: Ban,
}

function progressRatio(status) {
  if (status === 'DELIVERED') return 1
  if (status === 'FAILED' || status === 'CANCELLED') return 0.35
  const index = STATUS_ORDER.indexOf(status)
  if (index < 0) return 0
  return index / (STATUS_ORDER.length - 1)
}

export default function TrackingTimeline({ events = [], status, emptyLabel = 'No scans yet' }) {
  const listRef = useRef(null)
  const lineRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const items = listRef.current?.querySelectorAll('[data-step]')
    if (!items || items.length === 0) return

    if (reduced) {
      utils.set(items, { opacity: 1, translateY: 0 })
      if (lineRef.current) utils.set(lineRef.current, { scaleY: 1, opacity: 1 })
      return
    }

    utils.set(items, { opacity: 0, translateY: 14 })
    if (lineRef.current) utils.set(lineRef.current, { scaleY: 0, opacity: 0 })

    animate(items, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 520,
      delay: stagger(90),
      ease: 'outCubic',
    })

    if (lineRef.current) {
      animate(lineRef.current, {
        opacity: [0, 1],
        scaleY: [0, 1],
        duration: 900,
        delay: 120,
        ease: 'inOutQuad',
      })
    }
  }, [events.length, status, reduced])

  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">{emptyLabel}</p>
  }

  const activeStatus = status || events[events.length - 1]?.status

  return (
    <div className="relative">
      <ol ref={listRef} className="relative space-y-0">
        <span
          className="absolute left-[19px] top-3 bottom-3 w-px bg-slate-200"
          aria-hidden="true"
        />
        <span
          ref={lineRef}
          className="absolute left-[19px] top-3 w-px origin-top bg-gradient-to-b from-brand-400 via-brand-500 to-accent"
          style={{ bottom: '0.75rem', transform: 'scaleY(0)' }}
          aria-hidden="true"
        />

        {events.map((event, index) => {
          const meta = PARCEL_STATUS[event.status] || PARCEL_STATUS.CREATED
          const Icon = STATUS_ICON[event.status] || PackagePlus
          const isLatest = index === events.length - 1
          const isCancelled = event.status === 'CANCELLED' || event.status === 'FAILED'

          return (
            <li key={event.log_id ?? `${event.status}-${index}`} data-step className="relative flex gap-4 pb-7 last:pb-0">
              <span
                className={cn(
                  'relative z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm',
                  isCancelled
                    ? 'bg-rose-50 text-rose-600'
                    : isLatest
                      ? 'bg-ink-900 text-white'
                      : 'bg-slate-100 text-slate-500',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {isLatest && !isCancelled ? (
                  <span className="absolute inset-0 -z-10 animate-pulseSoft rounded-full bg-accent/25" />
                ) : null}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{meta.label}</p>
                  {isLatest ? (
                    <span className="chip bg-accent/10 text-accent ring-accent/25">
                      Latest scan
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {event.location}
                  <span className="mx-1 text-slate-300">·</span>
                  {formatDateTime(event.updated_at)}
                </p>
                {event.remarks ? (
                  <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                    {event.remarks}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Journey progress</span>
          <span>{Math.round(progressRatio(activeStatus) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent transition-[width] duration-700"
            style={{ width: `${Math.round(progressRatio(activeStatus) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
