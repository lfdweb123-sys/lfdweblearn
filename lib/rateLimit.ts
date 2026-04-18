// lib/rateLimit.ts

// Rate limiter simple en mémoire (Edge compatible)
// Pour production: utiliser Upstash Redis

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number   // durée fenêtre en ms
  max: number        // max requêtes par fenêtre
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

    // Réinitialiser si fenêtre expirée
    if (!entry || now > entry.resetAt) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + windowMs,
      }
      store.set(identifier, newEntry)
      return { success: true, remaining: max - 1, resetAt: newEntry.resetAt }
    }

    // Incrémenter le compteur
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

// Limiteurs prédéfinis
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,               // 5 tentatives de paiement par minute
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 tentatives de connexion
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,              // 60 requêtes par minute
})