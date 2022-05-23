<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field
          required
          :label="$t('flow.visualization.basedOn')"
          :message="errors['selectedEntityProp']"
          :type="{ 'is-danger': errors['selectedEntityProp'] }"
        >
          <AttributeSelector
            :value="selectedEntityProp"
            :entity-props="entityProps"
            :filter-prop="filterProp"
            @input="updateAttribute"
          />
        </b-field>
      </div>
    </div>
    <div v-if="selectedEntityProp" class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <div class="is-flex" v-if="selectedDataType !== 'BOOLEAN'">
          <b-field
            class="mr-4 is-flex-shrink-1"
            :label="$t('flow.visualization.colorConfig.steps')"
          >
            <b-select :value="sizes.length" @input="updateSteps" size="is-small" expanded>
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
      <div class="column py-0 is-two-thirds-desktop is-full-tablet" v-if="sizes && sizes.length">
        <ByValueSizeList
          v-if="sizes.length"
          v-model="sizes"
          :min-value="minValue"
          :max-value="maxValue"
          :units="units"
          :dataType="selectedEntityProp.data_type"
          @resetValues="resetValues"
          @interpolateMinMax="interpolateMinMax"
          reversed
        />
      </div>
    </div>
    <div class="columns mt-2 mb-0 is-multiline" v-if="units === 'meters'">
      <div class="column pb-0 is-flex is-two-thirds-desktop is-full-tablet min-max-px">
        <b-field class="mr-4" :label="$t('flow.visualization.sizeConfig.minPixels')">
          <b-numberinput v-model="minPixels" :controls="false" size="is-small" />
        </b-field>
        <b-field :label="$t('flow.visualization.sizeConfig.maxPixels')">
          <b-numberinput v-model="maxPixels" :controls="false" size="is-small" />
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator';
import { ByValueSizeClause, PropertySummary, SizeClause } from '@movici-flow-common/types';
import ByValueMixin from '../ByValueMixin';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { BY_VALUE_DEFAULT_SIZES } from './defaults';
import ByValueSizeList from './ByValueSizeList.vue';
import { recalculateMapping, RecalculateMappingParams } from '../helpers';
import { MoviciError } from '@movici-flow-common/errors';

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
  // overrides ByValueMixin
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  // custom variables
  sizes: [number, number][] = [];
  units: 'pixels' | 'meters' = 'pixels';
  minPixels: number | null = null;
  maxPixels: number | null = null;
  nSteps = 2;
  stepArray: number[] = [2, 3, 4, 5, 6, 7, 8];

  get currentClause(): ByValueSizeClause | null {
    if (!this.selectedEntityProp) return null;

    const rv: ByValueSizeClause = {
      attribute: this.selectedEntityProp,
      sizes: this.sizes,
      units: this.units
    };

    return rv;
  }

  get currentMinValue() {
    return this.sizes[0][0];
  }

  get currentMaxValue() {
    return this.sizes[this.sizes.length - 1][0];
  }

  get defaults() {
    return BY_VALUE_DEFAULT_SIZES[this.geometry];
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
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

    this.nSteps = nSteps;
    this.recalculateSizeMapping({ nSteps });
  }

  recalculateSizeMapping(params?: Partial<RecalculateMappingParams<number>>) {
    this.sizes = recalculateMapping(
      {
        values: params?.values ? params.values : this.sizes.map(size => size[0]),
        output: params?.output ? params.output : this.sizes.map(size => size[1]),
        nSteps: params?.nSteps ?? this.nSteps,
        minValue: params?.forceRecalculateValues ? this.minValue : this.currentMinValue,
        maxValue: params?.forceRecalculateValues ? this.maxValue : this.currentMaxValue,
        maxValueAsLastValue: true,
        forceRecalculateValues: params?.forceRecalculateValues
      },
      () => 0
    );
  }

  interpolateMinMax() {
    this.sizes = recalculateMapping(
      {
        values: this.sizes.map(size => size[0]),
        output: this.sizes.map(size => size[1]),
        nSteps: this.nSteps,
        minValue: this.currentMinValue,
        maxValue: this.currentMaxValue,
        maxValueAsLastValue: true,
        forceRecalculateValues: true
      },
      () => 0
    );
  }

  resetByDataType(dataType: string) {
    this.nSteps = this.defaultDataTypeSteps;

    switch (dataType) {
      case 'BOOLEAN':
        this.recalculateSizeMapping({ nSteps: 2, forceRecalculateValues: true });
        break;
      case 'INT':
      case 'DOUBLE':
      default:
        this.resetValues();
        break;
    }
  }

  resetValues() {
    this.recalculateSizeMapping({ forceRecalculateValues: true });
  }

  // TODO: create validator according to color length
  // check for attribute
  // check for units
  // values should be increasing
  // sizes should not negative
  // min max px should be not negative
  setupValidator() {
    this.validator?.addModule({
      name: this.name,
      validators: {
        ...this.getAttributeValidator()
      },
      onValidate: e => (this.errors = e)
    });
  }

  mounted() {
    this.setupValidator();

    const localValue: ByValueSizeClause = Object.assign({}, this.defaults, this.value?.byValue);

    this.sizes = localValue.sizes;
    this.units = localValue.units;
    this.minPixels = localValue.minPixels ?? null;
    this.maxPixels = localValue.maxPixels ?? null;

    this.pickSelectedEntityProp(localValue.attribute);
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
