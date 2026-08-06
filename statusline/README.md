# Claude Code status line

Two-line status line rendered by Bun.

```
◆ Opus 5 [1M] ·xhigh ·think  █▏░ 38%  ⑂ 2×Fable
5h ▎░░ 7% ·2h13m │ 7d ▍░░ 13% ·2d1h │ ✦ ▍░░ 12% │ Architect ⎇ main*
```

| Element | Meaning |
|---|---|
| `◆ Opus 5 [1M]` | Active model; `[1M]` when the context window is 1M rather than 200k |
| `·xhigh ·think ·fast` | Reasoning effort, extended thinking, fast mode |
| `█▏░ 38%` | Main context window fill |
| `⑂ 2×Fable` | Subagents working right now, grouped by model family |
| `5h` / `7d` | Rate-limit windows |
| `✦ 12%` | Fable weekly quota (`~` suffix = value is stale, refresh in flight) |
| `Architect ⎇ main*` | Directory and git branch; `*` means uncommitted changes |

Bar colors compare consumption against elapsed time in the window: green means the remaining
budget outlasts the remaining time, red means it will not. Pacing is suppressed during the
first 10% of a window, where the ratio is pure noise. Color is the *only* pacing signal — there
is no room for a marker glyph in a three-cell bar, and it was duplicating what the color said.

## Why the bars are three characters wide

Each cell renders at eighth-of-a-cell resolution using Block Elements (`▏▎▍▌▋▊▉█`), so three
cells carry **24 levels**, not 4. That precision is load-bearing rather than decorative: the
rate-limit windows spend most of their life in the 0–15% band, and with whole-cell blocks 0%, 3%,
7% and 13% all render as an identical empty bar.

Two rules in `bar()` keep it from lying:

- a non-zero reading always fills at least one eighth, so 0.4% never looks like 0%
- anything under 100% is capped one eighth short of solid, so `███` means genuinely full

```
  0% ░░░      38% █▏░
  3% ▏░░      50% █▌░
  7% ▎░░      77% ██▎
 13% ▍░░     100% ███
```

## Files

| File | Role |
|---|---|
| `statusline.ts` | Entry point — reads stdin JSON, assembles both lines |
| `input.ts` | stdin payload types and defensive coercion |
| `models.ts` | Model id → display label |
| `render.ts` | Colors, bars, pacing, duration formatting, width fitting |
| `git.ts` | Branch (via `.git/HEAD`) and dirty flag (cached `git status`) |
| `subagents.ts` | Live subagent detection |
| `usage.ts` | Fable quota cache reader; spawns refresh when stale |
| `usage-refresh.ts` | Detached background fetch of `/api/oauth/usage` |
| `cache/` | `usage.json` (180s TTL) and `usage.lock` (30s min gap, 300s after a 429) |

## Data sources

Everything except the Fable quota comes from the JSON Claude Code pipes in on stdin — the 5h and
7d windows included, so those are always fresh and cost nothing.

The Fable weekly quota is not on stdin. It comes from `GET https://api.anthropic.com/api/oauth/usage`
using the OAuth token in the macOS keychain (`Claude Code-credentials`). Two things to know about
that response:

- Per-model quotas live in `limits[]` as `kind: "weekly_scoped"`, matched on
  `scope.model.display_name`. The flat `seven_day_opus` / `seven_day_sonnet` keys return `null`
  even for models with real usage, so they are only a fallback.
- An entry with `percent: 0` and `resets_at: null` is a placeholder, not a real window, and is
  discarded — otherwise the bar shows a confident 0% for a quota we know nothing about.

There is no monthly rate-limit window. The only monthly figure is `extra_usage` (a spend cap,
cached but not displayed while it is disabled on this account).

Timestamps arrive in two encodings: `rate_limits.*.resets_at` on stdin is unix epoch **seconds**,
while `resets_at` from the usage API is an **ISO 8601 string**. `toEpochMs` in `input.ts` handles
both. (Verified against live data: stdin `1786096800` and the API's `2026-08-07T10:00:00Z` are the
same instant.)

Claude Code refreshes `rate_limits` only on an API response, so an idle session keeps serving
numbers from a window that has already rolled over — observed in the wild as `23%` attached to a
5-hour reset 14 hours in the past. When `resets_at` is already behind us the window renders as a
greyed `5h 23%~` with no bar, rather than a confident percentage that is no longer true.

`model.display_name` may carry a trailing qualifier (`"Opus 5 (1M context)"`). It is stripped —
the `[1M]` badge is derived from `context_window_size`, so keeping both would duplicate it.

## Why the network never blocks

The status line runs on every assistant message. `usage.ts` only reads the local cache; when it is
older than 180s it spawns `usage-refresh.ts` detached and renders the stale value immediately. A
lock file caps refresh attempts at one per 30s across all sessions.

## Configuration

`~/.claude/settings.json`:

```json
"statusLine": {
  "type": "command",
  "command": "/Users/chemix/.bun/bin/bun /Users/chemix/Architect/repo/statusline/statusline.ts",
  "padding": 0,
  "refreshInterval": 10
}
```

`refreshInterval` is load-bearing, not cosmetic: event-driven updates go quiet while the main
session waits on background subagents — exactly when the `⑂` segment matters most.

The absolute path to `bun` is deliberate; the command runs in a shell that may not have
`~/.bun/bin` on `PATH`.

## Testing

```bash
echo '{"model":{"id":"claude-opus-5","display_name":"Opus 5"},
       "context_window":{"used_percentage":38,"context_window_size":1000000},
       "effort":{"level":"xhigh"},
       "rate_limits":{"five_hour":{"used_percentage":7,"resets_at":1785940000}}}' \
  | bun ~/Architect/repo/statusline/statusline.ts
```

Worth covering: missing `rate_limits` (before the first API response), `used_percentage: null`
(fresh session and right after `/compact`), `{}`, and `COLUMNS=60`. Every case must print without
throwing; segments drop from the end of each line when the terminal is too narrow.

Force a usage refresh with `bun ~/Architect/repo/statusline/usage-refresh.ts` and inspect
`cache/usage.json`.
