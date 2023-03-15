<template>
  <div class="holder">
    <o-field
      class="show-as-buttons"
      v-if="showAs === 'button'"
      :variant="errorMessage && 'danger'"
      :message="errorMessage"
      :label="label"
      required
    >
      <div class="block mb-0">
        <template v-for="(c, idx) in choices">
          <o-tooltip
            :label="$t('flow.visualization.type')[c.geometry]"
            :key="c.geometry"
            variant="black"
            position="top"
            :class="{ 'mr-2': idx !== choices.length - 1 }"
          >
            <o-button
              class="v-info-geometry"
              :class="{'is-active': c.geometry === choice}"
              :disabled="!c.enabled"
              :icon-pack="c.iconPack"
              :icon-left="c.icon"
              @click="choice = c.geometry"
            ></o-button>
          </o-tooltip>
        </template>
      </div>
    </o-field>
    <div
      class="is-flex is-flex-direction-row show-as-radios"
      v-else-if="showAs === 'radio' && validChoices.length > 1"
    >
      <template v-for="c in choices">
        <o-radio
          v-model="choice"
          v-if="c.enabled"
          :key="c.geometry"
          :native-value="c.geometry"
          class="is-flex"
          size="small"
        >
          {{ $t('flow.visualization.type')[c.geometry] }}
        </o-radio>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ComponentProperty, FlowVisualizerType } from '@movici-flow-common/types';
import { isLines, isPoints, isPolygons, isGrid } from '@movici-flow-common/visualizers/geometry';

function validFlowVisualizerType(val: unknown): val is FlowVisualizerType {
  if (typeof val !== 'string') return false;
  return Object.values(FlowVisualizerType).indexOf(val as FlowVisualizerType) !== -1;
}

function validFlowVisualizerTypeOrNull(val: unknown): val is FlowVisualizerType | null {
  if (val === null) return true;
  return validFlowVisualizerType(val);
}

type GeometryChoicesProps = {
  enabled: boolean;
  icon: string;
  iconPack: string;
  geometry: FlowVisualizerType;
};

@Component({ name: 'GeometrySelector' })
export default class GeometrySelector extends Vue {
  @Prop({ type: String }) readonly showAs!: 'button' | 'radio';
  @Prop({ type: String }) readonly label!: string;
  @Prop({ type: Array, default: null }) readonly allowedGeometries!: FlowVisualizerType[] | null;
  @Prop({
    type: String,
    validator(val): boolean {
      return validFlowVisualizerTypeOrNull(val);
    }
  })
  readonly value!: FlowVisualizerType | null;
  @Prop({ type: Array, default: () => [] }) readonly properties!: ComponentProperty[];

  get errorMessage() {
    return this.properties.length && this.noChoice ? this.$t('flow.visualization.noGeometry') : '';
  }

  get choices(): GeometryChoicesProps[] {
    const geometries: Record<FlowVisualizerType, Omit<GeometryChoicesProps, 'geometry'>> = {
      [FlowVisualizerType.POINTS]: {
        enabled: isPoints(this.properties),
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.POINTS
      },
      [FlowVisualizerType.LINES]: {
        enabled: isLines(this.properties),
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.LINES
      },
      [FlowVisualizerType.POLYGONS]: {
        enabled: isPolygons(this.properties),
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.POLYGONS
      },
      [FlowVisualizerType.ARCS]: {
        enabled: isLines(this.properties) && this.showAs === 'button',
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.ARCS
      },
      [FlowVisualizerType.ICONS]: {
        enabled: isPoints(this.properties),
        iconPack: 'far',
        icon: 'map-marker-alt'
      },
      [FlowVisualizerType.FLOODING_GRID]: {
        enabled: isGrid(this.properties),
        iconPack: 'fad',
        icon: 'water'
      },
      [FlowVisualizerType.GRID]: {
        enabled: isGrid(this.properties),
        iconPack: 'far',
        icon: 'game-board-alt'
      }
    };

    return (this.allowedGeometries ?? (Object.keys(geometries) as FlowVisualizerType[])).reduce(
      (choices, geometry) => {
        choices.push({ geometry, ...geometries[geometry] });
        return choices;
      },
      [] as GeometryChoicesProps[]
    );
  }

  get validChoices(): FlowVisualizerType[] {
    return this.choices.filter(c => c.enabled).map(c => c.geometry);
  }

  get choice(): FlowVisualizerType | null {
    return this.value;
  }

  set choice(val: FlowVisualizerType | null) {
    this.$emit('input', val);
  }

  get firstValue(): FlowVisualizerType | null {
    return this.validChoices?.[0] ?? null;
  }

  get noChoice() {
    return this.choices.every(c => !c.enabled);
  }

  @Watch('validChoices')
  setValidValue() {
    if (!this.choice || !this.validChoices.includes(this.choice)) {
      this.choice = this.firstValue;
    }
  }

  mounted() {
    this.setValidValue();
  }
}
</script>
<style scoped lang="scss">
.show-as-buttons {
  .v-info-geometry {
    border: 0.125rem solid transparent;
    opacity: 1 !important;
    background-color: $green-light;
    color: $primary;
    height: 2.25rem;
    width: 2.75rem;
    font-size: 1.25rem;
    &.is-active {
      background-color: $green;
      color: $green-light;
    }
    &[disabled] {
      color: $grey-light;
      background-color: $white-ter;
    }
  }
}
.show-as-radios {
  margin-top: -5px;
}
</style>
