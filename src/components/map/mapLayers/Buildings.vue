<template>
  <span></span>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator';
import LayerMixin from './LayerMixin';

@Component({
  name: 'Buildings'
})
export default class Buildings extends Mixins(LayerMixin) {
  id = 'basemap-static-buildings';
  sources: Record<string, mapboxgl.AnySourceData> = {
    'custom-buildings': {
      type: 'vector',
      url: 'mapbox://movici.dh_buildings'
    }
  };
  layer: mapboxgl.AnyLayer = {
    id: this.id,
    source: 'custom-buildings',
    'source-layer': 'original',
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': '#aaa',
      // use an 'interpolate' expression to add a smooth transition effect to the
      // buildings as the user zooms in
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        0,
        13,
        ['get', 'abs_h_max']
      ],
      'fill-extrusion-opacity': 0.8
    }
  };
}
</script>

<style scoped></style>
