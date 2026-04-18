// lib/rateLimit.ts

// Rate limiter simple en mémoire (Edge compatible)
// Pour production: utiliser Upstash Redis

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number
  max: number
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max } = options

  return function check(identifier: string): {
    success: boolean
    remaining: number
    resetAt: number
  } {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now > entry.resetAt) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + windowMs,
      }
      store.set(identifier, newEntry)
      return { success: true, remaining: max - 1, resetAt: newEntry.resetAt }
    }

    entry.count++
    store.set(identifier, entry)

    if (entry.count > max) {
      return { success: false, remaining: 0, resetAt: entry.resetAt }
    }

    return {
      success: true,
      remaining: max - entry.count,
      resetAt: entry.resetAt,
    }
  }
}

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
})