<template>
  <div class="is-flex mb-0 is-variable is-1">
    <div class="is-flex-shrink-1 mr-4 colors">
      <div class="color-selection-container is-flex">
        <div class="gradient-container is-flex-shrink-1" v-if="isMode('gradient')">
          <span class="max">max</span>
          <div class="gradient" :style="gradientColorStyle"></div>
          <span class="min">min</span>
        </div>
        <div class="fields-container is-flex-grow-1 is-flex is-flex-direction-column">
          <FlowColorPicker
            :value="colors[selectedIndex]"
            @input="updateColor(selectedIndex, $event)"
            :presets="presets"
            :open="showColorPicker"
            @close="showColorPicker = false"
            :translateY="translateY"
          />
          <label class="label">{{ $t('flow.visualization.colorConfig.color') }}</label>
          <b-field class="is-flex color-item" v-for="(color, index) in hexColors" :key="index">
            <span class="caret" v-if="isMode('gradient')"></span>
            <span
              class="color-wrap"
              :class="{ active: selectedIndex === index }"
              :style="{ 'background-color': color }"
              @click="openColorPicker(index)"
            ></span>
          </b-field>
        </div>
      </div>
    </div>
    <div class="is-flex-grow-1 mapped-values">
      <label class="label">{{ valuesLabel }}</label>
      <template v-if="isMode('boolean')">
        <b-field v-for="(val, index) in mappingValues" class="is-align-items-center" :key="index">
          <b-input
            :value="String(Boolean(val))"
            native-class="has-text-centered"
            size="is-small"
            disabled
          ></b-input>
        </b-field>
      </template>
      <template v-else>
        <b-field
          v-for="(val, index) in mappingValues"
          class="is-align-items-center"
          :key="index"
          size="is-small"
        >
          <div class="values is-flex">
            <span class="is-flex-grow-1 values-from">
              <b-numberinput
                :value="val"
                @input="updateMappingValue(index, $event)"
                :controls="false"
                :min-step="1e-15"
                step="1"
                class="has-text-centered"
                size="is-small"
              />
            </span>
            <template v-if="isMode('buckets')">
              <span class="values-dash mx-1"> - </span>
              <span class="is-flex-grow-1 values-to">
                <b-numberinput
                  v-if="isMaxIndex(index)"
                  :value="maxValue"
                  @input="updateMaxValue"
                  :controls="false"
                  :min-step="1e-15"
                  step="1"
                  class="has-text-centered"
                  size="is-small"
                />
                <b-numberinput
                  v-else
                  :value="mappingValues[bucketEndIndex(index)]"
                  :controls="false"
                  :min-step="1e-15"
                  step="1"
                  class="has-text-centered"
                  size="is-small"
                  disabled
                />
              </span>
            </template>
          </div>
        </b-field>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { colorTripleToHex } from '@/flow/visualizers/maps/colorMaps';
import { ColorMapping, RGBAColor } from '@/flow/types';
import CustomSelect from '@/flow/components/global/CustomSelect.vue';
import FlowColorPicker from '@/flow/components/configurators/color/FlowColorPicker.vue';

type modes = 'buckets' | 'gradient' | 'boolean';
@Component({
  name: 'ByValueColorList',
  components: {
    CustomSelect,
    FlowColorPicker
  }
})
export default class ByValueColorList extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: ColorMapping;
  @Prop({ type: String, default: 'buckets' }) readonly mode!: modes;
  @Prop({ default: 0 }) readonly minValue!: number;
  @Prop({ default: 1 }) readonly maxValue!: number;
  @Prop({ type: Array, default: () => [] }) readonly presets!: (RGBAColor | string)[];
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;

  selectedIndex = -1;
  showColorPicker = false;

  get orderedValue(): ColorMapping {
    return this.reversed ? this.value.slice().reverse() : this.value;
  }
  get colors(): RGBAColor[] {
    return this.orderedValue.map(val => val[1]);
  }

  get hexColors(): string[] {
    return this.orderedValue.map(c => colorTripleToHex(c[1]));
  }

  get mappingValues(): number[] {
    return this.orderedValue.map(val => val[0]);
  }

  get valuesLabel() {
    return this.mode == 'buckets'
      ? this.$t('flow.visualization.colorConfig.valueRange')
      : this.$t('flow.visualization.colorConfig.value');
  }

  isMode(mode: modes) {
    return this.mode === mode;
  }

  get translateY() {
    return this.selectedIndex * 42 - 10;
  }

  isMaxIndex(index: number) {
    return this.reversed ? index === 0 : index === this.orderedValue.length - 1;
  }
  bucketEndIndex(index: number) {
    return this.reversed ? index - 1 : index + 1;
  }
  updateMappingValue(idx: number, newValue: number) {
    this.emitOriginalOrder(
      this.orderedValue.map((item, arrayIdx) => {
        return arrayIdx === idx ? [newValue, item[1]] : item;
      })
    );
  }
  updateColor(idx: number, newValue: RGBAColor) {
    this.emitOriginalOrder(
      this.orderedValue.map((item, arrayIdx) => {
        return arrayIdx === idx ? [item[0], newValue] : item;
      })
    );
  }
  updateMaxValue(val: number) {
    this.$emit('update:max-value', val);
  }

  emitOriginalOrder(values: ColorMapping) {
    if (this.reversed) {
      values = values.slice().reverse();
    }
    this.$emit('input', values);
  }

  get gradientColorStyle() {
    const gradientString = [...this.colors.map(color => colorTripleToHex(color))].join();
    return 'background: linear-gradient(' + gradientString + ')';
  }

  openColorPicker(index: number) {
    if (this.showColorPicker && this.selectedIndex === index) {
      this.showColorPicker = false;
      this.selectedIndex = -1;
    } else {
      this.selectedIndex = index;
      this.showColorPicker = true;
    }
  }
}
</script>

<style scoped lang="scss">
.colors {
  position: relative;
}

.has-addons {
  span {
    line-height: 1.85rem;
  }
}

.color-selection-container {
  .gradient-container {
    position: relative;
    margin-right: 12px;
    padding-left: 24px;
    padding-top: 37px;
    padding-bottom: 13px;
    span {
      position: absolute;
      left: 0;
      font-size: 11px;
      color: $grey;
      &.min {
        bottom: 5px;
      }
      &.max {
        top: 25px;
      }
    }
    .gradient {
      height: 100%;
      width: 8px;
      background-color: $black;
    }
  }
}
.color-item {
  .caret {
    position: absolute;
    width: 0;
    height: 0;
    top: 9px;
    left: 0;
    border: 4px solid $black;
    border-color: transparent transparent $grey-light $grey-light;
    transform-origin: 0 0;
    transform: rotate(45deg);
  }
}
</style>
