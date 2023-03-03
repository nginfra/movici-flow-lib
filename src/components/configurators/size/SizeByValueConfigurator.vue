<template>
  <div>
    <ByValueConfigurator
      v-model="sizes"
      :selectedAttribute="selectedAttribute"
      :strategy="strategy"
      :summary="summary"
      :component="component"
      :props="componentProps"
      :label="header"
    >
      <template #options-side>
        <o-field :label="$t('flow.visualization.displayAs')">
          <o-radio v-model="units" native-value="meters" size="small" class="mr-4">
            {{ $t('units.meters') }}
          </o-radio>
          <o-radio v-model="units" native-value="pixels" size="small">
            {{ $t('units.pixels') }}
          </o-radio>
        </o-field>
      </template>
    </ByValueConfigurator>
    <MinMaxPixels
      v-if="currentClause.units === 'meters'"
      :minPixels.sync="minPixels"
      :maxPixels.sync="maxPixels"
      :units="currentClause.units"
      :validator="minMaxPixelsValidator"
    />
  </div>
</template>

<script lang="ts">
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { ByValueSizeClause, FlowVisualizerType, SizeClause } from '@movici-flow-common/types';
import { pick } from 'lodash';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ByValueMixin from '../ByValueMixin';
import ByValueConfigurator from '../shared/ByValueConfigurator.vue';
import ByValueList from '../shared/ByValueList.vue';
import {
  interpolateMinMax,
  MappingStrategy,
  ValueMapping,
  ValueMappingHelper
} from '../shared/ValueMappingHelper';
import MinMaxPixels from './MinMaxPixels.vue';

class SizeMappingStrategy extends MappingStrategy<number> {
  geometry: FlowVisualizerType;

  constructor(geometry: FlowVisualizerType) {
    super();
    this.geometry = geometry;
  }
  protected doRecalculateOutputs(outputs: number[], nSteps: number): number[] {
    const first = outputs[0] ?? this.defaultOutput();
    const last = outputs[outputs.length - 1] ?? this.defaultOutput();
    return interpolateMinMax(first, last, nSteps, true);
  }

  defaultMapping(mapping: ValueMapping<number>, helper: ValueMappingHelper<number>) {
    return helper.recalculateMapping({
      mapping: [
        [0, this.defaultOutput()],
        [1, this.defaultOutput() * 2]
      ],
      nSteps: this.defaultStepCount(),
      resetMinMax: true
    });
  }
  defaultStepCount(): number {
    return 2;
  }
  private defaults(): { size: number; minPixels: number; maxPixels: number } {
    switch (this.geometry) {
      case FlowVisualizerType.ICONS:
        return {
          size: 20,
          minPixels: 5,
          maxPixels: 100
        };
      case FlowVisualizerType.POINTS:
      case FlowVisualizerType.LINES:
      case FlowVisualizerType.POLYGONS:
      case FlowVisualizerType.ARCS:
      case FlowVisualizerType.GRID:
      default:
        return {
          size: 5,
          minPixels: 2,
          maxPixels: 20
        };
    }
  }
  defaultOutput(): number {
    return this.defaults().size;
  }

  minPixels(): number {
    return this.defaults().minPixels;
  }
  maxPixels(): number {
    return this.defaults().maxPixels;
  }
}

@Component({
  name: 'SizeByValueConfigurator',
  components: {
    AttributeSelector,
    ByValueList,
    ByValueConfigurator,
    MinMaxPixels
  }
})
export default class SizeByValueConfigurator extends Mixins<ByValueMixin<SizeClause>>(
  ByValueMixin
) {
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  sizes: [number, number][] = [];
  units: 'pixels' | 'meters' = 'pixels';
  minPixels: number | null = null;
  maxPixels: number | null = null;

  get strategy() {
    return new SizeMappingStrategy(this.geometry);
  }

  get minMaxPixelsValidator() {
    return this.validator?.child('minMaxPixels');
  }

  get currentClause(): ByValueSizeClause | null {
    if (!this.selectedAttribute) return null;

    const rv: ByValueSizeClause = {
      attribute: this.selectedAttribute,
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

  get minMaxPixelErrors() {
    return pick(this.errors, 'minPixels', 'maxPixels', 'minMaxPixels');
  }
  get header() {
    return `${this.$t('flow.visualization.sizeConfig.size')} (${this.miniUnits})`;
  }

  get component() {
    return 'MovNumberinput';
  }
  get componentProps() {
    return {
      size: 'small'
    };
  }
  get miniUnits() {
    switch (this.units) {
      case 'meters':
        return 'm';
      case 'pixels':
        return 'px';
      default:
        return '';
    }
  }

  @Watch('currentClause')
  prepareEmitClause() {
    if (this.currentClause) {
      this.emitClause({ byValue: this.currentClause });
    }
  }

  created() {
    const clause = Object.assign(
      {
        units: 'pixels',
        sizes: [],
        minPixels: this.strategy.minPixels(),
        maxPixels: this.strategy.maxPixels()
      },
      this.value?.byValue
    );
    this.sizes = clause.sizes;
    this.units = clause.units;
    this.minPixels = clause.minPixels;
    this.maxPixels = clause.maxPixels;
  }

  beforeDestroy() {
    this.destroyValidator();
  }
}
</script>

<style scoped lang="scss"></style>
