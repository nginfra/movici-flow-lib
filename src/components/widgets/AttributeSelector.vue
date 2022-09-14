<template>
  <FilteredSelect
    :value="value"
    @input="input"
    :options="entityProps"
    :getTitle="getTitle"
    :displayName="displayName"
    :filterVal="filterProp"
  />
</template>

<script lang="ts">
import { PropertySummary } from '@movici-flow-common/types';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'AttributeSelector'
})
export default class AttributeSelector extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PropertySummary | null;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: Function, default: () => () => true }) readonly filterProp!: (
    prop: PropertySummary
  ) => boolean;

  input(prop: PropertySummary) {
    this.$emit('input', prop);
  }

  getTitle(val: PropertySummary) {
    return val.description;
  }

  displayName(val: PropertySummary): string {
    return val.name;
  }
}
</script>

<style scoped lang="scss"></style>
