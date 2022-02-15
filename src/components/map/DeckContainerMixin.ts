import { ControllerOptions } from '@deck.gl/core/controllers/controller';
import { Component, Vue } from 'vue-property-decorator';
import { Layer } from '@deck.gl/core';

@Component
export default class DeckContainerMixin<D> extends Vue {
  protected basemap = 'mapbox://styles/mapbox/light-v10';
  protected controller: ControllerOptions | null = null;
  protected layers: Layer<D>[] = [];

  setBasemap(basemap: string) {
    this.basemap = basemap;
  }

  setController(c: ControllerOptions) {
    this.controller = c;
  }

  setLayers(layers: Layer<D>[]) {
    this.layers = layers;
  }
}
