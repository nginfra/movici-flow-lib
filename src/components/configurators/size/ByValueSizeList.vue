<template>
  <div class="is-block">
    <div class="is-flex min-max mt-1">
      <div class="sizes-is-flex is-flex-shrink-1 is-flex-direction-column mr-4">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">
            {{ $t('flow.visualization.sizeConfig.size') }} ({{ miniUnits }})
          </label>
        </span>
        <div class="is-flex is-flex-direction-column">
          <b-field v-for="(val, i) in output" :key="i">
            <b-numberinput
              :value="val"
              @input="updateOutput(i, $event)"
              :controls="false"
              :min-step="1e-15"
              step="1"
              size="is-small"
            />
          </b-field>
        </div>
      </div>
      <div class="values is-flex is-flex-shrink-1 is-flex-direction-column">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">
            {{ $t('flow.visualization.sizeConfig.value') }}
          </label>
          <MovActionMenu
            v-if="isMode('number') && !isEnum"
            :value="valueActions"
            @resetValues="$emit('resetValues')"
            @interpolateMinMax="$emit('interpolateMinMax')"
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
      @click="addRow"
      :disabled="value.length >= 8 || isEnum"
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
import BooleanInputs from '../shared/BooleanInputs.vue';
import ByValueNumberInputs from '../shared/ByValueNumberInputs.vue';
import EnumInputs from '../shared/EnumInputs.vue';
import ByValueListMixin from '../ByValueListMixin';

@Component({
  name: 'ByValueSizeList',
  components: {
    BooleanInputs,
    ByValueNumberInputs,
    EnumInputs
  }
})
export default class ByValueSizeList extends Mixins<ByValueListMixin<number>>(ByValueListMixin) {
  @Prop({ type: String, default: 'pixels' }) readonly units!: string;
  defaultOutputRow = 0;

  get miniUnits() {
    switch (this.units) {
      case 'meters':
        return 'm';
      case 'pixels':
        return 'px';
      default:
        return '';
    }
  }
}
</script>

<style lang="scss" scoped></style>
