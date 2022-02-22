<template>
  <WidgetContainer collapsable>
    <template #collapse-title="{ collapsed }">
      <div
        class="is-flex-direction-row-reverse is-align-content-space-between is-flex is-align-items-center is-clickable"
        aria-controls="entity-summary"
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
          <ul class="flow-list entities-list is-size-7">
            <li
              class="pl-0 mb-0"
              v-for="(group, idx) in entityGroupsFiltered"
              :key="group.name"
              :title="group.name"
            >
              <b-checkbox v-model="activeEntityGroups[idx]" size="is-small" style="">
                {{ group.name | snakeToSpaces | upperFirst }} ({{ group.count }})
              </b-checkbox>
              <GeometrySelector
                class="entity-geometry-selector ml-5"
                v-show="activeEntityGroups[idx]"
                :properties="group.properties"
                :value="group.type"
                @input="$set(group, 'type', $event)"
                showAs="radio"
              />
            </li>
            <li class="zero-results has-text-danger" v-if="!entityGroupsFiltered.length">
              {{ $t('flow.datasets.zeroEntities') }}
            </li>
          </ul>
        </b-field>
      </div>
    </template>
  </WidgetContainer>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { hexToColorTriple, MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import { EntityGroupSummary, ScenarioDataset, VisualizationMode } from '@movici-flow-common/types';
import { isLines, isPoints, isPolygons } from '@movici-flow-common/visualizers/geometry';
import SummaryListing from '@movici-flow-common/mixins/SummaryListing';
import GeometrySelector from './GeometrySelector.vue';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import WidgetContainer from '@movici-flow-common/components/map_widgets/WidgetContainer.vue';

@Component({
  components: {
    GeometrySelector,
    WidgetContainer
  }
})
export default class EntitySelector extends Mixins(SummaryListing) {
  // ask pelle how we could use datasets that is on the mixin
  @Prop() datasetsArray!: ScenarioDataset[];
  @Prop() currentDataset!: ScenarioDataset | null;
  activeEntityGroups: boolean[] = [];
  isOpen = true;
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

  /**
   * Filters out any entity group that can't be showed on the map
   */
  @Watch('currentDataset')
  getEntitySummary() {
    if (this.currentDataset) {
      this.currentDatasetUUID = this.currentDataset?.uuid;
    }
  }

  @Watch('validLayers')
  emitValidLayers(layers: ComposableVisualizerInfo[]) {
    this.$emit('setLayerInfos', layers);
  }

  @Watch('entityGroupsFiltered')
  resetActive(entityGroupsFiltered: EntityGroupSummary[]) {
    this.activeEntityGroups = Array(entityGroupsFiltered.length).fill(false);
  }

  getMoviciColor(idx: number) {
    return hexToColorTriple(this.colors[idx % this.colors.length]);
  }

  get entityGroupsFiltered() {
    return this.entityGroups.filter(group => {
      return (
        isLines(group.properties) || isPoints(group.properties) || isPolygons(group.properties)
      );
    });
  }

  /**
   * returns an array of VisualizerInfo array for the map component based on user selection
   */
  get validLayers() {
    return this.entityGroupsFiltered
      .map((group: EntityGroupSummary, idx: number) => {
        const active: boolean | undefined = this.activeEntityGroups?.[idx];

        if (this.currentDataset && active && group.type) {
          const items = group.properties
            .filter(prop => {
              return (
                prop.data_type === 'INT' ||
                prop.data_type === 'DOUBLE' ||
                prop.data_type === 'BOOLEAN' ||
                prop.data_type === 'STRING'
              );
            })
            .map(prop => {
              return { name: prop.name, attribute: prop };
            })
            .sort((a, b) => {
              // make sure id is on top
              if (a.name === 'id') return -1;
              if (b.name === 'id') return 1;
              return 0;
            });

          return new ComposableVisualizerInfo({
            datasetName: this.currentDataset.name,
            datasetUUID: this.currentDataset.uuid,
            entityGroup: group.name,
            visible: true,
            mode: VisualizationMode.GEOMETRY,
            settings: {
              type: group.type,
              popup: {
                title: '',
                when: 'onClick',
                position: 'static',
                dynamicTitle: true,
                show: true,
                items
              },
              color: {
                static: {
                  color: this.getMoviciColor(idx)
                }
              }
            }
          });
        }
        return null;
      })
      .filter((layer: ComposableVisualizerInfo | null) => layer);
  }

  mounted() {
    this.datasets = this.datasetsArray;
    this.getEntitySummary();
  }
}
</script>

<style scoped lang="scss">
.box {
  min-width: 200px;
  max-width: 300px;
  padding: 0.75rem;
}
.entity-summary {
  .entity-selector {
    .entities-list {
      li {
        background-color: $white !important;
        ::v-deep .checkbox {
          .control-label {
            color: $black;
          }
        }
        &.zero-results {
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
