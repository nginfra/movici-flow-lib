<script lang="ts">
import mapboxgl, { Control } from 'mapbox-gl';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'Scale'
})
export default class Scale extends Vue {
  @Prop([Object]) readonly map!: mapboxgl.Map;
  control: Control | null = null;

  mounted() {
    this.control = new mapboxgl.ScaleControl({ maxWidth: 80 });
    this.map.addControl(this.control);
  }

  beforeDestroy() {
    if (this.control) {
      this.map.removeControl(this.control);
    }
  }

  render() {
    return;
  }
}
</script>

<style scoped></style>
