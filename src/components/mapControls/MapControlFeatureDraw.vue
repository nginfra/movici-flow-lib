<template>
  <div class="is-flex is-flex-direction-column">
    <span
      v-for="(item, i) in calculatedOptions"
      :key="i"
      class="is-flex is-flex-direction-row draw-options"
    >
      <o-button
        class="is-border-transparent"
        :title="item.title"
        :disabled="!item.enabled()"
        :class="{
          active: isOptionActive(item.id),
          [item.activeColor]: isOptionActive(item.id) && item.enabled(),
          'has-options': item.options,
          first: i === 0,
          last: i === calculatedOptions.length - 1,
        }"
        @click="click(item)"
        size="small"
        :icon-left="item.icon"
        :icon-pack="item.pack"
      />
      <span v-if="isOptionActive(item.id) && item.options" class="options">
        <o-button
          v-for="(child, j) in item.options"
          :key="j"
          class="is-border-transparent"
          :title="child.title"
          :disabled="!child.enabled()"
          :class="{
            active: isOptionActive(child.id),
            [child.activeColor]: isOptionActive(child.id) && child.enabled(),
            first: j === 0,
            last: j === item.options.length - 1,
          }"
          @click="click(child)"
          size="small"
          :icon-left="child.icon"
          :icon-pack="child.pack"
        />
      </span>
    </span>
  </div>
</template>
<script setup lang="ts">
import type { PickInfo } from "@deck.gl/core/lib/deck";
import type {
  CursorCallback,
  DeckEvent,
  DeckEventCallback,
  DeckEventPayload,
  FeatureDrawOption,
  NebulaMode,
  RGBAColor,
} from "@movici-flow-lib/types";
import { sortByKeys } from "@movici-flow-lib/utils";
import {
  DrawLineStringMode,
  DrawPointMode,
  DrawPolygonMode,
  MeasureAngleMode,
  MeasureAreaMode,
  MeasureDistanceMode,
  ModifyMode,
  TransformMode,
  TranslateMode,
  ViewMode,
  type EditAction,
} from "@nebula.gl/edit-modes";
import { EditableGeoJsonLayer } from "@nebula.gl/layers";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import isEqual from "lodash/isEqual";
import { computed, ref, toRaw, watch } from "vue";

const SELECTED_FEATURE_COLOR_FILL: RGBAColor = [26, 182, 126, 90],
  SELECTED_FEATURE_COLOR: RGBAColor = [26, 182, 126],
  FEATURE_COLOR_FILL: RGBAColor = [85, 113, 242, 90],
  FEATURE_COLOR: RGBAColor = [85, 113, 242],
  WHITE_COLOR: RGBAColor = [255, 255, 255];

const DEFAULT_OPTIONS: { [key: string]: FeatureDrawOption } = {
  "draw-point": {
    id: "draw-point",
    order: 0,
    title: "Draw Point",
    icon: "circle",
    activeColor: "is-primary",
    enabled: () => true,
    container: "draw",
    nebulaMode: () => new DrawPointMode(),
  },
  "draw-linestring": {
    id: "draw-linestring",
    order: 1,
    title: "Draw Line",
    icon: "horizontal-rule",
    activeColor: "is-primary",
    enabled: () => true,
    container: "draw",
    nebulaMode: () => new DrawLineStringMode(),
  },
  "draw-polygon": {
    id: "draw-polygon",
    order: 2,
    title: "Draw Polygon",
    icon: "draw-polygon",
    activeColor: "is-primary",
    enabled: () => true,
    container: "draw",
    nebulaMode: () => new DrawPolygonMode(),
  },
  select: {
    id: "select",
    order: 3,
    title: "Select",
    icon: "hand-pointer",
    activeColor: "is-primary",
    enabled: () => true,
  },
  translate: {
    id: "translate",
    order: 4,
    title: "Translate feature",
    icon: "arrows-alt",
    activeColor: "is-primary",
    enabled: () => true,
    container: "edit-feature",
    nebulaMode: () => new TranslateMode(),
  },
  transform: {
    id: "transform",
    order: 5,
    title: "Transform feature",
    icon: "expand-arrows-alt",
    activeColor: "is-primary",
    enabled: () => true,
    container: "edit-feature",
    nebulaMode: () => new TransformMode(),
  },
  modify: {
    id: "modify",
    order: 6,
    title: "Modify feature",
    icon: "draw-polygon",
    activeColor: "is-primary",
    enabled: () => true,
    container: "edit-feature",
    nebulaMode: () => new ModifyMode(),
  },
  "measure-distance": {
    id: "measure-distance",
    order: 7,
    title: "Measure distance",
    icon: "ruler",
    pack: "far",
    activeColor: "is-primary",
    enabled: () => true,
    container: "measure",
    nebulaMode: () => new MeasureDistanceMode(),
    modeConfig: {
      formatTooltip: (distance: string) => parseFloat(distance).toFixed(2) + " km",
    },
  },
  "measure-area": {
    id: "measure-area",
    order: 8,
    title: "Measure area",
    icon: "ruler-combined",
    pack: "far",
    activeColor: "is-primary",
    enabled: () => true,
    container: "measure",
    nebulaMode: () => new MeasureAreaMode(),
    modeConfig: {
      formatTooltip: (area: string) => (parseFloat(area) / 1000).toFixed(2) + " km^2",
    },
  },
  "measure-angle": {
    id: "measure-angle",
    order: 9,
    title: "Measure angle",
    icon: "drafting-compass",
    activeColor: "is-primary",
    enabled: () => true,
    container: "measure",
    nebulaMode: () => new MeasureAngleMode(),
    modeConfig: {
      // formatTooltip: (angle: string) => parseFloat(angle).toFixed(2) + ' deg'
    },
  },
  delete: {
    id: "delete",
    order: 10,
    title: "Remove feature",
    icon: "trash",
    pack: "far",
    activeColor: "is-danger",
    enabled: () => true,
  },
};

const DEFAULT_OPTION_CONTAINERS: { [key: string]: FeatureDrawOption } = {
  draw: {
    id: "draw",
    title: "Draw",
    icon: "pencil",
    activeColor: "is-primary",
    enabled: function () {
      return !!this.options?.some((opt) => opt.enabled());
    },
    options: [],
  },
  "edit-feature": {
    id: "edit-feature",
    title: "Edit feature",
    icon: "edit",
    pack: "far",
    activeColor: "is-primary",
    enabled: function () {
      return !!this.options?.some((opt) => opt.enabled());
    },
    options: [],
  },
  measure: {
    id: "measure",
    title: "Measure",
    icon: "ruler-triangle",
    pack: "far",
    activeColor: "is-primary",
    enabled: function () {
      return !!this.options?.some((opt) => opt.enabled());
    },
    options: [],
  },
};

const props = withDefaults(
  defineProps<{
    modelValue: Feature<Geometry, GeoJsonProperties>[];
    layerId: string;
    options?: (Partial<FeatureDrawOption> | string)[];
    setCursorCallback?: (cb: CursorCallback) => void;
    registerMapOn?: (event: DeckEvent, callbacks: Record<string, DeckEventCallback>) => void;
    selectedFeatureIndexes?: number[];
  }>(),
  {
    options: () => [],
    selectedFeatureIndexes: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:selectedFeatureIndexes", indices: number[]): void;
  (e: "featureLayer", layers: EditableGeoJsonLayer[]): void;
  (e: "update:modelValue", val: Feature<Geometry, GeoJsonProperties>[]): void;
}>();

const featureCollection = computed(() => {
  return {
    type: "FeatureCollection",
    features: [...props.modelValue],
  };
});

const calculatedOptions = computed(() => {
  const rv: FeatureDrawOption[] = [];
  // iterate over every item in this.options
  props.options.forEach((opt) => {
    //   find the default option and merge with given overrides
    const key = typeof opt === "string" ? opt : opt.id;
    if (key) {
      const defaultOpt = DEFAULT_OPTIONS[key]!
      const payload =
        typeof opt === "string" ? defaultOpt : Object.assign(defaultOpt, opt);
      //   place in an intermediate array
      rv.push(payload);
    } else throw Error("Invalid DeckDraw option");
  });

  // sort the intermediate array by opt.order
  rv.sort(sortByKeys(["+order"]));

  const options: FeatureDrawOption[] = [];

  rv.forEach((element) => {
    const previousIndex = options.length - 1;

    if (previousIndex === -1) {
      options.push(element);
      return;
    }

    let previousElement = options[previousIndex]!;
    if (element.container === previousElement.container && typeof element.container === "string") {
      const container = Object.assign({}, DEFAULT_OPTION_CONTAINERS[element.container], {
        options: [previousElement],
      });
      options[previousIndex] = container;
      previousElement = options[previousIndex];
    }

    if (previousElement.options && previousElement.id === element.container) {
      previousElement.options.push(element);
    } else {
      options.push(element);
    }
  });

  return options;
});

const isDrawing = computed(() => {
  return (
    isOptionActive("draw-polygon") ||
    isOptionActive("draw-point") ||
    isOptionActive("draw-linestring")
  );
});

function isOptionActive(id: string) {
  return [activeOption.value, activeParent.value].includes(id);
}

watch(
  () => props.setCursorCallback,
  (set) => {
    set?.(({ isHovering, isDragging }) => {
      if (isDragging) return "grabbing";
      if (isDrawing.value) return "pointer";
      if (isHovering && isOptionActive("translate")) return "all-scroll";
      return null;
    });
  },
  { immediate: true }
);

watch(
  () => props.registerMapOn,
  (register) => {
    register?.("click", {
      selected: (opts: DeckEventPayload<unknown>) => {
        if (!opts.layer && !isOptionActive("edit-feature")) {
          updateSelected([]);
        }
      },
    });
  },
  { immediate: true }
);

function updateSelected(selected: number[]) {
  emit("update:selectedFeatureIndexes", selected);
}

const nebulaMode = ref<NebulaMode>(new ViewMode());
const modeConfig = ref<Record<string, unknown>>({});
const activeOption = ref("");
const activeParent = ref("");

function click(option: FeatureDrawOption) {
  let mode = new ViewMode(),
    config: Record<string, unknown> = {};

  if (!option.options) {
    // is a child
    if (activeOption.value === option.id) {
      activeOption.value = "";
      activeParent.value = "";
    } else {
      activeOption.value = option.id;
      activeParent.value =
        calculatedOptions.value.find((opt) => opt.id === option.container)?.id ?? "";

      mode = option.nebulaMode?.() ?? mode;
      config = option.modeConfig ?? config;
    }
  } else {
    // is a container
    activeOption.value = "";
    activeParent.value = activeParent.value !== option.id ? option.id : "";
  }

  nebulaMode.value = mode;
  modeConfig.value = config;
  emitFeatureLayer();
}

function emitFeatureLayer() {
  emit(
    "featureLayer",

    toRaw([
      new EditableGeoJsonLayer({
        id: toRaw(props.layerId),
        data: featureCollection.value,
        mode: nebulaMode.value,
        modeConfig: modeConfig.value,
        selectedFeatureIndexes: props.selectedFeatureIndexes,
        onClick: (clicked: PickInfo<unknown>) => {
          if (isOptionActive("delete")) {
            emit(
              "update:modelValue",
              props.modelValue.filter((_, idx) => clicked.index !== idx)
            );
            updateSelected([]);
          }

          if (isOptionActive("select")) {
            const foundIndex = props.selectedFeatureIndexes.findIndex(
              (idx) => clicked.index === idx
            );
            if (foundIndex >= 0) {
              updateSelected(props.selectedFeatureIndexes.filter((val) => clicked.index !== val));
            } else {
              updateSelected([...props.selectedFeatureIndexes, clicked.index]);
            }
          }
          // stop event propagation
          return true;
        },
        onEdit: ({ editType, updatedData }: EditAction<FeatureCollection>) => {
          emit("update:modelValue", updatedData.features);
          if (editType === "addFeature") {
            nebulaMode.value = new ViewMode();
            activeOption.value = "";
            activeParent.value = "";
          }
        },
        getFillColor: (feature) => {
          return props.selectedFeatureIndexes.some((i) => isEqual(props.modelValue[i], feature))
            ? SELECTED_FEATURE_COLOR_FILL
            : FEATURE_COLOR_FILL;
        },
        getLineColor: (feature) => {
          return props.selectedFeatureIndexes.some((i) => isEqual(props.modelValue[i], feature))
            ? SELECTED_FEATURE_COLOR
            : FEATURE_COLOR;
        },
        getTentativeFillColor: SELECTED_FEATURE_COLOR_FILL,
        getTentativeLineColor: SELECTED_FEATURE_COLOR,
        getEditHandlePointColor: WHITE_COLOR,
        getEditHandlePointOutlineColor: SELECTED_FEATURE_COLOR,
      }),
    ])
  );
}
watch(() => [featureCollection.value, props.selectedFeatureIndexes], emitFeatureLayer);
emitFeatureLayer();
</script>
<style scoped lang="scss">
.draw-options {
  & > .button {
    border-radius: 0 !important;
    &.first {
      border-top-right-radius: 4px !important;
      border-top-left-radius: 4px !important;
      &.active.has-options {
        border-top-right-radius: 0px !important;
      }
    }
    &.last {
      border-bottom-right-radius: 4px !important;
      border-bottom-left-radius: 4px !important;
      &.active.has-options {
        border-bottom-right-radius: 0px !important;
      }
    }
  }
  & > .options {
    & > .button {
      border-radius: 0 !important;
      &.last {
        border-bottom-left-radius: 0px !important;
        border-top-left-radius: 0px !important;
        border-bottom-right-radius: 4px !important;
        border-top-right-radius: 4px !important;
      }
    }
  }
}
</style>
