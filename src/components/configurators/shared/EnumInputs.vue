<template>
  <div>
    <b-field
      v-for="(val, index) in value"
      class="is-align-items-center"
      :key="index"
      size="is-small"
    >
      <div class="values is-flex">
        <slot name="before" v-bind="{ index }" />
        <span class="is-flex-grow-1 values-from">
          <b-input :value="enumLabels[val]" size="is-small" disabled />
        </span>
        <slot name="after" v-bind="{ index }" />
      </div>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ name: 'EnumInputs' })
export default class EnumInputs extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: number[];
  @Prop({ type: Array, default: () => [] }) readonly enumLabels!: string[];
}
</script>
