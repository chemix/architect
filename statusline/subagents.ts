// Detects which subagents are currently working and on which model.
//
// Claude Code writes each subagent's conversation to
//   <transcript_path minus .jsonl>/subagents/agent-<id>.jsonl
// and the assistant entries in that file carry `message.model`. The main transcript only learns
// the model via `toolUseResult.resolvedModel` once the agent has finished, so the per-agent files
// are the only live source.
//
// "Currently working" is inferred from file mtime: an agent that is running appends continuously,
// one that has finished stops. That is a heuristic, but it costs one readdir and a small tail read
// instead of scanning the whole main transcript for unmatched tool_use ids.

import { openSync, readSync, closeSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { modelFamily } from './models'
import { color, DIM, MAGENTA } from './render'

/** How recently a subagent file must have been touched to count as active. */
const ACTIVE_WINDOW_MS = 45_000
/** Cap on files inspected per render, newest first. */
const MAX_FILES = 12
/** Tail size read from each file; comfortably larger than one JSONL entry. */
const TAIL_BYTES = 16_384

function subagentsDir(transcriptPath: string): string {
	return join(transcriptPath.replace(/\.jsonl$/, ''), 'subagents')
}

/** Reads the last `TAIL_BYTES` of a file without loading the whole thing. */
function readTail(path: string): string | undefined {
	let fd: number | undefined
	try {
		const size = statSync(path).size
		const length = Math.min(size, TAIL_BYTES)
		if (length === 0) return undefined
		const buffer = Buffer.allocUnsafe(length)
		fd = openSync(path, 'r')
		readSync(fd, buffer, 0, length, size - length)
		return buffer.toString('utf8')
	} catch {
		return undefined
	} finally {
		if (fd != null) {
			try {
				closeSync(fd)
			} catch {
				// Nothing useful to do if the descriptor won't close.
			}
		}
	}
}

/** Last `message.model` seen in the file's tail. */
function lastModel(path: string): string | undefined {
	const tail = readTail(path)
	if (!tail) return undefined
	const lines = tail.split('\n')
	// The first line is likely truncated mid-JSON by the tail read; walking backwards means we
	// normally return before ever reaching it.
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i]?.trim()
		if (!line || !line.startsWith('{') || !line.includes('"model"')) continue
		try {
			const entry = JSON.parse(line) as { message?: { model?: string } }
			const model = entry.message?.model
			if (model) return model
		} catch {
			// Truncated or non-conforming line; keep scanning upwards.
		}
	}
	return undefined
}

/** Model ids of subagents that appear to be running right now, one entry per agent. */
export function activeSubagents(transcriptPath: string | undefined, now = Date.now()): string[] {
	if (!transcriptPath) return []
	const dir = subagentsDir(transcriptPath)

	let entries: { path: string; mtimeMs: number }[]
	try {
		entries = readdirSync(dir)
			.filter((name) => name.startsWith('agent-') && name.endsWith('.jsonl'))
			.map((name) => {
				const path = join(dir, name)
				return { path, mtimeMs: statSync(path).mtimeMs }
			})
	} catch {
		// No subagents directory is the normal case for a session that never spawned one.
		return []
	}

	return entries
		.filter((entry) => now - entry.mtimeMs < ACTIVE_WINDOW_MS)
		.sort((a, b) => b.mtimeMs - a.mtimeMs)
		.slice(0, MAX_FILES)
		.map((entry) => lastModel(entry.path))
		.filter((model): model is string => model != null)
}

/** Renders active subagents grouped by model family, e.g. `⑂ 2×Fable 1×Haiku`. */
export function formatSubagents(models: string[]): string | undefined {
	if (models.length === 0) return undefined

	const counts = new Map<string, number>()
	for (const model of models) {
		const family = modelFamily(model)
		counts.set(family, (counts.get(family) ?? 0) + 1)
	}

	const groups = [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([family, count]) => `${count}×${family}`)

	return `${color('⑂', DIM)} ${color(groups.join(' '), MAGENTA)}`
}
