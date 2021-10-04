import MovActionMenu from '../global/ActionMenu';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, MovActionMenu);
  }
};

export default Plugin;

export { MovActionMenu };
