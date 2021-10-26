level=patch
export level


bump-version:
	bumpversion  --config-file .bumpversion $(level)
