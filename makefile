
# ----------------------------------------------- Files
PYTEST_FILES:=$(shell cat pytest.txt)

# ----------------------------------------------- Common
THIS:=$(MAKEFILE_LIST)
GIT_DIR:=$(dir $(realpath $(THIS)))
DEV_NULL=/dev/null
IDLE_CMD=@echo "" > $(DEV_NULL)

# ----------------------------------------------- Windows specifics
ifeq ($(OS),Windows_NT)
	DEV_NULL=NUL
endif

# ----------------------------------------------- Main entry
.PHONY: all
all: python html
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
	@python $(GIT_DIR)test.py
