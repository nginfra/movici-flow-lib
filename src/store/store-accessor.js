import { getModule } from 'vuex-module-decorators';
import FlowStore from '@/store/FlowStore';
import FlowUIStore from '@/store/FlowUserInterfaceStore';
import GeocodeStore from '@/store/GeocodeStore';
let flowStore, flowUIStore, geocodeStore;
function initFlowStores(store) {
    flowStore = getModule(FlowStore, store);
    flowUIStore = getModule(FlowUIStore, store);
    geocodeStore = getModule(GeocodeStore, store);
}
function bindAPI(backend) {
    flowStore.setApiClient(backend);
    flowStore.setUIStore(flowUIStore);
    flowUIStore.setLanguage('en');
}
export { bindAPI, initFlowStores, flowStore, flowUIStore, geocodeStore };
