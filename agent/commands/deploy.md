---
description: Deploy the current code following the repository's DEPLOY.md — first bring the tree to a clean, committed state, pass the verification gate, confirm, release, verify.
---

# /deploy

Release flow that stays the same in every project. What "deploy" means here — the release command, how to verify it, what must never be touched — lives in the repository's `DEPLOY.md` (section **Release**; format described in `/log-session`). This command only adds the discipline around it: the deployed code matches a specific commit, the gate passed, the user confirmed, and the result was actually checked.

## When to use it

- Finished, verified work (ideally after `/log-session`) should go live.
- The user invoked `/deploy` or said "deploy it".

If the repository has no `DEPLOY.md`, or it has no **Release** section, stop: say so and offer to write one with the user. Never guess a release command.

## What done looks like

- The deployed state is a specific commit (SHA + subject), on the intended branch, with a clean working tree.
- The verification gate from `DEPLOY.md` passed.
- The user confirmed the release before it ran (unless they authorized it up front).
- The release command ran and every check from the **Release** section passed — or the failure was reported with the logs, never as done.
- The user knows which steps from the `DEPLOY.md` table this command did not perform.

## Flow

1. **Check the tree.** `git status --short` and `git branch --show-current`. If the branch is not the one `DEPLOY.md` deploys from, stop and ask.
2. **Commit unfinished work.** If the tree is dirty, run the `/log-session` flow (format from `git-activity`, user confirms each commit, stage by path). Afterwards the tree must be clean; if it isn't, stop.
3. **Preflight.**
   - Run the verification gate from `DEPLOY.md`. On failure stop and show the raw output.
   - Match the commits since the last release against the `DEPLOY.md` table. List the steps beyond the release itself (config, units, migrations, images…) for the user; if one of them must happen *before* the release (e.g. a migration), stop until it's done or the user decides.
4. **Confirm.** Tell the user what will be released (SHA + subject) and what the release interrupts, and wait for confirmation.
5. **Release.** Run exactly the release command from `DEPLOY.md`.
6. **Verify.** Run every check from the **Release** section. If one fails, show the logs it names and report a failed deploy.
7. **Report.** Released SHA, check results, and the remaining `DEPLOY.md` steps nobody performed yet.

## Guardrails

- Never perform an action `DEPLOY.md` lists under **Never**.
- No `git add -A` / `git add .` — stage by path.
- No release with a failing gate or a dirty tree.
- No push, unless `DEPLOY.md` says pushing *is* the release.
- Nothing outside the release command and its checks — other steps from the table are listed, not run.
