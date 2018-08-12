CS=node_modules/.bin/coffee

MVERSION=node_modules/mversion/bin/version
VERSION=`$(MVERSION) | sed -E 's/\* package.json: //g'`

ISTANBUL=node_modules/istanbul/lib/cli.js
MOCHA=node_modules/mocha/bin/mocha
_MOCHA=node_modules/mocha/bin/_mocha
COVERALLS=node_modules/coveralls/bin/coveralls.js

SRC = ./src
LIB = ./lib
CS_SRC = $(wildcard $(SRC)/*.coffee) $(wildcard $(SRC)/**/*.coffee)
JS_LIB = $(CS_SRC:$(SRC)/%.coffee=$(LIB)/%.js)


POLVO=bin/polvo

build: $(POLVO) $(LIB)
	chmod +x $<


$(LIB): $(JS_LIB)
$(LIB)/%.js: $(SRC)/%.coffee
	$(CS) -bmco $@ $?

install:
	npm link

clean:
	rm -rf $(LIB)


setup:
	@npm link



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


test: build
	@$(MOCHA) --compilers coffee:coffee-script \
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
