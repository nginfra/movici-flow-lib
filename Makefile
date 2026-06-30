level=patch
export level

install:
	npm install

build:
	npm run build

type-check:
	npm run type-check

test:
	npm run test:unit

bump-version:
	bumpversion --config-file .bumpversion $(level)
