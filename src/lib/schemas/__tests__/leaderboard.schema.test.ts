import { describe, expect, it } from 'vite-plus/test'
import {
  DIMENSION_PERIODS,
  LeaderboardEntrySchema,
  LeaderboardResponseSchema,
  defaultPeriodFor,
} from '../leaderboard.schema'

/** A real entry as the server sends it (taken from the live endpoint). */
const entry = {
  userId: 'ada11111-2222-4333-8444-555566660001',
  displayName: 'Ada Lovelace',
  score: 39600,
  rank: 21,
}

describe('LeaderboardEntrySchema', () => {
  it('parses a real entry', () => {
    expect(LeaderboardEntrySchema.parse(entry)).toEqual(entry)
  })

  it('accepts a deleted account whose displayName key is absent', () => {
    // Measured live: an id with no users row comes back with **no** displayName key
    // at all (Jackson non_null), not `displayName: null`. Requiring the key failed
    // to parse the whole page — page 2 rendered the error state until this.
    const deleted = { userId: entry.userId, score: 12000, rank: 30 }
    expect(LeaderboardEntrySchema.parse(deleted).displayName).toBeNull()
  })

  it('accepts an explicit null displayName too', () => {
    expect(LeaderboardEntrySchema.parse({ ...entry, displayName: null }).displayName).toBeNull()
  })

  it('accepts a negative score, which GROWTH produces', () => {
    expect(LeaderboardEntrySchema.parse({ ...entry, score: -5400 }).score).toBe(-5400)
  })

  it('rejects a non-1-based rank', () => {
    // Ranks are the server's own; 0 would mean the server changed its contract.
    expect(LeaderboardEntrySchema.safeParse({ ...entry, rank: 0 }).success).toBe(false)
  })
})

describe('LeaderboardResponseSchema', () => {
  it('parses a real page', () => {
    const page = { entries: [entry], currentUserRank: 11, totalParticipants: 1240 }
    expect(LeaderboardResponseSchema.parse(page)).toEqual(page)
  })

  it('accepts a page whose currentUserRank key is absent', () => {
    // Measured: an unranked caller gets `data` with only `entries` — the key is
    // omitted, not null. GROWTH on the test account is exactly this.
    const unranked = { entries: [], totalParticipants: 0 }
    expect(LeaderboardResponseSchema.parse(unranked).currentUserRank).toBeNull()
  })

  it('accepts an explicit null currentUserRank', () => {
    expect(
      LeaderboardResponseSchema.parse({ entries: [], currentUserRank: null, totalParticipants: 0 }).currentUserRank,
    ).toBeNull()
  })

  it('accepts an empty page, which a legal period with no activity produces', () => {
    // TOTAL:WEEK legitimately returns 0 entries — a normal state, not an error.
    expect(LeaderboardResponseSchema.parse({ entries: [], currentUserRank: 3, totalParticipants: 0 }).entries).toEqual(
      [],
    )
  })

  it('requires totalParticipants, because the server always sends it', () => {
    // A Java `long` is a primitive: it cannot be null, and `non_null` inclusion only
    // suppresses nulls — so the key is always there. Declaring it required is a
    // deliberate choice: its absence means a contract mismatch, and `paging` reads it
    // to decide whether another page exists, where a silent 0 would disable paging.
    const withoutTotal = { entries: [], currentUserRank: null }
    expect(LeaderboardResponseSchema.safeParse(withoutTotal).success).toBe(false)
  })

  it('keeps tied ranks verbatim rather than renumbering', () => {
    // The live board reads 1, 2, 3, 3, 5 — the gaps are the server's, and a client
    // that renumbered by index would mislabel everyone below the first tie.
    const tied = {
      entries: [
        { ...entry, userId: '11111111-1111-4111-8111-111111111111', rank: 3 },
        { ...entry, userId: '22222222-2222-4222-8222-222222222222', rank: 3 },
        { ...entry, userId: '33333333-3333-4333-8333-333333333333', rank: 5 },
      ],
      currentUserRank: null,
      totalParticipants: 3,
    }
    expect(LeaderboardResponseSchema.parse(tied).entries.map((e) => e.rank)).toEqual([3, 3, 5])
  })
})

describe('DIMENSION_PERIODS', () => {
  it('mirrors the server so an illegal pair cannot be built', () => {
    // The server rejects unsupported pairs with HTTP 400 COMMON_003 (measured:
    // "Dimension STREAK does not support period WEEK"), so these lists are a
    // contract, not a preference.
    // ctt-server v0.73.0 widened this: only STREAK is all-time-only, GROWTH takes any
    // bounded window, and ACTIVE_DAYS joined as a sixth dimension.
    expect(DIMENSION_PERIODS.TOTAL).toEqual(['ALL', 'WEEK', 'MONTH', 'YEAR'])
    expect(DIMENSION_PERIODS.STREAK).toEqual(['ALL'])
    expect(DIMENSION_PERIODS.NIGHT_OWL).toEqual(['ALL', 'WEEK', 'MONTH', 'YEAR'])
    expect(DIMENSION_PERIODS.EARLY_BIRD).toEqual(['ALL', 'WEEK', 'MONTH', 'YEAR'])
    expect(DIMENSION_PERIODS.GROWTH).toEqual(['WEEK', 'MONTH', 'YEAR'])
    expect(DIMENSION_PERIODS.ACTIVE_DAYS).toEqual(['ALL', 'WEEK', 'MONTH', 'YEAR'])
  })

  it('covers every dimension', () => {
    expect(Object.keys(DIMENSION_PERIODS).sort()).toEqual([
      'ACTIVE_DAYS',
      'EARLY_BIRD',
      'GROWTH',
      'NIGHT_OWL',
      'STREAK',
      'TOTAL',
    ])
  })

  it('has a default that is always itself legal', () => {
    for (const dimension of Object.keys(DIMENSION_PERIODS) as (keyof typeof DIMENSION_PERIODS)[]) {
      const fallback = defaultPeriodFor(dimension)
      expect(DIMENSION_PERIODS[dimension]).toContain(fallback)
    }
  })

  it('matches the server default for GROWTH, which is WEEK not ALL', () => {
    // The server defaults GROWTH to WEEK and everything else to ALL; the client's
    // first request should be what the server would have chosen anyway.
    expect(defaultPeriodFor('GROWTH')).toBe('WEEK')
    expect(defaultPeriodFor('TOTAL')).toBe('ALL')
  })
})
