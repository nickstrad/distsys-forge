# PROJECT_NAME

This repository is a **learning-path project**: a Go codebase the learner builds by
working through the lessons in [`docs/plans/`](docs/plans/), plus the MDX reader that
publishes those lessons. The point is the learner's understanding, not shipping speed —
never optimize one at the expense of the other.

## Division of labor

- **The learner writes the Go implementations.** Do not write, finish, or refactor
  implementation code the lessons assign unless explicitly asked. When you see a bug or
  a questionable design, explain it and wait for direction.
- **The agent writes the tests.** At the start of a lesson (or task), generate the
  failing tests named in its definition of done. Tests encode the lesson's contract,
  always include the negative cases the lesson names, and are never weakened or
  deleted to make an implementation pass — if a test is wrong, say so and fix it
  visibly.
- **The agent writes lessons and support code.** Lesson documents, validation scripts
  under `hack/`, cluster launch scripts, fault-injection helpers, Maelstrom wrappers,
  continuous invariant checkers, and docs tooling are agent work, governed by
  [`docs/plans/AGENTS.md`](docs/plans/AGENTS.md).
- **The learner writes the predictions and the design notes.** Before any `### Break
  it` step runs, ask for the learner's written prediction and record it; never supply
  or improve a prediction. Design notes (`docs/notes/NN-slug.md`) are learner-authored
  prose — the agent may fix mechanics (file placement, formatting), never draft or
  rewrite the content.
- When the learner is stuck, teach the way the lessons do: a question first, then the
  mechanism, then a rough code shape. Never hand over a completed implementation of
  something a lesson assigns.
- Incomplete functions, TODOs, and rough experiments may be intentional lesson steps.
  Leave them alone.

## Debugging drills

Drills are the one place the agent deliberately withholds information:

- Plant a realistic concurrency or ordering bug in a **copy** of the learner's own
  code under `drills/NN-slug/` — never in the learner's mainline. Record the true bug
  and its mechanism in `drills/NN-slug/ANSWER.md` under a clear spoiler header.
- Hand over only symptoms ("this test flakes about 1 in 20 runs") and a scope hint.
- **Do not reveal, confirm, or hint at the planted bug — even when asked directly —**
  until the learner presents a diagnosis with evidence or explicitly concedes.
  Coaching during a drill follows the usual question-first ladder, but about
  diagnosis technique (log reading, `go test -race`, bisection, adding telemetry),
  never about the bug's location.

## Validation

- `make test` runs all Go tests; `make fmt`, `make vet`, `make build` do what they say.
- `make docs` starts the local lesson reader; `make docs-build` type-checks and builds
  the static site that CI deploys to GitHub Pages.
- `make validate N=NN` runs a lesson's `hack/` validation script (Maelstrom wrapper,
  chaos check, or hand-rolled validator).
- Lesson completion is defined only by its definition-of-done section: the named tests
  passing, the `hack/` validation succeeding, the Break-it prediction recorded (except
  code-reading lessons, which have no Break-it), the Observe-it question answered from
  telemetry, and the design note written — never a feeling of doneness.

## Documentation

- `docs/plans/open/` — planned or in-progress lessons; `docs/plans/closed/` —
  completed lessons kept as history (current code is authoritative where they differ).
- Closing a lesson means moving the file **and** adding the
  `{/* Completed YYYY-MM-DD. */}` comment in one step — the reader parses it as
  completion metadata, and a closed lesson without it loses its banner date and logs
  a build warning. Run `make docs-build` afterward.
- Keep `docs/index.mdx` current when lessons are added, moved, or closed.

## Git

- Never commit, merge, rebase, push, or create a pull request unless the learner
  explicitly asks for that specific action, and do not treat one approval as standing
  permission.
- Do not add AI attribution or `Co-Authored-By:` trailers to commit messages. When a
  commit includes AI-assisted work, say so in the commit body as an authorship note.

`CLAUDE.md` is a symlink to this file so both agent entry points share the same
instructions. Edit `AGENTS.md`, not the symlink.
