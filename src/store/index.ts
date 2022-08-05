import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { initFlowStores } from '@movici-flow-common/store/store-accessor';
import FlowStore from './FlowStore';
import FlowUIStore from './FlowUserInterfaceStore';
import GeocodeStore from './GeocodeStore';
import FlowVisualizationStore from './FlowVisualizationStore';
Vue.use(Vuex);

export default new Store({
  plugins: [initFlowStores],
  modules: {
    flow: FlowStore,
    flowUI: FlowUIStore,
    flowVisualization: FlowVisualizationStore,
    geocode: GeocodeStore
  }
});
