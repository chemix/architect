#!/usr/bin/env bun
// Two-line Claude Code status line.
//
//   ◆ Opus 5 [1M] ·xhigh ·think  █▏░ 38%  ⑂ 2×Fable
//   5h ▎░░ 7% ·2h13m │ 7d ▍░░ 13% ·2d1h │ ✦ ▍░░ 12% │ Architect ⎇ main*
//
// Everything except the Fable weekly quota comes from the stdin payload. Nothing here may block
// on the network — see usage.ts for how the Fable number is fetched out of band.

import { basename } from 'node:path'

import { gitInfo } from './git'
import { num, readInput, toEpochMs, type StatusInput } from './input'
import { modelLabel } from './models'
import { activeSubagents, formatSubagents } from './subagents'
import { readUsage } from './usage'
import {
	BLUE,
	DIM,
	GREY,
	MAGENTA,
	RESET,
	bar,
	color,
	elapsedPercent,
	fitLine,
	heatColor,
	paceColor,
	terminalWidth,
	untilText,
} from './render'

const FIVE_HOUR_MS = 5 * 60 * 60 * 1000
const SEVEN_DAY_MS = 7 * 24 * 60 * 60 * 1000

// Three cells is plenty: `bar()` renders at eighth-of-a-cell resolution, so this is 24 levels.
const CONTEXT_BAR_WIDTH = 3
const WINDOW_BAR_WIDTH = 3

function modelSegment(input: StatusInput): string {
	// display_name can carry a trailing qualifier such as "Opus 5 (1M context)". Strip it: the
	// window size already drives the [1M] badge below, and repeating it wastes scarce width.
	const label = input.model?.display_name?.trim().replace(/\s*\([^)]*\)\s*$/, '') || modelLabel(input.model?.id)
	const parts = [color(`◆ ${label}`, MAGENTA)]

	// Extended context is a property of the window size, not of the model name.
	if (num(input.context_window?.context_window_size) === 1_000_000) {
		parts.push(color('[1M]', BLUE))
	}

	const flags: string[] = []
	const effort = input.effort?.level
	if (effort) flags.push(`·${effort}`)
	if (input.thinking?.enabled) flags.push('·think')
	if (input.fast_mode) flags.push('·fast')
	if (flags.length > 0) parts.push(color(flags.join(' '), DIM))

	// `agent.name` is set only when the session itself runs under --agent.
	const agentName = input.agent?.name
	if (agentName) parts.push(color(`@${agentName}`, BLUE))

	return parts.join(' ')
}

function contextSegment(input: StatusInput): string | undefined {
	const pct = num(input.context_window?.used_percentage)
	// Null before the first API call and again right after /compact.
	if (pct == null) return color('ctx —', GREY)
	const rounded = Math.round(pct)
	return `${bar({ width: CONTEXT_BAR_WIDTH, pct, color: heatColor(pct) })} ${color(`${rounded}%`, heatColor(pct))}`
}

function windowSegment(
	label: string,
	window: { used_percentage?: number | null; resets_at?: number | string | null } | null | undefined,
	windowMs: number,
): string | undefined {
	const pct = num(window?.used_percentage)
	if (pct == null) return undefined

	const resetsAt = toEpochMs(window?.resets_at)

	// A reset timestamp in the past means this snapshot outlived its window: Claude Code only
	// refreshes rate_limits on an API response, so an idle session keeps serving the numbers from
	// a window that has already rolled over. Render those greyed out with a `~` instead of
	// presenting a percentage that is no longer true.
	if (resetsAt != null && resetsAt <= Date.now()) {
		return `${color(label, DIM)} ${color(`${Math.round(pct)}%~`, GREY)}`
	}

	// `elapsed` no longer draws a marker in the bar — at three cells there is no room — but it
	// still drives the colour, which is where the pacing signal lives now.
	const elapsed = elapsedPercent(resetsAt, windowMs)
	const tone = paceColor(pct, elapsed)
	const until = untilText(resetsAt)

	const rendered = [
		color(label, DIM),
		bar({ width: WINDOW_BAR_WIDTH, pct, color: tone }),
		color(`${Math.round(pct)}%`, tone),
	]
	if (until) rendered.push(color(`·${until}`, GREY))
	return rendered.join(' ')
}

function fableSegment(usage: { fablePct?: number; fableResetsAtMs?: number; stale: boolean } | undefined): string | undefined {
	if (usage?.fablePct == null) return undefined
	const elapsed = elapsedPercent(usage.fableResetsAtMs, SEVEN_DAY_MS)
	const tone = paceColor(usage.fablePct, elapsed)
	const suffix = usage.stale ? color('~', GREY) : ''
	const gauge = bar({ width: WINDOW_BAR_WIDTH, pct: usage.fablePct, color: tone })
	return `${color('✦', DIM)} ${gauge} ${color(`${Math.round(usage.fablePct)}%`, tone)}${suffix}`
}

function locationSegment(input: StatusInput): string | undefined {
	const dir = input.workspace?.current_dir ?? input.cwd
	if (!dir) return undefined
	const parts = [color(basename(dir), BLUE)]
	const git = gitInfo(dir)
	if (git) {
		parts.push(color(`⎇ ${git.branch}${git.dirty ? '*' : ''}`, git.dirty ? GREY : DIM))
	}
	return parts.join(' ')
}

async function build(input: StatusInput): Promise<string[]> {
	const width = terminalWidth()
	const usage = readUsage()
	const subagents = formatSubagents(activeSubagents(input.transcript_path))

	const first = fitLine([modelSegment(input), contextSegment(input), subagents], '  ', width)

	const separator = color(' │ ', GREY)
	const second = fitLine(
		[
			windowSegment('5h', input.rate_limits?.five_hour, FIVE_HOUR_MS),
			windowSegment('7d', input.rate_limits?.seven_day, SEVEN_DAY_MS),
			fableSegment(usage),
			locationSegment(input),
		],
		separator,
		width,
	)

	return second ? [first, second] : [first]
}

const input = await readInput()
try {
	const lines = await build(input)
	process.stdout.write(`${lines.join('\n')}\n`)
} catch {
	// A status line must never surface a stack trace into the UI.
	const label = input.model?.display_name ?? modelLabel(input.model?.id)
	const pct = num(input.context_window?.used_percentage)
	process.stdout.write(`◆ ${label}${pct == null ? '' : ` · ${Math.round(pct)}%`}${RESET}\n`)
}
