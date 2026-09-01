import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  getStatsAchievements,
  getStatsDistribution,
  getStatsHeatmap,
  getStatsHourly,
  getStatsRecent,
  getStatsStreaks,
  getStatsSummary,
} from '@/lib/api/stats'
import { apiFetch } from '@/lib/api/instance'

vi.mock('../instance', () => ({
  apiFetch: vi.fn<() => Promise<unknown>>(),
}))

const mockApiFetch = vi.mocked(apiFetch)

/**
 * Build a RestApiResponse envelope for the given data — every stats endpoint
 * wraps its payload in this shape (RestApiResponseSchema requires timestamp).
 */
function statsEnvelope(data: unknown) {
  return { success: true, message: 'Success', data, timestamp: '2026-08-31T00:00:00Z' }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getStatsSummary', () => {
  it('sends GET with timezoneOffset and returns parsed summary', async () => {
    mockApiFetch.mockResolvedValue(
      statsEnvelope({
        today: 3600,
        dailyAverage: 1200,
        thisWeek: 25200,
        thisMonth: 108000,
        thisYear: 1296000,
        total: 5000000,
      }),
    )

    const result = await getStatsSummary()

    const call = mockApiFetch.mock.calls[0]!
    expect(call[0]).toBe('/api/v1/stats/summary')
    expect(call[1]!.method).toBe('GET')
    const offset = (call[1]!.query as Record<string, unknown>).timezoneOffset as number
    // Offset matches -getTimezoneOffset() semantics (UTC+8 → 480).
    expect(offset).toBe(-new Date().getTimezoneOffset())
    expect(result.today).toBe(3600)
    expect(result.total).toBe(5000000)
  })

  it('includes deviceId in the query when provided', async () => {
    mockApiFetch.mockResolvedValue(
      statsEnvelope({ today: 0, dailyAverage: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, total: 0 }),
    )

    await getStatsSummary({ deviceId: '550e8400-e29b-41d4-a716-446655440000' })

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.deviceId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('omits deviceId from the query when not provided', async () => {
    mockApiFetch.mockResolvedValue(
      statsEnvelope({ today: 0, dailyAverage: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, total: 0 }),
    )

    await getStatsSummary()

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.deviceId).toBeUndefined()
  })
})

describe('getStatsHeatmap', () => {
  it('sends GET with timezoneOffset and range params when provided', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope({ points: [{ date: '2026-08-01', seconds: 7200 }] }))

    const result = await getStatsHeatmap({ start: '2026-08-01', end: '2026-08-31' })

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.start).toBe('2026-08-01')
    expect(query.end).toBe('2026-08-31')
    expect(result.points).toHaveLength(1)
    expect(result.points[0]!.seconds).toBe(7200)
  })

  it('omits start/end when not provided (server defaults to this year)', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope({ points: [] }))

    await getStatsHeatmap()

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.start).toBeUndefined()
    expect(query.end).toBeUndefined()
  })
})

describe('getStatsStreaks', () => {
  it('returns parsed streaks', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope({ current: 7, max: 30 }))

    const result = await getStatsStreaks()

    expect(result.current).toBe(7)
    expect(result.max).toBe(30)
  })
})

describe('getStatsDistribution', () => {
  it('sends the requested distribution type in the query', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope({ type: 'LANGUAGES', entries: [{ name: 'Java', seconds: 360000 }] }))

    const result = await getStatsDistribution('LANGUAGES')

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.type).toBe('LANGUAGES')
    expect(result.type).toBe('LANGUAGES')
    expect(result.entries[0]!.seconds).toBe(360000)
  })

  it('supports DEVICES and IDES dimensions', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope({ type: 'DEVICES', entries: [] }))

    await getStatsDistribution('DEVICES')
    expect(mockApiFetch.mock.calls[0]![1]!.query).toMatchObject({ type: 'DEVICES' })

    await getStatsDistribution('IDES')
    expect(mockApiFetch.mock.calls[1]![1]!.query).toMatchObject({ type: 'IDES' })
  })
})

describe('getStatsHourly', () => {
  it('returns parsed hourly points with activeDays', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope({ points: [{ hour: 9, averageSeconds: 1800 }], activeDays: 42 }))

    const result = await getStatsHourly()

    expect(result.points[0]!.hour).toBe(9)
    expect(result.activeDays).toBe(42)
  })
})

describe('getStatsRecent', () => {
  it('sends the limit and returns parsed sessions', async () => {
    mockApiFetch.mockResolvedValue(
      statsEnvelope([
        {
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          sessionUuid: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
          projectName: 'ctt-server',
          language: 'Java',
          startTime: '2026-08-29T10:00:00Z',
          endTime: '2026-08-29T11:00:00Z',
          durationSeconds: 3600,
        },
      ]),
    )

    const result = await getStatsRecent({ limit: 10 })

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.limit).toBe(10)
    expect(result).toHaveLength(1)
    expect(result[0]!.durationSeconds).toBe(3600)
  })

  it('defaults the limit to 20', async () => {
    mockApiFetch.mockResolvedValue(statsEnvelope([]))

    await getStatsRecent()

    const query = mockApiFetch.mock.calls[0]![1]!.query as Record<string, unknown>
    expect(query.limit).toBe(20)
  })
})

describe('getStatsAchievements', () => {
  it('returns parsed badges with nullable unlockedAt', async () => {
    mockApiFetch.mockResolvedValue(
      statsEnvelope([
        {
          code: 'STREAK_7',
          displayName: '7-Day Streak',
          description: 'Code on 7 consecutive days',
          unlocked: false,
          unlockedAt: null,
          progress: 3,
          target: 7,
          unit: 'days',
        },
      ]),
    )

    const result = await getStatsAchievements()

    expect(result).toHaveLength(1)
    expect(result[0]!.unlocked).toBe(false)
    expect(result[0]!.unlockedAt).toBeNull()
  })
})

describe('error propagation', () => {
  it('propagates RATE_LIMIT_001 from ofetch without catching', async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 429, data: { code: 'RATE_LIMIT_001' } })

    await expect(getStatsSummary()).rejects.toMatchObject({ statusCode: 429 })
  })

  it('propagates COMMON_002 (unknown device) from ofetch without catching', async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 404, data: { code: 'COMMON_002' } })

    await expect(getStatsSummary({ deviceId: 'bad-device' })).rejects.toMatchObject({ statusCode: 404 })
  })
})
