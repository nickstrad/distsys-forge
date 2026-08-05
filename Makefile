MODULE := $(shell go list -m)
BINARY := $(notdir $(MODULE))
PKG := ./cmd/$(BINARY)
BIN_DIR := bin

.PHONY: all
all: build

.PHONY: build
build: ## Build the binary into bin/
	go build -o $(BIN_DIR)/$(BINARY) $(PKG)

.PHONY: run
run: ## Run the app (pass args with ARGS="...")
	go run $(PKG) $(ARGS)

.PHONY: test
test: ## Run all tests
	go test ./...

.PHONY: fmt
fmt: ## Format all Go code
	go fmt ./...

.PHONY: vet
vet: ## Report suspicious constructs
	go vet ./...

.PHONY: tidy
tidy: ## Sync go.mod/go.sum
	go mod tidy

.PHONY: validate
validate: ## Run a lesson's validation script (make validate N=05)
	@test -n "$(N)" || { echo "usage: make validate N=NN"; exit 1; }
	@for s in hack/validate-$(N).sh hack/maelstrom-$(N).sh; do \
		if [ -f "$$s" ]; then bash "$$s"; exit $$?; fi; \
	done; \
	echo "no hack/validate-$(N).sh or hack/maelstrom-$(N).sh found"; exit 1

NPM_DOCS := npm --prefix docs
DOCS_DEPS := docs/node_modules/.package-lock.json

$(DOCS_DEPS): docs/package-lock.json
	$(NPM_DOCS) ci

.PHONY: docs-install
docs-install: ## Install the documentation reader dependencies from the lockfile
	$(NPM_DOCS) ci

.PHONY: docs
docs: $(DOCS_DEPS) ## Start the local MDX documentation reader
	$(NPM_DOCS) run dev

.PHONY: docs-build
docs-build: $(DOCS_DEPS) ## Type-check and build the documentation reader
	$(NPM_DOCS) run build

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf $(BIN_DIR)

.PHONY: help
help: ## List the documented targets
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
