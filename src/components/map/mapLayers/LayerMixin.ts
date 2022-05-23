import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class LayerMixin extends Vue {
  @Prop({ type: Object }) readonly map?: mapboxgl.Map;
  sources: Record<string, mapboxgl.AnySourceData> | null = null;
  layer: mapboxgl.AnyLayer | null = null;
  id!: string;

  attach() {
    this.addSources();
    const layer = { ...this.layer, id: this.id } as mapboxgl.AnyLayer;
    this.map?.addLayer(layer);
    this.map?.off('idle', this.attach);
  }

  addSources() {
    const sources = this.sources || {};
    for (const key of Object.keys(sources)) {
      if (sources[key]) this.map?.addSource(key, sources[key]);
    }
  }

  removeSources() {
    const sources = this.sources || {};
    for (const key of Object.keys(sources)) {
      this.map?.removeSource(key);
    }
  }

  mounted() {
    this.map?.on('idle', this.attach);
  }

  beforeDestroy() {
    this.map?.removeLayer(this.id);
    this.removeSources();
  }
}
