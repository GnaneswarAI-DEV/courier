import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  PackagePlus,
  RefreshCw,
  ScanLine,
  Truck,
  Users,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/dashboard/StatCard'
import StatusChart from '../components/dashboard/StatusChart'
import ParcelTable from '../components/parcels/ParcelTable'
import Button from '../components/common/Button'
import { EmptyState, ErrorState, LoadingBlock } from '../components/common/States'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/admin.service'
import { apiError } from '../services/api'
import { formatDateTime, formatPercent } from '../utils/format'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSummary(await dashboardService.summary())
    } catch (loadError) {
      setError(apiError(loadError, 'Could not load your dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? 'Operations overview' : 'Your workspace'}
        title={`Good to see you, ${firstName}`}
        description={
          isAdmin
            ? 'Network-wide shipment counts, delivery performance and the latest activity.'
            : 'Everything you have sent, everything arriving — in one place.'
        }
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={load} loading={loading}>
              Refresh
            </Button>
            <Button as={Link} to="/parcels/new" variant="accent" icon={PackagePlus}>
              New shipment
            </Button>
          </>
        }
      />

      {error ? (
        <div className="card">
          <ErrorState description={error} onRetry={load} />
        </div>
      ) : loading || !summary ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card h-[116px] animate-pulse bg-slate-100/60" />
            ))}
          </div>
          <div className="card">
            <LoadingBlock rows={4} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total shipments"
              value={summary.total_parcels}
              icon={Boxes}
              tone="brand"
              hint={`${summary.created_last_7_days} booked in the last 7 days`}
            />
            <StatCard
              label="Active"
              value={summary.active_parcels}
              icon={Truck}
              tone="indigo"
              hint={`${summary.awaiting_pickup} awaiting pickup`}
            />
            <StatCard
              label="Delivered"
              value={summary.delivered_parcels}
              icon={CheckCircle2}
              tone="emerald"
              hint={`${summary.delivered_last_7_days} delivered this week`}
            />
            {isAdmin ? (
              <StatCard
                label="Active drivers"
                value={summary.active_drivers}
                icon={Users}
                tone="default"
                hint={`On-time rate ${formatPercent(summary.on_time_delivery_rate)}`}
              />
            ) : (
              <StatCard
                label="Total weight"
                value={summary.total_weight_kg}
                icon={Clock3}
                tone="default"
                format={(value) => `${Number(value).toFixed(1)} kg`}
                hint={`On-time rate ${formatPercent(summary.on_time_delivery_rate)}`}
              />
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">Status distribution</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Counts grouped by current shipment state.
                  </p>
                </div>
                <span className="chip bg-slate-100 text-slate-600 ring-slate-200">
                  {summary.total_weight_kg.toFixed(1)} kg total
                </span>
              </div>
              <div className="mt-6">
                <StatusChart breakdown={summary.status_breakdown} />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">Latest activity</h2>
                  <p className="mt-1 text-xs text-slate-500">The five most recently booked parcels.</p>
                </div>
                <Link
                  to="/parcels"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {summary.recent_parcels.length === 0 ? (
                <EmptyState
                  icon={ScanLine}
                  title="No shipments yet"
                  description="Book a shipment and it will show up here with live status."
                  action={
                    <Button as={Link} to="/parcels/new" variant="accent" size="sm" icon={PackagePlus}>
                      Book a shipment
                    </Button>
                  }
                />
              ) : (
                <ul className="mt-5 space-y-3">
                  {summary.recent_parcels.map((parcel) => (
                    <li key={parcel.tracking_number}>
                      <Link
                        to={`/parcels/${parcel.tracking_number}`}
                        className="block rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-xs font-semibold text-ink-900">
                            {parcel.tracking_number}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(parcel.created_at)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          {parcel.receiver?.name} · {parcel.status.replaceAll('_', ' ').toLowerCase()}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card min-w-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Recent shipments</h2>
                <p className="mt-1 text-xs text-slate-500">Scroll horizontally on smaller screens.</p>
              </div>
              <Button as={Link} to="/parcels" variant="ghost" size="sm" iconRight={ArrowUpRight}>
                All shipments
              </Button>
            </div>
            {summary.recent_parcels.length === 0 ? (
              <EmptyState
                title="Nothing in the pipeline"
                description="When a shipment is booked it appears here immediately."
              />
            ) : (
              <ParcelTable parcels={summary.recent_parcels} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
