<template>
  <o-modal
    :active="active"
    @update:active="$emit('update:active', $event)"
    @close="close"
    trap-focus
    aria-role="dialog"
    aria-modal
    :can-cancel="cancelOpts"
    :width="width"
  >
    <div class="modal-card" :style="cardStyle">
      <header class="modal-card-head">
        <slot name="header">
          <p class="modal-card-title">{{ title }}</p>
          <button v-if="hasCancelX" type="button" class="delete" @click.stop="close" />
        </slot>
      </header>
      <section class="modal-card-body" :class="{ 'border-round': !hasFooter }">
        <slot name="content" />
      </section>
      <footer class="modal-card-foot" v-if="hasFooter">
        <slot name="footer" />
      </footer>
    </div>
  </o-modal>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";

const slots = useSlots();
const hasFooter = computed(() => !!slots["footer"]);

const props = withDefaults(
  defineProps<{
    active?: boolean;
    title?: string;
    canCancel?: string[] | boolean;
    width?: number | string;
  }>(),
  {
    title: "",
  },
);
const emit = defineEmits<{
  (e: "update:active", val: boolean): void;
  (e: "close"): void;
}>();
// Bulma v1 gives .modal-card a fixed 640px width; drive it from the `width` prop
// so it matches the o-modal content wrapper instead of overflowing it.
const cardStyle = computed(() => {
  const w = props.width;
  if (w === undefined || w === null || w === "") return undefined;
  const isNum = typeof w === "number" || /^\d+(\.\d+)?$/.test(String(w));
  return { width: isNum ? `${w}px` : String(w), maxWidth: "100%" };
});
const allCancelOpts = computed(() =>
  Array.isArray(props.canCancel)
    ? props.canCancel
    : props.canCancel
      ? ["escape", "x", "outside", "button"]
      : [],
);

const hasCancelX = computed(() => allCancelOpts.value.includes("x"));
const cancelOpts = computed(() => allCancelOpts.value.filter((v) => v !== "x"));

function close() {
  emit("update:active", false);
  emit("close");
}
</script>

<style scoped lang="scss">
// Never let the card exceed its wrapper / the viewport (width comes from cardStyle).
.modal-card {
  max-width: 100%;
}
</style>
