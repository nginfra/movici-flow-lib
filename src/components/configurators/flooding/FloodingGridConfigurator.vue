<template>
  <div>
    <div class="columns mb-0 is-multiline" v-if="datasets">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field
          :label="$t('flow.visualization.floodingConfig.heightMap')"
          required
          :message="errors['localValue']"
          :type="{ 'is-danger': errors['localValue'] }"
        >
          <FilteredSelect
            class="is-flex-grow-1"
            :value="localValue"
            @input="updateValue"
            :options="datasets"
            :filterVal="filterVal"
            :displayName="displayName"
          />
        </b-field>
      </div>
      <div class="column is-one-third-desktop">
        <b-field>
          <b-checkbox v-model="showLegend" size="is-small">
            {{ $t('flow.visualization.showLegend') }}
          </b-checkbox>
        </b-field>
      </div>
    </div>
    <FloodingColorConfigurator
      :value="color"
      @input="$emit('setColor', $event)"
      :validator="validator"
      :summary="summary"
      :entityProps="entityProps"
      :showLegend.sync="showLegend"
    />
  </div>
</template>

<script lang="ts">
import {
  ColorClause,
  DatasetSummary,
  FloodingGridClause,
  PropertySummary,
  ScenarioDataset
} from '@movici-flow-common/types';
import { Component, Prop, Mixins } from 'vue-property-decorator';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import FloodingColorConfigurator from './FloodingColorConfigurator.vue';

@Component({
  name: 'FloodingGridConfigurator',
  components: {
    FloodingColorConfigurator
  }
})
export default class FloodingGridConfigurator extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: null }) readonly value!: FloodingGridClause | null;
  @Prop({ type: Array }) readonly datasets?: ScenarioDataset[];
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  @Prop({ type: Object, default: null }) readonly color!: ColorClause;
  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary | null;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  showLegend = false;
  localValue: ScenarioDataset | null = null;

  filterVal(dataset: ScenarioDataset) {
    return dataset.type === 'height_map';
  }

  displayName(val: ScenarioDataset): string {
    return val.name;
  }

  updateValue(dataset: ScenarioDataset) {
    const toEmit: FloodingGridClause = {
      heightMapDataset: dataset.name
    };
    this.validator.touch('value');
    this.$emit('input', toEmit);
  }

  setupValidator() {
    this.validator?.configure({
      validators: {
        localValue: () => {
          if (!this.value) return 'Select a height map dataset';
        }
      },
      onValidate: e => (this.errors = e)
    });
  }

  mounted() {
    this.setupValidator();

    if (this.value && this.datasets) {
      const name = this.value.heightMapDataset;
      this.localValue = this.datasets.find(d => d.name === name) ?? null;
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
