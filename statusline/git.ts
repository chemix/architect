// Minimal, fast git info for the status line: branch name plus a dirty flag.
//
// The branch comes from reading `.git/HEAD` directly — no subprocess, so it is always available
// even when `git status` is slow or times out on a large repo. The dirty flag needs a real
// `git status`, which is spawned with a hard timeout and cached briefly — including the
// "could not determine" outcome, so a repo that keeps timing out doesn't pay the full
// timeout on every render.

import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const STATUS_TIMEOUT_MS = 250
const CACHE_TTL_MS = 5_000

export interface GitInfo {
	branch: string
	dirty: boolean
}

/** Walks up from `dir` to find the `.git` entry (a directory, or a file in linked worktrees). */
function findGitPath(dir: string): string | undefined {
	let current = dir
	for (let depth = 0; depth < 40; depth++) {
		const candidate = join(current, '.git')
		try {
			const stats = statSync(candidate)
			if (stats.isDirectory()) return candidate
			if (stats.isFile()) {
				// Linked worktree / submodule: the file contains `gitdir: <path>`.
				const pointer = readFileSync(candidate, 'utf8').trim()
				const match = /^gitdir:\s*(.+)$/.exec(pointer)
				if (!match) return undefined
				const target = match[1]!
				return target.startsWith('/') ? target : join(current, target)
			}
		} catch {
			// Not here; keep walking up.
		}
		const parent = dirname(current)
		if (parent === current) break
		current = parent
	}
	return undefined
}

function readBranch(gitPath: string): string | undefined {
	try {
		const head = readFileSync(join(gitPath, 'HEAD'), 'utf8').trim()
		const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(head)
		if (ref) return ref[1]
		// Detached HEAD: show a short SHA.
		return head.length >= 7 ? head.slice(0, 7) : undefined
	} catch {
		return undefined
	}
}

function cachePath(cwd: string): string {
	const key = Bun.hash(cwd).toString(16)
	return join(tmpdir(), `cc-statusline-git-${key}.json`)
}

/** `null` means a cached "could not determine"; `undefined` means no usable cache. */
function readDirtyCache(cwd: string): boolean | null | undefined {
	try {
		const file = cachePath(cwd)
		if (Date.now() - statSync(file).mtimeMs > CACHE_TTL_MS) return undefined
		const parsed = JSON.parse(readFileSync(file, 'utf8')) as { dirty?: boolean | null }
		if (typeof parsed.dirty === 'boolean' || parsed.dirty === null) return parsed.dirty
		return undefined
	} catch {
		return undefined
	}
}

function writeDirtyCache(cwd: string, dirty: boolean | null): void {
	try {
		Bun.write(cachePath(cwd), JSON.stringify({ dirty }))
	} catch {
		// A failed cache write is not worth degrading the status line over.
	}
}

function computeDirty(cwd: string): boolean | undefined {
	try {
		const result = Bun.spawnSync(['git', 'status', '--porcelain=v1'], {
			cwd,
			timeout: STATUS_TIMEOUT_MS,
			stdout: 'pipe',
			stderr: 'ignore',
		})
		if (result.exitCode !== 0) {
			// Cache the unknown outcome too, so a failing/timing-out repo doesn't re-pay
			// the spawn timeout on every render.
			writeDirtyCache(cwd, null)
			return undefined
		}
		const dirty = result.stdout.toString().trim().length > 0
		writeDirtyCache(cwd, dirty)
		return dirty
	} catch {
		writeDirtyCache(cwd, null)
		return undefined
	}
}

export function gitInfo(cwd: string | undefined): GitInfo | undefined {
	if (!cwd) return undefined
	const gitPath = findGitPath(cwd)
	if (!gitPath) return undefined
	const branch = readBranch(gitPath)
	if (!branch) return undefined
	// A cached null (unknown) still counts as a hit — only recompute when there is no cache.
	const cached = readDirtyCache(cwd)
	const dirty = cached !== undefined ? (cached ?? false) : (computeDirty(cwd) ?? false)
	return { branch, dirty }
}
