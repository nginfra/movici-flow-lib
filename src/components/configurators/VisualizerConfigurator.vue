<template>
  <section class="visualizer-editor overflow">
    <header class="mb-2 is-flex">
      <h1 class="is-size-4 has-text-weight-bold">
        {{
          value.settings
            ? $t('flow.visualization.editVisualizer')
            : $t('flow.visualization.newVisualizer')
        }}
      </h1>
      <span class="separator is-flex-grow-1"></span>
      <b-button
        class="close is-borderless is-transparent"
        icon-pack="far"
        icon-left="times"
        @click="close"
      >
      </b-button>
    </header>
    <div class="editor-content" v-if="datasets">
      <div class="columns mb-0">
        <div class="column">
          <b-field
            required
            :label="$t('resources.dataset')"
            :type="{ 'is-danger': errors['currentDataset'] }"
            :message="errors['currentDataset'] || ''"
          >
            <b-select
              :value="currentDataset"
              @input="headerValidated('currentDataset', $event)"
              :placeholder="$t('dataset.select')"
              size="is-small"
              expanded
            >
              <option v-for="d in datasets" :value="d" :key="d.uuid">
                {{ d.name | snakeToSpaces | upperFirst }}
              </option>
            </b-select>
          </b-field>
        </div>
        <div class="column">
          <b-field
            required
            :label="$t('resources.entityGroup')"
            :type="{ 'is-danger': errors['currentEntityName'] }"
            :message="errors['currentEntityName'] || ''"
          >
            <b-select
              :value="currentEntityName"
              @input="headerValidated('currentEntityName', $event)"
              :disabled="entityGroups.length < 1"
              :placeholder="$t('entityGroup.select')"
              size="is-small"
              expanded
            >
              <option v-for="entity in entityGroups" :value="entity.name" :key="entity.name">
                {{ entity.name }} ({{ entity.count }})
              </option>
            </b-select>
          </b-field>
        </div>
      </div>
      <div class="columns mb-0">
        <div class="column is-full">
          <b-field
            required
            :label="$t('flow.visualization.visualiserDisplayName')"
            :type="{ 'is-danger': errors['displayName'] }"
            :message="errors['displayName'] || ''"
          >
            <b-input
              size="is-small"
              :value="displayName"
              @input="headerValidated('displayName', $event)"
            />
          </b-field>
        </div>
        <!-- won't do anything while we got no groups -->
        <div class="column" v-if="vGroups.length">
          <b-field :label="$t('resources.visualizerGroup')">
            <b-select
              expanded
              :placeholder="$t('visualizerGroup.select')"
              :value="vGroupIndex"
              size="is-small"
              @input="$emit('update:vGroupIndex', $event)"
            >
              <option v-for="(vg, index) in vGroups" :value="index" :key="vg.name">
                {{ vg.name }}
              </option>
            </b-select>
            <b-button icon-left="plus" class="movici is-round"></b-button>
          </b-field>
        </div>
      </div>
      <template>
        <div class="geometry-settings mb-2">
          <GeometrySelector
            v-model="geometry"
            :properties="entitySummaryProps"
            :label="$t('flow.visualization.displayAs')"
            showAs="button"
          />
        </div>
        <b-tabs class="flow-tabs pickers" v-if="geometry">
          <b-tab-item v-for="conf in filteredConfigurators" :key="conf.name" :label="conf.name">
            <component :is="conf.component" v-bind="conf.vBind" v-on="conf.vOn"></component>
          </b-tab-item>
        </b-tabs>
      </template>
    </div>
    <div class="bottom">
      <b-button outlined type="is-primary" v-if="isDirty" @click="submit(true)" size="is-small">
        {{ $t('flow.visualization.saveAndClose') }}
      </b-button>
      <b-button outlined type="is-primary" v-else @click="$emit('close')" size="is-small">
        {{ $t('actions.cancel') }}
      </b-button>
      <b-button
        type="is-primary"
        :disabled="!isDirty"
        @click="submit(false)"
        class="ml-2"
        size="is-small"
      >
        {{ $t('flow.visualization.save') }}
      </b-button>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { flowStore } from '@/flow/src/store/store-accessor';
import {
  FlowVisualizerOptions,
  FlowVisualizerType,
  ScenarioDataset,
  VisualizationMode
} from '@/flow/src/types';
import ValidationProvider from '../../mixins/ValidationProvider';
import SummaryListing from '@/flow/src/mixins/SummaryListing';
import GeometrySelector from '../widgets/GeometrySelector.vue';
import { VisGroup } from '@/flow/src/visualizers';
import ColorConfigurator from './color/ColorConfigurator.vue';
import SizeConfigurator from './size/SizeConfigurator.vue';
import PopupConfigurator from './PopupConfigurator.vue';
import FormValidator from '@/flow/src/utils/FormValidator';
import { ComposableVisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';
import { propertyString } from '@/flow/src/utils';
import {
  getSingleLegendPlaceholder,
  PlaceholderType
} from '@/flow/src/components/configurators/helpers';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

@Component({
  components: {
    GeometrySelector,
    ColorConfigurator,
    SizeConfigurator,
    PopupConfigurator
  }
})
export default class VisualizerConfigurator extends Mixins(SummaryListing, ValidationProvider) {
  @Prop({ type: Object, default: () => new ComposableVisualizerInfo() })
  readonly value!: ComposableVisualizerInfo;
  @Prop([String]) readonly scenarioUUID!: string | null;
  @Prop({ type: Number, default: -1 }) readonly vGroupIndex!: number;
  @Prop({ type: Array, default: [] }) readonly vGroups!: VisGroup[];
  @Prop({ type: Boolean, default: false }) readonly noGroups!: boolean;
  isDirty = false;
  datasets: ScenarioDataset[] = [];
  currentDataset: ScenarioDataset | null = null;
  displayName = '';
  geometry: FlowVisualizerType | null = null;
  settings: FlowVisualizerOptions | null = null;

  get entitySummaryProps() {
    return this.entitySummary?.properties;
  }

  get composedVisualizer(): Partial<ComposableVisualizerInfo> {
    if (this.currentDataset && this.currentEntityName && this.settings) {
      return new ComposableVisualizerInfo({
        id: this.value.id,
        name: this.displayName,
        datasetName: this.currentDataset.name,
        datasetUUID: this.currentDataset.uuid,
        entityGroup: this.currentEntityName,
        settings: this.settings,
        scenarioUUID: this.value?.scenarioUUID || this.scenarioUUID,
        mode: VisualizationMode.SCENARIO,
        visible: this.value?.visible ?? true
      });
    }
    return {};
  }

  get finalizedVisualizer(): Partial<ComposableVisualizerInfo> {
    return Object.assign({}, this.composedVisualizer, { settings: this.finalizeSettings() });
  }

  get filteredConfigurators() {
    return this.configurators.filter(config => {
      return !config.filterGeometry || config.filterGeometry.find(geom => geom === this.geometry);
    });
  }

  // TODO: Maybe move these to helpers, this component is too big.
  get configurators() {
    return [
      {
        name: 'Colours',
        component: ColorConfigurator,
        vBind: {
          entityProps: this.entitySummaryProps,
          value: this.settings?.color,
          validator: this.validator
        },
        vOn: {
          input: (event: FlowVisualizerOptions['color']) => this.updateSettings(event, 'color')
        }
      },
      {
        name: 'Radius',
        filterGeometry: [FlowVisualizerType.POINTS],
        component: SizeConfigurator,
        vBind: {
          entityProps: this.entitySummaryProps,
          value: this.settings?.size,
          validator: this.validator
        },
        vOn: {
          input: (event: FlowVisualizerOptions['size'] | null) => this.updateSettings(event, 'size')
        }
      },
      {
        name: 'Thickness',
        filterGeometry: [
          FlowVisualizerType.LINES,
          FlowVisualizerType.POLYGONS,
          FlowVisualizerType.ARCS
        ],
        component: SizeConfigurator,
        vBind: {
          entityProps: this.entitySummaryProps,
          value: this.settings?.size,
          validator: this.validator
        },
        vOn: {
          input: (event: FlowVisualizerOptions['size'] | null) => this.updateSettings(event, 'size')
        }
      },
      {
        name: 'Popup',
        component: PopupConfigurator,
        vBind: {
          entityProps: this.entitySummaryProps,
          value: this.settings?.popup,
          validator: this.validator
        },
        vOn: {
          input: (event: FlowVisualizerOptions['popup'] | null) =>
            this.updateSettings(event, 'popup')
        }
      }
    ];
  }

  get hasEmptySettings() {
    const obj = this.composedVisualizer;
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  get newIDRequired() {
    if (!this.value?.id || !this.settings) return false;
    return (
      this.value.datasetUUID !== this.currentDataset?.uuid ||
      this.value.entityGroup !== this.currentEntityName ||
      this.value?.settings?.type !== this.settings.type
    );
  }

  @Watch('currentEntityName')
  afterSetCurrentEntityName(currentEntityName: string, oldName: string) {
    if (!this.displayName || this.displayName === oldName) {
      this.validated('displayName', currentEntityName);
    }
  }

  @Watch('geometry')
  ensureGeometry(geometry: FlowVisualizerType) {
    if (!this.settings) {
      this.settings = { type: geometry };
    } else {
      this.$set(this.settings, 'type', geometry);
    }
  }

  @Watch('currentDataset')
  async updateCurrentDatasetName() {
    this.currentDatasetName = this.currentDataset?.name || null;
  }

  @Watch('value')
  updateVisualizerMetadata(value: ComposableVisualizerInfo) {
    this.displayName = value.name;
    this.currentDataset = this.datasets.find(d => d.name === value.datasetName) || null;

    if (this.currentDataset) {
      this.currentEntityName = value.entityGroup;
      if (value.settings) {
        this.geometry = value.settings.type;
        this.settings = cloneDeep(value.settings);
      }
    }
  }

  headerValidated(key: keyof this, value: unknown) {
    // new configurators dont have settings, so they won't update is dirty
    if (this.value.settings) {
      this.updateIsDirty(this[key] !== value);
    }

    this.validated(key, value);
  }

  updateSettings<T extends keyof FlowVisualizerOptions>(
    updatedClause: FlowVisualizerOptions[T] | null,
    clauseType: T
  ) {
    if (this.settings) {
      if (updatedClause) {
        // This checks if there was a change between the clauses and it's update and if isDirty is ever set to true,
        // then we don't need to check it anymore, it will remain dirty until is saved.
        // Also, when other configurators are mounted, once they stabilize they emit and call this function.
        // But since it is comparing to itself, this !isEqual will remain false
        this.updateIsDirty(!isEqual(this.settings[clauseType], updatedClause));
        this.$set(this.settings, clauseType, updatedClause);
      } else {
        this.$delete(this.settings, clauseType);
      }
    }
  }

  updateIsDirty(value: boolean) {
    if (!this.isDirty) {
      this.isDirty = value;
    }
  }

  close() {
    if (this.isDirty && !this.hasEmptySettings)
      this.$buefy.dialog.confirm({
        message: this.$t('flow.visualization.dialogs.unsavedChanges') + '!',
        cancelText: '' + this.$t('flow.visualization.dialogs.continueEditing'),
        confirmText: '' + this.$t('flow.visualization.dialogs.discardChanges'),
        type: 'is-danger',
        onConfirm: () => this.$emit('close')
      });
    else this.$emit('close');
  }

  submit(close?: boolean) {
    this.validator?.validate();
    if (!this.hasErrors) {
      this.$emit(
        'input',
        new ComposableVisualizerInfo(
          Object.assign(
            {},
            this.composedVisualizer,
            { id: this.newIDRequired ? undefined : this.composedVisualizer.id },
            { settings: this.finalizeSettings() }
          )
        )
      );
      if (close) this.$emit('close');
    }
  }

  /**
   * Function to finalize clauses
   */
  finalizeSettings(): FlowVisualizerOptions | null {
    const settings = this.composedVisualizer.settings;
    if (!settings) return null;
    const rv = Object.assign({}, settings);
    // finalize legend of byValue color clause
    // if user puts legends as true, but doesn't provide legends
    // we use the range as the legend
    if (rv.color?.legend && rv.color.byValue) {
      const values = rv.color.byValue.colors.map(c => c[0]);
      const maxValue = rv.color.byValue.maxValue;
      const type: PlaceholderType = rv.color.byValue.type === 'gradient' ? 'single' : 'range';

      rv.color.legend.labels =
        rv.color.legend.labels?.map(
          (label, idx) => label || getSingleLegendPlaceholder(values, type, maxValue, idx)
        ) ?? [];
    }

    // if popup clause is provided but user doesn't set labels
    // for the attributes, we use its propertyString
    if (settings.popup) {
      rv.popup = {
        title: settings.popup.title,
        when: settings.popup.when,
        show: settings.popup.show,
        position: settings.popup.when === 'onClick' ? settings.popup.position : 'dynamic',
        items: settings.popup.items.map(item => {
          return {
            name: item.name || propertyString(item.attribute),
            attribute: item.attribute
          };
        })
      };
    }
    return rv;
  }

  setupValidator() {
    this.validator = new FormValidator({
      validators: {
        currentDataset: () => {
          if (!this.currentDataset) {
            return 'Please select a dataset';
          }
        },
        currentEntityName: () => {
          if (!this.currentEntityName) {
            return 'Please select an entity group';
          }
          if (!this.geometry) return '' + this.$t('flow.datasets.zeroEntities');
        },
        displayName: () => {
          if (!this.displayName) {
            return 'Please fill the field';
          }
        }
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  async mounted() {
    if (flowStore.scenario) {
      this.datasets = flowStore.scenario.datasets;
    }

    if (this.value) {
      this.updateVisualizerMetadata(this.value);
    }

    this.setupValidator();
  }
}
</script>

<style lang="scss" scoped>
.visualizer-editor {
  --visualizer-editor-bg-color: #{$white};
  position: fixed;
  left: calc(#{$left-menu-size} + #{$menu-item-size});
  top: 0;
  height: 100vh;
  width: 45vw;
  max-width: 900px;
  background-color: var(--visualizer-editor-bg-color);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 1;
  padding: 0 24px;
  transition: transform 0.5s;
  header {
    padding-top: 24px;
    background-color: var(--visualizer-editor-bg-color);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .editor-content {
    ::v-deep {
      .label {
        font-size: 0.75rem;
      }
      .close {
        position: absolute;
        right: 24px;
        top: 24px;
      }
      .pickers {
        .tab-content {
          .tab-item {
            padding: 16px 16px;
            background-color: $white-bis;
          }
        }
      }
    }
  }
  .bottom {
    position: sticky;
    bottom: 0;
    background: var(--visualizer-editor-bg-color);
    padding: 16px 0 24px 0;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    .button {
      display: flex;
    }
  }
}
</style>
