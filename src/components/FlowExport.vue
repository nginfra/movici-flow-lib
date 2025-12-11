<template>
  <div class="modal-card" style="width: 600px">
    <div v-if="store.datasets" class="box has-background-white p-4">
      <div class="is-flex is-flex is-align-items-center mb-3">
        <h1 class="is-size-6 has-text-black text-ellipsis">
          {{ t("flow.export.modalTitle") }} {{ scenario?.display_name ?? "" }}
        </h1>
      </div>
      <ExportForm
        v-model="exportConfig"
        :info="localValue"
        :validator="validator"
        :timestamp="parsedView.timestamp"
        :timelineInfo="timelineInfo"
        :datasets="availableDatasets"
      />
      <div class="bottom is-pulled-right">
        <o-button
          size="small"
          icon-pack="far"
          class="mr-2 has-text-weight-bold"
          @click="$emit('close')"
        >
          {{ t("actions.cancel") }}
        </o-button>
        <o-button
          size="small"
          icon-pack="far"
          class="is-primary has-text-weight-bold"
          @click="exportData"
        >
          {{ t("flow.export.label") }}
        </o-button>
      </div>
      <div class="is-clearfix"></div>
    </div>
    <o-loading :active="loading" icon-size="large" />
  </div>
</template>

<script setup lang="ts">
import { useScenario } from "@movici-flow-lib/composables/useScenario";
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { useParsedViewStore } from "@movici-flow-lib/stores/parsedView";
import { exportFromConfig } from "@movici-flow-lib/utils/DataExporter";
import { computed, onMounted, ref } from "vue";
import type { ExportFormConfig, ScenarioDataset, ShortDataset } from "../types";
import { FormValidator } from "../utils/FormValidator";
import type { ComposableVisualizerInfo } from "../visualizers/VisualizerInfo";
import ExportForm from "./ExportForm.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const parsedView = useParsedViewStore();
const props = defineProps<{
  modelValue?: ComposableVisualizerInfo;
}>();

const localValue = ref<ComposableVisualizerInfo | undefined>(props.modelValue);
const validator = new FormValidator();
const { hasErrors } = useValidator(validator);

const exportConfig = ref<ExportFormConfig>();
const { scenario, timelineInfo } = useScenario();

const store = useFlowStore();

onMounted(async () => await store.loadDatasets());

const availableDatasets = computed<(ShortDataset | ScenarioDataset)[]>(() => {
  return scenario.value?.datasets ?? store.datasets;
});

const loading = ref(false);

async function exportData() {
  validator.validate();

  if (hasErrors.value) {
    return;
  }

  if (exportConfig.value && store.datasets && store.project && store.backend) {
    loading.value = true;
    try {
      const datasetsByName = store.datasets.reduce<Record<string, ShortDataset>>((obj, curr) => {
        obj[curr.name] = curr;
        return obj;
      }, {});

      await exportFromConfig({
        config: {
          dataset: datasetsByName[exportConfig.value.datasetName] ?? null,
          projectName: store.project.display_name,
          scenario: scenario.value,
          entityName: exportConfig.value.entityGroup,
          timestamp: exportConfig.value.timestamp,
        },
        timelineInfo: timelineInfo.value,
        backend: store.backend,
      });
    } finally {
      loading.value = false;
    }
  }
}
</script>

<style scoped lang="scss">
.modal-card {
  width: inherit;
}
:deep(.group-picker .header .label) {
  max-width: 200px;
}
:deep(.label) {
  color: $black !important;
}
</style>
