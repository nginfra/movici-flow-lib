<template>
  <div class="is-block">
    <div class="is-flex mb-0 is-variable is-1">
      <div class="is-flex-shrink-1 mr-4 colors">
        <div class="color-selection-container">
          <div class="fields-container is-flex-grow-1 is-flex is-flex-direction-column">
            <FlowColorPicker
              :value="output[selectedIndex]"
              @input="updateOutput(selectedIndex, $event)"
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
              <MovKebabMenu :value="colorActions" @invertColors="invertColors" />
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
          <MovKebabMenu
            :value="valueActions"
            @resetValues="$emit('resetValues')"
            @interpolateMinMax="$emit('interpolateMinMax')"
            v-if="!isEnum"
          />
        </span>
        <EnumInputs v-if="isEnum" :value="mappingValues" :enumLabels="entityEnums" />
        <BooleanInputs :value="mappingValues" v-else-if="isMode('boolean')" />
        <ByValueNumberInputs
          :value="mappingValues"
          @updateMappingValue="updateMappingValue($event.index, $event.val)"
          @removeRow="removeRow"
          :reversed="reversed"
          hasRemoveButton
          v-else-if="isMode('buckets') || isMode('gradient')"
        >
          <template v-if="isMode('buckets')" #after="{ index }">
            <span class="values-dash mx-1"> - </span>
            <span class="is-flex-grow-1 values-to">
              <b-numberinput
                v-if="isMaxIndex(index)"
                :value="maxValue"
                @input="updateMaxValue"
                :controls="false"
                :min-step="1e-15"
                class="has-text-centered"
                size="is-small"
              />
              <b-numberinput
                v-else
                :value="mappingValues[bucketEndIndex(index)]"
                :controls="false"
                :min-step="1e-15"
                class="has-text-centered"
                size="is-small"
                disabled
              />
            </span>
          </template>
        </ByValueNumberInputs>
      </div>
    </div>
    <b-button
      v-if="!isEnum"
      @click="addRow"
      :disabled="hexColors.length >= maxColors"
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
import { ActionMenuItem, RGBAColor } from '@movici-flow-common/types';
import FlowColorPicker from './FlowColorPicker.vue';
import Draggable from 'vuedraggable';
import ByValueListMixin from '../ByValueListMixin';
import BooleanInputs from '../shared/BooleanInputs.vue';
import ByValueNumberInputs from '../shared/ByValueNumberInputs.vue';
import EnumInputs from '../shared/EnumInputs.vue';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';

@Component({
  name: 'ByValueColorList',
  components: {
    FlowColorPicker,
    Draggable,
    BooleanInputs,
    EnumInputs,
    ByValueNumberInputs
  }
})
export default class ByValueColorList extends Mixins<ByValueListMixin<RGBAColor>, DraggableMixin>(
  ByValueListMixin,
  DraggableMixin
) {
  @Prop({ type: Array, default: () => [] }) readonly presets!: (RGBAColor | string)[];
  @Prop({ type: Number, default: 15 }) readonly maxColors!: number;
  defaultOutputRow = [255, 255, 255] as RGBAColor;
  group = 'by-value-colors';
  showColorPicker = false;
  selectedIndex = -1;

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

  get hexColors(): string[] {
    return this.orderedValue.map(c => colorTripleToHex(c[1]));
  }

  get valuesLabel() {
    return this.entityEnums?.length
      ? this.$t('flow.visualization.colorConfig.valueEnum')
      : this.mode == 'buckets'
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
    const gradientString = [...this.hexColors].join();
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
      this.move<RGBAColor>(event.moved.oldIndex, event.moved.newIndex, this.output).map(
        (d, idx) => {
          return [this.mappingValues[idx], d];
        }
      )
    );
  }

  invertColors() {
    this.emitOriginalOrder(
      this.orderedValue.map((val, i) => {
        return [val[0], this.value[i][1]];
      })
    );
  }

  isMaxIndex(index: number) {
    return this.reversed ? index === 0 : index === this.orderedValue.length - 1;
  }

  bucketEndIndex(index: number) {
    return this.reversed ? index - 1 : index + 1;
  }

  updateMaxValue(val: number) {
    this.$emit('update:max-value', val);
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
