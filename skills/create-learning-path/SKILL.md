---
name: create-learning-path
description: This skill should be used when the user asks to "create a learning path", "start a new learning-path project", "make a new path from the template", or wants to design a tiered Go learning project (toy primitives → production primitives → capstone) from ~/Software/learning-path-template. Bootstraps the project with a deterministic script, interviews the user, then generates the lesson sequence.
---

# Create a learning path

Instantiate `~/Software/learning-path-template` as a new project, interview the user to
design a three-tier learning path aimed at one capstone, and write the lessons.

## Who this is for (default assumptions, refine in the interview)

A solo developer using learning paths to pivot toward distributed-systems engineering
in Go. The guiding progression: theory explains why systems work (tier 1 toy
primitives), production primitives are the reliable building blocks (tier 2), and
composition patterns — control plane vs. data plane, idempotency, leases, leader
election, heartbeats, optimistic concurrency, work queues, backoff — are what the
capstone exercises (tier 3). The goal is excellence at **composing** reliable systems,
not re-implementing consensus forever. Each capstone should be an EXCELLENT resume
artifact: MVP scope, not a production application.

Paths are **run-break-observe-debug**, not read-implement-pass: every lesson runs real
processes, breaks one thing with a written prediction first, asks a question answerable
only from telemetry, and is graded by external checkers (Maelstrom) wherever a standard
workload matches — the details are in the template's `docs/plans/AGENTS.md`.

## Step 1 — Bootstrap with the script (do not hand-copy)

Ask for the project slug (lowercase-kebab) and display name if not given, then run the
script that ships inside the template:

```sh
"${LEARNING_PATH_TEMPLATE:-$HOME/Software/learning-path-template}/scripts/new-learning-path.sh" <slug> "<Display Name>"
```

Use the script rather than copying files yourself — it is the deterministic path: it
copies the template, renames every `PROJECT_NAME` placeholder (module, cmd dir,
`docs/src/site.ts`, `index.html`, `AGENTS.md`, docs package name), rolls a random
`--brand-hue` in `docs/src/styles.css` so each project's site gets its own cohesive
color scheme, writes a project README, git-inits with an initial commit, runs
`npm install`, and verifies `go build`, `go test`, and the docs build. If it fails,
fix the cause and re-run against a clean target; do not fall back to manual copying.

## Step 2 — Interview

Interview with `AskUserQuestion` (recommend defaults; keep it to two short rounds).
Cover:

1. **Capstone.** Propose 3–4 concrete tier-3 candidates sized for a solo MVP with
   strong resume value (e.g. distributed scheduler on etcd + Postgres, mini
   Kubernetes-style control plane, distributed build farm, toy distributed query
   engine — or something from the user's own domain). Everything else derives from
   this choice.
2. **Tier-2 technologies.** Driven by the capstone: coordination (etcd), database
   (PostgreSQL/TigerBeetle/FoundationDB), messaging (NATS/Kafka) — only what the
   capstone needs, one focused module each.
3. **Experience and time.** What they already know (skip lessons that would bore
   them) and sitting length/cadence, so lesson sizing fits real life.
4. **Testing appetite.** TDD is the floor everywhere; external checkers (Maelstrom)
   grade every primitive that matches a standard workload. Ask where to plan stronger
   methods beyond that — property-based tests, fuzzing, fault-injection, Jepsen-style
   chaos validation of the capstone — since these improve the final product and the
   resume story. Note explicitly: the agent generates the tests at each step; the
   user focuses on implementing and learning.
5. **Environment.** Local processes only vs. Docker vs. real VMs/cloud — this decides
   how faults are realized (see the contract's degradation rules) and whether the ops
   slice runs on cloud VMs or local `multipass` VMs (the free fallback). Confirm a JDK
   is available or installable, since Maelstrom needs one. Anything to avoid.
6. **Debugging-drill appetite.** Drills are planted-bug diagnosis exercises on a copy
   of the user's own code (default cadence: about one per tier). Confirm cadence and
   consent to the no-reveal rule: the agent will not disclose the planted bug until a
   diagnosis is presented or the user concedes.

Design notes need no interview question: they are repo-only (`docs/notes/`), and the
user publishes them to their blog manually if and when they choose.

## Step 3 — Design the path, get approval

Work backward from the capstone: list the patterns it exercises, then include **only**
the tier-1 and tier-2 lessons those patterns need. Keep tier 1 and tier 2 small and
focused (one or two sittings each); the capstone is the big piece, split into several
tier-3 lessons. Number lessons sequentially across tiers (`NN-short-slug.mdx`) with
explicit `Depends on:` lines.

The outline must also satisfy this coverage checklist before approval — tag each
outline line with the letters it covers so coverage is visible:

- **(a) Cluster harness early.** By lesson 2–3, a lesson stands up a 3-process
  localhost cluster with agent-written `hack/` launch scripts, leaving logging seams
  the later `slog` lesson fills in (simple prints are fine until then).
- **(b) Maelstrom.** One setup lesson installs Maelstrom (JDK + graphviz + gnuplot,
  `hack/install-maelstrom.sh`) and passes the echo workload; every tier-1 primitive
  matching a Maelstrom workload (echo, broadcast, g-counter, lin-kv/Raft) is graded by
  it. Nodes use the official Go library, `github.com/jepsen-io/maelstrom/demo/go`;
  Fly.io's Gossip Glomers (https://fly.io/dist-sys/) is the reference shape.
- **(c) Observability lesson by mid-tier-1** (`log/slog`, node/term/request-ID fields,
  one cross-process trace); Observe-it checks harden from there on.
- **(d) Code-reading bridges.** One to three lessons between tiers 1 and 2 walking a
  production implementation of a problem the user just fumbled in toy form, pinned to
  a tag/commit. Canonical anchors (verified 2026-08; re-verify at generation time with
  a research subagent, and pick anchors matching the path's actual toys):
  etcd's lease implementation
  (https://github.com/etcd-io/etcd/blob/v3.6.5/server/lease/lessor.go),
  the client-go controller pattern
  (https://github.com/kubernetes/sample-controller/blob/v0.36.3/docs/controller-client-go.md),
  Postgres `FOR UPDATE SKIP LOCKED` queueing
  (https://www.postgresql.org/docs/current/sql-select.html, with
  https://www.crunchydata.com/blog/message-queuing-using-native-postgresql).
- **(e) Revisit lessons in tier 3**, each naming the tier-1 artifact it upgrades under
  capstone pressure (WAL gains segment rotation, hash ring gains rebalancing).
- **(f) Ops slice at the capstone's end**: rolling upgrade, node replacement,
  backup/restore — each a runbook lesson on real nodes (cloud VMs or local
  `multipass`), degraded per the environment answer or explicitly marked skipped.
- **(g) Drill placeholders** at the agreed cadence. Drills get no lesson number in
  the sequence and are inserted opportunistically once real learner code exists — the
  outline just reserves the slots; on disk each takes the number of the lesson whose
  code it copies (`drills/NN-slug/`).

Present the outline — one line per lesson: number, tier, title, the concept it buys,
rough sitting count, coverage letters — and get the user's approval before writing any
lesson.

## Step 4 — Write the lessons

In the new project, delete `docs/plans/open/01-example-lesson.mdx` and write the
approved sequence into `docs/plans/open/`. The authoring contract is the new project's
`docs/plans/AGENTS.md` — follow it exactly: required sections in order (Summary, Why
this matters, Key concepts, Design and interfaces, Invariants, Tasks, Hint steps,
Definition of done, Solo-developer tradeoffs, Go deeper, Design note), with the
`### Break it` and `### Observe it` subsections inside every Definition of done,
progressive hints that never solve, machine-verifiable definitions of done with at
least one negative case, solo-dev tradeoffs stated, and Go deeper resources with
verified URLs only. Special lesson types (code-reading, ops/runbook, revisit, drills)
follow the contract's stated deviations. Setup lessons generate their install scripts
(`hack/install-maelstrom.sh`, toxiproxy setup) as agent-written support code. Use the
MDX components documented in `docs/reader-guide.mdx` (Callout, KeyPoint, StudyPrompt,
TaskList, HintSteps, Compare, Resources, Figure, Mermaid) to explain, not decorate.
Update `docs/index.mdx` with the path's actual tier table/overview, and adjust the
project `AGENTS.md` intro if the interview surfaced project-specific conventions.

## Step 5 — Verify and hand off

Run `make build`, `make test`, and `make docs-build` in the new project; all must
pass. Check every written lesson carries the eleven required headings (or a special
type's documented subset) and the two Definition-of-done subsections, and that every
coverage letter from the approved outline landed in a real lesson. Commit only
if the user asks. Then tell the user: create the GitHub repo and push, enable Pages
via GitHub Actions (the workflow is already in `.github/workflows/docs-pages.yml`),
and start lesson 01 — at which point the agent's first job is generating that lesson's
failing tests.
