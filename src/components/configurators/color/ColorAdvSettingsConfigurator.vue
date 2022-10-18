<template>
  <b-collapse v-model="isOpen">
    <template #trigger="{ open }">
      <span class="is-flex is-align-items-center mb-2">
        <b-button
          class="mr-2 is-transparent is-borderless"
          size="is-small"
          :icon-left="open ? 'angle-down' : 'angle-up'"
        />
        <label class="is-size-6-half ml-1">
          {{ $t('flow.visualization.colorConfig.advanced.title') }}
        </label>
      </span>
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
  AdvancedColorSettings,
  FlowVisualizerType,
  RenderOrderType
} from '@movici-flow-common/types';
import { RGBAColor } from '@deck.gl/core';
import RenderOrder from './RenderOrder.vue';
import AdvColorList from './AdvColorList.vue';
import {
  DEFAULT_SPECIAL_COLOR_TRIPLE,
  DEFAULT_UNDEFINED_COLOR_TRIPLE,
  DEFAULT_POLYGON_FILL_OPACITY
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
  @Prop({ type: Object, default: null }) readonly value!: AdvancedColorSettings | null;
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: String, default: 'buckets' }) readonly fillType!: 'buckets' | 'gradient';
  @Prop({ type: String, default: null }) readonly clauseType!: 'static' | 'byValue' | null;
  fillOpacity = DEFAULT_POLYGON_FILL_OPACITY;
  renderOrder: RenderOrderType = RenderOrderType.DISABLED;
  isOpen = false;
  colorPickerPresets = Object.values(MoviciColors);

  get hasRenderOrder() {
    return this.fillType === 'buckets';
  }

  get hasFillOpacity() {
    return this.geometry === 'polygons';
  }

  get advColors(): AdvColorMapping {
    return [
      [-9999, this.value?.specialColor ?? DEFAULT_SPECIAL_COLOR_TRIPLE],
      ['null', this.value?.undefinedColor ?? DEFAULT_UNDEFINED_COLOR_TRIPLE]
    ];
  }

  updateColor({ id, newValue }: { id: number; newValue: RGBAColor }) {
    this.emitAdvancedSettings(id == 0 ? { specialColor: newValue } : { undefinedColor: newValue });
  }

  @Watch('fillOpacity')
  @Watch('renderOrder')
  emitAdvancedSettings(params?: { specialColor?: RGBAColor; undefinedColor?: RGBAColor }) {
    const value: AdvancedColorSettings = {
      specialColor: params?.specialColor ?? this.advColors[0][1],
      undefinedColor: params?.undefinedColor ?? this.advColors[1][1]
    };

    if (this.hasRenderOrder) {
      value.renderOrder = this.renderOrder;
    } else {
      delete value.renderOrder;
    }

    if (this.hasFillOpacity) {
      value.fillOpacity = Number(this.fillOpacity);
    }

    this.$emit('input', value);
  }

  @Watch('value', { immediate: true })
  onValueChange(value: AdvancedColorSettings | null) {
    this.renderOrder = value?.renderOrder ?? RenderOrderType.DISABLED;
    this.fillOpacity = value?.fillOpacity ?? DEFAULT_POLYGON_FILL_OPACITY;
  }

  mounted() {
    if (this.value) {
      this.isOpen = true;
    }
    this.emitAdvancedSettings();
  }
}
</script>

<style scoped lang="scss"></style>
