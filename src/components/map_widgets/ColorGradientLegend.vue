<template>
  <div class="gradient-container is-size-7" v-if="value.colorType === 'gradient'">
    <div class="gradient" :style="gradientColorStyle(value)"></div>
    <span class="is-flex is-justify-content-space-between">
      <span class="legend-value" v-for="(label, idx) in gradientColorLabel(value)" :key="idx">
        {{ label }}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { LegendItem } from '@/flow/src/types';
import { colorTripleToHex } from '@/flow/src/visualizers/maps/colorMaps';

@Component({
  name: 'ColorGradientLegend'
})
export default class ColorGradientLegend extends Vue {
  @Prop({ type: Object }) value!: LegendItem;

  gradientColorStyle(item: LegendItem): string {
    const colors = item.colorLegends.map(cl => cl[1]),
      gradientString = [...colors.map(color => colorTripleToHex(color))].join();
    return 'background: linear-gradient(90deg, ' + gradientString + ')';
  }

  gradientColorLabel(item: LegendItem): string[] {
    return item.colorLegends.map(cl => cl[0]);
  }
}
</script>

<style scoped lang="scss">
.gradient-container {
  .gradient {
    border-radius: 4px;
    width: 100%;
    height: 8px;
    background-color: $black;
  }
}
</style>
