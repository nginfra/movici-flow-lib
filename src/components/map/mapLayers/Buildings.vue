<script>
import layerMixin from './LayerMixin';

export default {
  name: 'Buildings.vue',
  mixins: [layerMixin],
  data() {
    return {
      id: 'basemap-static-buildings',
      sources: {
        'custom-buildings': {
          type: 'vector',
          url: 'mapbox://movici.dh_buildings'
        }
      },
      layer: {
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
      }
    };
  }
};
</script>

<style scoped></style>
