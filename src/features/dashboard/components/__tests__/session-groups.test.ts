import { afterAll, describe, expect, it } from 'vite-plus/test'
import type { RecentSession } from '@/lib/schemas/stats.schema'
import { dayLabel, groupSessions, localDayKey, sessionsAriaLabel } from '../session-groups'

/** Minimal session factory — only the fields the grouping reads. */
function session(over: Partial<RecentSession> & { startTime: string }): RecentSession {
  return {
    sessionId: '00000000-0000-4000-8000-000000000001',
    sessionUuid: '00000000-0000-4000-8000-000000000002',
    projectName: 'proj',
    language: 'TypeScript',
    endTime: over.startTime,
    durationSeconds: 60,
    ...over,
  }
}

/**
 * Build a Date at a fixed local wall-clock time. The tests assert LOCAL-day
 * behaviour, so constructing from local components (not a UTC string) keeps
 * them meaningful in any machine timezone.
 */
function localDate(y: number, m: number, d: number, hh = 0, mm = 0): Date {
  return new Date(y, m - 1, d, hh, mm)
}

/**
 * Pin the zone for this file.
 *
 * The whole point of `localDayKey` is that it disagrees with the UTC date near
 * midnight — but that disagreement is invisible on a UTC runner (CI is UTC), so a
 * regression to `toISOString().slice(0, 10)` would still pass. Forcing a real
 * offset makes the assertions below able to fail. Set before any Date is built.
 */
const ORIGINAL_TZ = process.env.TZ
process.env.TZ = 'Asia/Shanghai'
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ
})

describe('localDayKey', () => {
  it('keys by local day, which can differ from the UTC day', () => {
    // 2026-09-08T20:00Z is 2026-09-09 04:00 at UTC+8. The UTC date prefix and the
    // local day MUST differ here, or this file is not testing the shift at all.
    const utcEvening = new Date('2026-09-08T20:00:00Z')

    expect(localDayKey(utcEvening)).toBe('2026-09-09')
    expect(localDayKey(utcEvening)).not.toBe('2026-09-08')
    expect(utcEvening.toISOString().slice(0, 10)).toBe('2026-09-08')
  })
})

describe('groupSessions', () => {
  it('groups a UTC-evening session under the next local day', () => {
    // The literal expectation is the whole assertion: deriving it from
    // `localDayKey` (the function under test) could never fail.
    const groups = groupSessions([session({ startTime: '2026-09-08T20:00:00Z' })], localDate(2026, 9, 20))

    expect(groups).toHaveLength(1)
    expect(groups[0]!.key).toBe('2026-09-09')
    expect(groups[0]!.rows[0]!.time).toBe('04:00')
  })

  it('drops a session whose startTime cannot be parsed', () => {
    // The schema types startTime as a plain string, so this value is reachable;
    // without the guard it produced a group labelled "Invalid Date NaN".
    const groups = groupSessions(
      [session({ startTime: 'not-a-date', projectName: 'broken' }), session({ startTime: '2026-09-09T10:00:00Z' })],
      localDate(2026, 9, 20),
    )

    expect(groups.flatMap((g) => g.rows.map((r) => r.projectName))).toEqual(['proj'])
    expect(groups.every((g) => !/NaN|Invalid/.test(g.label))).toBe(true)
  })

  it('orders sessions newest first, and ties deterministically', () => {
    const sameInstant = '2026-09-09T10:00:00Z'
    const groups = groupSessions(
      [
        session({ startTime: sameInstant, projectName: 'zebra', language: 'Go' }),
        session({ startTime: '2026-09-09T12:00:00Z', projectName: 'newer' }),
        session({ startTime: sameInstant, projectName: 'apple', language: 'Rust' }),
      ],
      localDate(2026, 9, 20),
    )

    const names = groups[0]!.rows.map((r) => r.projectName)
    expect(names).toEqual(['newer', 'apple', 'zebra'])
  })

  it('is stable regardless of input order', () => {
    const input = [
      session({ startTime: '2026-09-09T10:00:00Z', projectName: 'b' }),
      session({ startTime: '2026-09-09T10:00:00Z', projectName: 'a' }),
      session({ startTime: '2026-09-09T09:00:00Z', projectName: 'c' }),
    ]
    const forward = groupSessions(input, localDate(2026, 9, 20))
    const reversed = groupSessions([...input].reverse(), localDate(2026, 9, 20))

    expect(forward.map((g) => g.rows.map((r) => r.projectName))).toEqual(
      reversed.map((g) => g.rows.map((r) => r.projectName)),
    )
  })

  it('totally orders rows that match on every field but the id', () => {
    // Same instant, project and language: without the sessionId tiebreak these
    // fall back to the server's row order, which is what the order must not do.
    const identical = { startTime: '2026-09-09T10:00:00Z', projectName: 'same', language: 'Go' }
    const rows = groupSessions(
      [
        session({ ...identical, sessionId: '00000000-0000-4000-8000-0000000000ff' }),
        session({ ...identical, sessionId: '00000000-0000-4000-8000-0000000000aa' }),
        session({ ...identical, sessionId: '00000000-0000-4000-8000-0000000000dd' }),
      ],
      localDate(2026, 9, 20),
    )[0]!.rows

    expect(rows.map((r) => r.id)).toEqual([
      '00000000-0000-4000-8000-0000000000aa',
      '00000000-0000-4000-8000-0000000000dd',
      '00000000-0000-4000-8000-0000000000ff',
    ])
  })

  it('splits sessions across local days, newest day first', () => {
    const now = localDate(2026, 9, 20, 12, 0)
    const groups = groupSessions(
      [
        session({ startTime: localDate(2026, 9, 18, 9, 0).toISOString(), projectName: 'old' }),
        session({ startTime: localDate(2026, 9, 20, 8, 0).toISOString(), projectName: 'today' }),
        session({ startTime: localDate(2026, 9, 19, 8, 0).toISOString(), projectName: 'yesterday' }),
      ],
      now,
    )

    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Sep 18'])
    expect(groups.map((g) => g.rows[0]!.projectName)).toEqual(['today', 'yesterday', 'old'])
  })

  it('renders each row with a local HH:mm and keeps the raw seconds', () => {
    const groups = groupSessions(
      [session({ startTime: localDate(2026, 9, 20, 7, 5).toISOString(), durationSeconds: 144_000 })],
      localDate(2026, 9, 20),
    )
    expect(groups[0]!.rows[0]!.time).toBe('07:05')
    expect(groups[0]!.rows[0]!.durationSeconds).toBe(144_000)
  })

  it('returns nothing for no sessions', () => {
    expect(groupSessions([], localDate(2026, 9, 20))).toEqual([])
  })
})

describe('dayLabel', () => {
  const now = localDate(2026, 9, 20)

  it('names today and yesterday', () => {
    expect(dayLabel(localDate(2026, 9, 20), now)).toBe('Today')
    expect(dayLabel(localDate(2026, 9, 19), now)).toBe('Yesterday')
  })

  it('uses a dated label beyond yesterday, adding the year when it differs', () => {
    expect(dayLabel(localDate(2026, 9, 18), now)).toBe('Sep 18')
    expect(dayLabel(localDate(2025, 12, 31), now)).toContain('2025')
  })
})

describe('sessionsAriaLabel', () => {
  it('summarises counts and names, and never a duration total', () => {
    const label = sessionsAriaLabel(
      groupSessions(
        [session({ startTime: localDate(2026, 9, 20, 7, 5).toISOString(), projectName: 'ctt-web' })],
        localDate(2026, 9, 20),
      ),
    )
    expect(label).toContain('1 across 1 day')
    expect(label).toContain('ctt-web')
    expect(label).not.toMatch(/total/i)
  })

  it('handles the empty case', () => {
    expect(sessionsAriaLabel([])).toBe('Recent coding sessions: none')
  })
})
