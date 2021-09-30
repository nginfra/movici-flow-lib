export default {
  props: ['map'],

  methods: {
    attach() {
      this.addSources();
      this.map.addLayer({ ...this.layer, id: this.id });
      this.map.off('idle', this.attach);
    },
    addSources() {
      const sources = this.sources || {};
      for (let key of Object.keys(sources)) {
        this.map.addSource(key, sources[key]);
      }
    },
    removeSources() {
      const sources = this.sources || {};
      for (let key of Object.keys(sources)) {
        this.map.removeSource(key);
      }
    }
  },

  mounted() {
    this.map.on('idle', this.attach);
  },

  beforeDestroy() {
    this.map.removeLayer(this.id);
    this.removeSources();
  },

  render() {
    return {};
  }
};
