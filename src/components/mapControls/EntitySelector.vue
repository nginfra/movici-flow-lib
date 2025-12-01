<template>
  <WidgetContainer collapsable>
    <template #collapse-title="{ collapsed }">
      <div
        class="is-flex-direction-row-reverse is-align-content-space-between is-flex is-align-items-center is-clickable"
      >
        <o-icon
          :title="t('flow.datasets.entitySummary')"
          class="collapsed-icon"
          pack="far"
          :icon="collapsed ? 'stream' : 'minus-square'"
        />
        <label class="label is-flex-grow-1 mb-0" v-show="!collapsed">
          {{ t("flow.datasets.entitySummary") }}
        </label>
      </div>
    </template>
    <template #collapse-content>
      <div class="box-content mt-2">
        <o-field class="entity-selector">
          <ul class="entities-list is-size-7">
            <Draggable
              v-if="visualizableEntityGroups.length"
              :modelValue="visualizableEntityGroups"
              :item-key="draggableItemKey"
              v-bind="draggableOptions"
              v-on="draggableEvents"
              class="draggable"
              :class="{ dashed: dragging }"
              @change="draggableChange"
            >
              <template #item="{ element }">
                <li class="pl-0 is-flex" :key="element.name" :title="element.name">
                  <span
                    class="grip mr-1 is-flex is-align-items-center"
                    v-if="visualizableEntityGroups.length > 1"
                  >
                    <span class="icon is-small fa-stack">
                      <i class="far fa-ellipsis-v"></i>
                      <i class="far fa-ellipsis-v"></i>
                    </span>
                  </span>
                  <div class="checkbox-holder">
                    <o-checkbox v-model="element.active" size="small">
                      {{ formatEntityName(element.name) }} ({{ element.count }})
                    </o-checkbox>
                    <GeometrySelector
                      v-if="element.active"
                      v-model="element.type"
                      :attributes="element.properties"
                      :allowed-geometries="allowedGeometries"
                      class="entity-geometry-selector ml-5"
                      showAs="radio"
                    />
                  </div>
                </li>
              </template>
            </Draggable>
            <li class="zero-results has-text-danger" v-else>
              {{ t("flow.datasets.zeroEntities") }}
            </li>
          </ul>
        </o-field>
      </div>
    </template>
  </WidgetContainer>
</template>

<script setup lang="ts">
import { useDraggable } from "@movici-flow-lib/composables/useDraggable";

import {
  FlowVisualizerType,
  IMPORTANT_ATTRIBUTES,
  type AttributeSummary,
  type DatasetSummary,
  type EntityGroupSummary,
  type FlowVisualizerOptions,
  type RGBAColor,
  type ScenarioDataset,
} from "@movici-flow-lib/types";
import { snakeToSpaces, upperFirst } from "@movici-flow-lib/utils/filters";
import { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { isGrid, isLines, isPoints, isPolygons } from "@movici-flow-lib/visualizers/geometry";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";
import { computed, ref, watchEffect, type Ref, watch } from "vue";
import Draggable from "vuedraggable";
import GeometrySelector from "../GeometrySelector.vue";
import WidgetContainer from "./WidgetContainer.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface TypedEntityGroupSummary extends EntityGroupSummary {
  type?: FlowVisualizerType;
  active?: boolean;
}

type GetVisualizationProps = {
  datasetName: string;
  datasetUUID: string;
  entityGroup: string;
  additionalEntityGroups: Record<string, string>;
  type: FlowVisualizerType;
  items: AttributeSummary[];
  color: RGBAColor;
};

const props = defineProps<{
  modelValue?: ComposableVisualizerInfo[];
  summary?: DatasetSummary;
  dataset?: ScenarioDataset;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val?: ComposableVisualizerInfo[]): void;
}>();
const visualizableEntityGroups = ref([]) as Ref<TypedEntityGroupSummary[]>;
const { draggableEvents, draggableOptions, dragging, draggableChange } =
  useDraggable(visualizableEntityGroups);
draggableOptions.group = "entity-groups";
function draggableItemKey(item: TypedEntityGroupSummary) {
  return item.name;
}

const allowedGeometries = [
  FlowVisualizerType.POINTS,
  FlowVisualizerType.LINES,
  FlowVisualizerType.POLYGONS,
  FlowVisualizerType.GRID,
];
const colors = [
  MoviciColors.GREEN,
  MoviciColors.BLUE,
  MoviciColors.RED,
  MoviciColors.PURPLE,
  MoviciColors.ORANGE,
  MoviciColors.YELLOW,
  MoviciColors.BROWN,
  MoviciColors.LIGHT_GREY,
];

const entityGroups = computed(() => props.summary?.entity_groups ?? []);
watch(
  entityGroups,
  () => {
    visualizableEntityGroups.value = entityGroups.value
      .filter((group) => {
        return (
          isLines(group.properties) ||
          isPoints(group.properties) ||
          isPolygons(group.properties) ||
          isGrid(group.properties)
        );
      })
      .map((e) => {
        return { ...e, active: false, type: undefined };
      });
  },
  { immediate: true }
);

function formatEntityName(name: string) {
  return upperFirst(snakeToSpaces(name));
}

function getAdditionalEntityGroups(group: TypedEntityGroupSummary): Record<string, string> {
  if (!(group?.type === FlowVisualizerType.GRID)) {
    return {};
  }
  const firstPointEntityGroup = entityGroups.value.find((group) =>
    isPoints(group.properties)
  )?.name;
  return {
    points: firstPointEntityGroup!,
  };
}

watchEffect(() => {
  const layers = visualizableEntityGroups.value.reduce((arr, group, idx) => {
    if (props.dataset && group.active && group.type) {
      const items = group.properties.sort((a) =>
        ["id", ...IMPORTANT_ATTRIBUTES].some((attr) => a.name === attr) ? -1 : 1
      );

      arr.push(
        makeVisualizerInfo({
          datasetName: props.dataset.name,
          datasetUUID: props.dataset.uuid,
          additionalEntityGroups: getAdditionalEntityGroups(group),
          entityGroup: group.name,
          type: group.type,
          items,
          color: hexToColorTriple(colors[idx % colors.length]),
        })
      );
    }
    return arr;
  }, [] as ComposableVisualizerInfo[]);
  emit("update:modelValue", layers);
});

function makeVisualizerInfo({
  datasetName,
  datasetUUID,
  entityGroup,
  additionalEntityGroups,
  type,
  items,
  color,
}: GetVisualizationProps) {
  const settings: FlowVisualizerOptions = {
    type,
    popup: {
      title: entityGroup,
      show: true,
      items: items.map((prop) => ({ name: prop.name, attribute: prop })),
    },
    color: {
      static: {
        color,
      },
      advanced: {
        fillOpacity: 255,
      },
    },
    size: {
      static: {
        size: type === "polygons" ? 1 : 6,
        units: "pixels",
      },
    },
  };

  return new ComposableVisualizerInfo({
    datasetName,
    datasetUUID,
    entityGroup,
    additionalEntityGroups,
    visible: true,
    settings,
  });
}
</script>

<style scoped lang="scss">
.box {
  min-width: 200px;
  max-width: 300px;
  padding: 0.75rem;
}
.grip {
  height: 30px;
}

:deep(.collapsed-icon) {
  &:hover {
    background: $white-ter;
  }
}

.entity-selector {
  .entities-list {
    li {
      background-color: $white !important;

      :deep(.checkbox) {
        .control-label {
          color: $black;
        }
      }
      .checkbox-holder {
        width: 100%;
      }
      &.zero-results {
        cursor: not-allowed;
      }
      &:not(:last-child) {
        border-bottom: 1px solid $white-ter !important;
      }
    }
  }
}
</style>
