<template>
  <b-select
    :value="value"
    @input="input"
    :placeholder="warning ? warning : $t('actions.select')"
    size="is-small"
    expanded
  >
    <option
      v-for="(prop, index) in entityProps"
      :disabled="!filterProp(prop)"
      :class="{ 'attribute-option-disabled': !filterProp(prop) }"
      :value="prop"
      :key="index"
      :title="prop.description"
    >
      {{ prop.name }}
    </option>
  </b-select>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropertySummary, PropertyType } from '@movici-flow-common/types';

@Component({
  name: 'AttributeSelector'
})
export default class AttributeSelector extends Vue {
  @Prop({ type: Object }) readonly value!: PropertySummary | null;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: Function, default: () => () => true }) readonly filterProp!: (
    prop: PropertyType
  ) => boolean;

  input(prop: PropertySummary) {
    this.$emit('input', prop);
  }

  get warning() {
    return this.entityProps.filter(prop => this.filterProp(prop)).length === 0
      ? this.$t('flow.visualization.errorDisplayAs')
      : null;
  }
}
</script>

<style scoped lang="scss"></style>
