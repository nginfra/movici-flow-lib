<template>
  <WidgetContainer collapsable>
    <template #collapse-title="{ collapsed }">
      <div
        class="is-flex-direction-row-reverse is-align-content-space-between is-flex is-align-items-center is-clickable"
      >
        <b-tooltip
          position="is-left"
          size="is-small"
          type="is-black"
          :label="$t('flow.datasets.entitySummary')"
          :active="collapsed"
          :delay="1000"
        >
          <b-icon pack="far" :icon="collapsed ? 'stream' : 'minus-square'"></b-icon>
        </b-tooltip>
        <label class="label is-flex-grow-1 mb-0" v-show="!collapsed">
          {{ $t('flow.datasets.entitySummary') }}
        </label>
      </div>
    </template>
    <template #collapse-content>
      <div class="box-content mt-2">
        <b-field class="entity-selector">
          <ul class="entities-list is-size-7">
            <Draggable
              :value="entityGroupsFiltered"
              v-bind="draggableOptions"
              v-on="draggableEvents"
              class="draggable"
              :class="{ dashed: drag }"
              @change="updateDraggable"
            >
              <li
                class="pl-0 is-flex"
                v-for="(group, idx) in entityGroupsFiltered"
                :key="group.name"
                :title="group.name"
              >
                <span
                  class="grip mr-1 is-flex is-align-items-center"
                  v-if="entityGroupsFiltered.length > 1"
                >
                  <span class="icon is-small fa-stack">
                    <i class="far fa-ellipsis-v"></i>
                    <i class="far fa-ellipsis-v"></i>
                  </span>
                </span>
                <div class="checkbox-holder">
                  <b-checkbox v-model="activeEntityGroups[idx]" size="is-small">
                    {{ group.name | snakeToSpaces | upperFirst }} ({{ group.count }})
                  </b-checkbox>
                  <GeometrySelector
                    :value="group.type"
                    @input="$set(group, 'type', $event)"
                    :properties="group.properties"
                    :allowed-geometries="allowedGeometries"
                    class="entity-geometry-selector ml-5"
                    v-show="activeEntityGroups[idx]"
                    showAs="radio"
                  />
                </div>
              </li>
              <li class="zero-results has-text-danger" v-if="!entityGroupsFiltered.length">
                {{ $t('flow.datasets.zeroEntities') }}
              </li>
            </Draggable>
          </ul>
        </b-field>
      </div>
    </template>
  </WidgetContainer>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { hexToColorTriple, MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import {
  DatasetSummary,
  EntityGroupSummary,
  FlowVisualizerOptions,
  FlowVisualizerType,
  PropertySummary,
  ScenarioDataset,
  VisualizationMode,
  IMPORTANT_ATTRIBUTES
} from '@movici-flow-common/types';
import { isLines, isPoints, isPolygons } from '@movici-flow-common/visualizers/geometry';
import GeometrySelector from './GeometrySelector.vue';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import WidgetContainer from '@movici-flow-common/components/map_widgets/WidgetContainer.vue';
import { RGBAColor } from '@deck.gl/core';
import Draggable from 'vuedraggable';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';

interface TypedEntityGroupSummary extends EntityGroupSummary {
  type?: FlowVisualizerType | null;
}

type GetVisualizationProps = {
  datasetName: string;
  datasetUUID: string;
  entityGroup: string;
  type: FlowVisualizerType;
  items: PropertySummary[];
  color: RGBAColor;
};

@Component({
  name: 'EntitySelector',
  components: {
    GeometrySelector,
    WidgetContainer,
    Draggable
  }
})
export default class EntitySelector extends Mixins(DraggableMixin) {
  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary;
  @Prop({ type: Object, default: null }) readonly currentDataset!: ScenarioDataset | null;
  entityGroupsFiltered: TypedEntityGroupSummary[] = [];
  activeEntityGroups: boolean[] = [];
  isOpen = true;
  allowedGeometries = [
    FlowVisualizerType.POINTS,
    FlowVisualizerType.LINES,
    FlowVisualizerType.POLYGONS
  ];
  colors = [
    MoviciColors.GREEN,
    MoviciColors.BLUE,
    MoviciColors.RED,
    MoviciColors.PURPLE,
    MoviciColors.ORANGE,
    MoviciColors.YELLOW,
    MoviciColors.BROWN,
    MoviciColors.LIGHT_GREY
  ];
  group = 'entity-groups';

  get entityGroups(): TypedEntityGroupSummary[] {
    return this.summary?.entity_groups ?? [];
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    this.entityGroupsFiltered = this.move(
      event.moved.oldIndex,
      event.moved.newIndex,
      this.entityGroupsFiltered
    );

    this.activeEntityGroups = this.move(
      event.moved.oldIndex,
      event.moved.newIndex,
      this.activeEntityGroups
    );
  }

  @Watch('validLayers')
  emitValidLayers(layers: ComposableVisualizerInfo[]) {
    this.$emit('setLayerInfos', layers);
  }

  @Watch('currentDataset', { immediate: true })
  resetActive() {
    this.activeEntityGroups = Array(this.entityGroupsFiltered.length).fill(false);
  }

  getMoviciColor(idx: number) {
    return hexToColorTriple(this.colors[idx % this.colors.length]);
  }

  @Watch('entityGroups', { immediate: true })
  getEntityGroupsFiltered() {
    this.entityGroupsFiltered = this.entityGroups.filter(group => {
      return (
        isLines(group.properties) || isPoints(group.properties) || isPolygons(group.properties)
      );
    });
  }

  /**
   * returns an array of VisualizerInfo array for the map component based on user selection
   */
  get validLayers() {
    return this.entityGroupsFiltered.reduce((arr, group, idx) => {
      if (this.currentDataset && this.activeEntityGroups?.[idx] && group.type) {
        const items = group.properties.sort(a =>
          IMPORTANT_ATTRIBUTES.some(attr => a.name === attr) ? -1 : 1
        );

        arr.push(
          this.getDefaultVisualizer({
            datasetName: this.currentDataset.name,
            datasetUUID: this.currentDataset.uuid,
            entityGroup: group.name,
            type: group.type,
            items,
            color: this.getMoviciColor(idx)
          })
        );
      }
      return arr;
    }, [] as ComposableVisualizerInfo[]);
  }

  getDefaultVisualizer({
    datasetName,
    datasetUUID,
    entityGroup,
    type,
    items,
    color
  }: GetVisualizationProps) {
    const settings: FlowVisualizerOptions = {
      type,
      popup: {
        title: entityGroup,
        when: 'onClick',
        position: 'static',
        show: true,
        items: items.map(prop => ({ name: prop.name, attribute: prop }))
      },
      color: {
        static: {
          color
        }
      },
      size: {
        static: {
          size: 6,
          units: 'pixels'
        }
      }
    };

    return new ComposableVisualizerInfo({
      datasetName,
      datasetUUID,
      entityGroup,
      visible: true,
      mode: VisualizationMode.GEOMETRY,
      settings
    });
  }
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

.entity-selector {
  .entities-list {
    li {
      background-color: $white !important;
      ::v-deep .checkbox {
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
