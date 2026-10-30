import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import Field from '../components/common/Field'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../services/api'
import { loginSchema } from '../utils/validation'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await signIn(values)
      const destination = location.state?.from || '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setFormError(apiError(error, 'Unable to sign in. Check your details and try again.'))
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Use the email address tied to your courier account."
      footer={
        <p className="text-sm text-slate-500">
          New to Courier?{' '}
          <Link to="/register" className="font-semibold text-accent underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="accent"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          iconRight={ArrowRight}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
