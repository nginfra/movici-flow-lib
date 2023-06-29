<template>
  <o-collapse v-model:open="isOpen">
    <template #trigger="{ open }">
      <span class="is-flex is-align-items-center mb-2">
        <o-button
          class="mr-2 is-transparent is-borderless has-hover-bg"
          size="small"
          :icon-left="open ? 'angle-down' : 'angle-up'"
        />
        <label class="is-size-6-half ml-1">
          {{ $t("flow.visualization.colorConfig.advanced.title") }}
        </label>
      </span>
    </template>
    <div class="columns mt-4 is-multiline">
      <div class="column py-0 is-two-thirds-desktop">
        <AdvColorList :modelValue="advColors" @setColor="updateColor" />
      </div>
      <div class="column py-0 is-one-third-desktop">
        <slot name="legend-labels" />
      </div>
    </div>
    <div class="columns is-multiline">
      <div class="column pb-1 is-half">
        <RenderOrder v-if="hasRenderOrder" v-model="localValue.renderOrder" />
      </div>
    </div>
    <div class="columns mb-2 is-multiline">
      <div class="column py-1 is-2" v-if="hasFillOpacity">
        <o-field :label="$t('flow.visualization.colorConfig.advanced.fillOpacity')">
          <span class="is-flex-grow-1 mr-2">
            <o-input
              size="small"
              type="number"
              max="100"
              min="0"
              v-model="localValue.fillOpacity"
            />
          </span>
          <span class="is-size-6-half">%</span>
        </o-field>
      </div>
    </div>
  </o-collapse>
</template>

<script setup lang="ts">
import type { AdvColorMapping, AdvancedColorSettings, RGBAColor } from "@movici-flow-lib/types";
import { RenderOrderType } from "@movici-flow-lib/types";
import {
  DEFAULT_POLYGON_FILL_OPACITY,
  DEFAULT_SPECIAL_COLOR_TRIPLE,
  DEFAULT_UNDEFINED_COLOR_TRIPLE,
} from "@movici-flow-lib/utils/colorUtils";
import isEqual from "lodash/isEqual";
import { computed, inject, reactive, ref, watch } from "vue";
import AdvColorList from "./AdvColorList.vue";
import RenderOrder from "./RenderOrder.vue";
import { geometryInjection } from "./injectionKeys";

const defaultSettings = {
  specialColor: DEFAULT_SPECIAL_COLOR_TRIPLE,
  undefinedColor: DEFAULT_UNDEFINED_COLOR_TRIPLE,
  renderOrder: RenderOrderType.DISABLED,
  fillOpacity: DEFAULT_POLYGON_FILL_OPACITY,
};

const geometry = inject(geometryInjection);

const props = withDefaults(
  defineProps<{
    modelValue?: AdvancedColorSettings;
    fillType?: "buckets" | "gradient";
    clauseType?: "static" | "byValue";
  }>(),
  {
    fillType: "buckets",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: AdvancedColorSettings): void;
}>();

function hasDefaultSettings() {
  return isEqual({ ...defaultSettings, ...props.modelValue }, defaultSettings);
}

const isOpen = ref(!(!props.modelValue || hasDefaultSettings()));
const localValue = reactive(defaultSettings);

const hasRenderOrder = computed(() => props.fillType === "buckets");
const hasFillOpacity = computed(() => geometry?.value === "polygons");
const advColors = computed<AdvColorMapping>(() => [
  [-9999, localValue.specialColor],
  ["null", localValue.undefinedColor],
]);

function updateColor({ id, newValue }: { id: number; newValue: RGBAColor }) {
  if (id === 0) {
    localValue.specialColor = newValue;
  } else {
    localValue.undefinedColor = newValue;
  }
}

function finalizeValue() {
  // filter out properties so that we do not add default values to the clause if they are currently
  // not in the clause (modelValue)

  const keys: (keyof Omit<AdvancedColorSettings, "legend">)[] = [
    "specialColor",
    "undefinedColor",
    "renderOrder",
    "fillOpacity",
  ];
  const payload: AdvancedColorSettings = { ...localValue };
  for (const key of keys) {
    if (isEqual(defaultSettings[key], localValue[key])) {
      delete payload[key];
    }
  }
  if (!hasRenderOrder.value) {
    delete payload.renderOrder;
  }
  if (!hasFillOpacity.value) {
    delete payload.fillOpacity;
  }
  return { ...props.modelValue, ...payload };
}
watch(
  localValue,
  () => {
    emit("update:modelValue", finalizeValue());
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(localValue, value);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss"></style>
