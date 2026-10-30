import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TrackingTimeline from '../src/components/tracking/TrackingTimeline'

const EVENTS = [
  {
    log_id: 1,
    status: 'CREATED',
    location: 'Bengaluru',
    remarks: 'Shipment registered',
    updated_at: '2026-10-01T09:00:00',
  },
  {
    log_id: 2,
    status: 'PICKED_UP',
    location: 'Bengaluru',
    remarks: null,
    updated_at: '2026-10-02T09:00:00',
  },
]

describe('TrackingTimeline', () => {
  it('renders each scan in order and marks the latest one', () => {
    render(<TrackingTimeline events={EVENTS} status="PICKED_UP" />)
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Picked up')).toBeInTheDocument()
    expect(screen.getByText('Shipment registered')).toBeInTheDocument()
    expect(screen.getAllByText('Latest scan')).toHaveLength(1)
    expect(screen.getAllByText(/Bengaluru/)).toHaveLength(2)
  })

  it('shows an empty state when there are no events', () => {
    render(<TrackingTimeline events={[]} status="CREATED" />)
    expect(screen.getByText('No scans yet')).toBeInTheDocument()
  })

  it('reflects completion in the progress summary', () => {
    render(
      <TrackingTimeline
        events={[
          ...EVENTS,
          {
            log_id: 3,
            status: 'DELIVERED',
            location: 'Kolkata',
            remarks: 'Delivered',
            updated_at: '2026-10-04T12:00:00',
          },
        ]}
        status="DELIVERED"
      />,
    )
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
