import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Mail, Phone, Search, UserPlus, UserX, Users } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import Field from '../components/common/Field'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { EmptyState, ErrorState, LoadingBlock } from '../components/common/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usersService } from '../services/admin.service'
import { apiError } from '../services/api'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { ROLE_BADGE, ROLE_LABEL } from '../utils/constants'
import { formatDate, initials } from '../utils/format'
import { userCreateSchema } from '../utils/validation'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { success, error: toastError } = useToast()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionId, setActionId] = useState(null)
  const debouncedSearch = useDebouncedValue(search, 350)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'customer', password: '' },
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    usersService
      .list({
        page,
        page_size: PAGE_SIZE,
        role: role || undefined,
        q: debouncedSearch.trim() || undefined,
      })
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setTotal(data.total)
      })
      .catch((loadError) => {
        if (!cancelled) setError(apiError(loadError, 'Could not load accounts.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, role, debouncedSearch, reloadTick])

  const refresh = () => setReloadTick((tick) => tick + 1)

  const onCreate = async (values) => {
    setFormError('')
    try {
      await usersService.create({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        role: values.role,
        password: values.password,
      })
      success('Account created', `${values.name} can now sign in as a ${values.role}.`)
      setCreateOpen(false)
      reset()
      refresh()
    } catch (createError) {
      setFormError(apiError(createError, 'Could not create this account.'))
    }
  }

  const toggleActive = async (account) => {
    setActionId(account.user_id)
    try {
      if (account.is_active) {
        const updated = await usersService.deactivate(account.user_id)
        success('Account disabled', `${updated.name} can no longer sign in.`)
      } else {
        const updated = await usersService.update(account.user_id, { is_active: true })
        success('Account enabled', `${updated.name} can sign in again.`)
      }
      refresh()
    } catch (toggleError) {
      toastError('Action failed', apiError(toggleError, 'Could not update this account.'))
    } finally {
      setActionId(null)
    }
  }

  const isSelf = (account) => account.user_id === currentUser?.user_id

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="People"
        description="Create staff accounts, review roles and disable access. Deactivated accounts are blocked at sign-in."
        actions={
          <Button
            variant="accent"
            icon={UserPlus}
            onClick={() => {
              setFormError('')
              setCreateOpen(true)
            }}
          >
            Add account
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
            <label htmlFor="user-search" className="sr-only">
              Search accounts
            </label>
            <input
              id="user-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search name, email or phone"
              className="field pl-10"
            />
          </div>

          <label htmlFor="role-filter" className="sr-only">
            Filter by role
          </label>
          <select
            id="role-filter"
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setPage(1)
            }}
            className="field h-10 w-auto min-w-[160px] py-0"
          >
            <option value="">All roles</option>
            <option value="admin">Administrators</option>
            <option value="driver">Drivers</option>
            <option value="customer">Customers</option>
          </select>
        </div>

        {error ? (
          <ErrorState description={error} onRetry={refresh} />
        ) : loading ? (
          <LoadingBlock rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No accounts match"
            description="Adjust the filters or create the first staff account."
            action={
              <Button variant="accent" size="sm" icon={UserPlus} onClick={() => setCreateOpen(true)}>
                Add account
              </Button>
            }
          />
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-5 py-3 font-semibold">Person</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Contact</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((account) => (
                    <tr key={account.user_id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                            {initials(account.name)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink-900">
                              {account.name}
                              {isSelf(account) ? (
                                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  you
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-slate-500">#{account.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                          {account.email}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                          {account.phone || 'No phone'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`chip ${ROLE_BADGE[account.role]}`}>
                          {ROLE_LABEL[account.role] || account.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`chip ${
                            account.is_active
                              ? 'bg-success-50 text-success-700 ring-success-500/25'
                              : 'bg-slate-100 text-slate-500 ring-slate-200'
                          }`}
                        >
                          {account.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(account.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={account.is_active ? UserX : Users}
                          disabled={isSelf(account) || actionId === account.user_id}
                          loading={actionId === account.user_id}
                          onClick={() => toggleActive(account)}
                        >
                          {account.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create an account"
        description="Staff accounts are created here with an explicit role."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="accent" form="create-user-form" type="submit" loading={isSubmitting}>
              Create account
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleSubmit(onCreate)} className="space-y-4">
          {formError ? (
            <p className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {formError}
            </p>
          ) : null}

          <Field
            id="new-name"
            label="Full name"
            placeholder="Ravi Driver"
            error={errors.name?.message}
            {...register('name')}
          />
          <Field
            id="new-email"
            label="Email"
            type="email"
            placeholder="ravi@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Field
            id="new-phone"
            label="Phone"
            placeholder="+91 98765 43210"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="new-role"
              label="Role"
              as="select"
              error={errors.role?.message}
              {...register('role')}
            >
              <option value="customer">Customer</option>
              <option value="driver">Driver</option>
              <option value="admin">Administrator</option>
            </Field>
            <Field
              id="new-password"
              label="Temporary password"
              type="password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Share the password securely. Users can change it from the API after signing in.
          </p>
        </form>
      </Modal>
    </div>
  )
}
