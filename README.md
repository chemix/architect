# architect

Repo with scripts, skills, and more for agentic work — versioned so it can be shared across machines.

## `bin/`

Personal command-line scripts. They use a leading-comma naming convention (`,auto-git`, …) so
they're easy to tab-complete and never collide with system commands.

- **`,auto-git`** — stages all changes and asks Claude (`claude --print`) to group the staged
  diff into one or more logically cohesive conventional commits. Run it from inside any git repo.
- **`,git-status`** — read-only "is everything committed?" check. Clean tree: one line + last
  3 commits. Dirty tree: change counts, a one-sentence AI summary of the changes (Claude haiku,
  falls back to a plain file list when `claude` is unavailable), and the last 3 commits.
- **`,git-log`** — scrollable two-pane view of recent commits, built on `fzf`. Top pane lists
  one commit per line (hash, bold subject, author, age); the bottom pane shows the full message
  and `--stat` of the highlighted commit. Typing fuzzy-filters the list, arrows move, `Enter`
  opens the full diff in the pager, `Esc` quits. `-n <count>` sets how many commits to list
  (default 30); any other
  arguments are passed to `git log`, e.g. `,git-log -n 10 main..feature -- README.md`.
- **`,deploy`** — finds the nearest `bin/deploy` (or `bin/deploy.sh`) by walking up from the
  current directory and runs it from the project root, passing any arguments through. The search
  stops at the git repository root. A script found two or more levels up is confirmed first,
  with its full path, so you never deploy the wrong project by accident; `-y` skips the prompt
  and `-n` shows what would run.

### Setup on a new machine

```sh
git clone git@github.com:chemix/architect.git ~/Architect/repo
echo 'export PATH="$HOME/Architect/repo/bin:$PATH"' >> ~/.zshrc
exec zsh
```

Adding a new script is just: drop an executable file in `bin/`, commit, and push — it's on PATH
automatically.

## `statusline/`

The two-line status line Claude Code renders under the prompt, written in TypeScript and executed
by Bun. The top line covers the current session — active model, reasoning effort, context-window
fill, and any subagents running right now. The bottom line covers budget and place — the 5h and 7d
rate-limit windows with their reset countdowns, the Fable weekly quota, and the working directory
with its git branch. Bar color encodes pacing: green when the remaining budget outlasts the
remaining time in the window, red when it does not. Everything except the weekly quota comes from
the JSON Claude Code pipes in on stdin, so a render costs nothing; the quota is read from a local
cache that a detached background process refreshes, which is why the network never blocks the
prompt.

See [`statusline/README.md`](statusline/README.md) for the full documentation — segment reference,
data sources, and the reasoning behind the bar rendering.

### Setup on a new machine

The status line is not picked up from the repo automatically; Claude Code has to be told to run it.
Add a `statusLine` block to `~/.claude/settings.json` pointing at the checkout:

```json
"statusLine": {
  "type": "command",
  "command": "/Users/chemix/.bun/bin/bun /Users/chemix/Architect/repo/statusline/statusline.ts",
  "padding": 0,
  "refreshInterval": 10
}
```

Both paths are absolute on purpose: the command runs in a shell that may not have `~/.bun/bin` on
`PATH`, and the working directory is the project being edited, not this repo. `refreshInterval` is
load-bearing rather than cosmetic — event-driven updates go quiet while the session waits on
background subagents, which is exactly when the subagent segment is worth showing.

Nothing needs installing to *run* it — Bun executes the TypeScript directly. To typecheck, run
`bun install` inside `statusline/` first; that pulls `@types/bun` and `typescript`, which are
dev-only and gitignored, then `bun x tsc --noEmit`.
