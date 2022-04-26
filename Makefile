level=patch
export level

install:
	npm --prefix project/ install
	# Hack to let typescript resolve packages
	ln -s project/node_modules

bump-version:
	bumpversion  --config-file .bumpversion $(level)
