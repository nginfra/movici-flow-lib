import MapVis from '../map/MapVis';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, MapVis);
  }
};

export default Plugin;

export { MapVis };
