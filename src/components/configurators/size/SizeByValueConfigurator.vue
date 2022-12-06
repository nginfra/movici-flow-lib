<template>
  <div>
    <div v-if="selectedEntityProp && sizes" class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <div class="is-flex" v-if="selectedDataType !== 'BOOLEAN'">
          <b-field
            class="mr-4 is-flex-shrink-1"
            :label="$t('flow.visualization.colorConfig.steps')"
          >
            <b-select
              :value="sizes.length"
              @input="updateSteps"
              size="is-small"
              expanded
              :disabled="selectedDataType === 'BOOLEAN' || isEnum"
            >
              <option v-for="index in stepArray" :key="index" :value="index">{{ index }}</option>
            </b-select>
          </b-field>
          <b-field :label="$t('flow.visualization.displayAs')">
            <b-radio v-model="units" native-value="meters" size="is-small" class="mr-4">
              {{ $t('units.meters') }}
            </b-radio>
            <b-radio v-model="units" native-value="pixels" size="is-small">
              {{ $t('units.pixels') }}
            </b-radio>
          </b-field>
        </div>
      </div>
    </div>
    <!-- todo: change to look closer to color configurator -->
    <div v-if="value" class="columns mb-0 is-multiline">
      <div
        class="column py-0 is-two-thirds-desktop is-full-tablet"
        v-if="sizes && sizes.length && selectedEntityProp"
      >
        <ByValueSizeList
          v-model="sizes"
          :mode="mode"
          :min-value="minValue"
          :max-value="maxValue"
          :units="units"
          :dataType="selectedEntityProp.data_type"
          :entityEnums="entityEnums"
          @resetValues="resetValues"
          @interpolateMinMax="interpolateMinMax"
          reversed
        />
      </div>
    </div>
    <div class="columns mt-2 mb-0 is-multiline" v-if="units === 'meters'">
      <div class="column pb-0 is-flex is-two-thirds-desktop is-full-tablet min-max-px">
        <b-field
          class="mr-4 mb-0"
          :label="$t('flow.visualization.sizeConfig.minPixels')"
          :type="{ 'is-danger': errors['minPixels'] }"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <b-numberinput
              :value="minPixels"
              @input="validated('minPixels', $event)"
              :controls="false"
              size="is-small"
            />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </b-field>
        <b-field
          :label="$t('flow.visualization.sizeConfig.maxPixels')"
          :type="{ 'is-danger': errors['maxPixels'] }"
          :addons="false"
        >
          <span class="is-flex is-align-items-center">
            <b-numberinput
              :value="maxPixels"
              @input="validated('maxPixels', $event)"
              :controls="false"
              size="is-small"
            />
            <span class="ml-1 is-size-7">px</span>
          </span>
        </b-field>
      </div>
    </div>
    <div class="errors">
      <p
        class="has-text-danger is-size-7 mt-1"
        v-for="(error, key) in minMaxPixelErrors"
        :key="key"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { ByValueSizeClause, PropertySummary, SizeClause } from '@movici-flow-common/types';
import ByValueMixin from '../ByValueMixin';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { BY_VALUE_DEFAULT_SIZES } from './defaults';
import ByValueSizeList from './ByValueSizeList.vue';
import { recalculateMapping } from '../helpers';
import { MoviciError } from '@movici-flow-common/errors';
import { isPositive } from '@movici-flow-common/utils/FormValidator';
import { isEmpty, pick } from 'lodash';

@Component({
  name: 'SizeByValueConfigurator',
  components: {
    AttributeSelector,
    ByValueSizeList
  }
})
export default class SizeByValueConfigurator extends Mixins<ByValueMixin<SizeClause>>(
  ByValueMixin
) {
  @Prop({ type: Object, default: null }) declare selectedEntityProp: PropertySummary | null;
  sizes: [number, number][] = [];
  units: 'pixels' | 'meters' = 'pixels';
  minPixels: number | null = null;
  maxPixels: number | null = null;
  nSteps = 2;
  stepArray: number[] = [2, 3, 4, 5, 6, 7, 8];

  get mappingValues(): number[] {
    return this.sizes.map(val => val[0]);
  }

  get sizeValues(): number[] {
    return this.sizes.map(val => val[1]);
  }

  get defaultDataTypeSteps() {
    return 2;
  }

  get currentClause(): ByValueSizeClause | null {
    if (!this.selectedEntityProp) return null;

    const rv: ByValueSizeClause = {
      attribute: this.selectedEntityProp,
      sizes: this.sizes,
      units: this.units
    };
    if (this.minPixels !== null) {
      rv.minPixels = this.minPixels;
    }

    if (this.maxPixels !== null) {
      rv.maxPixels = this.maxPixels;
    }

    return rv;
  }

  get currentMinValue() {
    return this.sizes[0][0];
  }

  get currentMaxValue() {
    return this.sizes[this.sizes.length - 1][0];
  }

  get entityEnums() {
    return this.summary?.general?.enum?.[this.selectedEntityProp?.enum_name ?? ''] ?? null;
  }

  get isEnum() {
    return !!this.entityEnums;
  }

  get mode(): 'number' | 'boolean' {
    return this.selectedDataType === 'BOOLEAN' ? 'boolean' : 'number';
  }

  get defaults() {
    return BY_VALUE_DEFAULT_SIZES[this.geometry];
  }

  get minMaxPixelErrors() {
    return pick(this.errors, 'minPixels', 'maxPixels', 'minMaxPixels');
  }

  interpolateMinMax() {
    this.sizes = recalculateMapping(
      {
        values: this.mappingValues,
        output: this.sizeValues,
        nSteps: this.nSteps,
        minValue: this.currentMinValue,
        maxValue: this.currentMaxValue,
        maxValueAsLastValue: true,
        forceRecalculateValues: true
      },
      () => 0
    );
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
    this.sizes = recalculateMapping(
      {
        values: this.mappingValues,
        output: this.sizeValues,
        interpolateOutput: newSteps !== this.nSteps,
        nSteps: newSteps,
        minValue: params?.forceRecalculateValues ? this.minValue : this.currentMinValue,
        maxValue: params?.forceRecalculateValues ? this.maxValue : this.currentMaxValue,
        maxValueAsLastValue: true,
        forceRecalculateValues: params?.forceRecalculateValues
      },
      () => 0
    );
    this.nSteps = newSteps;
  }

  resetByDataType(dataType: string) {
    if (this.isEnum) dataType = 'ENUM'; // overriding ENUMS

    switch (dataType) {
      case 'BOOLEAN':
        this.processStepCount({ nSteps: 2, forceRecalculateValues: true });
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
  }

  resetValues() {
    this.processStepCount({ forceRecalculateValues: true });
  }

  // TODO: create validator according to color length
  // check for units
  // values should be increasing
  // sizes should not negative
  setupValidator() {
    this.validator?.configure({
      validators: {
        minPixels: () => {
          if (this.units === 'pixels') return;
          return isPositive(this.minPixels, 'Min size');
        },

        maxPixels: () => {
          if (this.units === 'pixels') return;
          return isPositive(this.maxPixels, 'Max size');
        },

        minMaxPixels: {
          depends: ['minPixels', 'maxPixels'],
          validator: () => {
            if (this.units === 'pixels') return;
            if (
              this.minPixels !== null &&
              this.maxPixels !== null &&
              this.minPixels > this.maxPixels
            )
              return 'Max size must be at least min size.';
          }
        }
      },
      onValidate: e => (this.errors = e)
    });
  }

  mounted() {
    this.setupValidator();
    this.initializeValue(this.value?.byValue);
  }

  initializeValue(val?: ByValueSizeClause) {
    if (!val || isEmpty(val)) {
      this.setClause(BY_VALUE_DEFAULT_SIZES[this.geometry]);
      if (this.selectedEntityProp) {
        this.resetByDataType(this.selectedEntityProp?.data_type);
      }
    } else {
      this.setClause(val);
    }
  }

  setClause(val: ByValueSizeClause) {
    this.sizes = val.sizes;
    this.units = val.units;
    this.minPixels = val.minPixels ?? null;
    this.maxPixels = val.maxPixels ?? null;
  }

  beforeDestroy() {
    if (this.validator) {
      this.destroyValidator();
    }
  }
}
</script>

<style scoped lang="scss">
.size,
.values {
  ::v-deep {
    .label {
      height: 1.25rem;
    }
  }
}
.min-max-px,
.min-max {
  ::v-deep {
    .b-numberinput {
      width: 4.5rem;
    }
    .field {
      .field {
        align-items: center;
      }
    }
  }
}
</style>
