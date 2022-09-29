import { Layer } from '@deck.gl/core';
import { DeckEvent, DeckEventCallback } from '@movici-flow-common/types';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({ name: 'DeckErrorHandling' })
export default class DeckErrorHandling extends Vue {
  @Prop({ type: Function, required: true }) on!: (
    event: DeckEvent,
    callbacks: Record<string, DeckEventCallback>
  ) => void;

  @Prop({
    type: Array,
    default: () => {
      return [];
    }
  })
  layerInfos!: ComposableVisualizerInfo[];

  @Watch('on', { immediate: true })
  registerErrorHandler() {
    this.on('error', {
      mapVis: ({ error, layer }) => {
        if (error && layer) {
          this.setError({ error, layer });
        }
      }
    });
  }

  setError({ error, layer }: { error: Error; layer: Layer<unknown> }) {
    for (const info of this.layerInfos) {
      if (layer.id.startsWith(info.id)) {
        info.setError('deck', error.message);
        break;
      }
    }
  }

  render() {
    return;
  }
}
