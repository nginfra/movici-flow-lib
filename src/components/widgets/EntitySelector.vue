<template>
  <b-collapse class="box entity-summary" animation="slide" aria-id="entitySummary">
    <template #trigger="{ open }">
      <div class="is-flex" aria-controls="entitySummary">
        <label class="label is-flex-grow-1 is-size-6-half">
          {{ $t('flow.datasets.entitySummary') }}
          <span class="count">({{ entityGroupsFiltered.length }})</span>
        </label>
        <b-icon size="is-small" pack="far" :icon="!open ? 'expand' : 'compress'"></b-icon>
      </div>
    </template>
    <div class="box-content mt-2">
      <b-field class="entity-selector">
        <ul class="flow-list entities-list is-size-7">
          <li v-for="(group, idx) in entityGroupsFiltered" :key="group.name" :title="group.name">
            <b-checkbox v-model="activeEntityGroups[idx]" size="is-small">
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
  </b-collapse>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { hexToColorTriple, MoviciColors } from '@/flow/visualizers/maps/colorMaps';
import { EntityGroupSummary, ScenarioDataset, VisualizationMode } from '@/flow/types';

import { isLines, isPoints, isPolygons } from '@/flow/visualizers/geometry';

import SummaryListing from '@/flow/mixins/SummaryListing';
import GeometrySelector from './GeometrySelector.vue';
import { ComposableVisualizerInfo } from '@/flow/visualizers/VisualizerInfo';

@Component({
  components: {
    GeometrySelector
  }
})
export default class EntitySelector extends Mixins(SummaryListing) {
  // ask pelle how we could use datasets that is on the mixin
  @Prop() datasetsArray!: ScenarioDataset[];
  @Prop() currentDataset!: ScenarioDataset | null;
  activeEntityGroups: boolean[] = [];

  /**
   * Filters out any entity group that can't be showed on the map
   */

  @Watch('currentDataset')
  getEntitySummary() {
    if (this.currentDataset) {
      this.currentDatasetName = this.currentDataset?.name;
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
          return new ComposableVisualizerInfo({
            datasetName: this.currentDataset.name,
            datasetUUID: this.currentDataset.uuid,
            entityGroup: group.name,
            visible: true,
            mode: VisualizationMode.GEOMETRY,
            settings: {
              type: group.type,
              popup: {
                title: 'Preview',
                when: 'onClick',
                position: 'static',
                items: group.properties
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
                  }),
                show: true
              },
              color: {
                static: {
                  color: hexToColorTriple(MoviciColors.DARK_GREY)
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
.entity-summary {
  min-width: 225px;
  padding: 8px;
  .icon {
    height: 24px;
    width: 24px;
  }
  .label {
    padding: 0 8px;
    margin: 0;
  }
  .entity-selector {
    .entities-list {
      padding-right: 0;
      li {
        margin-bottom: 0;
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
