<template>
  <div class="buttons-container" :class="{ 'is-sticky': props.isSticky }">
    <div :class="{ 'is-pulled-right': props.isPulledRight }">
      <o-button
        v-for="(btn, idx) in modelValue"
        :class="{ 'mr-2': idx !== modelValue.length }"
        :key="idx"
        :size="props.size"
        :disabled="btn.isDisabled"
        @click="doEmit(btn.event)"
        :icon-left="btn.icon"
        :icon-pack="btn.iconPack"
        :variant="btn.variant"
      >
        {{ noTranslate ? btn.label : $t(btn.label) }}
      </o-button>
      <slot></slot>
    </div>
    <div v-if="props.isPulledRight" class="is-clearfix"></div>
  </div>
</template>

<script setup lang="ts">
import type { ButtonItem } from "@movici-flow-common/types";

const emit = defineEmits<{
  (e: "action", action: string): void;
  (e: string): void;
}>();

const props = withDefaults(
  defineProps<{
    modelValue: ButtonItem[];
    isPulledRight?: boolean;
    isSticky?: boolean;
    size?: string;
    noTranslate?: boolean;
  }>(),
  {
    isPulledRight: false,
    isSticky: false,
    size: "",
  }
);

function doEmit(event: string) {
  emit("action", event);
  emit(event);
}
</script>

<style scoped lang="scss">
.is-sticky {
  position: sticky;
  bottom: 0;
  z-index: 39;
  div {
    display: flex;
    justify-content: flex-end;
    padding: 1em 0;
    background: $white;
  }
}
</style>
