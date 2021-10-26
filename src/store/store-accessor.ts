import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import FlowStore from '@/flow/store/FlowStore';
import FlowUIStore from '@/flow/store/FlowUserInterfaceStore';
import GeocodeStore from '@/flow/store/GeocodeStore';
import Backend from '@/flow/api/backend';

let flowStore: FlowStore, flowUIStore: FlowUIStore, geocodeStore: GeocodeStore;

function initFlowStores(store: Store<unknown>): void {
  flowStore = getModule(FlowStore, store);
  flowUIStore = getModule(FlowUIStore, store);
  geocodeStore = getModule(GeocodeStore, store);
}

function bindAPI(backend: Backend) {
  flowStore.setApiClient(backend);
  flowStore.setUIStore(flowUIStore);
  flowUIStore.setLanguage('en');
}

export { bindAPI, initFlowStores, flowStore, flowUIStore, geocodeStore };
