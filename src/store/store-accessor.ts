import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import FlowStore from './FlowStore';
import FlowUIStore from './FlowUserInterfaceStore';
import GeocodeStore from './GeocodeStore';
import { Backend } from '../types/backend';
import FlowVisualizationStore from './FlowVisualizationStore';

let flowStore: FlowStore,
  flowUIStore: FlowUIStore,
  flowVisualizationStore: FlowVisualizationStore,
  geocodeStore: GeocodeStore;

function initFlowStores(store: Store<unknown>): void {
  flowStore = getModule(FlowStore, store);
  flowUIStore = getModule(FlowUIStore, store);
  flowVisualizationStore = getModule(FlowVisualizationStore, store);
  geocodeStore = getModule(GeocodeStore, store);

  flowStore.setUIStore(flowUIStore);
}

function bindAPI(backend: Backend) {
  flowStore.setApiClient(backend);
  flowVisualizationStore.setApiClient(backend);
  geocodeStore.setApiClient(backend);
}

export { bindAPI, initFlowStores, flowStore, flowUIStore, flowVisualizationStore, geocodeStore };
