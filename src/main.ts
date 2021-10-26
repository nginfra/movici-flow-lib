import Vue_ from 'vue';
import MovSnackBarProgramatic from './utils/snackbar';
import { registerComponent, registerComponentProgrammatic } from './plugins';
import * as components from './components';

export default (() => {
  const Flow_ = {
    install(Vue: typeof Vue_) {
      Object.entries(components).forEach(([name, component]) => {
        registerComponent(Vue, component, name);
      });

      registerComponentProgrammatic(Vue, 'snackbar', MovSnackBarProgramatic);
    }
  };

  return Flow_;
})();
