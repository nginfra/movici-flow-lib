<template>
  <div class="modal-card editor-form-modal">
    <form class="box has-background-white p-4" @submit.prevent="onConfirm">
      <p class="title is-6 mb-3">{{ title }}</p>
      <slot />
      <p v-if="error" class="is-size-7 has-text-danger mt-1">{{ error }}</p>
      <div class="is-flex is-justify-content-flex-end mt-4">
        <o-button size="small" class="mr-2" @click="emit('close')">Cancel</o-button>
        <o-button size="small" variant="primary" native-type="submit" :disabled="!canConfirm">
          {{ confirmLabel }}
        </o-button>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
const props = withDefaults(
  defineProps<{
    title: string;
    submit: () => string | null;
    canConfirm?: boolean;
    confirmLabel?: string;
  }>(),
  { canConfirm: true, confirmLabel: "Add" },
);

const emit = defineEmits<{ (e: "close"): void }>();
const error = ref<string | null>(null);

function onConfirm() {
  if (!props.canConfirm) return;
  error.value = props.submit();
  if (error.value === null) emit("close");
}
</script>
<style scoped lang="scss">
.editor-form-modal {
  width: 320px;
  max-width: 100%;
}
</style>
