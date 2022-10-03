<template>
  <div class="layer-picker-container is-flex is-flex-direction-column overflow">
    <Draggable
      :value="value"
      v-bind="draggableOptions"
      v-on="draggableEvents"
      class="draggable"
      :class="{ dashed: drag }"
      @change="updateDraggable"
    >
      <div
        class="group-picker chart"
        v-for="(chart, idx) in value"
        :key="idx"
        @close-editor="close"
      >
        <div class="header">
          <span class="grip mr-2">
            <span class="icon is-small fa-stack">
              <i class="far fa-ellipsis-v"></i>
              <i class="far fa-ellipsis-v"></i>
            </span>
          </span>
          <label class="is-flex-grow-1 label" :title="chart.name">
            <span class="is-block is-size-6-half text-ellipsis">
              {{ chart.title }}
            </span>
          </label>
          <MovKebabMenu :value="actions" @edit="startEditingItem(idx)" @delete="deleteItem(idx)" />
        </div>
      </div>
    </Draggable>
    <AttributeChartConfig
      v-if="open > -2"
      :value="selectedChart"
      @input="updateItem(open, $event)"
      @close="close"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator';
import Draggable from 'vuedraggable';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';
import { ActionMenuItem } from '@movici-flow-common/types';
import AttributeChartConfig from './AttributeChartConfig.vue';
import { ChartVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';

@Component({
  name: 'FlowChartPicker',
  components: { Draggable, AttributeChartConfig }
})
export default class FlowChartPicker extends Mixins(DraggableMixin) {
  @Prop({ type: Array, default: () => [] }) readonly value!: ChartVisualizerInfo[];
  @Prop({ type: Number, default: -2 }) readonly open!: number;
  group = 'charts';
  actions: ActionMenuItem[] = [
    {
      icon: 'edit',
      iconPack: 'far',
      label: 'Edit',
      event: 'edit'
    },
    {
      icon: 'trash',
      iconPack: 'far',
      label: 'Delete',
      event: 'delete',
      colorScheme: 'is-danger'
    }
  ];

  get selectedChart() {
    return this.open > -2 ? this.value[this.open] : null;
  }

  close() {
    this.$emit('update:open', -2);
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    if (this.open == event.moved.oldIndex) {
      this.$emit('update:open', event.moved.newIndex);
    }
    this.$emit('input', this.move(event.moved.oldIndex, event.moved.newIndex, this.value));
  }

  getAttributeFromChart(config: ChartVisualizerInfo | null) {
    return config?.attribute;
  }

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

  updateItem(idx: number, val: ChartVisualizerInfo) {
    this.$emit(
      'input',
      this.value.map((info, arrayIdx) => {
        return arrayIdx === idx ? val : info;
      })
    );
    this.close();
  }

  deleteItem(idx: number) {
    const name = this.value[idx].title;
    this.$buefy.dialog.confirm({
      message: '' + this.$t('flow.visualization.dialogs.deleteChart', { name }),
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
}
</script>

<style scoped lang="scss">
$container-bg: $white-ter;

.draggable {
  margin: 0;
}

.layer-picker-container {
  height: 100%;
  margin: 0.5rem -0.25rem 0.5rem 0;
  padding-right: 0.25rem;
  .chart {
    background-color: $container-bg;
    .header {
      background-color: $container-bg;
      .label {
        max-width: 200px;
        .attribute {
          color: $grey-dark;
          font-weight: 300;
          font-size: 0.75rem;
        }
      }
      .control {
        flex: 1;
      }
    }
  }
}
</style>
