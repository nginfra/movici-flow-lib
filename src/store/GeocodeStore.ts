import { GeocodeSearchQuery, GeocodeSearchResult, GeocodeSuggestion } from '@/flow/types';
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { transform, reverseTransform } from '@/flow/crs';
import Backend from '../api/backend';

function transformResult(result: GeocodeSearchResult): GeocodeSearchResult {
  return Object.assign({}, result, {
    location: transform(result.location),
    bounding_box: [
      ...transform([result.bounding_box[0], result.bounding_box[1]]),
      ...transform([result.bounding_box[2], result.bounding_box[3]])
    ]
  });
}

function prepareQuery(query: GeocodeSearchQuery, epsg_code: number) {
  query = { ...query };
  if (query.nearby_location) {
    query.nearby_location = reverseTransform(query.nearby_location);
  }
  if (query.bounding_box) {
    query.bounding_box = [
      ...reverseTransform([query.bounding_box[0], query.bounding_box[1]]),
      ...reverseTransform([query.bounding_box[2], query.bounding_box[3]])
    ];
  }
  query.epsg_code = epsg_code;
  return query;
}

@Module({
  name: 'geocode',
  namespaced: true
})
class GeocodeStore extends VuexModule {
  suggestions: GeocodeSuggestion[] = [];
  upstreamEPSG = 28992;
  backend_: Backend | null = null;

  get backend() {
    return this.backend_;
  }

  @Mutation
  setSuggestions(suggestions: GeocodeSuggestion[]) {
    this.suggestions = suggestions;
  }

  @Mutation
  SET_BACKEND(backend: Backend) {
    this.backend_ = backend;
  }

  @Action({ rawError: true })
  async updateSuggestions(query: GeocodeSearchQuery) {
    if (!query) {
      this.setSuggestions([]);
      return;
    }

    this.setSuggestions(
      (await this.backend?.geocode.getSuggestions(prepareQuery(query, this.upstreamEPSG))) || []
    );
  }

  // add to client interface
  @Action({ rawError: true })
  async resolveSuggestion(suggestion: GeocodeSuggestion): Promise<GeocodeSearchResult | null> {
    const result = await this.backend?.geocode.resolveSuggestion(suggestion);
    return (result && transformResult(result)) || null;
  }

  @Action({ rawError: true })
  async getFirstResult(query: GeocodeSearchQuery): Promise<GeocodeSearchResult | null> {
    const result =
      (await this.backend?.geocode.getResults(prepareQuery(query, this.upstreamEPSG))) ?? [];
    return (result.length && transformResult(result[0])) || null;
  }
}

export default GeocodeStore;
