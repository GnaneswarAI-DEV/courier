import { describe, expect, it } from 'vitest'
import { formatDate, formatWeight, initials, parseApiDate } from '../src/utils/format'
import { cityOf } from '../src/utils/address'

describe('parseApiDate', () => {
  it('treats naive API timestamps as UTC', () => {
    expect(parseApiDate('2026-10-28T10:30:00').toISOString()).toBe('2026-10-28T10:30:00.000Z')
  })

  it('keeps explicit offsets untouched', () => {
    expect(parseApiDate('2026-10-28T10:30:00+05:30').toISOString()).toBe('2026-10-28T05:00:00.000Z')
  })

  it('parses date-only values as local calendar dates', () => {
    const date = parseApiDate('2026-10-28')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(28)
  })

  it('returns null for missing or invalid input', () => {
    expect(parseApiDate(null)).toBeNull()
    expect(parseApiDate('not-a-date')).toBeNull()
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('polling helpers', () => {
  it('formats weights with two decimals at most', () => {
    expect(formatWeight(2.5)).toBe('2.5 kg')
    expect(formatWeight(7.75)).toBe('7.75 kg')
    expect(formatWeight('nope')).toBe('—')
  })

  it('builds initials from the first two names', () => {
    expect(initials('Asha Verma')).toBe('AV')
    expect(initials('madonna')).toBe('M')
    expect(initials('')).toBe('')
  })

  it('extracts the city the same way the backend does', () => {
    expect(cityOf('12 MG Road, Bengaluru, Karnataka 560001')).toBe('Bengaluru')
    expect(cityOf('12 MG Road, Bengaluru')).toBe('Bengaluru')
    expect(cityOf('Remote Village')).toBe('Remote Village')
  })
})
