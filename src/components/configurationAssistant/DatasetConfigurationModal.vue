<template>
  <MovModal
    :active="active"
    :title="modalTitle"
    :width="780"
    :can-cancel="['x', 'escape', 'outside']"
    @update:active="emit('update:active', $event)"
  >
    <template #content>
      <div class="dataset-modal">
        <div class="dataset-modal__grid">
          <label>{{ t("properties.name") }}</label>
          <o-input
            size="small"
            :modelValue="datasetForm.name"
            @update:modelValue="datasetForm.name = String($event)"
          />
        </div>

        <div class="dataset-modal__grid">
          <label>{{ t("properties.type") }}</label>
          <o-input
            size="small"
            :modelValue="datasetForm.type"
            @update:modelValue="datasetForm.type = String($event)"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="dataset-modal__footer">
        <o-button size="small" @click="emit('update:active', false)">
          {{ t("actions.cancel") }}
        </o-button>
        <o-button size="small" variant="primary" :disabled="!canSave" @click="save">
          {{ t("actions.save") }}
        </o-button>
      </div>
    </template>
  </MovModal>
</template>

<script setup lang="ts">
import type { ScenarioDataset } from "@movici-flow-lib/types";
import { computed, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  active?: boolean;
  dataset?: ScenarioDataset | null;
}>();

const emit = defineEmits<{
  (e: "update:active", val: boolean): void;
  (e: "save", model: ScenarioDataset): void;
}>();

const { t } = useI18n();

const datasetForm = reactive({
  name: "",
  type: "",
});

const modalTitle = computed(() => (props.dataset ? t("dataset.edit") : t("dataset.addNew")));

const canSave = computed(() => Boolean(datasetForm.name.trim() && datasetForm.type.trim()));

function save() {
  if (!canSave.value) return;

  const name = datasetForm.name.trim();
  const dataset: ScenarioDataset = {
    name,
    uuid: props.dataset?.uuid ?? name,
    type: datasetForm.type.trim(),
  };

  emit("save", dataset);
  emit("update:active", false);
}

watch(
  () => [props.active, props.dataset],
  () => {
    if (!props.active) return;

    datasetForm.name = props.dataset?.name ?? "";
    datasetForm.type = props.dataset?.type ?? "";
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.modal {
  :deep(.modal-content) {
    width: calc(100vw - 2rem);
    margin-inline: 0;
  }

  :deep(.modal-card) {
    width: 100%;
    max-width: 100%;
    margin-inline: auto;
  }
}

.dataset-modal {
  display: grid;
  gap: 1rem;
  padding-top: 0.25rem;
}

:deep(.modal-card) {
  width: 100%;
  max-width: 100%;
}

.dataset-modal__grid {
  display: grid;
  grid-template-columns: minmax(160px, 180px) minmax(0, 1fr);
  align-items: center;
  gap: 1rem;

  label {
    color: $black;
    font-size: 0.98rem;
  }
}
</style>
