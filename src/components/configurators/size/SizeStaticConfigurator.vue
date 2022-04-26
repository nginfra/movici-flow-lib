<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column pb-0 is-half-desktop is-full-tablet size">
        <div class="is-flex">
          <b-field class="is-flex-shrink-1" :label="$t('flow.visualization.sizeConfig.size')">
            <b-numberinput
              :value="currentClause.size"
              @input="updateValue({ size: Number($event) })"
              :controls="false"
              size="is-small"
              :min-step="1e-15"
              step="1"
            />
          </b-field>

          <b-field class="is-flex-grow-1 ml-4" :label="$t('flow.visualization.displayAs')">
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
    <div class="columns mb-0 is-multiline" v-if="currentClause.units === 'meters'">
      <div class="column pb-0 is-flex is-half-desktop is-full-tablet min-max-px">
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
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StaticSizeClause, SizeClause, FlowVisualizerType } from '@movici-flow-common/types';
import { DIMENSIONS } from '@movici-flow-common/visualizers/visualizers';

const STATIC_DEFAULT_CONFIG: StaticSizeClause = {
    size: DIMENSIONS.SIZE_MIN_PIXELS,
    units: 'pixels',
    minPixels: DIMENSIONS.SIZE_MIN_PIXELS,
    maxPixels: DIMENSIONS.SIZE_MAX_PIXELS
  },
  STATIC_ICON_DEFAULT_CONFIG: StaticSizeClause = {
    size: DIMENSIONS.ICON_SIZE,
    units: 'pixels',
    minPixels: DIMENSIONS.ICON_SIZE_MIN_PIXELS,
    maxPixels: DIMENSIONS.ICON_SIZE_MAX_PIXELS
  },
  DEFAULT_SIZES = Object.values(FlowVisualizerType).reduce((prev, curr) => {
    prev[curr] = (() => {
      switch (curr) {
        case FlowVisualizerType.ICONS:
          return STATIC_ICON_DEFAULT_CONFIG;
        case FlowVisualizerType.POINTS:
        case FlowVisualizerType.LINES:
        case FlowVisualizerType.POLYGONS:
        case FlowVisualizerType.ARCS:
        default:
          return STATIC_DEFAULT_CONFIG;
      }
    })();

    return prev;
  }, {} as Record<FlowVisualizerType, StaticSizeClause>);

@Component({
  name: 'SizeStaticConfigurator'
})
export default class SizeStaticConfigurator extends Vue {
  @Prop() value!: SizeClause | null;
  @Prop() geometry!: FlowVisualizerType;

  get defaults() {
    return DEFAULT_SIZES[this.geometry];
  }

  updateValue(props: Partial<StaticSizeClause>) {
    const clause = Object.assign({}, this.currentClause, props);
    this.$emit('input', { static: clause });
  }

  get currentClause(): StaticSizeClause {
    return Object.assign({}, this.defaults, this.value?.static);
  }

  // TODO: create validator according to color length
  setupValidator() {}

  mounted() {
    this.updateValue({});
    this.setupValidator();
  }
}
</script>

<style scoped lang="scss">
.size,
.min-max-px {
  ::v-deep {
    .b-numberinput {
      width: 3.5rem;
    }
  }
}
</style>
