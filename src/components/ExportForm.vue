<template>
  <div class="export-content">
    <div class="columns multiline mb-0">
      <div class="column is-half-desktop is-full-tablet">
        <o-field
          class="mr-2"
          :label="$t('resources.dataset')"
          :message="errors['currentDatasetName'] || ''"
          :variant="errors['currentDatasetName'] && 'danger'"
        >
          <o-select
            :placeholder="$t('dataset.select')"
            v-model="currentDatasetName"
            size="small"
            expanded
          >
            <option v-for="dataset in datasets" :value="dataset.name" :key="dataset.name">
              {{ datasetDisplayName(dataset) }}
            </option>
          </o-select>
        </o-field>
      </div>
      <div class="column is-half-desktop is-full-tablet">
        <o-field
          :disabled="!entityGroups"
          :label="$t('resources.entityGroup')"
          :message="errors['currentEntityName'] || ''"
          :variant="errors['currentEntityName'] && 'danger'"
        >
          <o-select
            :placeholder="$t('flow.entityGroup.select')"
            v-model="currentEntityName"
            size="small"
            expanded
            :disabled="!entityGroups?.length"
          >
            <option v-for="entity in entityGroups" :value="entity.name" :key="entity.name">
              {{ entity.name }} ({{ entity.count }})
            </option>
          </o-select>
        </o-field>
      </div>
    </div>
    <div class="columns mb-0" v-if="timelineInfo">
      <div class="column is-full-desktop is-full-tablet">
        <o-field :label="$t('misc.timestamp')">
          <TimeSlider v-model="currentTimestamp" :timeline-info="timelineInfo" />
        </o-field>
        <o-button
          @click="resetTimestamp"
          class="is-transparent is-borderless has-hover-bg has-text-primary is-pulled-right"
          icon-left="undo"
          icon-pack="far"
          size="small"
        >
          {{ $t("flow.export.resetTimestamp") }}
        </o-button>
      </div>
    </div>
    <div class="columns multiline mb-0">
      <div class="column">
        <o-field :label="$t('flow.export.format')">
          <o-radio
            class="mr-2"
            v-for="format in exportFormats"
            v-model="selectedFormat"
            :key="format"
            :native-value="format"
            size="small"
          >
            <span>.{{ format }} </span>
          </o-radio>
        </o-field>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReactiveSummary } from "@movici-flow-common/composables/useReactiveSummary";
import { useValidator } from "@movici-flow-common/composables/useValidator";
import type {
  ExportFormConfig,
  ScenarioDataset,
  ShortDataset,
  TimeOrientedSimulationInfo,
} from "@movici-flow-common/types";
import type { IFormValidator } from "@movici-flow-common/utils/FormValidator";
import type { ComposableVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import { ref, watch, watchEffect } from "vue";
import TimeSlider from "./TimeSlider.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: ExportFormConfig;
    datasets: (ScenarioDataset | ShortDataset)[];
    timelineInfo?: TimeOrientedSimulationInfo | null;
    info?: ComposableVisualizerInfo;
    timestamp?: number;
    validator: IFormValidator;
  }>(),
  {
    timestamp: 0,
  }
);
const emit = defineEmits<{
  (e: "update:modelValue", val: ExportFormConfig): void;
}>();

const {
  datasets: datasetsForSummary,
  currentDatasetName,
  currentEntityName,
  entityGroups,
} = useReactiveSummary();

watch(
  () => props.datasets,
  () => {
    datasetsForSummary.value = props.datasets;
  },
  { immediate: true }
);

watch(
  () => [props.info, datasetsForSummary.value] as [ComposableVisualizerInfo, unknown],
  ([info]) => {
    if (info) {
      currentDatasetName.value = info.datasetName;
      currentEntityName.value = info.entityGroup;
    }
  },
  { immediate: true }
);

const currentTimestamp = ref(props.timestamp);
function resetTimestamp() {
  currentTimestamp.value = props.timestamp;
}

const exportFormats = ["csv"];
const selectedFormat = ref(exportFormats[0]);

props.validator.configure({
  validators: {
    currentDatasetName: () => {
      if (!currentDatasetName.value) {
        return "Please select a dataset";
      }
    },
    currentEntityName: () => {
      if (!currentEntityName.value) {
        return "Please select an entity group";
      }
    },
  },
});
const { errors, validated } = useValidator(props.validator);
validated("currentDatasetName", currentDatasetName);
validated("currentEntityName", currentEntityName);

function datasetDisplayName(dataset: Partial<ShortDataset>) {
  if (dataset.display_name) {
    return `${dataset.display_name} (${dataset.name})`;
  } else {
    return dataset.name;
  }
}

watchEffect(() => {
  if (currentDatasetName.value && currentEntityName.value) {
    emit("update:modelValue", {
      datasetName: currentDatasetName.value,
      entityGroup: currentEntityName.value,
      timestamp: props.timelineInfo ? currentTimestamp.value : undefined,
    });
  }
});
</script>

<style lang="scss" scoped>
.export-content {
  :deep(.label) {
    font-size: 0.75rem;
  }
  :deep(.close) {
    position: absolute;
    right: 24px;
    top: 24px;
  }
  :deep(.timeslider) {
    padding: 0 0.75rem;
    width: 100%;
    margin: 0;
    box-shadow: none;
    .time-ticks {
      p,
      strong {
        width: 60px;
        font-size: 0.75rem;
      }
    }
  }

  .bottom {
    position: sticky;
    bottom: 0;
    padding: 16px 0 0;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    .button {
      display: flex;
    }
  }
}
</style>
