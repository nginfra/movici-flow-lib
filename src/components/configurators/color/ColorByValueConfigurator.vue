<template>
  <ByValueConfigurator
    v-if="selectedAttribute"
    v-model="colorMapping"
    :maxValue.sync="maxValue"
    :selectedAttribute="selectedAttribute"
    :summary="summary"
    :component="component"
    :props="componentProps"
    :strategy="strategy_"
    :label="$t('flow.visualization.colorConfig.colors')"
    :buckets="fillType === 'buckets'"
  >
    <template #options-top="{ mappingHelper }">
      <div class="columns mb-0 is-multiline">
        <div class="column is-full">
          <div>
            <b-field class="fill-type">
              <b-radio
                class="mr-4"
                v-model="fillType"
                v-for="type in ['buckets', 'gradient']"
                :key="type"
                :native-value="type"
                size="is-small"
                :disabled="!isMode(mappingHelper, 'number')"
              >
                {{ $t('flow.visualization.colorConfig')[type] }}
              </b-radio>
            </b-field>
          </div>
        </div>
      </div>
    </template>

    <template #options-side>
      <ColorPaletteSelector v-model="colorPalette" :nSteps="nSteps" />
    </template>

    <template #after-output="{ mappingHelper }">
      <div class="gradient-container is-flex-shrink-1" v-if="isMode(mappingHelper, 'continuous')">
        <div class="gradient" :style="gradientColorStyle"></div>
      </div>
    </template>

    <template #legend-labels="{ placeholders }">
      <slot name="legend-labels" v-bind="{ placeholders }" />
    </template>
  </ByValueConfigurator>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import {
  colorTripleToHex,
  hexToColorTriple,
  MoviciColors
} from '@movici-flow-common/visualizers/maps/colorMaps';
import {
  ByValueColorClause,
  ColorClause,
  ColorMapping,
  PropertySummary,
  RGBAColor
} from '@movici-flow-common/types';
import { MappingStrategy, ValueMappingHelper, MappingMode } from '../shared/ValueMappingHelper';
import ColorPaletteSelector from './ColorPaletteSelector.vue';
import ColorPalette, { DEFAULT_COLOR_PALETTES } from './colorPalettes';
import ByValueMixin from '../ByValueMixin';
import ColorInput from '../../widgets/ColorInput.vue';
import ByValueConfigurator from '../shared/ByValueConfigurator.vue';

export class ColorMappingStrategy extends MappingStrategy<RGBAColor> {
  palette: ColorPalette | null;
  constructor(palette?: ColorPalette | null) {
    super();
    this.palette = palette ?? null;
  }

  protected doRecalculateOutputs(outputs: RGBAColor[], nSteps: number): RGBAColor[] {
    if (this.palette) {
      return this.palette.getColorTriplesForSize(nSteps);
    }
    return super.doRecalculateOutputs(outputs, nSteps);
  }

  defaultStepCount(): number {
    return 4;
  }

  defaultOutput(): RGBAColor {
    return hexToColorTriple(MoviciColors.WHITE);
  }

  setColorPalette(palette: ColorPalette | null) {
    this.palette = palette;
  }
}

@Component({
  name: 'ColorByValueConfigurator',
  components: {
    ColorPaletteSelector,
    ByValueConfigurator
  }
})
export default class ColorByValueConfigurator extends Mixins<ByValueMixin<ColorClause>>(
  ByValueMixin
) {
  @Prop({ type: Object }) declare selectedAttribute: PropertySummary | null;
  @Prop({ type: Object, default: null }) strategy?: ColorMappingStrategy | null;
  colorMapping: ColorMapping = [];
  colorPickerPresets = Object.values(MoviciColors);
  fillType: 'buckets' | 'gradient' = 'buckets';
  maxValue: number | null = null;

  get nSteps() {
    return this.colorMapping.length;
  }

  get currentClause(): ByValueColorClause | null {
    if (!this.selectedAttribute) return null;

    const rv: ByValueColorClause = {
      type: this.fillType,
      attribute: this.selectedAttribute,
      colors: this.colorMapping
    };
    if (this.fillType === 'buckets' && this.maxValue != null) {
      rv.maxValue = this.maxValue;
    }
    return rv;
  }

  get component() {
    return ColorInput;
  }

  get componentProps() {
    return {
      caret: this.fillType === 'gradient'
    };
  }

  get gradientColorStyle() {
    const hexColors = this.colorMapping.map(c => colorTripleToHex(c[1]));
    const gradientString = hexColors.reverse().join();
    return 'background: linear-gradient(' + gradientString + ')';
  }

  get strategy_() {
    return this.strategy ?? new ColorMappingStrategy(DEFAULT_COLOR_PALETTES['Sequential'][0]);
  }

  get colorPalette() {
    return this.strategy_.palette ?? null;
  }

  set colorPalette(palette: ColorPalette | null) {
    this.strategy_.setColorPalette(palette);
    if (palette) {
      const newColors = this.strategy_.recalculateOutputs([], this.colorMapping.length);
      this.colorMapping = this.colorMapping.map(([val], idx) => {
        return [val, newColors[idx]];
      });
    }
  }

  isMode(helper: ValueMappingHelper<unknown>, mode: MappingMode) {
    return helper.modeFlags.includes(mode);
  }

  @Watch('currentClause')
  prepareEmitClause() {
    if (this.currentClause) {
      this.emitClause({ byValue: this.currentClause });
    }
  }

  created() {
    this.fillType = this.value?.byValue?.type ?? 'buckets';

    const clause = this.value?.byValue;
    if (clause) {
      if (clause.colors?.length) {
        this.colorMapping = clause.colors;
      }
      this.maxValue = clause.maxValue ?? null;
    }
  }
}
</script>

<style scoped lang="scss">
.gradient-container {
  margin-right: 5px;
  padding: 11px 0 11px 11px;

  .gradient {
    height: 100%;
    width: 8px;
  }
}
</style>
