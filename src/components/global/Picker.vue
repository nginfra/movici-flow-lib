<template>
  <b-field
    class="picker mb-2"
    label-position="on-border"
    :label="label"
    :title="optionLabel(value_)"
    :message="errorMessage"
    :type="type"
  >
    <b-select v-model="value_" :disabled="disabled" :size="size" :placeholder="placeholder">
      <option v-for="(item, key) in items" :value="item" :key="key">
        {{ optionLabel(item) }}
      </option>
    </b-select>
  </b-field>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'MovPicker' })
export default class MovPicker extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: unknown | null;
  @Prop({ type: String, default: 'is-default' }) readonly size!: string;
  @Prop({ type: String, default: '' }) readonly label!: string;
  @Prop({ type: String, default: '' }) readonly type!: string;
  @Prop({ type: String, default: '' }) readonly placeholder!: string;
  @Prop({ type: String, default: '' }) readonly errorMessage!: string;
  @Prop({ type: Boolean, default: false }) readonly disabled!: boolean;
  @Prop({ type: Array, default: () => [] }) readonly items!: unknown[];
  @Prop({ type: Function, default: (obj: unknown) => String(obj) })
  readonly optionLabel!: (val: unknown) => string;

  get value_() {
    return this.value ?? null;
  }

  set value_(val: unknown) {
    this.$emit('input', val);
  }
}
</script>
<style scoped>
.picker {
  max-width: 250px;
}
</style>
