import { GeocodeSearchQuery, GeocodeSearchResult, GeocodeSuggestion } from '@/types';

export default interface GeocodeService {
  resolveSuggestion(suggestion: GeocodeSuggestion): Promise<GeocodeSearchResult | null>;
  getSuggestions(query: GeocodeSearchQuery): Promise<GeocodeSuggestion[] | null>;
  getResults(query: GeocodeSearchQuery): Promise<GeocodeSearchResult[] | null>;
}
