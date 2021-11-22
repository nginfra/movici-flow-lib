import Vue_ from 'vue';
import MovSnackBarProgramatic from './utils/snackbar';
import { registerComponent, registerInNamespace } from './plugins';
import * as components from './components';

interface FlowPluginOptions {
  homeRoute: string;
}
export default (() => {
  const Flow_ = {
    install(Vue: typeof Vue_, options?: Partial<FlowPluginOptions>) {
      Object.entries(components).forEach(([name, component]) => {
        registerComponent(Vue, component, name);
      });

      registerInNamespace(Vue, 'snackbar', MovSnackBarProgramatic);
      registerInNamespace(Vue, 'settings', {
        homeRoute: options?.homeRoute ?? ''
      });
    }
  };

  return Flow_;
})();
