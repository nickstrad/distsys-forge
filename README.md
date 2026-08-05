# distributed-systems-project-template

A template for **learning-path projects**: a Go codebase you build yourself by working
through a three-tier sequence of lessons, published as a static MDX reader site. This
repo is self-contained — the bootstrap script and the Claude Code skill that drive it
ship inside it (see "Installing the tooling" below).

Each instance of this template is one learning path aimed at one capstone project:

1. **Tier 1 — toy primitives.** Small test-driven Go exercises that teach
   building-block theory (a write-ahead log, leases, a hash ring, …).
2. **Tier 2 — production primitives.** Focused modules on real infrastructure (etcd,
   PostgreSQL, NATS, …) — just the patterns the capstone needs.
3. **Tier 3 — capstone.** A resume-grade project that composes the earlier tiers into
   a real system, finished with an ops slice on real nodes.

The workflow is **run, break, observe, debug** — not read-implement-pass. Lessons
define interfaces and concepts, the agent generates the tests, and **you write every
implementation**. Beyond TDD: every lesson breaks something after you predict the
outcome, asks a question answerable only from telemetry, states its invariants, and is
graded by external checkers (Jepsen's Maelstrom) wherever a standard workload matches.
The full authoring contract is [`docs/plans/AGENTS.md`](docs/plans/AGENTS.md).

## Installing the tooling (one-time, global)

Clone this repo to `~/Software/learning-path-template` (or anywhere — set
`LEARNING_PATH_TEMPLATE` to the clone path if elsewhere), then wire the two tools into
your machine:

```sh
# 1. The bootstrap script — symlink it onto your PATH (or into your scripts folder):
ln -s ~/Software/learning-path-template/scripts/new-learning-path.sh ~/Software/general-scripts/new-learning-path.sh

# 2. The Claude Code skill — symlink it into your user skills directory:
ln -s ~/Software/learning-path-template/skills/create-learning-path ~/.claude/skills/create-learning-path
```

Symlinks (rather than copies) mean a `git pull` of this repo updates both tools. The
canonical copies live in [`scripts/`](scripts/) and [`skills/`](skills/); the symlinks
are just how they get loaded globally — the script by being on your PATH, the skill by
living under `~/.claude/skills/` where Claude Code discovers it.

## Instantiating the template

Ask Claude Code to "create a learning path" (the skill runs the script, interviews
you, and generates the lesson sequence), or run the script directly:

```sh
~/Software/learning-path-template/scripts/new-learning-path.sh my-project "My Project"
```

It copies this template (minus `scripts/` and `skills/`), renames every
`PROJECT_NAME` placeholder, rolls a random `--brand-hue` so each project's site gets
its own cohesive color scheme, installs docs dependencies, and verifies the Go and
docs builds.

Manual placeholder locations, if you skip the script: `go.mod`,
`cmd/PROJECT_NAME/` (directory name and `main.go`), `AGENTS.md`, `docs/index.html`,
`docs/src/site.ts`, `docs/package.json`, and the `--brand-hue` line in
`docs/src/styles.css`.

## Layout

```
scripts/            the bootstrap script (canonical copy; symlink onto your PATH)
skills/             the create-learning-path Claude Code skill (symlink into ~/.claude/skills)
cmd/PROJECT_NAME/   main entry point
internal/           lesson implementations grow here (internal/example shows the shape)
hack/               per-lesson support scripts: validate-NN.sh, maelstrom-NN.sh, cluster-NN.sh
drills/             debugging drills — copies of your code with planted bugs (created as needed)
docs/               MDX lesson reader (Vite + React); plans/open + plans/closed hold lessons
docs/notes/         your half-page design notes, one per completed lesson
.github/workflows/  GitHub Pages deploy for the docs site
```

## Commands

- `make test` / `make build` / `make fmt` / `make vet` — Go workflow.
- `make validate N=NN` — run lesson NN's validation script (Maelstrom or chaos check).
- `make docs` — run the lesson reader locally.
- `make docs-build` — type-check and build the static site (CI runs this on push).
