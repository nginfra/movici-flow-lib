import FlowExport from '../FlowExport';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, FlowExport);
  }
};

export default Plugin;

export { FlowExport };
