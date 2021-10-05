import FlowDatasets from '../FlowDatasets';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, FlowDatasets);
  }
};

export default Plugin;

export { FlowDatasets };
