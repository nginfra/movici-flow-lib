import { Store } from 'vuex';
import FlowStore from '@/store/FlowStore';
import FlowUIStore from '@/store/FlowUserInterfaceStore';
import GeocodeStore from '@/store/GeocodeStore';
import Backend from '@/api/backend';
declare let flowStore: FlowStore, flowUIStore: FlowUIStore, geocodeStore: GeocodeStore;
declare function initFlowStores(store: Store<unknown>): void;
declare function bindAPI(backend: Backend): void;
export { bindAPI, initFlowStores, flowStore, flowUIStore, geocodeStore };
