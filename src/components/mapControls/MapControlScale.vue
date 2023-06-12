<script setup lang="ts">
import mapboxgl from "mapbox-gl";
import { watch } from "vue";

const props = defineProps<{ map?: mapboxgl.Map }>();
const control = new mapboxgl.ScaleControl({ maxWidth: 80 });
const currentMap: mapboxgl.Map | null = null;

function reattachControl(map?: mapboxgl.Map) {
  if (currentMap) {
    currentMap.removeControl(control);
  }
  map?.addControl(control);
}

watch(() => props.map, reattachControl);
</script>

<style scoped></style>
