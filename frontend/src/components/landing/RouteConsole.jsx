import { useEffect, useRef } from 'react'
import { createTimeline, stagger, utils } from 'animejs'
import VanMark from '../graphics/VanMark'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const ROUTE = 'M 40 208 C 104 212 118 152 196 138 C 270 124 302 96 392 66'

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 26
const ON_TIME = 0.982

const HUBS = [
  { x: 40, y: 208, label: 'PICKUP', meta: '09:12', anchor: 'start', labelX: 34, labelY: 230, metaY: 241 },
  { x: 196, y: 138, label: 'HUB 04', meta: '11:38', anchor: 'middle', labelX: 196, labelY: 114, metaY: 125 },
  { x: 392, y: 66, label: 'DELIVERY', meta: 'ETA 14:20', anchor: 'end', labelX: 404, labelY: 90, metaY: 101 },
]

const SCANS = [
  { time: '14:20', status: 'Out for delivery', place: 'Sector 12' },
  { time: '11:38', status: 'Arrived hub 04', place: 'Mysuru' },
  { time: '09:12', status: 'Picked up', place: 'Vijayanagar' },
]

const VOLUME = [38, 62, 44, 79, 55, 88, 71]

/**
 * Hero graphic: an operations console. A topographic route map sits on top of a
 * telemetry rail (on-time gauge, scan feed, weekly volume). Anime.js draws the
 * route, the gauge and the volume bars once; the van and flowing dashes are CSS
 * so they never run JavaScript per frame.
 */
export default function RouteConsole() {
  const reduced = useReducedMotion()
  const wrapRef = useRef(null)
  const routeRef = useRef(null)
  const gaugeRef = useRef(null)

  useEffect(() => {
    const path = routeRef.current
    const gauge = gaugeRef.current
    const bars = wrapRef.current ? Array.from(wrapRef.current.querySelectorAll('[data-bar]')) : []
    const finalOffset = GAUGE_CIRCUMFERENCE * (1 - ON_TIME)

    if (reduced) {
      if (path) utils.set(path, { strokeDashoffset: 0 })
      if (gauge) utils.set(gauge, { strokeDashoffset: finalOffset })
      if (bars.length) utils.set(bars, { scaleY: 1 })
      return undefined
    }

    const timeline = createTimeline({ defaults: { ease: 'outExpo' } })
    if (path) timeline.add(path, { strokeDashoffset: [1, 0], duration: 1700, ease: 'inOutQuart' }, 220)
    if (gauge) timeline.add(gauge, { strokeDashoffset: [GAUGE_CIRCUMFERENCE, finalOffset], duration: 1300 }, 400)
    if (bars.length) timeline.add(bars, { scaleY: [0, 1], duration: 640, delay: stagger(55) }, 320)
    return () => timeline.pause()
  }, [reduced])

  return (
    <div ref={wrapRef} className="relative">
      <div className="absolute inset-x-5 -bottom-4 top-10 rounded-[30px] bg-char/[0.07]" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-[24px] border border-console-600 bg-console shadow-console">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-paper">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-node-pulse motion-reduce:animate-none" />
            Network · live
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/45">CPT-88214</span>
        </div>

        <svg
          viewBox="0 0 440 270"
          className="block h-auto w-full"
          role="img"
          aria-label="Topographic route map: a shipment travelling from pickup through hub 04 to delivery"
        >
          <defs>
            <linearGradient id="rc-line" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#E3C079" />
              <stop offset="100%" stopColor="#C99A43" />
            </linearGradient>
            <radialGradient id="rc-glow" cx="44%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#1D3A63" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B1424" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="rc-water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#17365C" />
              <stop offset="100%" stopColor="#0F2440" />
            </linearGradient>
            <pattern id="rc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#33507E" strokeWidth="0.7" strokeOpacity="0.7" />
            </pattern>
            <pattern id="rc-scan" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M0 3.5H4" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.028" />
            </pattern>
            <filter id="rc-soft" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <rect width="440" height="270" fill="#0B1424" />
          <rect width="440" height="270" fill="url(#rc-glow)" />
          <rect width="440" height="270" fill="url(#rc-grid)" />

          {/* Terrain */}
          <path
            d="M0 96C46 80 70 102 102 88C134 74 148 96 180 86C212 76 224 48 262 46C300 44 322 68 356 62C392 56 412 30 440 36V270H0Z"
            fill="#182835"
            stroke="#44607A"
            strokeWidth="1.1"
          />
          <path
            d="M0 96C46 80 70 102 102 88C134 74 148 96 180 86C212 76 224 48 262 46C300 44 322 68 356 62C392 56 412 30 440 36"
            fill="none"
            stroke="#5B7BA8"
            strokeWidth="0.7"
            strokeOpacity="0.6"
          />
          <path
            d="M440 168C392 164 372 184 330 178C288 172 268 142 224 140C186 138 172 158 132 154C96 150 52 164 0 158V270H440Z"
            fill="url(#rc-water)"
            fillOpacity="0.5"
          />

          {/* Contours */}
          <g fill="none" stroke="#2F4870" strokeWidth="0.9">
            <path d="M312 24C356 26 382 48 378 80C374 112 342 128 306 120C270 112 248 86 254 58C260 32 280 23 312 24Z" />
            <path d="M320 42C350 44 366 56 364 76C362 96 342 106 318 102C294 98 278 84 281 66C284 48 298 41 320 42Z" />
            <path d="M326 60C342 61 350 68 349 78C348 88 338 93 326 91C314 89 305 82 306 72C307 63 315 59 326 60Z" />
            <path d="M96 168C140 166 166 186 162 216C158 246 126 262 92 254C58 246 36 222 42 196C48 172 68 169 96 168Z" />
            <path d="M106 186C134 185 148 198 145 216C142 234 124 242 104 237C84 232 71 218 75 202C79 188 90 187 106 186Z" />
            <path d="M112 202C126 202 132 209 131 217C130 225 122 229 112 227C102 225 96 219 97 211C98 204 104 202 112 202Z" />
          </g>

          {/* Road network */}
          <g fill="none" stroke="#3A5786" strokeWidth="1.05" strokeDasharray="1 5" strokeOpacity="0.85">
            <path d="M14 60C88 72 128 38 196 48C264 58 322 22 436 38" />
            <path d="M78 266C108 224 156 214 176 170C196 126 254 138 296 102" />
            <path d="M6 182C64 172 96 140 158 148C220 156 250 188 320 180" />
            <path d="M246 266C270 232 330 232 366 202C398 176 414 128 436 102" />
          </g>

          {/* Towns */}
          <g fill="#6A85A8">
            {[
              [124, 72], [286, 186], [352, 152], [214, 238], [92, 118], [406, 76],
              [168, 96], [254, 210], [60, 56], [318, 30],
            ].map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="2.4" height="2.4" transform={`rotate(45 ${x} ${y})`} />
            ))}
          </g>

          {/* Secondary leg into the network, for depth */}
          <path
            d="M 62 58 C 116 74 150 104 196 138"
            fill="none"
            stroke="#5B7BA8"
            strokeWidth="1.2"
            strokeOpacity="0.4"
            strokeDasharray="1 6"
          />
          <circle cx="62" cy="58" r="6.5" fill="#0B1424" stroke="#4467A2" />
          <circle cx="62" cy="58" r="2" fill="#8FA6C4" />
          <text
            x="62"
            y="78"
            textAnchor="middle"
            fontSize="7"
            letterSpacing="1.3"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill="#6E86A4"
          >
            DEPOT 07
          </text>

          {/* Route: halo, flowing dashes, drawn line */}
          <path
            d={ROUTE}
            fill="none"
            stroke="#C99A43"
            strokeWidth="7"
            strokeOpacity="0.2"
            strokeLinecap="round"
            filter="url(#rc-soft)"
          />
          <path
            d={ROUTE}
            fill="none"
            stroke="#C9BFA6"
            strokeWidth="1.15"
            strokeDasharray="2 6"
            className="animate-dash-travel motion-reduce:animate-none"
          />
          <path
            ref={routeRef}
            d={ROUTE}
            fill="none"
            stroke="url(#rc-line)"
            strokeWidth="2.6"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
          />

          {HUBS.map((hub) => (
            <g key={hub.label}>
              <circle cx={hub.x} cy={hub.y} r="10" fill="#0B1424" stroke="#4467A2" />
              <circle cx={hub.x} cy={hub.y} r="3.4" fill="#DDB367" />
              <text
                x={hub.labelX}
                y={hub.labelY}
                textAnchor={hub.anchor}
                fontSize="7.6"
                letterSpacing="1.5"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill="#A8BCD4"
              >
                {hub.label}
              </text>
              <text
                x={hub.labelX}
                y={hub.metaY}
                textAnchor={hub.anchor}
                fontSize="7.2"
                letterSpacing="0.9"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill="#6E86A4"
              >
                {hub.meta}
              </text>
            </g>
          ))}

          <circle
            cx="196"
            cy="138"
            r="11"
            fill="none"
            stroke="#DDB367"
            strokeWidth="1.2"
            className="animate-node-pulse [transform-box:fill-box] [transform-origin:center] motion-reduce:hidden"
          />

          {/* The van follows the route path itself */}
          <g
            className="animate-trip-run motion-reduce:hidden"
            style={{ offsetPath: `path("${ROUTE}")`, offsetRotate: 'auto' }}
          >
            <g transform="translate(-12 -6)">
              <VanMark tone="paper" width={24} height={12} />
            </g>
          </g>

          <rect width="440" height="270" fill="url(#rc-scan)" />

          {/* Cartographic furniture */}
          <text
            x="14"
            y="20"
            fontSize="7"
            letterSpacing="1.4"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill="#5D7898"
          >
            12.97N / 77.59E
          </text>
          <g transform="translate(414 20)" stroke="#5D7898" strokeWidth="0.9" fill="none">
            <path d="M0 -7 L3 4 L0 2 L-3 4 Z" fill="#5D7898" stroke="none" />
            <text
              y="-10"
              textAnchor="middle"
              fontSize="6.4"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill="#5D7898"
              stroke="none"
            >
              N
            </text>
          </g>
          <g transform="translate(14 258)" stroke="#5D7898" strokeWidth="1">
            <path d="M0 0 H40" />
            <path d="M0 -3 V3 M40 -3 V3" />
          </g>
          <text
            x="58"
            y="260"
            fontSize="6.4"
            letterSpacing="1.1"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill="#5D7898"
          >
            50 KM
          </text>
        </svg>

        {/* Telemetry rail */}
        <div className="grid grid-cols-1 divide-y divide-white/[0.07] border-t border-white/[0.07] sm:grid-cols-[1.05fr_1.15fr_0.8fr] sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/45">On-time</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/30">30d</span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <svg viewBox="0 0 64 64" className="h-[52px] w-[52px] shrink-0" aria-hidden="true">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="4" />
                <circle
                  ref={gaugeRef}
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#DDB367"
                  strokeWidth="4"
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                  strokeDasharray={GAUGE_CIRCUMFERENCE}
                  strokeDashoffset={GAUGE_CIRCUMFERENCE}
                />
              </svg>
              <div>
                <p className="font-mono text-[22px] font-semibold leading-none tracking-tight text-paper">98.2%</p>
                <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.13em] text-paper/40">In window</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/45">Scan feed</span>
            <ul className="mt-2.5 space-y-2.5">
              {SCANS.map((scan) => (
                <li key={scan.time} className="flex items-start gap-2">
                  <span className="mt-[3px] font-mono text-[8.5px] tabular-nums text-paper/35">{scan.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold leading-tight text-paper/90">
                      {scan.status}
                    </span>
                    <span className="block truncate font-mono text-[8.5px] uppercase tracking-[0.13em] text-paper/35">
                      {scan.place}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/45">Volume</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/30">7d</span>
            </div>
            <div className="mt-2.5 flex h-11 items-end gap-1.5" aria-hidden="true">
              {VOLUME.map((height, index) => (
                <span
                  key={index}
                  data-bar
                  className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-gold-700/50 to-gold-400"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-paper/40">
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-gold-400" />
              Route
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-paper/40" />
              Hub
            </span>
          </span>
          <span className="text-paper/70">4 scans · 2h ago</span>
        </div>
      </div>

    </div>
  )
}
