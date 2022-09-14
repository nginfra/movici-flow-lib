<template>
  <div class="layer-picker-container is-flex is-flex-direction-column">
    <Draggable
      :value="value"
      v-bind="draggableOptions"
      v-on="draggableEvents"
      class="draggable overflow-hover"
      :class="{ dashed: drag }"
      @change="updateDraggable"
    >
      <VisualizerElement
        v-for="(layer, idx) in value"
        :key="layer.id"
        :value="layer"
        :header-buttons="['grip', 'label', 'visibility', 'more', 'errors']"
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
import { Component, Mixins, Prop } from 'vue-property-decorator';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import VisualizerElement from './VisualizerElement.vue';
import VisualizerConfigurator from '../configurators/VisualizerConfigurator.vue';
import { Scenario, TimeOrientedSimulationInfo } from '@movici-flow-common/types';
import { flowStore } from '@movici-flow-common/store/store-accessor';
import Draggable from 'vuedraggable';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';

@Component({
  name: 'FlowLayerPicker',
  components: { VisualizerElement, VisualizerConfigurator, Draggable }
})
export default class FlowLayerPicker extends Mixins(DraggableMixin) {
  @Prop({ type: Array, default: () => [] }) readonly value!: ComposableVisualizerInfo[];
  @Prop({ type: Object, default: null }) readonly scenario!: Scenario | null;
  @Prop({ type: Number, default: null }) readonly timestamp!: number | null;
  currentIndex: number | null = null;
  vConfigOpen = false;
  group = 'visualizers';

  get currentItem(): ComposableVisualizerInfo | undefined {
    return this.currentIndex === null ? undefined : this.value[this.currentIndex];
  }

  get scenarioUUID(): string | null {
    return this.scenario?.uuid ?? null;
  }

  get timelineInfo(): TimeOrientedSimulationInfo | null {
    return flowStore.timelineInfo;
  }

  close() {
    this.vConfigOpen = false;
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    this.$emit('input', this.move(event.moved.oldIndex, event.moved.newIndex, this.value));
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
          this.vConfigOpen = false;
          // this makes sure a fresh componenent is built without leftovers from previous values
          this.$nextTick(() => {
            this.currentIndex = index;
            this.vConfigOpen = true;
          });
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
