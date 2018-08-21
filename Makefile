
# Directories
SRC			= ./src
LIB			= ./lib
BIN			= ./node_modules/.bin

# Files
TS_ALL	= $(wildcard $(SRC)/*.ts) $(wildcard $(SRC)/**/*.ts)
TS_SRC	= $(filter-out %.spec.ts,$(TS_ALL)) # Exclude test files
JS_LIB	= $(TS_SRC:$(SRC)/%.ts=$(LIB)/%.js)
SPECS		= $(shell find $(SRC) -name "*.spec.ts")

# Commands
NYC			= $(BIN)/nyc
STYLE		= $(BIN)/prettier
TAP_NYC	= $(BIN)/tap-nyc
TAP_DOT	= $(BIN)/tap-dot
TAPE		= $(BIN)/tape
TS_NODE	= $(BIN)/ts-node
TS			= $(BIN)/tsc

# Package Version
VERSION	= $(shell grep \"version\" package.json \
					| awk -F'": "' '{print $$2}' \
					| tr -d '",')

# Run all prerequesites as tests
define test-run =
$(TS_NODE) --require 'tape/bin/tape' $?
endef


POLVO=bin/polvo

.PHONY: build clean help install style test test.cov test.raw

build: $(LIB) ## Compile all source file to LIB

$(LIB): $(JS_LIB)
$(LIB)/%.js: $(SRC)/%.ts
	$(TS) --outDir $(@D) $?

install: ## Link this npm package
	npm link

clean: ## Remove the output directory
	rm -rf $(LIB)

style: $(TS_ALL) ## Format code
	$(STYLE) --write $?


test: $(SPECS) ## Run all tests with tap-dot output
	@$(test-run) | $(TAP_DOT)

test.raw: $(SPECS) ## Run all tests with tape output
	@$(test-run)

test.cov: $(SPECS) ## Run all tests and generate coverage
	@$(NYC) \
		--source-map \
		--exclude-after-remap \
		--reporter text \
		--extension '.ts' \
		--include 'src/**/*.ts' \
		--exclude 'src/**/*.spec.ts' \
		$(test-run)

help: ## Show this help message
	@echo "Polvo $(VERSION) - Makefile\n"
	@echo "\033[36mLIB \033[0m$(LIB)\n"
	@awk -F ":.*?## " \
		'$$0 ~ /^\t/ {next;} \
		$$0 ~ /#{2}/ {printf "\033[36m%s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)

publish:
	git tag $(VERSION)
	git push origin $(VERSION)
	git push origin master
	npm publish

re-publish:
	git tag -d $(VERSION)
	git tag $(VERSION)
	git push origin :$(VERSION)
	git push origin $(VERSION)
	git push origin master -f
	npm publish -f
