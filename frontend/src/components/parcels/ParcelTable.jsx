import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import { formatRelative, formatWeight } from '../../utils/format'
import { cityOf } from '../../utils/address'

export default function ParcelTable({ parcels = [] }) {
  return (
    // `relative` matters: the header's sr-only label is absolutely positioned and
    // would otherwise position against the page and widen the document on phones.
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
            <th scope="col" className="px-5 py-3 font-semibold">Tracking</th>
            <th scope="col" className="px-5 py-3 font-semibold">Route</th>
            <th scope="col" className="px-5 py-3 font-semibold">Receiver</th>
            <th scope="col" className="px-5 py-3 font-semibold">Weight</th>
            <th scope="col" className="px-5 py-3 font-semibold">Status</th>
            <th scope="col" className="px-5 py-3 font-semibold">Updated</th>
            <th scope="col" className="px-5 py-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {parcels.map((parcel) => (
            <tr key={parcel.tracking_number} className="group transition hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-5 py-4">
                <Link
                  to={`/parcels/${parcel.tracking_number}`}
                  className="font-mono text-xs font-semibold text-ink-900 underline-offset-4 hover:text-accent hover:underline"
                >
                  {parcel.tracking_number}
                </Link>
              </td>
              <td className="px-5 py-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  {cityOf(parcel.pickup_address)}
                  <ArrowRight className="h-3 w-3 text-slate-300" aria-hidden="true" />
                  {cityOf(parcel.delivery_address)}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4">
                <span className="text-xs font-medium text-ink-900">{parcel.receiver?.name}</span>
                {parcel.driver ? (
                  <span className="block text-[11px] text-slate-400">
                    Driver: {parcel.driver.name}
                  </span>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                {formatWeight(parcel.weight)}
              </td>
              <td className="whitespace-nowrap px-5 py-4">
                <StatusBadge status={parcel.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                {formatRelative(parcel.updated_at)}
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  to={`/parcels/${parcel.tracking_number}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Open shipment ${parcel.tracking_number}`}
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
