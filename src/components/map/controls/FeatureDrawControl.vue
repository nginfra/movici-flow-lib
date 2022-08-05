<template>
  <div class="is-flex is-flex-direction-column">
    <span
      v-for="(item, i) in calculatedOptions"
      :key="i"
      class="is-flex is-flex-direction-row draw-options"
    >
      <b-button
        class="is-border-transparent"
        :title="item.title"
        :disabled="!item.enabled()"
        :class="{
          active: isOptionActive(item.id),
          [item.activeColor]: isOptionActive(item.id) && item.enabled(),
          'has-options': item.options,
          first: i === 0,
          last: i === calculatedOptions.length - 1
        }"
        @click="click(item)"
        size="is-small"
        :icon-left="item.icon"
        :icon-pack="item.pack"
      >
      </b-button>
      <span v-if="isOptionActive(item.id) && item.options" class="options">
        <template v-for="(child, j) in item.options">
          <b-button
            class="is-border-transparent"
            :key="j"
            :title="child.title"
            :disabled="!child.enabled()"
            :class="{
              active: isOptionActive(child.id),
              [child.activeColor]: isOptionActive(child.id) && child.enabled(),
              first: j === 0,
              last: j === item.options.length - 1
            }"
            @click="click(child)"
            size="is-small"
            :icon-left="child.icon"
            :icon-pack="child.pack"
          >
          </b-button>
        </template>
      </span>
    </span>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';
import { PickInfo } from '@deck.gl/core/lib/deck';
import {
  ViewMode,
  DrawPolygonMode,
  DrawLineStringMode,
  DrawPointMode,
  TranslateMode,
  TransformMode,
  ModifyMode,
  MeasureDistanceMode,
  MeasureAreaMode,
  MeasureAngleMode,
  EditAction
} from '@nebula.gl/edit-modes';
import { RGBAColor } from '@deck.gl/core';
import {
  CursorCallback,
  MapOnClickCallback,
  FeatureDrawOption,
  NebulaMode
} from '@movici-flow-common/types';
import { sortByKeys } from '@movici-flow-common/utils';

const SELECTED_FEATURE_COLOR_FILL: RGBAColor = [26, 182, 126, 90],
  SELECTED_FEATURE_COLOR: RGBAColor = [26, 182, 126],
  FEATURE_COLOR_FILL: RGBAColor = [85, 113, 242, 90],
  FEATURE_COLOR: RGBAColor = [85, 113, 242],
  WHITE_COLOR: RGBAColor = [255, 255, 255];

const DEFAULT_OPTIONS: { [key: string]: FeatureDrawOption } = {
  'draw-point': {
    id: 'draw-point',
    order: 0,
    title: 'Draw Point',
    icon: 'circle',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'draw',
    nebulaMode: () => new DrawPointMode()
  },
  'draw-linestring': {
    id: 'draw-linestring',
    order: 1,
    title: 'Draw Line',
    icon: 'horizontal-rule',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'draw',
    nebulaMode: () => new DrawLineStringMode()
  },
  'draw-polygon': {
    id: 'draw-polygon',
    order: 2,
    title: 'Draw Polygon',
    icon: 'draw-polygon',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'draw',
    nebulaMode: () => new DrawPolygonMode()
  },
  select: {
    id: 'select',
    order: 3,
    title: 'Select',
    icon: 'hand-pointer',
    activeColor: 'is-primary',
    enabled: () => true
  },
  translate: {
    id: 'translate',
    order: 4,
    title: 'Translate feature',
    icon: 'arrows-alt',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'edit-feature',
    nebulaMode: () => new TranslateMode()
  },
  transform: {
    id: 'transform',
    order: 5,
    title: 'Transform feature',
    icon: 'expand-arrows-alt',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'edit-feature',
    nebulaMode: () => new TransformMode()
  },
  modify: {
    id: 'modify',
    order: 6,
    title: 'Modify feature',
    icon: 'draw-polygon',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'edit-feature',
    nebulaMode: () => new ModifyMode()
  },
  'measure-distance': {
    id: 'measure-distance',
    order: 7,
    title: 'Measure distance',
    icon: 'ruler',
    pack: 'far',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'measure',
    nebulaMode: () => new MeasureDistanceMode(),
    modeConfig: {
      formatTooltip: (distance: string) => parseFloat(distance).toFixed(2) + ' km'
    }
  },
  'measure-area': {
    id: 'measure-area',
    order: 8,
    title: 'Measure area',
    icon: 'ruler-combined',
    pack: 'far',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'measure',
    nebulaMode: () => new MeasureAreaMode(),
    modeConfig: {
      formatTooltip: (area: string) => (parseFloat(area) / 1000).toFixed(2) + ' km^2'
    }
  },
  'measure-angle': {
    id: 'measure-angle',
    order: 9,
    title: 'Measure angle',
    icon: 'drafting-compass',
    activeColor: 'is-primary',
    enabled: () => true,
    container: 'measure',
    nebulaMode: () => new MeasureAngleMode(),
    modeConfig: {
      // formatTooltip: (angle: string) => parseFloat(angle).toFixed(2) + ' deg'
    }
  },
  delete: {
    id: 'delete',
    order: 10,
    title: 'Remove feature',
    icon: 'trash',
    pack: 'far',
    activeColor: 'is-danger',
    enabled: () => true
  }
};

const DEFAULT_OPTION_CONTAINERS: { [key: string]: FeatureDrawOption } = {
  draw: {
    id: 'draw',
    title: 'Draw',
    icon: 'pencil',
    activeColor: 'is-primary',
    enabled: function () {
      return !!this.options?.some(opt => opt.enabled());
    },
    options: []
  },
  'edit-feature': {
    id: 'edit-feature',
    title: 'Edit feature',
    icon: 'edit',
    pack: 'far',
    activeColor: 'is-primary',
    enabled: function () {
      return !!this.options?.some(opt => opt.enabled());
    },
    options: []
  },
  measure: {
    id: 'measure',
    title: 'Measure',
    icon: 'ruler-triangle',
    pack: 'far',
    activeColor: 'is-primary',
    enabled: function () {
      return !!this.options?.some(opt => opt.enabled());
    },
    options: []
  }
};

@Component({ name: 'FeatureDrawControl' })
export default class FeatureDrawControl extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: Feature<Geometry, GeoJsonProperties>[];
  @Prop({ type: Array, default: () => [] }) readonly options!: (
    | Partial<FeatureDrawOption>
    | string
  )[];
  @Prop({ type: String, default: 'geojson-layer' }) readonly layerId!: string;
  @Prop({ type: Function }) readonly setCursorCallback?: (cb: CursorCallback) => void;
  @Prop({ type: Function }) readonly registerMapOn?: (
    event: string,
    callbacks: Record<string, MapOnClickCallback>
  ) => void;
  @Prop({ type: Array, default: () => [] }) readonly selectedFeatureIndexes!: number[];
  nebulaMode: NebulaMode = new ViewMode();
  modeConfig: { [key: string]: unknown } = {};
  activeOption = '';
  activeParent = '';

  get featureCollection(): FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: [...this.value]
    };
  }

  get calculatedOptions(): FeatureDrawOption[] {
    const rv: FeatureDrawOption[] = [];
    // iterate over every item in this.options
    this.options.forEach(opt => {
      //   find the default option and merge with given overrides
      const key = typeof opt === 'string' ? opt : opt.id;
      if (key) {
        const payload =
          typeof opt === 'string' ? DEFAULT_OPTIONS[key] : Object.assign(DEFAULT_OPTIONS[key], opt);
        //   place in an intermediate array
        rv.push(payload);
      } else throw Error('Invalid DeckDraw option');
    });

    // sort the intermediate array by opt.order
    rv.sort(sortByKeys(['+order']));

    const options: FeatureDrawOption[] = [];

    rv.forEach(element => {
      const previousIndex = options.length - 1;

      if (previousIndex === -1) {
        options.push(element);
        return;
      }

      let previousElement = options[previousIndex];
      if (
        element.container === previousElement.container &&
        typeof element.container === 'string'
      ) {
        const container = Object.assign({}, DEFAULT_OPTION_CONTAINERS[element.container], {
          options: [previousElement]
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
  }

  get isDrawing() {
    return (
      this.isOptionActive('draw-polygon') ||
      this.isOptionActive('draw-point') ||
      this.isOptionActive('draw-linestring')
    );
  }

  isOptionActive(id: string) {
    return [this.activeOption, this.activeParent].includes(id);
  }

  @Watch('setCursorCallback', { immediate: true })
  doSetCursorCallback() {
    if (this.setCursorCallback) {
      this.setCursorCallback(({ isHovering }) => {
        let cursor = null;

        if (this.isDrawing) {
          cursor = 'crosshair';
        }

        if (isHovering && this.isOptionActive('translate')) {
          cursor = 'all-scroll';
        }

        return cursor;
      });
    }
  }

  @Watch('registerMapOnClick', { immediate: true })
  doRegisterMapOnClick() {
    this.registerMapOn?.('click', {
      selected: (e: PickInfo<unknown>) => {
        if (!e.layer && !this.isOptionActive('edit-feature')) {
          this.updateSelected([]);
        }
      }
    });
  }

  click(option: FeatureDrawOption) {
    let mode = new ViewMode(),
      modeConfig: { [key: string]: unknown } = {};

    if (!option.options) {
      // is a child
      if (this.activeOption === option.id) {
        this.activeOption = '';
        this.activeParent = '';
      } else {
        this.activeOption = option.id;
        this.activeParent =
          this.calculatedOptions.find(opt => opt.id === option.container)?.id ?? '';

        mode = option.nebulaMode?.() ?? mode;
        modeConfig = option.modeConfig ?? modeConfig;
      }
    } else {
      // is a container
      this.activeOption = '';
      this.activeParent = this.activeParent !== option.id ? option.id : '';
    }

    this.nebulaMode = mode;
    this.modeConfig = modeConfig;
    this.emitFeatureLayer();
  }

  updateSelected(selected: number[]) {
    this.$emit('update:selectedFeatureIndexes', selected);
  }

  @Watch('featureCollection')
  @Watch('selectedFeatureIndexes')
  emitFeatureLayer() {
    this.$emit('featureLayer', [
      new EditableGeoJsonLayer({
        id: this.layerId,
        data: this.featureCollection,
        mode: this.nebulaMode,
        modeConfig: this.modeConfig,
        selectedFeatureIndexes: this.selectedFeatureIndexes,
        onClick: (clicked: PickInfo<unknown>) => {
          if (this.isOptionActive('delete')) {
            this.$emit(
              'input',
              this.value.filter((val, idx) => clicked.index !== idx)
            );
            this.updateSelected([]);
          }

          if (this.isOptionActive('select')) {
            const foundIndex = this.selectedFeatureIndexes.findIndex(id => clicked.index === id);
            if (foundIndex >= 0) {
              this.updateSelected(this.selectedFeatureIndexes.filter(val => clicked.index !== val));
            } else {
              this.updateSelected([...this.selectedFeatureIndexes, clicked.index]);
            }
          }
        },
        onEdit: ({ editType, updatedData }: EditAction<FeatureCollection>) => {
          this.$emit('input', updatedData.features);
          if (editType === 'addFeature') {
            this.nebulaMode = new ViewMode();
            this.activeOption = '';
            this.activeParent = '';
          }
        },
        getFillColor: feature => {
          if (this.selectedFeatureIndexes.some(i => this.value[i] === feature))
            return SELECTED_FEATURE_COLOR_FILL;
          return FEATURE_COLOR_FILL;
        },
        getLineColor: feature => {
          if (this.selectedFeatureIndexes.some(i => this.value[i] === feature))
            return SELECTED_FEATURE_COLOR;
          return FEATURE_COLOR;
        },
        getTentativeFillColor: SELECTED_FEATURE_COLOR_FILL,
        getTentativeLineColor: SELECTED_FEATURE_COLOR,
        getEditHandlePointColor: WHITE_COLOR,
        getEditHandlePointOutlineColor: SELECTED_FEATURE_COLOR
      })
    ]);
  }

  mounted() {
    this.emitFeatureLayer();
    this.$emit('registerMapOn');
  }
}
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
