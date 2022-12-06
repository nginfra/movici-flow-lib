<template>
  <div v-if="selectedEntityProp">
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <div class="is-flex" v-if="selectedDataType !== 'BOOLEAN'">
          <b-field
            class="mr-4 is-flex-shrink-1"
            :label="$t('flow.visualization.colorConfig.steps')"
          >
            <b-select
              :value="icons.length"
              @input="updateSteps"
              size="is-small"
              expanded
              :disabled="selectedDataType === 'BOOLEAN' || isEnum"
            >
              <option v-for="index in stepArray" :key="index" :value="index">{{ index }}</option>
            </b-select>
          </b-field>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline">
      <div class="column py-0 is-two-thirds-desktop">
        <ByValueIconList
          v-model="icons"
          :icon-options="iconOptions"
          :mode="mode"
          :min-value="minValue"
          :max-value="maxValue"
          :dataType="selectedEntityProp.data_type"
          :entityEnums="entityEnums"
          @interpolateMinMax="interpolateMinMax"
          @resetValues="resetValues"
          reversed
        />
      </div>
      <div class="column py-0 is-one-third-desktop is-full-tablet">
        <slot name="legend-labels" v-bind="{ entityEnums }" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { ByValueIconClause, IconClause, PropertySummary } from '@movici-flow-common/types';
import ByValueIconList from './ByValueIconList.vue';
import ByValueMixin from '../ByValueMixin';
import { MoviciError } from '@movici-flow-common/errors';
import { isEmpty } from 'lodash';
import { BY_VALUE_DEFAULT_ICON } from '../size/defaults';
import { MAPPED_ICONS } from '@movici-flow-common/visualizers/visualizerModules/iconCommon';
import { IconMapping } from '@movici-flow-common/visualizers/layers/ShapeIconLayer';
import { recalculateMapping } from '../helpers';

@Component({
  name: 'IconByValueConfigurator',
  components: {
    ByValueIconList
  }
})
export default class IconByValueConfigurator extends Mixins<ByValueMixin<IconClause>>(
  ByValueMixin
) {
  @Prop({ type: Object, default: null }) declare selectedEntityProp: PropertySummary | null;
  icons: [number, string][] = [];
  nSteps = 4;
  stepArray: number[] = [2, 3, 4, 5, 6, 7, 8];

  get iconOptions(): IconMapping {
    return MAPPED_ICONS.icons;
  }

  get firstIcon() {
    return Object.keys(this.iconOptions)[0];
  }

  get mappingValues(): number[] {
    return this.icons.map(val => val[0]);
  }

  get iconValues(): string[] {
    return this.icons.map(val => val[1]);
  }

  get currentMinValue() {
    return this.icons[0][0];
  }

  get currentMaxValue() {
    return this.icons[this.icons.length - 1][0];
  }

  get mode(): 'number' | 'boolean' {
    return this.selectedDataType === 'BOOLEAN' ? 'boolean' : 'number';
  }

  get entityEnums() {
    return this.summary?.general?.enum?.[this.selectedEntityProp?.enum_name ?? ''] ?? null;
  }

  get isEnum() {
    return !!this.entityEnums;
  }

  get currentClause(): ByValueIconClause | null {
    if (!this.selectedEntityProp) return null;

    return {
      attribute: this.selectedEntityProp,
      icons: this.icons
    };
  }

  @Watch('selectedEntityProp')
  afterSelectedEntityProp(val: PropertySummary | null) {
    if (val) {
      this.resetByDataType(val.data_type);
    }
  }

  @Watch('currentClause')
  prepareEmitClause() {
    if (this.currentClause) {
      this.emitClause({ byValue: this.currentClause });
    }
  }

  updateSteps(nSteps: number) {
    if (this.selectedDataType === 'BOOLEAN' && nSteps !== 2) {
      throw new MoviciError('Invalid steps for boolean');
    }

    this.processStepCount({ nSteps });
  }

  processStepCount(params?: { nSteps?: number; forceRecalculateValues?: boolean }) {
    const newSteps = params?.nSteps ?? this.nSteps;
    this.icons = recalculateMapping(
      {
        values: this.mappingValues,
        output: this.iconValues,
        interpolateOutput: false,
        nSteps: newSteps,
        minValue: params?.forceRecalculateValues ? this.minValue : this.currentMinValue,
        maxValue: params?.forceRecalculateValues ? this.maxValue : this.currentMaxValue,
        maxValueAsLastValue: true,
        forceRecalculateValues: params?.forceRecalculateValues
      },
      () => this.firstIcon
    );

    this.nSteps = newSteps;
  }

  resetByDataType(dataType: string) {
    if (this.isEnum) dataType = 'ENUM'; // overriding ENUMS

    switch (dataType) {
      case 'BOOLEAN':
        this.processStepCount({ nSteps: 2 });
        break;
      case 'ENUM':
        this.processStepCount({
          nSteps: this.entityEnums?.length ?? 2,
          forceRecalculateValues: true
        });
        break;
      case 'INT':
      case 'DOUBLE':
      default:
        this.resetValues();
        break;
    }
    this.resetIcons();
  }

  resetIcons() {
    this.icons = this.icons.map(icon => [icon[0], icon[1] ? icon[1] : this.firstIcon]);
  }

  resetValues() {
    this.processStepCount({ forceRecalculateValues: true });
  }

  interpolateMinMax() {
    this.icons = recalculateMapping(
      {
        output: this.iconValues,
        values: this.mappingValues,
        nSteps: this.nSteps,
        minValue: this.currentMinValue,
        maxValue: this.currentMaxValue,
        maxValueAsLastValue: true,
        forceRecalculateValues: true
      },
      () => this.firstIcon
    );
  }

  mounted() {
    // this.setupValidator();
    this.initializeValue(this.value?.byValue);
  }

  initializeValue(val?: ByValueIconClause) {
    if (!val || isEmpty(val)) {
      this.setClause(BY_VALUE_DEFAULT_ICON);
      if (this.selectedEntityProp) {
        this.resetByDataType(this.selectedEntityProp?.data_type);
      }
    } else {
      this.setClause(val);
    }
  }

  setClause(val: ByValueIconClause) {
    this.icons = val.icons;
  }

  beforeDestroy() {
    if (this.validator) {
      this.destroyValidator();
    }
  }
}
</script>

<style scoped lang="scss"></style>
