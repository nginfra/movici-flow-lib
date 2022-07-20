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
          <b-numberinput
            :value="val"
            @input="$emit('updateMappingValue', { index, val: $event })"
            :controls="false"
            :min-step="1e-15"
            step="1"
            class="has-text-centered"
            size="is-small"
          />
        </span>
        <slot name="after" v-bind="{ index }" />
        <b-button
          v-if="hasRemoveButton"
          @click="$emit('removeRow', index)"
          :title="$t('flow.visualization.colorConfig.removeRow')"
          :disabled="isDisabled"
          class="ml-1 is-transparent is-borderless has-text-danger"
          icon-pack="far"
          icon-left="minus-circle"
          size="is-small"
        />
      </div>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ name: 'ByValueNumberInputs' })
export default class ByValueNumberInputs extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: number[];
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;
  @Prop({ type: Boolean, default: false }) readonly hasRemoveButton!: boolean;

  get isDisabled() {
    return this.value.length <= 2;
  }
}
</script>
