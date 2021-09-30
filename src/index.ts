import Vue_ from 'vue';
import * as components from './components';
import MovSnackBarProgramatic from './utils/snackbar';
import { registerComponent, registerComponentProgrammatic } from './plugins';

const Flow_ = {
  install(Vue: typeof Vue_) {
    // Options
    // setOptions(merge(config, options, true))
    // Components
    Object.values(components).forEach(component => {
      registerComponent(Vue, component);
    });

    registerComponentProgrammatic(Vue, 'snackbar', MovSnackBarProgramatic);
  }
};

export default Flow_;

// export api client and interfaces and request classes for the api
export * from './api';
// export all components
export * from './components';
// export all types
export * from './types';
// export router
export * from './router';
// export utils and others
export * from './utils';
export * from './errors';
export * from './crs';
