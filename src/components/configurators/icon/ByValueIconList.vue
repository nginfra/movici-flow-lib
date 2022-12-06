<template>
  <div class="is-block">
    <div class="is-flex min-max mt-1">
      <div class="icons is-flex is-flex-shrink-1 is-flex-direction-column mr-4">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">
            {{ $t('flow.visualization.type.icons') }}
          </label>
        </span>
        <div class="is-flex is-flex-direction-column">
          <b-field v-for="(val, i) in output" :key="i">
            <IconSelector
              :value="val"
              @input="updateOutput(i, $event)"
              :iconOptions="iconOptions"
              :placeholder="$t('actions.select')"
              pack="fas"
              expanded
            />
          </b-field>
        </div>
      </div>
      <div class="values is-flex is-flex-grow-1 is-flex-direction-column">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">
            {{ $t('flow.visualization.sizeConfig.value') }}
          </label>
          <MovKebabMenu
            v-if="isMode('number') && !isEnum"
            :value="valueActions"
            @interpolateMinMax="$emit('interpolateMinMax')"
            @resetValues="$emit('resetValues')"
          />
        </span>
        <div class="is-flex is-flex-direction-column">
          <EnumInputs v-if="isEnum" :value="mappingValues" :enumLabels="entityEnums" />
          <BooleanInputs :value="mappingValues" v-else-if="isMode('boolean')" />
          <ByValueNumberInputs
            :value="mappingValues"
            @updateMappingValue="updateMappingValue($event.index, $event.val)"
            @removeRow="removeRow"
            :reversed="reversed"
            hasRemoveButton
            v-else-if="isMode('number')"
          />
        </div>
      </div>
    </div>
    <b-button
      v-if="!isEnum"
      @click="addRow"
      :disabled="value.length >= lengthByDataType"
      class="is-size-7 is-transparent is-borderless has-hover-bg has-text-primary has-text-weight-bold mt-2"
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
import BooleanInputs from '../shared/BooleanInputs.vue';
import ByValueNumberInputs from '../shared/ByValueNumberInputs.vue';
import EnumInputs from '../shared/EnumInputs.vue';
import ByValueListMixin from '../ByValueListMixin';
import IconSelector from './IconSelector.vue';
import { IconMapping } from '@movici-flow-common/visualizers/layers/ShapeIconLayer';

@Component({
  name: 'ByValueIconList',
  components: {
    BooleanInputs,
    ByValueNumberInputs,
    EnumInputs,
    IconSelector
  }
})
export default class ByValueIconList extends Mixins<ByValueListMixin<string>>(ByValueListMixin) {
  @Prop({ type: Object }) iconOptions!: IconMapping;

  get icons(): string[] {
    return Object.keys(this.iconOptions ?? []);
  }

  mounted() {
    this.defaultOutputRow = this.icons[0];
  }
}
</script>

<style lang="scss" scoped></style>
