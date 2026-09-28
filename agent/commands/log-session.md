---
description: Wrap up the current session by committing the work with a properly-shaped message (terse area+subject + why/what/how-it-works-now body). Follows the `git-activity` skill.
---

# /log-session

End-of-session commit flow. The session's substantive changes become one (or more) git commits whose bodies carry the *why* the diff cannot recover — so `git log` doubles as surfcamp's activity log.

## When to run

- After substantive work, before signing off.
- Working tree has uncommitted changes that represent a coherent session.
- The user agreed to commit (either explicitly invoked `/log-session`, or said yes when you proactively suggested it).

Do NOT run mid-session, on a dirty tree where some changes are exploratory and not yet ready, or when the user hasn't confirmed.

## What the command does

1. **Survey the work** — `git status` and `git diff` (and `git diff --staged` if anything is already staged). Read the diff well enough to write an honest "Why / What / How it works now" body.
2. **Decide the commit boundary.** One concern per commit. If the session touched two unrelated things (e.g. an order-form rework AND an admin auth fix), propose splitting into two commits and let the user pick the order. Don't merge for tidiness.
3. **Draft the message** following the format defined in `.claude/skills/git-activity/SKILL.md`:
   - Subject ≤ 60 chars: lowercase area word + imperative, no colon prefix (`admin fix ...`, `model delete ...`, `front simplify ...`).
   - Body sections: `Why`, `What`, `How it works now`, optional `Verified`, optional `Deploy notes`, optional `Follow-ups`.
   - Reference related commits by short SHA + subject; memories by `[[slug]]`; phase docs by `(Fáze 1, step N)`.
   - On substantive commits, include the `Co-Authored-By: <current model name> <noreply@anthropic.com>` trailer — use the name of the model actually authoring the commit, not one copied from history (omit on trivial ones).
4. **Show the user the draft** (subject + body) and the file list to be staged. Wait for confirmation. Do not stage or commit before they say go.
5. **Stage explicitly** — list files by path; never `git add -A` / `git add .` (avoids accidentally staging `config.local.neon`, build artifacts, scratch files).
6. **Commit via HEREDOC** so the multi-line body keeps its formatting. Include the `Co-Authored-By` trailer on substantive commits (see step 3).
7. **Verify** — `git status` (should show clean tree or only the deliberately-deferred files) and `git log -1 --stat` so the user sees what landed.

## Pre-commit checks

Before staging, confirm (see `TESTING.md` for the full runbook):

- No secrets (`config.local.neon`, credentials, tokens) in the diff.
- No stray build artifacts or large binaries unless deliberate.
- If PHP/model/presenter code changed, `composer test` passes (build-test-db → Nette Tester → PHPStan). If not run yet this session, run it now and surface any failures before committing.
- If only templates / public SCSS or JS assets changed, the PHPStan/Tester gate is optional — say so to the user, but still do a browser check (`agent-browser`) for anything visual, and lint with `vendor/bin/latte-lint app` / `vendor/bin/neon-lint app` where relevant.

## Deploy follow-up

There is nothing to restart. Staging (`surfcamp-php8.lithium.klab.cz`) already serves this working tree, so the change is live there without any deploy step (see `[[staging-serves-working-tree]]`). Going to production is a separate, explicit user action: `./bin/deploy` (= `git push live registrace:production`; the source branch is configured in `bin/deploy`, which is authoritative), which ships the committed `vendor/` and build output. If the commit touches anything release-sensitive, remind the user about the pre-release steps in `RELEASE.md`. Do NOT deploy automatically.

## Do not push

`/log-session` commits locally only. Pushing / deploying is a separate user action.

## Example flow

```
> /log-session

I've reviewed the diff. The session touched two concerns:
  1. Admin order-edit modal not opening (Latte template + toggle script)
  2. A regression test pinning the price math (Nette Tester)

Proposing two commits:

  [1/2] admin fix order edit modal not opening in OrdersDetail
        Why: ...
        What: ...
        How it works now: ...
        Verified: composer test green, latte-lint clean
        Files: app/modules/Admin/.../OrdersDetail.latte, .../OrdersDetailPresenter.php

  [2/2] test pin package price math in Pricing.phpt
        Why: ...
        ...
        Files: tests/integration/Pricing.phpt

Ready to stage commit 1/2?
```
