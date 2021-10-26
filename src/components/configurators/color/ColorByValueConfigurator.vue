<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field required v-if="selectedEntityProp" :label="$t('flow.visualization.basedOn')">
          <b-select
            :value="selectedEntityProp.name"
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
      <div class="column is-one-third-desktop is-full-tablet">
        <slot name="legend-title" />
      </div>
    </div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <div v-if="selectedEntityProp && selectedDataType !== 'BOOLEAN'">
          <b-field class="fill-type">
            <b-radio class="mr-4" v-model="fillType" native-value="buckets" size="is-small">
              {{ $t('flow.visualization.colorConfig.buckets') }}
            </b-radio>
            <b-radio v-model="fillType" native-value="gradient" size="is-small">
              {{ $t('flow.visualization.colorConfig.gradient') }}
            </b-radio>
          </b-field>
          <div class="steps mt-3 is-flex is-flex-direction-row">
            <b-field class="is-flex-shrink-1" :label="$t('flow.visualization.colorConfig.steps')">
              <b-select :value="colorMapping.length" @input="updateSteps" size="is-small" expanded>
                <option v-for="index in 8" :key="index" :value="index">{{ index }}</option>
              </b-select>
            </b-field>
            <b-field class="is-flex-grow-1 ml-2" :label="$t('flow.visualization.colorConfig.type')">
              <b-select v-model="selectedColorType" size="is-small" expanded>
                <option v-for="(type, index) in colorTypes" :key="index" :value="type">
                  {{ type }}
                </option>
              </b-select>
            </b-field>
            <b-field
              class="is-flex-grow-1 ml-2"
              :label="$t('flow.visualization.colorConfig.palette')"
            >
              <b-dropdown
                :value="selectedColorPaletteIndex"
                @input="selectColorPalette"
                class="select is-small"
                aria-role="list"
                expanded
              >
                <template #trigger>
                  <span class="color-option">
                    <b-tooltip
                      type="is-black"
                      position="is-right"
                      :label="colorPalettesFiltered[selectedColorPaletteIndex].name"
                    >
                      <span
                        class="color-piece is-size-7"
                        v-for="(color, index) in colorPalettesFiltered[
                          selectedColorPaletteIndex
                        ].getHexColorsForSize(nSteps)"
                        :style="{ 'background-color': color }"
                        :key="index"
                      ></span>
                    </b-tooltip>
                  </span>
                </template>
                <b-dropdown-item
                  class="color-option"
                  v-for="(item, index) in colorPalettesFiltered"
                  :value="index"
                  :key="index"
                  :focusable="false"
                  aria-role="listitem"
                >
                  <b-tooltip type="is-black" position="is-right" :label="item.name">
                    <span
                      class="color-piece"
                      v-for="(color, index) in item.getHexColorsForSize(nSteps)"
                      :style="{ 'background-color': color }"
                      :key="index"
                    ></span>
                  </b-tooltip>
                </b-dropdown-item>
              </b-dropdown>
            </b-field>
          </div>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline">
      <div class="column py-0 is-two-thirds-desktop is-full-tablet">
        <ByValueColorList
          v-if="colorMapping.length"
          v-model="colorMapping"
          :mode="colorMode"
          :presets="colorPickerPresets"
          :min-value="minValue"
          :max-value.sync="currentMaxValue"
          reversed
        />
      </div>
      <div class="column py-0 is-one-third-desktop is-full-tablet">
        <slot name="legend-labels" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import { hexToColorTriple, MoviciColors } from '@/flow/visualizers/maps/colorMaps';
import {
  ByValueColorClause,
  ColorMapping,
  PropertySummary,
  PropertyType,
  RGBAColor
} from '@/flow/types';
import CustomSelect from '@/flow/components/global/CustomSelect.vue';
import ValidationProvider from '@/flow/mixins/ValidationProvider';
import ByValueColorList from '@/flow/components/configurators/color/ByValueColorList.vue';
import ColorPalettes, { DEFAULT_COLOR_PALETTES } from './colorPalettes';
import { recalculateColorMapping } from '@/flow/components/configurators/helpers';

interface RecalculateColorsParams {
  colors?: RGBAColor[];
  values?: number[];
  nSteps?: number;
  forceRecalculateValues?: boolean;
}

@Component({
  components: {
    CustomSelect,
    ByValueColorList
  }
})
export default class ColorByValueConfigurator extends Mixins(ValidationProvider) {
  @Prop([Object]) value?: Partial<ByValueColorClause>;
  @Prop({ default: () => [] }) entityProps!: PropertySummary[];

  colorMapping: ColorMapping = [];
  nSteps = 4;
  selectedEntityProp: PropertySummary | null = null;
  attributeFromValue: PropertyType | null = null;
  colorPickerPresets = Object.values(MoviciColors);
  fillType: 'buckets' | 'gradient' = 'buckets';
  colorTypes: string[] = Object.keys(DEFAULT_COLOR_PALETTES);
  selectedColorPaletteIndex = 0;
  selectedColorType: keyof typeof DEFAULT_COLOR_PALETTES = 'Sequential';
  currentMaxValue = 1;

  get mappingValues(): number[] {
    return this.colorMapping.map(val => val[0]);
  }

  get colors(): RGBAColor[] {
    return this.colorMapping.map(val => val[1]);
  }

  get filteredEntityProps() {
    return this.entityProps.filter(prop => {
      return (
        prop.data_type === 'BOOLEAN' || prop.data_type === 'INT' || prop.data_type === 'DOUBLE'
      );
    });
  }

  get selectedDataType() {
    return this.selectedEntityProp?.data_type;
  }

  get selectedColorPalette(): string[] {
    return this.colorPalettesFiltered[this.selectedColorPaletteIndex].getHexColorsForSize(
      this.nSteps
    );
  }

  get colorPalettesFiltered(): ColorPalettes[] {
    return this.colorPalettes.filter(palette => palette.colorsForSize[this.nSteps]);
  }

  get colorPalettes(): ColorPalettes[] {
    return DEFAULT_COLOR_PALETTES[this.selectedColorType];
  }

  get colorMode(): 'buckets' | 'gradient' | 'boolean' {
    return this.selectedDataType === 'BOOLEAN' ? 'boolean' : this.fillType;
  }

  get colorClause(): ByValueColorClause | null {
    if (this.selectedEntityProp) {
      return {
        type: this.fillType,
        attribute: this.selectedEntityProp,
        colors: this.colorMapping,
        undefinedColor: hexToColorTriple('#000000'),
        specialColor: hexToColorTriple('#FFFFFF'),
        maxValue: this.currentMaxValue
      };
    }
    return null;
  }

  get minValue() {
    return this.selectedEntityProp?.min_val ?? 0;
  }

  get maxValue() {
    return this.selectedEntityProp?.max_val ?? 1;
  }

  get currentMinValue() {
    return this.mappingValues[0] ?? this.minValue;
  }

  filterProp(prop: PropertyType) {
    return ['BOOLEAN', 'INT', 'DOUBLE'].indexOf(prop.data_type) !== -1;
  }
  selectColorPalette(index: number) {
    this.selectedColorPaletteIndex = index;
    this.recalculateColorMapping({
      colors: this.selectedColorPalette.map(hexColor => hexToColorTriple(hexColor))
    });
  }

  selectEntityPropName(name: string) {
    const found = this.filteredEntityProps.find(entityProp => name === entityProp.name);
    if (found) this.selectedEntityProp = found;
  }

  updateSteps(nSteps: number) {
    this.nSteps = nSteps;
    this.recalculateColorMapping({
      colors: this.selectedColorPalette.map(hexColor => hexToColorTriple(hexColor))
    });
  }

  @Watch('nSteps')
  updateColorSteps(nSteps: number) {
    this.recalculateColorMapping({ nSteps });
  }

  @Watch('selectedEntityProp')
  updateMaxValue(currentVal: PropertyType, prevVal?: PropertyType | null) {
    if (!prevVal) {
      return;
    }
    if (this.currentMaxValue !== this.maxValue) {
      this.currentMaxValue = this.maxValue;
      this.recalculateColorMapping({ forceRecalculateValues: true });
    }
  }

  @Watch('filteredEntityProps')
  pickSelectedEntityProp() {
    this.selectedEntityProp =
      this.filteredEntityProps.find(attr => {
        return (
          attr.component == this.attributeFromValue?.component &&
          attr.name == this.attributeFromValue?.name
        );
      }) ??
      this.filteredEntityProps[0] ??
      null;
  }
  // resets to the first of the sequential palettes with nSteps
  resetColorMapping(nSteps: number) {
    this.selectedColorType = 'Sequential';
    this.nSteps = nSteps;
    this.selectColorPalette(0);
  }

  recalculateColorMapping(params?: RecalculateColorsParams) {
    this.colorMapping = recalculateColorMapping({
      colors: params?.colors ?? this.colors,
      values: params?.values ?? this.mappingValues,
      nSteps: params?.nSteps ?? this.nSteps,
      minValue: params?.forceRecalculateValues ? this.minValue : this.currentMinValue,
      maxValue: params?.forceRecalculateValues ? this.maxValue : this.currentMaxValue,
      maxValueAsLastValue: this.colorMode !== 'buckets',
      forceRecalculateValues: params?.forceRecalculateValues
    });
  }

  @Watch('colorClause')
  emitClause() {
    if (this.selectedEntityProp) {
      this.$emit('input', { byValue: this.colorClause });
    }
  }

  @Watch('selectedColorType')
  afterSelectedColorType() {
    this.selectColorPalette(0);
  }

  @Watch('selectedDataType')
  onDataTypeChange(dataType?: string, prevDataType?: string) {
    if (!prevDataType) {
      return;
    }
    switch (dataType) {
      case 'BOOLEAN':
        this.nSteps = 2;
        this.selectedColorType = 'Diverging';
        this.selectedColorPaletteIndex = 0;
        this.fillType = 'buckets';
        this.recalculateColorMapping({
          colors: DEFAULT_COLOR_PALETTES['Diverging'][0].getColorTriplesForSize(2),
          forceRecalculateValues: true
        });
        break;
      case 'INT':
      case 'DOUBLE':
        if (prevDataType === 'INT' || prevDataType === 'DOUBLE') break;
        this.resetColorMapping(4);
        break;
    }
  }

  // TODO: create validator according to color length
  setupValidator() {}

  mounted() {
    const localValue: ByValueColorClause = Object.assign(
      {
        type: 'buckets',
        attribute: this.filteredEntityProps[0] ?? null,
        colors: []
      },
      this.value
    );

    this.attributeFromValue = localValue.attribute ?? null;
    this.pickSelectedEntityProp();
    this.currentMaxValue = localValue.maxValue ?? this.maxValue;
    this.fillType = localValue.type;
    if (!localValue.colors.length) {
      this.resetColorMapping(4);
    } else {
      this.nSteps = localValue.colors.length;
      this.colorMapping = localValue.colors;
    }

    this.setupValidator();
  }
}
</script>

<style scoped lang="scss">
::v-deep {
  .dropdown {
    &.is-active {
      border-color: $primary;
      box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
    }
    .dropdown-trigger {
      @include border-radius;
      cursor: pointer;
      border: 2px solid $white-ter;
      line-height: unset;
      background-color: $white;
      user-select: none;
      .color-option {
        .tooltip-trigger {
          padding: 10px 20px 10px 0 !important;
        }
      }
      &:hover {
        border-color: $grey-light;
        &::after {
          border-color: $grey-darker;
        }
      }
    }

    .color-option {
      display: block;
      line-height: 6px;
      text-align: center;
      height: 28px;
      padding: 0;

      .b-tooltip {
        width: 100%;
        height: 28px;
        .tooltip-content {
          line-height: initial !important;
        }
        .tooltip-trigger {
          padding: 10px 0;
        }
      }
      &.is-active {
        background-color: unset;
      }
      span.color-piece {
        height: 8px;
        width: 16px;
        display: inline-block;
      }
    }
  }
}
</style>
