import MovAction from '../global/Action';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, MovAction);
  }
};

export default Plugin;

export { MovAction };
