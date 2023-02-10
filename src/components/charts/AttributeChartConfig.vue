<template>
  <div class="chart-config" v-if="localValue">
    <header class="mb-2">
      <div class="row is-flex is-align-items-center">
        <b-icon pack="far" icon="chart-line" />
        <h1 class="is-size-4 has-text-weight-bold is-flex-grow-1 ml-2">
          {{ $t('flow.visualization.graph.title') }}
        </h1>
        <span class="close is-clickable" :title="$t('actions.close')" @click="$emit('close')">
          <b-icon pack="far" icon="times" />
        </span>
      </div>
      <div class="row">
        <h2 class="is-size-6">
          {{ selectedAttributeName }}
        </h2>
      </div>
    </header>
    <div class="columns mb-0">
      <div class="column">
        <b-field :label="$t('flow.visualization.graph.graphDisplayName')">
          <b-input
            size="is-small"
            class="is-size-7"
            v-model="localValue.title"
            :placeholder="localValue.title"
          />
        </b-field>
      </div>
    </div>

    <div class="contents mb-2" v-if="localValue.items.length">
      <label class="label is-size-6-half">{{ $t('flow.visualization.graph.lines') }}</label>
      <div class="box info mb-2 p-3 has-background-white-bis">
        <div class="header is-flex mb-0">
          <label class="label color is-size-7 is-flex-shrink-1 mr-2">
            {{ $t('flow.visualization.colorConfig.color') }}
          </label>
          <label class="label display-name is-size-7 is-flex-grow-1">
            {{ $t('properties.displayName') }}
          </label>
        </div>
        <Draggable
          :value="localValue.items"
          v-bind="draggableOptions"
          v-on="draggableEvents"
          class="draggable contents"
          :class="{ dashed: drag }"
          @change="updateDraggable"
        >
          <div class="item mb-1" v-for="(item, index) in localValue.items" :key="index">
            <div class="is-flex is-align-items-center">
              <span class="grip mx-1">
                <span class="icon is-small fa-stack has-text-grey">
                  <i class="far fa-ellipsis-v"></i>
                  <i class="far fa-ellipsis-v"></i>
                </span>
              </span>
              <b-field class="is-flex-shrink-1 mr-2 mb-0">
                <ColorInput
                  :value="item.color"
                  @input="updateColor(index, $event)"
                  colorPickerPosition="top-right"
                />
              </b-field>
              <b-field class="is-flex-grow-1 is-align-items-center mr-2 mb-0">
                <b-input expanded size="is-small" class="is-size-7" v-model="item.name" />
              </b-field>
              <b-button
                class="is-borderless is-transparent has-hover-bg is-flex has-text-danger"
                size="is-small"
                @click="removeItem(index)"
                icon-left="trash"
                title="Remove graph"
                :disabled="localValue.items.length === 1"
              />
              <b-button
                class="is-borderless is-flex"
                size="is-small"
                @click="toggleDetails(index)"
                :icon-left="showDetails[index] ? 'angle-up' : 'angle-down'"
                :title="
                  !showDetails[index]
                    ? $t('flow.visualization.graph.showEntityDetails')
                    : $t('flow.visualization.graph.hideEntityDetails')
                "
              />
            </div>
            <div
              v-if="showDetails[index]"
              class="details is-flex mt-2 mb-1 px-3 py-2 has-background-white"
            >
              <b-field class="is-flex-shrink-1 mr-5" :label="`${$t('resources.entity')} ID`">
                <span class="value is-size-7">{{ item.entityId }}</span>
              </b-field>
              <b-field class="is-flex-shrink-1 mr-5" :label="$t('resources.entityGroup')">
                <span class="value is-size-7">{{ item.entityGroup }}</span>
              </b-field>
              <b-field class="is-flex-shrink-1" :label="$t('resources.dataset')">
                <span class="value is-size-7">{{
                  item.datasetName | snakeToSpaces | upperFirst
                }}</span>
              </b-field>
            </div>
          </div>
        </Draggable>
      </div>
    </div>

    <div class="bottom">
      <MovButtons
        size="is-small"
        isPulledRight
        :value="buttons"
        @saveChart="saveChart"
        @cancel="$emit('close')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { RGBAColor } from '@deck.gl/core';
import ColorInput from '@movici-flow-common/components/widgets/ColorInput.vue';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { MoviciError } from '@movici-flow-common/errors';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';
import SummaryListing from '@movici-flow-common/mixins/SummaryListing';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import { flowStore } from '@movici-flow-common/store/store-accessor';
import { ButtonItem, PropertyType } from '@movici-flow-common/types';
import { excludeKeys } from '@movici-flow-common/utils';
import { colorTripleToHex, MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import {
  ChartVisualizerInfo,
  ChartVisualizerItem
} from '@movici-flow-common/visualizers/VisualizerInfo';
import { cloneDeep, isEqual } from 'lodash';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import Draggable from 'vuedraggable';

@Component({
  name: 'AttributeChartConfig',
  components: {
    AttributeSelector,
    Draggable,
    ColorInput
  }
})
export default class AttributeChartConfig extends Mixins(
  ValidationProvider,
  SummaryListing,
  DraggableMixin
) {
  @Prop({ type: Object, default: null }) readonly value!: ChartVisualizerInfo | null;
  localValue: ChartVisualizerInfo | null = null;
  allowedPropertyTypes = ['INT', 'DOUBLE'];
  showColorPicker = false;
  colorPickerPresets = Object.values(MoviciColors);
  colorPickerIndex = -1;
  showDetails: boolean[] = [];
  currentScenarioUUID = '';

  get filteredEntityProps() {
    return this.properties.filter(this.filterProp);
  }

  get buttons(): ButtonItem[] {
    return [
      {
        colorScheme: 'is-success',
        label: '' + this.$t('actions.save'),
        icon: 'save',
        iconPack: 'fas',
        event: 'saveChart',
        isDisabled: !this.hasPendingChanges
      },
      {
        label: '' + this.$t('actions.cancel'),
        icon: 'times',
        iconPack: 'fas',
        event: 'cancel'
      }
    ];
  }

  get disabledFields() {
    return ['dataset', 'entityGroup', 'attribute'];
  }

  get selectedAttributeName() {
    return this.localValue?.attribute ?? '';
  }

  get hasPendingChanges() {
    if (!this.value || !this.localValue) throw new MoviciError('Empty or invalid configuration');

    const value = excludeKeys(this.value, ['id', 'errors', 'status']),
      finalized = excludeKeys(this.localValue, ['id', 'errors', 'status']);
    return !isEqual(finalized, value);
  }

  getSuggestedColor(chart: ChartVisualizerInfo) {
    return this.colorPickerPresets[chart?.items.length ?? 0 % (this.colorPickerPresets.length - 1)];
  }

  colorTripleToHex = colorTripleToHex;

  isDisabled(field: string) {
    return this.disabledFields.includes(field);
  }

  updateColor(idx: number, color: RGBAColor) {
    if (this.localValue) {
      this.localValue.items = this.localValue.items.map((config, i) => {
        return idx == i ? new ChartVisualizerItem({ ...config, color }) : config;
      });
    }
  }

  getColor(colorPickerIndex: number) {
    return this.localValue?.items[colorPickerIndex].color ?? null;
  }

  filterProp(prop: PropertyType) {
    return this.allowedPropertyTypes.indexOf(prop.data_type) !== -1;
  }

  saveChart() {
    if (!this.localValue) {
      throw new MoviciError('Chart is invalid');
    }
    this.$emit('input', this.localValue);
  }

  openColorPicker(index: number) {
    if (this.showColorPicker && this.colorPickerIndex === index) {
      this.showColorPicker = false;
      this.colorPickerIndex = -1;
    } else {
      this.colorPickerIndex = index;
      this.showColorPicker = true;
    }
  }

  closeColorPicker() {
    this.colorPickerIndex = -1;
    this.showColorPicker = false;
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    if (this.localValue) {
      this.localValue.items = this.move<ChartVisualizerItem>(
        event.moved.oldIndex,
        event.moved.newIndex,
        this.localValue.items
      );
      this.showDetails = Array.from({ length: this.localValue.items.length }, () => false);
    }
  }

  removeItem(index: number) {
    this.localValue?.items.splice(index);
    this.showDetails.splice(index);
  }

  toggleDetails(idx: number) {
    this.showDetails = this.showDetails.map((val, i) => (idx === i ? !val : val));
  }

  setLocalValue(value: ChartVisualizerInfo | null) {
    this.localValue = cloneDeep(value);
    if (this.localValue) {
      const contentConfig = this.localValue.items[0];

      this.currentEntityName = contentConfig.entityGroup;
      this.currentDatasetName = contentConfig.datasetName;
      this.currentDataset = this.datasets.find(d => d.name === this.currentDatasetName) || null;
      this.showDetails = Array.from({ length: this.localValue.items.length }, () => false);
    }
  }

  @Watch('value', { immediate: true })
  afterValue() {
    this.setLocalValue(this.value);
  }

  async mounted() {
    this.datasets = (await flowStore.getDatasets()) ?? [];
  }
}
</script>

<style scoped lang="scss">
.box {
  box-shadow: none;
  border-radius: 0;
  &.info {
    border-top: 1px solid $grey-lighter;
  }
  .header {
    .label {
      &.color {
        width: 54px;
      }
    }
  }
}
::v-deep {
  .field {
    margin-bottom: 0.125em;
    .field-label {
      min-width: 80px;
    }
    .label {
      font-size: 0.75rem;
    }
    span {
      display: block;
    }
  }
}

.chart-config {
  --visualizer-editor-bg-color: #{$white};
  position: fixed;
  left: calc(#{$left-menu-size + $menu-item-size});
  top: 0;
  width: 30vw;
  height: 100vh;
  background-color: var(--visualizer-editor-bg-color);
  box-shadow: inset 0 0 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 2;
  padding: 0 24px;
  transition: transform 0.5s;
  header {
    padding-top: 24px;
    background-color: var(--visualizer-editor-bg-color);
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .bottom {
    background: var(--visualizer-editor-bg-color);
    padding: 16px 0 24px 0;
  }
}
</style>
