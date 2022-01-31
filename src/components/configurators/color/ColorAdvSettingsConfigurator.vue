<template>
  <b-collapse v-model="isOpen">
    <template #trigger="{ open }">
      <b-icon size="is-small" :icon="open ? 'angle-right' : 'angle-down'"></b-icon>
      <label class="is-size-6-half mb-2">
        {{ $t('flow.visualization.colorConfig.advanced.title') }}
      </label>
    </template>
    <div class="columns mt-4 is-multiline">
      <div class="column py-0 is-two-thirds-desktop">
        <AdvColorList :value="advColors" @input="updateColor"></AdvColorList>
      </div>
      <div class="column py-0 is-one-third-desktop">
        <slot name="legend-labels" />
      </div>
    </div>
    <div class="columns is-multiline">
      <div class="column pb-1 is-half">
        <RenderOrder v-if="hasRenderOrder" v-model="renderOrder" />
      </div>
    </div>
    <div class="columns mb-2 is-multiline">
      <div class="column py-1 is-2" v-if="hasFillOpacity">
        <b-field :label="$t('flow.visualization.colorConfig.advanced.fillOpacity')">
          <span class="is-flex-grow-1 mr-2">
            <b-input
              size="is-small"
              type="number"
              max="100"
              min="0"
              v-model="fillOpacity"
            ></b-input>
          </span>
          <span class="is-size-6-half">%</span>
        </b-field>
      </div>
    </div>
  </b-collapse>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import {
  AdvColorMapping,
  ColorAdvancedSettings,
  FlowVisualizerType,
  RenderOrderType
} from '@movici-flow-common/types';
import { RGBAColor } from '@deck.gl/core';
import RenderOrder from './RenderOrder.vue';
import AdvColorList from './AdvColorList.vue';
import {
  DEFAULT_SPECIAL_COLOR_TRIPLE,
  DEFAULT_UNDEFINED_COLOR_TRIPLE
} from '@movici-flow-common/utils/colorUtils';
import { MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';

@Component({
  name: 'ColorAdvSettingsConfigurator',
  components: {
    RenderOrder,
    AdvColorList
  }
})
export default class ColorAdvSettingsConfigurator extends Vue {
  @Prop() value!: ColorAdvancedSettings;
  @Prop() geometry!: FlowVisualizerType;
  @Prop() fillType!: 'buckets' | 'gradient';
  @Prop() clauseType!: 'static' | 'byValue' | null;
  fillOpacity = 100;
  renderOrder: RenderOrderType = RenderOrderType.NONE;
  isOpen = false;
  colorPickerPresets = Object.values(MoviciColors);
  advColors: AdvColorMapping = [
    [-9999, DEFAULT_SPECIAL_COLOR_TRIPLE],
    ['null', DEFAULT_UNDEFINED_COLOR_TRIPLE]
  ];

  get hasRenderOrder() {
    return this.fillType === 'buckets' && this.clauseType === 'byValue';
  }

  get hasFillOpacity() {
    return this.geometry === 'polygons';
  }

  updateColor(update: { id: number; newValue: RGBAColor }) {
    this.advColors[update.id][1] = update.newValue;
    this.emitAdvancedSettings();
  }

  @Watch('fillOpacity')
  @Watch('renderOrder')
  emitAdvancedSettings() {
    const value: ColorAdvancedSettings = {
      specialColor: this.advColors[0][1],
      undefinedColor: this.advColors[1][1]
    };

    if (this.hasRenderOrder) {
      value.renderOrder = this.renderOrder;
    }

    if (this.hasFillOpacity) {
      value.fillOpacity = Number(this.fillOpacity);
    }

    this.$emit('input', value);
  }

  mounted() {
    this.emitAdvancedSettings();
  }
}
</script>

<style scoped lang="scss"></style>
