import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Pagination({ page, pageSize, total, onChange, className }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const buttonClass =
    'inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row',
        className,
      )}
    >
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-ink-900">{start}</span>–
        <span className="font-semibold text-ink-900">{end}</span> of{' '}
        <span className="font-semibold text-ink-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <span className="px-2 text-xs font-medium text-slate-500">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
