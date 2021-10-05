import FlowMain from '../FlowMain';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, FlowMain);
  }
};

export default Plugin;

export { FlowMain };
