import { PARCEL_STATUS } from '../../utils/constants'
import { cn } from '../../utils/cn'

export default function StatusBadge({ status, className, showDot = true }) {
  const meta = PARCEL_STATUS[status] || {
    label: status || 'Unknown',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span className={cn('chip', meta.badge, className)}>
      {showDot ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      ) : null}
      {meta.label}
    </span>
  )
}
