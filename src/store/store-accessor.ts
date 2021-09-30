import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import FlowStore from '@/flow/src/store/FlowStore';
import FlowUIStore from '@/flow/src/store/FlowUserInterfaceStore';
import GeocodeStore from '@/flow/src/store/GeocodeStore';
import Backend from '@/flow/src/api/backend';

let flowStore: FlowStore, flowUIStore: FlowUIStore, geocodeStore: GeocodeStore;

function initFlowStores(store: Store<unknown>): void {
  flowStore = getModule(FlowStore, store);
  flowUIStore = getModule(FlowUIStore, store);
  geocodeStore = getModule(GeocodeStore, store);
}

function bindAPI(backend: Backend) {
  flowStore.setApiClient(backend);
  flowUIStore.setLanguage('en');
}

export { bindAPI, initFlowStores, flowStore, flowUIStore, geocodeStore };
