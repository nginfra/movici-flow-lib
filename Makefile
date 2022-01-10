level=patch
export level

install:
	npm --prefix testing/ install
	# Hack to let typescript resolve packages
	ln -s testing/node_modules

bump-version:
	bumpversion  --config-file .bumpversion $(level)
