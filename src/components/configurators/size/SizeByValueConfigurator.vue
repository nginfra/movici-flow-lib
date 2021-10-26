<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field required :label="$t('flow.visualization.basedOn')">
          <b-select
            :value="selectedEntityPropName"
            @input="selectEntityPropName"
            placeholder="Select..."
            size="is-small"
            expanded
          >
            <option
              v-for="(prop, index) in entityProps"
              :disabled="!filterProp(prop)"
              :class="{ 'attribute-option-disabled': !filterProp(prop) }"
              :value="prop.name"
              :key="index"
              :title="prop.description"
            >
              {{ prop.name }}
            </option>
          </b-select>
        </b-field>
      </div>
    </div>
    <div v-if="value" class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <div v-if="selectedEntityProp && selectedDataType !== 'BOOLEAN'">
          <b-field :label="$t('flow.visualization.displayAs')">
            <b-radio
              :value="currentClause.units"
              @input="updateValue({ units: $event })"
              native-value="meters"
              size="is-small"
              class="mr-4"
            >
              {{ $t('units.meters') }}
            </b-radio>
            <b-radio
              :value="currentClause.units"
              @input="updateValue({ units: $event })"
              native-value="pixels"
              size="is-small"
            >
              {{ $t('units.pixels') }}
            </b-radio>
          </b-field>
        </div>
      </div>
    </div>
    <!-- todo: change to look closer to color configurator -->
    <div v-if="value" class="columns mb-0 is-multiline">
      <div class="column pb-0 is-two-thirds-desktop is-full-tablet">
        <div class="is-flex min-max">
          <div class="values is-flex is-flex-shrink-1 is-flex-direction-column">
            <div class="is-flex">
              <b-field :label="$t('flow.visualization.sizeConfig.value')">
                <b-numberinput
                  v-model="currentMaxVal"
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
                  v-model="currentMinVal"
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
    <div class="columns mb-0 is-multiline" v-if="currentClause.units === 'meters'">
      <div class="column pb-0 is-flex is-two-thirds-desktop is-full-tablet min-max-px">
        <b-field class="mr-4" :label="$t('flow.visualization.sizeConfig.minPixels')">
          <b-numberinput
            :value="currentClause.minPixels"
            @input="updateValue({ minPixels: Number($event) })"
            :controls="false"
            size="is-small"
          />
          <span class="ml-2 is-size-7">px</span>
        </b-field>
        <b-field :label="$t('flow.visualization.sizeConfig.maxPixels')">
          <b-numberinput
            :value="currentClause.maxPixels"
            @input="updateValue({ maxPixels: Number($event) })"
            :controls="false"
            size="is-small"
          /><span class="ml-2 is-size-7">px</span>
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { ByValueSizeClause, PropertySummary, PropertyType, SizeClause } from '@/flow/types';
import ValidationProvider from '@/flow/mixins/ValidationProvider';
import { DIMENSIONS } from '@/flow/visualizers/visualizers';
import cloneDeep from 'lodash/cloneDeep';

@Component({})
export default class SizeByValueConfigurator extends Mixins(ValidationProvider) {
  @Prop([Object]) value?: SizeClause | null;
  @Prop({ default: () => [] }) entityProps!: PropertySummary[];
  selectedEntityProp: PropertySummary | null = null;
  attributeFromValue: PropertyType | null = null;

  get filteredEntityProps() {
    return this.entityProps.filter(prop => {
      return (
        prop.data_type === 'BOOLEAN' || prop.data_type === 'INT' || prop.data_type === 'DOUBLE'
      );
    });
  }

  get selectedEntityPropName() {
    return this.selectedEntityProp?.name;
  }

  get minValue() {
    return this.selectedEntityProp?.min_val ?? 0;
  }

  get maxValue() {
    return this.selectedEntityProp?.max_val ?? 1;
  }

  get currentClause(): ByValueSizeClause {
    return Object.assign({}, this.defaults(), this.value?.byValue);
  }

  get currentMinVal() {
    return this.currentClause.sizes[0][0];
  }

  set currentMinVal(val: number) {
    this.updateMapping(0, 0, val);
  }

  get currentMaxVal() {
    return this.currentClause.sizes[1][0];
  }

  set currentMaxVal(val: number) {
    this.updateMapping(1, 0, val);
  }

  get currentMinSize() {
    return this.currentClause.sizes[0][1];
  }

  set currentMinSize(val: number) {
    this.updateMapping(0, 1, val);
  }

  get currentMaxSize() {
    return this.currentClause.sizes[1][1];
  }

  set currentMaxSize(val: number) {
    this.updateMapping(1, 1, val);
  }

  getSizesMinMaxValues(): [number, number][] {
    return [
      [this.selectedEntityProp?.min_val ?? 0, this.currentMinSize],
      [this.selectedEntityProp?.max_val ?? 1, this.currentMaxSize]
    ];
  }

  filterProp(prop: PropertyType) {
    return ['BOOLEAN', 'INT', 'DOUBLE'].indexOf(prop.data_type) !== -1;
  }

  get miniUnits() {
    switch (this.currentClause.units) {
      case 'meters':
        return 'm';
      case 'pixels':
        return 'px';
      default:
        return '';
    }
  }

  get selectedDataType() {
    return this.selectedEntityProp?.data_type;
  }

  @Watch('filteredEntityProps', { immediate: true })
  pickSelectedEntityProp() {
    let attribute = this.filteredEntityProps.find(attr => {
      return (
        attr.component == this.attributeFromValue?.component &&
        attr.name == this.attributeFromValue?.name
      );
    });

    if (attribute) {
      this.selectedEntityProp = attribute ?? null;
    } else {
      // if attribute can't be found, this means this is a new config
      // so we use the first one and use it's min max
      this.setEntityPropAndUpdate(this.filteredEntityProps[0]);
    }
  }

  selectEntityPropName(name: string) {
    this.setEntityPropAndUpdate(
      this.filteredEntityProps.find(entityProp => name === entityProp.name)
    );
  }

  setEntityPropAndUpdate(attribute?: PropertySummary) {
    if (attribute) {
      this.selectedEntityProp = attribute;
      this.updateValue({ attribute, sizes: this.getSizesMinMaxValues() });
    }
  }

  updateValue(props: Partial<ByValueSizeClause>) {
    // check for this.value (is it a valid object?)
    if (this.selectedEntityProp) {
      const clause = Object.assign({}, this.currentClause, props);

      if (clause.units === 'pixels') {
        delete clause.minPixels;
        delete clause.maxPixels;
      }
      this.$emit('input', { byValue: clause });
    }
  }

  updateMapping(i: number, j: number, value: number) {
    const sizes = cloneDeep(this.currentClause.sizes);
    sizes[i][j] = value;
    this.updateValue({ sizes });
  }

  defaults() {
    return {
      sizes: [
        [2, 2],
        [5, 5]
      ],
      units: 'pixels',
      minPixels: DIMENSIONS.SIZE_MIN_PIXELS,
      maxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
      attribute: null
    };
  }

  // TODO: create validator according to color length
  // check for attribute
  // check for units
  // values should be increasing
  // sizes should not negative
  // min max px should be not negative
  setupValidator() {}

  mounted() {
    this.attributeFromValue = this.value?.byValue?.attribute ?? null;
    this.setupValidator();
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
      width: 3.5rem;
    }
    .field {
      .field {
        align-items: center;
      }
    }
  }
}
</style>
