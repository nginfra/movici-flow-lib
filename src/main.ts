import Vue_ from 'vue';
import MovSnackBarProgramatic from './utils/snackbar';
import { registerComponent, registerComponentProgrammatic } from './plugins';
// export api client and interfaces and request classes for the api
import * as api from './api';
import * as stores from './store/store-accessor';
// export all components
import * as components from './components';
// // export all types
import * as types from './types';
// export router
import * as router from './router';
// export utils and others
import * as utils from './utils';
import * as errors from './errors';
import * as crs from './crs';
import * as i18n from './i18n';

export default (() => {
  const Flow_ = {
    install(Vue: typeof Vue_) {
      // Options
      // setOptions(merge(config, options, true))
      // Components
      Object.entries(components).forEach(([name, component]) => {
        registerComponent(Vue, component, name);
      });

      registerComponentProgrammatic(Vue, 'snackbar', MovSnackBarProgramatic);
    },
    api,
    stores,
    components,
    types,
    router,
    utils,
    errors,
    crs,
    i18n
  };

  return Flow_;
})();
