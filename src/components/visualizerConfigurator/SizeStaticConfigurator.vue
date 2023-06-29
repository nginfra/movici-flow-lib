<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column pb-0 is-half-desktop is-full-tablet size">
        <div class="is-flex">
          <o-field
            class="mb-0"
            :label="$t('flow.visualization.sizeConfig.size')"
            :variant="errors['size'] && 'danger'"
          >
            <MovNumberinput v-model="local.size" size="small" />
          </o-field>
          <o-field class="is-flex-grow-1 ml-4" :label="$t('flow.visualization.displayAs')">
            <o-radio
              v-model="local.units"
              :disabled="noSizeInMeter"
              native-value="meters"
              size="small"
              class="mr-4"
            >
              {{ $t("units.meters") }}
            </o-radio>
            <o-radio v-model="local.units" native-value="pixels" size="small">
              {{ $t("units.pixels") }}
            </o-radio>
          </o-field>
        </div>
        <p class="has-text-danger is-size-7 my-1" v-if="errors.size">{{ errors.size }}</p>
      </div>
    </div>
    <MinMaxPixels
      v-if="currentClause.units === 'meters'"
      v-model:minPixels="local.minPixels"
      v-model:maxPixels="local.maxPixels"
      :units="currentClause.units"
    />
  </div>
</template>

<script setup lang="ts">
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { SizeClause, StaticSizeClause } from "@movici-flow-lib/types";
import { FlowVisualizerType } from "@movici-flow-lib/types";
import { isPositive } from "@movici-flow-lib/utils/FormValidator";
import { computed, inject, onUnmounted, reactive, watch } from "vue";
import MinMaxPixels from "./MinMaxPixels.vue";
import { geometryInjection, validatorInjection } from "./injectionKeys";

const props = defineProps<{
  modelValue?: SizeClause;
  noSizeInMeter?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: SizeClause): void;
}>();

const geometry = inject(geometryInjection)!;
const validator = inject(validatorInjection)!.child("static");

function defaults(): StaticSizeClause {
  switch (geometry.value) {
    case FlowVisualizerType.ICONS:
      return {
        size: 20,
        units: "pixels",
        minPixels: 5,
        maxPixels: 100,
      };
    default:
      return {
        size: 5,
        units: "pixels",
        minPixels: 2,
        maxPixels: 5,
      };
  }
}
validator.configure({
  validators: {
    size: () => isPositive(local.size, "Size"),
  },
});

const local = reactive(defaults());

const { errors, validated, destroyValidator } = useValidator(validator);
validated(
  "size",
  computed(() => local.size)
);
onUnmounted(destroyValidator);

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(local, val?.static);
  },
  { immediate: true }
);

const currentClause = computed(() => {
  const rv: StaticSizeClause = {
    size: local.size,
    units: local.units,
  };

  if (local.minPixels !== null) {
    rv.minPixels = local.minPixels;
  }

  if (local.maxPixels !== null) {
    rv.maxPixels = local.maxPixels;
  }

  return rv;
});
watch(
  currentClause,
  (clause) => {
    emit("update:modelValue", { static: clause });
  },
  { immediate: true }
);
</script>

<style scoped lang="scss"></style>
