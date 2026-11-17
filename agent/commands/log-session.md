---
description: Wrap up the current session by committing its work with well-shaped messages (terse subject + Why / What / How-it-works-now body), following the `git-activity` skill.
---

# /log-session

End-of-session commit flow. The session's substantive changes become one or more local commits whose bodies record the *why* the diff can't — so `git log` doubles as the project's activity log. **The message format lives in the `git-activity` skill** (subject, body sections, `Co-Authored-By` trailer); this command only covers the flow around it and never overrides the format. Project-specific checks and post-commit steps live in the repository's `DEPLOY.md`, not here — so this command stays the same in every project.

## When to use it

- After substantive work, before signing off, when the working tree holds changes that form a coherent result.
- When the user invoked `/log-session`, or agreed after you suggested committing.

If some of the changes are still exploratory or unfinished, say so and leave them out rather than committing them alongside finished work.

## What done looks like

- Every finished change from the session is committed, one concern per commit, each message following `git-activity` (subject in the repository's existing convention, `Co-Authored-By` trailer for the model that wrote the work).
- Nothing unintended is staged, and the user saw and approved each commit before it was made.
- The user knows which post-commit steps `DEPLOY.md` requires for what was committed (restart, migration, config, re-publishing) — and none of them was performed.
- Nothing is pushed or deployed.

## Flow

1. **Survey.** Read `git status`, `git diff`, `git diff --staged` and `git log --oneline -20` (to pick up the subject convention). Understand the diff well enough to write an honest body. If the repository has a `DEPLOY.md` in its root, read it too.
2. **Decide the boundaries.** If the session touched unrelated things, propose separate commits and an order. Don't merge them for tidiness.
3. **Check before staging.**
   - No secrets, local config, credentials, or tokens in the diff.
   - No stray build artifacts or large binaries unless they're deliberate.
   - The project's verification gate for this kind of change has passed (`DEPLOY.md`, README, CONTRIBUTING, AGENTS.md / CLAUDE.md, or the manifest's scripts). If it hasn't been run this session, run it now and report failures before going further. For user-facing changes, a manual or browser check where practical.
4. **Show the draft.** Present each proposed commit's subject, body, and file list, and wait for the user to confirm. Nothing is staged or committed before that.
5. **Stage explicitly.** Add files by path. Avoid `git add -A` / `git add .`, which can sweep in local config, scratch files, or build output.
6. **Commit with a HEREDOC** so the multi-line body keeps its formatting.
7. **Show the result.** `git status` (clean, or only the deliberately deferred files) and `git log -1 --stat` for each commit.

## After committing

`/log-session` commits locally only. Pushing, opening a PR, or deploying are separate actions for the user to take or request.

Match the committed files against `DEPLOY.md` and tell the user which of its steps now apply (e.g. "server code changed → restart needed, use `/deploy`"). Put the same steps into the commit's `Deploy notes`. If there is no `DEPLOY.md` and the commit clearly needs something beyond the normal release flow, say so and suggest adding it to a `DEPLOY.md`.

## DEPLOY.md

A short, versioned file in the repository root that answers: *after committing these files, what has to be checked or done before the change is live?* It holds only project-specific steps; the commit flow itself stays here. Keep it to a verification gate plus a table keyed by changed paths — no prose runbooks (link to them instead). Neither `/log-session` nor any other command performs these steps on its own.

```markdown
# DEPLOY.md

What to verify and do after a commit, by which files changed. Steps that
restart services or touch the server always need the user's confirmation.

## Verification gate

`npm run check` (types + tests) must pass. For a running-app check without
touching production: `scripts/dev-instance.sh`.

## Steps by changed files

| Change | What is needed | How |
|---|---|---|
| `src/**`, `package.json`, lockfile | rebuild + restart the app | `npm run build && sudo systemctl restart myapp`, then `curl -fsS localhost:8080/healthz` |
| `migrations/**` | run migrations before the restart | `npm run migrate` |
| new variable in `.env.example` | add it to the server's env file | `/etc/myapp/myapp.env`, then restart |
| `deploy/*.service` | copy units + reload | `sudo cp deploy/*.service /etc/systemd/system/ && sudo systemctl daemon-reload` |
| only `docs/`, `*.md`, `tests/` | nothing | — |
```

Rows name concrete paths or globs so they can be matched against `git diff --name-only`; the "How" column gives the exact command or a link to where it is described. Add a row whenever a commit needed a step nobody wrote down.

## Example

```
> /log-session

I've reviewed the diff. The session touched two separate concerns:
  1. The order edit dialog not opening in the admin
  2. A regression test pinning the price calculation

Proposed commits:

  [1/2] fix(admin): open order edit dialog again
        Why: ...
        What: ...
        How it works now: ...
        Verified: test suite green, linter clean
        Deploy notes: frontend changed → rebuild + restart (DEPLOY.md)
        Co-Authored-By: ...
        Files: src/admin/OrderDetail.tsx, src/admin/useDialog.ts

  [2/2] test(pricing): pin package price calculation
        Why: ...
        Files: tests/pricing.test.ts

After committing, DEPLOY.md requires: restart the app server (/deploy).

Stage and commit 1/2?
```
