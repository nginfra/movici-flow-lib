<template>
  <div>
    <o-field v-for="(val, index) in value" class="is-align-items-center" :key="index" size="small">
      <div class="is-flex">
        <slot name="before" v-bind="{ index }" />
        <span class="is-flex-grow-1 values-from">
          <o-input :value="enumLabels[val]" size="small" disabled />
        </span>
        <slot name="after" v-bind="{ index }" />
      </div>
    </o-field>
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
