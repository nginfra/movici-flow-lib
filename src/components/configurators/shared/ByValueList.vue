<template>
  <div class="is-block">
    <div class="is-flex min-max mt-1">
      <div class="is-flex-shrink-1 is-flex-direction-column mr-4">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">{{ label }}</label>
          <MovKebabMenu :value="outputActions" @invertOutput="invertOutput" />
        </span>
        <span class="is-flex">
          <div>
            <Draggable
              :value="orderedValue"
              v-bind="draggableOptions"
              v-on="draggableEvents"
              class="draggable"
              :class="{ dashed: drag }"
              @change="updateDraggable"
            >
              <b-field class="is-flex output-item" v-for="(val, i) in output" :key="i">
                <span class="grip mx-1">
                  <span class="icon is-small fa-stack has-text-grey">
                    <i class="far fa-ellipsis-v"></i>
                    <i class="far fa-ellipsis-v"></i>
                  </span>
                </span>
                <span>
                  <component
                    :is="component"
                    v-bind="props"
                    :value="val"
                    @input="updateOutput(i, $event)"
                    @click="$emit('click', i)"
                  />
                </span>
              </b-field>
            </Draggable>
          </div>
          <slot name="after-output" v-bind="{ output }"></slot>
        </span>
      </div>
      <div class="is-flex is-flex-grow-1 is-flex-direction-column">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">
            {{ valueHeader }}
          </label>
          <MovKebabMenu
            v-if="isMode('number')"
            :value="valueActions"
            @resetValues="$emit('resetValues')"
            @interpolateMinMax="$emit('interpolateMinMax')"
          />
        </span>
        <div class="is-flex is-flex-direction-column">
          <EnumInputs v-if="isMode('enum')" :value="mappingValues" :enumLabels="enumLabels" />
          <BooleanInputs :value="mappingValues" v-else-if="isMode('boolean')" />
          <ByValueNumberInputs
            :value="mappingValues"
            @updateMappingValue="updateMappingValue($event.index, $event.val)"
            @removeRow="removeRow"
            :reversed="reversed"
            hasRemoveButton
            v-else-if="isMode('number')"
          >
            <template v-if="isMode('buckets')" #after="{ index }">
              <span class="values-dash mx-1"> - </span>
              <span class="is-flex-grow-1 values-to">
                <b-numberinput
                  v-if="isMaxIndex(index)"
                  :value="maxValue"
                  @input="$emit('update:maxValue', $event)"
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
    </div>
    <b-button
      v-if="isMode('number')"
      @click="$emit('add-row')"
      class="is-size-7 is-transparent has-hover-bg is-borderless has-text-primary has-text-weight-bold mt-2"
      icon-pack="far"
      icon-left="plus-circle"
      size="is-small"
    >
      {{ $t('flow.visualization.byValueConfig.addRow') }}
    </b-button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Vue } from 'vue-property-decorator';
import BooleanInputs from './BooleanInputs.vue';
import ByValueNumberInputs from './ByValueNumberInputs.vue';
import EnumInputs from './EnumInputs.vue';
import { ActionMenuItem } from '@movici-flow-common/types';
import Draggable from 'vuedraggable';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';
import { EnumValueMappingHelper, MappingMode, ValueMappingHelper } from './ValueMappingHelper';

@Component({
  name: 'ByValueList',
  components: {
    BooleanInputs,
    ByValueNumberInputs,
    Draggable,
    EnumInputs
  }
})
export default class ByValueList<T> extends Mixins<DraggableMixin>(DraggableMixin) {
  @Prop({ type: Array, required: true }) readonly value!: [number, T][];
  @Prop({ required: true }) readonly component!: string | Vue;
  @Prop({ type: Object, default: () => Object() }) readonly props!: Record<string, unknown>;
  @Prop({ type: Object, required: true }) readonly mappingHelper!: ValueMappingHelper<T>;
  @Prop({ type: Number, default: 1 }) readonly maxValue!: number;
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;
  @Prop({ type: String, default: '' }) readonly label!: string;

  get outputActions(): ActionMenuItem[] {
    return [
      {
        label: '' + this.$t('flow.visualization.invertOutput'),
        icon: 'sort',
        iconPack: 'far',
        event: 'invertOutput'
      }
    ];
  }
  get orderedValue() {
    return this.reversed ? this.value.slice().reverse() : this.value;
  }

  get output() {
    return this.orderedValue.map(val => val[1]);
  }

  get mappingValues() {
    return this.orderedValue.map(v => v[0]);
  }

  get enumLabels() {
    return (this.mappingHelper as EnumValueMappingHelper<T>).enumLabels;
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
        isDisabled: !this.isMode('number')
      }
    ];
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

  get valueHeader() {
    let kind: string;
    if (this.isMode('enum')) {
      kind = 'valueEnum';
    } else if (this.isMode('buckets')) {
      kind = 'valueRange';
    } else {
      kind = 'value';
    }
    return (this.$t('flow.visualization.byValueConfig') as unknown as Record<string, string>)[kind];
  }
  emitOriginalOrder(values: [number, T][]) {
    this.$emit('input', this.reversed ? values.slice().reverse() : values);
  }

  removeRow(idx: number) {
    const data = [...this.orderedValue];
    data.splice(idx, 1);
    this.emitOriginalOrder(data);
  }

  invertOutput() {
    this.emitOriginalOrder(
      this.orderedValue.map((val, i) => {
        return [val[0], this.value[i][1]];
      })
    );
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    this.emitOriginalOrder(
      this.move(event.moved.oldIndex, event.moved.newIndex, this.output).map((d, idx) => {
        return [this.mappingValues[idx], d];
      })
    );
  }

  isMode(query: MappingMode) {
    return this.mappingHelper!.modeFlags.includes(query);
  }

  isMaxIndex(index: number) {
    return this.reversed ? index === 0 : index === this.orderedValue.length - 1;
  }

  bucketEndIndex(index: number) {
    return this.reversed ? index - 1 : index + 1;
  }

  updateOutput(idx: number, newValue: T) {
    this.emitOriginalOrder(
      this.orderedValue.map((item, arrayIdx) => {
        return arrayIdx === idx ? [item[0], newValue] : item;
      })
    );
  }

  updateMappingValue(idx: number, newValue: number) {
    this.emitOriginalOrder(
      this.orderedValue.map((item, arrayIdx) => {
        return arrayIdx === idx ? [newValue, item[1]] : item;
      })
    );
  }
}
</script>

<style lang="scss" scoped>
.output-item {
  position: relative;
  height: 30px;
}
.has-addons {
  span {
    line-height: 1.85rem;
  }
}
.grip {
  .icon {
    height: 0.8rem;
    width: 0.6rem;
    font-size: 14px;
    margin-bottom: 4px;
  }
}
</style>
