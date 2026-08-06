// Maps Claude model ids to the short labels shown in the status line.
// Ordered longest-prefix-first so `claude-haiku-4-5-20251001` beats a bare `claude-haiku`.
const MODEL_LABELS: readonly (readonly [string, string])[] = [
	['claude-fable-5', 'Fable 5'],
	['claude-opus-5', 'Opus 5'],
	['claude-sonnet-5', 'Sonnet 5'],
	['claude-haiku-4-5', 'Haiku 4.5'],
	['claude-opus-4', 'Opus 4'],
	['claude-sonnet-4', 'Sonnet 4'],
	['claude-haiku-4', 'Haiku 4'],
	['claude-fable', 'Fable'],
	['claude-opus', 'Opus'],
	['claude-sonnet', 'Sonnet'],
	['claude-haiku', 'Haiku'],
]

/** Full label, e.g. `claude-fable-5` -> `Fable 5`. Falls back to the raw id. */
export function modelLabel(id: string | undefined): string {
	if (!id) return '?'
	// Strip vendor prefixes (`us.anthropic.claude-…`) and the `[1m]` context suffix.
	const normalized = id.toLowerCase().replace(/^.*?(claude-)/, '$1').replace(/\[1m\]$/, '')
	for (const [prefix, label] of MODEL_LABELS) {
		if (normalized.startsWith(prefix)) return label
	}
	return id
}

/** Family only, e.g. `claude-fable-5` -> `Fable`. Used to group subagents compactly. */
export function modelFamily(id: string | undefined): string {
	const label = modelLabel(id)
	return label.split(' ')[0] ?? label
}
