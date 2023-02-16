<template>
  <div>
    <ByValueConfigurator
      v-model="sizes"
      :selectedAttribute="selectedAttribute"
      :strategy="strategy"
      :summary="summary"
      :component="component"
      :label="header"
    >
      <template #options-side>
        <b-field :label="$t('flow.visualization.displayAs')">
          <b-radio v-model="units" native-value="meters" size="is-small" class="mr-4">
            {{ $t('units.meters') }}
          </b-radio>
          <b-radio v-model="units" native-value="pixels" size="is-small">
            {{ $t('units.pixels') }}
          </b-radio>
        </b-field>
      </template>
    </ByValueConfigurator>
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
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { ByValueSizeClause, FlowVisualizerType, SizeClause } from '@movici-flow-common/types';
import { isPositive } from '@movici-flow-common/utils/FormValidator';
import { pick } from 'lodash';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ByValueMixin from '../ByValueMixin';
import ByValueList from '../shared/ByValueList.vue';
import NumberOutput from '../shared/NumberOutput.vue';
import ByValueConfigurator from '../shared/ByValueConfigurator.vue';
import {
  interpolateMinMax,
  MappingStrategy,
  ValueMapping,
  ValueMappingHelper
} from '../shared/ValueMappingHelper';

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
    ByValueConfigurator
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
    return NumberOutput;
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

  created() {
    this.setupValidator();
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
    if (this.validator) {
      this.destroyValidator();
    }
  }
}
</script>

<style scoped lang="scss">
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
