#!/usr/bin/env bash
# Instantiate ~/Software/distributed-systems-project-template as a new, working learning-path
# project: copy, rename placeholders, roll a random cohesive color scheme, install
# dependencies, and verify the Go and docs builds. Deterministic apart from the hue.
#
# Usage:
#   new-learning-path.sh <slug> ["Display Name"] [parent-dir]
#
#   slug         lowercase-kebab project name; becomes the folder, module, and binary
#   Display Name shown in the docs reader; defaults to the slug title-cased
#   parent-dir   where the project folder is created; defaults to ~/Software
set -euo pipefail

TEMPLATE="${LEARNING_PATH_TEMPLATE:-$HOME/Software/distributed-systems-project-template}"

SLUG="${1:-}"
if [[ ! "$SLUG" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "usage: new-learning-path.sh <slug> [\"Display Name\"] [parent-dir]" >&2
  echo "slug must match ^[a-z][a-z0-9-]*$ (got: '${SLUG}')" >&2
  exit 1
fi

DISPLAY="${2:-$(echo "$SLUG" | tr '-' ' ' | awk '{for (i=1; i<=NF; i++) $i = toupper(substr($i,1,1)) substr($i,2)} 1')}"
PARENT="${3:-$HOME/Software}"
TARGET="$PARENT/$SLUG"

[[ -d "$TEMPLATE" ]] || { echo "template not found: $TEMPLATE" >&2; exit 1; }
[[ -e "$TARGET" ]] && { echo "refusing to overwrite existing: $TARGET" >&2; exit 1; }

echo "==> Copying template to $TARGET"
mkdir -p "$PARENT"
rsync -a \
  --exclude node_modules --exclude dist --exclude bin --exclude .git \
  --exclude /skills --exclude /scripts --exclude store \
  "$TEMPLATE/" "$TARGET/"

echo "==> Renaming placeholders (slug: $SLUG, display: $DISPLAY)"
mv "$TARGET/cmd/PROJECT_NAME" "$TARGET/cmd/$SLUG"
perl -pi -e "s/PROJECT_NAME/$SLUG/g" "$TARGET/go.mod" "$TARGET/cmd/$SLUG/main.go"
D="$DISPLAY" perl -pi -e 's/PROJECT_NAME/$ENV{D}/g' "$TARGET/AGENTS.md" "$TARGET/docs/index.html" "$TARGET/docs/src/site.ts"
perl -pi -e "s/\"name\": \"project-name-docs\"/\"name\": \"$SLUG-docs\"/" "$TARGET/docs/package.json"

HUE=$((RANDOM % 360))
echo "==> Rolling color scheme (--brand-hue: $HUE)"
perl -pi -e "s/--brand-hue:\s*\d+;/--brand-hue: $HUE;/" "$TARGET/docs/src/styles.css"
grep -q -- "--brand-hue: $HUE;" "$TARGET/docs/src/styles.css" || {
  echo "failed to set --brand-hue in docs/src/styles.css" >&2; exit 1;
}

cat > "$TARGET/README.md" <<EOF
# $SLUG

$DISPLAY — a learning-path project instantiated from
[distributed-systems-project-template](https://github.com/nickstrad/distributed-systems-project-template).

The lesson sequence lives in [docs/plans/](docs/plans/); run \`make docs\` to read it
locally. Lessons define interfaces and concepts, the agent generates the tests, and the
implementations in this repository are written by hand while working the path.

- \`make test\` / \`make build\` / \`make fmt\` / \`make vet\` — Go workflow
- \`make validate N=NN\` — run a lesson's validation script (Maelstrom or chaos check)
- \`make docs\` — local lesson reader; \`make docs-build\` — static site build
EOF

echo "==> Initializing git"
git -C "$TARGET" init -q -b main
git -C "$TARGET" add -A
git -C "$TARGET" commit -q -m "Initial commit from learning-path-template"

echo "==> Installing docs dependencies"
npm --prefix "$TARGET/docs" install --no-fund --no-audit

echo "==> Verifying Go build and tests"
(cd "$TARGET" && go build ./... && go test ./... && make build)

echo "==> Verifying docs build"
npm --prefix "$TARGET/docs" run build

cat <<EOF

Done. $TARGET is working.

Next steps:
  1. Have the create-learning-path skill interview you and generate the lesson
     sequence in docs/plans/open/ (it replaces the example lesson).
  2. Create a GitHub repo and push; enable Pages (Settings -> Pages -> GitHub
     Actions) so .github/workflows/docs-pages.yml deploys the reader.
  3. make docs   # read the path locally
EOF
