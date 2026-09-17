import { describe, expect, it } from 'vite-plus/test'
import { groupLanguageBoards } from '../useLeaderboard'
import type { LanguageBoard } from '@/lib/schemas/leaderboard.schema'

const board = (name: string, type: LanguageBoard['type'], hasMembers = false): LanguageBoard => ({
  name,
  type,
  hasMembers,
})

describe('groupLanguageBoards', () => {
  it('orders groups by likelihood of use, not by the catalogue order it was given', () => {
    // The selector renders these groups top to bottom, and the catalogue's own order is
    // alphabetical — which would put `Markdown` above `Java`.
    const groups = groupLanguageBoards([
      board('Markdown', 'PROSE'),
      board('CSV', 'DATA'),
      board('Java', 'PROGRAMMING'),
      board('HTML', 'MARKUP'),
    ])

    expect(groups.map((g) => g.type)).toEqual(['PROGRAMMING', 'MARKUP', 'DATA', 'PROSE'])
  })

  it('drops categories with no boards instead of rendering an empty heading', () => {
    const groups = groupLanguageBoards([board('Java', 'PROGRAMMING')])

    expect(groups).toHaveLength(1)
    expect(groups[0]!.withMembers.map((b) => b.name)).toEqual([])
  })

  it('splits each category by whether a board has members', () => {
    // The catalogue is the whole vocabulary, so the handful of boards with members have to
    // be separable from the hundreds without — that split is what the selector renders a
    // divider around.
    const [programming] = groupLanguageBoards([
      board('ABAP', 'PROGRAMMING'),
      board('Java', 'PROGRAMMING', true),
      board('4D', 'PROGRAMMING'),
      board('Kotlin', 'PROGRAMMING', true),
    ])

    expect(programming!.withMembers.map((b) => b.name)).toEqual(['Java', 'Kotlin'])
    expect(programming!.withoutMembers.map((b) => b.name)).toEqual(['ABAP', '4D'])
  })

  it('preserves the catalogue order within each partition', () => {
    // The server sorts by name; a partition must not reshuffle its own half.
    const [programming] = groupLanguageBoards([
      board('A', 'PROGRAMMING', true),
      board('B', 'PROGRAMMING', true),
      board('C', 'PROGRAMMING'),
      board('D', 'PROGRAMMING'),
    ])

    expect(programming!.withMembers.map((b) => b.name)).toEqual(['A', 'B'])
    expect(programming!.withoutMembers.map((b) => b.name)).toEqual(['C', 'D'])
  })

  it('returns nothing for an empty catalogue', () => {
    expect(groupLanguageBoards([])).toEqual([])
  })
})
