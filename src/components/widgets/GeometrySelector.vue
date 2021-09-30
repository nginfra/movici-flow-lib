<template>
  <div class="holder">
    <b-field
      v-if="showAs === 'button'"
      :type="{ 'is-danger': !!errorMessage }"
      :message="errorMessage"
      :label="label"
      required
    >
      <div class="block mb-0">
        <template v-for="c in choices">
          <b-tooltip
            :label="c.geometry | upperFirst"
            :key="c.geometry"
            type="is-black"
            position="is-top"
          >
            <b-button
              class="v-info-geometry"
              :disabled="!c.enabled"
              :icon-pack="c.iconPack"
              :icon-left="c.icon"
              :active="c.geometry === choice"
              @click="choice = c.geometry"
            ></b-button>
          </b-tooltip>
        </template>
      </div>
    </b-field>
    <div class="is-flex is-flex-direction-row" v-else-if="showAs === 'radio'">
      <template v-for="c in choices">
        <b-radio
          class="mt-2 is-flex"
          v-if="validChoices.length > 1 && c.enabled"
          v-model="choice"
          :native-value="c.geometry"
          :key="c.geometry"
          size="is-small"
        >
          {{ c.name }}
        </b-radio>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { FlowVisualizerType, PropertyType } from '@/flow/src/types';
import { isLines, isPoints, isPolygons } from '@/flow/src/visualizers/geometry';

function validFlowVisualizerType(val: unknown): val is FlowVisualizerType {
  if (typeof val !== 'string') return false;
  return Object.values(FlowVisualizerType).indexOf(val as FlowVisualizerType) !== -1;
}

function validFlowVisualizerTypeOrNull(val: unknown): val is FlowVisualizerType | null {
  if (val === null) return true;
  return validFlowVisualizerType(val);
}

@Component({
  name: 'GeometrySelector'
})
export default class GeometrySelector extends Vue {
  @Prop({ type: String }) readonly showAs!: 'button' | 'radio';
  @Prop({ type: String }) readonly label!: string;
  @Prop({
    type: String,
    validator(val): boolean {
      return validFlowVisualizerTypeOrNull(val);
    }
  })
  readonly value!: FlowVisualizerType | null;
  @Prop({ type: Array, default: () => [] }) readonly properties!: PropertyType[];

  get errorMessage() {
    return this.properties.length && this.noChoice ? this.$t('flow.visualization.noGeometry') : '';
  }

  get choices(): {
    geometry: FlowVisualizerType;
    enabled: boolean;
    name: string;
    icon?: string;
    iconPack: string;
  }[] {
    return [
      {
        geometry: FlowVisualizerType.POINTS,
        enabled: isPoints(this.properties),
        name: 'Points',
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.POINTS
      },
      {
        geometry: FlowVisualizerType.LINES,
        enabled: isLines(this.properties),
        name: 'Lines',
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.LINES
      },
      {
        geometry: FlowVisualizerType.POLYGONS,
        enabled: isPolygons(this.properties),
        name: 'Polygons',
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.POLYGONS
      },
      {
        geometry: FlowVisualizerType.ARCS,
        enabled: isLines(this.properties) && this.showAs === 'button',
        name: 'Arcs',
        iconPack: 'fak',
        icon: 'fa-vis-info-' + FlowVisualizerType.ARCS
      }
      // {
      //   geometry: FlowVisualizerType.ICONS,
      //   enabled: isPoints(this.properties),
      //   name: 'Icons',
      //   iconPack: 'far',
      //   icon: 'map-marker-alt'
      // }
    ];
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
.v-info-geometry {
  border: 0.125rem solid transparent;
  opacity: 1 !important;
  background-color: #e8f8f2;
  color: #1ab67e;
  height: 2.25rem;
  width: 2.75rem;
  margin-right: 0.5rem;
  font-size: 1.25rem;

  &:active,
  &.is-active {
    background-color: $green;
    color: $green-light;
  }
  &[disabled] {
    color: $grey-light;
    background-color: $white-ter;
  }
}
</style>
