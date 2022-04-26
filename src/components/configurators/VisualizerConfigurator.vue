<template>
  <section class="visualizer-editor overflow">
    <header class="mb-2 is-flex">
      <h1 class="is-size-4 has-text-weight-bold mr-2">
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
              :placeholder="$t('flow.entityGroup.select')"
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
              :placeholder="$t('flow.visualizerGroup.select')"
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
        <b-tabs class="flow-tabs pickers" v-if="filteredConfigurators.length" v-model="tab">
          <b-tab-item v-for="conf in filteredConfigurators" :key="conf.name">
            <template #header>
              <span> {{ conf.name }} </span>
              <b-icon
                icon="exclamation-circle"
                type="is-danger"
                size="is-small"
                v-if="tabHasErrors(conf.name)"
              />
            </template>
            <component :is="conf.component" :name="conf.name" v-bind="conf.vBind" v-on="conf.vOn" />
          </b-tab-item>
        </b-tabs>
      </template>
    </div>
    <div class="bottom">
      <div class="left is-flex is-flex-grow-1"></div>
      <div class="right is-flex">
        <b-button
          class="mr-2 is-transparent has-text-primary is-borderless"
          @click="close"
          size="is-small"
        >
          {{ $t('actions.cancel') }}
        </b-button>
        <b-button
          type="is-primary"
          :disabled="!isDirty"
          @click="submit(false)"
          class="mr-2"
          size="is-small"
          icon-pack="fak"
          icon-left="fa-mov-save"
        >
          {{ $t('flow.visualization.save') }}
        </b-button>
        <b-button
          outlined
          type="is-primary"
          :disabled="!isDirty"
          @click="submit(true)"
          icon-pack="fak"
          icon-left="fa-mov-save"
          size="is-small"
        >
          {{ $t('flow.visualization.saveAndClose') }}
        </b-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { flowStore } from '@movici-flow-common/store/store-accessor';
import {
  FlowVisualizerOptions,
  FlowVisualizerType,
  ScenarioDataset,
  SizeClause,
  VisualizationMode
} from '@movici-flow-common/types';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import SummaryListing from '@movici-flow-common/mixins/SummaryListing';
import GeometrySelector from '../widgets/GeometrySelector.vue';
import { VisGroup } from '@movici-flow-common/visualizers';
import VisibilityConfigurator from './VisibilityConfigurator.vue';
import ColorConfigurator from './color/ColorConfigurator.vue';
import SizeConfigurator from './size/SizeConfigurator.vue';
import PopupConfigurator from './PopupConfigurator.vue';
import ShapeIconConfigurator from './icon/ShapeIconConfigurator.vue';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { propertyString, excludeKey } from '@movici-flow-common/utils';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

type Finalizers = {
  popup: (val: FlowVisualizerOptions['popup']) => FlowVisualizerOptions['popup'] | undefined;
  size: (val: FlowVisualizerOptions['size']) => FlowVisualizerOptions['size'];
};

const FINALIZERS: Finalizers = {
  popup: (val: FlowVisualizerOptions['popup']) => {
    // if popup clause is provided but user doesn't set labels
    // for the attributes, we use its propertyString
    return !val
      ? undefined
      : {
          title: val.title,
          when: val.when,
          show: val.show,
          dynamicTitle: val.dynamicTitle,
          position: val.when === 'onClick' ? val.position : 'dynamic',
          items: val.items.map(item => {
            return {
              name: item.name || propertyString(item.attribute),
              attribute: item.attribute
            };
          })
        };
  },
  size: (val: FlowVisualizerOptions['size']) => {
    return !val
      ? undefined
      : Object.entries(val).reduce((acc, obj) => {
          const [key, value] = obj;
          delete value.minPixels;
          delete value.maxPixels;

          acc[key as 'byValue' | 'static'] = value;

          return acc;
        }, {} as SizeClause);
  }
};

@Component({
  name: 'VisualizerConfigurator',
  components: {
    GeometrySelector
  }
})
export default class VisualizerConfigurator extends Mixins(SummaryListing, ValidationProvider) {
  @Prop({ type: Object, default: () => new ComposableVisualizerInfo() })
  readonly value!: ComposableVisualizerInfo;
  @Prop([String]) readonly scenarioUUID!: string | null;
  @Prop({ type: Number, default: -1 }) readonly vGroupIndex!: number;
  @Prop({ type: Array, default: [] }) readonly vGroups!: VisGroup[];
  @Prop({ type: Boolean, default: false }) readonly noGroups!: boolean;
  datasets: ScenarioDataset[] = [];
  currentDataset: ScenarioDataset | null = null;
  geometry: FlowVisualizerType | null = null;
  settings: FlowVisualizerOptions | null = null;
  isDirty = false;
  displayName = '';
  tab = 0;
  tabsWithErrors: Record<number, boolean> = {};
  get entitySummaryProps() {
    return this.entitySummary?.properties ?? [];
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
    if (!this.entitySummaryProps || !this.validator || !this.geometry) return [];

    const vBindDefaults = () => ({
        entityProps: this.entitySummaryProps,
        validator: this.validator,
        geometry: this.geometry
      }),
      vOnDefaults = <T extends keyof FlowVisualizerOptions>(clauseType: T) => {
        return {
          input: (clause: FlowVisualizerOptions[T] | null) =>
            this.updateSettings(clause, clauseType)
        };
      };

    return [
      {
        name: 'Colours',
        component: ColorConfigurator,
        vBind: { ...vBindDefaults(), value: this.settings?.color },
        vOn: { ...vOnDefaults('color') }
      },
      {
        name: 'Shape / Icon',
        filterGeometry: [FlowVisualizerType.ICONS],
        component: ShapeIconConfigurator,
        vBind: {
          ...vBindDefaults(),
          iconClause: this.settings?.icon,
          shapeClause: this.settings?.shape
        },
        vOn: {
          input: ({
            shape,
            icon
          }: {
            shape: FlowVisualizerOptions['shape'] | null;
            icon: FlowVisualizerOptions['icon'] | null;
          }) => {
            this.updateSettings(shape, 'shape');
            this.updateSettings(icon, 'icon');
          }
        }
      },
      {
        name: (() => {
          switch (this.geometry) {
            case FlowVisualizerType.POINTS:
              return 'Radius';
            case FlowVisualizerType.ICONS:
              return 'Size';
            case FlowVisualizerType.LINES:
            case FlowVisualizerType.POLYGONS:
            case FlowVisualizerType.ARCS:
              return 'Thickness';
          }
        })(),
        filterGeometry: [
          FlowVisualizerType.POINTS,
          FlowVisualizerType.ICONS,
          FlowVisualizerType.LINES,
          FlowVisualizerType.POLYGONS,
          FlowVisualizerType.ARCS
        ],
        component: SizeConfigurator,
        vBind: { ...vBindDefaults(), value: this.settings?.size },
        vOn: { ...vOnDefaults('size') }
      },

      {
        name: 'Visibility',
        component: VisibilityConfigurator,
        vBind: { ...vBindDefaults(), value: this.settings?.visibility?.byValue },
        vOn: { ...vOnDefaults('visibility') }
      },
      {
        name: 'Popup',
        component: PopupConfigurator,
        vBind: { ...vBindDefaults(), value: this.settings?.popup },
        vOn: { ...vOnDefaults('popup') }
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

  isEqual = isEqual;

  get hasPendingChanges() {
    const value = excludeKey('status', this.value),
      finalized = excludeKey('status', this.finalizedVisualizer);

    return !isEqual(finalized, value);
  }

  tabHasErrors(name: string) {
    return this.errors[name] ? !!Object.keys(this.errors[name]).length : false;
  }

  @Watch('currentEntityName')
  afterSetCurrentEntityName(currentEntityName: string, oldName: string) {
    if (!this.displayName || this.displayName === oldName) {
      this.validated('displayName', currentEntityName);
      this.tab = 0;
    }
  }

  @Watch('geometry')
  ensureGeometry(geometry: FlowVisualizerType) {
    if (!this.settings) {
      this.settings = { type: geometry };
    } else {
      this.settings = { ...this.settings, type: geometry };
    }

    this.tab = 0;
    this.tabsWithErrors = {};
  }

  @Watch('currentDataset')
  async updateCurrentDatasetName() {
    if (this.currentDataset?.uuid) {
      this.currentDatasetUUID = this.currentDataset.uuid;
    } else if (this.currentDataset?.name) {
      this.currentDatasetName = this.currentDataset.name;
    }
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
        this.$set(this.settings, clauseType, updatedClause);
        this.updateIsDirty(this.hasPendingChanges);
      } else {
        this.$delete(this.settings, clauseType);
        this.updateIsDirty(this.hasPendingChanges);
      }
    }
  }

  updateIsDirty(value: boolean) {
    this.isDirty = value;
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
      this.updateIsDirty(false);
      if (close) this.$emit('close');
    }
  }

  /**
   * Function to finalize clauses
   */
  finalizeSettings(): FlowVisualizerOptions | null {
    if (!this.composedVisualizer.settings) return null;

    let rv: FlowVisualizerOptions = Object.assign({}, this.composedVisualizer.settings);

    if (rv.popup) {
      rv.popup = FINALIZERS.popup(rv.popup);
    }

    if (rv.size) {
      rv.size = FINALIZERS.size(rv.size);
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
      onValidate: (moduleErrors, globalErrors) => {
        this.errors = globalErrors;
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
  box-shadow: inset 0 0 10px 0 rgba(0, 0, 0, 0.1);
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
        font-size: 0.75rem !important;
        margin-top: 0.25em !important;
        margin-bottom: 0.5em !important;
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

    .button {
      display: flex;
    }
  }
}
</style>
