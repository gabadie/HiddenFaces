
PYTEST_FILES:=$(shell cat pytest.txt)

.PHONY: $(PYTEST_FILES)
$(PYTEST_FILES): %.py:
	py.test -q $@
