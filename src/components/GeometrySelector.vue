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
        <o-tooltip
          v-for="(c, idx) in choices"
          :key="c.geometry"
          :label="$t(`flow.visualization.type.${c.geometry}`)"
          variant="black"
          position="top"
          :class="{ 'mr-2': idx !== choices.length - 1 }"
        >
          <o-button
            class="v-info-geometry"
            :class="{ 'is-active': c.geometry === choice }"
            :disabled="!c.enabled"
            :icon-pack="c.iconPack"
            :icon-left="c.icon"
            @click="choice = c.geometry"
          ></o-button>
        </o-tooltip>
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
          {{ $t(`flow.visualization.type.${c.geometry}`) }}
        </o-radio>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type DataAttribute, FlowVisualizerType } from "@movici-flow-lib/types";
import { isGrid, isLines, isPoints, isPolygons } from "@movici-flow-lib/visualizers/geometry";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

type GeometryChoicesProps = {
  enabled: boolean;
  icon: string;
  iconPack: string;
  geometry: FlowVisualizerType;
};

const props = defineProps<{
  modelValue?: FlowVisualizerType;
  showAs: "button" | "radio";
  label?: string;
  allowedGeometries?: FlowVisualizerType[];
  attributes?: DataAttribute[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val?: FlowVisualizerType): void;
}>();

const choices = computed(() => {
  const geometries: Record<FlowVisualizerType, Omit<GeometryChoicesProps, "geometry">> = {
    [FlowVisualizerType.POINTS]: {
      enabled: !!props.attributes && isPoints(props.attributes),
      iconPack: "fak",
      icon: "fa-vis-info-" + FlowVisualizerType.POINTS,
    },
    [FlowVisualizerType.LINES]: {
      enabled: !!props.attributes && isLines(props.attributes),
      iconPack: "fak",
      icon: "fa-vis-info-" + FlowVisualizerType.LINES,
    },
    [FlowVisualizerType.POLYGONS]: {
      enabled: !!props.attributes && isPolygons(props.attributes),
      iconPack: "fak",
      icon: "fa-vis-info-" + FlowVisualizerType.POLYGONS,
    },
    [FlowVisualizerType.ARCS]: {
      enabled: !!props.attributes && isLines(props.attributes) && props.showAs === "button",
      iconPack: "fak",
      icon: "fa-vis-info-" + FlowVisualizerType.ARCS,
    },
    [FlowVisualizerType.ICONS]: {
      enabled: !!props.attributes && isPoints(props.attributes),
      iconPack: "far",
      icon: "map-marker-alt",
    },
    [FlowVisualizerType.FLOODING_GRID]: {
      enabled: !!props.attributes && isGrid(props.attributes),
      iconPack: "fad",
      icon: "water",
    },
    [FlowVisualizerType.GRID]: {
      enabled: !!props.attributes && isGrid(props.attributes),
      iconPack: "far",
      icon: "game-board-alt",
    },
  };
  return (props.allowedGeometries ?? (Object.keys(geometries) as FlowVisualizerType[])).reduce(
    (choices, geometry) => {
      choices.push({ geometry, ...geometries[geometry] });
      return choices;
    },
    [] as GeometryChoicesProps[]
  );
});
const choice = computed({
  get: () => props.modelValue,
  set: (val?: FlowVisualizerType) => {
    emit("update:modelValue", val);
  },
});
const noChoice = computed(() => choices.value.every((c) => !c.enabled));
const validChoices = computed(() => choices.value.filter((c) => c.enabled).map((c) => c.geometry));
watch(
  validChoices,
  () => {
    if (props.attributes && (!props.modelValue || !validChoices.value.includes(props.modelValue))) {
      choice.value = validChoices.value?.[0];
    }
  },
  { immediate: true }
);

const errorMessage = computed(() =>
  props.attributes && noChoice.value ? t("flow.visualization.noGeometry") : ""
);
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
