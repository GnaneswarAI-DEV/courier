import AnimatedNumber from '../animations/AnimatedNumber'
import { cn } from '../../utils/cn'

export default function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  format,
}) {
  const tones = {
    default: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-50 text-brand-600',
    indigo: 'bg-accent/10 text-accent',
    emerald: 'bg-success-50 text-success-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        {Icon ? (
          <span className={cn('rounded-xl p-2', tones[tone] || tones.default)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  )
}
