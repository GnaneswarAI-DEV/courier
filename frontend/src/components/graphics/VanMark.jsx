import { useId } from 'react'

/**
 * Courier van, drawn side-on and facing right.
 *
 * One component serves both places it is used: the ivory-on-navy map marker
 * (`tone="paper"`) and the navy-on-paper intro vehicle (`tone="ink"`). The gold
 * livery band is the same in both so the vehicle is recognisable at any size.
 */
const TONES = {
  ink: {
    body: '#16233F',
    deep: '#0F1A30',
    glass: '#F7F3E9',
    seam: 'rgba(247, 243, 233, 0.4)',
    shadow: 'rgba(20, 25, 43, 0.18)',
    tire: '#0B1220',
    rim: '#CFC7B4',
    headlight: '#F2D79B',
    tail: '#B23A48',
  },
  paper: {
    body: '#F7F3E9',
    deep: '#E2DACA',
    glass: '#0B1424',
    seam: 'rgba(11, 20, 36, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    tire: '#0B1220',
    rim: '#8C94A6',
    headlight: '#F2D79B',
    tail: '#B23A48',
  },
}

export default function VanMark({ tone = 'ink', spin = false, className = '', ...props }) {
  const uid = useId().replace(/:/g, '')
  const c = TONES[tone] || TONES.ink
  const bodyId = `van-body-${uid}`
  const wheelClass = spin
    ? 'animate-wheel-spin [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none'
    : ''

  return (
    <svg viewBox="0 0 128 64" className={className} fill="none" aria-hidden="true" {...props}>
      <defs>
        <clipPath id={bodyId}>
          <path d="M10 10H84Q86 10 86 12V20L98 21L112 31Q117 34 117 39V45Q117 49 113 49H6Q4 49 4 45V14Q4 10 10 10Z" />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="63" cy="58" rx="53" ry="3.4" fill={c.shadow} />

      {/* Shell */}
      <path
        d="M10 10H84Q86 10 86 12V20L98 21L112 31Q117 34 117 39V45Q117 49 113 49H6Q4 49 4 45V14Q4 10 10 10Z"
        fill={c.body}
      />

      {/* Painted details, clipped to the shell */}
      <g clipPath={`url(#${bodyId})`}>
        {/* Weight along the sill */}
        <rect x="4" y="43" width="114" height="7" fill={c.deep} fillOpacity="0.55" />

        {/* Gold livery band */}
        <path d="M4 31H104L114 37V41H4Z" fill="#B0852F" />
        <path d="M4 31H104L114 37" stroke="#DDB367" strokeOpacity="0.65" strokeWidth="0.9" />

        {/* Rear door seam, cargo seam, handles */}
        <path d="M66 11V48" stroke={c.seam} strokeWidth="0.9" />
        <path d="M6 46H114" stroke={c.seam} strokeWidth="0.7" strokeOpacity="0.5" />
        <rect x="58" y="27" width="5" height="1.6" rx="0.8" fill={c.seam} />

        {/* Cab door seam and window */}
        <path d="M89 21V48" stroke={c.seam} strokeWidth="0.9" />
        <path d="M91 23.5H101V33.5H91Z" fill={c.glass} fillOpacity="0.92" />
        <path d="M91 23.5H101" stroke={c.body} strokeOpacity="0.35" strokeWidth="0.7" />

        {/* Windshield */}
        <path d="M103 23L110.5 30.5H103Z" fill={c.glass} fillOpacity="0.92" />
        <path d="M103 23L110.5 30.5" stroke={c.body} strokeOpacity="0.28" strokeWidth="0.8" />

        {/* Wheel arches */}
        <path d="M20 48A10 10 0 0 1 40 48" stroke={c.deep} strokeWidth="1.6" />
        <path d="M87 48A10 10 0 0 1 107 48" stroke={c.deep} strokeWidth="1.6" />
      </g>

      {/* Lights and bumper */}
      <rect x="110" y="34.5" width="6" height="4.2" rx="1.4" fill={c.headlight} />
      <rect x="5.5" y="33" width="3" height="7" rx="1" fill={c.tail} />
      <path d="M105 44.5H115.5Q117 44.5 117 46V48.5H105Z" fill={c.deep} fillOpacity="0.8" />

      {/* Wheels */}
      <g className={wheelClass}>
        <circle cx="30" cy="49" r="8" fill={c.tire} />
        <circle cx="30" cy="49" r="3.7" fill={c.rim} />
        <circle cx="30" cy="49" r="1.2" fill={c.tire} />
        <path d="M30 45.6V52.4M26.6 49H33.4" stroke={c.tire} strokeWidth="1.1" strokeOpacity="0.55" />
      </g>
      <g className={wheelClass}>
        <circle cx="97" cy="49" r="8" fill={c.tire} />
        <circle cx="97" cy="49" r="3.7" fill={c.rim} />
        <circle cx="97" cy="49" r="1.2" fill={c.tire} />
        <path d="M97 45.6V52.4M93.6 49H100.4" stroke={c.tire} strokeWidth="1.1" strokeOpacity="0.55" />
      </g>
    </svg>
  )
}
