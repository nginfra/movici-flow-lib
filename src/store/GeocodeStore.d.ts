import { GeocodeSearchQuery, GeocodeSearchResult, GeocodeSuggestion } from '@/types';
import { VuexModule } from 'vuex-module-decorators';
import Backend from '../api/backend';
declare class GeocodeStore extends VuexModule {
    suggestions: GeocodeSuggestion[];
    upstreamEPSG: number;
    backend_: Backend | null;
    get backend(): Backend | null;
    setSuggestions(suggestions: GeocodeSuggestion[]): void;
    SET_BACKEND(backend: Backend): void;
    updateSuggestions(query: GeocodeSearchQuery): Promise<void>;
    resolveSuggestion(suggestion: GeocodeSuggestion): Promise<GeocodeSearchResult | null>;
    getFirstResult(query: GeocodeSearchQuery): Promise<GeocodeSearchResult | null>;
}
export default GeocodeStore;
