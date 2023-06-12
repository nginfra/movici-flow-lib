<template>
  <section class="visualizer-editor overflow">
    <header class="mb-2 is-flex">
      <h1 class="is-size-4 has-text-weight-bold mr-2">
        {{
          modelValue.settings
            ? $t("flow.visualization.editVisualizer")
            : $t("flow.visualization.newVisualizer")
        }}
      </h1>
      <span class="separator is-flex-grow-1"></span>
      <o-button
        class="close is-borderless is-transparent has-hover-bg"
        icon-pack="far"
        icon-left="times"
        @click="close"
      />
    </header>
    <div class="editor-content" v-if="datasets">
      <div class="columns mb-0">
        <div class="column">
          <o-field
            required
            :label="$t('resources.dataset')"
            :variant="errors['currentDataset'] && 'danger'"
            :message="errors['currentDataset'] || ''"
          >
            <o-select
              v-model="currentDataset"
              :placeholder="$t('dataset.select')"
              size="small"
              expanded
            >
              <option v-for="d in datasets" :value="d" :key="d.uuid">
                {{ snakeToFriendly(d.name) }}
              </option>
            </o-select>
          </o-field>
        </div>
        <div class="column">
          <o-field
            required
            :label="$t('resources.entityGroup')"
            :variant="errors['currentEntityName'] && 'danger'"
            :message="errors['currentEntityName'] || ''"
          >
            <o-select
              v-model="currentEntityName"
              :disabled="(entityGroups?.length ?? 0) < 1"
              :placeholder="$t('flow.entityGroup.select')"
              size="small"
              expanded
            >
              <option v-for="entity in entityGroups" :value="entity.name" :key="entity.name">
                {{ entity.name }} ({{ entity.count }})
              </option>
            </o-select>
          </o-field>
        </div>
      </div>
      <div class="columns mb-0">
        <div class="column is-full">
          <o-field
            required
            :label="$t('flow.visualization.visualiserDisplayName')"
            :variant="errors['displayName'] && 'danger'"
            :message="errors['displayName'] || ''"
          >
            <o-input size="small" v-model="displayName" />
          </o-field>
        </div>
      </div>
      <div class="geometry-settings mb-2">
        <GeometrySelector
          v-model="geometry"
          :attributes="attributes"
          :label="$t('flow.visualization.displayAs')"
          showAs="button"
        />
      </div>
      <o-tabs
        class="flow-tabs pickers"
        v-if="attributes && availableConfigurators.length"
        v-model="tab"
      >
        <o-tab-item v-for="(conf, idx) in availableConfigurators" :key="idx" :value="idx">
          <template #header>
            <span> {{ conf.name }} </span>
            <o-icon
              icon="exclamation-circle"
              variant="danger"
              size="small"
              v-if="tabHasErrors(conf.id)"
            />
          </template>
          <component :is="conf.component" :name="conf.name" v-bind="conf.vBind" />
        </o-tab-item>
      </o-tabs>
    </div>
    <div class="bottom">
      <div class="left is-flex is-flex-grow-1"></div>
      <div class="right is-flex">
        <o-button
          class="mr-2 is-transparent has-text-primary is-borderless has-hover-bg"
          @click="close"
          size="small"
        >
          {{ $t("actions.cancel") }}
        </o-button>
        <o-button
          variant="primary"
          :disabled="!hasPendingChanges"
          @click="submit(false)"
          class="mr-2"
          size="small"
          icon-pack="fak"
          icon-left="fa-mov-save"
        >
          {{ $t("flow.visualization.save") }}
        </o-button>
        <o-button
          outlined
          variant="primary"
          :disabled="!hasPendingChanges"
          @click="submit(true)"
          icon-pack="fak"
          icon-left="fa-mov-save"
          size="small"
        >
          {{ $t("flow.visualization.saveAndClose") }}
        </o-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDialog } from "@movici-flow-common/baseComposables/useDialog";
import { useReactiveSummary } from "@movici-flow-common/composables/useReactiveSummary";
import { useValidator } from "@movici-flow-common/composables/useValidator";
import type {
  Dataset,
  DatasetSummary,
  FlowVisualizerOptions,
  PopupClause,
  Scenario,
  ScenarioDataset,
  SizeClause,
} from "@movici-flow-common/types";

import { FlowVisualizerType } from "@movici-flow-common/types";
import { attributeString, excludeKeys } from "@movici-flow-common/utils";
import { FormValidator } from "@movici-flow-common/utils/FormValidator";
import { snakeToFriendly } from "@movici-flow-common/utils/filters";
import { ComposableVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { computed, provide, ref, toRaw, watch, type Component, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import GeometrySelector from "../GeometrySelector.vue";
import ColorConfigurator from "./ColorConfigurator.vue";
import GeometryConfigurator from "./GeometryConfigurator.vue";
import PopupConfigurator from "./PopupConfigurator.vue";
import VisibilityConfigurator from "./VisibilityConfigurator.vue";
import {
  attributesInjection,
  datasetsInjection,
  geometryInjection,
  settingsInjection,
  summaryInjection,
  validatorInjection,
} from "./injectionKeys";
import FloodingGridConfigurator from "./FloodingGridConfigurator.vue";
import ShapeIconConfigurator from "./ShapeIconConfigurator.vue";
import SizeConfigurator from "./SizeConfigurator.vue";
const { t } = useI18n();
enum FlowConfigurator {
  COLOR = "color",
  SIZE = "size",
  ICON_SHAPE = "icon-shape",
  VISIBILITY = "visibility",
  POPUP = "popup",
  FLOODING = "flooding",
  GEOMETRY = "geometry",
}
const CONFIGURATORS_BY_TYPE: Record<FlowVisualizerType, FlowConfigurator[]> = {
  [FlowVisualizerType.POINTS]: [
    FlowConfigurator.COLOR,
    FlowConfigurator.SIZE,
    FlowConfigurator.VISIBILITY,
    FlowConfigurator.POPUP,
  ],
  [FlowVisualizerType.LINES]: [
    FlowConfigurator.COLOR,
    FlowConfigurator.SIZE,
    FlowConfigurator.VISIBILITY,
    FlowConfigurator.POPUP,
  ],
  [FlowVisualizerType.POLYGONS]: [
    FlowConfigurator.COLOR,
    FlowConfigurator.SIZE,
    FlowConfigurator.VISIBILITY,
    FlowConfigurator.POPUP,
  ],
  [FlowVisualizerType.ARCS]: [
    FlowConfigurator.COLOR,
    FlowConfigurator.SIZE,
    FlowConfigurator.VISIBILITY,
    FlowConfigurator.POPUP,
  ],
  [FlowVisualizerType.ICONS]: [
    FlowConfigurator.COLOR,
    FlowConfigurator.ICON_SHAPE,
    FlowConfigurator.SIZE,
    FlowConfigurator.VISIBILITY,
    FlowConfigurator.POPUP,
  ],
  [FlowVisualizerType.GRID]: [
    FlowConfigurator.GEOMETRY,
    FlowConfigurator.COLOR,
    FlowConfigurator.SIZE,
    FlowConfigurator.VISIBILITY,
    FlowConfigurator.POPUP,
  ],
  [FlowVisualizerType.FLOODING_GRID]: [FlowConfigurator.GEOMETRY, FlowConfigurator.FLOODING],
};

const props = withDefaults(
  defineProps<{
    modelValue?: ComposableVisualizerInfo;
    scenario?: Scenario | null;
  }>(),
  { modelValue: () => new ComposableVisualizerInfo() }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: ComposableVisualizerInfo): void;
  (e: "close"): void;
}>();

const validator = new FormValidator({
  validators: {
    currentDataset: () => {
      if (!currentDataset.value) {
        return "Please select a dataset";
      }
    },
    currentEntityName: () => {
      if (!currentEntityName.value) {
        return "Please select an entity group";
      }
      if (!geometry.value) return t("flow.datasets.zeroEntities");
    },
    displayName: () => {
      if (!displayName.value) {
        return "Please fill the field";
      }
    },
  },
});

const { errors, hasErrors, validated } = useValidator(validator);

const geometry = ref<FlowVisualizerType>();
const settings = ref<FlowVisualizerOptions | null>(null);
const displayName = validated("displayName", ref(""));

const tab = ref(0);
const tabsWithErrors = ref<Record<number, boolean>>({});
const additionalEntityGroups = ref<Record<string, string>>();

const reactiveSummary = useReactiveSummary();
const { currentDatasetName, datasets, attributes, summary, datasetsByName, entityGroups } =
  reactiveSummary;

const currentDataset = validated("currentDataset", reactiveSummary.currentDataset);
const currentEntityName = validated("currentEntityName", reactiveSummary.currentEntityName);

watch(
  () => props.scenario,
  (scenario) => {
    if (scenario) {
      datasets.value = scenario.datasets;
    }
  },
  { immediate: true }
);

const composedVisualizer = computed<Partial<ComposableVisualizerInfo>>(() => {
  if (currentDataset.value && currentEntityName.value && settings.value) {
    return new ComposableVisualizerInfo({
      id: props.modelValue.id,
      name: displayName.value,
      datasetName: currentDataset.value.name,
      datasetUUID: currentDataset.value.uuid,
      entityGroup: currentEntityName.value,
      additionalEntityGroups: additionalEntityGroups.value ?? undefined,
      settings: settings.value,
      scenarioUUID: props.modelValue?.scenarioUUID || props.scenario?.uuid,
      visible: props.modelValue?.visible ?? true,
    });
  }
  return {};
});

const finalizedVisualizer = computed<Partial<ComposableVisualizerInfo>>(() => {
  return Object.assign({}, composedVisualizer.value, { settings: finalizeSettings() });
});

const availableConfigurators = computed(() => {
  if (!attributes.value || !geometry.value) return [];
  return CONFIGURATORS_BY_TYPE[geometry.value]
    .map((c) => configurators.value[c]!)
    .filter((c) => !!c);
});

interface ConfiguratorSettings {
  id: string;
  name: string | (() => string);
  component: Component;
  vBind: Record<string, unknown>;
}

const configurators = computed<Partial<Record<FlowConfigurator, ConfiguratorSettings>>>(() => {
  const bindClause = <T extends keyof FlowVisualizerOptions>(clauseType: T) => {
    return {
      modelValue: settings.value?.[clauseType],
      "onUpdate:modelValue": (clause: FlowVisualizerOptions[T] | null) => {
        updateSettings({ [clauseType]: clause });
      },
    };
  };

  const bindMultipleClauses = <T extends keyof FlowVisualizerOptions>(...clauseType: T[]) => {
    return {
      modelValue: clauseType.reduce((agg, key) => {
        agg[key] = settings.value?.[key];
        return agg;
      }, {} as Partial<FlowVisualizerOptions>),
      "onUpdate:modelValue": (clause: Partial<FlowVisualizerOptions>) => {
        updateSettings(clause);
      },
    };
  };
  return {
    [FlowConfigurator.COLOR]: {
      id: "color",
      name: t("flow.visualization.colorConfig.colors"),
      component: ColorConfigurator,
      vBind: bindClause("color"),
    },
    [FlowConfigurator.ICON_SHAPE]: {
      id: "icon-shape",
      name: `${t("flow.visualization.iconConfig.shape")} / ${t(
        "flow.visualization.iconConfig.icon"
      )}`,
      component: ShapeIconConfigurator,
      vBind: bindMultipleClauses("shape", "icon"),
    },
    [FlowConfigurator.SIZE]: {
      id: "size",
      name: (() => {
        switch (geometry.value) {
          case FlowVisualizerType.POINTS:
            return t("flow.visualization.sizeConfig.radius");
          case FlowVisualizerType.LINES:
          case FlowVisualizerType.POLYGONS:
          case FlowVisualizerType.ARCS:
            return t("flow.visualization.sizeConfig.thickness");
          case FlowVisualizerType.ICONS:
          default:
            return t("flow.visualization.sizeConfig.size");
        }
      })(),
      component: SizeConfigurator,
      vBind: bindClause("size"),
    },
    [FlowConfigurator.VISIBILITY]: {
      id: "visibility",
      name: t("flow.visualization.visibilityConfig.visibility"),
      component: VisibilityConfigurator,
      vBind: bindClause("visibility"),
    },
    [FlowConfigurator.POPUP]: {
      id: "popup",
      name: t("flow.visualization.popup.popup"),
      component: PopupConfigurator,
      vBind: bindClause("popup"),
    },
    [FlowConfigurator.FLOODING]: {
      id: "floodingGrid",
      name: t("flow.visualization.floodingConfig.floodingGrid"),
      component: FloodingGridConfigurator,
      vBind: bindMultipleClauses("floodingGrid", "color"),
    },
    [FlowConfigurator.GEOMETRY]: {
      id: "geometry",
      name: t("flow.visualization.geometryConfig.geometry"),
      component: GeometryConfigurator,
      vBind: {
        modelValue: additionalEntityGroups.value,
        "onUpdate:modelValue": (val?: Record<string, string>) => {
          additionalEntityGroups.value = val;
        },
      },
    },
  };
});

provide(attributesInjection, attributes);
provide(datasetsInjection, datasets);
provide(settingsInjection, settings);
provide(geometryInjection, geometry as Ref<FlowVisualizerType>);
provide(summaryInjection, summary as Ref<DatasetSummary>);
provide(validatorInjection, validator);

const hasEmptySettings = computed(() => {
  const obj = composedVisualizer.value;
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
});

const newIDRequired = computed(() => {
  if (!props.modelValue?.id || !settings.value) return false;
  return (
    props.modelValue.datasetUUID !== currentDataset.value?.uuid ||
    props.modelValue.entityGroup !== currentEntityName.value ||
    props.modelValue?.settings?.type !== settings.value.type
  );
});

const hasPendingChanges = computed(() => {
  const value = excludeKeys(toRaw(props.modelValue), ["status", "summary", "errors"]),
    finalized = excludeKeys(toRaw(finalizedVisualizer.value), ["status", "summary", "errors"]);
  return !isEqual(finalized, value);
});

function tabHasErrors(name: string) {
  return Object.keys(errors.value).some((err) => err.startsWith(name));
}

watch(currentEntityName, (newName, oldName) => {
  if (!newName) return;
  // check if we have a custom display name or are using the default
  if (!displayName.value || displayName.value === oldName) {
    displayName.value = newName;
  }
  tab.value = 0;
});

watch(geometry, (geometry) => {
  if (geometry) {
    if (!settings.value) {
      settings.value = { type: geometry };
    } else {
      settings.value = { ...settings.value, type: geometry };
    }
  } else {
    settings.value = null;
  }
  tab.value = 0;
  tabsWithErrors.value = {};
});

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    displayName.value = val.name;
    currentDatasetName.value = val.datasetName;
    additionalEntityGroups.value = val.additionalEntityGroups;
    if (!currentDataset.value) return;
    currentEntityName.value = val.entityGroup;

    if (!val.settings) return;
    geometry.value = val.settings.type;
    settings.value = cloneDeep(val.settings);
  },
  { immediate: true }
);

function updateSettings(updatedClause: Partial<FlowVisualizerOptions>) {
  if (!settings.value) return;
  Object.assign(settings.value, updatedClause);
}

const { openDialog } = useDialog();
function close() {
  if (hasPendingChanges.value && !hasEmptySettings.value) {
    openDialog({
      message: t("flow.visualization.dialogs.unsavedChanges") + "!",
      cancelText: t("flow.visualization.dialogs.continueEditing"),
      confirmButtonText: t("flow.visualization.dialogs.discardChanges"),

      variant: "danger",
      canCancel: true,
      onConfirm: () => emit("close"),
    });
  } else {
    emit("close");
  }
}

function submit(close?: boolean) {
  validator.validate();
  if (!hasErrors.value) {
    emit(
      "update:modelValue",
      new ComposableVisualizerInfo(
        Object.assign({}, composedVisualizer.value, {
          id: newIDRequired.value ? undefined : composedVisualizer.value.id,
          settings: finalizeSettings(),
        })
      )
    );
    if (close) emit("close");
  }
}

interface FinalizerContext {
  datasets: Record<string, ScenarioDataset | Dataset>;
}
type Finalizers = {
  popup: (
    val: FlowVisualizerOptions["popup"],
    context: FinalizerContext
  ) => FlowVisualizerOptions["popup"] | undefined;
  size: (
    val: FlowVisualizerOptions["size"],
    context: FinalizerContext
  ) => FlowVisualizerOptions["size"];
};

const FINALIZERS: Finalizers = {
  popup(val?: PopupClause) {
    // if popup clause is provided but user doesn't set labels
    // for the attributes, we use its attributeString
    return !val
      ? undefined
      : {
          title: val.title,
          show: val.show,
          onHover: val.onHover,
          dynamicTitle: val.dynamicTitle,
          items: val.items.map((item) => {
            return {
              name: item.name || attributeString(item.attribute),
              attribute: item.attribute,
            };
          }),
        };
  },
  size(val?: SizeClause) {
    return !val
      ? undefined
      : Object.entries(val).reduce((acc, obj) => {
          const [key, value] = obj;
          if (value?.units === "pixels") {
            delete value.minPixels;
            delete value.maxPixels;
          }

          acc[key as keyof SizeClause] = value;

          return acc;
        }, {} as SizeClause);
  },
};

function finalizeSettings(): FlowVisualizerOptions | null {
  if (!composedVisualizer.value.settings) return null;

  const rv: FlowVisualizerOptions = { ...composedVisualizer.value.settings };
  const context: FinalizerContext = {
    datasets: datasetsByName.value,
  };
  if (rv.popup) {
    rv.popup = FINALIZERS.popup(rv.popup, context);
  }

  if (rv.size) {
    rv.size = FINALIZERS.size(rv.size, context);
  }

  return rv;
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
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-top: 0;
  z-index: 1;
  padding: 0 24px;
  transition: transform 0.5s;
  header {
    padding-top: 24px;
    background-color: var(--visualizer-editor-bg-color);
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .editor-content {
    :deep(.label) {
      font-size: (0.75rem);
      margin-top: 0.25em;
      margin-bottom: 0.5em;
    }
    :deep(.close) {
      position: absolute;
      right: 24px;
      top: 24px;
    }
    :deep(.pickers) {
      .tab-content {
        .tab-item {
          padding: 16px 16px;
          background-color: $white-bis;
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
