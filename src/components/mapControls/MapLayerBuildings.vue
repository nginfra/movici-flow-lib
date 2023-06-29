<script setup lang="ts">
import { useMapLayer } from "@movici-flow-lib/composables/useMapLayer";
import type mapboxgl from "mapbox-gl";
import { onBeforeUnmount, onMounted, toRef } from "vue";

const props = defineProps<{
  map?: mapboxgl.Map;
}>();
const { mount, unmount } = useMapLayer(toRef(props, "map"));
onMounted(() => {
  mount({
    layer: {
      id: "basemap-static-buildings",
      source: "custom-buildings",
      "source-layer": "original",
      type: "fill-extrusion",
      paint: {
        "fill-extrusion-color": "#aaa",
        // use an 'interpolate' expression to add a smooth transition effect to the
        // buildings as the user zooms in
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12,
          0,
          13,
          ["get", "abs_h_max"],
        ],
        "fill-extrusion-opacity": 0.8,
      },
    },
    sources: {
      "custom-buildings": {
        type: "vector",
        url: "mapbox://movici.dh_buildings",
      },
    },
  });
});
onBeforeUnmount(unmount);
</script>

<style scoped></style>
