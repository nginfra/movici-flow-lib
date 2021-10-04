import MovTooltipInfo from '../global/TooltipInfo';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, MovTooltipInfo);
  }
};

export default Plugin;

export { MovTooltipInfo };
