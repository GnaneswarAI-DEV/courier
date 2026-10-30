import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Clock3, PackageCheck, Route, RefreshCw } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import StatCard from '../components/dashboard/StatCard'
import { ErrorState, LoadingBlock } from '../components/common/States'
import { reportsService } from '../services/admin.service'
import { apiError } from '../services/api'
import { CHART_COLORS, PARCEL_STATUS } from '../utils/constants'
import { formatDate } from '../utils/format'

const RANGES = [7, 30, 90]

function ThroughputTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lift">
      <p className="text-xs font-semibold text-ink-900">{formatDate(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.dataKey === 'created' ? 'Booked' : 'Delivered'}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [days, setDays] = useState(30)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReport(await reportsService.overview(days))
    } catch (loadError) {
      setError(apiError(loadError, 'Could not load reports.'))
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const totalDelivered = report?.throughput.reduce((sum, day) => sum + day.delivered, 0) || 0
  const maxStatus = Math.max(1, ...(report?.status_distribution || []).map((item) => item.count))
  const maxRoute = Math.max(1, ...(report?.top_routes || []).map((item) => item.count))

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Operations reports"
        description="Throughput, delivery speed and route volume computed from live shipment rows."
        actions={
          <>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              {RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDays(range)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    days === range
                      ? 'bg-ink-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-ink-900'
                  }`}
                  aria-pressed={days === range}
                >
                  {range}d
                </button>
              ))}
            </div>
            <Button variant="secondary" icon={RefreshCw} onClick={load} loading={loading}>
              Refresh
            </Button>
          </>
        }
      />

      {error ? (
        <div className="card">
          <ErrorState description={error} onRetry={load} />
        </div>
      ) : loading || !report ? (
        <div className="card">
          <LoadingBlock rows={6} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Shipments in range"
              value={report.total_parcels_in_range}
              icon={BarChart3}
              tone="brand"
              hint={`Last ${report.range_days} days`}
            />
            <StatCard
              label="Delivered in range"
              value={totalDelivered}
              icon={PackageCheck}
              tone="emerald"
              hint="Completion events inside the window"
            />
            <StatCard
              label="Avg. delivery time"
              value={report.average_delivery_hours ?? 0}
              icon={Clock3}
              tone="indigo"
              format={(value) =>
                report.average_delivery_hours === null ? '—' : `${Number(value).toFixed(1)} h`
              }
              hint="Booked → delivered, completed shipments"
            />
            <StatCard
              label="Top routes"
              value={report.top_routes.length}
              icon={Route}
              tone="default"
              hint={report.top_routes[0]?.route || 'No routes yet'}
            />
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Daily throughput</h2>
                <p className="mt-1 text-xs text-slate-500">Bookings versus deliveries per day.</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
                  Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success-500" aria-hidden="true" />
                  Delivered
                </span>
              </div>
            </div>

            <div className="mt-6 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.throughput} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B0852F" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#B0852F" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="deliveredGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2F7D5B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2F7D5B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D8" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(value) => formatDate(value)}
                    tick={{ fontSize: 11, fill: '#9A9483' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#9A9483' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ThroughputTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#B0852F"
                    strokeWidth={2}
                    fill="url(#createdGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stroke="#2F7D5B"
                    strokeWidth={2}
                    fill="url(#deliveredGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-ink-900">Status distribution</h2>
              <p className="mt-1 text-xs text-slate-500">Shipments booked inside the window.</p>
              <ul className="mt-5 space-y-3">
                {report.status_distribution.map((item) => (
                  <li key={item.status}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">
                        {PARCEL_STATUS[item.status]?.label || item.status}
                      </span>
                      <span className="font-semibold text-ink-900">{item.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${Math.round((item.count / maxStatus) * 100)}%`,
                          backgroundColor: CHART_COLORS[item.status] || '#C9C2B0',
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold text-ink-900">Busiest routes</h2>
              <p className="mt-1 text-xs text-slate-500">City-to-city volume for the selected range.</p>
              {report.top_routes.length === 0 ? (
                <p className="mt-8 text-center text-xs text-slate-400">
                  No shipments in this window yet.
                </p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {report.top_routes.map((route, index) => (
                    <li key={route.route}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-600">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                            {index + 1}
                          </span>
                          {route.route}
                        </span>
                        <span className="font-semibold text-ink-900">{route.count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-[width] duration-700"
                          style={{ width: `${Math.round((route.count / maxRoute) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
