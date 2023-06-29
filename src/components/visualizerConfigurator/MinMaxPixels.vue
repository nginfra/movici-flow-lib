<template>
  <div>
    <div class="columns mt-2 mb-0 is-multiline" v-if="units === 'meters'">
      <div class="column pb-0 is-flex is-two-thirds-desktop is-full-tablet min-max-px">
        <o-field
          class="mr-4 mb-0"
          :label="$t('flow.visualization.sizeConfig.minPixels')"
          :variant="errors['minPixels'] && 'danger'"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <MovNumberinput v-model="minPixels_" size="small" />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </o-field>
        <o-field
          class="mb-0"
          :label="$t('flow.visualization.sizeConfig.maxPixels')"
          :variant="errors['maxPixels'] && 'danger'"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <MovNumberinput v-model="maxPixels_" size="small" />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </o-field>
      </div>
    </div>
    <div class="errors">
      <p class="has-text-danger is-size-7 mt-1" v-for="(error, key) in errors" :key="key">
        {{ error }}
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { SizeUnit } from "@movici-flow-lib/types";
import { isPositive } from "@movici-flow-lib/utils/FormValidator";
import { computed, inject, onUnmounted } from "vue";
import { validatorInjection } from "./injectionKeys";

const props = defineProps<{
  minPixels?: number | null;
  maxPixels?: number | null;
  units: SizeUnit;
}>();
const emit = defineEmits<{
  (e: "update:minPixels", val?: number | null): void;
  (e: "update:maxPixels", val?: number | null): void;
}>();

const validator = inject(validatorInjection)!.child("minMaxValue");
validator.configure({
  validators: {
    minPixels: () => {
      if (props.units === "pixels") return;
      return isPositive(props.minPixels, "Min size");
    },

    maxPixels: () => {
      if (props.units === "pixels") return;
      return isPositive(props.maxPixels, "Max size");
    },

    minMaxPixels: {
      depends: ["minPixels", "maxPixels"],
      validator: () => {
        if (props.units === "pixels") return;
        if (
          props.minPixels != undefined &&
          props.maxPixels != undefined &&
          props.minPixels > props.maxPixels
        )
          return "Max size must be at least min size.";
      },
    },
  },
});
const { errors, destroyValidator } = useValidator(validator);
onUnmounted(destroyValidator);

function computedPixels(key: "minPixels" | "maxPixels") {
  return computed({
    get: () => props[key],
    set: (val) => {
      validator.touch(key);
      emit(("update:" + key) as "update:minPixels", val);
    },
  });
}
const minPixels_ = computedPixels("minPixels");
const maxPixels_ = computedPixels("maxPixels");
</script>

<style scoped lang="scss">
:deep(.numberinput) {
  max-width: 4.5rem;
}
:deep(.field) {
  .field {
    margin-bottom: 0;
  }
}
</style>
