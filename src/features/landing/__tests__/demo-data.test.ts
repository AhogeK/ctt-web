import { describe, expect, it } from 'vitest'
import { EXAMPLE_ACTIVITY_WEEKS, EXAMPLE_LANGUAGES, EXAMPLE_SUMMARY_SECONDS, exampleActivityWeeks } from '../demo-data'

/**
 * The example data has one job beyond looking plausible: it must not contradict itself. Two surfaces
 * show these numbers one after the other, so an arithmetic mismatch reads as a defect in the product
 * rather than in the sample — which is exactly how the first version's 90h language list beside a
 * 3148h total was caught.
 */
describe('landing example data', () => {
  it('keeps the lifetime total equal to the language list it sits beside', () => {
    const fromLanguages = EXAMPLE_LANGUAGES.reduce((sum, entry) => sum + entry.seconds, 0)
    expect(EXAMPLE_SUMMARY_SECONDS.total).toBe(fromLanguages)
  })

  it('keeps the trailing week of the activity grid equal to the summary row', () => {
    const weeks = exampleActivityWeeks(new Date('2026-09-30T12:00:00'))
    const days = weeks.flatMap((week) => week.cells).filter((cell) => cell !== null)
    const trailingSeven = days.slice(-7).reduce((sum, cell) => sum + cell.seconds, 0)

    expect(days).toHaveLength(EXAMPLE_ACTIVITY_WEEKS * 7)
    expect(trailingSeven).toBe(EXAMPLE_SUMMARY_SECONDS.thisWeek)
  })

  it('lays the window out as whole columns of seven, Sunday first', () => {
    // 2026-09-30 is a Wednesday, so the trailing column has four painted days and three empty ones.
    const weeks = exampleActivityWeeks(new Date('2026-09-30T12:00:00'))

    for (const week of weeks) expect(week.cells).toHaveLength(7)
    expect(weeks.at(-1)?.cells.slice(4)).toEqual([null, null, null])
    expect(
      weeks
        .at(-1)
        ?.cells.slice(0, 4)
        .every((cell) => cell !== null),
    ).toBe(true)
  })

  it('leaves no week column completely empty, from any start date', () => {
    // A blank column reads as missing data, not as a quiet week. Swept over twelve start dates on
    // purpose: with one date this passed even with the generator's guarantee removed, which makes it
    // a tautology — the dates are what give it teeth.
    for (let month = 0; month < 12; month += 1) {
      const now = new Date(2026, month, 15, 12)
      const weeks = exampleActivityWeeks(now)
      const blanks = weeks.filter((week) =>
        week.cells.filter((cell) => cell !== null).every((cell) => cell!.seconds === 0),
      )
      expect(blanks, `empty column for start ${now.toDateString()}`).toHaveLength(0)
    }
  })

  it('is deterministic and ends on the injected day', () => {
    const now = new Date('2026-09-30T12:00:00')
    const first = exampleActivityWeeks(now).flatMap((week) => week.cells)
    const second = exampleActivityWeeks(now).flatMap((week) => week.cells)

    expect(first).toEqual(second)
    expect(first.filter((cell) => cell !== null).at(-1)?.date).toBe('2026-09-30')
  })
})
