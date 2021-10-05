import FlowVisualization from '../FlowVisualization';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, FlowVisualization);
  }
};

export default Plugin;

export { FlowVisualization };
