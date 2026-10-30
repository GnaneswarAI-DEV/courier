import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

export function FieldShell({ id, label, hint, error, children, className }) {
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Form field that forwards its ref, which is what React Hook Form relies on to
 * register an input. Without forwardRef the ref is consumed by React and the
 * value never reaches the form state.
 */
const Field = forwardRef(function Field(
  {
    id,
    label,
    error,
    hint,
    icon: Icon,
    as = 'input',
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const Component = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input'
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        ) : null}
        <Component
          ref={ref}
          id={id}
          name={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'field',
            Icon && 'pl-10',
            Component === 'textarea' && 'min-h-[92px] resize-y',
            error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
            className,
          )}
          {...props}
        />
      </div>
    </FieldShell>
  )
})

export default Field
