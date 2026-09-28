---
description: Wrap up the current session by committing its work with well-shaped messages (terse subject + Why / What / How-it-works-now body), following the `git-activity` skill.
---

# /log-session

End-of-session commit flow. The session's substantive changes become one or more local commits whose bodies record the *why* the diff can't — so `git log` doubles as the project's activity log. The message format lives in the `git-activity` skill; this command only covers the flow around it.

## When to use it

- After substantive work, before signing off, when the working tree holds changes that form a coherent result.
- When the user invoked `/log-session`, or agreed after you suggested committing.

If some of the changes are still exploratory or unfinished, say so and leave them out rather than committing them alongside finished work.

## What done looks like

- Every finished change from the session is committed, one concern per commit.
- Each message follows `git-activity`: subject in the repository's existing convention, body with Why / What / How it works now, and Verified when something was checked.
- Substantive commits carry the `Co-Authored-By` trailer for the model that authored the work — the harness-provided attribution line if there is one, otherwise the current model's name (e.g. `Claude Opus 5.5 (1M context)`), never a name copied from history.
- Nothing unintended is staged, and the user saw and approved each commit before it was made.
- Nothing is pushed or deployed.

## Flow

1. **Survey.** Read `git status`, `git diff`, and `git diff --staged`, plus `git log --oneline -20` to pick up the subject convention. Understand the diff well enough to write an honest body.
2. **Decide the boundaries.** If the session touched unrelated things, propose separate commits and an order. Don't merge them for tidiness.
3. **Check before staging.**
   - No secrets, local config, credentials, or tokens in the diff.
   - No stray build artifacts or large binaries unless they're deliberate.
   - The project's verification gate for this kind of change has passed (tests, linters, type checks — see the README, CONTRIBUTING, AGENTS.md / CLAUDE.md, or the manifest's scripts). If it hasn't been run this session, run it now and report failures before going further. For user-facing changes, a manual or browser check where practical.
4. **Show the draft.** Present each proposed commit's subject, body, and file list, and wait for the user to confirm. Nothing is staged or committed before that.
5. **Stage explicitly.** Add files by path. Avoid `git add -A` / `git add .`, which can sweep in local config, scratch files, or build output.
6. **Commit with a HEREDOC** so the multi-line body keeps its formatting.
7. **Show the result.** `git status` (clean, or only the deliberately deferred files) and `git log -1 --stat` for each commit.

## After committing

`/log-session` commits locally only. Pushing, opening a PR, or deploying are separate actions for the user to take or request. If a commit needs something beyond the project's normal release flow (a migration, config change, restart), note it in the commit's Deploy notes and mention it to the user.

## Example

```
> /log-session

I've reviewed the diff. The session touched two separate concerns:
  1. The order edit dialog not opening in the admin
  2. A regression test pinning the price calculation

Proposed commits:

  [1/2] admin fix order edit dialog not opening
        Why: ...
        What: ...
        How it works now: ...
        Verified: test suite green, linter clean
        Files: src/admin/OrderDetail.tsx, src/admin/useDialog.ts

  [2/2] test pin package price calculation
        Why: ...
        Files: tests/pricing.test.ts

Stage and commit 1/2?
```
