<template>
  <div>
    <o-field v-for="(val, index) in value" class="is-align-items-center" :key="index" size="small">
      <div class="values is-flex">
        <slot name="before" v-bind="{ index }" />
        <span class="is-flex-grow-1 values-from">
          <MovNumberinput
            :value="val"
            @input="$emit('updateMappingValue', { index, val: $event })"
            size="small"
          />
        </span>
        <slot name="after" v-bind="{ index }" />
        <o-button
          v-if="hasRemoveButton"
          @click="$emit('removeRow', index)"
          :title="$t('flow.visualization.byValueConfig.removeRow')"
          :disabled="isDisabled"
          class="ml-1 is-transparent has-hover-bg is-borderless has-text-danger"
          icon-pack="far"
          icon-left="minus-circle"
          size="small"
        />
      </div>
    </o-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ name: 'ByValueNumberInputs' })
export default class ByValueNumberInputs extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: number[];
  @Prop({ type: Boolean, default: false }) readonly hasRemoveButton!: boolean;

  get isDisabled() {
    return this.value.length <= 2;
  }
}
</script>
