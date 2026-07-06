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

### Setup on a new machine

```sh
git clone git@github.com:chemix/architect.git ~/Architect/repo
echo 'export PATH="$HOME/Architect/repo/bin:$PATH"' >> ~/.zshrc
exec zsh
```

Adding a new script is just: drop an executable file in `bin/`, commit, and push — it's on PATH
automatically.
