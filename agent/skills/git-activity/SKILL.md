---
name: git-activity
description: Project convention for commit messages on surfcamp. Use when authoring any commit on this repo — especially `/log-session` wrap-ups. Defines the terse-subject / rich-body format that makes `git log` usable as the session activity log.
---

# git-activity

Git history is surfcamp's activity log. A commit you write today is the only thing a future session (or future you) will have to reconstruct *why* the change happened. Optimize for that reader.

## The shape

```
<subject — area + imperative, ≤ 60 chars, no period>

Why
  One short paragraph or 2–4 bullets. What problem, constraint,
  user request, or incident drove this? Not "the code needed it"
  — the human-level motivation. If a memory or earlier commit
  prompted it, reference the slug or short SHA.

What
  Concrete changes, grouped thematically (not file-by-file unless
  the file IS the unit). Mention new files with `(new)`. Skip
  anything trivially visible in the diff — focus on intent.

How it works now
  How the system behaves after this commit. One paragraph max.
  This is what someone running `git log` six months from now will
  read to understand current state without opening files.

[optional] Verified
  What you actually ran to prove it works — e.g. "composer test
  green (9), PHPStan clean, latte-lint clean" or "browser smoke on
  staging". Matches the existing habit in the history.

[optional] Deploy notes
  Only if going live is operationally non-obvious for this commit
  (see "Deploy notes" below). Most commits don't need this.

[optional] Follow-ups
  Open threads, deferred work, or known gaps the next session
  should know about. One bullet each, no prose.

[for substantive commits] Co-Authored-By trailer (see below).
```

## Why this shape

- **Terse subject** — `git log --oneline` stays scannable. If the subject can't fit, the commit is probably two commits.
- **Why before what** — diffs already show *what*. Reviewers and future-you need the *why* that the diff cannot recover.
- **How it works now** — reading the last N commits should reconstruct the system without opening source.
- **Verified** — the history records what gate was run (`composer test`, PHPStan, browser smoke); keep that habit so a reader trusts the change.

## Subject line patterns

surfcamp subjects use a **lowercase area word + imperative**, no colon. The area
is the part of the system touched: `admin`, `model`, `front`, `mail`, `build`,
`test`, `docs`, `migrate`, `system`, `dev`. Reference a phase/plan doc in parens
when relevant (`(Fáze 1, step 5)`, `(done-faze-1 #1,#2)`).

Good:
- `admin fix order/surfer edit modals not opening in OrdersDetail`
- `model delete legacy nette/database repositories (Fáze 1, step 8)`
- `front simplify and modernize the order form (drop weight/height)`
- `docs sync ORM-unification progress — steps 3, 4, 8 done`

Avoid:
- `Update CampManager.php` (no intent, no area)
- `Various fixes` (no scope)
- `feat(admin): add order export per discussion` (conventional-commits colon prefix, jargon, hedge — surfcamp doesn't use these)

## One commit, one concern

If a session touched the order form *and* fixed an admin auth bug, that's two commits. The `/log-session` flow will propose splitting; resist the urge to merge them for tidiness.

## Co-Authored-By

Substantive commits carry the trailer (matches the existing history and the
harness commit rule). Fill in the name of the model actually authoring the
commit — don't copy a model name from an older commit:

```
Co-Authored-By: <current model name> <noreply@anthropic.com>
```

Omit it on trivial commits (e.g. "update agents memory", "add plan ...").

## Anti-patterns

- **Restating the diff in prose.** "Changed line 42 of CampManager.php from X to Y" — no. The diff already says that.
- **Writing the body as a changelog of your session.** "First I tried X, then Y didn't work, finally Z." The reader wants the final state, not the journey.
- **Vague hand-waves.** "Improved styling" / "cleaned up code" — say *what* improved and *why* the old state was wrong.
- **Empty bodies on non-trivial commits.** If the subject alone tells the whole story, fine. If not, write the body.

## Cross-linking

- Reference earlier commits by short SHA + subject: `Builds on 52c6dae (model unify Camp/Date reads+writes)`.
- Reference memory entries by slug in double brackets: `See [[staging-serves-working-tree]]`.
- Reference issues, PRs, or phase docs by `#N` / `(Fáze 1, step N)` when they exist.

## Verifying before committing

Before `git commit`, always:

1. `git status` — make sure nothing unintended is staged.
2. `git diff --staged` — the body of your commit message should be defensible against this diff.
3. No `config.local.neon`, secrets, or stray build artifacts staged.
4. Run the gate that matches the change (see `TESTING.md`): PHP/model/presenter → `composer test` (build-test-db → Nette Tester → PHPStan); narrower runs `composer phpstan` / `composer tester`; templates/config → `vendor/bin/latte-lint app`, `vendor/bin/neon-lint app`; user-facing → a browser check via the `agent-browser` skill.

## Deploy notes

surfcamp is **not** a service you restart. Two things to know:

- **Staging** (`surfcamp-php8.lithium.klab.cz`) serves this working tree directly — uncommitted edits are already live there, no deploy step (see `[[staging-serves-working-tree]]`).
- **Production** goes live via `./bin/deploy` (= `git push live registrace:production`; the source branch is configured in `bin/deploy`, which is authoritative); `vendor/` and any build output are committed and shipped by the push (there is no Node/Composer on the server). Only add a "Deploy notes" body section when a commit needs something beyond this normal flow.

## Pattern for new project skills and commands

When designing new slash commands or skills for this repo, mirror the shape above:

- **One clear job per artifact.** A `/log-session` command logs a session. It does not also lint, deploy, or summarize for Slack. New responsibilities → new commands.
- **Front-load the *why*.** Both skills and commands should open with a one-paragraph motivation so the next session understands when (and when not) to invoke them — same instinct as the commit "Why" section.
- **English for skill/command internals, Czech for app strings.** Commit messages and these skill/command files are written in English (Czech proper nouns like "Fáze" are fine). The application's user-facing strings are Czech — the i18n layer was removed, so all UI text is hardcoded Czech in the Latte templates and the `App\Admin` admin.
- **Reference, don't duplicate.** If a command's behavior depends on a skill (like `/log-session` depending on this skill), link to it rather than re-explaining the format. Single source of truth.
- **End-state, not playbook.** Commands should describe the outcome they produce and the checks they make, not a rigid step list — Claude can sequence the work, but it needs to know what "done" looks like.
