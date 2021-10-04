import MovLanguagePicker from '../global/LanguagePicker';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, MovLanguagePicker);
  }
};

export default Plugin;

export { MovLanguagePicker };
