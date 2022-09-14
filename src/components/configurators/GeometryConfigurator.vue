<template>
  <div class="columns mb-0 is-multiline" v-if="localValue && summary">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <b-field
        :label="$t('flow.visualization.geometryConfig.geometryLabel')"
        required
        :message="errors['localValue']"
        :type="{ 'is-danger': errors['localValue'] }"
      >
        <template #label>
          {{ $t('flow.visualization.geometryConfig.geometryLabel') }}
          <b-icon
            size="is-small"
            icon-pack="far"
            icon="info-circle"
            :title="$t('flow.visualization.geometryConfig.geometryInfo')"
          />
        </template>
        <span
          class="is-flex is-align-items-center"
          v-for="(key, val) in requiredAdditionalEntityGroups"
          :key="key"
        >
          <span class="mr-4 is-size-6-half"> {{ key | upperFirst }}: </span>
          <FilteredSelect
            class="is-flex-grow-1"
            :value="localValue[key]"
            @input="updateValue(key, $event)"
            :options="summary.entity_groups"
            :filterVal="filterVal(val)"
            :displayName="displayName"
          />
        </span>
      </b-field>
    </div>
  </div>
</template>

<script lang="ts">
import {
  DatasetSummary,
  EntityGeometry,
  EntityGroupSummary,
  FlowVisualizerType
} from '@movici-flow-common/types';
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { isGrid, isLines, isPoints, isPolygons } from '@movici-flow-common/visualizers/geometry';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator from '@movici-flow-common/utils/FormValidator';

const REQUIRED_ADDITIONAL_ENTITY_GROUPS: Partial<
  Record<FlowVisualizerType, Record<string, EntityGeometry>>
> = {
  [FlowVisualizerType.FLOODING_GRID]: { points: EntityGeometry.POINT },
  [FlowVisualizerType.GRID]: { points: EntityGeometry.POINT }
};

const FILTERS: Record<EntityGeometry, (val: EntityGroupSummary) => boolean> = {
  [EntityGeometry.POINT]: (val: EntityGroupSummary) => isPoints(val.properties),
  [EntityGeometry.LINE]: (val: EntityGroupSummary) => isLines(val.properties),
  [EntityGeometry.POLYGON]: (val: EntityGroupSummary) => isPolygons(val.properties),
  [EntityGeometry.GRID]: (val: EntityGroupSummary) => isGrid(val.properties)
};

@Component({
  name: 'GeometryConfigurator'
})
export default class GeometryConfigurator extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: null }) readonly value!: Record<string, string> | null;
  @Prop({ type: Object }) readonly summary?: DatasetSummary;
  @Prop({ type: String }) readonly geometry?: FlowVisualizerType;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  localValue: Record<string, EntityGroupSummary> | null = null;

  get requiredAdditionalEntityGroups(): Record<string, EntityGeometry> {
    return (this.geometry ? REQUIRED_ADDITIONAL_ENTITY_GROUPS[this.geometry] : null) ?? {};
  }

  getEntityGroup(name?: string) {
    if (!name || !this.summary) return;

    return this.summary.entity_groups.find(group => group.name === name);
  }

  filterVal(key: EntityGeometry): (val: EntityGroupSummary) => boolean {
    return FILTERS[key];
  }

  displayName(val: EntityGroupSummary): string {
    return `${val.name} (${val.count})`;
  }

  updateValue(key: string, val: EntityGroupSummary) {
    this.validated('localValue', Object.assign(this.localValue, { [key]: val }));
    const rv: Record<string, string> = { ...this.value, [key]: val.name };
    this.$emit('input', rv);
  }

  setupValidator() {
    this.validator?.configure({
      validators: {
        localValue: () => {
          if (!this.localValue) return 'Invalid clause';

          for (let key in this.requiredAdditionalEntityGroups) {
            if (!this.localValue[key])
              return '' + this.$t('flow.visualization.geometryConfig.geometryError');
          }
        }
      },
      onValidate: e => (this.errors = e)
    });
  }

  mounted() {
    this.setupValidator();

    this.localValue = {};
    if (this.value) {
      const entries = Object.entries(this.value);
      for (let index = 0; index < entries.length; index++) {
        const [key, value] = entries[index];

        if (this.requiredAdditionalEntityGroups[key]) {
          const entityGroup = this.getEntityGroup(value);
          if (entityGroup) {
            this.localValue[key] = entityGroup;
          }
        }
      }
    }
  }

  beforeDestroy() {
    if (this.validator) {
      this.destroyValidator();
    }
  }
}
</script>

<style scoped lang="scss"></style>
