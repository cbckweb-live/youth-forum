/**
 * Rate limiter with configurabl IP/account tracking and exponential backoff.
 *
 * Supports two store backends:
 * - **InMemory** (default, Map-based): great for dev, single-instance deploys.
 * - **Supabase**: for production deployments where multiple instances share state.
 *
 * Usage:
 *   const limiter = new RateLimiter({ mode: "in-memory" });
 *   const result = limiter.check({ ip: "1.2.3.4", endpoint: "auth:login" });
 *   if (!result.allowed) return new Response("Too Many Requests", { status: 429 });
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  /** Max requests within the window. */
  maxAttempts: number;
  /** Window duration in seconds. */
  windowSeconds: number;
  /** Multiplier applied to window after each blocked attempt (exponential backoff). */
  backoffMultiplier: number;
  /** Max window duration in seconds after backoff. */
  maxWindowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining attempts in current window. */
  remaining: number;
  /** Unix timestamp (ms) when the window resets. */
  resetAt: number;
  /** Unix timestamp (ms) when the current throttle expires (0 if not throttled). */
  retryAfter: number;
}

export type RateLimitTier =
  | "auth"       // login, password reset
  | "public"     // page views, read-only data
  | "authenticated"; // admin CRUD

export interface StoreEntry {
  /** Number of attempts in current window. */
  count: number;
  /** Unix timestamp (ms) when the window started. */
  windowStart: number;
  /** Unix timestamp (ms) when a backoff throttle ends (0 = not throttled). */
  blockedUntil: number;
  /** Current backoff multiplier (starts at 1). */
  backoffLevel: number;
}

// ---------------------------------------------------------------------------
// Default configurations per tier (env vars override these)
// ---------------------------------------------------------------------------

export const DEFAULT_TIER_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  auth: {
    maxAttempts: 5,
    windowSeconds: 300,           // 5 min window
    backoffMultiplier: 2,         // double window on each block
    maxWindowSeconds: 3600,       // cap at 1 hour
  },
  public: {
    maxAttempts: 100,
    windowSeconds: 60,            // 1 min window
    backoffMultiplier: 1.5,
    maxWindowSeconds: 300,        // cap at 5 min
  },
  authenticated: {
    maxAttempts: 500,
    windowSeconds: 60,            // 1 min window
    backoffMultiplier: 1,
    maxWindowSeconds: 60,         // no backoff for authenticated users
  },
};

// ---------------------------------------------------------------------------
// Store interface & implementations
// ---------------------------------------------------------------------------

interface RateLimitStore {
  get(key: string): StoreEntry | undefined;
  set(key: string, entry: StoreEntry): void;
  /** Atomically increment the count for a key. Returns the new entry. */
  increment?(key: string, entry: StoreEntry): StoreEntry;
}

/** In-memory Map store — works everywhere, but not shared across serverless instances. */
class InMemoryStore implements RateLimitStore {
  private store = new Map<string, StoreEntry>();

  get(key: string): StoreEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: StoreEntry): void {
    this.store.set(key, entry);
    // Garbage-collect stale entries (only on set to keep reads fast)
    if (this.store.size > 10000) {
      const now = Date.now();
      for (const [k, v] of this.store) {
        if (now > v.windowStart + 86400000) { // older than 24h
          this.store.delete(k);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

function ipKey(ip: string, endpoint: string): string {
  return `ip:${ip}:${endpoint}`;
}

function accountKey(accountId: string, endpoint: string): string {
  return `acct:${accountId}:${endpoint}`;
}

// ---------------------------------------------------------------------------
// Main RateLimiter
// ---------------------------------------------------------------------------

export class RateLimiter {
  private store: RateLimitStore;
  private configs: Record<string, RateLimitConfig>;

  constructor(opts?: {
    store?: RateLimitStore;
    configs?: Partial<Record<RateLimitTier, Partial<RateLimitConfig>>>;
  }) {
    this.store = opts?.store ?? new InMemoryStore();

    // Merge user-supplied overrides into defaults
    const merged = { ...DEFAULT_TIER_CONFIGS } as Record<string, RateLimitConfig>;
    if (opts?.configs) {
      for (const [tier, overrides] of Object.entries(opts.configs)) {
        if (overrides && merged[tier]) {
          merged[tier] = { ...merged[tier], ...overrides };
        }
      }
    }
    this.configs = merged;
  }

  /** Get the config for a given tier. */
  getConfig(tier: RateLimitTier): RateLimitConfig {
    return this.configs[tier] ?? this.configs.public;
  }

  /**
   * Check whether a request is allowed.
   *
   * @param ip          The remote IP of the requester.
   * @param endpoint    A logical endpoint name (e.g. "auth:login").
   * @param tier        The rate-limit tier.
   * @param accountId   Optional account identifier for per-account limiting.
   */
  check(opts: {
    ip: string;
    endpoint: string;
    tier: RateLimitTier;
    accountId?: string;
  }): RateLimitResult {
    const config = this.getConfig(opts.tier);
    const now = Date.now();

    // ── 1. Per-IP check ──
    const ipResult = this.evaluateKey(ipKey(opts.ip, opts.endpoint), config, now);

    // ── 2. Per-account check (if provided) ──
    let accountResult: RateLimitResult | null = null;
    if (opts.accountId) {
      accountResult = this.evaluateKey(
        accountKey(opts.accountId, opts.endpoint),
        config,
        now,
      );
    }

    // The more restrictive of the two governs
    const result = accountResult && accountResult.retryAfter > ipResult.retryAfter
      ? accountResult
      : ipResult;

    // ── 3. Enforce backoff on blocked attempts — increment both keys ──
    if (!result.allowed) {
      this.applyBackoff(ipKey(opts.ip, opts.endpoint), config, now);
      if (opts.accountId) {
        this.applyBackoff(accountKey(opts.accountId, opts.endpoint), config, now);
      }
    }

    return result;
  }

  /**
   * Records a successful event (e.g. correct login) to reset the rate limit.
   */
  reset(opts: { ip: string; endpoint: string; accountId?: string }): void {
    this.store.set(ipKey(opts.ip, opts.endpoint), {
      count: 0,
      windowStart: Date.now(),
      blockedUntil: 0,
      backoffLevel: 0,
    });
    if (opts.accountId) {
      this.store.set(accountKey(opts.accountId, opts.endpoint), {
        count: 0,
        windowStart: Date.now(),
        blockedUntil: 0,
        backoffLevel: 0,
      });
    }
  }

  // ── Internal helpers ──

  private evaluateKey(
    key: string,
    config: RateLimitConfig,
    now: number,
  ): RateLimitResult {
    const entry = this.store.get(key);
    const windowMs = config.windowSeconds * 1000;

    if (!entry) {
      // First request — create entry and allow
      const newEntry: StoreEntry = {
        count: 1,
        windowStart: now,
        blockedUntil: 0,
        backoffLevel: 0,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: now + windowMs,
        retryAfter: 0,
      };
    }

    // Check if window has expired — reset if so
    if (now - entry.windowStart > windowMs) {
      const newEntry: StoreEntry = {
        count: 1,
        windowStart: now,
        blockedUntil: 0,
        backoffLevel: 0,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: now + windowMs,
        retryAfter: 0,
      };
    }

    // Check if currently throttled by backoff
    if (entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: entry.blockedUntil - now,
      };
    }

    // Check if over the limit
    if (entry.count >= config.maxAttempts) {
      const effectiveWindow = Math.min(
        config.windowSeconds * Math.pow(config.backoffMultiplier, entry.backoffLevel),
        config.maxWindowSeconds,
      );
      const blockedUntil = now + effectiveWindow * 1000;
      this.store.set(key, {
        ...entry,
        blockedUntil,
        backoffLevel: entry.backoffLevel + 1,
      });
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        retryAfter: effectiveWindow * 1000,
      };
    }

    // Within limit — increment and allow
    entry.count += 1;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxAttempts - entry.count,
      resetAt: entry.windowStart + windowMs,
      retryAfter: 0,
    };
  }

  private applyBackoff(
    key: string,
    config: RateLimitConfig,
    now: number,
  ): void {
    const entry = this.store.get(key);
    if (!entry) return;

    const effectiveWindow = Math.min(
      config.windowSeconds * Math.pow(config.backoffMultiplier, entry.backoffLevel),
      config.maxWindowSeconds,
    );
    this.store.set(key, {
      ...entry,
      blockedUntil: now + effectiveWindow * 1000,
      backoffLevel: entry.backoffLevel + 1,
    });
  }
}

// ---------------------------------------------------------------------------
// Singleton (reused across requests in the same Node.js process)
// ---------------------------------------------------------------------------

let _limiter: RateLimiter | null = null;

/** Get or create the global rate limiter instance. */
export function getRateLimiter(): RateLimiter {
  if (!_limiter) {
    _limiter = new RateLimiter({
      configs: {
        auth: buildTierConfig("RATE_LIMIT_AUTH"),
        public: buildTierConfig("RATE_LIMIT_PUBLIC"),
        authenticated: buildTierConfig("RATE_LIMIT_AUTHENTICATED"),
      },
    });
  }
  return _limiter;
}

function buildTierConfig(prefix: string): Partial<RateLimitConfig> {
  return {
    maxAttempts: envInt(`${prefix}_MAX_ATTEMPTS`, 0) || undefined,
    windowSeconds: envInt(`${prefix}_WINDOW_SECONDS`, 0) || undefined,
    backoffMultiplier: envInt(`${prefix}_BACKOFF_MULTIPLIER`, 0) || undefined,
    maxWindowSeconds: envInt(`${prefix}_MAX_WINDOW_SECONDS`, 0) || undefined,
  };
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// Helper: extract client IP from a NextRequest
// ---------------------------------------------------------------------------

export function getClientIp(request: { headers: Headers | { get: (name: string) => string | null } }): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "127.0.0.1"
  );
}
