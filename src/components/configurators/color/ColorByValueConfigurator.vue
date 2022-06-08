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
      <div class="column is-one-third-desktop is-full-tablet">
        <slot name="legend-title" />
      </div>
    </div>
    <div v-if="selectedEntityProp" class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <div v-if="selectedDataType !== 'BOOLEAN'">
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
                <option v-for="index in stepArray" :key="index" :value="index">{{ index }}</option>
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
    <div v-if="selectedEntityProp" class="columns mb-0 is-multiline">
      <div class="column py-0 is-two-thirds-desktop is-full-tablet">
        <ByValueColorList
          v-if="colorMapping.length"
          v-model="colorMapping"
          :mode="colorMode"
          :presets="colorPickerPresets"
          :min-value="minValue"
          :max-value.sync="currentMaxValue"
          :dataType="selectedEntityProp.data_type"
          @resetValues="resetValues"
          @interpolateMinMax="interpolateMinMax"
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
import { Component, Mixins, Watch } from 'vue-property-decorator';
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
import ColorPalettes, { DEFAULT_COLOR_PALETTES } from './colorPalettes';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import ByValueMixin from '../ByValueMixin';
import { MoviciError } from '@movici-flow-common/errors';

@Component({
  name: 'ColorByValueConfigurator',
  components: {
    ByValueColorList,
    AttributeSelector
  }
})
export default class ColorByValueConfigurator extends Mixins<ByValueMixin<ColorClause>>(
  ByValueMixin
) {
  // overrides ByValueMixin
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  // custom variables
  colorMapping: ColorMapping = [];
  colorPickerPresets = Object.values(MoviciColors);
  fillType: 'buckets' | 'gradient' = 'buckets';
  colorTypes: string[] = Object.keys(DEFAULT_COLOR_PALETTES);
  selectedColorType: keyof typeof DEFAULT_COLOR_PALETTES = 'Sequential';
  selectedColorPaletteIndex = 0;
  currentMaxValue = 1;
  nSteps = 4;
  stepArray: number[] = [2, 3, 4, 5, 6, 7, 8];

  get mappingValues(): number[] {
    return this.colorMapping.map(val => val[0]);
  }

  get colors(): RGBAColor[] {
    return this.colorMapping.map(val => val[1]);
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

  get currentClause(): ByValueColorClause | null {
    if (!this.selectedEntityProp) return null;

    return {
      type: this.fillType,
      attribute: this.selectedEntityProp,
      colors: this.colorMapping,
      maxValue: this.currentMaxValue
    };
  }

  get currentMinValue() {
    return this.mappingValues[0] ?? this.minValue;
  }

  get defaults() {
    return {
      type: 'buckets',
      attribute: null,
      colors: []
    };
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

  updateAttribute(val: PropertySummary | null) {
    /**
     * STATE: TOUCHED DEFINED RESET VALID CLAUSE
     * When the user selects and attribute, this function is fired.
     * We set the selectedEntityProp (aka attribute) with this.ensureProp
     * After that we can reset it to show the default UI config for that
     * data_type, like an ENUM, BOOLEAN, INT or DOUBLE.
     * This state is achivable from both UNTOUCHED NULL CLAUSE and
     * UNTOUCHED DEFINED VALID CLAUSE. After that it only may become
     * TOUCHED INVALID CLAUSE if the user inputs invalid data.
     */

    if (val) {
      this.ensureProp(val);
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
    this.selectedColorType = 'Sequential';
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

  @Watch('selectedColorType')
  afterSelectedColorType() {
    this.selectColorPalette(0);
  }

  resetByDataType(dataType: string) {
    this.resetColorMapping(this.defaultDataTypeSteps);

    switch (dataType) {
      case 'BOOLEAN':
        this.selectedColorType = 'Diverging';
        this.selectedColorPaletteIndex = 0;
        this.fillType = 'buckets';
        this.recalculateColorMapping({
          output: DEFAULT_COLOR_PALETTES['Diverging'][0].getColorTriplesForSize(2),
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

  // TODO: create validator according to color length
  setupValidator() {
    this.validator?.configure({
      validators: {
        ...this.getAttributeValidator()
      },
      onValidate: e => {
        // IF 'e.length > 0'
        // STATE: TOUCHED DEFINED SET INVALID CLAUSE
        this.errors = e;
      }
    });
  }

  mounted() {
    // STATE: READY
    this.setupValidator();

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
    this.pickSelectedEntityProp(localValue.attribute);

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
