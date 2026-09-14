/**
 * Local leaderboard wire shapes matching the API contract
 * (`src/lib/schemas/leaderboard.schema.ts`). Kept local to the E2E suite; never
 * import from src/ in specs.
 *
 * These are the **wire** shapes, not the schema's parsed output. Two fields are
 * optional here because the server omits them rather than nulling them, while the
 * schema (which applies `.default(null)`) types both as always present:
 *
 * - `displayName` is absent for an account that no longer exists.
 * - `currentUserRank` is absent when the caller has never pushed — `GROWTH` on an
 *   unranked account returns `{ entries: [] }` with no rank key at all.
 *
 * `rank` is the server's own and is deliberately non-contiguous: ties share a rank
 * on the real board, so a row's position must never be read from its index.
 */

export interface LeaderboardEntryFixture {
  userId: string
  /** Omitted entirely for a deleted account. */
  displayName?: string
  score: number
  rank: number
}

export interface LeaderboardFixture {
  entries: LeaderboardEntryFixture[]
  /** Omitted entirely when the caller is unranked. */
  currentUserRank?: number
}

/** Three ranked users, the last two tied, to pin the shared-rank rendering. */
export const TEST_LEADERBOARD_PAGE: LeaderboardFixture = {
  entries: [
    { userId: 'ada11111-2222-4333-8444-555566660001', displayName: 'Ada Lovelace', score: 2_484_000, rank: 1 },
    { userId: 'ada11111-2222-4333-8444-555566660002', displayName: 'Grace Hopper', score: 2_160_000, rank: 2 },
    { userId: 'ada11111-2222-4333-8444-555566660003', displayName: 'Barbara Liskov', score: 2_160_000, rank: 2 },
  ],
  currentUserRank: 11,
}

/**
 * A deleted account (no `displayName` key) plus one normal row, and no rank for the
 * caller — the "unranked" state that must render as absence rather than an error.
 */
export const TEST_LEADERBOARD_WITH_DELETED: LeaderboardFixture = {
  entries: [
    { userId: 'ada11111-2222-4333-8444-555566660004', displayName: 'Alan Turing', score: 39_600, rank: 21 },
    { userId: 'ada11111-2222-4333-8444-555566660005', score: 26_100, rank: 22 },
  ],
  // `currentUserRank` deliberately left off rather than set to null.
}

/** An empty board, which is a normal state (a legal period with no activity). */
export const TEST_LEADERBOARD_EMPTY: LeaderboardFixture = { entries: [] }

/**
 * A full page — the only signal the client has that more rows may follow, since the
 * response carries no total.
 */
export function fullLeaderboardPage(): LeaderboardFixture {
  return {
    entries: Array.from({ length: 20 }, (_, i) => ({
      userId: `${String(i + 1).padStart(8, '0')}-1111-4111-8111-111111111111`,
      displayName: `Coder ${i + 1}`,
      score: 1_000_000 - i * 1000,
      rank: i + 1,
    })),
    currentUserRank: 11,
  }
}
