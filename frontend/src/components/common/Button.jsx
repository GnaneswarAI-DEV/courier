import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const VARIANTS = {
  primary:
    'bg-ink-900 text-white shadow-sm hover:bg-ink-800 focus-visible:ring-ink-900/30 disabled:bg-ink-900/50',
  // Deep gold keeps white label text above the 4.5:1 contrast floor.
  accent:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500/40 disabled:bg-brand-600/50',
  secondary:
    'bg-white text-ink-900 border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink-900 focus-visible:ring-slate-200',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-300 disabled:bg-rose-300',
  inverse:
    'bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:bg-white/15 focus-visible:ring-white/40',
  // Landing-page variants: antique gold fill and hairline outline on ivory paper.
  gold:
    'bg-gold-600 text-paper-50 shadow-sm hover:bg-gold-700 focus-visible:ring-gold-500/40 disabled:bg-gold-600/50',
  outline:
    'border border-char/15 bg-transparent text-char hover:border-char/40 hover:bg-char/5 focus-visible:ring-char/20',
}

const SIZES = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
}

export default function Button({
  as,
  to,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  disabled,
  ...props
}) {
  const classes = cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70',
    VARIANTS[variant],
    SIZES[size],
    className,
  )

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4" aria-hidden="true" /> : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }

  const Component = as || 'button'
  return (
    <Component
      className={classes}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </Component>
  )
}
