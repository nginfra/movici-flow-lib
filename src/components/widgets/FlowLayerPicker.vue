<template>
  <div class="layer-picker-container is-flex is-flex-direction-column">
    <Draggable
      :value="value"
      v-bind="draggableOptions"
      class="x-overflow draggable"
      :class="{ dashed: drag }"
      @start="drag = true"
      @end="drag = false"
      @change="updateDraggable"
    >
      <VisualizerElement
        v-for="(layer, idx) in value"
        :key="layer.id"
        :value="layer"
        :header-buttons="['grip', 'label', 'visibility', 'more']"
        :action-buttons="['edit', 'delete', 'export']"
        @input="updateItem(idx, $event)"
        @delete="deleteItem(idx)"
        @edit="startEditingItem(idx)"
        @export="exportItem(layer)"
        @close-editor="close"
        tooltipActive
      />
    </Draggable>
    <b-button
      class="mt-2 is-transparent is-borderless is-align-self-baseline has-text-primary has-text-weight-bold"
      icon-left="plus-circle"
      icon-pack="far"
      size="is-small"
      @click="startEditingItem(null)"
    >
      {{ $t('flow.visualization.newVisualizer') }}
    </b-button>
    <VisualizerConfigurator
      v-if="vConfigOpen"
      :vGroups="[]"
      :value="currentItem"
      :scenarioUUID="scenarioUUID"
      @input="updateCurrentItem($event)"
      @close="close"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ComposableVisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';
import VisualizerElement from './VisualizerElement.vue';
import VisualizerConfigurator from '../configurators/VisualizerConfigurator.vue';
import { Scenario, TimeOrientedSimulationInfo } from '@/flow/src/types';
import Draggable from 'vuedraggable';
import { flowStore } from '@/flow/src/store/store-accessor';

@Component({
  name: 'FlowLayerPicker',
  components: { VisualizerElement, VisualizerConfigurator, Draggable }
})
export default class FlowLayerPicker extends Vue {
  @Prop({ type: Array, default: () => [] })
  readonly value!: ComposableVisualizerInfo[];
  @Prop({ type: Object, default: null })
  readonly scenario!: Scenario | null;
  @Prop({ type: Number, default: null })
  readonly timestamp!: number | null;

  currentIndex: number | null = null;
  vConfigOpen = false;
  drag = false; // may the best woman win

  get currentItem(): ComposableVisualizerInfo | undefined {
    return this.currentIndex === null ? undefined : this.value[this.currentIndex];
  }

  get scenarioUUID(): string | null {
    return this.scenario?.uuid ?? null;
  }

  get draggableOptions() {
    return {
      animation: 500,
      group: 'visualizers',
      disabled: false,
      ghostClass: 'ghost',
      handle: '.grip'
    };
  }

  get timelineInfo(): TimeOrientedSimulationInfo | null {
    return flowStore.timelineInfo;
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    this.move(event.moved.oldIndex, event.moved.newIndex);
  }

  close() {
    this.vConfigOpen = false;
  }

  move(currentIdx: number, targetIdx: number) {
    const data = [...this.value];
    const item = data.splice(currentIdx, 1)[0];
    data.splice(targetIdx, 0, item);
    this.$emit('input', data);
  }

  // wip
  // needs to detect unchanged saves in the VisConfig
  startEditingItem(index: number | null) {
    if (!this.vConfigOpen) {
      this.currentIndex = index;
      this.vConfigOpen = true;
    } else if (this.currentIndex !== index) {
      this.$buefy.dialog.confirm({
        message: '' + this.$t('flow.visualization.dialogs.closeConfigurator'),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('misc.yes'),
        type: 'is-primary',
        onConfirm: () => {
          this.currentIndex = index;
        }
      });
    }
  }

  updateItem(idx: number, val: ComposableVisualizerInfo) {
    this.$emit(
      'input',
      this.value.map((info, arrayIdx) => {
        return arrayIdx === idx ? this.appendScenarioUUID(val) : info;
      })
    );
  }

  updateCurrentItem(val: ComposableVisualizerInfo | null) {
    if (val) {
      if (this.scenario && !val.scenarioUUID) {
        val = this.appendScenarioUUID(val);
      }
      if (this.currentIndex === null) {
        this.currentIndex = this.value.length;
        this.$emit('input', [...this.value, val]);
      } else {
        this.updateItem(this.currentIndex, val);
      }
    }
  }

  deleteItem(idx: number) {
    const name = this.value[idx].name;
    this.$buefy.dialog.confirm({
      message: '' + this.$t('flow.visualization.dialogs.deleteVisualizer', { name }),
      cancelText: '' + this.$t('actions.cancel'),
      confirmText: '' + this.$t('actions.delete'),
      type: 'is-danger',
      onConfirm: () => {
        this.$emit(
          'input',
          this.value.filter((val, arrayIdx) => idx !== arrayIdx)
        );
        // if we delete what is open, we close the window
        this.vConfigOpen = this.currentIndex === idx ? false : this.vConfigOpen;
      }
    });
  }

  async exportItem(layer: ComposableVisualizerInfo) {
    await flowStore.exportFromConfig({
      datasetName: layer.datasetName,
      entityGroup: layer.entityGroup
    });
  }

  appendScenarioUUID(cvi: ComposableVisualizerInfo) {
    // appending the scenario to the CVI, maybe place this somewhere else?
    if (this.scenario && !cvi.scenarioUUID) {
      cvi.scenarioUUID = this.scenario.uuid;
    }
    return cvi;
  }
}
</script>

<style scoped lang="scss">
.layer-picker-container {
  height: 100%;
  padding: 0.5rem 0;
}
::v-deep {
  .label {
    color: $black !important;
  }
}
</style>
