// Fable weekly quota, read from a cache that a detached background process keeps warm.
//
// Why not fetch inline: the status line runs on every assistant message, and a blocking HTTPS
// round trip would stall the render. So the hot path only ever touches local files — a stale
// number is rendered with a `~` suffix while a refresh runs out of band.
//
// The 5h and 7d windows deliberately do NOT come from here: Claude Code puts them on stdin for
// free and always fresh, so the API is needed only for the per-model (weekly_scoped) buckets.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const STATUSLINE_DIR = import.meta.dir
export const CACHE_DIR = join(STATUSLINE_DIR, 'cache')
export const CACHE_FILE = join(CACHE_DIR, 'usage.json')
export const LOCK_FILE = join(CACHE_DIR, 'usage.lock')

const CACHE_TTL_MS = 180_000
/** Minimum gap between refresh attempts, so concurrent sessions don't stampede the API. */
export const LOCK_MS = 30_000
/** Longer backoff after the API rate-limits us. */
export const RATE_LIMIT_BACKOFF_MS = 300_000

export interface CachedUsage {
	fetchedAt: number
	fablePct?: number
	fableResetsAt?: string
	extraUsedMinor?: number
	extraLimitMinor?: number
	extraCurrency?: string
	extraEnabled?: boolean
	error?: string
}

export interface UsageView {
	fablePct?: number
	fableResetsAtMs?: number
	stale: boolean
}

export function readCache(): CachedUsage | undefined {
	try {
		return JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as CachedUsage
	} catch {
		return undefined
	}
}

export function writeCache(data: CachedUsage): void {
	mkdirSync(CACHE_DIR, { recursive: true })
	writeFileSync(CACHE_FILE, JSON.stringify(data))
}

function lockedUntil(): number {
	try {
		const parsed = JSON.parse(readFileSync(LOCK_FILE, 'utf8')) as { blockedUntil?: number }
		return typeof parsed.blockedUntil === 'number' ? parsed.blockedUntil : 0
	} catch {
		return 0
	}
}

export function setLock(durationMs: number): void {
	try {
		mkdirSync(CACHE_DIR, { recursive: true })
		writeFileSync(LOCK_FILE, JSON.stringify({ blockedUntil: Date.now() + durationMs }))
	} catch {
		// Losing the lock only risks an extra API call; never fail the render over it.
	}
}

function spawnRefresh(): void {
	try {
		setLock(LOCK_MS)
		const child = Bun.spawn([process.execPath, join(STATUSLINE_DIR, 'usage-refresh.ts')], {
			stdio: ['ignore', 'ignore', 'ignore'],
			// Detach so the refresh outlives this short-lived status line process.
			detached: true,
		})
		child.unref()
	} catch {
		// No refresh this tick; the next render will try again once the lock expires.
	}
}

/** Never blocks. Returns whatever is cached and kicks off a background refresh when stale. */
export function readUsage(): UsageView | undefined {
	const cache = readCache()
	const age = cache ? Date.now() - cache.fetchedAt : Infinity
	// An errored refresh keeps the previous numbers but stamps a fresh fetchedAt, so the data
	// itself predates the error — always mark it stale, not just when the TTL runs out.
	const stale = age > CACHE_TTL_MS || cache?.error != null

	if (stale && Date.now() >= lockedUntil()) spawnRefresh()

	if (!cache || cache.fablePct == null) return undefined
	return {
		fablePct: cache.fablePct,
		fableResetsAtMs: cache.fableResetsAt ? Date.parse(cache.fableResetsAt) || undefined : undefined,
		stale,
	}
}
