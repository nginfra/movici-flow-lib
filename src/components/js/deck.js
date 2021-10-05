import Deck from '../map/Deck';

import { registerComponent } from '../../plugins.js';

const Plugin = {
  install(Vue) {
    registerComponent(Vue, Deck);
  }
};

export default Plugin;

export { Deck };
