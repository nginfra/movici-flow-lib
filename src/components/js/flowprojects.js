import FlowProjects from '../FlowProjects';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, FlowProjects);
  }
};

export default Plugin;

export { FlowProjects };
