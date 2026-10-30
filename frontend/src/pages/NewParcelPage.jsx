import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight, Mail, MapPin, PackagePlus, Scale, Sparkles } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Field from '../components/common/Field'
import Button from '../components/common/Button'
import { useToast } from '../context/ToastContext'
import { parcelsService } from '../services/parcels.service'
import { apiError } from '../services/api'
import { parcelSchema } from '../utils/validation'

export default function NewParcelPage() {
  const navigate = useNavigate()
  const { success } = useToast()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(parcelSchema),
    defaultValues: {
      receiver_email: '',
      weight: 1,
      pickup_address: '',
      delivery_address: '',
      estimated_delivery: '',
      notes: '',
    },
  })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const parcel = await parcelsService.create({
        receiver_email: values.receiver_email.trim(),
        weight: Number(values.weight),
        pickup_address: values.pickup_address.trim(),
        delivery_address: values.delivery_address.trim(),
        estimated_delivery: values.estimated_delivery || undefined,
        notes: values.notes?.trim() || undefined,
      })
      success(
        'Shipment booked',
        `Tracking number ${parcel.tracking_number} is ready to share.`,
      )
      navigate(`/parcels/${parcel.tracking_number}`, { replace: true })
    } catch (error) {
      setFormError(apiError(error, 'We could not book this shipment. Please review the details.'))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Book"
        title="New shipment"
        description="The receiver must already have a Courier account. They will see the parcel as incoming."
        actions={
          <Button as={Link} to="/parcels" variant="ghost">
            Back to shipments
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-6">
          {formError ? (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {formError}
            </div>
          ) : null}

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
              <Field
                id="receiver_email"
                label="Receiver email"
                type="email"
                placeholder="receiver@example.com"
                icon={Mail}
                hint="We look this account up to link the parcel."
                error={errors.receiver_email?.message}
                {...register('receiver_email')}
              />
              <Field
                id="weight"
                label="Weight (kg)"
                type="number"
                step="0.01"
                min="0.01"
                max="1000"
                icon={Scale}
                error={errors.weight?.message}
                {...register('weight')}
              />
            </div>

            <Field
              id="pickup_address"
              label="Pickup address"
              as="textarea"
              placeholder="12 MG Road, Bengaluru, Karnataka 560001"
              icon={MapPin}
              hint="Street, city, state and postcode. The city is shown publicly."
              error={errors.pickup_address?.message}
              {...register('pickup_address')}
            />

            <Field
              id="delivery_address"
              label="Delivery address"
              as="textarea"
              placeholder="45 Park Street, Kolkata, West Bengal 700016"
              icon={MapPin}
              error={errors.delivery_address?.message}
              {...register('delivery_address')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="estimated_delivery"
                label="Estimated delivery"
                type="date"
                hint="Optional. Cannot be a past date."
                error={errors.estimated_delivery?.message}
                {...register('estimated_delivery')}
              />
              <Field
                id="notes"
                label="Notes"
                placeholder="Handle with care"
                hint="Optional, appears on the first tracking event."
                error={errors.notes?.message}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <Button type="submit" variant="accent" icon={PackagePlus} loading={isSubmitting}>
              {isSubmitting ? 'Booking…' : 'Book shipment'}
            </Button>
            <Button as={Link} to="/parcels" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Sparkles className="h-4 w-4 text-brand-500" aria-hidden="true" />
              What happens next
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                  1
                </span>
                A tracking number is issued and the first event is written.
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                  2
                </span>
                An administrator assigns a driver to collect it.
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                  3
                </span>
                The receiver and you can follow every scan on the timeline.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Before pickup
            </p>
            <p className="mt-2 text-xs leading-relaxed text-brand-900/80">
              You can still edit the weight and addresses, or cancel the booking, until a driver
              collects the parcel.
            </p>
            <Link
              to="/track"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              See how public tracking looks
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
