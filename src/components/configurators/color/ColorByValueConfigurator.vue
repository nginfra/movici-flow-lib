<template>
  <div v-if="selectedEntityProp">
    <div class="columns mb-0 is-multiline">
      <div class="column is-full">
        <div>
          <b-field class="fill-type">
            <b-radio
              class="mr-4"
              v-model="fillType"
              native-value="buckets"
              size="is-small"
              :disabled="isBooleanOrEnum"
            >
              {{ $t('flow.visualization.colorConfig.buckets') }}
            </b-radio>
            <b-radio
              v-model="fillType"
              native-value="gradient"
              size="is-small"
              :disabled="isBooleanOrEnum"
            >
              {{ $t('flow.visualization.colorConfig.gradient') }}
            </b-radio>
          </b-field>
          <div class="steps is-flex is-flex-direction-row">
            <b-field class="is-flex-shrink-1" :label="$t('flow.visualization.colorConfig.steps')">
              <b-select
                :value="colorMapping.length"
                @input="updateSteps"
                size="is-small"
                expanded
                :disabled="isBooleanOrEnum"
              >
                <option v-for="index in stepArray" :key="index" :value="index">
                  {{ index }}
                </option>
              </b-select>
            </b-field>
            <b-field class="is-flex-grow-1 ml-2" :label="$t('flow.visualization.colorConfig.type')">
              <b-select
                :value="selectedColorType"
                @input="selectColorType"
                size="is-small"
                expanded
              >
                <option v-for="(type, index) in colorTypes" :key="index" :value="type">
                  {{ type }}
                </option>
              </b-select>
            </b-field>
            <ColorPaletteSelector
              v-if="colorPalettesFiltered.length"
              :value="selectedColorPaletteIndex"
              :colorPalettes="colorPalettesFiltered"
              :nSteps="nSteps"
              @input="selectColorPalette"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline">
      <div class="column py-0 is-two-thirds-desktop">
        <ByValueColorList
          v-if="colorMapping.length"
          v-model="colorMapping"
          :mode="colorMode"
          :presets="colorPickerPresets"
          :min-value="minValue"
          :max-value.sync="currentMaxValue"
          :dataType="selectedEntityProp.data_type"
          :entityEnums="entityEnums"
          @resetValues="resetValues"
          @interpolateMinMax="interpolateMinMax"
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
import { hexToColorTriple, MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import {
  ByValueColorClause,
  ColorClause,
  ColorMapping,
  PropertySummary,
  RGBAColor
} from '@movici-flow-common/types';
import ByValueColorList from './ByValueColorList.vue';
import { recalculateMapping, RecalculateMappingParams } from '../../configurators/helpers';
import ColorPaletteSelector from './ColorPaletteSelector.vue';
import ColorPalettes, { DEFAULT_COLOR_PALETTES } from './colorPalettes';
import ByValueMixin from '../ByValueMixin';
import { MoviciError } from '@movici-flow-common/errors';
import range from 'lodash/range';

interface InitialOptions {
  allowedPropertyTypes: string[];
  selectedColorType: keyof typeof DEFAULT_COLOR_PALETTES;
  nSteps: number;
}

@Component({
  name: 'ColorByValueConfigurator',
  components: {
    ByValueColorList,
    ColorPaletteSelector
  }
})
export default class ColorByValueConfigurator extends Mixins<ByValueMixin<ColorClause>>(
  ByValueMixin
) {
  @Prop({ type: Object }) readonly initialOpts?: InitialOptions;
  @Prop({ type: Object }) declare selectedEntityProp: PropertySummary | null;
  selectedColorType: keyof typeof DEFAULT_COLOR_PALETTES = 'Sequential';
  colorMapping: ColorMapping = [];
  colorPickerPresets = Object.values(MoviciColors);
  fillType: 'buckets' | 'gradient' = 'buckets';
  colorTypes: string[] = Object.keys(DEFAULT_COLOR_PALETTES);
  selectedColorPaletteIndex = 0;
  currentMaxValue = 1;
  nSteps = 4;

  get stepArray() {
    return range(2, this.selectedColorPaletteLength + 2);
  }

  get mappingValues(): number[] {
    return this.colorMapping.map(val => val[0]);
  }

  get colors(): RGBAColor[] {
    return this.colorMapping.map(val => val[1]);
  }

  get selectedColorPalette(): string[] {
    return this.colorPalettes[this.selectedColorPaletteIndex].getHexColorsForSize(this.nSteps);
  }

  get selectedColorPaletteLength() {
    return Object.keys(this.colorPalettes[this.selectedColorPaletteIndex].colorsForSize).length;
  }

  get colorPalettes(): ColorPalettes[] {
    return DEFAULT_COLOR_PALETTES[this.selectedColorType];
  }

  get colorMode(): 'buckets' | 'gradient' | 'boolean' {
    return this.selectedDataType === 'BOOLEAN' ? 'boolean' : this.fillType;
  }

  get currentClause(): ByValueColorClause | null {
    if (!this.selectedEntityProp) return null;

    return {
      type: this.fillType,
      attribute: this.selectedEntityProp,
      colors: this.colorMapping,
      maxValue: this.currentMaxValue
    };
  }

  get colorPalettesFiltered(): ColorPalettes[] {
    return this.colorPalettes?.filter(palette => palette.colorsForSize[this.nSteps]);
  }

  get currentMinValue() {
    return this.mappingValues[0] ?? this.minValue;
  }

  get entityEnums() {
    return this.summary?.general?.enum?.[this.selectedEntityProp?.enum_name ?? ''] ?? null;
  }

  get isEnum() {
    return !!this.entityEnums;
  }

  get defaults() {
    return {
      type: 'buckets',
      attribute: null,
      colors: []
    };
  }

  get isBooleanOrEnum() {
    return this.selectedDataType === 'BOOLEAN' || this.isEnum;
  }

  selectColorPalette(index: number) {
    this.selectedColorPaletteIndex = index;
    this.recalculateColorMapping({
      output: this.selectedColorPalette.map(hexColor => hexToColorTriple(hexColor))
    });
  }

  updateSteps(nSteps: number) {
    if (this.selectedDataType === 'BOOLEAN' && nSteps !== 2) {
      throw new MoviciError('Invalid steps for boolean');
    }

    this.nSteps = nSteps;
    this.recalculateColorMapping({
      nSteps,
      output: this.selectedColorPalette.map(hexColor => hexToColorTriple(hexColor))
    });
  }

  @Watch('selectedEntityProp')
  afterSelectedEntityProp(val: PropertySummary | null) {
    /**
     * STATE: TOUCHED DEFINED RESET VALID CLAUSE
     * When the user selects and attribute, this function is fired.
     * We set the selectedEntityProp (aka attribute) with this.ensureProp
     * After that we can reset it to show the default UI config for that
     * data_type, like an ENUM, BOOLEAN, INT or DOUBLE.
     * This state is achievable from both UNTOUCHED NULL CLAUSE and
     * UNTOUCHED DEFINED VALID CLAUSE. After that it only may become
     * TOUCHED INVALID CLAUSE if the user inputs invalid data.
     */
    if (val) {
      this.resetByDataType(val.data_type);

      if (this.currentMaxValue !== this.maxValue) {
        this.currentMaxValue = this.maxValue;
      }
    }
  }

  resetValues() {
    this.currentMaxValue = this.maxValue;
    this.recalculateColorMapping({ forceRecalculateValues: true });
  }

  resetColorMapping(nSteps: number) {
    this.nSteps = nSteps;
    // resets to the first of the sequential palettes with nSteps
    this.selectColorPalette(0);
  }

  recalculateColorMapping(params?: Partial<RecalculateMappingParams<RGBAColor>>) {
    this.colorMapping = recalculateMapping(
      {
        output: params?.output ?? this.colors,
        values: params?.values ?? this.mappingValues,
        nSteps: params?.nSteps ?? this.nSteps,
        minValue: params?.forceRecalculateValues ? this.minValue : this.currentMinValue,
        maxValue: params?.forceRecalculateValues ? this.maxValue : this.currentMaxValue,
        maxValueAsLastValue: this.colorMode !== 'buckets',
        forceRecalculateValues: !!params?.forceRecalculateValues
      },
      () => hexToColorTriple(MoviciColors.WHITE)
    );
  }

  interpolateMinMax() {
    this.colorMapping = recalculateMapping(
      {
        output: this.colors,
        values: this.mappingValues,
        nSteps: this.nSteps,
        minValue: this.currentMinValue,
        maxValue: this.currentMaxValue,
        maxValueAsLastValue: this.colorMode !== 'buckets',
        forceRecalculateValues: true
      },
      () => hexToColorTriple(MoviciColors.WHITE)
    );
  }

  @Watch('colorMapping')
  afterColorMapping() {
    this.nSteps = this.colorMapping.length;
  }

  @Watch('currentClause')
  prepareEmitClause() {
    if (this.currentClause) {
      this.emitClause({ byValue: this.currentClause });
    }
  }

  selectColorType(val: string) {
    this.selectedColorType = val;
    this.selectColorPalette(0);
  }

  resetByDataType(dataType: string) {
    this.resetColorMapping(this.defaultDataTypeSteps);

    if (this.isEnum) dataType = 'ENUM'; // overriding ENUMS

    switch (dataType) {
      case 'BOOLEAN':
        this.selectedColorType = 'Diverging';
        this.selectedColorPaletteIndex = 0;
        this.fillType = 'buckets';
        this.recalculateColorMapping({
          output:
            DEFAULT_COLOR_PALETTES[this.selectedColorType][
              this.selectedColorPaletteIndex
            ].getColorTriplesForSize(2),
          forceRecalculateValues: true
        });
        break;
      case 'ENUM':
        this.selectedColorType = 'Qualitative';
        this.selectedColorPaletteIndex = 0;
        this.fillType = 'buckets';
        this.nSteps = this.entityEnums?.length ?? 0;
        this.colorMapping = recalculateMapping(
          {
            values: [...Array(this.nSteps).keys()], // creates and array filled with [0, 1, 2, ..., this.nSteps]
            output: DEFAULT_COLOR_PALETTES[this.selectedColorType][
              this.selectedColorPaletteIndex
            ].getColorTriplesForSize(this.nSteps),
            nSteps: this.nSteps,
            maxValueAsLastValue: true,
            forceRecalculateValues: true
          },
          () => hexToColorTriple(MoviciColors.WHITE)
        );
        break;
      case 'INT':
      case 'DOUBLE':
      default:
        this.resetValues();
        break;
    }
  }

  mounted() {
    if (this.initialOpts) {
      const { selectedColorType, nSteps } = this.initialOpts;
      this.selectedColorType = selectedColorType ?? this.selectedColorType;
      this.nSteps = nSteps ?? this.nSteps;
    }
    // STATE: READY

    const localValue: ByValueColorClause = Object.assign({}, this.defaults, this.value?.byValue);
    /**
     * STATE: UNTOUCHED NULL INVALID UNSET CLAUSE
     *
     * IF 'this.value.byValue === undefined';
     *   Here we have a brand new byValue configuration, byValue clause is undefined.
     *   Although we fill currentMaxValue and fillType, because localValue.attribute is null
     *   currentClause is also null. So after mount is done, this state has not changed
     *   So We must set up so that the user selects the attribute, we add the default config.
     *   After that the clause should behave like the it would be editing.
     *
     * IF this.value.byValue !== undefined
     *   Here we received a byValueColorClause. After setting fillType and currentMaxValue,
     *   the currentClause displays a value in this.pickSelectedEntityProp
     *   UI Setup is pretty much done after we set the nSteps and colorMapping.
     *   at this point the state is UNTOUCHED DEFINED VALID CLAUSE
     */

    this.currentMaxValue = localValue.maxValue ?? this.maxValue;
    this.fillType = localValue.type;

    if (localValue.colors.length) {
      this.nSteps = localValue.colors.length;
      this.colorMapping = localValue.colors;
    } else {
      this.resetColorMapping(this.defaultDataTypeSteps);
    }

    /**
     * IF 'this.value.byValue !== undefined';
     *   STATE: UNTOUCHED DEFINED VALID CLAUSE
     */
  }

  beforeDestroy() {
    if (this.validator) {
      this.destroyValidator();
    }
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
