import MovActionBar from '../global/ActionBar';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, MovActionBar);
  }
};

export default Plugin;

export { MovActionBar };
