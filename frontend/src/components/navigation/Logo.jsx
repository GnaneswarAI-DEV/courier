import { Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export default function Logo({ tone = 'dark', to = '/', className, showTagline = false, taglineClassName }) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5 rounded-lg', className)}
      aria-label="Courier home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-[0_8px_18px_-8px_rgba(176,133,47,0.85)]">
        <Package className="h-5 w-5 text-white" strokeWidth={2.2} aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white/90" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[15px] font-bold tracking-[0.14em]',
            tone === 'dark' ? 'text-white' : 'text-ink-900',
          )}
        >
          COURIER
        </span>
        {showTagline ? (
          <span
            className={cn(
              'mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.2em]',
              tone === 'dark' ? 'text-slate-400' : 'text-slate-500',
              taglineClassName,
            )}
          >
            Parcel intelligence
          </span>
        ) : null}
      </span>
    </Link>
  )
}
