
# Directories
SRC			= ./src
LIB			= ./lib
BIN			= ./node_modules/.bin

# Files
CS_ALL	= $(wildcard $(SRC)/*.coffee) $(wildcard $(SRC)/**/*.coffee)
CS_SRC	= $(filter-out %.spec.coffee,$(CS_ALL)) # Exclude test files
JS_LIB	= $(CS_SRC:$(SRC)/%.coffee=$(LIB)/%.js)
SPECS		= $(shell find $(SRC) -name "*.spec.coffee")

# Commands
CS			= $(BIN)/coffee
NYC			= $(BIN)/nyc
TAPE		= $(BIN)/tape
TAP_NYC	= $(BIN)/tap-nyc
TAP_DOT	= $(BIN)/tap-dot

# Package Version
VERSION	= $(shell grep \"version\" package.json \
					| awk -F'": "' '{print $$2}' \
					| tr -d '",')

# Run all prerequesites as tests
define test-run =
node --require 'coffeescript/register' --require 'tape/bin/tape' $?
endef


POLVO=bin/polvo

build: $(POLVO) $(LIB) ## Compile all source file to LIB
	chmod +x $<

$(LIB): $(JS_LIB)
$(LIB)/%.js: $(SRC)/%.coffee
	$(CS) -bmco $@ $?

install: ## Link this npm package
	npm link

clean: ## Remove the output directory
	rm -rf $(LIB)

test: $(SPECS) ## Run all tests with tap-dot output
	@$(test-run) | $(TAP_DOT)

test.raw: $(SPECS) ## Run all tests with tape output
	@$(test-run)

test.cov: $(SPECS) ## Run all tests and generate coverage
	@$(NYC) \
		--source-map \
		--exclude-after-remap \
		--reporter text \
		--extension '.coffee' \
		--require 'coffeescript/register' \
		--include 'src/**/*.coffee' \
		--exclude 'src/**/*.spec.coffee' \
		$(TAPE) $?

help: ## Show this help message
	@echo "Polvo $(VERSION) - Makefile\n"
	@echo "\033[36mLIB \033[0m$(LIB)\n"
	@awk -F ":.*?## " \
		'$$0 ~ /^\t/ {next;} \
		$$0 ~ /#{2}/ {printf "\033[36m%s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)


setup:
	@npm link


#CS=node_modules/.bin/coffee

MVERSION=node_modules/mversion/bin/version

ISTANBUL=node_modules/istanbul/lib/cli.js
MOCHA=node_modules/mocha/bin/mocha
_MOCHA=node_modules/mocha/bin/_mocha
COVERALLS=node_modules/coveralls/bin/coveralls.js

watch:
	@$(CS) -bwmco lib src

#build:
	#@$(CS) -bmco lib src

test.clean:
	@git clean -fdx tests/fixtures
	@make test.dependencies

test.dependencies:
	@cd tests/fixtures/package-systems && npm install
	@cd tests/fixtures/package-systems && bower install
	@cd tests/fixtures/package-systems && component install


#test: build
	#@$(MOCHA) --compilers coffee:coffee-script \
		--ui bdd \
		--reporter spec \
		--recursive \
		--timeout 10000 \
		tests/tests

test.coverage: build
	@$(ISTANBUL) cover $(_MOCHA) -- \
		--compilers coffee:coffee-script \
		--ui bdd \
		--reporter spec \
		--recursive \
		--timeout 10000 \
		tests/tests

test.coverage.preview: test.coverage
	@cd coverage/lcov-report && python -m SimpleHTTPServer 8080

test.coverage.coveralls: test.coverage
	@sed -i.bak \
		"s/^.*polvo\/lib/SF:lib/g" \
		coverage/lcov.info

	@cat coverage/lcov.info | $(COVERALLS)



bump.minor:
	@$(MVERSION) minor

bump.major:
	@$(MVERSION) major

bump.patch:
	@$(MVERSION) patch



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



.PHONY: build clean
