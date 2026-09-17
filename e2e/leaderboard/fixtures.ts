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
 *
 * `totalParticipants` is **required** here, as it is in the schema: the server sends a
 * Java `long`, which cannot be null, so the key is always present. It is the board's
 * whole size — which is what decides whether another page exists — so a fixture that
 * omits it would let a paging bug pass.
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
  /** The whole board's size, not this page's. */
  totalParticipants: number
}

/** Three ranked users, the last two tied, to pin the shared-rank rendering. */
export const TEST_LEADERBOARD_PAGE: LeaderboardFixture = {
  entries: [
    { userId: 'ada11111-2222-4333-8444-555566660001', displayName: 'Ada Lovelace', score: 2_484_000, rank: 1 },
    { userId: 'ada11111-2222-4333-8444-555566660002', displayName: 'Grace Hopper', score: 2_160_000, rank: 2 },
    { userId: 'ada11111-2222-4333-8444-555566660003', displayName: 'Barbara Liskov', score: 2_160_000, rank: 2 },
  ],
  currentUserRank: 11,
  totalParticipants: 3,
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
  totalParticipants: 22,
}

/** An empty board, which is a normal state (a legal period with no activity). */
export const TEST_LEADERBOARD_EMPTY: LeaderboardFixture = { entries: [], totalParticipants: 0 }

/**
 * A full first page out of a board of `total` rows.
 *
 * "Full" alone no longer decides anything — the paging test needs a board that really
 * has more rows, and a separate case needs one where the size is an exact multiple of
 * the page size (which must **not** offer another page).
 */
export function fullLeaderboardPage(total = 60): LeaderboardFixture {
  return {
    entries: Array.from({ length: 20 }, (_, i) => ({
      userId: `${String(i + 1).padStart(8, '0')}-1111-4111-8111-111111111111`,
      displayName: `Coder ${i + 1}`,
      score: 1_000_000 - i * 1000,
      rank: i + 1,
    })),
    currentUserRank: 11,
    totalParticipants: total,
  }
}

/** One entry of the language catalogue, as `GET /leaderboard/languages` sends it. */
export interface LanguageFixture {
  name: string
  type: 'PROGRAMMING' | 'MARKUP' | 'DATA' | 'PROSE' | 'OTHER'
  /** Whether anybody is ranked on this board. */
  hasMembers: boolean
}

/**
 * A catalogue exercising both levels of ordering.
 *
 * Deliberately **neither** in category order **nor** partitioned: the catalogue arrives
 * sorted by name (842 entries), and both the grouping and the members-first split are the
 * selector's own work — a fixture that arrived pre-arranged would not show whether they
 * happen. Names are chosen so each partition is unambiguous: within `PROGRAMMING`, `Java`
 * and `Kotlin` have members while `ABAP` and `Zig` do not, so a name-sorted list and a
 * partitioned one cannot be confused.
 */
export const TEST_LANGUAGES: LanguageFixture[] = [
  { name: 'ABAP', type: 'PROGRAMMING', hasMembers: false },
  { name: 'CSS', type: 'MARKUP', hasMembers: true },
  { name: 'CSV', type: 'DATA', hasMembers: false },
  { name: 'Java', type: 'PROGRAMMING', hasMembers: true },
  { name: 'Kotlin', type: 'PROGRAMMING', hasMembers: true },
  { name: 'Markdown', type: 'PROSE', hasMembers: true },
  { name: 'Zig', type: 'PROGRAMMING', hasMembers: false },
]
