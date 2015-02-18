
# ----------------------------------------------- Files
PYTEST_FILES:=$(shell cat pytest.txt)
HTML_DOMAIN:=localhost:5000

# ----------------------------------------------- Common
THIS:=$(MAKEFILE_LIST)
GIT_DIR:=$(dir $(realpath $(THIS)))
DEV_NULL=/dev/null
IDLE_CMD=@echo "" > $(DEV_NULL)
UNAME_S=
FIREFOX=firefox

$(info $(GIT_DIR))

# ----------------------------------------------- Windows specifics
ifeq ($(OS),Windows_NT)
	DEV_NULL=NUL
else
	UNAME_S:=$(shell uname -s)
endif

# ----------------------------------------------- Mac OS specifics
ifeq ($(UNAME_S),Darwin)
	FIREFOX=/Applications/Firefox.app/Contents/MacOS/firefox
endif

# ----------------------------------------------- Main entry
.PHONY: all
all: python
	$(IDLE_CMD)

# ----------------------------------------------- Python tests
.PHONY: python
python: $(PYTEST_FILES)
	$(IDLE_CMD)

.PHONY: $(PYTEST_FILES)
$(PYTEST_FILES): %.py:
	py.test -q $@

# ----------------------------------------------- HTML tests
.PHONY: html
html:
	$(FIREFOX) --profile $(GIT_DIR)test.firefox-profile --new-tab http://$(HTML_DOMAIN)/test.html
