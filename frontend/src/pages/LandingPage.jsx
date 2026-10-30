import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  FileClock,
  KeyRound,
  MapPinned,
  PackageSearch,
  ScanBarcode,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
} from 'lucide-react'
import { animate, createTimeline, stagger, utils } from 'animejs'
import Button from '../components/common/Button'
import Logo from '../components/navigation/Logo'
import AnimatedNumber from '../components/animations/AnimatedNumber'
import RouteConsole from '../components/landing/RouteConsole'
import VanMark from '../components/graphics/VanMark'
import { useReveal } from '../hooks/useReveal'
import { prefersReducedMotion, useReducedMotion } from '../hooks/useReducedMotion'

const NAV = [
  { label: 'How it works', href: '#how' },
  { label: 'Platform', href: '#platform' },
  { label: 'Roles', href: '#roles' },
]

const STATS = [
  { value: 7, label: 'Lifecycle states', hint: 'Created to delivered, nothing skipped' },
  { value: 3, label: 'Workspaces', hint: 'Customer, driver, administrator' },
  { value: 100, suffix: '%', label: 'Server-enforced rules', hint: 'The browser is never the boundary' },
  { value: 0, label: 'Database calls from the browser', hint: 'Every query goes through the API' },
]

const STEPS = [
  {
    icon: PackageSearch,
    title: 'Book the shipment',
    body: 'Receiver, weight and both addresses. A tracking number is issued the moment the record is committed.',
  },
  {
    icon: Truck,
    title: 'Dispatch to a driver',
    body: 'An administrator assigns the parcel. The driver only ever sees the queue that belongs to them.',
  },
  {
    icon: MapPinned,
    title: 'Deliver with proof',
    body: 'Every status change writes a tracking log inside the same transaction, so a parcel cannot skip a step.',
  },
]

const FEATURES = [
  {
    icon: Users,
    title: 'Role-scoped access',
    body: 'Customers read their own parcels, drivers read their assignments, administrators read the fleet. Enforced in FastAPI dependencies, not in the UI.',
  },
  {
    icon: FileClock,
    title: 'Transactional history',
    body: 'Status updates and tracking logs commit together. A failed write leaves neither a silent status nor an orphaned scan.',
  },
  {
    icon: KeyRound,
    title: 'Argon2id credentials',
    body: 'Salted Argon2id hashes, short-lived JWTs, and rate-limited sign-in. No secret ever ships inside the bundle.',
  },
  {
    icon: ShieldCheck,
    title: 'Validated at the edge',
    body: 'Pydantic schemas and service-layer rules reject malformed payloads before SQLAlchemy touches MySQL.',
  },
  {
    icon: ScanBarcode,
    title: 'Sanitised public tracking',
    body: 'A tracking number returns the timeline and nothing else — no accounts, no addresses, no internal identifiers.',
  },
  {
    icon: DatabaseZap,
    title: 'Reports from SQL',
    body: 'Volume by status, route throughput and on-time rates come from aggregate queries, not from client-side guesswork.',
  },
]

const ROLES = [
  {
    index: '01',
    icon: PackageSearch,
    name: 'Customer',
    line: 'Books and follows parcels',
    points: ['Create shipments in seconds', 'Follow sent and received parcels', 'Cancel before pickup'],
  },
  {
    index: '02',
    icon: Truck,
    name: 'Driver',
    line: 'Moves parcels, not admin',
    points: ['See only assigned deliveries', 'Update status at each checkpoint', 'Flag delivery exceptions'],
  },
  {
    index: '03',
    icon: UserCog,
    name: 'Administrator',
    line: 'Runs the operation',
    points: ['Manage accounts and drivers', 'Assign and reassign deliveries', 'Read operational reports'],
  },
]

const TICKER = [
  'CPT-88214',
  'CREATED',
  'PICKED UP',
  'CPT-44190',
  'IN TRANSIT',
  'OUT FOR DELIVERY',
  'CPT-70932',
  'DELIVERED',
  'CPT-31558',
  'FAILED ATTEMPT',
  'CPT-66207',
  'RESCHEDULED',
]

export default function LandingPage() {
  const reduced = useReducedMotion()
  const pageRef = useRef(null)
  const introRef = useRef(null)
  const [intro, setIntro] = useState(() => !prefersReducedMotion())

  const howRef = useReveal({ staggerMs: 90 })
  const platformRef = useReveal({ staggerMs: 60 })
  const rolesRef = useReveal({ staggerMs: 110 })

  // Opening sequence: van arrives, caption settles, curtain lifts. This runs
  // before paint so the overlay never flashes its final state first.
  useLayoutEffect(() => {
    if (!intro) return undefined
    const root = introRef.current
    if (!root) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const brand = root.querySelector('[data-intro="brand"]')
    const van = root.querySelector('[data-intro="van"]')
    const caption = root.querySelector('[data-intro="caption"]')
    const bar = root.querySelector('[data-intro="bar"]')

    let finished = false
    let safety = null

    const finish = () => {
      if (finished) return
      finished = true
      if (safety) window.clearTimeout(safety)
      document.body.style.overflow = previousOverflow
      setIntro(false)
    }

    // Failsafe: never trap a visitor behind the curtain.
    safety = window.setTimeout(finish, 2400)

    utils.set([brand, caption], { opacity: 0 })
    if (bar) utils.set(bar, { scaleX: 0 })
    if (van) utils.set(van, { translateX: '-140%' })

    const timeline = createTimeline({ defaults: { ease: 'outExpo' }, onComplete: finish })
    timeline
      .add(brand, { opacity: [0, 1], translateY: [10, 0], duration: 380 }, 0)
      .add(van, { translateX: ['-140%', '0%'], duration: 640, ease: 'outQuint' }, 80)
      .add(bar, { scaleX: [0, 1], duration: 560, ease: 'inOutQuart' }, 200)
      .add(caption, { opacity: [0, 1], translateY: [8, 0], duration: 340 }, 380)
      .add(root, { translateY: ['0%', '-100%'], duration: 540, ease: 'inOutQuart' }, 900)

    const skip = () => {
      timeline.pause()
      animate(root, { opacity: [1, 0], duration: 180, onComplete: finish })
    }
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })

    return () => {
      if (safety) window.clearTimeout(safety)
      document.body.style.overflow = previousOverflow
      timeline.pause()
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [intro])

  // Put the hero in its starting state before the first paint, whether or not
  // the curtain is still covering the page.
  useLayoutEffect(() => {
    const root = pageRef.current
    if (!root) return undefined
    const items = Array.from(root.querySelectorAll('[data-hero]'))
    const lines = Array.from(root.querySelectorAll('[data-hero-line]'))
    if (items.length === 0) return undefined

    if (prefersReducedMotion()) {
      utils.set(items, { opacity: 1, translateY: 0 })
      utils.set(lines, { translateY: '0%' })
      return undefined
    }

    utils.set(items, { opacity: 0, translateY: 26 })
    utils.set(lines, { translateY: '115%' })
    return undefined
  }, [])

  // Hero entrance, played once the curtain is out of the way.
  useEffect(() => {
    if (intro || reduced) return undefined
    const root = pageRef.current
    if (!root) return undefined
    const pick = (selector) => root.querySelector(selector)
    const lines = root.querySelectorAll('[data-hero-line]')

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } })
    timeline
      .add(pick('[data-hero="eyebrow"]'), { opacity: [0, 1], translateY: [16, 0], duration: 520 }, 0)
      .add(pick('[data-hero="title"]'), { opacity: [0, 1], translateY: [26, 0], duration: 560 }, 60)
      .add(lines, { translateY: ['115%', '0%'], duration: 900, delay: stagger(85) }, 100)
      .add(pick('[data-hero="lead"]'), { opacity: [0, 1], translateY: [22, 0], duration: 700 }, 340)
      .add(pick('[data-hero="actions"]'), { opacity: [0, 1], translateY: [18, 0], duration: 650 }, 470)
      .add(pick('[data-hero="meta"]'), { opacity: [0, 1], translateY: [14, 0], duration: 600 }, 590)
      .add(pick('[data-hero="board"]'), { opacity: [0, 1], translateY: [30, 0], duration: 900 }, 260)

    return () => timeline.pause()
  }, [intro, reduced])

  return (
    <div ref={pageRef} className="on-paper relative min-h-screen overflow-x-clip bg-paper text-char">
      {intro ? (
        <div
          ref={introRef}
          aria-hidden="true"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-paper-50 px-6"
        >
          <div className="w-full max-w-3xl">
            <div data-intro="brand" className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.34em] text-char">
                Courier
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-clay-400">
                Dispatch
              </span>
            </div>

            <div className="relative mt-10 h-24">
              <div className="absolute inset-x-0 bottom-2 h-px bg-char/15" />
              <div className="absolute inset-x-0 bottom-2 flex gap-4 animate-road-dash motion-reduce:animate-none">
                {Array.from({ length: 40 }).map((_, index) => (
                  <span key={index} className="h-0.5 w-4 shrink-0 rounded-full bg-char/20" />
                ))}
              </div>
              <div data-intro="van" className="absolute bottom-3 left-0 h-14 w-24 text-char">
                <VanMark tone="ink" spin className="h-full w-full" />
              </div>
            </div>

            <div
              data-intro="bar"
              className="mt-6 h-[2px] w-full origin-left bg-gold-500"
            />

            <p
              data-intro="caption"
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-clay-500"
            >
              Loading the network
            </p>
          </div>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(75%_65%_at_50%_-10%,rgba(176,133,47,0.15),transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-grid-paper bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]"
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo tone="light" showTagline taglineClassName="hidden sm:block" />
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Landing navigation">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="paper-link">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-char transition-colors hover:text-gold-700 sm:text-sm"
          >
            Sign in
          </Link>
          <Button as={Link} to="/register" variant="gold" size="sm" className="group">
            Get started
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-6xl gap-14 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-14">
          <div>
            <p
              data-hero="eyebrow"
              className="inline-flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-clay-500"
            >
              <span className="h-1.5 w-1.5 bg-gold-500" />
              Courier operations platform
            </p>

            <h1
              data-hero="title"
              className="mt-6 text-[clamp(2.5rem,6.4vw,4.5rem)] font-extrabold leading-[0.96] tracking-[-0.045em]"
            >
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block">
                  Every parcel.
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <span data-hero-line className="block text-gold-600">
                  Every mile.
                </span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span
                  data-hero-line
                  className="block text-transparent"
                  style={{ WebkitTextStroke: '1.5px rgba(14,26,46,0.72)' }}
                >
                  Accounted for.
                </span>
              </span>
            </h1>

            <p data-hero="lead" className="mt-7 max-w-lg text-[17px] leading-relaxed text-clay-600">
              A courier management system for desks that move hundreds of parcels a day: book, dispatch
              and deliver, with every scan written to an auditable timeline and every permission
              enforced on the server.
            </p>

            <div data-hero="actions" className="mt-9 flex flex-wrap items-center gap-3">
              <Button as={Link} to="/register" variant="gold" size="lg" className="group">
                Create an account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Button>
              <Button as={Link} to="/login" variant="outline" size="lg">
                Sign in
              </Button>
              <a
                href="#how"
                className="group ml-1 inline-flex items-center gap-1.5 text-sm font-semibold text-clay-600 transition-colors hover:text-char"
              >
                See how it works
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </div>

            <ul data-hero="meta" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-clay-500">
              {['Argon2id credentials', 'Transactional history', 'No browser database access'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-gold-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div data-hero="board">
            <RouteConsole />
          </div>
        </section>

        <div className="relative overflow-hidden border-y border-char/10 bg-char text-paper">
          <div className="flex w-max animate-marquee items-center py-3.5 motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-8 whitespace-nowrap pr-8 font-mono text-[10px] uppercase tracking-[0.26em]"
                aria-hidden={copy === 1 ? 'true' : undefined}
              >
                {TICKER.map((item, index) => (
                  <span key={`${copy}-${item}-${index}`} className="flex items-center gap-8">
                    <span className={index % 4 === 0 ? 'text-gold-300' : 'text-paper/70'}>{item}</span>
                    <span className="h-1 w-1 rounded-full bg-paper/25" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section aria-label="Platform facts" className="border-b border-char/10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-char/10 px-5 sm:px-8 lg:grid-cols-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className={`py-9 ${index < 2 ? 'border-b border-char/10 lg:border-b-0' : ''} ${
                  index % 2 === 1 ? 'pl-6 lg:pl-8' : 'pr-4 lg:pr-8'
                }`}
              >
                <p className="text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl">
                  <AnimatedNumber
                    value={stat.value}
                    animateOnView
                    format={(current) => `${Math.round(current)}${stat.suffix || ''}`}
                  />
                </p>
                <p className="mt-3 text-[13px] font-semibold leading-snug text-char">{stat.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-clay-500">{stat.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-24 border-b border-char/10 px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="paper-label">How it works</p>
              <h2 className="mt-4 max-w-sm text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                Three moves.
                <br />
                One timeline.
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-clay-600">
                The lifecycle is a state machine, not a free-text field. Parcels move forward through
                defined transitions, and each one is recorded with a location, a remark and a timestamp.
              </p>
            </div>

            <ol ref={howRef} className="relative">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                return (
                  <li
                    key={step.title}
                    data-reveal
                    className="group relative flex gap-5 border-t border-char/10 py-8 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-char/15 bg-paper-50 text-char transition-colors duration-300 group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-paper-50">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-clay-400">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-clay-600">{step.body}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="paper-label">Platform</p>
                <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                  The guarantees are the product.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-clay-600">
                Nice screens are cheap. Permissions, validation and an intact audit trail are what make
                a courier system trustworthy.
              </p>
            </div>

            <div ref={platformRef} className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-char/10 bg-char/10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    data-reveal
                    className="group relative bg-paper p-7 transition-colors duration-300 hover:bg-paper-50"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-char/10 bg-paper-50 text-char transition-colors duration-300 group-hover:border-gold-500/40 group-hover:text-gold-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-bold tracking-tight">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-clay-600">{feature.body}</p>
                    <span className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-gold-500 transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="roles" className="scroll-mt-24 bg-char px-5 py-20 text-paper sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-300">
                  Roles
                </p>
                <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                  Three accounts.
                  <br />
                  Three different truths.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-paper/60">
                Every request is scoped by the signed-in user. A customer never receives another
                customer's parcel, even with a hand-crafted request.
              </p>
            </div>

            <div ref={rolesRef} className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-paper/15 bg-paper/15 lg:grid-cols-3">
              {ROLES.map((role) => {
                const Icon = role.icon
                return (
                  <div key={role.name} data-reveal className="bg-char p-7">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-paper/15 text-gold-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/35">
                        {role.index}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold tracking-tight">{role.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-paper/40">{role.line}</p>
                    <ul className="mt-5 space-y-2.5">
                      {role.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm text-paper/70">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid-paper bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
          />
          <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="paper-label">Start here</p>
              <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                Ready to move the
                <span className="text-gold-500"> first parcel?</span>
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-clay-600">
                Create a customer account, or sign in if an operator already set one up for you.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button as={Link} to="/register" variant="gold" size="lg" className="group">
                Create an account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Button>
              <Button as={Link} to="/login" variant="outline" size="lg">
                Sign in
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-char/10 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo tone="light" />
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 text-sm text-clay-600">
            <a href="#how" className="paper-link">
              How it works
            </a>
            <a href="#platform" className="paper-link">
              Platform
            </a>
            <Link to="/login" className="paper-link">
              Sign in
            </Link>
            <Link to="/register" className="paper-link">
              Register
            </Link>
          </nav>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-clay-400">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            React · FastAPI · MySQL
          </p>
        </div>
      </footer>
    </div>
  )
}
