PROJECT_PATH=app

.PHONY: fix lint

fix:
	autoflake --in-place --recursive $(PROJECT_PATH)
	isort $(PROJECT_PATH)
	black $(PROJECT_PATH)

lint:
	flake8 $(PROJECT_PATH)
