<template>
  <b-select
    :value="value"
    @input="input"
    :placeholder="warning ? warning : $t('actions.select')"
    size="is-small"
    expanded
  >
    <option
      v-for="(val, index) in options"
      :disabled="!filterVal(val)"
      :class="{ 'attribute-option-disabled': !filterVal(val) }"
      :value="val"
      :key="index"
      :title="getTitleOrNull(val)"
    >
      {{ getDisplayName(val) }}
    </option>
  </b-select>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'FilteredSelect' })
export default class FilteredSelect<T> extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: T | null;
  @Prop({ type: Array, default: () => [] }) readonly options!: T[];
  @Prop({ type: Function, default: () => () => true }) readonly filterVal!: (val: T) => boolean;
  @Prop({ type: Function }) readonly displayName?: (val: T) => string;
  @Prop({ type: Function }) readonly getTitle?: (val: T) => string;
  @Prop({ type: String }) readonly warningMessage?: string;

  input(val: T) {
    this.$emit('input', val);
  }

  getTitleOrNull(val: T): string | null {
    if (this.getTitle) {
      return this.getTitle(val);
    }
    const displayName = this.getDisplayName(val);
    if (typeof displayName === 'string') {
      return displayName;
    }
    return null;
  }

  getDisplayName(val: T): string | T {
    return this.displayName ? this.displayName(val) : val;
  }

  get warning() {
    return this.options.filter(val => this.filterVal(val)).length === 0
      ? this.warningMessage
      : null;
  }
}
</script>

<style scoped lang="scss"></style>
