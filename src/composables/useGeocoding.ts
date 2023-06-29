import type {
  Backend,
  GeocodeSearchQuery,
  GeocodeSearchResult,
  GeocodeSuggestion,
  RefLike,
} from "@movici-flow-lib/types";
import { ref, unref, type Ref, watch } from "vue";
import { reverseTransform, transform } from "../crs";

function transformResult(result: GeocodeSearchResult): GeocodeSearchResult {
  return Object.assign({}, result, {
    location: transform(result.location),
    bounding_box: [
      ...transform([result.bounding_box[0], result.bounding_box[1]]),
      ...transform([result.bounding_box[2], result.bounding_box[3]]),
    ],
  });
}

function prepareQueryWithCRS(query: GeocodeSearchQuery, epsg_code: number) {
  query = { ...query };
  if (query.nearby_location) {
    query.nearby_location = reverseTransform(query.nearby_location);
  }
  if (query.bounding_box) {
    query.bounding_box = [
      ...reverseTransform([query.bounding_box[0], query.bounding_box[1]]),
      ...reverseTransform([query.bounding_box[2], query.bounding_box[3]]),
    ];
  }
  query.epsg_code = epsg_code;
  return query;
}

export function useGeocoding(backend: RefLike<Backend>, locale?: RefLike<string>) {
  const suggestions = ref([]) as Ref<GeocodeSuggestion[]>;
  const errorText = ref("");
  const searchText = ref("");

  const upstreamEPSG = ref(4326);
  let upstreamEPSGResolved = false;

  async function prepareQuery(query: GeocodeSearchQuery) {
    query.language = unref(locale);
    return prepareQueryWithCRS(query, await getUpstreamEPSG());
  }

  async function getUpstreamEPSG() {
    if (!upstreamEPSGResolved) {
      upstreamEPSG.value = await unref(backend).geocode.upstreamEPSG();
      upstreamEPSGResolved = true;
    }
    return upstreamEPSG.value;
  }
  watch(searchText, () => {
    if (!searchText.value) {
      errorText.value = "";
    }
  });
  return {
    suggestions,
    upstreamEPSG,
    errorText,
    searchText,
    async updateSuggestions(query: GeocodeSearchQuery | null) {
      errorText.value = "";

      if (!query) {
        suggestions.value = [];
        return;
      }

      query = await prepareQuery(query);
      const result = await unref(backend).geocode.getSuggestions(query);
      if (result?.length) {
        suggestions.value = result;
      } else {
        suggestions.value = [];
        errorText.value = "No nearby result found";
      }
    },

    async resolveSuggestion(suggestion: GeocodeSuggestion): Promise<GeocodeSearchResult | null> {
      const result = await unref(backend).geocode.resolveSuggestion(suggestion);
      return result ? transformResult(result) : null;
    },

    async getFirstResult(query: GeocodeSearchQuery | null): Promise<GeocodeSearchResult | null> {
      errorText.value = "";
      if (!query) {
        return null;
      }
      query = await prepareQuery(query);

      const result = await unref(backend).geocode.getResults(query);

      if (!result?.length) {
        errorText.value = "No result found";
        return null;
      }
      return transformResult(result[0]);
    },
  };
}
