level=patch
export level

bump-version-chart:
	bumpversion  --config-file .bumpversion.chart $(level)

bump-version: bump-version-chart
	bumpversion  --config-file .bumpversion.app $(level)
