<template>
  <div class="overflow layer-picker-container is-flex is-flex-direction-column">
    <Draggable
      :value="value"
      v-bind="draggableOptions"
      v-on="draggableEvents"
      class="draggable"
      :class="{ dashed: drag }"
      @change="updateDraggable"
    >
      <VisualizerElement
        v-for="(layer, idx) in value"
        :key="layer.id"
        :value="layer"
        :header-buttons="['grip', 'label', 'visibility', 'more', 'errors']"
        :action-buttons="['edit', 'delete', 'export', 'reload']"
        @input="updateItem(idx, $event)"
        @delete="deleteItem(idx)"
        @edit="startEditingItem(idx)"
        @export="exportItem(layer)"
        @reload="reloadItem(idx)"
        @close-editor="close"
        tooltipActive
      />
    </Draggable>
    <b-button
      class="mt-2 new-visualizer is-transparent has-hover-bg is-borderless is-align-self-baseline has-text-primary has-text-weight-bold"
      icon-left="plus-circle"
      icon-pack="far"
      size="is-small"
      @click="startEditingItem(-1)"
    >
      {{ $t('flow.visualization.newVisualizer') }}
    </b-button>
    <VisualizerConfigurator
      v-if="open > -2"
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
  // Variable this.open indicates the index of the open Visualizer
  // Special values are
  // -1: Creates a new Visualizer
  // -2: The configurator is closed
  @Prop({ type: Number, default: -2 }) readonly open!: number;
  group = 'visualizers';

  get currentItem(): ComposableVisualizerInfo | undefined {
    return this.open < 0 ? undefined : this.value[this.open];
  }

  get scenarioUUID(): string | null {
    return this.scenario?.uuid ?? null;
  }

  get timelineInfo(): TimeOrientedSimulationInfo | null {
    return flowStore.timelineInfo;
  }

  close() {
    this.$emit('update:open', -2);
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    this.$emit('input', this.move(event.moved.oldIndex, event.moved.newIndex, this.value));
  }

  // wip
  // needs to detect unchanged saves in the VisConfig
  startEditingItem(index: number) {
    if (this.open === -2) {
      this.$emit('update:open', index);
    } else if (this.open !== index) {
      this.$buefy.dialog.confirm({
        message: '' + this.$t('flow.visualization.dialogs.closeConfigurator'),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('misc.yes'),
        type: 'is-primary',
        onConfirm: () => {
          this.$emit('update:open', -2);
          // this makes sure a fresh componenent is built without leftovers from previous values
          this.$nextTick(() => {
            this.$emit('update:open', index);
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

  reloadItem(idx: number) {
    const item = this.value[idx];
    if (item) {
      this.updateItem(idx, item.forceReset());
    }
  }

  updateCurrentItem(val: ComposableVisualizerInfo | null) {
    if (val) {
      if (this.scenario && !val.scenarioUUID) {
        val = this.appendScenarioUUID(val);
      }
      if (this.open === -1) {
        this.$emit('update:open', this.value.length);
        this.$emit('input', [...this.value, val]);
      } else {
        this.updateItem(this.open, val);
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
        if (this.open === idx) {
          this.$emit('update:open', -2);
        }
      }
    });
  }

  async exportItem(layer: ComposableVisualizerInfo) {
    await flowStore.exportFromConfig({
      datasetName: layer.datasetName,
      entityGroup: layer.entityGroup
    });
  }

  appendScenarioUUID(info: ComposableVisualizerInfo) {
    // appending the scenario to the CVI, maybe place this somewhere else?
    if (this.scenario && !info.scenarioUUID) {
      info.scenarioUUID = this.scenario.uuid;
    }
    return info;
  }
}
</script>

<style scoped lang="scss">
.draggable {
  margin: 0;
}
.layer-picker-container {
  height: 100%;
  margin: 0.5rem -0.25rem 0.5rem 0;
  padding-right: 0.25rem;
}
::v-deep {
  .label {
    color: $black !important;
  }
}
</style>
