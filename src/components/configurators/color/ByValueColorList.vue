<template>
  <div class="is-block">
    <div class="is-flex mb-0 is-variable is-1">
      <div class="is-flex-shrink-1 mr-4 colors">
        <div class="color-selection-container">
          <div class="fields-container is-flex-grow-1 is-flex is-flex-direction-column">
            <FlowColorPicker
              :value="colors[selectedIndex]"
              @input="updateColor(selectedIndex, $event)"
              :presets="presets"
              :open="showColorPicker"
              @close="showColorPicker = false"
              :translateX="translateX"
              :translateY="translateY"
              position="right"
            />
            <span class="is-flex">
              <label class="label mr-1 is-flex-grow-1">{{
                $t('flow.visualization.colorConfig.color')
              }}</label>
              <MovActionMenu :value="colorActions" @invertColors="invertColors" />
            </span>
            <span class="is-flex">
              <div class="field-container">
                <Draggable
                  :value="hexColors"
                  v-bind="draggableOptions"
                  v-on="draggableEvents"
                  class="draggable"
                  :class="{ dashed: drag }"
                  @change="updateDraggable"
                >
                  <b-field
                    class="is-flex color-item"
                    v-for="(color, index) in hexColors"
                    :key="index"
                  >
                    <span class="grip mx-1">
                      <span class="icon is-small fa-stack has-text-grey">
                        <i class="far fa-ellipsis-v"></i>
                        <i class="far fa-ellipsis-v"></i>
                      </span>
                    </span>
                    <span
                      class="color-wrap"
                      :class="{ active: selectedIndex === index }"
                      :style="{ 'background-color': color }"
                      @click="openColorPicker(index)"
                    ></span>
                    <span class="caret" v-if="isMode('gradient')"></span>
                  </b-field>
                </Draggable>
              </div>
              <div class="gradient-container is-flex-shrink-1" v-if="isMode('gradient')">
                <div class="gradient" :style="gradientColorStyle"></div>
              </div>
            </span>
          </div>
        </div>
      </div>
      <div class="is-flex-grow-1 mapped-values">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">{{ valuesLabel }}</label>
          <MovActionMenu
            :value="valueActions"
            @resetValues="$emit('resetValues')"
            @interpolateMinMax="$emit('interpolateMinMax')"
          />
        </span>
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
              <b-button
                @click="removeColor(index)"
                :title="$t('flow.visualization.colorConfig.removeRow')"
                class="ml-1 is-transparent is-borderless has-text-danger"
                icon-pack="far"
                icon-left="minus-circle"
                size="is-small"
              />
            </div>
          </b-field>
        </template>
      </div>
    </div>
    <b-button
      @click="addColor"
      :disabled="hexColors.length >= 8"
      class="is-size-7 is-transparent is-borderless has-text-primary has-text-weight-bold mt-2"
      icon-pack="far"
      icon-left="plus-circle"
      size="is-small"
    >
      {{ $t('flow.visualization.colorConfig.addRow') }}
    </b-button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator';
import { colorTripleToHex } from '@movici-flow-common/visualizers/maps/colorMaps';
import { ActionMenuItem, ColorMapping, RGBAColor } from '@movici-flow-common/types';
import FlowColorPicker from './FlowColorPicker.vue';
import Draggable from 'vuedraggable';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';

type modes = 'buckets' | 'gradient' | 'boolean';
@Component({
  name: 'ByValueColorList',
  components: {
    FlowColorPicker,
    Draggable
  }
})
export default class ByValueColorList extends Mixins(DraggableMixin) {
  @Prop({ type: Array, default: () => [] }) readonly value!: ColorMapping;
  @Prop({ type: String, default: 'buckets' }) readonly mode!: modes;
  @Prop({ type: Number, default: 0 }) readonly minValue!: number;
  @Prop({ type: Number, default: 1 }) readonly maxValue!: number;
  @Prop({ type: Array, default: () => [] }) readonly presets!: (RGBAColor | string)[];
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;
  @Prop({ type: String, default: null }) readonly dataType!: string | null;
  group = 'by-value-colors';
  selectedIndex = -1;
  showColorPicker = false;

  get colorActions(): ActionMenuItem[] {
    return [
      {
        label: '' + this.$t('flow.visualization.colorConfig.invertColors'),
        icon: 'sort',
        iconPack: 'far',
        event: 'invertColors'
      }
    ];
  }

  get valueActions(): ActionMenuItem[] {
    return [
      {
        label: '' + this.$t('flow.visualization.resetValues'),
        icon: 'undo',
        iconPack: 'far',
        event: 'resetValues'
      },
      {
        label: '' + this.$t('flow.visualization.interpolateMinMax'),
        icon: 'sort',
        iconPack: 'far',
        event: 'interpolateMinMax',
        isDisabled: this.dataType === 'BOOLEAN'
      }
    ];
  }

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

  get translateX() {
    return this.mode == 'gradient' ? 38 : 15;
  }

  get translateY() {
    return this.selectedIndex * 42 - 7;
  }

  get gradientColorStyle() {
    const gradientString = [...this.colors.map(color => colorTripleToHex(color))].join();
    return 'background: linear-gradient(' + gradientString + ')';
  }

  get draggableOptions() {
    return {
      animation: 500,
      group: 'by-value-colors',
      disabled: false,
      ghostClass: 'ghost',
      handle: '.grip'
    };
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    this.emitOriginalOrder(
      this.move(event.moved.oldIndex, event.moved.newIndex, this.colors).map((d, idx) => {
        return [this.mappingValues[idx], d];
      })
    );
  }

  invertColors() {
    this.emitOriginalOrder(
      this.orderedValue.map((val, i) => {
        return [val[0], this.value[i][1]];
      })
    );
  }

  isMode(mode: modes) {
    return this.mode === mode;
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

  addColor() {
    const data = [...this.orderedValue];
    data.push([0, [255, 255, 255]]);
    this.emitOriginalOrder(data);
  }

  removeColor(idx: number) {
    const data = [...this.orderedValue];
    data.splice(idx, 1);
    this.emitOriginalOrder(data);
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
    margin-right: 5px;
    padding: 11px 0 11px 11px;

    span {
      position: absolute;
      left: 11px;
      font-size: 11px;
      color: $grey;
      &.min {
        bottom: -3px;
      }
      &.max {
        top: -3px;
      }
    }
    .gradient {
      height: 100%;
      width: 8px;
      background-color: $black;
    }
  }
}
</style>
