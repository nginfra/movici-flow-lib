<template>
  <div>
    <div
      v-for="(val, index) in modelValue"
      class="field is-align-items-center"
      :key="index"
      size="small"
    >
      <div class="values is-flex">
        <slot name="before" v-bind="{ index }" />
        <span class="is-flex-grow-1 values-from">
          <MovNumberinput
            :modelValue="val"
            @update:modelValue="$emit('updateMappingValue', { index, val: $event })"
            size="small"
          />
        </span>
        <slot name="after" v-bind="{ index }" />
        <o-button
          v-if="hasRemoveButton"
          @click="$emit('removeRow', index)"
          :title="$t('flow.visualization.byValueConfig.removeRow')"
          :disabled="removeButtonDisabled"
          class="ml-1 is-transparent has-hover-bg is-borderless has-text-danger"
          icon-pack="far"
          icon-left="minus-circle"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  modelValue: number[];
  hasRemoveButton?: boolean;
}>();

const removeButtonDisabled = computed(() => props.modelValue.length <= 2);
</script>
