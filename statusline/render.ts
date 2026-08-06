// Presentation layer: colors, progress bars, pacing markers, duration formatting.

const NO_COLOR = process.env.NO_COLOR != null && process.env.NO_COLOR !== ''
const TRUECOLOR = /truecolor|24bit/i.test(process.env.COLORTERM ?? '')

export const RESET = NO_COLOR ? '' : '\x1b[0m'

/** Nearest xterm-256 index for an RGB triple, using the 6x6x6 color cube. */
function to256(r: number, g: number, b: number): number {
	const q = (v: number) => Math.round((Math.max(0, Math.min(255, v)) / 255) * 5)
	return 16 + 36 * q(r) + 6 * q(g) + q(b)
}

export function fg(r: number, g: number, b: number): string {
	if (NO_COLOR) return ''
	return TRUECOLOR ? `\x1b[38;2;${r};${g};${b}m` : `\x1b[38;5;${to256(r, g, b)}m`
}

export const DIM = NO_COLOR ? '' : '\x1b[2m'
export const BOLD = NO_COLOR ? '' : '\x1b[1m'

export const GREEN = fg(126, 211, 133)
export const YELLOW = fg(230, 190, 90)
export const RED = fg(224, 108, 117)
export const GREY = fg(128, 128, 128)
export const BLUE = fg(122, 162, 247)
export const MAGENTA = fg(198, 146, 233)

export function color(text: string, code: string): string {
	return code ? `${code}${text}${RESET}` : text
}

/** Green below 60%, ramping through yellow to red at 100%. Used for the context bar. */
export function heatColor(pct: number): string {
	if (pct < 60) return GREEN
	if (pct < 85) return YELLOW
	return RED
}

const EMPTY = '░'
/** Left-fill Block Elements, indexed by eighths: index 1 is ▏(1/8) … index 8 is █(8/8). */
const EIGHTHS = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'] as const
const EIGHTHS_PER_CELL = 8

export interface BarOptions {
	/** Bar length in terminal cells. Each cell carries 8 levels of sub-cell precision. */
	width: number
	/** 0-100. Fraction of the bar that is filled. */
	pct: number
	color: string
}

/**
 * Draws a progress bar at eighth-of-a-cell resolution, so a 3-cell bar still resolves 24 levels.
 *
 * Full-cell blocks would only give `width` levels, which collapses the entire 0-15% band — where
 * the rate-limit windows actually live most of the time — into an indistinguishable empty bar.
 */
export function bar({ width, pct, color: barColor }: BarOptions): string {
	const clamped = Math.max(0, Math.min(100, pct))
	const total = width * EIGHTHS_PER_CELL
	let filled = Math.round((clamped / 100) * total)

	// Two anti-lying rules: a non-zero reading must never render as empty, and a solid bar must
	// mean a true 100% (otherwise 0.4% looks like 0%, and 99.6% looks like full).
	if (clamped > 0) filled = Math.max(1, filled)
	if (clamped < 100) filled = Math.min(filled, total - 1)

	const full = Math.floor(filled / EIGHTHS_PER_CELL)
	const remainder = filled % EIGHTHS_PER_CELL
	const partial = remainder > 0 ? EIGHTHS[remainder]! : ''
	const drawn = '█'.repeat(full) + partial

	return color(drawn + EMPTY.repeat(Math.max(0, width - drawn.length)), barColor)
}

/**
 * Colors a usage window by how its consumption compares to elapsed time.
 * Ratio >= 1 means the remaining budget outlasts the remaining time.
 *
 * Early in a window the ratio is dominated by noise (a single message can read as 500% of a
 * two-minute elapsed slice), so pacing is suppressed until 10% of the window has passed.
 */
export function paceColor(usedPct: number, elapsedPct: number | undefined): string {
	if (elapsedPct == null || elapsedPct < 10) return heatColor(usedPct)
	const remainingBudget = 100 - usedPct
	const remainingTime = 100 - elapsedPct
	if (remainingTime <= 0) return heatColor(usedPct)
	const ratio = remainingBudget / remainingTime
	if (usedPct >= 95) return RED
	if (ratio >= 1) return GREEN
	if (ratio >= 0.75) return YELLOW
	return RED
}

/** Compact "time until" rendering: `2d5h`, `2h14m`, `43m`, `<1m`. */
export function untilText(targetMs: number | undefined, now = Date.now()): string | undefined {
	if (targetMs == null) return undefined
	const ms = targetMs - now
	if (ms <= 0) return undefined
	const minutes = Math.floor(ms / 60_000)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	if (days > 0) return `${days}d${hours % 24}h`
	if (hours > 0) return `${hours}h${minutes % 60}m`
	if (minutes > 0) return `${minutes}m`
	return '<1m'
}

/** How far through a fixed-length window we are, as 0-100. */
export function elapsedPercent(resetsAtMs: number | undefined, windowMs: number, now = Date.now()): number | undefined {
	if (resetsAtMs == null) return undefined
	const start = resetsAtMs - windowMs
	const pct = ((now - start) / windowMs) * 100
	return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : undefined
}

const ANSI_RE = /\x1b\[[0-9;]*m/g

/** Visible width of a string, ignoring ANSI escapes. */
export function visibleWidth(text: string): number {
	return text.replace(ANSI_RE, '').length
}

/** Terminal width as reported by Claude Code. `tput cols` does not work inside a status line. */
export function terminalWidth(): number {
	const columns = Number.parseInt(process.env.COLUMNS ?? '', 10)
	return Number.isFinite(columns) && columns > 0 ? columns : 120
}

/**
 * Joins segments with `separator`, dropping trailing segments until the line fits.
 * Segments are supplied most-important-first; callers put droppable extras at the end.
 */
export function fitLine(segments: (string | undefined)[], separator: string, maxWidth: number): string {
	const present = segments.filter((s): s is string => s != null && s !== '')
	const sepWidth = visibleWidth(separator)
	for (let take = present.length; take > 0; take--) {
		const slice = present.slice(0, take)
		const width = slice.reduce((sum, s) => sum + visibleWidth(s), 0) + sepWidth * (take - 1)
		if (width <= maxWidth) return slice.join(separator)
	}
	return present[0] ?? ''
}
