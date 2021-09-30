<template>
  <b-field
    class="search"
    :class="{ expand: expand, 'is-right': isRight }"
    @keydown.native.enter="getFirstSearchResult"
    @keydown.native.esc="search = ''"
  >
    <b-autocomplete
      v-model="search"
      :open-on-focus="true"
      :data="suggestions"
      :clearable="true"
      @icon-click="expand = false"
      @select="selectLocationFromSuggestion"
      @typing="onTyping"
      field="text"
      size="is-small"
      ref="autocomplete"
      placeholder="Search location..."
      icon="search"
      icon-clickable
      v-if="expand"
    >
      <template #empty>
        <span v-if="search" class="is-small">
          {{ errors }}
        </span>
      </template>
    </b-autocomplete>
    <b-button
      class="expander"
      size="is-small"
      v-show="!expand"
      @click="expandAndFocus"
      icon-left="search"
    />
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import {
  CameraOptions,
  GeocodeSearchQuery,
  GeocodeSearchResult,
  GeocodeSuggestion
} from '@/flow/src/types';
import { flowUIStore, geocodeStore } from '@/flow/src/store/store-accessor';
import mapboxgl from 'mapbox-gl';

@Component({
  name: 'SearchBar'
})
export default class SearchBar extends Vue {
  @Prop([Object]) readonly viewState!: CameraOptions;
  @Prop({ type: Object, default: null }) readonly map!: mapboxgl.Map | null;
  @Prop({ type: Boolean, default: false }) readonly isRight!: boolean;
  @Ref() readonly autocomplete!: { focus: () => void };

  search = '';
  errors = '';
  result: GeocodeSearchResult | null = null;
  marker: mapboxgl.Marker | null = null;
  expand = false;
  typing = false;

  get query(): GeocodeSearchQuery | null {
    if (!this.search) return null;
    return {
      query: this.search,
      language: flowUIStore.lang,
      nearby_location: [this.viewState.longitude, this.viewState.latitude]
    };
  }

  get suggestions(): GeocodeSuggestion[] {
    return geocodeStore.suggestions;
  }

  expandAndFocus() {
    this.expand = true;
    this.$nextTick(() => this.autocomplete.focus());
  }

  async getFirstSearchResult() {
    this.result = null;
    if (this.query) {
      this.result = await geocodeStore.getFirstResult(this.query);
      if (this.result) {
        this.search = this.result.text;
      } else {
        this.errors = 'No result found';
      }
    }
  }

  async selectLocationFromSuggestion(suggestion?: GeocodeSuggestion) {
    if (suggestion) {
      this.result = await geocodeStore.resolveSuggestion(suggestion);
    }
  }

  updateViewState(viewState: Partial<CameraOptions>) {
    this.$emit('update:view-state', Object.assign({}, this.viewState, viewState));
  }

  updateMarker(result: GeocodeSearchResult | null, map: mapboxgl.Map) {
    if (this.marker) {
      this.marker.setPopup();
      this.marker.remove();
    }
    this.marker = null;

    if (result) {
      this.marker = new mapboxgl.Marker()
        .setLngLat(result.location)
        .setPopup(new mapboxgl.Popup().setHTML(result.text))
        .addTo(map);

      this.marker.togglePopup();
    }
  }

  @Watch('result')
  onResult(result: GeocodeSearchResult | null) {
    this.map && this.updateMarker(result, this.map);
    if (!result) return;
    this.updateViewState({
      longitude: result.location[0],
      latitude: result.location[1],
      zoom: 11,
      transitionDuration: 300
    });
  }

  @Watch('search')
  onSearch(search: string | null) {
    if (!search) {
      this.map && this.updateMarker(null, this.map);
      if (!this.typing) {
        this.expand = false;
      }
    }
    this.typing = false;
  }

  onTyping() {
    this.typing = true;
  }

  @Watch('query')
  async updateSuggestions(query: GeocodeSearchQuery | null) {
    this.errors = '';
    if (!query) {
      geocodeStore.setSuggestions([]);
      return;
    }
    await geocodeStore.updateSuggestions(query);
    if (!this.suggestions.length) {
      this.errors = 'No nearby result found';
    }
  }
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
      ::v-deep {
        .dropdown-menu {
          margin-left: 0;
        }
      }
    }
  }
  .expander {
    padding: 0;
    width: inherit;
    ::v-deep .icon {
      margin-right: auto;
      margin-left: calc(0.5em - 2px);
    }
  }
  .autocomplete {
    width: 30px;
    ::v-deep {
      .dropdown-menu {
        display: block;
        margin-left: 20%;
        min-width: 80%;
        max-width: 80%;
        .dropdown-item {
          padding-right: 1rem;
        }
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
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);
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
