import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from '../src/components/common/StatusBadge'
import { PARCEL_STATUS } from '../src/utils/constants'

describe('StatusBadge', () => {
  it('renders the human label for a known status', () => {
    render(<StatusBadge status="IN_TRANSIT" />)
    expect(screen.getByText('In transit')).toBeInTheDocument()
  })

  it('renders a distinct label for every lifecycle status', () => {
    Object.entries(PARCEL_STATUS).forEach(([status, meta]) => {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(meta.label)).toBeInTheDocument()
      unmount()
    })
  })

  it('shows the raw value with neutral styling for unknown statuses', () => {
    render(<StatusBadge status="MYSTERY" />)
    expect(screen.getByText('MYSTERY')).toBeInTheDocument()
  })
})
