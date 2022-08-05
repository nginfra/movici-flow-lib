import { ControllerOptions } from '@deck.gl/core/controllers/controller';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Layer } from '@deck.gl/core';
import { MovDeck } from '..';
import { PopupManager } from '../map_widgets/PopupManager';

@Component
export default class DeckContainerMixin<D> extends Vue {
  @Ref('deck') readonly deckEl!: MovDeck;
  protected basemap = 'mapbox://styles/mapbox/light-v10';
  protected controller: ControllerOptions | null = null;
  protected layers: Layer<D>[] = [];
  popup: PopupManager | null = null;

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
