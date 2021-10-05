import FlowScenario from '../FlowScenario';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, FlowScenario);
  }
};

export default Plugin;

export { FlowScenario };
