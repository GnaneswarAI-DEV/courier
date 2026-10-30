import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight, Lock, Mail, Phone, User } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import Field from '../components/common/Field'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiError } from '../services/api'
import { registerSchema } from '../utils/validation'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await signUp({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      })
      success('Account created', 'Welcome to Courier. You can book your first shipment now.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(apiError(error, 'We could not create your account. Please try again.'))
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your customer account"
      description="Book shipments and follow them from pickup to delivery. Staff accounts are created by an administrator."
      footer={
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {formError}
          </div>
        ) : null}

        <Field
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Asha Verma"
          icon={User}
          error={errors.name?.message}
          {...register('name')}
        />

        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Field
          id="phone"
          label="Phone (optional)"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          icon={Phone}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            icon={Lock}
            error={errors.password?.message}
            {...register('password')}
          />
          <Field
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            icon={Lock}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <p className="text-xs leading-relaxed text-slate-400">
          Use at least 8 characters with a letter and a number. Passwords are hashed with Argon2id;
          we never store the original.
        </p>

        <Button
          type="submit"
          variant="accent"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          iconRight={ArrowRight}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
