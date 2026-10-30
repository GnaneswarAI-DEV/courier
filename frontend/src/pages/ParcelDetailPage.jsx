import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  MapPin,
  Pencil,
  ScanLine,
  Trash2,
  UserPlus,
  Weight,
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Field from '../components/common/Field'
import Modal from '../components/common/Modal'
import StatusBadge from '../components/common/StatusBadge'
import TrackingTimeline from '../components/tracking/TrackingTimeline'
import { ErrorState, LoadingBlock } from '../components/common/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { parcelsService } from '../services/parcels.service'
import { usersService } from '../services/admin.service'
import { apiError } from '../services/api'
import { ROLE_LABEL, STATUS_OPTIONS } from '../utils/constants'
import { formatDate, formatDateTime, formatWeight } from '../utils/format'
import { statusUpdateSchema } from '../utils/validation'

const TRANSITIONS = {
  CREATED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['IN_TRANSIT', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

function allowedTransitions(parcel, role) {
  if (!parcel) return []
  const options = TRANSITIONS[parcel.status] || []
  if (role === 'driver') return options.filter((option) => option !== 'CANCELLED')
  return options
}

export default function ParcelDetailPage() {
  const { trackingNumber } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isDriver } = useAuth()
  const { success, error: toastError } = useToast()

  const [parcel, setParcel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drivers, setDrivers] = useState([])
  const [statusOpen, setStatusOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [editValues, setEditValues] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await parcelsService.get(trackingNumber)
      setParcel(data)
      setEditValues({
        weight: data.weight,
        pickup_address: data.pickup_address,
        delivery_address: data.delivery_address,
        estimated_delivery: data.estimated_delivery || '',
      })
    } catch (loadError) {
      setError(apiError(loadError, 'Could not load this shipment.'))
    } finally {
      setLoading(false)
    }
  }, [trackingNumber])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isAdmin) return
    usersService
      .drivers()
      .then(setDrivers)
      .catch(() => setDrivers([]))
  }, [isAdmin])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(statusUpdateSchema) })

  const transitions = allowedTransitions(parcel, user?.role)
  const selectedStatus = watch('status')

  const openStatusModal = () => {
    setActionError('')
    reset({ status: transitions[0] || '', location: '', remarks: '' })
    setStatusOpen(true)
  }

  const changeStatus = async (values) => {
    setActionError('')
    try {
      const updated = await parcelsService.changeStatus(trackingNumber, {
        status: values.status,
        location: values.location.trim(),
        remarks: values.remarks?.trim() || undefined,
      })
      setParcel(updated)
      setStatusOpen(false)
      success('Shipment updated', `Now marked as ${values.status.replaceAll('_', ' ').toLowerCase()}.`)
    } catch (actionFailure) {
      setActionError(apiError(actionFailure, 'Could not update the shipment.'))
    }
  }

  const assignDriver = async () => {
    if (!selectedDriver) {
      setActionError('Choose a driver first.')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      const updated = await parcelsService.assignDriver(trackingNumber, Number(selectedDriver))
      setParcel(updated)
      setAssignOpen(false)
      setSelectedDriver('')
      success('Driver assigned', `${updated.driver?.name} is now responsible for this parcel.`)
    } catch (assignFailure) {
      setActionError(apiError(assignFailure, 'Could not assign this driver.'))
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setActionError('')
    try {
      const updated = await parcelsService.update(trackingNumber, {
        weight: Number(editValues.weight),
        pickup_address: editValues.pickup_address,
        delivery_address: editValues.delivery_address,
        estimated_delivery: editValues.estimated_delivery || null,
      })
      setParcel(updated)
      setEditOpen(false)
      success('Details saved', 'The shipment information has been updated.')
    } catch (editFailure) {
      setActionError(apiError(editFailure, 'Could not update the details.'))
    } finally {
      setBusy(false)
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    setBusy(true)
    setActionError('')
    try {
      await confirm.action()
      setConfirm(null)
    } catch (confirmFailure) {
      setActionError(apiError(confirmFailure, 'The action could not be completed.'))
    } finally {
      setBusy(false)
    }
  }

  const cancelShipment = () =>
    setConfirm({
      title: 'Cancel this shipment?',
      description:
        'The parcel will be marked cancelled and its timeline will record the decision. This cannot be undone.',
      confirmLabel: 'Cancel shipment',
      tone: 'danger',
      action: async () => {
        const updated = await parcelsService.changeStatus(trackingNumber, {
          status: 'CANCELLED',
          location: parcel.pickup_address.split(',')[1]?.trim() || 'Pickup city',
          remarks: 'Cancelled by the sender before pickup',
        })
        setParcel(updated)
        success('Shipment cancelled', 'The tracking timeline has been updated.')
      },
    })

  const deleteShipment = () =>
    setConfirm({
      title: 'Delete this shipment?',
      description:
        'This removes the parcel and its entire tracking history. Only do this for test or incorrect records.',
      confirmLabel: 'Delete permanently',
      tone: 'danger',
      action: async () => {
        await parcelsService.remove(trackingNumber)
        toastError('Shipment deleted', 'The parcel and its history were removed.')
        navigate('/parcels', { replace: true })
      },
    })

  if (loading) {
    return (
      <div className="card">
        <LoadingBlock rows={5} />
      </div>
    )
  }

  if (error || !parcel) {
    return (
      <div className="card">
        <ErrorState
          title="Shipment unavailable"
          description={error || 'This shipment does not exist or you do not have access to it.'}
          onRetry={load}
        />
        <div className="border-t border-slate-100 px-6 py-4 text-center">
          <Link to="/parcels" className="text-xs font-semibold text-accent hover:underline">
            Back to shipments
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = (isAdmin || parcel.sender.user_id === user?.user_id) && parcel.status === 'CREATED'
  const isAssignedDriver = isDriver && parcel.driver?.user_id === user?.user_id

  return (
    <div>
      <div className="mb-5">
        <Link
          to="/parcels"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All shipments
        </Link>
      </div>

      <PageHeader
        eyebrow="Shipment"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-2xl">{parcel.tracking_number}</span>
            <StatusBadge status={parcel.status} />
          </span>
        }
        description={`Booked ${formatDateTime(parcel.created_at)} · last updated ${formatDateTime(parcel.updated_at)}`}
        actions={
          <>
            {isAdmin ? (
              <Button variant="secondary" icon={UserPlus} onClick={() => { setActionError(''); setAssignOpen(true) }}>
                {parcel.driver ? 'Reassign driver' : 'Assign driver'}
              </Button>
            ) : null}
            {(isAdmin || isAssignedDriver) && transitions.length > 0 ? (
              <Button variant="accent" icon={ScanLine} onClick={openStatusModal}>
                Update status
              </Button>
            ) : null}
            {parcel.sender.user_id === user?.user_id && parcel.status === 'CREATED' ? (
              <Button variant="danger" icon={AlertTriangle} onClick={cancelShipment}>
                Cancel
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-sm font-semibold text-ink-900">Route</h2>
              {canEdit ? (
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => { setActionError(''); setEditOpen(true) }}>
                  Edit details
                </Button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Pickup
                </p>
                <p className="mt-1.5 flex items-start gap-2 text-sm leading-relaxed text-ink-900">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                  {parcel.pickup_address}
                </p>
                <p className="mt-2 text-xs text-slate-500">{parcel.sender.name}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Delivery
                </p>
                <p className="mt-1.5 flex items-start gap-2 text-sm leading-relaxed text-ink-900">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {parcel.delivery_address}
                </p>
                <p className="mt-2 text-xs text-slate-500">{parcel.receiver.name}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Weight className="h-3.5 w-3.5" aria-hidden="true" />
                  Weight
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">{formatWeight(parcel.weight)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  Estimated
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">
                  {parcel.estimated_delivery ? formatDate(parcel.estimated_delivery) : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Delivered
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">
                  {parcel.delivered_at ? formatDate(parcel.delivered_at) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Driver
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">
                  {parcel.driver?.name || 'Unassigned'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="text-sm font-semibold text-ink-900">People</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Sender', person: parcel.sender },
                { label: 'Receiver', person: parcel.receiver },
                { label: 'Driver', person: parcel.driver },
              ].map((entry) => (
                <li key={entry.label} className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {entry.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">
                    {entry.person?.name || 'Not assigned'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.person ? ROLE_LABEL[entry.person.role] || entry.person.role : '—'}
                  </p>
                </li>
              ))}
            </ul>
            {isAdmin ? (
              <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-rose-50/70 px-4 py-3">
                <p className="text-xs leading-relaxed text-rose-700">
                  Deleting removes the shipment and all of its tracking events.
                </p>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={deleteShipment} className="text-rose-600 hover:bg-rose-100">
                  Delete
                </Button>
              </div>
            ) : null}
          </section>
        </div>

        <section className="card h-fit p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Tracking timeline</h2>
            <span className="text-[11px] text-slate-400">{parcel.logs.length} events</span>
          </div>
          <div className="mt-5">
            <TrackingTimeline events={parcel.logs} status={parcel.status} />
          </div>
        </section>
      </div>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update shipment status"
        description="The new status and its scan are saved together."
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="accent" form="status-form" type="submit" loading={isSubmitting}>
              Save status
            </Button>
          </>
        }
      >
        <form id="status-form" onSubmit={handleSubmit(changeStatus)} className="space-y-4">
          {actionError ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
              {actionError}
            </p>
          ) : null}

          <Field
            id="status"
            label="Next status"
            as="select"
            error={errors.status?.message}
            {...register('status')}
          >
            {transitions.map((option) => (
              <option key={option} value={option}>
                {STATUS_OPTIONS.find((statusOption) => statusOption.value === option)?.label || option}
              </option>
            ))}
          </Field>

          <Field
            id="location"
            label="Current location"
            placeholder="City or hub name"
            error={errors.location?.message}
            {...register('location')}
          />

          <Field
            id="remarks"
            label="Remarks"
            as="textarea"
            placeholder="Optional note for the timeline"
            error={errors.remarks?.message}
            {...register('remarks')}
          />

          {selectedStatus === 'DELIVERED' ? (
            <p className="rounded-lg bg-success-50 px-3 py-2 text-xs font-medium text-success-700">
              Saving this marks the shipment delivered and timestamps the completion.
            </p>
          ) : null}
          {selectedStatus === 'CANCELLED' ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              Cancelling is final. The parcel can no longer be moved.
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign a driver"
        description="Drivers only see shipments assigned to them."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="accent" onClick={assignDriver} loading={busy}>
              Assign driver
            </Button>
          </>
        }
      >
        {actionError ? (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
            {actionError}
          </p>
        ) : null}

        {drivers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-ink-900">No active drivers yet</p>
            <p className="mt-1 text-xs leading-relaxed">
              Create a driver account from the People page, then come back to assign this parcel.
            </p>
            <Link
              to="/admin/users"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Manage people
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <Field
            id="driver"
            label="Driver"
            as="select"
            value={selectedDriver}
            onChange={(event) => setSelectedDriver(event.target.value)}
          >
            <option value="">Select a driver…</option>
            {drivers.map((driver) => (
              <option key={driver.user_id} value={driver.user_id}>
                {driver.name} · {driver.email}
              </option>
            ))}
          </Field>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit shipment details"
        description="Only available before the parcel is picked up."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="accent" form="edit-form" type="submit" loading={busy}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-form" onSubmit={saveEdit} className="space-y-4">
          {actionError ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
              {actionError}
            </p>
          ) : null}

          <Field
            id="edit-weight"
            label="Weight (kg)"
            type="number"
            step="0.01"
            min="0.01"
            max="1000"
            value={editValues.weight ?? ''}
            onChange={(event) => setEditValues((current) => ({ ...current, weight: event.target.value }))}
          />
          <Field
            id="edit-pickup"
            label="Pickup address"
            as="textarea"
            value={editValues.pickup_address ?? ''}
            onChange={(event) =>
              setEditValues((current) => ({ ...current, pickup_address: event.target.value }))
            }
          />
          <Field
            id="edit-delivery"
            label="Delivery address"
            as="textarea"
            value={editValues.delivery_address ?? ''}
            onChange={(event) =>
              setEditValues((current) => ({ ...current, delivery_address: event.target.value }))
            }
          />
          <Field
            id="edit-eta"
            label="Estimated delivery"
            type="date"
            value={editValues.estimated_delivery ?? ''}
            onChange={(event) =>
              setEditValues((current) => ({ ...current, estimated_delivery: event.target.value }))
            }
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              Keep shipment
            </Button>
            <Button variant="danger" onClick={runConfirm} loading={busy}>
              {confirm?.confirmLabel}
            </Button>
          </>
        }
      >
        {actionError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
            {actionError}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Please confirm to continue.</p>
        )}
      </Modal>
    </div>
  )
}
