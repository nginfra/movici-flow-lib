<template>
  <div class="data-viewer box popup-fixed" :class="{ collapsed: collapsed_ }">
    <o-collapse v-if="collapsable" v-model:open="open" animation="none" aria-id="container">
      <template #trigger>
        <slot name="collapse-title" :collapsed="collapsed_"></slot>
      </template>
      <slot name="collapse-content" :collapsed="collapsed_"></slot>
    </o-collapse>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  collapsable?: boolean;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:collapsed", val: boolean): void;
}>();
const collapsed_ = ref(!!props.collapsed);

watch(
  () => props.collapsed,
  (collapsed) => {
    collapsed_.value = collapsed;
  }
);
const open = computed({
  get: () => !props.collapsed,
  set: (val: boolean) => {
    collapsed_.value = !val;
    emit("update:collapsed", !val);
  },
});
</script>

<style scoped lang="scss">
.popup-fixed {
  &.box {
    min-width: 250px;
    max-width: 500px;
    padding: calc(0.75rem - 2px);
  }

  &.collapsed {
    max-width: 3rem;
    max-height: 3rem;
    &.box {
      min-width: 0;
      padding: 0.5rem;
    }
  }
}
</style>
