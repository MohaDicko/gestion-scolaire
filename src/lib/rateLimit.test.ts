import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rateLimit } from './rateLimit'

describe('Rate Limiter (Memory Fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should allow requests under the limit', async () => {
    const res = await rateLimit('test_ip_1', { limit: 5, windowSecs: 60 })
    expect(res.success).toBe(true)
    expect(res.remaining).toBe(4)
  })

  it('should block requests over the limit', async () => {
    // 1 to 5 should succeed
    for (let i = 0; i < 5; i++) {
      await rateLimit('test_ip_2', { limit: 5, windowSecs: 60 })
    }
    // 6th should fail
    const res = await rateLimit('test_ip_2', { limit: 5, windowSecs: 60 })
    expect(res.success).toBe(false)
    expect(res.remaining).toBe(0)
  })

  it('should reset after the window expires', async () => {
    await rateLimit('test_ip_3', { limit: 1, windowSecs: 1 })
    const resBlocked = await rateLimit('test_ip_3', { limit: 1, windowSecs: 1 })
    expect(resBlocked.success).toBe(false)

    // Fast forward time
    vi.advanceTimersByTime(1100)

    const resAllowed = await rateLimit('test_ip_3', { limit: 1, windowSecs: 1 })
    expect(resAllowed.success).toBe(true)
  })
})
