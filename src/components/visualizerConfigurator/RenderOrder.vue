<template>
  <o-field>
    <template #label>
      {{ t("flow.visualization.colorConfig.advanced.renderOrder") }}
      <o-icon
        size="small"
        variant="info"
        icon-pack="far"
        icon="info-circle"
        :title="t('flow.visualization.colorConfig.advanced.renderOrderInfo')"
      />
    </template>
    <div class="is-flex is-flex-direction-column">
      <o-radio
        v-for="(label, index) in labels"
        :key="index"
        class="mb-2"
        size="small"
        v-model="value"
        :native-value="label"
        type="is-success is-outlined"
      >
        <span>{{ t("flow.visualization.colorConfig.advanced." + label) }}</span>
      </o-radio>
    </div>
  </o-field>
</template>

<script setup lang="ts">
import { RenderOrderType } from "@movici-flow-lib/types";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue: RenderOrderType;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: RenderOrderType): void;
}>();

const value = computed({
  get: () => props.modelValue,
  set: doEmit,
});

function doEmit(val: RenderOrderType) {
  emit("update:modelValue", val);
}

const labels = Object.values(RenderOrderType);
onMounted(() => {
  if (!labels.includes(props.modelValue)) {
    doEmit(RenderOrderType.DISABLED);
  }
});
</script>

<style scoped lang="scss"></style>
