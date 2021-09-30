<template>
  <div class="export-content">
    <div class="columns multiline mb-0">
      <div class="column is-flex is-half-desktop is-full-tablet">
        <b-field
          class="is-flex-grow-1 mr-2"
          :label="$t('resources.dataset')"
          :type="{ 'is-danger': errors['currentDatasetName'] }"
          :message="errors['currentDatasetName'] || ''"
        >
          <b-select
            :placeholder="$t('dataset.select')"
            :value="currentDatasetName"
            size="is-small"
            expanded
            @input="validated('currentDatasetName', $event)"
          >
            <option v-for="dataset in datasets" :value="dataset.name" :key="dataset.name">
              {{ dataset.display_name }}
            </option>
          </b-select>
        </b-field>
      </div>
      <div class="column is-flex is-half-desktop is-full-tablet">
        <b-field
          class="is-flex-grow-1"
          v-if="entityGroups || currentEntityName"
          :label="$t('resources.entityGroup')"
          :type="{ 'is-danger': errors['currentEntityName'] }"
          :message="errors['currentEntityName'] || ''"
        >
          <b-select
            :placeholder="$t('entityGroup.select')"
            :value="currentEntityName"
            size="is-small"
            expanded
            :disabled="!entityGroups.length"
            @input="validated('currentEntityName', $event)"
          >
            <option v-for="entity in entityGroups" :value="entity.name" :key="entity.name">
              {{ entity.name }} ({{ entity.count }})
            </option>
          </b-select>
        </b-field>
      </div>
    </div>
    <div class="columns mb-0">
      <div class="column is-full-desktop is-full-tablet">
        <b-field :label="$t('timeline.timestamp')" v-if="timelineInfo">
          <TimeSlider v-model="currentTimestamp" :timeline-info="timelineInfo"></TimeSlider>
        </b-field>
        <b-button
          @click="resetTimestamp"
          class="is-transparent is-borderless has-text-primary is-pulled-right"
          icon-left="undo"
          icon-pack="far"
          size="is-small"
        >
          {{ $t('flow.export.resetTimestamp') }}
        </b-button>
      </div>
    </div>
    <div class="columns multiline mb-0">
      <div class="column">
        <b-field :label="$t('flow.export.format')">
          <b-radio
            class="mr-2"
            v-for="format in exportFormats"
            v-model="selectedFormat"
            :key="format"
            :native-value="format"
            size="is-small"
          >
            <span>.{{ format }} </span>
          </b-radio>
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import Modal from '@/flow/src/components/global/Modal.vue';
import { Dataset, ScenarioDataset, TimeOrientedSimulationInfo } from '@/flow/src/types';
import ValidationProvider from '@/flow/src/mixins/ValidationProvider';
import SummaryListing from '@/flow/src/mixins/SummaryListing';
import TimeSlider from '@/flow/src/components/map_widgets/TimeSlider.vue';
import { ComposableVisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';
import { flowStore } from '@/flow/src/store/store-accessor';

@Component({
  name: 'ExportForm',
  components: { Modal, TimeSlider }
})
export default class ExportForm extends Mixins(SummaryListing, ValidationProvider) {
  @Prop({ type: Object, default: null }) readonly value!: ComposableVisualizerInfo | null;
  @Prop({ type: Object, default: null }) readonly timelineInfo!: TimeOrientedSimulationInfo | null;
  @Prop({ type: String, default: null }) readonly scenarioUuid!: string | null;
  @Prop({ type: Number, default: 0 }) readonly timestamp!: number;

  currentTimestamp = 0;
  exportFormats = ['csv'];
  selectedFormat = 'csv';

  get currentProject() {
    return flowStore.project;
  }

  get currentScenario() {
    return flowStore.scenario;
  }

  @Watch('validator', { immediate: true })
  setupValidator() {
    this.validator?.addModule({
      name: 'form',
      validators: {
        currentDatasetName: () => {
          if (!this.currentDatasetName) {
            return 'Please select a dataset';
          }
        },
        currentEntityName: () => {
          if (!this.currentEntityName) {
            return 'Please select an entity group';
          }
        }
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  @Watch('currentEntityName')
  @Watch('currentTimestamp')
  async emitConfig() {
    this.$emit('exportConfig', {
      datasetName: this.currentDatasetName ?? '',
      entityGroup: this.currentEntityName,
      timestamp: this.currentTimestamp
    } as { datasetName: string; entityGroup: string; timestamp: number });
  }

  getDataset(currentDatasetName?: string): Dataset | ScenarioDataset | null {
    return currentDatasetName ? this.datasetsByName[currentDatasetName] : null;
  }

  async getDatasets() {
    if (this.currentProject)
      this.datasets = (await flowStore.getDatasets(this.currentProject?.uuid)) || [];
  }

  @Watch('datasetName')
  async onDatasetChange(currentDatasetName: string) {
    await this.getSummary(currentDatasetName);
  }

  @Watch('value', { immediate: true })
  async setByValue(value: Partial<ComposableVisualizerInfo> | null) {
    await this.initialize();
    this.currentDatasetName = value?.datasetName ?? null;
    this.currentEntityName = value?.entityGroup ?? null;
  }

  resetTimestamp() {
    this.currentTimestamp = this.timestamp;
  }

  async initialize() {
    this.resetTimestamp();
    await this.getDatasets();
    await this.getSummary(this.currentDatasetName);
  }
}
</script>

<style lang="scss" scoped>
.export-content {
  ::v-deep {
    .label {
      font-size: 0.75rem;
    }
    .close {
      position: absolute;
      right: 24px;
      top: 24px;
    }
    .timeslider {
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
