import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import ParcelTable from '../components/parcels/ParcelTable'
import Pagination from '../components/common/Pagination'
import { EmptyState, ErrorState, LoadingBlock } from '../components/common/States'
import { useAuth } from '../context/AuthContext'
import { parcelsService } from '../services/parcels.service'
import { apiError } from '../services/api'
import { STATUS_OPTIONS } from '../utils/constants'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const PAGE_SIZE = 10

export default function ParcelsPage() {
  const { user, isAdmin, isDriver } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const debouncedSearch = useDebouncedValue(search, 350)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    parcelsService
      .list({
        page,
        page_size: PAGE_SIZE,
        status: status || undefined,
        q: debouncedSearch.trim() || undefined,
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setTotal(data.total)
        // A filter change can leave the current page out of range.
        if (data.items.length === 0 && data.total > 0 && page > 1) {
          setPage(Math.max(1, Math.ceil(data.total / PAGE_SIZE)))
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(apiError(loadError, 'Could not load shipments.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, status, debouncedSearch, reloadTick])

  const retry = () => setReloadTick((tick) => tick + 1)

  const hasFilters = Boolean(status || search.trim())
  const clearFilters = () => {
    setStatus('')
    setSearch('')
    setPage(1)
  }

  const emptyCopy = isDriver
    ? {
        title: 'No shipments assigned to you',
        description: 'An administrator assigns parcels to drivers. Your queue will appear here.',
      }
    : isAdmin
      ? {
          title: 'No shipments match',
          description: 'Try a different status or search term, or clear the filters.',
        }
      : {
          title: 'No shipments yet',
          description:
            user?.role === 'customer'
              ? 'Book a shipment to a registered receiver and follow it here.'
              : 'Nothing to show.',
        }

  return (
    <div>
      <PageHeader
        eyebrow="Shipments"
        title="All shipments"
        description={
          isAdmin
            ? 'Every parcel in the network. Assign drivers and scan movements from the detail view.'
            : isDriver
              ? 'Only the parcels assigned to you are listed here.'
              : 'Parcels you sent or that are on their way to you.'
        }
        actions={
          <Button as={Link} to="/parcels/new" variant="accent" icon={PackagePlus}>
            New shipment
          </Button>
        }
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="shipment-search" className="sr-only">
              Search shipments
            </label>
            <input
              id="shipment-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search tracking, address or name"
              className="field pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="field h-10 w-auto min-w-[150px] py-0"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <ErrorState description={error} onRetry={retry} />
        ) : loading ? (
          <LoadingBlock rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={hasFilters ? 'No shipments match your filters' : emptyCopy.title}
            description={
              hasFilters
                ? 'Adjust the status or search term to see more results.'
                : emptyCopy.description
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button as={Link} to="/parcels/new" variant="accent" size="sm" icon={PackagePlus}>
                  Book a shipment
                </Button>
              )
            }
          />
        ) : (
          <>
            <ParcelTable parcels={items} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
