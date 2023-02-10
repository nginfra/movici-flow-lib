export function attributeValidator(
  configurator: {
    $t: Vue['$t'];
    selectedAttribute: unknown;
    filteredEntityProps?: unknown[];
  },
  doValidate: () => boolean
) {
  return () => {
    if (doValidate()) {
      if (!configurator.filteredEntityProps?.length) {
        return '' + configurator.$t('flow.visualization.noCompatibleAttributes');
      }

      if (!configurator.selectedAttribute) {
        return 'Please select an attribute for the configurator to be based on';
      }
    }
  };
}
