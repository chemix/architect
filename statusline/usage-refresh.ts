#!/usr/bin/env bun
// Background refresher for the Fable / extra-usage cache. Never invoked from the render path —
// statusline.ts spawns it detached and moves on. Safe to run by hand for debugging.

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { RATE_LIMIT_BACKOFF_MS, readCache, setLock, writeCache, type CachedUsage } from './usage'

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage'
const KEYCHAIN_SERVICE = 'Claude Code-credentials'
const REQUEST_TIMEOUT_MS = 8_000

/** Model whose weekly_scoped bucket we surface. Matched case-insensitively as a substring, since
 *  display names can carry a family prefix (e.g. "Claude 3.5 Fable"). */
const TRACKED_MODEL = 'fable'

interface OAuthCredentials {
	claudeAiOauth?: { accessToken?: string | null }
}

interface UsageLimit {
	kind?: string | null
	percent?: number | null
	resets_at?: string | null
	scope?: { model?: { display_name?: string | null } | null } | null
}

interface UsageResponse {
	limits?: UsageLimit[] | null
	seven_day_fable?: { utilization?: number | null; resets_at?: string | null } | null
	extra_usage?: {
		is_enabled?: boolean | null
		monthly_limit?: number | null
		used_credits?: number | null
		currency?: string | null
	} | null
}

function accessToken(): string | undefined {
	// macOS keeps the token in the login keychain; other platforms use a plain file.
	if (process.platform === 'darwin') {
		try {
			const result = Bun.spawnSync(['security', 'find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'], {
				stdout: 'pipe',
				stderr: 'ignore',
			})
			if (result.exitCode === 0) {
				const parsed = JSON.parse(result.stdout.toString()) as OAuthCredentials
				const token = parsed.claudeAiOauth?.accessToken
				if (token) return token
			}
		} catch {
			// Fall through to the file-based lookup.
		}
	}
	try {
		const parsed = JSON.parse(readFileSync(join(homedir(), '.claude', '.credentials.json'), 'utf8')) as OAuthCredentials
		return parsed.claudeAiOauth?.accessToken ?? undefined
	} catch {
		return undefined
	}
}

/**
 * A limits[] entry reporting 0% with no reset timestamp is a placeholder, not a real window.
 * Treating it as real would paint a confident "0%" over a quota we actually know nothing about.
 */
function isPlaceholder(limit: UsageLimit): boolean {
	return (limit.percent ?? 0) === 0 && (limit.resets_at ?? null) === null
}

function findModelLimit(limits: UsageLimit[] | null | undefined, model: string): UsageLimit | undefined {
	const needle = model.toLowerCase()
	const match = limits?.find(
		(limit) =>
			limit.kind === 'weekly_scoped' && (limit.scope?.model?.display_name ?? '').toLowerCase().includes(needle),
	)
	return match && !isPlaceholder(match) ? match : undefined
}

async function main(): Promise<void> {
	// Carried into every error write so a failed refresh never wipes the last known good numbers;
	// readUsage() renders them with the stale `~` marker instead of dropping the segment.
	const previous = readCache()
	const writeError = (error: string): void => {
		writeCache({ ...(previous ?? {}), fetchedAt: Date.now(), error })
	}

	const token = accessToken()
	if (!token) {
		writeError('no-credentials')
		return
	}

	let response: Response
	try {
		response = await fetch(USAGE_URL, {
			headers: {
				Authorization: `Bearer ${token}`,
				'anthropic-beta': 'oauth-2025-04-20',
				'Content-Type': 'application/json',
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		})
	} catch {
		writeError('network')
		return
	}

	if (response.status === 429) {
		setLock(RATE_LIMIT_BACKOFF_MS)
		writeError('rate-limited')
		return
	}
	if (!response.ok) {
		writeError(`http-${response.status}`)
		return
	}

	let data: UsageResponse
	try {
		data = (await response.json()) as UsageResponse
	} catch {
		writeError('parse')
		return
	}

	// Per-model quotas live in limits[]; the flat seven_day_* keys return null even for models
	// with real usage, so they are only a last-resort fallback.
	const scoped = findModelLimit(data.limits, TRACKED_MODEL)
	const flat = data.seven_day_fable
	const cache: CachedUsage = {
		fetchedAt: Date.now(),
		fablePct: scoped?.percent ?? flat?.utilization ?? undefined,
		fableResetsAt: scoped?.resets_at ?? flat?.resets_at ?? undefined,
		extraEnabled: data.extra_usage?.is_enabled ?? undefined,
		extraUsedMinor: data.extra_usage?.used_credits ?? undefined,
		extraLimitMinor: data.extra_usage?.monthly_limit ?? undefined,
		extraCurrency: data.extra_usage?.currency ?? undefined,
	}
	writeCache(cache)
}

await main()
