import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS, PARCEL_STATUS } from '../../utils/constants'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const meta = PARCEL_STATUS[item.name]
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lift">
      <p className="flex items-center gap-2 text-xs font-semibold text-ink-900">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.payload.fill }}
          aria-hidden="true"
        />
        {meta?.label || item.name}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {item.value} shipment{item.value === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export default function StatusChart({ breakdown = [] }) {
  const data = breakdown
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: item.status,
      value: item.count,
      fill: CHART_COLORS[item.status] || '#cbd5e1',
    }))
  const total = breakdown.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
        <div className="h-28 w-28 rounded-full border-[10px] border-slate-100" />
        <p className="text-xs text-slate-400">No shipments to chart yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink-900">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total
          </span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-2 sm:grid-cols-1">
        {breakdown.map((item) => (
          <li key={item.status} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CHART_COLORS[item.status] }}
                aria-hidden="true"
              />
              {PARCEL_STATUS[item.status]?.label || item.status}
            </span>
            <span className="font-semibold text-ink-900">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
