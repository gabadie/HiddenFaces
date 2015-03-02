
# ----------------------------------------------- Files
PYTEST_FILES:=\
	servweb/test_servweb.py

SHTEST_FILES:=\
	servdata/test_servdata.sh

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
all: no_html html
	$(IDLE_CMD)

.PHONY: no_html
no_html: python shell
	$(IDLE_CMD)

# ----------------------------------------------- Python tests
.PHONY: python
python: $(PYTEST_FILES)
	$(IDLE_CMD)

.PHONY: $(PYTEST_FILES)
$(PYTEST_FILES): %.py:
	py.test -q $@

# ----------------------------------------------- Shell tests
.PHONY: shell
shell: $(SHTEST_FILES)
	$(IDLE_CMD)

.PHONY: $(SHTEST_FILES)
$(SHTEST_FILES): %.sh:
	cd $(dir $@); sh $(notdir $@)

# ----------------------------------------------- HTML tests
.PHONY: html
html:
	python $(GIT_DIR)deploy.py --testing --firefox-test
