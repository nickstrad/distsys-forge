# Learning-path documents

This directory holds the project's learning path. `open/` contains lessons that are
planned or in progress; `closed/` contains completed lessons kept as history. Moving a
file records lifecycle only — a lesson is worked when the learner starts it, not because
it exists.

## The three-tier shape

A learning path is a single ordered sequence of lessons that builds toward one capstone
project. Lessons are numbered `NN-short-slug.mdx` in intended order and belong to one of
three tiers, declared in a `Tier:` line at the top of the file:

1. **Tier 1 — toy primitives.** Small, self-contained Go exercises that teach a
   building-block concept from theory (a write-ahead log, a lease, a hash ring, a
   consensus round). Understand the idea by building it once; never productionize it.
   Keep each lesson completable in one or two sittings.
2. **Tier 2 — production primitives.** Focused modules that teach a real
   infrastructure component (etcd, PostgreSQL, NATS, Kafka, …) by using it from Go: its
   client API, its consistency model, and the one or two patterns the capstone needs
   from it. Smaller than tier 3, more integration-shaped than tier 1.
3. **Tier 3 — capstone.** The larger project that composes everything above into a
   real system. Most of the path's lessons should point at a concept the capstone
   exercises; tier-3 lessons may span multiple sittings and multiple packages.

Only include tier-1 and tier-2 lessons the capstone actually draws on. A lesson that
teaches a concept the capstone never uses is scope creep, not thoroughness. The number
of lessons per tier is whatever the project and concept need under solo-developer
constraints — there is no quota.

## Run it, break it, observe it

Distributed-systems muscle comes from running, breaking, and debugging real processes,
not from reading and passing unit tests. Every lesson is authored under these rules:

- **Every lesson produces something runnable.** A passing test suite alone is not a
  lesson outcome; the learner starts processes and watches them behave.
- **A real cluster exists early.** By the second or third lesson the path stands up a
  3-process localhost cluster (agent-written launch scripts in `hack/`), and from then
  on definitions of done are phrased operationally: "bring the cluster up, do X,
  observe Y" — alongside, not instead of, the tests.
- **Every lesson breaks something, and the learner predicts the outcome first**
  (code-reading lessons are the one exemption — see "Special lesson types"). Each
  definition of done includes a `### Break it` step: one concrete fault (kill a process
  at a named point, cut a connection, skew a clock). Before running it, the learner
  writes down what they expect to happen. The prediction-vs-reality gap is where the
  learning happens — a confirmed prediction and a surprise are both successes; the
  comparison is recorded in the lesson's design note.

## Required structure

Every default-shape lesson must contain these sections, in this order (special lesson
types drop only the sections their entry below names):

1. **Summary** — what will be built, in current/future tense that never implies it
   already exists. State the tier and how this lesson feeds the capstone.
2. **Why this matters** — how real systems (etcd, Kubernetes, Kafka, Postgres, or
   commercial platforms in the project's domain) use this concept, and where it
   reappears later in the path.
3. **Key concepts** — the concrete Go, distributed-systems, storage, or API-design
   concepts the lesson explains. A lesson that names work without explaining the
   relevant concepts is mis-scoped. Put concise conceptual writeups near the task
   that uses each concept.
4. **Design and interfaces** — the Go interfaces, types, schemas, or wire contracts
   the lesson commits to. Interfaces may be fully specified (the learner implements
   them); implementations must not be. Prefer a design with an interface at each seam
   so later lessons can swap implementations underneath it.
5. **Invariants** — one to five named invariants the system must uphold, stated as
   checkable claims ("at most one leader per term", "acknowledged writes survive
   crashes"), each mapped to its enforcement: a named test, a continuous checker
   process, or an external checker workload. An invariant with no enforcement listed
   is a wish, not an invariant.
6. **Tasks** — an ordered list of small steps, each independently checkable. Use the
   `TaskList`/`Task` components.
7. **Hint steps** — a progressive set of rough implementation outlines the learner
   reveals only when stuck. Use `HintSteps`/`Hint`. See the guidance below.
8. **Definition of done** — mandatory and machine-verifiable, with required
   `### Break it` and `### Observe it` subsections. See below.
9. **Solo-developer tradeoffs** — what a production system would do differently and
   why this lesson deliberately does less, so shortcuts are informed decisions rather
   than accidents.
10. **Go deeper** — external resources (official docs, articles, books, talks, papers)
    for study beyond what the lesson teaches. Scale to the lesson's conceptual depth: a
    setup lesson may list two doc links; a consensus lesson deserves papers and talks.
    Use the `Resources`/`Resource` components. Every linked URL must be real and
    verified — a resource with no trustworthy URL is cited by title/author/venue
    without a link. Each entry needs a one-line note saying what it adds beyond the
    lesson.
11. **Design note** — the closing section: instructions for a half-page note the
    learner writes in their own words after finishing, saved to
    `docs/notes/NN-slug.md`. Three fixed prompts: what I built; the fault I induced,
    my prediction, and what actually happened; what production systems do differently.
    The note is learner-authored prose — the agent never drafts it. A `writing-well`
    editing pass is encouraged; publishing anywhere (blog, portfolio) is the learner's
    manual choice, never automated.

## Testing workflow: the agent writes tests, the learner writes code

The division of labor in this project is deliberate:

- At the start of each lesson (or each task within one), the agent generates the test
  files named in the lesson's definition of done — failing tests that encode the
  lesson's contract. The learner implements Go code until they pass. The learner's
  attention goes to the implementation and the concepts, not to test scaffolding.
- Tests must encode the behavior the lesson teaches, including at least one
  negative/failure case (timeout, crash, retry, idempotent re-run, leaked resource).
  A happy path that runs once is not a contract.
- Generated tests are part of the lesson's spec: the agent must not weaken or delete
  a test to make an implementation pass. If a test is wrong, say so and fix the test
  visibly.

**TDD is the floor, not the ceiling.** Where a stronger method would materially improve
the final system, the lesson should plan for it explicitly:

- Property-based tests (`testing/quick`, rapid) for invariants like "replaying the log
  reproduces the state machine".
- Fuzzing (`go test -fuzz`) for parsers and wire formats.
- Deterministic-randomness or fault-injection harnesses for concurrency-heavy lessons.
- External checkers (see "Grading" below) whenever the primitive matches a standard
  workload; Jepsen-style chaos validation of the capstone via `hack/validate-NN.sh`.

Name these in the definition of done when they apply; do not bolt them on silently.

## Grading: prefer external checkers over self-graded homework

A hand-rolled validation script checks what its author thought to check. When a
tier-1 primitive matches a workload that Jepsen's Maelstrom can grade — echo,
broadcast, grow-only counter, linearizable KV (Raft) — the lesson must plug the
learner's binary into Maelstrom and let its workload generators and linearizability
checkers do the grading. Fly.io's Gossip Glomers challenges
(https://fly.io/dist-sys/) are the reference shape; nodes speak the protocol via the
official Go library, `github.com/jepsen-io/maelstrom/demo/go`. Concretely:

- The path includes one early setup lesson that installs Maelstrom (the agent writes
  `hack/install-maelstrom.sh`: JDK, graphviz, gnuplot, then the release tarball from
  https://github.com/jepsen-io/maelstrom/releases) and runs the echo workload end to
  end. Results land in `store/`; `./maelstrom serve` browses them on port 8080.
- Lessons invoke it through an agent-written wrapper, `hack/maelstrom-NN.sh`, run as
  `make validate N=NN`, so the definition of done stays one command.
- Hand-rolled `hack/validate-NN.sh` scripts remain the fallback for behavior no
  external checker covers — and the lesson must say why no external checker applies.

## Observability is taught, then required

By mid-tier-1 a dedicated lesson introduces structured logging with `log/slog` —
every log line carrying node ID, term/epoch, and request ID fields — and traces one
request across the cluster's processes. From that lesson onward:

- The `### Observe it` subsection of every definition of done is mandatory: a "why
  did the system do that?" question the learner must answer from telemetry alone,
  citing the log or trace lines that prove it. "Grep the log for X and explain the
  sequence" is a legitimate done-check.
- Capstone-tier lessons run a continuous invariant checker — an agent-written process
  that asserts the lesson's stated invariants *while* chaos runs, not after.

Lessons before the observability lesson include an `### Observe it` in the same shape
but may rely on simple prints; the requirement hardens once `slog` is taught.

## Definition of done must be verifiable

Every lesson defines completion as something a machine can check, not a feeling:

- List the test names/behaviors that must exist and pass (e.g.
  `TestReplayRebuildsState`, `TestAcquireExpiredLeaseSucceeds`), and done means
  `make test` passes with those tests present and meaningful.
- Where unit tests cannot capture the behavior (real external services, cross-process
  behavior, chaos checks), specify a validation script under `hack/` (e.g.
  `hack/validate-05.sh`) that exits 0 only when the lesson's observable guarantees
  hold, and prints what it checked.
- Failure behavior counts: include at least one negative check per lesson.
- **`### Break it` (required subsection).** One concrete fault, named precisely: kill
  a specific process at a specific point, cut or degrade a connection, skew a clock.
  State the fault, the command or script that induces it, and the rule that the
  learner writes a prediction (a `StudyPrompt` works well) *before* running it. The
  observed outcome and the prediction go into the design note.
- **`### Observe it` (required subsection).** One question about the system's behavior
  answerable only from its telemetry (logs, traces), with the expectation that the
  learner cites the evidence. See "Observability is taught, then required".
- State what remains **deliberately untested**, so the gap is recorded rather than
  forgotten.

## Special lesson types

Beyond the default shape, a path schedules four other lesson types. Each keeps the
required structure except where noted:

- **Code-reading lessons** (between tiers 1 and 2): walk a real production
  implementation of a problem the learner just fumbled in toy form — pinned to a
  specific release tag or commit so line references stay stable. Tasks become
  questions to answer ("where does this handle the gap you hit in your version?");
  the definition of done is written answers plus, optionally, one small experiment
  against the real system. No Break it subsection required.
- **Ops/runbook lessons** (capstone slice): deploy, roll-upgrade, replace a node, and
  back up/restore the capstone on real machines (cloud VMs or local `multipass` VMs
  per the project's environment constraints). The runbook the learner writes *is* the
  artifact; done means the runbook was executed on real nodes with evidence captured
  (command output, log excerpts) — and the Break it step is the operation itself.
- **Revisit lessons** (tier 3): reopen a named tier-1 artifact under capstone
  pressure — the WAL gains segment rotation because the log grows; the hash ring
  gains rebalancing because nodes now join live. The original lesson's tests must
  keep passing alongside the new ones. Plan these explicitly in the outline; toys
  left in a museum are forgotten.
- **Debugging drills** (recurring, agent-initiated): the agent plants a realistic
  concurrency or ordering bug in a copy of the learner's own code under
  `drills/NN-slug/` and the lesson file contains only symptoms ("this test flakes
  about 1 in 20") plus a scope hint. No Design-and-interfaces, Tasks, or Hint-steps
  sections — diagnosis is the exercise. The no-reveal protocol is governed by the
  root `AGENTS.md`.

## Environment constraints degrade gracefully

Every path declares its environment (chosen in the generation interview): local
processes only, Docker available, or real VMs/cloud. Fault injection must be authored
for that environment — never silently require a tool the constraint excludes; if a
fault type has no realization in the chosen environment, say so in the lesson and
mark it skipped. The realization ladder:

| Fault | macOS-local | Docker | Real VMs (multipass/cloud) |
| --- | --- | --- | --- |
| Partition | toxiproxy `toggle` per link (route all inter-node traffic through proxies from the start) | toxiproxy sidecar, or `iptables` DROP with `--cap-add=NET_ADMIN` | `iptables` DROP over ssh |
| Latency/loss/bandwidth | toxiproxy toxics (`latency`, `bandwidth`, `slicer`) | `tc netem` inside the container (Linux-only tool) | `tc netem` per node |
| Process kill | `kill -9` | `docker kill` / `docker pause` | `kill -9` over ssh, `multipass stop` |
| Clock skew | a `Clock` interface with a settable offset in your own Go code (libfaketime does not work with Go binaries or SIP) | same injected `Clock` | `timedatectl set-ntp false` + `date -s` — the only real kernel skew |
| Node loss | kill + toggle its proxy links | `docker stop` / network disconnect | stop or delete the VM |

Two consequences worth designing for: inter-node addresses must be configurable so a
toxiproxy port can stand in for a peer, and every process needs an injectable clock —
both are interface seams the early lessons should establish. `tc netem` does not exist
on macOS; toxiproxy (`brew install toxiproxy`) is the userspace substitute. For the
ops slice without cloud spend, three `multipass` Ubuntu VMs are the free realization.

## Hint steps must guide without solving

Every default-shape lesson contains a `## Hint steps` section after `## Tasks`,
consulted only when blocked (debugging drills have neither — see "Special lesson
types").

- Mirror the task order and provide a rough path that would ultimately complete the
  lesson.
- Make hints progressive: begin with the next question to answer or file to inspect,
  then name the relevant API or mechanism, and only then outline the likely code
  shape.
- State the observable result that confirms the learner is back on track (`check`
  prop on `Hint`).
- Point at relevant Go, protocol, or library documentation and name useful commands.
- Warn about the most likely conceptual traps and failure cases.
- Never provide full function bodies, copy-paste-ready solutions, or a sequence so
  detailed that implementation becomes transcription.
- End with a diagnostic hint for the lesson's negative test or most likely failure
  mode; success-path hints alone are insufficient.

## Use MDX to explain, not to decorate

Lessons use MDX so they can be more useful than static task lists. Make each lesson a
self-contained technical guide:

- Use diagrams (`Figure` with inline SVG, or `Mermaid`) when a lifecycle, state
  machine, request path, or ownership boundary is easier to see than to read.
- Use tables for exact comparisons, mappings, and invariants; `Compare`/`CompareItem`
  for approaches whose differences matter; `Callout` for warnings and design
  commitments; `KeyPoint` for the one invariant to retain; `StudyPrompt` for
  self-checks.
- Keep the prose technically substantial. Components should clarify information, not
  pad the document.
- A lesson may show interfaces and small illustrative snippets, but never the
  completed implementation the learner is meant to write.

The full component reference is [`docs/reader-guide.mdx`](../reader-guide.mdx).

## Conventions

- File names: `NN-short-slug.mdx`, numbered in intended order across all tiers. State
  dependencies explicitly at the top (`Depends on: 03, 05.`) and the tier
  (`Tier: 1 — toy primitive.`).
- Lessons define interfaces; the learner writes the Go implementations. The agent
  writes tests (see the testing workflow above) and may generate non-Go support code
  (scripts, docs tooling) when the learning target is elsewhere.
- Cluster launch scripts, fault-injection helpers, and Maelstrom wrappers are
  per-lesson artifacts under `hack/` (`hack/cluster-NN.sh`, `hack/maelstrom-NN.sh`,
  `hack/validate-NN.sh`). `make validate N=NN` dispatches to `validate-NN.sh` or
  `maelstrom-NN.sh`; cluster scripts are run directly. Continuous invariant
  checkers live under `cmd/` or `hack/` as agent-written support code.
- Debugging drills live in `drills/NN-slug/` (a copy of the learner's code with a
  planted bug, plus `ANSWER.md` behind a spoiler header). Maelstrom's results
  directory (`store/`) is gitignored.
- Design notes live in `docs/notes/NN-slug.md`, one per completed lesson.
- When a lesson completes, move it to `closed/`, add
  `{/* Completed YYYY-MM-DD. <deviation note> */}` below its dependency line, and
  update `docs/index.mdx`. This note is not decoration: the reader
  (`docs/src/documents.tsx`) parses it as completion metadata — a closed lesson
  without it loses its completion date in the banner and logs a build warning.
  Moving the file and adding the note are one atomic step. Run `make docs-build`
  after closing a lesson.
- Keep this file as Markdown; its exact filename activates scoped agent instructions.
