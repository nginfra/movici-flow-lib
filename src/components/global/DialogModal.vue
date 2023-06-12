Taken and adapted from Buefy
https://github.com/buefy/buefy/blob/a92edafb1b5eaf3e01f73b18aebdd995535e68be/src/components/dialog/Dialog.vue

<template>
  <div class="modal-card animation-content">
    <header class="modal-card-head" v-if="title">
      <p class="modal-card-title">{{ title }}</p>
    </header>

    <section class="modal-card-body" :class="{ 'is-titleless': !title, 'is-flex': hasIcon }">
      <div class="media">
        <div class="media-left" v-if="hasIcon && (icon || iconByType)">
          <o-icon :icon="icon ? icon : iconByType" :variant="variant" size="large" />
        </div>
        <div class="media-content">
          <p v-html="message"></p>

          <div v-if="type === 'prompt'" class="field">
            <div class="control">
              <input
                :value="data.prompt"
                @input="data.prompt = ($event.target as HTMLTextAreaElement).value"
                class="input"
                @keydown.enter="confirm"
                :required="promptRequired"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="modal-card-foot is-justify-content-flex-end">
      <o-button v-if="canCancel" ref="cancelButton" @click="cancel" size="small">
        {{ cancelText }}
      </o-button>
      <o-button :variant="variant" ref="confirmButton" @click="confirm" size="small">
        {{ confirmButtonText }}
      </o-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";

const emit = defineEmits<{
  (e: "confirm", prompt: string): void;
  (e: "cancel", prompt: string): void;
  (e: "close"): void;
}>();

const props = withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    icon?: string;
    hasIcon?: boolean;
    variant?: string;
    size?: string;
    confirmButtonText?: string;
    canCancel?: boolean;
    cancelText?: string;
    type?: string;
    inputAttrs?: { value: string; required?: boolean };
  }>(),
  {
    variant: "primary",
    confirmButtonText: "OK",
    canCancel: true,
    cancelText: "Cancel",
    type: "confirm",
  }
);

const data = reactive({
  prompt: props.type === "prompt" ? props.inputAttrs?.value || "" : "",
});

const promptRequired = computed(() => props.inputAttrs?.required);

const iconByType = computed(() => {
  switch (props.variant) {
    case "info":
      return "info-circle";
    case "success":
      return "check-circle";
    case "warning":
      return "exclamation-triangle";
    case "danger":
      return "exclamation-circle";
    default:
      return null;
  }
});

function confirm() {
  emit("confirm", data.prompt);
  emit("close");
}
function cancel() {
  emit("cancel", data.prompt);
  emit("close");
}

if (props.inputAttrs && typeof props.inputAttrs?.required === "undefined") {
  props.inputAttrs["required"] == true;
}
</script>

<style lang="scss" scoped>
.modal-card {
  max-width: 460px;
  width: auto;
  .modal-card-body {
    color: $black;
    &.is-titleless {
      border-top-left-radius: 0.25rem;
      border-top-right-radius: 0.25rem;
    }
  }

  .modal-card-foot {
    border: 0;
    padding-top: 0;
    .button {
      display: inline;
      min-width: 5em;
      font-weight: 600;
    }
  }
  .modal-card-head {
    border: 0;
    padding-bottom: 0;
  }
}
</style>
