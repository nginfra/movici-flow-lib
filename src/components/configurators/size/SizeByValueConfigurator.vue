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
        <div v-if="selectedDataType !== 'BOOLEAN'">
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
    <div v-if="selectedEntityProp" class="columns mb-0 is-multiline">
      <div class="column pb-0 is-two-thirds-desktop is-full-tablet">
        <div class="is-flex min-max">
          <div class="values is-flex is-flex-shrink-1 is-flex-direction-column">
            <div class="is-flex">
              <b-field :label="$t('flow.visualization.sizeConfig.value')">
                <b-numberinput
                  v-model="currentMaxValue"
                  :controls="false"
                  :min-step="1e-15"
                  step="1"
                  size="is-small"
                />
                <b-icon class="mx-2" icon="angle-right" pack="far" size="is-small"></b-icon>
              </b-field>
              <b-field :label="$t('flow.visualization.sizeConfig.size') + ' (' + miniUnits + ')'">
                <b-numberinput
                  v-model="currentMaxSize"
                  :controls="false"
                  :min-step="1e-15"
                  step="1"
                  size="is-small"
                />
              </b-field>
            </div>
            <div class="is-flex">
              <b-field>
                <b-numberinput
                  v-model="currentMinValue"
                  :controls="false"
                  :min-step="1e-15"
                  step="1"
                  size="is-small"
                />
                <b-icon class="mx-2" icon="angle-right" pack="far" size="is-small"></b-icon>
              </b-field>
              <b-field>
                <b-numberinput
                  v-model="currentMinSize"
                  :controls="false"
                  :min-step="1e-15"
                  step="1"
                  size="is-small"
                />
              </b-field>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline" v-if="units === 'meters'">
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
import cloneDeep from 'lodash/cloneDeep';
import ByValueMixin from '../ByValueMixin';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { BY_VALUE_DEFAULT_SIZES } from './defaults';

@Component({
  name: 'SizeByValueConfigurator',
  components: {
    AttributeSelector
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
  minPixels!: number | undefined;
  maxPixels!: number | undefined;

  get currentClause(): ByValueSizeClause | null {
    if (!this.selectedEntityProp) return null;
    return {
      attribute: this.selectedEntityProp,
      sizes: this.sizes,
      units: this.units,
      minPixels: this.minPixels,
      maxPixels: this.maxPixels
    };
  }

  get currentMinValue() {
    return this.currentClause?.sizes[0]?.[0];
  }

  set currentMinValue(val: number | undefined) {
    if (val) this.updateMapping(0, 0, val);
  }

  get currentMaxValue() {
    return this.currentClause?.sizes[1]?.[0];
  }

  set currentMaxValue(val: number | undefined) {
    if (val) this.updateMapping(1, 0, val);
  }

  get currentMinSize() {
    return this.currentClause?.sizes[0]?.[1];
  }

  set currentMinSize(val: number | undefined) {
    if (val) this.updateMapping(0, 1, val);
  }

  get currentMaxSize() {
    return this.currentClause?.sizes[1]?.[1];
  }

  set currentMaxSize(val: number | undefined) {
    if (val) this.updateMapping(1, 1, val);
  }

  get miniUnits() {
    switch (this.currentClause?.units) {
      case 'meters':
        return 'm';
      case 'pixels':
        return 'px';
      default:
        return '';
    }
  }

  get defaults() {
    return BY_VALUE_DEFAULT_SIZES[this.geometry];
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);

      if (this.currentMaxValue !== this.maxValue) {
        this.currentMaxValue = this.maxValue;
      }

      if (this.currentMinValue !== this.minValue) {
        this.currentMinValue = this.minValue;
      }
    }
  }

  @Watch('currentClause')
  prepareEmitClause() {
    if (this.currentClause) {
      this.emitClause({ byValue: this.currentClause });
    }
  }

  updateMapping(i: number, j: number, value: number) {
    const sizes = cloneDeep(this.sizes);
    sizes[i][j] = value;
    this.sizes = sizes;
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

    const localValue: ByValueSizeClause = Object.assign({}, this.defaults, this.value.byValue);

    this.minPixels = localValue?.minPixels;
    this.maxPixels = localValue?.maxPixels;
    this.sizes = localValue.sizes ?? [];
    this.units = localValue.units;
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
  .label {
    height: 1.25rem;
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
