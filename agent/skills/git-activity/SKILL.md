---
name: git-activity
description: Commit-message convention that turns `git log` into a readable activity log — a terse subject plus a Why / What / How-it-works-now body. Use when writing any non-trivial commit, and in particular for `/log-session` wrap-ups.
---

# git-activity

The git history is the project's activity log. A commit written today is often the only record a later session (human or agent) will have of *why* something changed, so write it for that reader: someone who has the diff but not the conversation that produced it.

## The shape

```
<subject — area + imperative, ≤ 60 chars, no trailing period>

Why
  One short paragraph or 2–4 bullets. The problem, constraint,
  request, or incident that drove the change — the human-level
  motivation, not "the code needed it". Reference the earlier
  commit, issue, or note that prompted it if there is one.

What
  The concrete changes, grouped by theme rather than file by file
  (unless a file is the unit). Mark new files with `(new)`. Skip
  what the diff already makes obvious; focus on intent.

How it works now
  How the system behaves after this commit, in one paragraph. This
  is what someone reading `git log` months later uses to understand
  the current state without opening the source.

[optional] Verified
  What was actually run to prove it works: test suite, linter,
  type checker, a manual or browser check, a dry run.

[optional] Deploy notes
  Only when releasing this commit needs something beyond the
  project's normal flow (a migration, config change, restart,
  manual step). Most commits don't need this section.

[optional] Follow-ups
  Open threads, deferred work, known gaps. One bullet each.

[substantive commits] Co-Authored-By trailer (see below).
```

For a small change the body can collapse to a few sentences or bullets without the headings; the goal is that the *why* is recoverable, not that every section is filled.

## Why this shape

- **Terse subject** keeps `git log --oneline` scannable. A subject that won't fit in 60 characters usually means the commit holds two changes.
- **Why before what** because the diff already shows *what*; the motivation is the part it cannot recover.
- **How it works now** lets a reader reconstruct the system from the last few commits without opening files.
- **Verified** tells the reader how much to trust the change.

## Subject line

Follow the convention already in the repository's history — check `git log --oneline -20` first. If the project uses Conventional Commits (`feat(scope): ...`, `fix: ...`), keep using them. If there is no established convention, use a **lowercase area word + imperative**, where the area names the part of the system touched (e.g. `api`, `ui`, `db`, `build`, `test`, `docs`, `ci`, `deps`).

Good:
- `api return 404 instead of 500 for unknown order ids`
- `fix(auth): refresh expired tokens before retrying`
- `docs describe the backup restore procedure`

Avoid:
- `Update OrderService.php` — no intent, no area
- `Various fixes` — no scope
- `WIP` / `stuff` — says nothing to a later reader

## One commit, one concern

If a session changed a form *and* fixed an unrelated auth bug, that is two commits. Split them even when one combined commit would look tidier; separate commits can be reverted, bisected, and read on their own.

## Co-Authored-By

Substantive commits that an AI agent co-authored carry a trailer naming the model that actually wrote the change. When the harness supplies an attribution line (Claude Code does, via a system reminder), use it verbatim — it takes precedence over this file. Otherwise use the current model's name, for example:

```
Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
```

Don't copy a model name from older commits — it is likely out of date. Trivial commits (typo fixes, memory/notes updates) can omit the trailer.

## Anti-patterns

- **Restating the diff in prose.** "Changed line 42 from X to Y" — the diff already says that.
- **Narrating the session.** "First I tried X, then Y failed, finally Z." The reader wants the final state; mention a rejected approach only if it explains why the obvious fix wasn't used.
- **Vague claims.** "Improved styling", "cleaned up code" — say what changed and why the old state was wrong.
- **Empty bodies on non-trivial commits.** If the subject tells the whole story, fine; otherwise write the body.

## Cross-linking

- Earlier commits: short SHA + subject, e.g. `Builds on 52c6dae (api unify order reads)`.
- Issues and PRs: `#123`, or the tracker's ID.
- Agent memory or notes, where the project keeps them: by slug, e.g. `[[staging-serves-working-tree]]`.

## Before committing

1. `git status` — nothing unintended staged.
2. `git diff --staged` — the message should be defensible against exactly this diff.
3. No secrets, local config, credentials, or stray build artifacts staged.
4. The project's own gate for this kind of change has passed (tests, linters, type checks, a manual check for user-facing changes). Look for it in the README, CONTRIBUTING, AGENTS.md / CLAUDE.md, or the package manifest's scripts. If something wasn't run, say so in the message instead of implying it was.

## Writing new skills and commands in the same spirit

- **One job per artifact.** `/log-session` commits a session; it doesn't also deploy or post a summary. New responsibilities get new commands.
- **Lead with the why.** Open with a short motivation so a later session knows when to use it and when not to.
- **Reference, don't duplicate.** A command that depends on a skill links to it instead of restating the rules.
- **Describe the outcome.** State what "done" looks like and which checks matter; let the agent sequence the work.
