// Shape of the JSON Claude Code pipes to the status line on stdin.
// Almost every field can be absent or null, so nothing here is required.

export interface RateWindow {
	used_percentage?: number | null
	/** Unix epoch seconds per the docs; parsed defensively via `toEpochMs`. */
	resets_at?: number | string | null
}

export interface StatusInput {
	cwd?: string
	session_id?: string
	session_name?: string
	transcript_path?: string
	version?: string
	model?: { id?: string; display_name?: string }
	workspace?: {
		current_dir?: string
		project_dir?: string
		git_worktree?: string
		repo?: { host?: string; owner?: string; name?: string }
	}
	context_window?: {
		total_input_tokens?: number | null
		total_output_tokens?: number | null
		context_window_size?: number | null
		used_percentage?: number | null
		remaining_percentage?: number | null
	} | null
	exceeds_200k_tokens?: boolean
	fast_mode?: boolean
	effort?: { level?: string } | null
	thinking?: { enabled?: boolean } | null
	rate_limits?: { five_hour?: RateWindow | null; seven_day?: RateWindow | null } | null
	agent?: { name?: string } | null
	worktree?: { name?: string; branch?: string } | null
	vim?: { mode?: string } | null
	cost?: { total_cost_usd?: number; total_duration_ms?: number }
}

/**
 * Normalizes the two timestamp encodings in play: `rate_limits.*.resets_at` arrives as unix
 * epoch seconds, while the OAuth usage API returns ISO 8601 strings. Also tolerates epoch
 * milliseconds in case the encoding changes under us.
 */
export function toEpochMs(value: number | string | null | undefined): number | undefined {
	if (value == null) return undefined
	if (typeof value === 'number') {
		if (!Number.isFinite(value) || value <= 0) return undefined
		// Anything below year ~2286 in ms is implausible as ms, so treat small values as seconds.
		return value < 1e11 ? value * 1000 : value
	}
	const parsed = Date.parse(value)
	return Number.isNaN(parsed) ? undefined : parsed
}

/** Coerces to a finite number, mapping null/NaN/absent to undefined. */
export function num(value: number | null | undefined): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export async function readInput(): Promise<StatusInput> {
	try {
		return (await Bun.stdin.json()) as StatusInput
	} catch {
		return {}
	}
}
