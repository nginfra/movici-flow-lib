<template>
  <o-field
    v-if="expand"
    title="Search"
    class="search expand"
    :class="{ 'is-right': isRight }"
    @keydown.enter="getFirstSearchResult"
    @keydown.esc="searchText = ''"
  >
    <o-autocomplete
      v-model="searchText"
      :open-on-focus="true"
      :data="suggestions"
      :clearable="true"
      :debounce-typing="200"
      @icon-click="expand = false"
      @select="selectLocationFromSuggestion"
      @typing="getSuggestions"
      field="text"
      size="small"
      ref="autocomplete"
      placeholder="Search location..."
      icon="search"
      icon-clickable
      v-if="expand"
    >
      <template v-if="searchText" #empty>
        <span class="is-small">
          {{ errorText }}
        </span>
      </template>
    </o-autocomplete>
  </o-field>
  <o-field v-else>
    <o-button
      class="expander is-border-transparent"
      size="small"
      @click="expandAndFocus"
      icon-left="search"
    />
  </o-field>
</template>

<script setup lang="ts">
import { useGeocoding } from "@movici-flow-lib/composables/useGeocoding";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type {
  DeckCamera,
  GeocodeSearchQuery,
  GeocodeSearchResult,
  GeocodeSuggestion,
} from "@movici-flow-lib/types";
import mapboxgl from "mapbox-gl";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  camera: DeckCamera;
  map?: mapboxgl.Map;
  isRight?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:camera", val: DeckCamera): void;
}>();

const autocomplete = ref<HTMLElement | null>(null);
const marker = ref<mapboxgl.Marker | null>(null);
const expand = ref(false);
const viewState = computed(() => props.camera.viewState);
function makeQuery(text: string): GeocodeSearchQuery | null {
  if (!text || !viewState.value) return null;

  return {
    query: text,
    nearby_location: [viewState.value.longitude, viewState.value.latitude],
  };
}

const flowStore = useFlowStore();

const { suggestions, searchText, errorText, getFirstResult, updateSuggestions, resolveSuggestion } =
  useGeocoding(flowStore.backend!, useI18n().locale);

watch(searchText, () => {
  if (!searchText.value) {
    updateMarker(null);
  }
});
async function getSuggestions(text: string) {
  await updateSuggestions(makeQuery(text));
}

async function getFirstSearchResult() {
  const query = makeQuery(searchText.value);
  const result = await getFirstResult(query);
  onResult(result);
}

async function selectLocationFromSuggestion(suggestion?: GeocodeSuggestion) {
  if (suggestion) {
    onResult(await resolveSuggestion(suggestion));
  }
}

function onResult(result: GeocodeSearchResult | null) {
  updateMarker(result);

  if (!result) return;

  emit("update:camera", {
    viewState: {
      longitude: result.location[0],
      latitude: result.location[1],
      zoom: 11,
      transitionDuration: 300,
      pitch: viewState.value?.pitch ?? 0,
      bearing: viewState.value?.bearing ?? 0,
    },
  });
}

function updateMarker(result: GeocodeSearchResult | null) {
  if (!props.map) return;
  if (marker.value) {
    marker.value.setPopup();
    marker.value.remove();
    marker.value = null;
  }

  if (result) {
    marker.value = new mapboxgl.Marker()
      .setLngLat(result.location)
      .setPopup(new mapboxgl.Popup().setHTML(result.text))
      .addTo(props.map);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS-2589 Type instantiation is excessively deep and possibly infinite
    marker.value.togglePopup();
  }
}

function expandAndFocus() {
  expand.value = true;
  nextTick(() => autocomplete.value?.focus());
}
</script>

<style scoped lang="scss">
.search {
  width: 30px;
  &.is-right {
    position: absolute;
    right: 0;
    &.expand {
      width: 250px !important;
    }
    .autocomplete {
      :deep(.dropdown-menu) {
        margin-left: 0;
      }
    }
  }
  .expander {
    padding: 0;
    width: inherit;
    &:hover {
      background-color: $white-ter;
    }
  }
  .autocomplete {
    width: 30px;
    :deep(.input) {
      border-color: transparent;
    }
    :deep(.dropdown-menu) {
      display: block;
      margin-left: 20%;
      min-width: 80%;
      max-width: 80%;
      .dropdown-item {
        padding-right: 1rem;
      }
    }
  }
  &.expand {
    .autocomplete {
      width: 250px !important;
    }
  }
  .help {
    @include border-radius;
    background-color: white;
    padding: 0.875rem 3rem 0.875rem 1rem;
    width: 80%;
    box-shadow:
      0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
      0 0px 0 1px rgba(10, 10, 10, 0.02);
    font-size: 0.875rem;
  }
  input {
    padding-right: 0 !important;
  }
  .icon {
    color: #000 !important;
  }
}
</style>
