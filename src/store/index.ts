import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { initFlowStores } from '@movici-flow-common/store/store-accessor';
import FlowStore from '@movici-flow-common/store/FlowStore';
import FlowUIStore from '@movici-flow-common/store/FlowUserInterfaceStore';
import GeocodeStore from '@movici-flow-common/store/GeocodeStore';
Vue.use(Vuex);

export default new Store({
  plugins: [initFlowStores],
  modules: {
    flow: FlowStore,
    flowUI: FlowUIStore,
    geocode: GeocodeStore
  }
});
