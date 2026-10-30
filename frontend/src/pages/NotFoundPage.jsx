import { Link } from 'react-router-dom'
import { ArrowLeft, MapPinOff } from 'lucide-react'
import Button from '../components/common/Button'
import Logo from '../components/navigation/Logo'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <Logo showTagline />
      <span className="mt-12 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-brand-300 ring-1 ring-inset ring-white/10">
        <MapPinOff className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-slate-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
        This route went off the map.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        The page you asked for does not exist. Try the dashboard, or track a parcel instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/" variant="accent" icon={ArrowLeft}>
          Back to home
        </Button>
        <Button as={Link} to="/track" variant="inverse">
          Track a parcel
        </Button>
      </div>
    </div>
  )
}
